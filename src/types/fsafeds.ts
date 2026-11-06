/**
 * FSAFEDS Health Care FSA (HCFSA) Categories & Eligibility Data Contracts
 * Reference: https://www.fsafeds.gov/explore/hcfsa/expenses
 */

export const FSAFEDS_CATEGORIES = [
  "Cold, Flu & Allergy",
  "Pain Relief",
  "First Aid & Wound Care",
  "Skin & Sun Care",
  "Vision & Eye Care",
  "Dental & Oral Treatments",
  "Diagnostics & Monitoring",
  "Menstrual & Reproductive Health",
  "Digestive Health",
  "Mobility & Recovery",
  "Hearing Care",
  "Other Medical Supplies"
] as const;

export type FsafedsCategory = (typeof FSAFEDS_CATEGORIES)[number];

export type EligibilityAccountType = "HCFSA" | "HSA" | "FSA" | "LEX HCFSA";

export type DocumentationRequirement =
  | "None (OTC Item per CARES Act)"
  | "Receipt Only"
  | "Prescription Required"
  | "Letter of Medical Necessity (LMN)";

export type EligibilityConfidence = "high" | "medium" | "unverified";

export type ReviewStatus = "verified" | "conditional" | "rejected";

export interface FsafedsExpenseEntry {
  originalExpenseName: string;
  category: FsafedsCategory;
  isPhysicalProduct: boolean;
  isOrdinaryEligible: boolean; // true if normally eligible without Rx/LMN
  documentationRequirement: DocumentationRequirement;
  accountTypes: EligibilityAccountType[];
  sourceUrl: string;
  verifiedAt: string; // ISO 8601 date string
  notes?: string;
}

export interface ProductEligibility {
  fsaEligible: boolean;
  category: FsafedsCategory;
  accountTypes: EligibilityAccountType[];
  documentationRequirement: DocumentationRequirement;
  evidenceSourceUrl: string;
  evidenceDescription: string;
  verifiedAt: string;
  confidence: EligibilityConfidence;
  reviewStatus: ReviewStatus;
}
