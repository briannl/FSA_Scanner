import * as cheerio from "cheerio";
import { ProductObservation, PromoType } from "../../../src/types/product";
import { CollectionResult, FetchAdapterOptions, StructuredError } from "./types";
import { evaluateFsaEligibility } from "../../../src/services/eligibilityEngine";

export function parseAmazonHtml(html: string, pageUrl: string = "https://www.amazon.com"): ProductObservation[] {
  const $ = cheerio.load(html);
  const products: ProductObservation[] = [];

  // 1. Detect Amazon Bot Guard / Captcha / Access Denied
  const title = $("title").text().toLowerCase();
  if (
    title.includes("robot check") ||
    title.includes("captcha") ||
    html.includes("Enter the characters you see below") ||
    html.includes("automated access to Amazon")
  ) {
    throw new Error("WAF_BLOCKED: Amazon bot challenge / captcha page detected");
  }

  // Extract ASIN from URL (e.g. /dp/B07S27NVQW or /product/B07S27NVQW)
  const asinMatch = pageUrl.match(/(?:\/dp\/|\/product\/|\/gp\/product\/)([A-Z0-9]{10})/i);
  const asin = asinMatch ? asinMatch[1].toUpperCase() : null;

  // 2. Check for explicit FSA/HSA eligibility badge
  // Amazon renders an explicit badge element or text: "FSA or HSA eligible"
  const fsaBadgeText = $(
    "#fsaHsaEligibility, #fsa-badge, .fsa-badge, [data-feature-name='fsaHsaEligibility']"
  ).text().trim();
  const hasFsaTextInBody =
    html.includes("FSA or HSA eligible") ||
    html.includes("FSA/HSA eligible") ||
    html.includes("Eligible for FSA/HSA");
  const hasExplicitFsaBadge = Boolean(fsaBadgeText || hasFsaTextInBody);

  // 3. Extract Product Name
  const productName =
    $("#productTitle").first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "Amazon Healthcare Product";

  // 4. Extract Price and Reference Price
  const parseAmount = (txt: string): number | null => {
    if (!txt) return null;
    const m = txt.replace(/,/g, "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
    return m ? parseFloat(m[1]) : null;
  };

  const offscreenPrice = $(".a-price .a-offscreen").first().text().trim();
  const currentPrice = parseAmount(offscreenPrice) || parseAmount($("#priceblock_ourprice, #priceblock_dealprice").text());

  // Basis / List / Regular price
  const basisPriceText = $(".basisPrice .a-offscreen, .a-text-price .a-offscreen, #listPrice").first().text().trim();
  let regularPrice = parseAmount(basisPriceText) || currentPrice;

  // Coupon / Promo details
  const couponText = $("#couponText, .couponBadge, [id*='coupon']").first().text().trim();
  let promoType: PromoType = "None";
  let promoDetails: string | null = null;
  let discountAmount = 0;
  let discountPercent = 0;

  if (regularPrice && currentPrice && regularPrice > currentPrice) {
    discountAmount = +(regularPrice - currentPrice).toFixed(2);
    discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
    promoType = "Standard Markdown";
    promoDetails = `Save $${discountAmount.toFixed(2)} on Amazon`;
  }

  if (couponText) {
    promoType = "Coupon Only";
    promoDetails = couponText;
  }

  // 5. Unit Price
  const unitPriceText = $(".pricePerUnit, .a-size-small.a-color-secondary:contains('/ Count'), :contains('/ Fl Oz')")
    .first()
    .text()
    .trim();

  // 6. Image
  const imageUrl = $("#landingImage, #imgBlkFront").attr("src") || $('meta[property="og:image"]').attr("content") || null;

  // 7. Strict FSAFEDS evaluation
  const evalResult = evaluateFsaEligibility({
    name: productName,
    retailer: "Amazon",
    explicitFsaBadge: hasExplicitFsaBadge,
    asin,
    productUrl: pageUrl,
    evidenceSourceUrl: pageUrl,
    evidenceNote: hasExplicitFsaBadge ? "Amazon verified FSA or HSA eligible product attribute" : undefined
  });

  const id = `amzn-${asin || Date.now()}`;

  products.push({
    id,
    retailer: "Amazon",
    name: productName,
    category: evalResult.eligibility.category,
    currentPrice,
    regularPrice,
    unitPrice: unitPriceText || null,
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

    asin,
    channel: "Online",
    membershipRequired: promoDetails?.toLowerCase().includes("prime") ? "Amazon Prime" : null,
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

export async function fetchAmazonProducts(
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
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (response.status === 429) {
        structuredErrors.push({
          retailer: "Amazon",
          statusCode: 429,
          url,
          message: "Amazon HTTP 429: Rate limited",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Amazon",
          products,
          success: products.length > 0,
          status: "rate_limited",
          errorMessage: "Amazon HTTP 429: Rate limited",
          structuredErrors
        };
      }

      if (response.status === 403 || response.status === 503) {
        structuredErrors.push({
          retailer: "Amazon",
          statusCode: response.status,
          url,
          message: `Amazon HTTP ${response.status}: Bot protection challenge`,
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Amazon",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: `Amazon HTTP ${response.status}: Bot protection challenge`,
          structuredErrors
        };
      }

      const html = await response.text();
      const extracted = parseAmazonHtml(html, url);
      products.push(...extracted);
    } catch (err: any) {
      if (err.message && err.message.includes("WAF_BLOCKED")) {
        structuredErrors.push({
          retailer: "Amazon",
          statusCode: 403,
          url,
          message: err.message,
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Amazon",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: err.message,
          structuredErrors
        };
      }

      structuredErrors.push({
        retailer: "Amazon",
        statusCode: "FETCH_ERROR",
        url,
        message: err.message || "Failed to fetch Amazon URL",
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    retailer: "Amazon",
    products,
    success: products.length > 0,
    status: products.length > 0 ? "success" : "error",
    errorMessage: products.length > 0 ? null : "No products could be extracted from Amazon watchlist URLs.",
    structuredErrors
  };
}
