import * as cheerio from "cheerio";
import { ProductObservation, PromoType } from "../../../src/types/product";
import { CollectionResult, FetchAdapterOptions, StructuredError } from "./types";
import { evaluateFsaEligibility } from "../../../src/services/eligibilityEngine";

export interface InstacartRawItem {
  id: string;
  name: string;
  price: number;
  regularPrice?: number | null;
  unitPrice?: string | null;
  imageUrl?: string | null;
  productUrl: string;
  partnerStore: string;
  upc?: string | null;
  fsaBadgeText?: string | null;
}

export function parseInstacartAisle(
  payload: string | { items: InstacartRawItem[] },
  hubUrl: string = "https://www.instacart.com/store/hub/fsa-hsa"
): ProductObservation[] {
  const products: ProductObservation[] = [];

  let rawItems: InstacartRawItem[] = [];

  if (typeof payload === "string") {
    // Check if JSON or HTML
    const trimmed = payload.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        rawItems = Array.isArray(parsed) ? parsed : parsed.items || [];
      } catch {
        // Fall back to cheerio HTML
      }
    }

    if (rawItems.length === 0) {
      const $ = cheerio.load(payload);

      // Check for Instacart bot / Cloudflare block
      const pageTitle = $("title").text().toLowerCase();
      if (pageTitle.includes("attention required") || pageTitle.includes("security check")) {
        throw new Error("WAF_BLOCKED: Instacart Cloudflare bot challenge detected");
      }

      $("[data-testid*='item-card'], .item-card, [aria-label*='eligible']").each((_, el) => {
        const card = $(el);
        const name = card.find("[data-testid*='item-title'], h3, .item-name").first().text().trim();
        const priceText = card.find("[data-testid*='price'], .price").first().text().trim();
        const regText = card.find(".strike-price, .regular-price").first().text().trim();
        const unitText = card.find(".price-per-unit, .unit-price").first().text().trim();
        const fsaBadge = card.find(".fsa-badge, [aria-label*='FSA'], :contains('FSA/HSA')").text().trim();
        const link = card.find("a").first().attr("href") || "";
        const img = card.find("img").first().attr("src") || null;

        const parseAmt = (txt: string) => {
          const m = txt.replace(/,/g, "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
          return m ? parseFloat(m[1]) : null;
        };

        const price = parseAmt(priceText);
        if (name && price !== null) {
          rawItems.push({
            id: `instacart-${rawItems.length + 1}`,
            name,
            price,
            regularPrice: parseAmt(regText) || price,
            unitPrice: unitText || null,
            imageUrl: img,
            productUrl: link.startsWith("http") ? link : `https://www.instacart.com${link}`,
            partnerStore: "Instacart Local Partner",
            fsaBadgeText: fsaBadge || "FSA/HSA Eligible"
          });
        }
      });
    }
  } else if (payload && Array.isArray(payload.items)) {
    rawItems = payload.items;
  }

  for (const item of rawItems) {
    const hasExplicitFsa = Boolean(
      item.fsaBadgeText &&
      (item.fsaBadgeText.toLowerCase().includes("fsa") || item.fsaBadgeText.toLowerCase().includes("hsa"))
    );

    const evalResult = evaluateFsaEligibility({
      name: item.name,
      retailer: "Instacart",
      explicitFsaBadge: hasExplicitFsa,
      upc: item.upc,
      productUrl: item.productUrl,
      evidenceSourceUrl: hubUrl,
      evidenceNote: "Discovered on Instacart verified FSA/HSA catalog aisle"
    });

    let discountAmount = 0;
    let discountPercent = 0;
    let promoType: PromoType = "None";
    let promoDetails: string | null = null;

    if (item.regularPrice && item.regularPrice > item.price) {
      discountAmount = +(item.regularPrice - item.price).toFixed(2);
      discountPercent = +((discountAmount / item.regularPrice) * 100).toFixed(1);
      promoType = "Standard Markdown";
      promoDetails = `Save $${discountAmount.toFixed(2)} on Instacart delivery`;
    }

    products.push({
      id: item.id.startsWith("instacart-") ? item.id : `instacart-${item.id}`,
      retailer: "Instacart",
      name: item.name,
      category: evalResult.eligibility.category,
      currentPrice: item.price,
      regularPrice: item.regularPrice || item.price,
      unitPrice: item.unitPrice || null,
      size: null,
      discountAmount,
      discountPercent,
      promoType,
      promoDetails,
      fsaEligible: evalResult.eligibility.fsaEligible,
      priceStatus: item.price !== null ? "confirmed" : "uncertain",
      isRecentDrop: false,
      lowestHistoricalPrice: item.price,
      imageUrl: item.imageUrl || null,
      productUrl: item.productUrl,
      sourceType: "catalog-api",
      observedAt: new Date().toISOString(),

      upc: item.upc || null,
      channel: "Delivery",
      fsafedsCategory: evalResult.eligibility.category,
      documentationRequirement: evalResult.eligibility.documentationRequirement,
      eligibilityConfidence: evalResult.eligibility.confidence,
      eligibilityReviewStatus: evalResult.eligibility.reviewStatus,
      eligibilityEvidenceUrl: evalResult.eligibility.evidenceSourceUrl,
      eligibilityEvidenceNote: evalResult.eligibility.evidenceDescription,
      eligibilityVerifiedAt: evalResult.eligibility.verifiedAt
    });
  }

  return products;
}

export async function fetchInstacartProducts(
  hubUrls: string[] = ["https://www.instacart.com/store/hub/fsa-hsa"],
  options: FetchAdapterOptions = {}
): Promise<CollectionResult> {
  const products: ProductObservation[] = [];
  const structuredErrors: StructuredError[] = [];

  for (const url of hubUrls.slice(0, options.batchLimit || 2)) {
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
          retailer: "Instacart",
          statusCode: 429,
          url,
          message: "Instacart HTTP 429: Rate limited",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Instacart",
          products,
          success: products.length > 0,
          status: "rate_limited",
          errorMessage: "Instacart HTTP 429: Rate limited",
          structuredErrors
        };
      }

      if (response.status === 403) {
        structuredErrors.push({
          retailer: "Instacart",
          statusCode: 403,
          url,
          message: "Instacart HTTP 403: Bot protection challenge",
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Instacart",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: "Instacart HTTP 403: Bot protection challenge",
          structuredErrors
        };
      }

      const text = await response.text();
      const extracted = parseInstacartAisle(text, url);
      products.push(...extracted);
    } catch (err: any) {
      if (err.message && err.message.includes("WAF_BLOCKED")) {
        structuredErrors.push({
          retailer: "Instacart",
          statusCode: 403,
          url,
          message: err.message,
          timestamp: new Date().toISOString()
        });
        return {
          retailer: "Instacart",
          products,
          success: products.length > 0,
          status: "blocked_waf",
          errorMessage: err.message,
          structuredErrors
        };
      }

      structuredErrors.push({
        retailer: "Instacart",
        statusCode: "FETCH_ERROR",
        url,
        message: err.message || "Failed to fetch Instacart URL",
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    retailer: "Instacart",
    products,
    success: products.length > 0,
    status: products.length > 0 ? "success" : "error",
    errorMessage: products.length > 0 ? null : "No items extracted from Instacart FSA aisle.",
    structuredErrors
  };
}
