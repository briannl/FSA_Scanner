import { describe, it, expect, beforeEach } from "vitest";
import {
  getRetailerSnapshot,
  saveRetailerSnapshot,
  getProductHistory,
  appendProductHistory,
  getTrackerStatus,
  updateTrackerStatus
} from "../netlify/functions/shared/storage";
import { ProductObservation, PricePoint } from "../src/types/product";

describe("Storage Layer & Reliability Rules", () => {
  it("preserves previous valid snapshot and refuses to overwrite with empty results (Rule 4)", async () => {
    const existing = await getRetailerSnapshot("Costco");
    expect(existing.length).toBeGreaterThan(0);

    // Attempt to save empty array
    await saveRetailerSnapshot("Costco", []);

    // Verify snapshot was NOT overwritten
    const afterEmptyAttempt = await getRetailerSnapshot("Costco");
    expect(afterEmptyAttempt.length).toBe(existing.length);
  });

  it("appends to history array without mutating previous points (Rule 2)", async () => {
    const testSku = "costco-100412345";
    const initialHistory = await getProductHistory(testSku);
    const initialCount = initialHistory.length;

    const newPoint: PricePoint = {
      date: "2026-11-06",
      price: 10.99,
      priceStatus: "confirmed",
      promoType: "Costco Instant Savings",
      promoDetails: "$4.00 Instant Savings"
    };

    await appendProductHistory(testSku, newPoint);
    const updatedHistory = await getProductHistory(testSku);
    expect(updatedHistory.length).toBe(initialCount + 1);
    expect(updatedHistory[updatedHistory.length - 1].price).toBe(10.99);
  });

  it("updates and retrieves tracker status metadata with diagnostic fields (Rule 3)", async () => {
    const status = await getTrackerStatus();
    expect(status.cvs).toBeDefined();
    expect(status.costco).toBeDefined();

    status.costco.status = "blocked_waf";
    status.costco.errorMessage = "Akamai 403 Challenge";
    await updateTrackerStatus(status);

    const reloaded = await getTrackerStatus();
    expect(reloaded.costco.status).toBe("blocked_waf");
    expect(reloaded.costco.errorMessage).toBe("Akamai 403 Challenge");
  });
});
