import { FsafedsCategory, DocumentationRequirement } from "./fsafeds";

export type InStoreEligibilityStatus =
  | "Verified eligible"
  | "Likely eligible — verify"
  | "Requires documentation"
  | "Not eligible"
  | "Unable to verify";

export interface MatchingDealInfo {
  id: string;
  retailer: string;
  currentPrice: number;
  regularPrice: number;
  discountPercent: number;
  productUrl: string;
}

export interface ScannedProduct {
  id: string;
  barcode: string;
  barcodeType?: string;
  name: string;
  brand?: string;
  category: FsafedsCategory;
  medicalCategory?: string;
  activeIngredient?: string;
  purpose?: string;
  imageUrl?: string | null;
  eligibilityStatus: InStoreEligibilityStatus;
  explanation: string;
  documentationRequired: DocumentationRequirement | string;
  evidenceSource: string;
  evidenceNote?: string;
  evidenceUrl?: string;
  verifiedAt: string;
  scannedAt: string;
  storeName?: string;
  price?: number | null;
  matchingDeal?: MatchingDealInfo | null;
  userAddedLabelPhoto?: string | null;
  userEdited?: boolean;
  flaggedIncorrect?: boolean;
  userEvidenceNote?: string;
}

export interface ScanHistoryItem extends ScannedProduct {
  isFavorite?: boolean;
}

export interface ProductLookupResult {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string | null;
  ingredientsText?: string;
  source: "local_catalog" | "open_facts" | "upcitemdb" | "user_entry" | "cache";
  raw?: Record<string, unknown>;
}
