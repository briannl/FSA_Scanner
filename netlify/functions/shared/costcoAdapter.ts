import * as cheerio from "cheerio";
import { ProductObservation, PromoType } from "../../../src/types/product";
import { CollectionResult } from "./types";

export function parseCostcoHtml(html: string, pageUrl: string = "https://www.costco.com"): ProductObservation[] {
  const $ = cheerio.load(html);
  const products: ProductObservation[] = [];

  // 1. Check for WAF / Akamai challenge
  const title = $("title").text().toLowerCase();
  if (title.includes("access denied") || html.includes("Reference #") && html.includes("akamai")) {
    throw new Error("WAF_BLOCKED: Akamai Bot challenge detected on Costco page");
  }

  // 2. Try JSON-LD Product schema
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
          const skuMatch = pageUrl.match(/product\.(\d+)\.html/) || item.sku?.match(/(\d+)/);
          const sku = skuMatch ? skuMatch[1] : `${Date.now()}`;
          const id = `costco-${sku}`;

          const name = item.name || $("h1").first().text().trim() || "Costco Item";
          const category = inferCostcoCategory(name);

          // Check if Instant Savings text is in the HTML
          let regularPrice: number | null = price;
          let discountAmount = 0;
          let discountPercent = 0;
          let promoType: PromoType = "None";
          let promoDetails: string | null = null;

          const savingsText = $(".instant-savings, .your-price-discount, [automation-id='instantSavings']").first().text().trim();
          if (savingsText) {
            const m = savingsText.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
            if (m && price) {
              discountAmount = parseFloat(m[1]);
              regularPrice = +(price + discountAmount).toFixed(2);
              discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
              promoType = "Costco Instant Savings";
              promoDetails = savingsText;
            }
          }

          products.push({
            id,
            retailer: "Costco",
            name,
            category,
            currentPrice: price,
            regularPrice,
            unitPrice: null,
            size: null,
            discountAmount,
            discountPercent,
            promoType,
            promoDetails,
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
      // Continue next block
    }
  });

  // 3. Fallback: Parse Costco DOM directly
  if (products.length === 0) {
    const productName = $("h1").first().text().trim() || $(".product-title").first().text().trim();
    if (productName) {
      const priceText = $('.your-price .value, [automation-id="productPriceOutput"], .price').first().text().trim();
      const savingsText = $('.instant-savings, [automation-id="instantSavings"], .your-price-discount').first().text().trim();
      const unitPriceText = $('.unit-price, .price-per-unit').first().text().trim();

      const parsePrice = (txt: string) => {
        const m = txt.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
        return m ? parseFloat(m[1]) : null;
      };

      const currentPrice = parsePrice(priceText);
      let discountAmount = 0;
      let discountPercent = 0;
      let regularPrice = currentPrice;
      let promoType: PromoType = "None";
      let promoDetails: string | null = null;

      if (savingsText) {
        const sm = savingsText.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
        if (sm && currentPrice) {
          discountAmount = parseFloat(sm[1]);
          regularPrice = +(currentPrice + discountAmount).toFixed(2);
          discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
          promoType = "Costco Instant Savings";
          promoDetails = savingsText;
        }
      }

      const skuMatch = pageUrl.match(/product\.(\d+)\.html/) || html.match(/"itemId":"(\d+)"/);
      const sku = skuMatch ? skuMatch[1] : `${Date.now()}`;

      products.push({
        id: `costco-${sku}`,
        retailer: "Costco",
        name: productName,
        category: inferCostcoCategory(productName),
        currentPrice,
        regularPrice,
        unitPrice: unitPriceText || null,
        size: null,
        discountAmount,
        discountPercent,
        promoType,
        promoDetails,
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

function inferCostcoCategory(name: string): string {
  const text = name.toLowerCase();
  if (text.includes("blood pressure") || text.includes("monitor") || text.includes("glucose") || text.includes("test strip")) {
    return "Diagnostic";
  }
  if (text.includes("allergy") || text.includes("aller-tec") || text.includes("cetirizine") || text.includes("pain") || text.includes("ibuprofen") || text.includes("aspirin")) {
    return "OTC Meds";
  }
  if (text.includes("bandage") || text.includes("first aid") || text.includes("curad")) {
    return "First Aid";
  }
  if (text.includes("sunscreen") || text.includes("spf") || text.includes("neutrogena")) {
    return "Sun Care";
  }
  if (text.includes("eye") || text.includes("contact") || text.includes("theratears") || text.includes("drops")) {
    return "Vision";
  }
  return "OTC Meds";
}

export async function fetchCostcoProducts(watchlistUrls: string[] = []): Promise<CollectionResult> {
  const products: ProductObservation[] = [];
  const errors: string[] = [];
  let blockedByWaf = false;

  const costcoUrls = watchlistUrls.filter((u) => u.includes("costco.com"));
  const urlsToFetch = costcoUrls.length > 0 ? costcoUrls : [
    "https://www.costco.com/kirkland-signature-aller-tec-10-mg.-365-tablets.product.100412345.html"
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
        errors.push(`HTTP ${res.status}: Costco Bot Manager/Akamai blocked request to ${url}`);
        continue;
      }

      if (!res.ok) {
        errors.push(`HTTP ${res.status} returned from ${url}`);
        continue;
      }

      const html = await res.text();
      const parsed = parseCostcoHtml(html, url);
      products.push(...parsed);

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
      retailer: "Costco",
      products,
      success: false,
      status: "blocked_waf",
      errorMessage: errors.join("; "),
      diagnosticDetails: "Akamai Bot challenge blocked AWS/Netlify datacenter IP. Existing snapshot retained."
    };
  }

  if (products.length === 0 && errors.length > 0) {
    return {
      retailer: "Costco",
      products,
      success: false,
      status: "error",
      errorMessage: errors.join("; ")
    };
  }

  return {
    retailer: "Costco",
    products,
    success: true,
    status: "success",
    errorMessage: null
  };
}
