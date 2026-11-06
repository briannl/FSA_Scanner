import { FsafedsExpenseEntry } from "../types/fsafeds";

/**
 * Curated FSAFEDS Health Care FSA (HCFSA) Master Catalog for Physical Products
 * Reference: https://www.fsafeds.gov/explore/hcfsa/expenses
 * Last manual audit & verification: 2026-11-06
 */
export const FSAFEDS_CATALOG: FsafedsExpenseEntry[] = [
  // 1. Cold, Flu & Allergy
  {
    originalExpenseName: "Allergy Medicine & Antihistamines",
    category: "Cold, Flu & Allergy",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Includes cetirizine, loratadine, fexofenadine, diphenhydramine."
  },
  {
    originalExpenseName: "Cough Drops & Throat Lozenges",
    category: "Cold, Flu & Allergy",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Nasal Decongestants & Saline Sprays",
    category: "Cold, Flu & Allergy",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Flonase, Nasacort, saline rinses, Neti pots."
  },
  {
    originalExpenseName: "Nasal Strips (Breathe Right)",
    category: "Cold, Flu & Allergy",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 2. Pain Relief
  {
    originalExpenseName: "Pain Relievers (Oral OTC)",
    category: "Pain Relief",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Ibuprofen, Acetaminophen, Aspirin, Naproxen Sodium."
  },
  {
    originalExpenseName: "Heating Pads & Hot/Cold Packs",
    category: "Pain Relief",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Topical Pain Relief Patches & Creams",
    category: "Pain Relief",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Lidocaine patches, Salonpas, Voltaren arthritis gel, Bengay."
  },
  {
    originalExpenseName: "TENS Units & Electrotherapy Devices",
    category: "Pain Relief",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 3. First Aid & Wound Care
  {
    originalExpenseName: "Adhesive Bandages & Band-Aids",
    category: "First Aid & Wound Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Antibiotic Ointments & Antiseptics",
    category: "First Aid & Wound Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Neosporin, Polysporin, Bacitracin, Bactine, rubbing alcohol."
  },
  {
    originalExpenseName: "First Aid Kits & Emergency Medical Supplies",
    category: "First Aid & Wound Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Burn Care & Hydrogel Dressings",
    category: "First Aid & Wound Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 4. Skin & Sun Care
  {
    originalExpenseName: "Sunscreen (Broad Spectrum SPF 15+)",
    category: "Skin & Sun Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Must be SPF 15 or higher and provide broad-spectrum protection. Tanning lotions excluded."
  },
  {
    originalExpenseName: "Medicated Acne Treatments",
    category: "Skin & Sun Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Products with active ingredients Salicylic Acid, Benzoyl Peroxide, or Adapalene."
  },
  {
    originalExpenseName: "Eczema & Psoriasis Medicated Creams",
    category: "Skin & Sun Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Hydrocortisone cream, colloidal oatmeal eczema soothing lotions."
  },

  // 5. Vision & Eye Care
  {
    originalExpenseName: "Contact Lens Solution & Cleaning Enzymes",
    category: "Vision & Eye Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA", "LEX HCFSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Lubricant Eye Drops & Artificial Tears",
    category: "Vision & Eye Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA", "LEX HCFSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "TheraTears, Systane, Refresh."
  },
  {
    originalExpenseName: "Over-the-Counter Reading Glasses",
    category: "Vision & Eye Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA", "LEX HCFSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 6. Dental & Oral Treatments
  {
    originalExpenseName: "Dental Night Guards & Bite Splints",
    category: "Dental & Oral Treatments",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA", "LEX HCFSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Mouthguards designed to treat nocturnal bruxism. Ordinary sports mouthguards excluded."
  },
  {
    originalExpenseName: "Oral Pain & Canker Sore Relievers",
    category: "Dental & Oral Treatments",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA", "LEX HCFSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Orajel, Anbesol, Kank-A, orthodontic relief wax."
  },
  {
    originalExpenseName: "Denture Adhesives & Specialty Cleaners",
    category: "Dental & Oral Treatments",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA", "LEX HCFSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Fixodent, Poligrip. Standard toothpaste/toothbrushes are ineligible personal hygiene items."
  },

  // 7. Diagnostics & Monitoring
  {
    originalExpenseName: "Blood Pressure Monitors & Cuffs",
    category: "Diagnostics & Monitoring",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Omron, CVS Health, Microlife."
  },
  {
    originalExpenseName: "Blood Glucose Meters & Test Strips",
    category: "Diagnostics & Monitoring",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Diabetic testing supplies, lancets, continuous monitors."
  },
  {
    originalExpenseName: "COVID-19 & At-Home Diagnostic Test Kits",
    category: "Diagnostics & Monitoring",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Rapid antigen test kits, BinaxNOW, iHealth."
  },
  {
    originalExpenseName: "Clinical Digital & Infrared Thermometers",
    category: "Diagnostics & Monitoring",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Pulse Oximeters",
    category: "Diagnostics & Monitoring",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 8. Menstrual & Reproductive Health
  {
    originalExpenseName: "Menstrual Care Products (Tampons, Pads, Cups)",
    category: "Menstrual & Reproductive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Explicitly authorized under CARES Act Section 3702."
  },
  {
    originalExpenseName: "Pregnancy & Ovulation Test Kits",
    category: "Menstrual & Reproductive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Clearblue, First Response."
  },
  {
    originalExpenseName: "Condoms & Contraceptive Barrier Devices",
    category: "Menstrual & Reproductive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Breast Pumps & Milk Storage Bags",
    category: "Menstrual & Reproductive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 9. Digestive Health
  {
    originalExpenseName: "Antacids & Acid Reducers",
    category: "Digestive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Tums, Rolaids, Prilosec, Pepcid AC, Famotidine, Omeprazole."
  },
  {
    originalExpenseName: "Laxatives & Stool Softeners",
    category: "Digestive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "MiraLAX, Dulcolax, Colace."
  },
  {
    originalExpenseName: "Anti-Diarrheal & Motion Sickness Medications",
    category: "Digestive Health",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Imodium, Pepto-Bismol, Dramamine."
  },

  // 10. Mobility & Recovery
  {
    originalExpenseName: "Orthopedic Braces & Joint Supports",
    category: "Mobility & Recovery",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "ACE bandages, knee braces, wrist splints, back braces, carpal tunnel supports."
  },
  {
    originalExpenseName: "Graduated Compression Socks (Medical Grade)",
    category: "Mobility & Recovery",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Must be 15-20 mmHg or higher for circulatory health support."
  },
  {
    originalExpenseName: "Canes, Crutches & Walkers",
    category: "Mobility & Recovery",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },

  // 11. Hearing Care
  {
    originalExpenseName: "Over-the-Counter (OTC) Hearing Aids",
    category: "Hearing Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "FDA-cleared OTC hearing aids for perceived mild to moderate hearing impairment."
  },
  {
    originalExpenseName: "Hearing Aid Batteries & Accessories",
    category: "Hearing Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Ear Wax Removal Kits & Cleansing Drops",
    category: "Hearing Care",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Debrox, Murine ear drops."
  },

  // 12. Other Medical Supplies
  {
    originalExpenseName: "Sharps Disposal Containers & Needle Clipping Devices",
    category: "Other Medical Supplies",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Steam Inhalers, Vaporizers & Medicated Humidifiers",
    category: "Other Medical Supplies",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Devices specifically formulated for respiratory illness relief."
  },
  {
    originalExpenseName: "Pill Organizers & Medical Dosage Cups",
    category: "Other Medical Supplies",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06"
  },
  {
    originalExpenseName: "Personal Protective Equipment (Medical Face Masks)",
    category: "Other Medical Supplies",
    isPhysicalProduct: true,
    isOrdinaryEligible: true,
    documentationRequirement: "None (OTC Item per CARES Act)",
    accountTypes: ["HCFSA", "HSA", "FSA"],
    sourceUrl: "https://www.fsafeds.gov/explore/hcfsa/expenses",
    verifiedAt: "2026-11-06",
    notes: "Per IRS Announcement 2021-7, masks and hand sanitizer bought for COVID-19 prevention are eligible."
  }
];

/**
 * Explicit list of conditionally eligible items requiring Prescription (Rx) or
 * Letter of Medical Necessity (LMN).
 * These must be excluded from default consumer-facing feeds unless specific individual product evidence exists.
 */
export const CONDITIONAL_OR_INELIGIBLE_RULES = [
  {
    term: "vitamin",
    requiresLMN: true,
    reason: "General vitamins/multivitamins require an LMN to treat a diagnosed medical deficiency."
  },
  {
    term: "supplement",
    requiresLMN: true,
    reason: "Dietary supplements require a physician Letter of Medical Necessity (LMN)."
  },
  {
    term: "massage gun",
    requiresLMN: true,
    reason: "Percussive therapy devices require a physician LMN for injury rehabilitation."
  },
  {
    term: "cosmetic",
    ineligible: true,
    reason: "Purely aesthetic cosmetics, perfumes, and anti-aging creams are ineligible under IRS Section 213(d)."
  },
  {
    term: "toothpaste",
    ineligible: true,
    reason: "Standard toothpaste is ordinary personal hygiene and ineligible under FSAFEDS."
  },
  {
    term: "toothbrush",
    ineligible: true,
    reason: "Standard toothbrushes are ordinary personal hygiene and ineligible under FSAFEDS."
  },
  {
    term: "teeth whitening",
    ineligible: true,
    reason: "Cosmetic teeth whitening is explicitly excluded under IRS rules."
  },
  {
    term: "grocery",
    ineligible: true,
    reason: "Ordinary grocery and food products are non-reimbursable."
  }
];
