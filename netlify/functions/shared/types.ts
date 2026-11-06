import { ProductObservation, Retailer, StructuredError } from "../../../src/types/product";

export type { StructuredError };

export interface CollectionResult {
  retailer: Retailer;
  products: ProductObservation[];
  success: boolean;
  status: "success" | "error" | "blocked_waf" | "rate_limited";
  errorMessage: string | null;
  diagnosticDetails?: string | null;
  structuredErrors?: StructuredError[];
}

export interface FetchAdapterOptions {
  batchLimit?: number;
  skipDelayForTesting?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
}
