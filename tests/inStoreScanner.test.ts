import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeBarcode,
  isValidBarcodeString,
  detectBarcodeFormat,
  verifyModulo10CheckDigit,
  getBarcodeVariants
} from "../src/utils/barcodeUtils";
import {
  determineFsaEligibility,
  buildScannedProduct
} from "../src/services/FSAEligibilityEngine";
import { CURATED_BARCODE_DATABASE } from "../src/data/barcodeCatalog";
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
    expect(verifyModulo10CheckDigit("036000291452")).toBe(true);
    expect(verifyModulo10CheckDigit("036000291459")).toBe(false);
  });

  it("generates cross-format barcode variants for seamless UPC/EAN/GTIN matching", () => {
    const eanVariants = getBarcodeVariants("3606000577138");
    expect(eanVariants).toContain("3606000577138");
    expect(eanVariants).toContain("03606000577138");

    const gtinVariants = getBarcodeVariants("03606000577138");
    expect(gtinVariants).toContain("03606000577138");
    expect(gtinVariants).toContain("3606000577138");

    const upcVariants = getBarcodeVariants("050428456123");
    expect(upcVariants).toContain("050428456123");
    expect(upcVariants).toContain("0050428456123");
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

describe("FSA Eligibility — Verified False Negative & OTC Acne Suite", () => {
  it("resolves CeraVe Acne Control Cleanser 8 oz (EAN-13: 3606000577138) as Verified eligible", () => {
    const result = determineFsaEligibility({
      barcode: "3606000577138",
      name: "CeraVe Acne Control Cleanser with 2% Salicylic Acid, 8 oz"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.category).toBe("Skin & Sun Care");
    expect(result.medicalCategory).toBe("OTC Acne Treatments");
    expect(result.documentationRequired).toBe("Detailed receipt");
    expect(result.activeIngredient).toBe("2% Salicylic Acid");
    expect(result.purpose).toBe("Acne treatment");
    expect(result.evidenceUrl).toBe("https://fsastore.com/cerave-acne-control-cleanser-8-oz./32415.html");
  });

  it("resolves CeraVe Acne Control Cleanser 8 oz via GTIN-14 padded barcode (03606000577138)", () => {
    const result = determineFsaEligibility({
      barcode: "03606000577138"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.medicalCategory).toBe("OTC Acne Treatments");
    expect(result.documentationRequired).toBe("Detailed receipt");
  });

  it("resolves CeraVe Acne Control Cleanser 16 oz (EAN-13: 3606000608405) as Verified eligible", () => {
    const result = determineFsaEligibility({
      barcode: "3606000608405",
      name: "CeraVe Acne Control Cleanser with 2% Salicylic Acid, 16 oz"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.category).toBe("Skin & Sun Care");
    expect(result.medicalCategory).toBe("OTC Acne Treatments");
    expect(result.documentationRequired).toBe("Detailed receipt");
    expect(result.activeIngredient).toBe("2% Salicylic Acid");
    expect(result.purpose).toBe("Acne treatment");
    expect(result.evidenceUrl).toBe("https://fsastore.com/cerave-acne-control-cleanser-16-oz./40551.html");
  });

  it("resolves CeraVe Acne Control Cleanser 16 oz via GTIN-14 padded barcode (03606000608405)", () => {
    const result = determineFsaEligibility({
      barcode: "03606000608405"
    });

    expect(result.status).toBe("Verified eligible");
    expect(result.medicalCategory).toBe("OTC Acne Treatments");
  });

  it("resolves PanOxyl 10% Benzoyl Peroxide and Differin Adapalene as Verified eligible", () => {
    const panoxyl = determineFsaEligibility({ barcode: "018754500173" });
    expect(panoxyl.status).toBe("Verified eligible");
    expect(panoxyl.medicalCategory).toBe("OTC Acne Treatments");
    expect(panoxyl.activeIngredient).toBe("10% Benzoyl Peroxide");
    expect(panoxyl.documentationRequired).toBe("Detailed receipt");

    const differin = determineFsaEligibility({ barcode: "302994111006" });
    expect(differin.status).toBe("Verified eligible");
    expect(differin.medicalCategory).toBe("OTC Acne Treatments");
    expect(differin.activeIngredient).toBe("0.1% Adapalene");
    expect(differin.documentationRequired).toBe("Detailed receipt");
  });

  it("classifies unlisted generic salicylic acid acne cleanser as Likely eligible with Detailed receipt", () => {
    const result = determineFsaEligibility({
      barcode: "987654321099", // Unregistered UPC
      name: "Store Brand Medicated Acne Cleanser with 2% Salicylic Acid",
      category: "Skin & Sun Care"
    });

    expect(result.status).toBe("Likely eligible — verify");
    expect(result.category).toBe("Skin & Sun Care");
    expect(result.medicalCategory).toBe("OTC Acne Treatments");
    expect(result.activeIngredient).toBe("2% Salicylic Acid");
    expect(result.documentationRequired).toBe("Detailed receipt");
    expect(result.purpose).toBe("Acne treatment");
  });

  it("classifies unlisted generic benzoyl peroxide wash as Likely eligible with Detailed receipt", () => {
    const result = determineFsaEligibility({
      barcode: "987654321088",
      name: "Acne Foaming Wash 10% Benzoyl Peroxide Antimicrobial Cleanser"
    });

    expect(result.status).toBe("Likely eligible — verify");
    expect(result.medicalCategory).toBe("OTC Acne Treatments");
    expect(result.activeIngredient).toBe("10% Benzoyl Peroxide");
    expect(result.documentationRequired).toBe("Detailed receipt");
  });

  it("strictly classifies ordinary cosmetic cleanser (CeraVe Hydrating Facial Cleanser) as Not eligible", () => {
    const result = determineFsaEligibility({
      barcode: "3606000537446",
      name: "CeraVe Hydrating Facial Cleanser for Normal to Dry Skin, 16 oz"
    });

    expect(result.status).toBe("Not eligible");
    expect(result.medicalCategory).toBe("Cosmetic Skincare");
    expect(result.explanation).toContain("IRS Section 213(d)");
  });

  it("classifies unlisted cosmetic face washes and anti-aging creams as Not eligible", () => {
    const cosmetic = determineFsaEligibility({
      barcode: "999888777666",
      name: "Gentle Hydrating Cleanser Daily Face Wash"
    });

    expect(cosmetic.status).toBe("Not eligible");
    expect(cosmetic.medicalCategory).toBe("Cosmetic Skincare");
    expect(cosmetic.explanation).toContain("Non-medicated cosmetic cleansers");
  });

  it("provides Tier 4 explicit missing-information diagnosis for ambiguous skincare products", () => {
    const result = determineFsaEligibility({
      barcode: "999111222333",
      name: "CeraVe Cleanser" // Ambiguous: no active ingredient specified
    });

    expect(result.status).toBe("Unable to verify");
    expect(result.explanation).toContain("Missing active drug ingredient or NDC record");
    expect(result.explanation).toContain("detailed receipt or drug facts label is required");
    expect(result.documentationRequired).toBe("Detailed receipt");
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

  it("retrieves CeraVe Acne Control Cleanser seamlessly across EAN-13 and GTIN-14 formats", async () => {
    const eanResult = await ProductLookupService.lookupByBarcode("3606000577138");
    expect(eanResult).not.toBeNull();
    expect(eanResult?.name).toContain("CeraVe Acne Control Cleanser");
    expect(eanResult?.brand).toBe("CeraVe");

    const gtinResult = await ProductLookupService.lookupByBarcode("03606000577138");
    expect(gtinResult).not.toBeNull();
    expect(gtinResult?.name).toContain("CeraVe Acne Control Cleanser");

    const size16Result = await ProductLookupService.lookupByBarcode("3606000608405");
    expect(size16Result).not.toBeNull();
    expect(size16Result?.name).toContain("16 oz");
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

  it("supports user flagging of incorrect results with custom evidence notes", () => {
    const product = buildScannedProduct({
      barcode: "3606000577138",
      name: "CeraVe Acne Control Cleanser"
    });

    ScanHistoryService.addToHistory(product);
    ScanHistoryService.flagResult(product.id, "FSA Store verified link: https://fsastore.com/cerave-acne-control-cleanser-8-oz./32415.html");

    const history = ScanHistoryService.getHistory();
    expect(history[0].flaggedIncorrect).toBe(true);
    expect(history[0].userEvidenceNote).toContain("fsastore.com");
  });

  it("fail-safe direct resolution instantly identifies CeraVe 16 oz without manual identification fallback", () => {
    const rawBarcode = "3606000608405";
    const variants = getBarcodeVariants(rawBarcode);
    let curatedEntry = null;
    for (const v of variants) {
      if (CURATED_BARCODE_DATABASE[v]) {
        curatedEntry = CURATED_BARCODE_DATABASE[v];
        break;
      }
    }

    expect(curatedEntry).not.toBeNull();
    expect(curatedEntry?.name).toBe("CeraVe Acne Control Cleanser with 2% Salicylic Acid, 16 oz");
    expect(curatedEntry?.brand).toBe("CeraVe");
    expect(curatedEntry?.category).toBe("Skin & Sun Care");

    const scanned = buildScannedProduct({
      barcode: rawBarcode,
      name: curatedEntry!.name,
      brand: curatedEntry!.brand,
      category: curatedEntry!.category,
      imageUrl: curatedEntry!.imageUrl
    });

    expect(scanned.eligibilityStatus).toBe("Verified eligible");
    expect(scanned.medicalCategory).toBe("OTC Acne Treatments");
    expect(scanned.documentationRequired).toBe("Detailed receipt");
    expect(scanned.activeIngredient).toBe("2% Salicylic Acid");
  });
});
