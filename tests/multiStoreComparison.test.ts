import { describe, it, expect } from "vitest";
import {
  groupProductsAcrossRetailers,
  parseUnitPriceValue
} from "../src/services/productMatcher";
import { SEED_PRODUCTS } from "../src/data/seedData";

describe("Phase 5: Multi-Store Comparison Engine", () => {
  it("groups identical products across multiple retailers (Costco, Ralphs, Amazon, Instacart)", () => {
    const groups = groupProductsAcrossRetailers(SEED_PRODUCTS);
    expect(groups.length).toBeGreaterThan(0);

    // Find the Kirkland Signature Aller-Tec group
    const allerTecGroup = groups.find((g) => g.id === "grp-aller-tec");
    expect(allerTecGroup).toBeDefined();
    expect(allerTecGroup!.isMultiStore).toBe(true);

    // Check that multiple retailers are represented in the offers
    const retailers = allerTecGroup!.offers.map((o) => o.retailer);
    expect(retailers).toContain("Costco");
    expect(retailers).toContain("Ralphs");
    expect(retailers).toContain("Amazon");

    // Costco should be lowest price offer ($11.49)
    expect(allerTecGroup!.lowestPrice).toBe(11.49);
    expect(allerTecGroup!.bestRetailer).toBe("Costco");

    // Ralphs offer has Ralphs Rewards Card membership requirement
    const ralphsOffer = allerTecGroup!.offers.find((o) => o.retailer === "Ralphs");
    expect(ralphsOffer?.membershipRequired).toBe("Ralphs Rewards Card");

    // Costco offer has Costco Member requirement
    const costcoOffer = allerTecGroup!.offers.find((o) => o.retailer === "Costco");
    expect(costcoOffer?.membershipRequired).toBe("Costco Member");
  });

  it("keeps In-Store, Online, and Delivery channels distinct in offers", () => {
    const groups = groupProductsAcrossRetailers(SEED_PRODUCTS);
    const allerTec = groups.find((g) => g.id === "grp-aller-tec")!;

    const channels = allerTec.offers.map((o) => o.channel);
    expect(channels).toContain("In-Store");
    expect(channels).toContain("Online");
  });

  it("enforces unit price tracking when comparing products", () => {
    const groups = groupProductsAcrossRetailers(SEED_PRODUCTS);
    const allerTec = groups.find((g) => g.id === "grp-aller-tec")!;

    // Every offer must have a valid unit price
    for (const offer of allerTec.offers) {
      expect(offer.unitPrice).not.toBeNull();
      expect(offer.unitPrice).toContain("/ tablet");
    }

    expect(allerTec.lowestUnitPrice).toBe("$0.03 / tablet");
  });

  it("correctly parses numeric unit prices for comparative sorting", () => {
    expect(parseUnitPriceValue("$0.03 / tablet")).toBe(0.03);
    expect(parseUnitPriceValue("$1.17 / fl oz")).toBe(1.17);
    expect(parseUnitPriceValue("$13.23 / fl oz")).toBe(13.23);
    expect(parseUnitPriceValue("$39.99 / ea")).toBe(39.99);
    expect(parseUnitPriceValue(null)).toBeNull();
  });

  it("preserves FSAFEDS category, documentation requirements, and evidence source on grouped products", () => {
    const groups = groupProductsAcrossRetailers(SEED_PRODUCTS);
    for (const group of groups) {
      expect(group.category).toBeDefined();
      expect(group.documentationRequirement).toBe("None (OTC Item per CARES Act)");
      expect(group.evidenceSourceUrl).toBeDefined();
      expect(group.eligibilityConfidence).toBe("high");
    }
  });

  it("flags stale prices when observation timestamp exceeds 48 hours", () => {
    const staleProduct = {
      ...SEED_PRODUCTS[0],
      id: "stale-test-1",
      observedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() // 72 hours ago
    };

    const groups = groupProductsAcrossRetailers([staleProduct]);
    expect(groups[0].offers[0].isPriceStale).toBe(true);
  });
});
