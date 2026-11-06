import { ProductObservation, Retailer } from "../../../src/types/product";

export interface CollectionResult {
  retailer: Retailer;
  products: ProductObservation[];
  success: boolean;
  status: "success" | "error" | "blocked_waf" | "rate_limited";
  errorMessage: string | null;
  diagnosticDetails?: string | null;
}
