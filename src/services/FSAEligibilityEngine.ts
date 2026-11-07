import { FsafedsCategory, DocumentationRequirement } from "../types/fsafeds";
import { InStoreEligibilityStatus, ScannedProduct, MatchingDealInfo } from "../types/scanner";
import { CURATED_BARCODE_DATABASE } from "../data/barcodeCatalog";
import { normalizeBarcode, getBarcodeVariants } from "../utils/barcodeUtils";
import { mapToFsafedsCategory } from "./eligibilityEngine";
import { SEED_PRODUCTS } from "../data/seedData";
import { ProductObservation } from "../types/product";

export interface EvaluationInput {
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
  medicalCategory?: string;
  activeIngredient?: string;
  purpose?: string;
  ingredientsText?: string;
  imageUrl?: string | null;
  storeName?: string;
  price?: number | null;
  matchingDealsCatalog?: ProductObservation[];
}

export interface EligibilityDetermination {
  status: InStoreEligibilityStatus;
  category: FsafedsCategory;
  medicalCategory?: string;
  activeIngredient?: string;
  purpose?: string;
  explanation: string;
  documentationRequired: DocumentationRequirement | string;
  evidenceSource: string;
  evidenceNote?: string;
  evidenceUrl?: string;
  verifiedAt: string;
  matchingDeal?: MatchingDealInfo | null;
}

/**
 * High-precision FSA/HSA eligibility engine for in-store scanning.
 * Adheres strictly to IRS Section 213(d), CARES Act Section 3702, and FSAFEDS expense guidelines.
 */
export function determineFsaEligibility(input: EvaluationInput): EligibilityDetermination {
  const variants = getBarcodeVariants(input.barcode);
  const now = new Date().toISOString().slice(0, 10);
  const catalog = input.matchingDealsCatalog || SEED_PRODUCTS;

  // Find if there is an exact matching deal in our deals database
  const matchingProduct = catalog.find((p) => {
    if (p.upc && variants.includes(normalizeBarcode(p.upc))) {
      return true;
    }
    if (input.name && p.name.toLowerCase().includes(input.name.toLowerCase().slice(0, 20))) {
      return true;
    }
    return false;
  });

  const matchingDeal: MatchingDealInfo | null = matchingProduct
    ? {
        id: matchingProduct.id,
        retailer: matchingProduct.retailer,
        currentPrice: matchingProduct.currentPrice ?? 0,
        regularPrice: matchingProduct.regularPrice ?? matchingProduct.currentPrice ?? 0,
        discountPercent: matchingProduct.discountPercent,
        productUrl: matchingProduct.productUrl
      }
    : null;

  // -------------------------------------------------------------
  // TIER 1: Authoritative Barcode Registry Check (Exact Match)
  // -------------------------------------------------------------
  for (const v of variants) {
    if (CURATED_BARCODE_DATABASE[v]) {
      const entry = CURATED_BARCODE_DATABASE[v];
      return {
        status: entry.eligibilityStatus,
        category: entry.category,
        medicalCategory: entry.medicalCategory,
        activeIngredient: entry.activeIngredient,
        purpose: entry.purpose,
        explanation: entry.explanation,
        documentationRequired: entry.documentationRequired,
        evidenceSource: entry.evidenceSource,
        evidenceNote: entry.evidenceNote,
        evidenceUrl: entry.evidenceUrl,
        verifiedAt: entry.verifiedAt,
        matchingDeal
      };
    }
  }

  // -------------------------------------------------------------
  // TIER 2: Exact Seed Catalog Match with Verified Flag
  // -------------------------------------------------------------
  if (matchingProduct && matchingProduct.fsaEligible && matchingProduct.upc && variants.includes(normalizeBarcode(matchingProduct.upc))) {
    return {
      status: "Verified eligible",
      category: matchingProduct.fsafedsCategory || (matchingProduct.category as FsafedsCategory) || "Other Medical Supplies",
      medicalCategory: matchingProduct.category,
      explanation: `Verified FSA/HSA eligible product registered with ${matchingProduct.retailer}.`,
      documentationRequired: matchingProduct.documentationRequirement || "None (OTC Item per CARES Act)",
      evidenceSource: matchingProduct.eligibilityEvidenceUrl || "FSAFEDS / IRS Section 213(d)",
      evidenceNote: matchingProduct.eligibilityEvidenceNote || "Verified product-level retailer FSA inventory record.",
      evidenceUrl: matchingProduct.productUrl,
      verifiedAt: matchingProduct.eligibilityVerifiedAt || now,
      matchingDeal
    };
  }

  // If we have no product name or details, return "Unable to verify"
  // (CRITICAL RULE: Never treat an unidentified product as ineligible)
  const name = (input.name || "").trim().toLowerCase();
  const categoryRaw = (input.category || "").trim().toLowerCase();
  const ingredients = (input.ingredientsText || "").trim().toLowerCase();
  const combinedText = `${name} ${categoryRaw} ${ingredients}`.trim();

  if (!combinedText || combinedText.length < 3) {
    return {
      status: "Unable to verify",
      category: "Other Medical Supplies",
      explanation: "Product barcode was scanned, but product details could not be identified automatically. Please enter the name and brand to check eligibility.",
      documentationRequired: "Receipt Only",
      evidenceSource: "FSAFEDS / IRS Section 213(d)",
      evidenceNote: "Unidentified barcode. Product identification required before eligibility can be assessed.",
      verifiedAt: now,
      matchingDeal
    };
  }

  // -------------------------------------------------------------
  // TIER 3: FSAFEDS Expense Rules + Active Drug Facts Analysis
  // -------------------------------------------------------------

  // 3a. Medicated OTC Acne Treatment Detection (CARES Act Sec. 3702 / FSAFEDS)
  const isAcneMedicated =
    combinedText.includes("salicylic acid") ||
    combinedText.includes("benzoyl peroxide") ||
    combinedText.includes("adapalene") ||
    combinedText.includes("sulfur") ||
    combinedText.includes("acne control") ||
    combinedText.includes("acne wash") ||
    combinedText.includes("acne cleanser") ||
    combinedText.includes("acne foaming") ||
    combinedText.includes("blemish control") ||
    combinedText.includes("acne treatment") ||
    combinedText.includes("pimple patch");

  if (isAcneMedicated) {
    let activeIngredient = "Salicylic Acid or Benzoyl Peroxide";
    if (combinedText.includes("salicylic acid") || combinedText.includes("salicylic")) {
      activeIngredient = combinedText.includes("2%") ? "2% Salicylic Acid" : "Salicylic Acid";
    } else if (combinedText.includes("benzoyl peroxide")) {
      activeIngredient = combinedText.includes("10%") ? "10% Benzoyl Peroxide" : combinedText.includes("4%") ? "4% Benzoyl Peroxide" : "Benzoyl Peroxide";
    } else if (combinedText.includes("adapalene")) {
      activeIngredient = "0.1% Adapalene";
    }

    return {
      status: "Likely eligible — verify",
      category: "Skin & Sun Care",
      medicalCategory: "OTC Acne Treatments",
      activeIngredient,
      purpose: "Acne treatment",
      explanation: "Medicated over-the-counter acne treatment (containing active drug ingredients like Salicylic Acid, Benzoyl Peroxide, or Adapalene) is eligible under FSAFEDS and CARES Act Section 3702 with a detailed receipt.",
      documentationRequired: "Detailed receipt",
      evidenceSource: "FSAFEDS / CARES Act Sec. 3702",
      evidenceNote: "FSAFEDS eligible OTC acne treatment. Requires detailed receipt showing product name.",
      evidenceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses?q=acne",
      verifiedAt: now,
      matchingDeal
    };
  }

  // 3b. Cosmetic Skincare Rejection (Non-Medicated Cleansers, Face Washes, Anti-Aging)
  // Strictly distinguishes cosmetic skincare from medicated acne products.
  const isCosmeticSkincare =
    combinedText.includes("hydrating cleanser") ||
    combinedText.includes("gentle skin cleanser") ||
    combinedText.includes("gentle cleanser") ||
    combinedText.includes("foaming facial cleanser") ||
    combinedText.includes("makeup remover") ||
    combinedText.includes("micellar water") ||
    combinedText.includes("anti-aging") ||
    combinedText.includes("wrinkle cream") ||
    combinedText.includes("hyaluronic acid serum") ||
    combinedText.includes("collagen cream");

  const hasSunscreen =
    combinedText.includes("spf") ||
    combinedText.includes("sunscreen") ||
    combinedText.includes("sunblock");

  if (isCosmeticSkincare && !hasSunscreen) {
    return {
      status: "Not eligible",
      category: "Skin & Sun Care",
      medicalCategory: "Cosmetic Skincare",
      explanation: "Non-medicated cosmetic cleansers, face washes, and anti-aging skincare are personal grooming goods excluded under IRS Section 213(d). Only cleansers formulated with active OTC drug ingredients (e.g., 2% Salicylic Acid or Benzoyl Peroxide) qualify.",
      documentationRequired: "Receipt Only",
      evidenceSource: "IRS Section 213(d) / 26 CFR 1.213-1",
      evidenceNote: "Cosmetic daily skin cleanser without active drug ingredients.",
      verifiedAt: now,
      matchingDeal
    };
  }

  // 3c. Ineligible Check: Excluded under IRS Section 213(d) (Cosmetics, Groceries, General Hygiene)
  const ineligibleKeywords = [
    { word: "doritos", reason: "Grocery snack food is strictly excluded." },
    { word: "chips", reason: "Grocery snack food is strictly excluded." },
    { word: "soda", reason: "Standard beverage is excluded." },
    { word: "coca-cola", reason: "Beverages are excluded." },
    { word: "chocolate", reason: "Food/confectionery is excluded." },
    { word: "candy", reason: "Confectionery is excluded." },
    { word: "lipstick", reason: "Cosmetics are excluded from FSA/HSA." },
    { word: "perfume", reason: "Fragrances are excluded." },
    { word: "cologne", reason: "Fragrances are excluded." },
    { word: "mascara", reason: "Cosmetics are excluded." },
    { word: "eyeliner", reason: "Cosmetics are excluded." },
    { word: "nail polish", reason: "Cosmetics are excluded." },
    { word: "shampoo", reason: "General hygiene hair products are excluded unless specifically medicated for scalp disease.", except: ["ketoconazole", "coal tar", "psoriasis"] },
    { word: "toothpaste", reason: "Standard cosmetic oral hygiene toothpaste is excluded.", except: ["fluoride rx", "dry mouth", "biotene", "prevident"] },
    { word: "toothbrush", reason: "Standard manual/electric toothbrushes are excluded.", except: ["orthodontic wax"] }
  ];

  for (const item of ineligibleKeywords) {
    if (combinedText.includes(item.word)) {
      if (item.except && item.except.some((exc) => combinedText.includes(exc))) {
        // Has medicated exception
        continue;
      }
      return {
        status: "Not eligible",
        category: mapToFsafedsCategory(name, categoryRaw),
        explanation: `${item.reason} General grooming, cosmetic, and food products are non-reimbursable under IRS Section 213(d).`,
        documentationRequired: "Receipt Only",
        evidenceSource: "IRS Section 213(d) / 26 CFR 1.213-1",
        evidenceNote: "Non-qualifying personal health or cosmetic good.",
        verifiedAt: now,
        matchingDeal
      };
    }
  }

  // 3d. Requires Documentation (Dual-Purpose: Vitamins, Supplements, Percussive Guns, Compression socks)
  const conditionalKeywords = [
    { word: "multivitamin", reason: "Multivitamins and general dietary supplements require a Letter of Medical Necessity (LMN) diagnosing a specific nutrient deficiency or disease." },
    { word: "vitamin", reason: "Vitamins taken for general health require an LMN stating the medical condition treated." },
    { word: "dietary supplement", reason: "Dietary supplements require a Letter of Medical Necessity (LMN) from a healthcare provider." },
    { word: "collagen", reason: "Collagen supplements require an LMN stating a diagnosed clinical condition." },
    { word: "massage gun", reason: "Percussive massagers require an LMN for treatment of diagnosed physical trauma or injury." },
    { word: "air purifier", reason: "Air purifiers require an LMN diagnosing a respiratory illness such as severe asthma." },
    { word: "humidifier", reason: "Humidifiers require an LMN stating treatment for a specific respiratory disorder." }
  ];

  for (const cond of conditionalKeywords) {
    if (combinedText.includes(cond.word)) {
      return {
        status: "Requires documentation",
        category: mapToFsafedsCategory(name, categoryRaw),
        explanation: cond.reason,
        documentationRequired: "Letter of Medical Necessity (LMN)",
        evidenceSource: "IRS Section 213(d) Dual-Purpose Rule",
        evidenceNote: "Dual-purpose healthcare good. Requires written doctor prescription or LMN.",
        verifiedAt: now,
        matchingDeal
      };
    }
  }

  // 3e. Likely Eligible — Verify (Matches eligible category/active ingredient, but unverified barcode)
  const likelyEligibleKeywords = [
    // OTC Meds (CARES Act Sec. 3702)
    { kw: "ibuprofen", cat: "Pain Relief", reason: "OTC pain reliever Ibuprofen (NSAID) eligible under CARES Act Sec. 3702." },
    { kw: "acetaminophen", cat: "Pain Relief", reason: "OTC analgesic/antipyretic Acetaminophen eligible under CARES Act Sec. 3702." },
    { kw: "aspirin", cat: "Pain Relief", reason: "OTC pain reliever eligible under CARES Act Sec. 3702." },
    { kw: "naproxen", cat: "Pain Relief", reason: "OTC NSAID analgesic eligible under CARES Act Sec. 3702." },
    { kw: "cetirizine", cat: "Cold, Flu & Allergy", reason: "Antihistamine OTC medication eligible under CARES Act Sec. 3702." },
    { kw: "loratadine", cat: "Cold, Flu & Allergy", reason: "Antihistamine OTC medication eligible under CARES Act Sec. 3702." },
    { kw: "fexofenadine", cat: "Cold, Flu & Allergy", reason: "Antihistamine OTC medication eligible under CARES Act Sec. 3702." },
    { kw: "diphenhydramine", cat: "Cold, Flu & Allergy", reason: "Antihistamine OTC medication eligible under CARES Act Sec. 3702." },
    { kw: "fluticasone", cat: "Cold, Flu & Allergy", reason: "OTC nasal spray eligible under CARES Act Sec. 3702." },
    { kw: "guaifenesin", cat: "Cold, Flu & Allergy", reason: "OTC expectorant eligible under CARES Act Sec. 3702." },
    { kw: "dextromethorphan", cat: "Cold, Flu & Allergy", reason: "OTC cough suppressant eligible under CARES Act Sec. 3702." },
    { kw: "saline nasal", cat: "Cold, Flu & Allergy", reason: "Nasal irrigation and sterile saline are eligible medical supplies." },
    { kw: "omeprazole", cat: "Digestive Health", reason: "OTC acid reducer eligible under CARES Act Sec. 3702." },
    { kw: "famotidine", cat: "Digestive Health", reason: "OTC H2 blocker acid reducer eligible under CARES Act Sec. 3702." },
    { kw: "loperamide", cat: "Digestive Health", reason: "OTC anti-diarrheal medication eligible under CARES Act Sec. 3702." },
    { kw: "bismuth subsalicylate", cat: "Digestive Health", reason: "OTC digestive relief eligible under CARES Act Sec. 3702." },
    // First aid & wound care
    { kw: "bandage", cat: "First Aid & Wound Care", reason: "Sterile wound dressings and adhesive bandages qualify under IRS Sec. 213(d)." },
    { kw: "gauze", cat: "First Aid & Wound Care", reason: "Sterile medical dressings qualify under IRS Sec. 213(d)." },
    { kw: "first aid", cat: "First Aid & Wound Care", reason: "Emergency medical wound supplies qualify under IRS Sec. 213(d)." },
    { kw: "rubbing alcohol", cat: "First Aid & Wound Care", reason: "Antiseptic first aid supplies qualify under IRS Sec. 213(d)." },
    { kw: "hydrogen peroxide", cat: "First Aid & Wound Care", reason: "Antiseptic wound cleansing supplies qualify under IRS Sec. 213(d)." },
    // Sun Care (SPF 15+)
    { kw: "spf 30", cat: "Skin & Sun Care", reason: "Broad-spectrum sunscreen SPF 15+ qualifies under IRS Notice 2011-43." },
    { kw: "spf 50", cat: "Skin & Sun Care", reason: "Broad-spectrum sunscreen SPF 15+ qualifies under IRS Notice 2011-43." },
    { kw: "spf 70", cat: "Skin & Sun Care", reason: "Broad-spectrum sunscreen SPF 15+ qualifies under IRS Notice 2011-43." },
    { kw: "sunscreen", cat: "Skin & Sun Care", reason: "Sunscreen with broad spectrum SPF 15 or higher is recognized under IRS Notice 2011-43." },
    // Vision & eye care
    { kw: "contact lens solution", cat: "Vision & Eye Care", reason: "Contact lens maintenance and cleaning solutions qualify under IRS Sec. 213(d)." },
    { kw: "artificial tears", cat: "Vision & Eye Care", reason: "Lubricating ophthalmic eye drops qualify under IRS Sec. 213(d)." },
    { kw: "reading glasses", cat: "Vision & Eye Care", reason: "Non-prescription magnifying reading glasses qualify under IRS Sec. 213(d)." },
    // Menstrual & Reproductive
    { kw: "tampon", cat: "Menstrual & Reproductive Health", reason: "Menstrual care products qualify permanently under CARES Act Sec. 3702." },
    { kw: "menstrual cup", cat: "Menstrual & Reproductive Health", reason: "Menstrual care products qualify permanently under CARES Act Sec. 3702." },
    { kw: "period underwear", cat: "Menstrual & Reproductive Health", reason: "Reusable menstrual care products qualify under CARES Act Sec. 3702." },
    { kw: "pregnancy test", cat: "Menstrual & Reproductive Health", reason: "Diagnostic pregnancy test kits qualify under IRS Sec. 213(d)." },
    { kw: "ovulation test", cat: "Menstrual & Reproductive Health", reason: "Diagnostic ovulation predictor kits qualify under IRS Sec. 213(d)." },
    { kw: "condom", cat: "Menstrual & Reproductive Health", reason: "Prophylactics and barrier contraceptives qualify under IRS Sec. 213(d)." },
    // Diagnostic devices
    { kw: "blood pressure", cat: "Diagnostics & Monitoring", reason: "Clinical blood pressure monitors qualify under IRS Sec. 213(d)." },
    { kw: "thermometer", cat: "Diagnostics & Monitoring", reason: "Clinical fever thermometers qualify under IRS Sec. 213(d)." },
    { kw: "pulse oximeter", cat: "Diagnostics & Monitoring", reason: "Diagnostic blood oxygen saturation monitors qualify under IRS Sec. 213(d)." },
    { kw: "glucose monitor", cat: "Diagnostics & Monitoring", reason: "Diabetic testing and diagnostic equipment qualify under IRS Sec. 213(d)." }
  ];

  for (const match of likelyEligibleKeywords) {
    if (combinedText.includes(match.kw)) {
      return {
        status: "Likely eligible — verify",
        category: match.cat as FsafedsCategory,
        explanation: `${match.reason} Specific product barcode is not in the verified registry, but matches established IRS category criteria. Confirm eligibility at checkout or keep receipt.`,
        documentationRequired: "None (OTC Item per CARES Act)",
        evidenceSource: "FSAFEDS / IRS Section 213(d) / CARES Act Sec. 3702",
        evidenceNote: `Category-level pattern match: "${match.kw}". Product-level barcode not yet verified in central catalog.`,
        verifiedAt: now,
        matchingDeal
      };
    }
  }

  // -------------------------------------------------------------
  // TIER 4: Unable to Verify with Explicit Missing-Info Diagnosis
  // -------------------------------------------------------------
  const isAmbiguousSkincare =
    combinedText.includes("cleanser") ||
    combinedText.includes("wash") ||
    combinedText.includes("cream") ||
    combinedText.includes("cerave") ||
    combinedText.includes("cetaphil") ||
    combinedText.includes("neutrogena");

  const missingInfoExplanation = isAmbiguousSkincare
    ? "Missing active drug ingredient or NDC record. Could not verify whether this skincare product contains an active OTC acne medication (e.g., Salicylic Acid or Benzoyl Peroxide) or is an ineligible cosmetic cleanser. A detailed receipt or drug facts label is required."
    : "This product does not match a known FSA-eligible medical category or verified UPC record. Please check the product label for active medicinal ingredients.";

  return {
    status: "Unable to verify",
    category: mapToFsafedsCategory(name, categoryRaw),
    explanation: missingInfoExplanation,
    documentationRequired: isAmbiguousSkincare ? "Detailed receipt" : "Receipt Only",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: isAmbiguousSkincare
      ? "Lacks verified active drug ingredient or Drug Facts panel. Verification required between medicated acne vs cosmetic cleanser."
      : "Unverified product attributes.",
    verifiedAt: now,
    matchingDeal
  };
}

/**
 * Creates a complete ScannedProduct object from raw inputs and evaluation.
 */
export function buildScannedProduct(input: EvaluationInput): ScannedProduct {
  const determination = determineFsaEligibility(input);
  const normalizedBarcode = normalizeBarcode(input.barcode);
  const now = new Date().toISOString();

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    barcode: normalizedBarcode,
    barcodeType: normalizedBarcode.length === 12 ? "UPC-A" : normalizedBarcode.length === 13 ? "EAN-13" : normalizedBarcode.length === 8 ? "EAN-8" : "GTIN",
    name: input.name || `Product (${normalizedBarcode})`,
    brand: input.brand,
    category: determination.category,
    medicalCategory: determination.medicalCategory,
    activeIngredient: determination.activeIngredient,
    purpose: determination.purpose,
    imageUrl: input.imageUrl,
    eligibilityStatus: determination.status,
    explanation: determination.explanation,
    documentationRequired: determination.documentationRequired,
    evidenceSource: determination.evidenceSource,
    evidenceNote: determination.evidenceNote,
    evidenceUrl: determination.evidenceUrl,
    verifiedAt: determination.verifiedAt,
    scannedAt: now,
    storeName: input.storeName,
    price: input.price ?? null,
    matchingDeal: determination.matchingDeal
  };
}
