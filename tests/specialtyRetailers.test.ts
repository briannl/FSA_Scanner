import { describe, it, expect } from "vitest";
import {
  processManualSpecialtyImport,
  parseSmartAndFinalHtml
} from "../netlify/functions/shared/specialtyAdapters";
import { RETAILER_REGISTRY } from "../src/types/product";

describe("Phase 4: Specialty Retailers (H Mart, 99 Ranch, Smart & Final, Trader Joe's)", () => {
  describe("Retailer Capability Integrity", () => {
    it("strictly reports real capabilities without implying automated scraping where unsupported", () => {
      expect(RETAILER_REGISTRY["Trader Joe's"].capability).toBe("manual-verification-only");
      expect(RETAILER_REGISTRY["H Mart"].capability).toBe("manual-import");
      expect(RETAILER_REGISTRY["99 Ranch"].capability).toBe("manual-import");
      expect(RETAILER_REGISTRY["Smart & Final"].capability).toBe("watched-urls-only");
    });
  });

  describe("Trader Joe's In-Store Manual Verification", () => {
    it("admits verified physical OTC sunscreen and rejects ordinary grocery snacks", () => {
      const items = processManualSpecialtyImport([
        {
          retailer: "Trader Joe's",
          name: "Trader Joe's Daily Facial Sunscreen Broad Spectrum SPF 40",
          upc: "00609384",
          price: 8.99,
          productUrl: "https://www.traderjoes.com/home/products/pdp/daily-facial-sunscreen-00609384",
          verificationEvidenceNote: "In-store shelf tag and receipt audit: Broad spectrum SPF 40 physical sunscreen"
        },
        {
          retailer: "Trader Joe's",
          name: "Trader Joe's Organic Peanut Butter Creamy Grocery",
          upc: "00123456",
          price: 3.49,
          productUrl: "https://www.traderjoes.com/home/products/pdp/peanut-butter-00123456",
          verificationEvidenceNote: "In-store item"
        }
      ]);

      expect(items).toHaveLength(1);
      expect(items[0].name).toContain("Daily Facial Sunscreen");
      expect(items[0].fsafedsCategory).toBe("Skin & Sun Care");
      expect(items[0].channel).toBe("In-Store");
      expect(items[0].sourceType).toBe("manual-import");
    });
  });

  describe("H Mart & 99 Ranch Specialty Asian Health Imports", () => {
    it("admits FDA-registered OTC topical pain patches and rejects food items", () => {
      const items = processManualSpecialtyImport([
        {
          retailer: "H Mart",
          name: "Salonpas Pain Relief Patch Large 6 Count",
          upc: "346581110065",
          price: 7.99,
          regularPrice: 9.49,
          unitPrice: "$1.33 / patch",
          productUrl: "https://www.hmart.com/health/salonpas-patch",
          verificationEvidenceNote: "US FDA NDC 46581-110-06 OTC topical analgesic patch"
        },
        {
          retailer: "99 Ranch",
          name: "White Flower Analgesic Medicated Oil 20 mL",
          upc: "088667000018",
          price: 9.99,
          regularPrice: 11.99,
          productUrl: "https://www.99ranch.com/item/white-flower-oil",
          verificationEvidenceNote: "US FDA NDC 51393-784-20 External analgesic"
        },
        {
          retailer: "H Mart",
          name: "Nongshim Shin Ramyun Spicy Ramen Noodle Soup Grocery",
          upc: "031146450604",
          price: 5.99,
          productUrl: "https://www.hmart.com/food/shin-ramyun",
          verificationEvidenceNote: "Grocery ramen"
        }
      ]);

      expect(items).toHaveLength(2);
      expect(items.map((i) => i.retailer)).toEqual(["H Mart", "99 Ranch"]);
      expect(items[0].fsafedsCategory).toBe("Pain Relief");
      expect(items[1].fsafedsCategory).toBe("Pain Relief");
    });
  });

  describe("Smart & Final Watched URL Parser", () => {
    it("extracts commercial first aid supplies with price and FSA eligibility", () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Curad Heavy Duty Adhesive Bandages - Smart & Final</title>
            <meta property="og:image" content="https://smartandfinal.com/images/curad.jpg" />
          </head>
          <body>
            <h1 class="product-title">Curad Heavy Duty Adhesive Bandages Fabric 60 ct</h1>
            <span class="product-price">$5.99</span>
            <span class="was-price">$7.49</span>
            <span class="price-per-unit">$0.10 / ct</span>
            <div class="fsa-badge">FSA/HSA Eligible Item</div>
          </body>
        </html>
      `;

      const products = parseSmartAndFinalHtml(
        mockHtml,
        "https://www.smartandfinal.com/shop/product.0080123456.html"
      );
      expect(products).toHaveLength(1);
      const item = products[0];

      expect(item.retailer).toBe("Smart & Final");
      expect(item.name).toContain("Curad Heavy Duty");
      expect(item.currentPrice).toBe(5.99);
      expect(item.regularPrice).toBe(7.49);
      expect(item.discountAmount).toBe(1.50);
      expect(item.discountPercent).toBe(20.0);
      expect(item.fsafedsCategory).toBe("First Aid & Wound Care");
      expect(item.fsaEligible).toBe(true);
    });
  });
});
