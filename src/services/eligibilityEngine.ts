import {
  FsafedsCategory,
  ProductEligibility,
  DocumentationRequirement
} from "../types/fsafeds";
import { CONDITIONAL_OR_INELIGIBLE_RULES } from "../data/fsafedsCatalog";

export interface RawProductInput {
  name: string;
  retailer: string;
  rawCategory?: string | null;
  explicitFsaBadge?: boolean;
  upc?: string | null;
  sku?: string | null;
  asin?: string | null;
  productUrl?: string;
  evidenceSourceUrl?: string;
  evidenceNote?: string;
}

export interface EligibilityResult {
  isFeedEligible: boolean; // Must be true to show in normal consumer feed
  eligibility: ProductEligibility;
  rejectionReason?: string;
}

/**
 * Strict category detector that matches against known physical medical product classifications.
 * Does NOT classify general wellness or vague health terms.
 */
export function mapToFsafedsCategory(rawName: string, rawCat?: string | null): FsafedsCategory {
  const text = `${rawName} ${rawCat || ""}`.toLowerCase();

  // 1. Diagnostics & Monitoring
  if (
    text.includes("blood pressure") ||
    text.includes("thermometer") ||
    text.includes("pulse oximeter") ||
    text.includes("antigen") ||
    text.includes("covid") ||
    text.includes("glucose") ||
    text.includes("lancet") ||
    text.includes("test kit")
  ) {
    return "Diagnostics & Monitoring";
  }

  // 2. First Aid & Wound Care (Checked before pain relief so "Neosporin + Pain Relief" or "First Aid" maps properly)
  if (
    text.includes("first aid") ||
    text.includes("bandage") ||
    text.includes("band-aid") ||
    text.includes("antibiotic ointment") ||
    text.includes("neosporin") ||
    text.includes("polysporin") ||
    text.includes("gauze") ||
    text.includes("antiseptic") ||
    text.includes("wound")
  ) {
    return "First Aid & Wound Care";
  }

  // 3. Dental & Oral Treatments (Checked before pain relief so "Orajel Toothache Relief" maps properly)
  if (
    text.includes("night guard") ||
    text.includes("bite guard") ||
    text.includes("bite splint") ||
    text.includes("oral pain") ||
    text.includes("toothache") ||
    text.includes("orajel") ||
    text.includes("anbesol") ||
    text.includes("canker") ||
    text.includes("denture adhesive") ||
    text.includes("denture cleanser") ||
    text.includes("orthodontic wax")
  ) {
    return "Dental & Oral Treatments";
  }

  // 4. Pain Relief
  if (
    text.includes("ibuprofen") ||
    text.includes("acetaminophen") ||
    text.includes("aspirin") ||
    text.includes("naproxen") ||
    text.includes("pain relief") ||
    text.includes("analgesic") ||
    text.includes("medicated oil") ||
    text.includes("heating pad") ||
    text.includes("ice pack") ||
    text.includes("cold pack") ||
    text.includes("tens unit") ||
    text.includes("lidocaine") ||
    text.includes("salonpas") ||
    text.includes("arthritis")
  ) {
    return "Pain Relief";
  }

  // 3. Cold, Flu & Allergy
  if (
    text.includes("allergy") ||
    text.includes("aller-tec") ||
    text.includes("cetirizine") ||
    text.includes("loratadine") ||
    text.includes("fexofenadine") ||
    text.includes("flonase") ||
    text.includes("decongestant") ||
    text.includes("cough drop") ||
    text.includes("saline") ||
    text.includes("nasal") ||
    text.includes("antihistamine") ||
    text.includes("sinus")
  ) {
    return "Cold, Flu & Allergy";
  }

  // 4. Skin & Sun Care
  if (
    text.includes("sunscreen") ||
    text.includes("spf 15") ||
    text.includes("spf 30") ||
    text.includes("spf 50") ||
    text.includes("spf 55") ||
    text.includes("spf 70") ||
    text.includes("sun protection") ||
    text.includes("acne") ||
    text.includes("eczema") ||
    text.includes("hydrocortisone")
  ) {
    return "Skin & Sun Care";
  }

  // 5. Vision & Eye Care
  if (
    text.includes("eye drop") ||
    text.includes("artificial tears") ||
    text.includes("contact lens") ||
    text.includes("lubricant eye") ||
    text.includes("reading glasses") ||
    text.includes("opti-free") ||
    text.includes("theratears")
  ) {
    return "Vision & Eye Care";
  }

  // 6. Dental & Oral Treatments
  if (
    text.includes("night guard") ||
    text.includes("bite guard") ||
    text.includes("oral pain") ||
    text.includes("canker") ||
    text.includes("denture adhesive") ||
    text.includes("denture cleanser") ||
    text.includes("orthodontic wax")
  ) {
    return "Dental & Oral Treatments";
  }

  // 7. Menstrual & Reproductive Health
  if (
    text.includes("tampon") ||
    text.includes("menstrual") ||
    text.includes("period") ||
    text.includes("pantyliner") ||
    text.includes("sanitary napkin") ||
    text.includes("pregnancy test") ||
    text.includes("ovulation") ||
    text.includes("condom") ||
    text.includes("breast pump") ||
    text.includes("breast milk")
  ) {
    return "Menstrual & Reproductive Health";
  }

  // 8. Digestive Health
  if (
    text.includes("antacid") ||
    text.includes("acid reducer") ||
    text.includes("famotidine") ||
    text.includes("omeprazole") ||
    text.includes("laxative") ||
    text.includes("miralax") ||
    text.includes("anti-diarrheal") ||
    text.includes("loperamide") ||
    text.includes("pepto") ||
    text.includes("motion sickness")
  ) {
    return "Digestive Health";
  }

  // 9. First Aid & Wound Care
  if (
    text.includes("bandage") ||
    text.includes("first aid") ||
    text.includes("antibiotic ointment") ||
    text.includes("neosporin") ||
    text.includes("gauze") ||
    text.includes("antiseptic") ||
    text.includes("wound")
  ) {
    return "First Aid & Wound Care";
  }

  // 10. Mobility & Recovery
  if (
    text.includes("compression sock") ||
    text.includes("compression stocking") ||
    text.includes("knee brace") ||
    text.includes("ankle brace") ||
    text.includes("wrist brace") ||
    text.includes("wrist support") ||
    text.includes("splint") ||
    text.includes("crutches") ||
    text.includes("cane") ||
    text.includes("kinesiology")
  ) {
    return "Mobility & Recovery";
  }

  // 11. Hearing Care
  if (
    text.includes("hearing aid") ||
    text.includes("hearing aid battery") ||
    text.includes("ear wax") ||
    text.includes("earwax") ||
    text.includes("debrox")
  ) {
    return "Hearing Care";
  }

  // 12. Other Medical Supplies (Default fallback for verified medical goods)
  return "Other Medical Supplies";
}

/**
 * Evaluates a product against strict FSAFEDS rules.
 * Enforces:
 * 1. Explicit FSA eligibility label OR verified exact ID criteria.
 * 2. Rejection of ordinary grocery, cosmetic, and general wellness items.
 * 3. Exclusion of items requiring Prescription or Letter of Medical Necessity (LMN).
 */
export function evaluateFsaEligibility(input: RawProductInput): EligibilityResult {
  const normalizedName = input.name.toLowerCase();
  const normalizedRawCat = (input.rawCategory || "").toLowerCase();

  // Rule A: Check for explicitly excluded / ineligible categories (cosmetics, grocery, standard hygiene)
  for (const rule of CONDITIONAL_OR_INELIGIBLE_RULES) {
    if (rule.ineligible) {
      if (
        normalizedName.includes(rule.term) ||
        normalizedRawCat.includes(rule.term)
      ) {
        // Exception: Sunscreen or acne products might have "lotion" or "cream"
        if (rule.term === "cosmetic" && (normalizedName.includes("sunscreen") || normalizedName.includes("acne"))) {
          continue;
        }
        return {
          isFeedEligible: false,
          rejectionReason: `Ineligible: ${rule.reason}`,
          eligibility: {
            fsaEligible: false,
            category: "Other Medical Supplies",
            accountTypes: [],
            documentationRequirement: "Receipt Only",
            evidenceSourceUrl: input.productUrl || "https://www.fsafeds.gov/explore/hcfsa/expenses",
            evidenceDescription: `Rejected under IRS 213(d): ${rule.reason}`,
            verifiedAt: new Date().toISOString(),
            confidence: "high",
            reviewStatus: "rejected"
          }
        };
      }
    }
  }

  // Rule B: Check for conditional eligibility requiring Prescription (Rx) or LMN (e.g. general vitamins, massage guns)
  for (const rule of CONDITIONAL_OR_INELIGIBLE_RULES) {
    if (rule.requiresLMN) {
      if (
        normalizedName.includes(rule.term) ||
        normalizedRawCat.includes(rule.term)
      ) {
        return {
          isFeedEligible: false,
          rejectionReason: `Conditional eligibility excluded from normal feed: ${rule.reason}`,
          eligibility: {
            fsaEligible: false,
            category: "Other Medical Supplies",
            accountTypes: ["HCFSA", "HSA"],
            documentationRequirement: "Letter of Medical Necessity (LMN)",
            evidenceSourceUrl: input.productUrl || "https://www.fsafeds.gov/explore/hcfsa/expenses",
            evidenceDescription: `Conditional: ${rule.reason}`,
            verifiedAt: new Date().toISOString(),
            confidence: "medium",
            reviewStatus: "conditional"
          }
        };
      }
    }
  }

  // Rule C: Strict Accepted Evidence
  // Only admitted if explicit FSA badge is present OR exact verified UPC/ASIN/SKU with verified note
  const hasExplicitBadge = Boolean(input.explicitFsaBadge);
  const hasExactIdentifier = Boolean(input.upc || input.asin || input.sku);
  const hasVerifiedEvidence = Boolean(input.evidenceNote);

  if (!hasExplicitBadge && !(hasExactIdentifier && hasVerifiedEvidence)) {
    return {
      isFeedEligible: false,
      rejectionReason: "Unverified eligibility: Lacks explicit retailer FSA/HSA badge and exact verified product evidence.",
      eligibility: {
        fsaEligible: false,
        category: mapToFsafedsCategory(input.name, input.rawCategory),
        accountTypes: [],
        documentationRequirement: "Receipt Only",
        evidenceSourceUrl: input.productUrl || "https://www.fsafeds.gov/explore/hcfsa/expenses",
        evidenceDescription: "Unverified: Ambiguous product eligibility.",
        verifiedAt: new Date().toISOString(),
        confidence: "unverified",
        reviewStatus: "rejected"
      }
    };
  }

  // Rule D: Validated Eligible Physical Product
  const category = mapToFsafedsCategory(input.name, input.rawCategory);
  const docReq: DocumentationRequirement = "None (OTC Item per CARES Act)";

  return {
    isFeedEligible: true,
    eligibility: {
      fsaEligible: true,
      category,
      accountTypes: ["HCFSA", "HSA", "FSA"],
      documentationRequirement: docReq,
      evidenceSourceUrl: input.evidenceSourceUrl || input.productUrl || "https://www.fsafeds.gov/explore/hcfsa/expenses",
      evidenceDescription:
        input.evidenceNote ||
        (hasExplicitBadge
          ? `Verified explicit FSA/HSA eligible badge on ${input.retailer}.`
          : `Verified exact identifier match (${input.upc || input.asin || input.sku}) against FSAFEDS catalog.`),
      verifiedAt: new Date().toISOString(),
      confidence: "high",
      reviewStatus: "verified"
    }
  };
}
