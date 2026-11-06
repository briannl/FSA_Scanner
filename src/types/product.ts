export type Retailer = "CVS" | "Costco";

export type PromoType =
  | "Standard Markdown"
  | "Costco Instant Savings"
  | "CVS Promo"
  | "Multi-Buy"
  | "Coupon Only"
  | "None";

export type PriceStatus = "confirmed" | "uncertain" | "unavailable";

export type SourceType =
  | "catalog-api"
  | "watchlist-page"
  | "manual-import"
  | "fixture";

export interface ProductObservation {
  id: string; // Stable retailer identifier (e.g., "cvs-123456" or "costco-789012")
  retailer: Retailer;
  name: string;
  category: string; // e.g., "OTC Meds", "First Aid", "Sun Care", "Vision", "Diagnostic"
  currentPrice: number | null;
  regularPrice: number | null;
  unitPrice: string | null;
  size: string | null;
  discountAmount: number; // 0 if no verified reference price
  discountPercent: number; // 0 if no verified reference price; NEVER calculate a percentage without a trustworthy regularPrice
  promoType: PromoType;
  promoDetails: string | null; // flag coupons and multi-buy quantity limits separately from direct markdowns
  fsaEligible: boolean;
  priceStatus: PriceStatus;
  isRecentDrop: boolean; // true if currentPrice dropped compared to previous observation
  lowestHistoricalPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  sourceType: SourceType;
  observedAt: string; // ISO-8601 timestamp string
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
}

export interface TrackerStatus {
  cvs: RetailerStatus;
  costco: RetailerStatus;
  updatedAt: string;
}

export interface ProductsApiResponse {
  products: ProductObservation[];
  histories: Record<string, PricePoint[]>;
  status: TrackerStatus;
  watchlist: string[];
}
