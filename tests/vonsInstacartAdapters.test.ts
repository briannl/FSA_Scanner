import { describe, it, expect } from "vitest";
import { parseVonsHtml } from "../netlify/functions/shared/vonsAdapter";
import { parseInstacartAisle } from "../netlify/functions/shared/instacartAdapter";
import { findNearbyStores } from "../src/services/storeLocator";
import { RETAILER_REGISTRY } from "../src/types/product";

describe("Phase 3: Vons and Instacart Adapters & Store Locator", () => {
  describe("Retailer Capabilities", () => {
    it("reports real capabilities for Vons and Instacart", () => {
      expect(RETAILER_REGISTRY.Vons.capability).toBe("watched-urls-only");
      expect(RETAILER_REGISTRY.Instacart.capability).toBe("automatic-discovery");
      expect(RETAILER_REGISTRY.Vons.approvedDataFeed).toContain("Albertsons");
      expect(RETAILER_REGISTRY.Instacart.approvedDataFeed).toContain("Instacart");
    });
  });

  describe("Vons Adapter Parser", () => {
    it("extracts UPC, prices, 'for U' savings, and FSA eligibility from Vons HTML", () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>TheraTears Dry Eye Therapy Lubricant Eye Drops - Vons</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "TheraTears Dry Eye Therapy Lubricant Eye Drops 30 mL",
                "offers": {
                  "@type": "Offer",
                  "price": "13.49"
                }
              }
            </script>
          </head>
          <body>
            <h1 class="product-title">TheraTears Dry Eye Therapy Lubricant Eye Drops 30 mL</h1>
            <div class="product-strike-price">$16.99</div>
            <div class="for-u-badge">Save $3.50 with for U Member Pricing</div>
            <div class="price-per-unit">$13.23 / fl oz</div>
            <div class="fsa-badge">FSA/HSA Eligible Item</div>
          </body>
        </html>
      `;

      const products = parseVonsHtml(
        mockHtml,
        "https://www.vons.com/shop/product-details.0004126038104.html"
      );
      expect(products).toHaveLength(1);
      const item = products[0];

      expect(item.id).toBe("vons-0004126038104");
      expect(item.retailer).toBe("Vons");
      expect(item.name).toContain("TheraTears Dry Eye Therapy");
      expect(item.currentPrice).toBe(13.49);
      expect(item.regularPrice).toBe(16.99);
      expect(item.discountAmount).toBe(3.50);
      expect(item.discountPercent).toBe(20.6);
      expect(item.promoType).toBe("Member Only");
      expect(item.membershipRequired).toBe("Vons for U Club");
      expect(item.fsaEligible).toBe(true);
      expect(item.fsafedsCategory).toBe("Vision & Eye Care");
      expect(item.eligibilityReviewStatus).toBe("verified");
    });

    it("trips WAF_BLOCKED when Vons Akamai challenge is detected", () => {
      const blockedHtml = `
        <html>
          <head><title>Access Denied</title></head>
          <body>
            <h1>Access Denied</h1>
            <p>Reference #18.12345.6789.akamai</p>
          </body>
        </html>
      `;

      expect(() =>
        parseVonsHtml(blockedHtml, "https://www.vons.com/shop/product-details.12345.html")
      ).toThrowError(/WAF_BLOCKED/);
    });
  });

  describe("Instacart FSA Discovery Adapter", () => {
    it("extracts delivery items from Instacart FSA aisle payload", () => {
      const payload = {
        items: [
          {
            id: "ic-101",
            name: "Band-Aid Brand Tru-Stay Clear Strips 40 ct",
            price: 4.99,
            regularPrice: 5.99,
            unitPrice: "$0.12 / ct",
            productUrl: "https://www.instacart.com/products/101",
            partnerStore: "Ralphs Delivery via Instacart",
            fsaBadgeText: "FSA/HSA Eligible",
            upc: "038137004400"
          }
        ]
      };

      const products = parseInstacartAisle(payload);
      expect(products).toHaveLength(1);
      const item = products[0];

      expect(item.id).toBe("instacart-ic-101");
      expect(item.retailer).toBe("Instacart");
      expect(item.channel).toBe("Delivery");
      expect(item.currentPrice).toBe(4.99);
      expect(item.regularPrice).toBe(5.99);
      expect(item.discountAmount).toBe(1.00);
      expect(item.discountPercent).toBe(16.7);
      expect(item.fsaEligible).toBe(true);
      expect(item.fsafedsCategory).toBe("First Aid & Wound Care");
      expect(item.eligibilityReviewStatus).toBe("verified");
    });
  });

  describe("Nearby Store Locator", () => {
    it("finds local participating physical retailers by ZIP code", () => {
      const stores = findNearbyStores("90210");
      expect(stores.length).toBeGreaterThanOrEqual(5);

      const retailers = stores.map((s) => s.retailer);
      expect(retailers).toContain("Ralphs");
      expect(retailers).toContain("Vons");
      expect(retailers).toContain("CVS");
      expect(retailers).toContain("Costco");
      expect(retailers).toContain("Trader Joe's");

      // Verify Trader Joe's is strictly In-Store only
      const tj = stores.find((s) => s.retailer === "Trader Joe's");
      expect(tj?.fulfillmentMethods).toEqual(["In-Store"]);
    });
  });
});
