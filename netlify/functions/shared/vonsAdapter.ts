import * as cheerio from "cheerio";
import { ProductObservation, PromoType } from "../../../src/types/product";
import { CollectionResult, FetchAdapterOptions, StructuredError } from "./types";
import { evaluateFsaEligibility } from "../../../src/services/eligibilityEngine";

export function parseVonsHtml(html: string, pageUrl: string = "https://www.vons.com"): ProductObservation[] {
  const $ = cheerio.load(html);
  const products: ProductObservation[] = [];

  // 1. Detect Akamai Bot Challenge
  const title = $("title").text().toLowerCase();
  if (
    title.includes("access denied") ||
    title.includes("human challenge") ||
    (html.includes("Reference #") && html.includes("akamai"))
  ) {
    throw new Error("WAF_BLOCKED: Vons (Albertsons) Akamai challenge detected");
  }

  // Extract Item ID or UPC from URL (e.g. product-details.0004126038104.html)
  const idMatch = pageUrl.match(/product-details\.(\d+)\.html/) || pageUrl.match(/\/(\d{10,14})/);
  const upc = idMatch ? idMatch[1] : null;

  // 2. Check for FSA/HSA attribute on Vons page
  const hasFsaText =
    html.includes("FSA/HSA Eligible") ||
    html.includes("FSA or HSA eligible") ||
    html.includes("FSA Eligible") ||
    $("[data-qa*='fsa'], .fsa-tag, .fsa-badge").length > 0;

  // 3. Extract via JSON-LD or DOM
  let productName = $("h1, .product-title, [data-qa='product-name']").first().text().trim();
  let currentPrice: number | null = null;
  let regularPrice: number | null = null;
  let unitPriceText: string | null = null;
  let imageUrl: string | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (item["@type"] === "Product" || item.offers) {
          if (!productName && item.name) productName = item.name;
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offers?.price) {
            currentPrice = parseFloat(offers.price);
          }
          if (item.image) {
            imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
          }
        }
      }
    } catch {
      // Continue
    }
  });

  const parseAmount = (txt: string): number | null => {
    if (!txt) return null;
    const m = txt.replace(/,/g, "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
    return m ? parseFloat(m[1]) : null;
  };

  if (!currentPrice) {
    const promoPriceText = $(".product-price, .promo-price, [data-qa='product-price']").first().text().trim();
    currentPrice = parseAmount(promoPriceText);
  }

  const regularPriceText = $(
    ".product-strike-price, .strike-price, [data-qa='product-original-price']"
  ).first().text().trim();
  regularPrice = parseAmount(regularPriceText) || currentPrice;

  const unitPriceEl = $(".product-unit-price, .price-per-unit").first().text().trim();
  if (unitPriceEl) unitPriceText = unitPriceEl;

  if (!imageUrl) {
    imageUrl = $(".product-image img, [data-qa='product-image']").first().attr("src") || null;
  }

  // 4. Vons 'for U' Member Discounts
  let promoType: PromoType = "None";
  let promoDetails: string | null = null;
  let discountAmount = 0;
  let discountPercent = 0;

  const forUBadge = $(".for-u-badge, .club-savings, [data-qa='for-u-discount']").first().text().trim();
  if (regularPrice && currentPrice && regularPrice > currentPrice) {
    discountAmount = +(regularPrice - currentPrice).toFixed(2);
    discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
    promoType = forUBadge ? "Member Only" : "Standard Markdown";
    promoDetails = forUBadge || `Save $${discountAmount.toFixed(2)} with Vons for U`;
  }

  // 5. Strict FSAFEDS evaluation
  const evalResult = evaluateFsaEligibility({
    name: productName || "Vons Health Item",
    retailer: "Vons",
    explicitFsaBadge: hasFsaText,
    upc,
    productUrl: pageUrl,
    evidenceSourceUrl: pageUrl,
    evidenceNote: hasFsaText ? "Vons (Albertsons) verified FSA/HSA health catalog tag" : undefined
  });

  const sku = upc || `${Date.now()}`;
  const id = `vons-${sku}`;

  products.push({
    id,
    retailer: "Vons",
    name: productName || "Vons Health Product",
    category: evalResult.eligibility.category,
    currentPrice,
    regularPrice,
    unitPrice: unitPriceText,
    size: null,
    discountAmount,
    discountPercent,
    promoType,
    promoDetails,
    fsaEligible: evalResult.eligibility.fsaEligible,
    priceStatus: currentPrice !== null ? "confirmed" : "uncertain",
    isRecentDrop: false,
    lowestHistoricalPrice: currentPrice,
    imageUrl,
    productUrl: pageUrl,
    sourceType: "watchlist-page",
    observedAt: new Date().toISOString(),

    upc,
    sku,
    channel: "In-Store",
    membershipRequired: promoType === "Member Only" ? "Vons for U Club" : null,
    fsafedsCategory: evalResult.eligibility.category,
    documentationRequirement: evalResult.eligibility.documentationRequirement,
    eligibilityConfidence: evalResult.eligibility.confidence,
    eligibilityReviewStatus: evalResult.eligibility.reviewStatus,
    eligibilityEvidenceUrl: evalResult.eligibility.evidenceSourceUrl,
    eligibilityEvidenceNote: evalResult.eligibility.evidenceDescription,
    eligibilityVerifiedAt: evalResult.eligibility.verifiedAt
  });

  return products;
}

export async function fetchVonsProducts(
  urls: string[],
  options: FetchAdapterOptions = {}
): Promise<CollectionResult> {
  const products: ProductObservation[] = [];
  const structuredErrors: StructuredError[] = [];
  const limit = options.batchLimit || 3;
  const targetUrls = urls.slice(0, limit);

  for (const url of targetUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      if (response.status === 429) {
        structuredErrors.push({
          retailer: "Vons",
          statusCode: 429,
          url,
          message: "Vons HTTP 429: Rate limited",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Vons",
          products,
          success: products.length > 0,
          status: "rate_limited",
          errorMessage: "Vons HTTP 429: Rate limited",
          structuredErrors
        };
      }

      if (response.status === 403) {
        structuredErrors.push({
          retailer: "Vons",
          statusCode: 403,
          url,
          message: "Vons HTTP 403: Bot protection challenge",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Vons",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: "Vons HTTP 403: Bot protection challenge",
          structuredErrors
        };
      }

      const html = await response.text();
      const extracted = parseVonsHtml(html, url);
      products.push(...extracted);
    } catch (err: any) {
      if (err.message && err.message.includes("WAF_BLOCKED")) {
        structuredErrors.push({
          retailer: "Vons",
          statusCode: 403,
          url,
          message: err.message,
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Vons",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: err.message,
          structuredErrors
        };
      }

      structuredErrors.push({
        retailer: "Vons",
        statusCode: "FETCH_ERROR",
        url,
        message: err.message || "Failed to fetch Vons URL",
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    retailer: "Vons",
    products,
    success: products.length > 0,
    status: products.length > 0 ? "success" : "error",
    errorMessage: products.length > 0 ? null : "No products could be extracted from Vons watchlist URLs.",
    structuredErrors
  };
}
