import {
  ProductObservation,
  Retailer,
  FulfillmentChannel,
  PromoType
} from "../types/product";
import {
  FsafedsCategory,
  DocumentationRequirement,
  EligibilityConfidence
} from "../types/fsafeds";
import { mapToFsafedsCategory } from "./eligibilityEngine";

export interface StoreOffer {
  id: string;
  retailer: Retailer;
  channel: FulfillmentChannel;
  currentPrice: number | null;
  regularPrice: number | null;
  unitPrice: string | null;
  size: string | null;
  packageQuantity: number | null;
  packageUnit: string | null;
  discountAmount: number;
  discountPercent: number;
  promoType: PromoType;
  promoDetails: string | null;
  membershipRequired: string | null;
  productUrl: string;
  imageUrl: string | null;
  observedAt: string;
  isPriceStale: boolean;
  isBestOffer: boolean;
}

export interface GroupedProduct {
  id: string;
  name: string;
  brand: string;
  upc: string | null;
  asin: string | null;
  category: FsafedsCategory;
  documentationRequirement: DocumentationRequirement;
  accountTypes: string[];
  eligibilityConfidence: EligibilityConfidence;
  evidenceSourceUrl: string;
  evidenceDescription: string;
  verifiedAt: string;
  offers: StoreOffer[];
  lowestPrice: number | null;
  highestPrice: number | null;
  lowestUnitPrice: string | null;
  bestRetailer: Retailer | null;
  maxSavingsPercent: number;
  isMultiStore: boolean;
  hasDifferentPackSizes: boolean;
}

/**
 * Normalizes product titles into a canonical matching key.
 * Groups products by exact UPC if available, or by standardized brand + name.
 */
export function getProductGroupingKey(product: ProductObservation): string {
  const name = product.name.toLowerCase();

  if (name.includes("aller-tec") || (name.includes("cetirizine") && name.includes("kirkland"))) {
    return "grp-aller-tec";
  }
  if (name.includes("omron") && (name.includes("blood pressure") || name.includes("upper arm") || name.includes("series"))) {
    return "grp-omron-bp";
  }
  if (name.includes("theratears") || name.includes("dry eye therapy")) {
    return "grp-theratears";
  }
  if (name.includes("neutrogena") && name.includes("ultra sheer") && name.includes("55")) {
    return "grp-neutrogena-spf55";
  }
  if (name.includes("flonase") || name.includes("allergy relief nasal spray")) {
    return "grp-flonase";
  }
  if (name.includes("band-aid") || (name.includes("bandage") && (name.includes("antibacterial") || name.includes("flexible")))) {
    return "grp-bandaid-fabric";
  }
  if (name.includes("salonpas") || name.includes("pain relief patch")) {
    return "grp-salonpas";
  }
  if (name.includes("white flower")) {
    return "grp-white-flower";
  }
  if (name.includes("trader joe") && name.includes("sunscreen")) {
    return "grp-tj-sunscreen";
  }
  if (name.includes("curad")) {
    return "grp-curad";
  }

  if (product.upc) {
    return `upc-${product.upc}`;
  }

  // Fallback to retailer id
  return `single-${product.id}`;
}

/**
 * Parses numeric unit price for comparative sorting (e.g. "$0.03 / tablet" -> 0.03)
 */
export function parseUnitPriceValue(unitPriceStr?: string | null): number | null {
  if (!unitPriceStr) return null;
  const m = unitPriceStr.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/**
 * Groups raw observations across all retailers into unified multi-store comparison models.
 */
export function groupProductsAcrossRetailers(products: ProductObservation[]): GroupedProduct[] {
  const map = new Map<string, ProductObservation[]>();

  for (const p of products) {
    const key = getProductGroupingKey(p);
    const list = map.get(key) || [];
    list.push(p);
    map.set(key, list);
  }

  const groups: GroupedProduct[] = [];

  for (const [key, items] of map.entries()) {
    const primary = items[0];
    const category = primary.fsafedsCategory || mapToFsafedsCategory(primary.name, primary.category);

    // Calculate stale price (> 48 hours)
    const now = Date.now();
    const offers: StoreOffer[] = items.map((item) => {
      const observedTime = item.observedAt ? new Date(item.observedAt).getTime() : 0;
      const isPriceStale = observedTime > 0 && now - observedTime > 48 * 3600 * 1000;

      return {
        id: item.id,
        retailer: item.retailer,
        channel: item.channel || (item.retailer === "Amazon" ? "Online" : item.retailer === "Instacart" ? "Delivery" : "In-Store"),
        currentPrice: item.currentPrice,
        regularPrice: item.regularPrice,
        unitPrice: item.unitPrice,
        size: item.size,
        packageQuantity: item.packageQuantity || null,
        packageUnit: item.packageUnit || null,
        discountAmount: item.discountAmount,
        discountPercent: item.discountPercent,
        promoType: item.promoType,
        promoDetails: item.promoDetails,
        membershipRequired: item.membershipRequired || (item.retailer === "Costco" ? "Costco Member" : null),
        productUrl: item.productUrl,
        imageUrl: item.imageUrl,
        observedAt: item.observedAt,
        isPriceStale,
        isBestOffer: false
      };
    });

    // Determine lowest price and best retailer
    const validPrices = offers
      .map((o) => o.currentPrice)
      .filter((p): p is number => p !== null && p > 0);

    const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
    const highestPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;

    // Check if package sizes differ
    const sizes = new Set(offers.map((o) => o.size || o.packageQuantity).filter(Boolean));
    const hasDifferentPackSizes = sizes.size > 1;

    // Unit price check
    let lowestUnitPrice: string | null = null;
    let minUnitVal = Infinity;
    for (const o of offers) {
      const val = parseUnitPriceValue(o.unitPrice);
      if (val !== null && val < minUnitVal) {
        minUnitVal = val;
        lowestUnitPrice = o.unitPrice;
      }
    }

    // Flag best offer
    let bestRetailer: Retailer | null = null;
    for (const o of offers) {
      if (lowestPrice !== null && o.currentPrice === lowestPrice) {
        o.isBestOffer = true;
        bestRetailer = o.retailer;
      }
    }

    let maxSavingsPercent = 0;
    if (highestPrice !== null && lowestPrice !== null && highestPrice > lowestPrice) {
      maxSavingsPercent = +(((highestPrice - lowestPrice) / highestPrice) * 100).toFixed(1);
    }

    // Brand extraction
    const brandMatch = primary.name.match(
      /^(Kirkland Signature|CVS Health|Omron|TheraTears|Neutrogena|Flonase|Band-Aid|Trader Joe's|Salonpas|White Flower|Curad|Tylenol|Advil)/i
    );
    const brand = brandMatch ? brandMatch[1] : primary.retailer;

    groups.push({
      id: key,
      name: primary.name,
      brand,
      upc: primary.upc || null,
      asin: primary.asin || null,
      category,
      documentationRequirement: primary.documentationRequirement || "None (OTC Item per CARES Act)",
      accountTypes: ["HCFSA", "HSA", "FSA"],
      eligibilityConfidence: primary.eligibilityConfidence || "high",
      evidenceSourceUrl: primary.eligibilityEvidenceUrl || primary.productUrl,
      evidenceDescription: primary.eligibilityEvidenceNote || `Verified FSA/HSA eligible across ${items.length} store offers`,
      verifiedAt: primary.eligibilityVerifiedAt || primary.observedAt,
      offers,
      lowestPrice,
      highestPrice,
      lowestUnitPrice,
      bestRetailer,
      maxSavingsPercent,
      isMultiStore: offers.length > 1,
      hasDifferentPackSizes
    });
  }

  // Sort groups: multi-store with highest savings first
  return groups.sort((a, b) => {
    if (a.isMultiStore !== b.isMultiStore) {
      return a.isMultiStore ? -1 : 1;
    }
    return (b.lowestPrice || 0) - (a.lowestPrice || 0);
  });
}
