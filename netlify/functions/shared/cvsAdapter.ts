import * as cheerio from "cheerio";
import { ProductObservation, PromoType, PriceStatus } from "../../../src/types/product";
import { CollectionResult } from "./types";

export interface CvsRawPayload {
  sku?: string;
  id?: string;
  name?: string;
  price?: number | string;
  regularPrice?: number | string;
  unitPrice?: string;
  size?: string;
  promoText?: string;
  couponText?: string;
  fsaEligible?: boolean;
  category?: string;
  url?: string;
  imageUrl?: string;
  inStock?: boolean;
}

export function parseCvsHtml(html: string, pageUrl: string = "https://www.cvs.com"): ProductObservation[] {
  const $ = cheerio.load(html);
  const products: ProductObservation[] = [];

  // 1. Check for Akamai / WAF challenge
  const title = $("title").text().toLowerCase();
  if (title.includes("access denied") || html.includes("akamai") && html.includes("reference #")) {
    throw new Error("WAF_BLOCKED: Akamai Bot Manager challenge detected");
  }

  // 2. Try JSON-LD script tags
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (item["@type"] === "Product" || item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const price = offers?.price ? parseFloat(offers.price) : null;
          const sku = item.sku || item.productID || pageUrl.match(/prodid-(\d+)/)?.[1] || `${Date.now()}`;
          const id = `cvs-${sku}`;

          let regularPrice: number | null = price;
          if (offers?.priceSpecification?.price) {
            regularPrice = parseFloat(offers.priceSpecification.price);
          }

          const name = item.name || $("h1").first().text().trim() || "CVS Health Product";
          const category = inferCategory(name, item.category);

          let promoType: PromoType = "None";
          let discountAmount = 0;
          let discountPercent = 0;

          if (regularPrice && price && regularPrice > price) {
            discountAmount = +(regularPrice - price).toFixed(2);
            discountPercent = +(((regularPrice - price) / regularPrice) * 100).toFixed(1);
            promoType = "Standard Markdown";
          }

          products.push({
            id,
            retailer: "CVS",
            name,
            category,
            currentPrice: price,
            regularPrice,
            unitPrice: null,
            size: null,
            discountAmount,
            discountPercent,
            promoType,
            promoDetails: null,
            fsaEligible: true,
            priceStatus: price !== null ? "confirmed" : "uncertain",
            isRecentDrop: false,
            lowestHistoricalPrice: price,
            imageUrl: item.image || null,
            productUrl: pageUrl,
            sourceType: "watchlist-page",
            observedAt: new Date().toISOString()
          });
        }
      }
    } catch {
      // Continue parsing next block
    }
  });

  // 3. Fallback: Parse CVS DOM markup directly
  if (products.length === 0) {
    const productName = $("h1").first().text().trim() || $(".product-name").first().text().trim();
    if (productName) {
      const priceText = $('[data-testid="product-price"], .price, .product-price, .regular-price').first().text().trim();
      const strikeText = $('.strikethrough-price, .was-price, [data-testid="was-price"]').first().text().trim();
      const promoText = $('.promo-message, [data-testid="promo-badge"], .extracare-offer').first().text().trim();
      const unitPriceText = $('.unit-price, [data-testid="unit-price"]').first().text().trim();

      const parsePrice = (txt: string) => {
        const m = txt.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
        return m ? parseFloat(m[1]) : null;
      };

      const currentPrice = parsePrice(priceText);
      let regularPrice = parsePrice(strikeText) || currentPrice;

      let promoType: PromoType = "None";
      let discountAmount = 0;
      let discountPercent = 0;

      if (promoText.toLowerCase().includes("buy 1") || promoText.toLowerCase().includes("bogo")) {
        promoType = "Multi-Buy";
      } else if (promoText.toLowerCase().includes("coupon") || promoText.toLowerCase().includes("extracare app")) {
        promoType = "Coupon Only";
      } else if (promoText.toLowerCase().includes("extrabucks") || promoText.toLowerCase().includes("extracare")) {
        promoType = "CVS Promo";
      } else if (regularPrice && currentPrice && regularPrice > currentPrice) {
        promoType = "Standard Markdown";
      }

      if (regularPrice && currentPrice && regularPrice > currentPrice) {
        discountAmount = +(regularPrice - currentPrice).toFixed(2);
        discountPercent = +(((regularPrice - currentPrice) / regularPrice) * 100).toFixed(1);
      }

      const skuMatch = pageUrl.match(/prodid-(\d+)/) || html.match(/"sku":"(\d+)"/);
      const sku = skuMatch ? skuMatch[1] : `${Date.now()}`;

      products.push({
        id: `cvs-${sku}`,
        retailer: "CVS",
        name: productName,
        category: inferCategory(productName),
        currentPrice,
        regularPrice,
        unitPrice: unitPriceText || null,
        size: null,
        discountAmount,
        discountPercent,
        promoType,
        promoDetails: promoText || null,
        fsaEligible: true,
        priceStatus: currentPrice !== null ? "confirmed" : "uncertain",
        isRecentDrop: false,
        lowestHistoricalPrice: currentPrice,
        imageUrl: null,
        productUrl: pageUrl,
        sourceType: "watchlist-page",
        observedAt: new Date().toISOString()
      });
    }
  }

  return products;
}

function inferCategory(name: string, explicitCategory?: string): string {
  const text = `${name} ${explicitCategory || ""}`.toLowerCase();
  if (text.includes("blood pressure") || text.includes("monitor") || text.includes("glucose") || text.includes("test strip") || text.includes("thermometer")) {
    return "Diagnostic";
  }
  if (text.includes("allergy") || text.includes("flonase") || text.includes("aller-tec") || text.includes("pain") || text.includes("tylenol") || text.includes("advil")) {
    return "OTC Meds";
  }
  if (text.includes("bandage") || text.includes("first aid") || text.includes("wound") || text.includes("antiseptic")) {
    return "First Aid";
  }
  if (text.includes("sunscreen") || text.includes("spf") || text.includes("sun care") || text.includes("anthelios")) {
    return "Sun Care";
  }
  if (text.includes("contact") || text.includes("eye drops") || text.includes("solution") || text.includes("vision") || text.includes("biotrue") || text.includes("theratears")) {
    return "Vision";
  }
  return "OTC Meds";
}

export async function fetchCvsProducts(watchlistUrls: string[] = []): Promise<CollectionResult> {
  const products: ProductObservation[] = [];
  const errors: string[] = [];
  let blockedByWaf = false;

  // Filter watchlist URLs for CVS
  const cvsUrls = watchlistUrls.filter((u) => u.includes("cvs.com"));

  // If no custom URLs, use standard target URL
  const urlsToFetch = cvsUrls.length > 0 ? cvsUrls : [
    "https://www.cvs.com/shop/cvs-health-series-400-upper-arm-blood-pressure-monitor-prodid-108201"
  ];

  for (const url of urlsToFetch) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      clearTimeout(timeoutId);

      if (res.status === 403 || res.status === 429) {
        blockedByWaf = true;
        errors.push(`HTTP ${res.status}: CVS Bot Manager/Akamai blocked request to ${url}`);
        continue;
      }

      if (!res.ok) {
        errors.push(`HTTP ${res.status} returned from ${url}`);
        continue;
      }

      const html = await res.text();
      const parsed = parseCvsHtml(html, url);
      products.push(...parsed);

      // Conservative polite rate limit (500ms pause)
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      if (err.name === "AbortError") {
        errors.push(`Request to ${url} timed out after 8 seconds`);
      } else if (err.message && err.message.includes("WAF_BLOCKED")) {
        blockedByWaf = true;
        errors.push(`WAF challenge encountered at ${url}`);
      } else {
        errors.push(`Fetch failed for ${url}: ${err.message}`);
      }
    }
  }

  if (blockedByWaf) {
    return {
      retailer: "CVS",
      products,
      success: false,
      status: "blocked_waf",
      errorMessage: errors.join("; "),
      diagnosticDetails: "Akamai Bot Manager blocked datacenter IP. Existing snapshot retained."
    };
  }

  if (products.length === 0 && errors.length > 0) {
    return {
      retailer: "CVS",
      products,
      success: false,
      status: "error",
      errorMessage: errors.join("; ")
    };
  }

  return {
    retailer: "CVS",
    products,
    success: true,
    status: "success",
    errorMessage: null
  };
}
