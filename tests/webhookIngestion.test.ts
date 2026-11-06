import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import refreshHandler from "../netlify/functions/refresh";
import { ingestScrapedProducts } from "../netlify/functions/shared/collector";
import { getRetailerSnapshot, getProductHistory, saveRetailerSnapshot } from "../netlify/functions/shared/storage";
import { ProductObservation } from "../src/types/product";

describe("Webhook Ingestion & Secret Token Protection", () => {
  const originalEnv = process.env.SYNC_SECRET_TOKEN;

  afterEach(() => {
    process.env.SYNC_SECRET_TOKEN = originalEnv;
    vi.restoreAllMocks();
  });

  const createSampleProduct = (id: string, price: number, observedAt: string): ProductObservation => ({
    id,
    retailer: "Costco",
    name: "Kirkland Signature Aller-Tec 365 Tablets",
    category: "OTC Meds",
    currentPrice: price,
    regularPrice: 14.99,
    unitPrice: "$0.03 / ea",
    size: "365 count",
    discountAmount: 14.99 - price,
    discountPercent: +(((14.99 - price) / 14.99) * 100).toFixed(1),
    promoType: "Costco Instant Savings",
    promoDetails: "$3.50 instant savings",
    fsaEligible: true,
    priceStatus: "confirmed",
    isRecentDrop: false,
    lowestHistoricalPrice: price,
    imageUrl: null,
    productUrl: "https://www.costco.com/sample-aller-tec.html",
    sourceType: "github-actions",
    observedAt
  });

  it("enforces Bearer token authentication when SYNC_SECRET_TOKEN is set", async () => {
    process.env.SYNC_SECRET_TOKEN = "super-secret-token-12345";

    const payload = {
      retailer: "Costco",
      products: [createSampleProduct("costco-auth-test", 11.49, "2026-11-06T12:00:00Z")]
    };

    // 1. Missing Authorization header -> 401
    const unauthReq = new Request("https://example.com/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const unauthRes = await refreshHandler(unauthReq, {} as any);
    expect(unauthRes.status).toBe(401);

    // 2. Invalid Bearer token -> 401
    const wrongTokenReq = new Request("https://example.com/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer wrong-token-xyz"
      },
      body: JSON.stringify(payload)
    });
    const wrongTokenRes = await refreshHandler(wrongTokenReq, {} as any);
    expect(wrongTokenRes.status).toBe(401);

    // 3. Valid Bearer token -> 200
    const validTokenReq = new Request("https://example.com/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer super-secret-token-12345"
      },
      body: JSON.stringify(payload)
    });
    const validTokenRes = await refreshHandler(validTokenReq, {} as any);
    expect(validTokenRes.status).toBe(200);
    const body = await validTokenRes.json();
    expect(body.success).toBe(true);
    expect(body.retailer).toBe("Costco");
  });

  it("recalculates isRecentDrop and lowestHistoricalPrice accurately on price drops", async () => {
    const testSku = `costco-calc-test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // First observation: Baseline $12.99
    const itemDay1 = createSampleProduct(testSku, 12.99, "2026-11-01T10:00:00Z");
    await ingestScrapedProducts("Costco", [itemDay1]);

    const snapDay1 = await getRetailerSnapshot("Costco");
    const p1 = snapDay1.find((x) => x.id === testSku);
    expect(p1).toBeDefined();
    expect(p1?.currentPrice).toBe(12.99);
    expect(p1?.lowestHistoricalPrice).toBe(12.99);
    expect(p1?.isRecentDrop).toBe(false);

    // Second observation: Price drops to $9.99
    const itemDay2 = createSampleProduct(testSku, 9.99, "2026-11-02T10:00:00Z");
    await ingestScrapedProducts("Costco", [itemDay2]);

    const snapDay2 = await getRetailerSnapshot("Costco");
    const p2 = snapDay2.find((x) => x.id === testSku);
    expect(p2?.currentPrice).toBe(9.99);
    expect(p2?.lowestHistoricalPrice).toBe(9.99);
    expect(p2?.isRecentDrop).toBe(true); // Drop detected!

    // Third observation: Price rebounds to $11.49
    const itemDay3 = createSampleProduct(testSku, 11.49, "2026-11-03T10:00:00Z");
    await ingestScrapedProducts("Costco", [itemDay3]);

    const snapDay3 = await getRetailerSnapshot("Costco");
    const p3 = snapDay3.find((x) => x.id === testSku);
    expect(p3?.currentPrice).toBe(11.49);
    expect(p3?.lowestHistoricalPrice).toBe(9.99); // Preserves $9.99 all-time low!
    expect(p3?.isRecentDrop).toBe(false); // Rebound is not a drop

    // Verify append-only history captured all 3 points
    const history = await getProductHistory(testSku);
    expect(history.length).toBeGreaterThanOrEqual(3);
  });

  it("strictly preserves existing valid snapshot when webhook receives 0 items or a blocked status (Rule 4)", async () => {
    const baselineSnapshot = await getRetailerSnapshot("CVS");
    expect(baselineSnapshot.length).toBeGreaterThan(0);

    // Simulate scraper blocked or returning empty array
    const status = await ingestScrapedProducts("CVS", [], {
      status: "blocked_waf",
      errorMessage: "Akamai Bot challenge intercepted",
      diagnosticDetails: "Datacenter IP rate-limited"
    });

    expect(status.cvs.status).toBe("blocked_waf");
    expect(status.cvs.errorMessage).toContain("Akamai Bot challenge");

    // Existing snapshot MUST remain untouched
    const afterSnapshot = await getRetailerSnapshot("CVS");
    expect(afterSnapshot.length).toBe(baselineSnapshot.length);
    expect(afterSnapshot[0].id).toBe(baselineSnapshot[0].id);
  });
});
