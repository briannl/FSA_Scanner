import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseCvsHtml } from "../netlify/functions/shared/cvsAdapter";

describe("CVS Collector Adapter & Fixture Parsing", () => {
  const fixturesDir = path.resolve(__dirname, "fixtures", "cvs");

  it("extracts product details from schema.org JSON-LD markup", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "cvs_json_ld_product.html"), "utf-8");
    const products = parseCvsHtml(html, "https://www.cvs.com/shop/cvs-health-series-400-upper-arm-blood-pressure-monitor-prodid-108201");

    expect(products.length).toBeGreaterThanOrEqual(1);
    const item = products[0];
    expect(item.id).toBe("cvs-108201");
    expect(item.retailer).toBe("CVS");
    expect(item.name).toContain("CVS Health Series 400 Upper Arm Blood Pressure Monitor");
    expect(item.category).toBe("Diagnostic");
    expect(item.currentPrice).toBe(44.99);
    expect(item.regularPrice).toBe(59.99);
    expect(item.discountAmount).toBe(15.00);
    expect(item.discountPercent).toBe(25.0);
    expect(item.promoType).toBe("Standard Markdown");
    expect(item.priceStatus).toBe("confirmed");
    expect(item.fsaEligible).toBe(true);
  });

  it("identifies Multi-Buy / BOGO offers with quantity limit flags", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "cvs_multibuy_bogo.html"), "utf-8");
    const products = parseCvsHtml(html, "https://www.cvs.com/shop/cvs-health-antibacterial-flexible-fabric-bandages-60ct-prodid-882103");

    expect(products.length).toBe(1);
    const item = products[0];
    expect(item.retailer).toBe("CVS");
    expect(item.name).toContain("CVS Health Flexible Antibacterial Bandages");
    expect(item.category).toBe("First Aid");
    expect(item.currentPrice).toBe(5.99);
    expect(item.promoType).toBe("Multi-Buy");
    expect(item.promoDetails).toContain("Buy 1, Get 1 50% OFF");
    expect(item.promoDetails).toContain("Limit 4");
    expect(item.unitPrice).toBe("$0.10 / ea");
  });

  it("flags ExtraCare digital manufacturer coupons separately from direct markdowns", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "cvs_coupon_extracare.html"), "utf-8");
    const products = parseCvsHtml(html, "https://www.cvs.com/shop/la-roche-posay-anthelios-mineral-ultra-light-sunscreen-spf-50-prodid-492104");

    expect(products.length).toBe(1);
    const item = products[0];
    expect(item.retailer).toBe("CVS");
    expect(item.category).toBe("Sun Care");
    expect(item.currentPrice).toBe(32.99);
    expect(item.regularPrice).toBe(36.99);
    expect(item.promoType).toBe("Coupon Only");
    expect(item.promoDetails).toContain("$4 off manufacturer digital coupon");
    expect(item.discountAmount).toBe(4.00);
    expect(item.discountPercent).toBe(10.8);
  });

  it("handles uncertain / out-of-stock store prices gracefully without inventing prices", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "cvs_uncertain_price.html"), "utf-8");
    const products = parseCvsHtml(html, "https://www.cvs.com/shop/omron-7-series-upper-arm-blood-pressure-monitor-prodid-773194");

    expect(products.length).toBe(1);
    const item = products[0];
    expect(item.currentPrice).toBeNull();
    expect(item.priceStatus).toBe("uncertain");
    expect(item.discountAmount).toBe(0);
    expect(item.discountPercent).toBe(0);
  });

  it("handles malformed and truncated markup without throwing unhandled exceptions", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "cvs_malformed.html"), "utf-8");
    expect(() => {
      const products = parseCvsHtml(html, "https://www.cvs.com/shop/test-prodid-999");
      expect(Array.isArray(products)).toBe(true);
    }).not.toThrow();
  });

  it("detects Akamai Bot Manager challenge pages and flags WAF blocking", () => {
    const html = fs.readFileSync(path.join(fixturesDir, "cvs_waf_challenge.html"), "utf-8");
    expect(() => {
      parseCvsHtml(html, "https://www.cvs.com/shop/test");
    }).toThrow(/WAF_BLOCKED/);
  });
});
