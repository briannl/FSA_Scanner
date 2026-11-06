import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeBarcode,
  isValidBarcodeString,
  detectBarcodeFormat,
  verifyModulo10CheckDigit
} from "../src/utils/barcodeUtils";
import {
  determineFsaEligibility,
  buildScannedProduct
} from "../src/services/FSAEligibilityEngine";
import { ProductLookupService } from "../src/services/ProductLookupService";
import { ScanHistoryService } from "../src/services/ScanHistoryService";

describe("Barcode Normalization & Format Utilities", () => {
  it("strictly preserves leading zeros in UPC-A, EAN-13, and EAN-8", () => {
    expect(normalizeBarcode("050428456123")).toBe("050428456123");
    expect(normalizeBarcode("00609384")).toBe("00609384");
    expect(normalizeBarcode("0004126038104")).toBe("0004126038104");
  });

  it("trims whitespace and hyphens from barcode strings", () => {
    expect(normalizeBarcode(" 050428-456123 ")).toBe("050428456123");
    expect(normalizeBarcode("0-12345-67890-5")).toBe("012345678905");
  });

  it("validates digit format and lengths", () => {
    expect(isValidBarcodeString("050428456123")).toBe(true);
    expect(isValidBarcodeString("00609384")).toBe(true);
    expect(isValidBarcodeString("12345")).toBe(false); // too short
    expect(isValidBarcodeString("050428abc123")).toBe(false); // non-digits
  });

  it("detects UPC-A, EAN-13, and EAN-8 formats", () => {
    expect(detectBarcodeFormat("00609384")).toBe("EAN-8");
    expect(detectBarcodeFormat("050428456123")).toBe("UPC-A");
    expect(detectBarcodeFormat("0004126038104")).toBe("EAN-13");
  });

  it("computes and verifies standard modulo-10 check digits", () => {
    // Valid UPC-A: 036000291452
    // 0 + 6 + 0 + 2 + 1 + 5 = 14 * 3 = 42
    // 3 + 0 + 0 + 9 + 4 = 16
    // 42 + 16 = 58; 60 - 58 = 2
    expect(verifyModulo10CheckDigit("036000291452")).toBe(true);
    expect(verifyModulo10CheckDigit("036000291459")).toBe(false);
  });
});

describe("FSA Eligibility Rules Engine for In-Store Scanning", () => {
  it("determines Verified eligible for recognized medical diagnostic devices", () => {
    const result = determineFsaEligibility({
      barcode: "050428456123",
      name: "CVS Health Rapid Response Blood Pressure Monitor, Upper Arm"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.category).toBe("Diagnostics & Monitoring");
    expect(result.documentationRequired).toContain("None (OTC Item per CARES Act)");
    expect(result.matchingDeal).not.toBeNull();
  });

  it("determines Verified eligible for CARES Act OTC pain relievers (Advil)", () => {
    const result = determineFsaEligibility({
      barcode: "305730164402",
      name: "Advil 200mg Ibuprofen 100 ct"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.category).toBe("Pain Relief");
    expect(result.explanation).toContain("CARES Act");
  });

  it("determines Verified eligible for broad-spectrum sunscreen SPF 15+", () => {
    const result = determineFsaEligibility({
      barcode: "070501055304",
      name: "Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 70"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.category).toBe("Skin & Sun Care");
    expect(result.explanation).toContain("IRS Notice 2011-43");
  });

  it("determines Likely eligible — verify for unlisted barcodes matching active ingredients", () => {
    const result = determineFsaEligibility({
      barcode: "999999999999", // Unregistered UPC
      name: "Generic Store Brand Ibuprofen 200mg Tablets",
      category: "Pain Relief",
      ingredientsText: "Active ingredient: Ibuprofen 200 mg"
    });

    expect(result.status).toBe("Likely eligible — verify");
    expect(result.explanation).toContain("Ibuprofen");
    expect(result.evidenceNote).toContain("Category-level pattern match");
  });

  it("determines Requires documentation for dual-purpose vitamins and supplements", () => {
    const result = determineFsaEligibility({
      barcode: "031604012345",
      name: "Nature Made Multi for Her Multivitamin Tablets"
    });

    expect(result.status).toBe("Requires documentation");
    expect(result.documentationRequired).toBe("Letter of Medical Necessity (LMN)");
    expect(result.explanation).toContain("Letter of Medical Necessity");
  });

  it("determines Not eligible for general grocery food items (Doritos)", () => {
    const result = determineFsaEligibility({
      barcode: "028400090858",
      name: "Doritos Nacho Cheese Flavored Tortilla Chips"
    });

    expect(result.status).toBe("Not eligible");
    expect(result.explanation).toContain("IRS Section 213(d)");
  });

  it("determines Not eligible for ordinary cosmetic toothpaste (Colgate)", () => {
    const result = determineFsaEligibility({
      barcode: "035000456123",
      name: "Colgate Total Clean Mint Toothpaste"
    });

    expect(result.status).toBe("Not eligible");
    expect(result.explanation).toContain("hygiene");
  });

  it("returns Unable to verify when barcode is unknown and no product details exist", () => {
    const result = determineFsaEligibility({
      barcode: "888888888888",
      name: ""
    });

    expect(result.status).toBe("Unable to verify");
    expect(result.explanation).toContain("could not be identified");
  });

  it("never treats an unidentified product as ineligible", () => {
    const result = determineFsaEligibility({
      barcode: "777777777777"
    });

    expect(result.status).not.toBe("Not eligible");
    expect(result.status).toBe("Unable to verify");
  });

  it("builds a complete ScannedProduct with proper timestamps and matching deals", () => {
    const scanned = buildScannedProduct({
      barcode: "050428456123",
      storeName: "CVS",
      price: 44.99
    });

    expect(scanned.barcode).toBe("050428456123");
    expect(scanned.barcodeType).toBe("UPC-A");
    expect(scanned.eligibilityStatus).toBe("Verified eligible");
    expect(scanned.storeName).toBe("CVS");
    expect(scanned.price).toBe(44.99);
    expect(scanned.matchingDeal?.retailer).toBe("CVS");
  });
});

describe("Product Lookup Service & Local Caching", () => {
  beforeEach(() => {
    ProductLookupService.clearCache();
  });

  it("retrieves curated products instantly from local registry", async () => {
    const result = await ProductLookupService.lookupByBarcode("050428456123");
    expect(result).not.toBeNull();
    expect(result?.name).toContain("Blood Pressure Monitor");
    expect(result?.brand).toBe("CVS Health");
    expect(result?.source).toBe("local_catalog");
  });

  it("serves subsequent requests from cache", async () => {
    const first = await ProductLookupService.lookupByBarcode("305730164402");
    expect(first?.source).toBe("local_catalog");

    const second = await ProductLookupService.lookupByBarcode("305730164402");
    expect(second?.source).toBe("cache");
    expect(second?.name).toBe(first?.name);
  });

  it("returns null for completely unrecognized barcodes without fabricating", async () => {
    const result = await ProductLookupService.lookupByBarcode("999999000001");
    // Should be null, never a fabricated fake product
    expect(result).toBeNull();
  });
});

describe("Scan History Service & Local Storage", () => {
  beforeEach(() => {
    ScanHistoryService.clearHistory();
  });

  it("records scanned items and tracks favorites", () => {
    const product = buildScannedProduct({
      barcode: "050428456123",
      storeName: "CVS Pharmacy",
      price: 44.99
    });

    const item = ScanHistoryService.addToHistory(product);
    expect(item.barcode).toBe("050428456123");
    expect(ScanHistoryService.getHistory().length).toBe(1);

    // Toggle favorite
    const isFav = ScanHistoryService.toggleFavorite(product.id);
    expect(isFav).toBe(true);
    expect(ScanHistoryService.getSaved().length).toBe(1);

    // Toggle favorite off
    const isFavOff = ScanHistoryService.toggleFavorite(product.id);
    expect(isFavOff).toBe(false);
    expect(ScanHistoryService.getSaved().length).toBe(0);
  });

  it("updates store name and price for an item in history", () => {
    const product = buildScannedProduct({
      barcode: "353100201445"
    });

    ScanHistoryService.addToHistory(product);
    ScanHistoryService.updateItem(product.id, {
      storeName: "Costco Wholesale",
      price: 21.99
    });

    const history = ScanHistoryService.getHistory();
    expect(history[0].storeName).toBe("Costco Wholesale");
    expect(history[0].price).toBe(21.99);
  });

  it("deletes single items and clears history", () => {
    const p1 = buildScannedProduct({ barcode: "050428456123" });
    const p2 = buildScannedProduct({ barcode: "305730164402" });

    ScanHistoryService.addToHistory(p1);
    ScanHistoryService.addToHistory(p2);
    expect(ScanHistoryService.getHistory().length).toBe(2);

    ScanHistoryService.deleteItem(p1.id);
    expect(ScanHistoryService.getHistory().length).toBe(1);
    expect(ScanHistoryService.getHistory()[0].barcode).toBe("305730164402");

    ScanHistoryService.clearHistory();
    expect(ScanHistoryService.getHistory().length).toBe(0);
  });
});
