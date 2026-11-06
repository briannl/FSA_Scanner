import {
  FsafedsCategory,
  DocumentationRequirement,
  EligibilityConfidence,
  ReviewStatus
} from "./fsafeds";

export type Retailer =
  | "CVS"
  | "Costco"
  | "Amazon"
  | "Ralphs"
  | "Vons"
  | "Instacart"
  | "H Mart"
  | "99 Ranch"
  | "Smart & Final"
  | "Trader Joe's";

export type RetailerCapability =
  | "automatic-discovery"
  | "watched-urls-only"
  | "manual-import"
  | "manual-verification-only"
  | "unavailable";

export type FulfillmentChannel = "In-Store" | "Online" | "Delivery";

export interface RetailerCapabilityMeta {
  retailer: Retailer;
  capability: RetailerCapability;
  description: string;
  approvedDataFeed: string;
  restrictions: string;
}

export const RETAILER_REGISTRY: Record<Retailer, RetailerCapabilityMeta> = {
  CVS: {
    retailer: "CVS",
    capability: "watched-urls-only",
    description: "CVS Pharmacy e-commerce and weekly ad promotions with explicit FSA/HSA badge indicators.",
    approvedDataFeed: "Weekly Circular API & Schema.org product detail microdata.",
    restrictions: "Protected by Akamai Bot Manager; requires circuit breaker on HTTP 403."
  },
  Costco: {
    retailer: "Costco",
    capability: "watched-urls-only",
    description: "Costco Wholesale instant savings & member healthcare catalog with FSA eligibility flags.",
    approvedDataFeed: "Costco Product Detail JSON & warehouse instant savings flyers.",
    restrictions: "Aggressive rate limits; circuit breaker halts immediately on HTTP 429."
  },
  Amazon: {
    retailer: "Amazon",
    capability: "watched-urls-only",
    description: "Amazon FSA Store with explicit 'FSA or HSA eligible' product attributes and ASIN tracking.",
    approvedDataFeed: "Product Advertising API (PAAPI 5.0) & verified ASIN product page microdata.",
    restrictions: "Heavy bot detection; catalog-wide scraping blocked. Watched ASINs and verified fixtures supported."
  },
  Ralphs: {
    retailer: "Ralphs",
    capability: "watched-urls-only",
    description: "Ralphs (Kroger Co.) grocery & pharmacy with digital coupons and Ralphs Rewards card pricing.",
    approvedDataFeed: "Kroger Developer API (OAuth 2.0 Product Catalog) & public product endpoints.",
    restrictions: "Store-specific geolocation and pricing; requires store ID/ZIP configuration."
  },
  Vons: {
    retailer: "Vons",
    capability: "watched-urls-only",
    description: "Vons (Albertsons Companies) pharmacy & health aisle with 'for U' club savings.",
    approvedDataFeed: "Albertsons Digital Platform Catalog & in-store verified UPC pricing.",
    restrictions: "Akamai bot management; local store pricing varies by delivery zip code."
  },
  Instacart: {
    retailer: "Instacart",
    capability: "automatic-discovery",
    description: "Instacart dedicated FSA/HSA curated aisle discovering eligible items across local partner grocers.",
    approvedDataFeed: "Instacart Public Catalog Discovery endpoints & curated FSA badge listings.",
    restrictions: "Delivery markup and service fee adjustments apply; prices reflect local delivery catalog."
  },
  "H Mart": {
    retailer: "H Mart",
    capability: "manual-import",
    description: "H Mart Asian supermarket carrying select FDA-registered OTC healthcare items (Tiger Balm, Salonpas, cooling sheets).",
    approvedDataFeed: "Manual CSV/JSON import and watched product URLs.",
    restrictions: "No public FSA API; items must be individually checked for US FDA NDC / FSA eligibility."
  },
  "99 Ranch": {
    retailer: "99 Ranch",
    capability: "manual-import",
    description: "99 Ranch Market carrying select medicated oils, bandages, and topical analgesics.",
    approvedDataFeed: "Manual CSV/JSON import and watched product URLs.",
    restrictions: "E-commerce platform has limited structured health metadata; manual verification required."
  },
  "Smart & Final": {
    retailer: "Smart & Final",
    capability: "watched-urls-only",
    description: "Smart & Final warehouse grocery carrying commercial and bulk first-aid and OTC headache relief.",
    approvedDataFeed: "Smart & Final online storefront & Instacart partner catalog.",
    restrictions: "Limited online OTC variety; watched URLs only."
  },
  "Trader Joe's": {
    retailer: "Trader Joe's",
    capability: "manual-verification-only",
    description: "Trader Joe's neighborhood grocery. Carries select private-label OTC items (e.g., hand sanitizer, sunscreen).",
    approvedDataFeed: "Strict in-store manual receipt and shelf tag audit.",
    restrictions: "No e-commerce or delivery API exists. Never scraped or automatically refreshed."
  }
};

export type PromoType =
  | "Standard Markdown"
  | "Costco Instant Savings"
  | "CVS Promo"
  | "Multi-Buy"
  | "Coupon Only"
  | "Member Only"
  | "None";

export type PriceStatus = "confirmed" | "uncertain" | "unavailable";

export type SourceType =
  | "catalog-api"
  | "watchlist-page"
  | "manual-import"
  | "fixture"
  | "github-actions"
  | "local-playwright"
  | "bookmarklet"
  | "netlify-cron";

export interface ProductObservation {
  id: string; // Stable identifier (e.g. "cvs-108201", "costco-100412345", "amzn-B07S27NVQW", "ralphs-0004126038104")
  retailer: Retailer;
  name: string;
  category: string; // Legacy / raw category
  currentPrice: number | null;
  regularPrice: number | null;
  unitPrice: string | null;
  size: string | null;
  discountAmount: number; // 0 if no verified reference price
  discountPercent: number; // 0 if no verified reference price; NEVER calculate a percentage without a trustworthy regularPrice
  promoType: PromoType;
  promoDetails: string | null;
  fsaEligible: boolean;
  priceStatus: PriceStatus;
  isRecentDrop: boolean;
  lowestHistoricalPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  sourceType: SourceType;
  observedAt: string; // ISO-8601 timestamp string

  // Extended FSAFEDS & Multi-Retailer Fields
  upc?: string | null;
  asin?: string | null;
  sku?: string | null;
  brand?: string | null;
  packageQuantity?: number | null;
  packageUnit?: string | null;
  channel?: FulfillmentChannel;
  membershipRequired?: string | null; // e.g. "Costco Member", "Ralphs Rewards Card"
  fsafedsCategory?: FsafedsCategory;
  documentationRequirement?: DocumentationRequirement;
  eligibilityConfidence?: EligibilityConfidence;
  eligibilityReviewStatus?: ReviewStatus;
  eligibilityEvidenceUrl?: string;
  eligibilityEvidenceNote?: string;
  eligibilityVerifiedAt?: string;
  isPriceStale?: boolean; // Flagged if price older than 48 hours
  isEligibilityStale?: boolean; // Flagged if verification older than 90 days
}

export interface PricePoint {
  date: string;
  price: number | null;
  priceStatus: PriceStatus;
  promoType?: PromoType;
  promoDetails?: string | null;
}

export interface ProductPriceHistory {
  productId: string;
  retailer: Retailer;
  history: PricePoint[];
}

export interface StructuredError {
  retailer: Retailer;
  statusCode: number | string;
  url: string;
  message: string;
  retryAfter?: number | null;
  timestamp?: string;
}

export interface RetailerStatus {
  lastAttempt: string | null;
  lastSuccess: string | null;
  status: "idle" | "success" | "error" | "rate_limited" | "blocked_waf";
  itemCount: number;
  errorMessage: string | null;
  diagnosticDetails?: string | null;
  structuredErrors?: StructuredError[];
  lastSourceType?: SourceType;
}

export interface TrackerStatus {
  cvs: RetailerStatus;
  costco: RetailerStatus;
  amazon?: RetailerStatus;
  ralphs?: RetailerStatus;
  vons?: RetailerStatus;
  instacart?: RetailerStatus;
  hmart?: RetailerStatus;
  ranch99?: RetailerStatus;
  smartfinal?: RetailerStatus;
  traderjoes?: RetailerStatus;
  updatedAt: string;
  [key: string]: RetailerStatus | string | undefined;
}

export interface ProductsApiResponse {
  products: ProductObservation[];
  histories: Record<string, PricePoint[]>;
  status: TrackerStatus;
  watchlist: string[];
}
