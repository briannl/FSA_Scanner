import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseCostcoHtml } from "../netlify/functions/shared/costcoAdapter";

describe("Costco Collector Adapter & Fixture Parsing", () => {
  const fixturesDir = path.resolve(__dirname, "fixtures", "costco");

  it("extracts Costco Instant Savings and calculates verified reference price", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "costco_instant_savings.html"), "utf-8");
    const products = parseCostcoHtml(html, "https://www.costco.com/kirkland-signature-aller-tec-10-mg.-365-tablets.product.100412345.html");

    expect(products.length).toBeGreaterThanOrEqual(1);
    const item = products[0];
    expect(item.id).toBe("costco-100412345");
    expect(item.retailer).toBe("Costco");
    expect(item.name).toContain("Kirkland Signature Aller-Tec");
    expect(item.category).toBe("OTC Meds");
    expect(item.currentPrice).toBe(11.49);
    expect(item.regularPrice).toBe(14.99); // 11.49 + 3.50
    expect(item.discountAmount).toBe(3.50);
    expect(item.discountPercent).toBe(23.3);
    expect(item.promoType).toBe("Costco Instant Savings");
    expect(item.promoDetails).toContain("$3.50 manufacturer savings");
    expect(item.priceStatus).toBe("confirmed");
    expect(item.fsaEligible).toBe(true);
  });

  it("extracts diagnostic bundle items with manufacturer savings", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "costco_json_ld_bundle.html"), "utf-8");
    const products = parseCostcoHtml(html, "https://www.costco.com/accu-chek-guide-me-glucose-monitoring-system.product.100654321.html");

    expect(products.length).toBe(1);
    const item = products[0];
    expect(item.id).toBe("costco-100654321");
    expect(item.retailer).toBe("Costco");
    expect(item.category).toBe("Diagnostic");
    expect(item.currentPrice).toBe(34.99);
    expect(item.regularPrice).toBe(44.99); // 34.99 + 10.00
    expect(item.discountAmount).toBe(10.00);
    expect(item.discountPercent).toBe(22.2);
    expect(item.promoType).toBe("Costco Instant Savings");
  });

  it("handles non-discounted products with zero discount percentage", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "costco_standard_price.html"), "utf-8");
    const products = parseCostcoHtml(html, "https://www.costco.com/curad-performance-bandages-200ct.product.100194827.html");

    expect(products.length).toBe(1);
    const item = products[0];
    expect(item.currentPrice).toBe(14.99);
    expect(item.regularPrice).toBe(14.99);
    expect(item.discountAmount).toBe(0);
    expect(item.discountPercent).toBe(0);
    expect(item.promoType).toBe("None");
  });

  it("detects Akamai Bot Manager challenge pages and flags WAF blocking", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "costco_waf_challenge.html"), "utf-8");
    expect(() => {
      parseCostcoHtml(html, "https://www.costco.com/test");
    }).toThrow(/WAF_BLOCKED/);
  });

  it("gracefully tolerates broken HTML markup without throwing uncaught exceptions", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "costco_malformed.html"), "utf-8");
    expect(() => {
      const products = parseCostcoHtml(html, "https://www.costco.com/broken.html");
      expect(Array.isArray(products)).toBe(true);
    }).not.toThrow();
  });
});
