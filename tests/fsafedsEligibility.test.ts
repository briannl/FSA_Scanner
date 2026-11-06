import { describe, it, expect } from "vitest";
import {
  mapToFsafedsCategory,
  evaluateFsaEligibility
} from "../src/services/eligibilityEngine";
import { FSAFEDS_CATEGORIES } from "../src/types/fsafeds";

describe("FSAFEDS Category Mapping & Strict Eligibility Engine", () => {
  it("defines all 12 purchasable physical categories", () => {
    expect(FSAFEDS_CATEGORIES).toHaveLength(12);
    expect(FSAFEDS_CATEGORIES).toContain("Cold, Flu & Allergy");
    expect(FSAFEDS_CATEGORIES).toContain("Pain Relief");
    expect(FSAFEDS_CATEGORIES).toContain("First Aid & Wound Care");
    expect(FSAFEDS_CATEGORIES).toContain("Skin & Sun Care");
    expect(FSAFEDS_CATEGORIES).toContain("Vision & Eye Care");
    expect(FSAFEDS_CATEGORIES).toContain("Dental & Oral Treatments");
    expect(FSAFEDS_CATEGORIES).toContain("Diagnostics & Monitoring");
    expect(FSAFEDS_CATEGORIES).toContain("Menstrual & Reproductive Health");
    expect(FSAFEDS_CATEGORIES).toContain("Digestive Health");
    expect(FSAFEDS_CATEGORIES).toContain("Mobility & Recovery");
    expect(FSAFEDS_CATEGORIES).toContain("Hearing Care");
    expect(FSAFEDS_CATEGORIES).toContain("Other Medical Supplies");
  });

  describe("Category Classification for Physical Products", () => {
    it("maps allergy and sinus products to Cold, Flu & Allergy", () => {
      expect(mapToFsafedsCategory("Kirkland Signature Aller-Tec Cetirizine 10mg Tablets")).toBe(
        "Cold, Flu & Allergy"
      );
      expect(mapToFsafedsCategory("Flonase Allergy Relief 24 Hour Nasal Spray")).toBe(
        "Cold, Flu & Allergy"
      );
      expect(mapToFsafedsCategory("Halls Menthol Cough Drops Cherry")).toBe(
        "Cold, Flu & Allergy"
      );
    });

    it("maps pain medications and therapy devices to Pain Relief", () => {
      expect(mapToFsafedsCategory("Advil Ibuprofen 200mg Tablets")).toBe("Pain Relief");
      expect(mapToFsafedsCategory("Tylenol Extra Strength Acetaminophen 500mg")).toBe("Pain Relief");
      expect(mapToFsafedsCategory("Sunbeam King Size Heating Pad")).toBe("Pain Relief");
      expect(mapToFsafedsCategory("Omron TENS Unit Electronic Pulse Massager")).toBe("Pain Relief");
    });

    it("maps first aid and antiseptic items to First Aid & Wound Care", () => {
      expect(mapToFsafedsCategory("Band-Aid Brand Adhesive Bandages Flexible Fabric")).toBe(
        "First Aid & Wound Care"
      );
      expect(mapToFsafedsCategory("Neosporin + Pain Relief First Aid Antibiotic Ointment")).toBe(
        "First Aid & Wound Care"
      );
    });

    it("maps broad spectrum sunscreen and medicated skincare to Skin & Sun Care", () => {
      expect(mapToFsafedsCategory("Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 55")).toBe(
        "Skin & Sun Care"
      );
      expect(mapToFsafedsCategory("PanOxyl Acne Foaming Wash Benzoyl Peroxide 10%")).toBe(
        "Skin & Sun Care"
      );
    });

    it("maps eye solutions and OTC reading glasses to Vision & Eye Care", () => {
      expect(mapToFsafedsCategory("TheraTears Dry Eye Therapy Lubricant Eye Drops")).toBe(
        "Vision & Eye Care"
      );
      expect(mapToFsafedsCategory("Opti-Free Puremoist Multi-Purpose Disinfecting Solution")).toBe(
        "Vision & Eye Care"
      );
      expect(mapToFsafedsCategory("Foster Grant Reading Glasses +1.50")).toBe(
        "Vision & Eye Care"
      );
    });

    it("maps night guards and dental pain relievers to Dental & Oral Treatments", () => {
      expect(mapToFsafedsCategory("DenTek Professional Fit Dental Night Guard")).toBe(
        "Dental & Oral Treatments"
      );
      expect(mapToFsafedsCategory("Orajel Maximum Strength Toothache Relief Gel")).toBe(
        "Dental & Oral Treatments"
      );
    });

    it("maps clinical monitors and rapid tests to Diagnostics & Monitoring", () => {
      expect(mapToFsafedsCategory("Omron Upper Arm Blood Pressure Monitor Series 500")).toBe(
        "Diagnostics & Monitoring"
      );
      expect(mapToFsafedsCategory("BinaxNOW COVID-19 Rapid Antigen Self Test Kit")).toBe(
        "Diagnostics & Monitoring"
      );
      expect(mapToFsafedsCategory("Contour Next Blood Glucose Test Strips 100 Count")).toBe(
        "Diagnostics & Monitoring"
      );
    });

    it("maps menstrual care and pregnancy tests to Menstrual & Reproductive Health", () => {
      expect(mapToFsafedsCategory("Tampax Pearl Regular Absorbency Tampons")).toBe(
        "Menstrual & Reproductive Health"
      );
      expect(mapToFsafedsCategory("Clearblue Early Detection Digital Pregnancy Test")).toBe(
        "Menstrual & Reproductive Health"
      );
      expect(mapToFsafedsCategory("Trojan Ultra Ribbed Condoms 36 Pack")).toBe(
        "Menstrual & Reproductive Health"
      );
    });

    it("maps antacids and digestive aids to Digestive Health", () => {
      expect(mapToFsafedsCategory("Tums Ultra Strength 1000 Antacid Tablets")).toBe(
        "Digestive Health"
      );
      expect(mapToFsafedsCategory("MiraLAX Laxative Powder for Gentle Constipation Relief")).toBe(
        "Digestive Health"
      );
      expect(mapToFsafedsCategory("Pepcid AC Maximum Strength Famotidine 20mg Tablets")).toBe(
        "Digestive Health"
      );
    });

    it("maps medical compression and braces to Mobility & Recovery", () => {
      expect(mapToFsafedsCategory("Futuro Graduated Compression Socks 20-30 mmHg")).toBe(
        "Mobility & Recovery"
      );
      expect(mapToFsafedsCategory("Mueller Adjustable Knee Brace Support")).toBe(
        "Mobility & Recovery"
      );
    });

    it("maps hearing aids and accessories to Hearing Care", () => {
      expect(mapToFsafedsCategory("Lexie B2 Hearing Aids Powered by Bose (OTC)")).toBe(
        "Hearing Care"
      );
      expect(mapToFsafedsCategory("Debrox Earwax Removal Drops Kit")).toBe(
        "Hearing Care"
      );
    });
  });

  describe("Strict Ineligible Rejection & Conditional Exclusion", () => {
    it("rejects ordinary grocery items", () => {
      const res = evaluateFsaEligibility({
        name: "Trader Joe's Organic Granola Snack",
        retailer: "Trader Joe's",
        rawCategory: "grocery",
        explicitFsaBadge: false
      });
      expect(res.isFeedEligible).toBe(false);
      expect(res.rejectionReason).toContain("Ineligible");
      expect(res.eligibility.reviewStatus).toBe("rejected");
    });

    it("rejects standard hygiene toothpaste and toothbrushes", () => {
      const paste = evaluateFsaEligibility({
        name: "Colgate Total Clean Mint Toothpaste 4.8 oz",
        retailer: "Ralphs",
        explicitFsaBadge: false
      });
      expect(paste.isFeedEligible).toBe(false);
      expect(paste.rejectionReason).toContain("toothpaste");

      const brush = evaluateFsaEligibility({
        name: "Oral-B Pro 1000 Electric Toothbrush",
        retailer: "Amazon",
        explicitFsaBadge: false
      });
      expect(brush.isFeedEligible).toBe(false);
      expect(brush.rejectionReason).toContain("toothbrush");
    });

    it("rejects cosmetic teeth whitening and perfumes", () => {
      const whitening = evaluateFsaEligibility({
        name: "Crest 3D White Glamorous White Teeth Whitening Strips",
        retailer: "CVS",
        explicitFsaBadge: false
      });
      expect(whitening.isFeedEligible).toBe(false);
      expect(whitening.rejectionReason).toContain("teeth whitening");
    });

    it("excludes conditional items requiring Prescription or Letter of Medical Necessity (LMN)", () => {
      const multivitamin = evaluateFsaEligibility({
        name: "Nature Made Daily Multivitamin 300 Tablets",
        retailer: "Costco",
        explicitFsaBadge: false
      });
      expect(multivitamin.isFeedEligible).toBe(false);
      expect(multivitamin.eligibility.documentationRequirement).toBe("Letter of Medical Necessity (LMN)");
      expect(multivitamin.eligibility.reviewStatus).toBe("conditional");

      const massageGun = evaluateFsaEligibility({
        name: "Theragun Prime Percussive Massage Gun",
        retailer: "Amazon",
        explicitFsaBadge: false
      });
      expect(massageGun.isFeedEligible).toBe(false);
      expect(massageGun.eligibility.documentationRequirement).toBe("Letter of Medical Necessity (LMN)");
    });

    it("rejects generic items with ambiguous keywords lacking explicit badge or verified evidence", () => {
      const generic = evaluateFsaEligibility({
        name: "Healthy Life General Body Care Lotion",
        retailer: "Amazon",
        explicitFsaBadge: false
      });
      expect(generic.isFeedEligible).toBe(false);
      expect(generic.rejectionReason).toContain("Unverified eligibility");
    });
  });

  describe("Verified Eligible Product Admission", () => {
    it("admits verified product with explicit retailer FSA badge", () => {
      const res = evaluateFsaEligibility({
        name: "Kirkland Signature Aller-Tec 10 mg 365 Tablets",
        retailer: "Costco",
        explicitFsaBadge: true,
        sku: "costco-100412345",
        upc: "096619123456",
        productUrl: "https://www.costco.com/kirkland-signature-aller-tec.html"
      });

      expect(res.isFeedEligible).toBe(true);
      expect(res.eligibility.fsaEligible).toBe(true);
      expect(res.eligibility.category).toBe("Cold, Flu & Allergy");
      expect(res.eligibility.confidence).toBe("high");
      expect(res.eligibility.reviewStatus).toBe("verified");
      expect(res.eligibility.documentationRequirement).toBe("None (OTC Item per CARES Act)");
      expect(res.eligibility.evidenceDescription).toContain("Costco");
    });

    it("admits verified product with exact identifier and verified evidence note", () => {
      const res = evaluateFsaEligibility({
        name: "Omron 3 Series Blood Pressure Monitor",
        retailer: "Amazon",
        asin: "B07S27NVQW",
        upc: "073796263721",
        evidenceNote: "Independently verified FDA 510(k) OTC blood pressure device"
      });

      expect(res.isFeedEligible).toBe(true);
      expect(res.eligibility.category).toBe("Diagnostics & Monitoring");
      expect(res.eligibility.confidence).toBe("high");
      expect(res.eligibility.reviewStatus).toBe("verified");
    });
  });
});
