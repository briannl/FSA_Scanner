import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCostcoProducts } from "../netlify/functions/shared/costcoAdapter";
import { fetchCvsProducts } from "../netlify/functions/shared/cvsAdapter";
import { getPrioritizedWatchlist, runCollection } from "../netlify/functions/shared/collector";
import { getRetailerSnapshot } from "../netlify/functions/shared/storage";

describe("Rate Limiting & Circuit Breaker Protection", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("Costco circuit breaker halts immediately on HTTP 429 without hammering subsequent URLs", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve(
        new Response("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" }
        })
      );
    });
    global.fetch = fetchMock;

    const testUrls = [
      "https://www.costco.com/item1.product.1001.html",
      "https://www.costco.com/item2.product.1002.html",
      "https://www.costco.com/item3.product.1003.html"
    ];

    const result = await fetchCostcoProducts(testUrls, {
      batchLimit: 3,
      skipDelayForTesting: true
    });

    // CIRCUIT BREAKER VERIFICATION:
    // Should break immediately after the first 429, NOT continue with URLs 2 and 3!
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe("rate_limited");
    expect(result.structuredErrors).toBeDefined();
    expect(result.structuredErrors?.length).toBe(1);

    const err = result.structuredErrors![0];
    expect(err.retailer).toBe("Costco");
    expect(err.statusCode).toBe("HTTP 429");
    expect(err.retryAfter).toBe(60);
    expect(err.url).toBe(testUrls[0]);

    // Ensure error message does not concatenate words without spaces
    expect(result.errorMessage).not.toContain("item1Costco:");
  });

  it("CVS circuit breaker halts immediately on HTTP 403 Akamai block without hammering subsequent URLs", async () => {
    const fetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response("Access Denied", {
          status: 403,
          headers: {}
        })
      );
    });
    global.fetch = fetchMock;

    const testUrls = [
      "https://www.cvs.com/shop/item1-prodid-111",
      "https://www.cvs.com/shop/item2-prodid-222",
      "https://www.cvs.com/shop/item3-prodid-333"
    ];

    const result = await fetchCvsProducts(testUrls, {
      batchLimit: 3,
      skipDelayForTesting: true
    });

    // Should break immediately after first 403
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe("blocked_waf");
    expect(result.structuredErrors?.length).toBe(1);
    expect(result.structuredErrors![0].statusCode).toBe("HTTP 403");
  });

  it("prioritizes unobserved and stalest watchlist URLs and enforces 3-URL batch cap", async () => {
    const candidateUrls = [
      "https://www.costco.com/item1.product.1.html",
      "https://www.costco.com/item2.product.2.html",
      "https://www.costco.com/item3.product.3.html",
      "https://www.costco.com/item4.product.4.html",
      "https://www.costco.com/item5.product.5.html"
    ];

    const prioritized = await getPrioritizedWatchlist("Costco", candidateUrls, 3);
    expect(prioritized.length).toBe(3);
  });

  it("preserves valid stored snapshot when collection is halted by HTTP 429 circuit breaker", async () => {
    // 1. Get initial snapshot
    const initialCostcoSnapshot = await getRetailerSnapshot("Costco");
    expect(initialCostcoSnapshot.length).toBeGreaterThan(0);

    // 2. Mock 429 rate limit
    global.fetch = vi.fn().mockResolvedValue(
      new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "30" }
      })
    );

    // 3. Run collection
    const status = await runCollection({ retailer: "Costco" });
    expect(status.costco.status).toBe("rate_limited");

    // 4. Verify valid snapshot is still intact and not overwritten
    const afterSnapshot = await getRetailerSnapshot("Costco");
    expect(afterSnapshot.length).toBe(initialCostcoSnapshot.length);
    expect(afterSnapshot[0].id).toBe(initialCostcoSnapshot[0].id);
  });
});
