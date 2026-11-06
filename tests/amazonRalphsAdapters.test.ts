import { describe, it, expect } from "vitest";
import { parseAmazonHtml } from "../netlify/functions/shared/amazonAdapter";
import { parseRalphsHtml } from "../netlify/functions/shared/ralphsAdapter";
import { RETAILER_REGISTRY } from "../src/types/product";

describe("Phase 2: Amazon and Ralphs Adapters", () => {
  describe("Retailer Capability Reporting", () => {
    it("reports real capabilities for Amazon and Ralphs", () => {
      expect(RETAILER_REGISTRY.Amazon.capability).toBe("watched-urls-only");
      expect(RETAILER_REGISTRY.Ralphs.capability).toBe("watched-urls-only");
      expect(RETAILER_REGISTRY.Amazon.approvedDataFeed).toContain("PAAPI");
      expect(RETAILER_REGISTRY.Ralphs.approvedDataFeed).toContain("Kroger");
    });
  });

  describe("Amazon Adapter Parser", () => {
    it("extracts ASIN, prices, unit price, and explicit FSA badge from Amazon product HTML", () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Amazon.com: Omron 3 Series Upper Arm Blood Pressure Monitor</title>
          </head>
          <body>
            <span id="productTitle">Omron 3 Series Upper Arm Blood Pressure Monitor (BP7100)</span>
            <div id="fsaHsaEligibility">
              <span class="a-badge-text">FSA or HSA eligible</span>
            </div>
            <div class="a-price">
              <span class="a-offscreen">$39.99</span>
            </div>
            <span class="basisPrice">
              <span class="a-offscreen">$49.99</span>
            </span>
            <span class="pricePerUnit">$39.99 / Count</span>
            <img id="landingImage" src="https://m.media-amazon.com/images/I/71xyz.jpg" />
          </body>
        </html>
      `;

      const products = parseAmazonHtml(mockHtml, "https://www.amazon.com/dp/B07S27NVQW");
      expect(products).toHaveLength(1);
      const item = products[0];

      expect(item.id).toBe("amzn-B07S27NVQW");
      expect(item.retailer).toBe("Amazon");
      expect(item.asin).toBe("B07S27NVQW");
      expect(item.name).toContain("Omron 3 Series");
      expect(item.currentPrice).toBe(39.99);
      expect(item.regularPrice).toBe(49.99);
      expect(item.discountAmount).toBe(10.00);
      expect(item.discountPercent).toBe(20.0);
      expect(item.unitPrice).toContain("$39.99 / Count");
      expect(item.fsaEligible).toBe(true);
      expect(item.fsafedsCategory).toBe("Diagnostics & Monitoring");
      expect(item.eligibilityReviewStatus).toBe("verified");
    });

    it("trips WAF_BLOCKED when Amazon bot check captcha is returned", () => {
      const captchaHtml = `
        <html>
          <head><title>Robot Check</title></head>
          <body>
            <h4>Enter the characters you see below</h4>
            <form action="/errors/validateCaptcha">
              <img src="https://images-na.ssl-images-amazon.com/captcha/123.jpg" />
            </form>
          </body>
        </html>
      `;

      expect(() => parseAmazonHtml(captchaHtml, "https://www.amazon.com/dp/B07S27NVQW")).toThrowError(
        /WAF_BLOCKED/
      );
    });
  });

  describe("Ralphs (Kroger) Adapter Parser", () => {
    it("extracts UPC, prices, Ralphs card savings, and FSA eligibility", () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kirkland Signature Aller-Tec 365 Tablets - Ralphs</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Kirkland Signature Aller-Tec Cetirizine HCl 10mg Tablets",
                "gtin13": "0004126038104",
                "image": "https://www.ralphs.com/product/images/large/front/0004126038104",
                "offers": {
                  "@type": "Offer",
                  "price": "14.99",
                  "priceCurrency": "USD"
                }
              }
            </script>
          </head>
          <body>
            <h1 data-qa="product-title">Kirkland Signature Aller-Tec Cetirizine HCl 10mg Tablets</h1>
            <div data-qa="cart-page-item-regular-price" class="kds-Price--strike">$18.99</div>
            <div data-qa="product-savings-badge" class="kds-Badge--promotion">Save $4.00 with Ralphs Rewards Card</div>
            <div data-qa="product-price-per-unit" class="kds-Price-perUnit">$0.04 / ct</div>
            <div class="fsa-eligible">FSA/HSA Eligible Item</div>
          </body>
        </html>
      `;

      const products = parseRalphsHtml(
        mockHtml,
        "https://www.ralphs.com/p/kirkland-signature-aller-tec/0004126038104"
      );
      expect(products).toHaveLength(1);
      const item = products[0];

      expect(item.id).toBe("ralphs-0004126038104");
      expect(item.retailer).toBe("Ralphs");
      expect(item.upc).toBe("0004126038104");
      expect(item.name).toContain("Kirkland Signature Aller-Tec");
      expect(item.currentPrice).toBe(14.99);
      expect(item.regularPrice).toBe(18.99);
      expect(item.discountAmount).toBe(4.00);
      expect(item.discountPercent).toBe(21.1);
      expect(item.promoType).toBe("Member Only");
      expect(item.membershipRequired).toBe("Ralphs Rewards Card");
      expect(item.fsaEligible).toBe(true);
      expect(item.fsafedsCategory).toBe("Cold, Flu & Allergy");
      expect(item.eligibilityReviewStatus).toBe("verified");
    });

    it("trips WAF_BLOCKED when Ralphs PerimeterX challenge is detected", () => {
      const pxHtml = `
        <html>
          <head><title>Access Denied</title></head>
          <body>
            <div id="px-captcha">Please verify you are a human</div>
          </body>
        </html>
      `;

      expect(() =>
        parseRalphsHtml(pxHtml, "https://www.ralphs.com/p/item/0004126038104")
      ).toThrowError(/WAF_BLOCKED/);
    });
  });
});
