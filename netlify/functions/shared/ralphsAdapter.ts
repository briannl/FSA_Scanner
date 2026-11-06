import * as cheerio from "cheerio";
import { ProductObservation, PromoType } from "../../../src/types/product";
import { CollectionResult, FetchAdapterOptions, StructuredError } from "./types";
import { evaluateFsaEligibility } from "../../../src/services/eligibilityEngine";

export function parseRalphsHtml(html: string, pageUrl: string = "https://www.ralphs.com"): ProductObservation[] {
  const $ = cheerio.load(html);
  const products: ProductObservation[] = [];

  // 1. Detect PerimeterX / Bot Challenge
  const title = $("title").text().toLowerCase();
  if (
    title.includes("access denied") ||
    title.includes("human verification") ||
    html.includes("perimeterx") ||
    html.includes("px-captcha")
  ) {
    throw new Error("WAF_BLOCKED: Ralphs (Kroger) PerimeterX bot challenge detected");
  }

  // Extract UPC from URL (e.g., /p/brand-name/0004126038104)
  const upcMatch = pageUrl.match(/\/p\/[^/]+\/(\d{10,14})/);
  const upc = upcMatch ? upcMatch[1] : null;

  // 2. Check for FSA/HSA attribute on Ralphs page
  const hasFsaText =
    html.includes("FSA/HSA Eligible") ||
    html.includes("FSA or HSA eligible") ||
    html.includes("FSA Eligible") ||
    $("[data-qa*='fsa'], .fsa-tag, .fsa-eligible").length > 0;

  // 3. Extract via JSON-LD if present
  let productName = $("h1, [data-qa='product-title']").first().text().trim();
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

  // 4. Fallback DOM extraction
  const parseAmount = (txt: string): number | null => {
    if (!txt) return null;
    const m = txt.replace(/,/g, "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
    return m ? parseFloat(m[1]) : null;
  };

  if (!currentPrice) {
    const promoPriceText = $("[data-qa='cart-page-item-unit-price'], .kds-Price--promotional, [data-qa='product-price']")
      .first()
      .text()
      .trim();
    currentPrice = parseAmount(promoPriceText);
  }

  const regularPriceText = $(
    ".kds-Price--strike, [data-qa='cart-page-item-regular-price'], .kds-Price--regular"
  ).first().text().trim();
  regularPrice = parseAmount(regularPriceText) || currentPrice;

  const unitPriceEl = $("[data-qa='product-price-per-unit'], .kds-Price-perUnit").first().text().trim();
  if (unitPriceEl) unitPriceText = unitPriceEl;

  if (!imageUrl) {
    imageUrl = $("img.ProductImage-image, [data-qa='product-image']").first().attr("src") || null;
  }

  // 5. Ralphs Card & Promo Detection
  let promoType: PromoType = "None";
  let promoDetails: string | null = null;
  let discountAmount = 0;
  let discountPercent = 0;

  const cardSavingsBadge = $("[data-qa='product-savings-badge'], .kds-Badge--promotion").first().text().trim();
  if (regularPrice && currentPrice && regularPrice > currentPrice) {
    discountAmount = +(regularPrice - currentPrice).toFixed(2);
    discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
    promoType = cardSavingsBadge.includes("Card") ? "Member Only" : "Standard Markdown";
    promoDetails = cardSavingsBadge || `Save $${discountAmount.toFixed(2)} with Ralphs Rewards Card`;
  }

  // 6. Strict FSAFEDS evaluation
  const evalResult = evaluateFsaEligibility({
    name: productName || "Ralphs Health Item",
    retailer: "Ralphs",
    explicitFsaBadge: hasFsaText,
    upc,
    productUrl: pageUrl,
    evidenceSourceUrl: pageUrl,
    evidenceNote: hasFsaText ? "Ralphs verified FSA/HSA health catalog tag" : undefined
  });

  const sku = upc || `${Date.now()}`;
  const id = `ralphs-${sku}`;

  products.push({
    id,
    retailer: "Ralphs",
    name: productName || "Ralphs Product",
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
    membershipRequired: promoType === "Member Only" ? "Ralphs Rewards Card" : null,
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

export async function fetchRalphsProducts(
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
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (response.status === 429) {
        structuredErrors.push({
          retailer: "Ralphs",
          statusCode: 429,
          url,
          message: "Ralphs HTTP 429: Rate limited",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Ralphs",
          products,
          success: products.length > 0,
          status: "rate_limited",
          errorMessage: "Ralphs HTTP 429: Rate limited",
          structuredErrors
        };
      }

      if (response.status === 403) {
        structuredErrors.push({
          retailer: "Ralphs",
          statusCode: 403,
          url,
          message: "Ralphs HTTP 403: Bot protection challenge",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Ralphs",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: "Ralphs HTTP 403: Bot protection challenge",
          structuredErrors
        };
      }

      const html = await response.text();
      const extracted = parseRalphsHtml(html, url);
      products.push(...extracted);
    } catch (err: any) {
      if (err.message && err.message.includes("WAF_BLOCKED")) {
        structuredErrors.push({
          retailer: "Ralphs",
          statusCode: 403,
          url,
          message: err.message,
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Ralphs",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: err.message,
          structuredErrors
        };
      }

      structuredErrors.push({
        retailer: "Ralphs",
        statusCode: "FETCH_ERROR",
        url,
        message: err.message || "Failed to fetch Ralphs URL",
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    retailer: "Ralphs",
    products,
    success: products.length > 0,
    status: products.length > 0 ? "success" : "error",
    errorMessage: products.length > 0 ? null : "No products could be extracted from Ralphs watchlist URLs.",
    structuredErrors
  };
}
