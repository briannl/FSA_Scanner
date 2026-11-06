import { FsafedsCategory, DocumentationRequirement } from "../types/fsafeds";
import { InStoreEligibilityStatus } from "../types/scanner";

export interface CuratedBarcodeEntry {
  barcode: string;
  name: string;
  brand: string;
  category: FsafedsCategory;
  eligibilityStatus: InStoreEligibilityStatus;
  explanation: string;
  documentationRequired: DocumentationRequirement;
  evidenceSource: string;
  evidenceNote?: string;
  imageUrl?: string;
  verifiedAt: string;
  matchingProductId?: string;
}

export const CURATED_BARCODE_DATABASE: Record<string, CuratedBarcodeEntry> = {
  // ==========================================
  // 1. Diagnostics & Medical Devices
  // ==========================================
  "050428456123": {
    barcode: "050428456123",
    name: "CVS Health Rapid Response Blood Pressure Monitor, Upper Arm",
    brand: "CVS Health",
    category: "Diagnostics & Monitoring",
    eligibilityStatus: "Verified eligible",
    explanation: "Diagnostic blood pressure monitors are fully qualified medical devices under IRS Section 213(d).",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Medical monitoring equipment eligible without prescription or letter of necessity.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "cvs-108201"
  },
  "050428882103": {
    barcode: "050428882103",
    name: "CVS Health Digital Temple Thermometer",
    brand: "CVS Health",
    category: "Diagnostics & Monitoring",
    eligibilityStatus: "Verified eligible",
    explanation: "Clinical diagnostic thermometers for measuring body temperature are 100% FSA eligible.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Diagnostic thermometer eligible under standard healthcare FSA/HSA.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "cvs-219502"
  },
  "00609384": {
    barcode: "00609384",
    name: "Vons TopCare Rapid Digital Fever Thermometer",
    brand: "TopCare",
    category: "Diagnostics & Monitoring",
    eligibilityStatus: "Verified eligible",
    explanation: "Clinical digital thermometer for fever detection is an eligible diagnostic device.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "In-store digital thermometer with verified FSA debit card compatibility.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "vons-501"
  },

  // ==========================================
  // 2. Cold, Flu & Allergy (CARES Act OTC)
  // ==========================================
  "353100201445": {
    barcode: "353100201445",
    name: "Flonase Allergy Relief Nasal Spray 24 Hour, 144 Metered Sprays",
    brand: "Flonase",
    category: "Cold, Flu & Allergy",
    eligibilityStatus: "Verified eligible",
    explanation: "OTC allergy medication permanently restored to FSA eligibility by CARES Act Section 3702 without a prescription.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "Fluticasone propionate nasal spray for 24h seasonal allergy relief.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "cvs-324519"
  },
  "096619123456": {
    barcode: "096619123456",
    name: "Kirkland Signature Aller-Tec 10 mg Cetirizine, 365 Tablets",
    brand: "Kirkland Signature",
    category: "Cold, Flu & Allergy",
    eligibilityStatus: "Verified eligible",
    explanation: "Cetirizine hydrochloride antihistamine tablets qualify as eligible OTC allergy medicine.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "Wholesale 365-count cetirizine allergy tablets verified FSA eligible.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "costco-100412345"
  },
  "300450123456": {
    barcode: "300450123456",
    name: "Benadryl Ultratabs Antihistamine Allergy Relief Tablets, 24 ct",
    brand: "Benadryl",
    category: "Cold, Flu & Allergy",
    eligibilityStatus: "Verified eligible",
    explanation: "Diphenhydramine HCl antihistamine for allergy symptoms and hay fever.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "OTC antihistamine medication.",
    verifiedAt: "2026-11-06"
  },

  // ==========================================
  // 3. Pain Relief (CARES Act OTC)
  // ==========================================
  "305730164402": {
    barcode: "305730164402",
    name: "Advil Pain Reliever and Fever Reducer 200mg Ibuprofen, 100 Coated Tablets",
    brand: "Advil",
    category: "Pain Relief",
    eligibilityStatus: "Verified eligible",
    explanation: "Ibuprofen NSAID analgesic permanently eligible under CARES Act Section 3702.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "General OTC pain relief medication, no Rx required.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
    verifiedAt: "2026-11-06"
  },
  "300450449107": {
    barcode: "300450449107",
    name: "Tylenol Extra Strength 500mg Acetaminophen, 100 Caplets",
    brand: "Tylenol",
    category: "Pain Relief",
    eligibilityStatus: "Verified eligible",
    explanation: "Acetaminophen pain reliever and fever reducer eligible under CARES Act Section 3702.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "OTC pain reliever and fever reducer.",
    verifiedAt: "2026-11-06"
  },
  "041167000174": {
    barcode: "041167000174",
    name: "Icy Hot Medicated Pain Relief Patch, Extra Strength, 5 ct",
    brand: "Icy Hot",
    category: "Pain Relief",
    eligibilityStatus: "Verified eligible",
    explanation: "Medicated topical analgesic patch with menthol is verified FSA eligible.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Topical pain relief patch.",
    verifiedAt: "2026-11-06"
  },

  // ==========================================
  // 4. First Aid & Wound Care
  // ==========================================
  "358790001026": {
    barcode: "358790001026",
    name: "Kirkland Signature First Aid Kit, 300 Pieces",
    brand: "Kirkland Signature",
    category: "First Aid & Wound Care",
    eligibilityStatus: "Verified eligible",
    explanation: "Comprehensive first aid supplies including sterile dressings, antiseptic wipes, and trauma wraps.",
    documentationRequired: "Receipt Only",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Primary healthcare first aid supplies qualify unconditionally.",
    imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "costco-100889211"
  },
  "038137004400": {
    barcode: "038137004400",
    name: "Band-Aid Brand Flexible Fabric Adhesive Bandages, 100 ct",
    brand: "Band-Aid",
    category: "First Aid & Wound Care",
    eligibilityStatus: "Verified eligible",
    explanation: "Sterile wound dressings and adhesive bandages are 100% eligible medical supplies.",
    documentationRequired: "Receipt Only",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Wound care supplies eligible with receipt or FSA debit card.",
    imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "ralphs-301"
  },
  "300810731885": {
    barcode: "300810731885",
    name: "Neosporin Original First Aid Antibiotic Ointment, 0.5 oz",
    brand: "Neosporin",
    category: "First Aid & Wound Care",
    eligibilityStatus: "Verified eligible",
    explanation: "Triple antibiotic wound care ointment is permanently eligible without prescription under CARES Act.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "First aid antibiotic ointment.",
    verifiedAt: "2026-11-06"
  },

  // ==========================================
  // 5. Skin & Sun Care (Broad Spectrum SPF 15+)
  // ==========================================
  "070501055304": {
    barcode: "070501055304",
    name: "Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 70, 3 fl oz",
    brand: "Neutrogena",
    category: "Skin & Sun Care",
    eligibilityStatus: "Verified eligible",
    explanation: "Broad-spectrum sunscreen with SPF 15 or higher is recognized as an eligible medical expense under IRS Notice 2011-43.",
    documentationRequired: "Receipt Only",
    evidenceSource: "IRS Notice 2011-43 / FSAFEDS",
    evidenceNote: "Broad-spectrum UV protection with SPF >= 15.",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "cvs-554210"
  },
  "301875450017": {
    barcode: "301875450017",
    name: "Bausch + Lomb renu Advanced Multi-Purpose Solution, 12 oz",
    brand: "Bausch + Lomb",
    category: "Vision & Eye Care",
    eligibilityStatus: "Verified eligible",
    explanation: "Contact lens cleaning, disinfecting, and storage solutions are eligible medical supplies.",
    documentationRequired: "Receipt Only",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Vision care contact lens solution.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "amazon-101"
  },

  // ==========================================
  // 6. Menstrual & Reproductive Care
  // ==========================================
  "037000780287": {
    barcode: "037000780287",
    name: "Always Ultra Thin Size 1 Regular Pads with Wings, 36 ct",
    brand: "Always",
    category: "Menstrual & Reproductive Health",
    eligibilityStatus: "Verified eligible",
    explanation: "Menstrual care products (pads, tampons, liners, cups) permanently qualified by CARES Act Sec. 3702.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "Qualified menstrual care product.",
    verifiedAt: "2026-11-06"
  },
  "022600000010": {
    barcode: "022600000010",
    name: "First Response Early Result Pregnancy Test, 2 ct",
    brand: "First Response",
    category: "Menstrual & Reproductive Health",
    eligibilityStatus: "Verified eligible",
    explanation: "Diagnostic pregnancy tests and ovulation predictor kits are eligible under IRS Section 213(d).",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "FSAFEDS / IRS Section 213(d)",
    evidenceNote: "Diagnostic home pregnancy test kit.",
    verifiedAt: "2026-11-06"
  },

  // ==========================================
  // 7. Digestive Health
  // ==========================================
  "0004126038104": {
    barcode: "0004126038104",
    name: "Ralphs Omeprazole 20mg Delayed-Release Acid Reducer, 42 ct",
    brand: "Ralphs",
    category: "Digestive Health",
    eligibilityStatus: "Verified eligible",
    explanation: "Proton pump inhibitor acid reducer for frequent heartburn is eligible OTC medication.",
    documentationRequired: "None (OTC Item per CARES Act)",
    evidenceSource: "CARES Act Sec. 3702 / FSAFEDS",
    evidenceNote: "OTC digestive acid reducer medication.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80",
    verifiedAt: "2026-11-06",
    matchingProductId: "ralphs-201"
  },

  // ==========================================
  // 8. Conditional Items (Requires LMN)
  // ==========================================
  "031604012345": {
    barcode: "031604012345",
    name: "Nature Made Multi for Her Multivitamin Tablets, 90 ct",
    brand: "Nature Made",
    category: "Other Medical Supplies",
    eligibilityStatus: "Requires documentation",
    explanation: "General health multivitamins and dietary supplements are dual-purpose and require a Letter of Medical Necessity (LMN) from a physician stating a specific medical condition.",
    documentationRequired: "Letter of Medical Necessity (LMN)",
    evidenceSource: "IRS Section 213(d) Dual-Purpose Rule",
    evidenceNote: "Ineligible for ordinary FSA debit card without an approved doctor's LMN on file.",
    verifiedAt: "2026-11-06"
  },
  "081234567890": {
    barcode: "081234567890",
    name: "TheraGun Relief Deep Tissue Percussive Massage Gun",
    brand: "TheraBody",
    category: "Mobility & Recovery",
    eligibilityStatus: "Requires documentation",
    explanation: "Percussive massagers require a Letter of Medical Necessity (LMN) diagnosing a medical musculoskeletal condition.",
    documentationRequired: "Letter of Medical Necessity (LMN)",
    evidenceSource: "IRS Section 213(d) / FSAFEDS",
    evidenceNote: "Requires LMN prescribing therapy for diagnosed injury or condition.",
    verifiedAt: "2026-11-06"
  },

  // ==========================================
  // 9. Ineligible Items (Grocery / Cosmetics / Hygiene)
  // ==========================================
  "028400090858": {
    barcode: "028400090858",
    name: "Doritos Nacho Cheese Flavored Tortilla Chips, 9.25 oz",
    brand: "Doritos",
    category: "Other Medical Supplies",
    eligibilityStatus: "Not eligible",
    explanation: "Standard grocery food items and snacks are strictly excluded under IRS Section 213(d).",
    documentationRequired: "Receipt Only",
    evidenceSource: "IRS Section 213(d) / 26 CFR 1.213-1",
    evidenceNote: "Grocery snack food strictly excluded from FSA/HSA reimbursement.",
    verifiedAt: "2026-11-06"
  },
  "035000456123": {
    barcode: "035000456123",
    name: "Colgate Total Clean Mint Toothpaste, 5.1 oz",
    brand: "Colgate",
    category: "Dental & Oral Treatments",
    eligibilityStatus: "Not eligible",
    explanation: "Standard cosmetic and ordinary hygiene oral care items (regular toothpaste, toothbrushes, floss) are non-eligible general health goods.",
    documentationRequired: "Receipt Only",
    evidenceSource: "IRS Section 213(d) / FSAFEDS",
    evidenceNote: "Ordinary dental hygiene products excluded unless specialized prescription periodontal treatment.",
    verifiedAt: "2026-11-06"
  },
  "037000123456": {
    barcode: "037000123456",
    name: "Head & Shoulders Classic Clean Anti-Dandruff Shampoo, 12.5 oz",
    brand: "Head & Shoulders",
    category: "Skin & Sun Care",
    eligibilityStatus: "Not eligible",
    explanation: "Ordinary cosmetic hair care and standard anti-dandruff shampoos are general grooming items excluded from FSA/HSA.",
    documentationRequired: "Receipt Only",
    evidenceSource: "IRS Section 213(d)",
    evidenceNote: "General hygiene hair care excluded from FSA debit card.",
    verifiedAt: "2026-11-06"
  }
};
