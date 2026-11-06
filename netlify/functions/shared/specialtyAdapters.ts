import * as cheerio from "cheerio";
import { ProductObservation, PromoType } from "../../../src/types/product";
import { evaluateFsaEligibility } from "../../../src/services/eligibilityEngine";

export interface ManualImportEntry {
  retailer: "H Mart" | "99 Ranch" | "Smart & Final" | "Trader Joe's";
  name: string;
  upc: string;
  sku?: string;
  price: number;
  regularPrice?: number | null;
  unitPrice?: string | null;
  size?: string | null;
  productUrl: string;
  imageUrl?: string | null;
  verificationEvidenceNote: string;
  channel?: "In-Store" | "Online" | "Delivery";
}

/**
 * Parses and verifies manual import entries for specialty retailers (H Mart, 99 Ranch, Trader Joe's).
 * Strictly enforces that grocery/food items are rejected and that physical medical evidence exists.
 */
export function processManualSpecialtyImport(entries: ManualImportEntry[]): ProductObservation[] {
  const verifiedProducts: ProductObservation[] = [];

  for (const entry of entries) {
    const evalResult = evaluateFsaEligibility({
      name: entry.name,
      retailer: entry.retailer,
      upc: entry.upc,
      sku: entry.sku,
      productUrl: entry.productUrl,
      evidenceNote: entry.verificationEvidenceNote
    });

    // Only admit if strictly feed-eligible under FSAFEDS rules
    if (!evalResult.isFeedEligible) {
      continue;
    }

    const price = entry.price;
    const regularPrice = entry.regularPrice || price;
    let discountAmount = 0;
    let discountPercent = 0;
    let promoType: PromoType = "None";

    if (regularPrice > price) {
      discountAmount = +(regularPrice - price).toFixed(2);
      discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
      promoType = "Standard Markdown";
    }

    const prefix = entry.retailer.toLowerCase().replace(/[^a-z0-9]/g, "");
    const id = `${prefix}-${entry.upc}`;

    verifiedProducts.push({
      id,
      retailer: entry.retailer,
      name: entry.name,
      category: evalResult.eligibility.category,
      currentPrice: price,
      regularPrice,
      unitPrice: entry.unitPrice || null,
      size: entry.size || null,
      discountAmount,
      discountPercent,
      promoType,
      promoDetails: discountAmount > 0 ? `Save $${discountAmount.toFixed(2)}` : null,
      fsaEligible: true,
      priceStatus: "confirmed",
      isRecentDrop: false,
      lowestHistoricalPrice: price,
      imageUrl: entry.imageUrl || null,
      productUrl: entry.productUrl,
      sourceType: "manual-import",
      observedAt: new Date().toISOString(),

      upc: entry.upc,
      sku: entry.sku || entry.upc,
      channel: entry.channel || "In-Store",
      fsafedsCategory: evalResult.eligibility.category,
      documentationRequirement: evalResult.eligibility.documentationRequirement,
      eligibilityConfidence: evalResult.eligibility.confidence,
      eligibilityReviewStatus: evalResult.eligibility.reviewStatus,
      eligibilityEvidenceUrl: entry.productUrl,
      eligibilityEvidenceNote: entry.verificationEvidenceNote,
      eligibilityVerifiedAt: new Date().toISOString()
    });
  }

  return verifiedProducts;
}

/**
 * Smart & Final Watched URL Parser
 */
export function parseSmartAndFinalHtml(
  html: string,
  pageUrl: string = "https://www.smartandfinal.com"
): ProductObservation[] {
  const $ = cheerio.load(html);
  const products: ProductObservation[] = [];

  const productName = $("h1, .product-title, [data-qa='pdp-title']").first().text().trim();
  if (!productName) return products;

  const parseAmount = (txt: string): number | null => {
    if (!txt) return null;
    const m = txt.replace(/,/g, "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
    return m ? parseFloat(m[1]) : null;
  };

  const currentPriceText = $(".price, .product-price, [data-qa='pdp-price']").first().text().trim();
  const regularPriceText = $(".regular-price, .was-price, .strike-price").first().text().trim();
  const unitPriceText = $(".price-per-unit, .unit-price").first().text().trim();
  const upcMatch = pageUrl.match(/\/(\d{10,14})/) || html.match(/"upc":\s*"(\d+)"/);
  const upc = upcMatch ? upcMatch[1] : null;

  const currentPrice = parseAmount(currentPriceText);
  const regularPrice = parseAmount(regularPriceText) || currentPrice;

  const hasFsaText =
    html.includes("FSA Eligible") ||
    html.includes("FSA/HSA") ||
    html.includes("HSA Eligible");

  const evalResult = evaluateFsaEligibility({
    name: productName,
    retailer: "Smart & Final",
    explicitFsaBadge: hasFsaText,
    upc,
    productUrl: pageUrl,
    evidenceNote: hasFsaText ? "Smart & Final verified FSA catalog item" : undefined
  });

  if (!evalResult.isFeedEligible) return products;

  let discountAmount = 0;
  let discountPercent = 0;
  let promoType: PromoType = "None";

  if (regularPrice && currentPrice && regularPrice > currentPrice) {
    discountAmount = +(regularPrice - currentPrice).toFixed(2);
    discountPercent = +((discountAmount / regularPrice) * 100).toFixed(1);
    promoType = "Standard Markdown";
  }

  const id = `smartfinal-${upc || Date.now()}`;

  products.push({
    id,
    retailer: "Smart & Final",
    name: productName,
    category: evalResult.eligibility.category,
    currentPrice,
    regularPrice,
    unitPrice: unitPriceText || null,
    size: null,
    discountAmount,
    discountPercent,
    promoType,
    promoDetails: discountAmount > 0 ? `Save $${discountAmount.toFixed(2)}` : null,
    fsaEligible: true,
    priceStatus: currentPrice !== null ? "confirmed" : "uncertain",
    isRecentDrop: false,
    lowestHistoricalPrice: currentPrice,
    imageUrl: $("meta[property='og:image']").attr("content") || null,
    productUrl: pageUrl,
    sourceType: "watchlist-page",
    observedAt: new Date().toISOString(),

    upc,
    channel: "In-Store",
    fsafedsCategory: evalResult.eligibility.category,
    documentationRequirement: evalResult.eligibility.documentationRequirement,
    eligibilityConfidence: evalResult.eligibility.confidence,
    eligibilityReviewStatus: evalResult.eligibility.reviewStatus,
    eligibilityEvidenceUrl: pageUrl,
    eligibilityEvidenceNote: evalResult.eligibility.evidenceDescription,
    eligibilityVerifiedAt: evalResult.eligibility.verifiedAt
  });

  return products;
}
