import {
  ProductObservation,
  PricePoint,
  TrackerStatus,
  Retailer,
  RetailerStatus,
  ProductsApiResponse
} from "../../../src/types/product";
import {
  getRetailerSnapshot,
  saveRetailerSnapshot,
  getProductHistory,
  appendProductHistory,
  getTrackerStatus,
  updateTrackerStatus,
  getWatchlist,
  saveWatchlist,
  ALL_RETAILERS
} from "./storage";
import { fetchCvsProducts } from "./cvsAdapter";
import { fetchCostcoProducts } from "./costcoAdapter";

export interface RefreshOptions {
  retailer?: "all" | Retailer;
  force?: boolean;
}

/**
 * Rotates through the watchlist across runs by selecting the stalest
 * (unobserved or oldest observedAt timestamp) URLs for each retailer up to batchLimit.
 */
export async function getPrioritizedWatchlist(
  retailer: Retailer,
  watchlist: string[],
  batchLimit: number = 3
): Promise<string[]> {
  const domain = retailer === "CVS" ? "cvs.com" : "costco.com";
  const matchingUrls = watchlist.filter((u) => u.toLowerCase().includes(domain));
  if (matchingUrls.length <= batchLimit) {
    return matchingUrls;
  }

  const existingSnapshot = await getRetailerSnapshot(retailer);
  const observedMap = new Map<string, number>();
  for (const item of existingSnapshot) {
    if (item.productUrl) {
      const time = item.observedAt ? new Date(item.observedAt).getTime() : 0;
      observedMap.set(item.productUrl, time);
    }
  }

  // Sort: unobserved items (time === 0) first, followed by oldest observedAt
  const sorted = [...matchingUrls].sort((a, b) => {
    const timeA = observedMap.get(a) ?? 0;
    const timeB = observedMap.get(b) ?? 0;
    return timeA - timeB;
  });

  return sorted.slice(0, batchLimit);
}

export async function runCollection(options: RefreshOptions = {}): Promise<TrackerStatus> {
  const target = options.retailer || "all";
  const watchlist = await getWatchlist();
  const currentStatus = await getTrackerStatus();
  const now = new Date().toISOString();

  const retailersToRun: Retailer[] =
    target === "all" ? ["CVS", "Costco"] : [target];

  for (const retailer of retailersToRun) {
    const statusKey = retailer.toLowerCase() as "cvs" | "costco";
    currentStatus[statusKey].lastAttempt = now;

    try {
      // Prioritize max 3 stalest / unobserved URLs to stay well within 30s timeout
      const prioritizedUrls = await getPrioritizedWatchlist(retailer, watchlist, 3);

      const adapterResult =
        retailer === "CVS"
          ? await fetchCvsProducts(prioritizedUrls, { batchLimit: 3 })
          : await fetchCostcoProducts(prioritizedUrls, { batchLimit: 3 });

      if (adapterResult.status === "blocked_waf" || adapterResult.status === "rate_limited") {
        currentStatus[statusKey].status = adapterResult.status;
        currentStatus[statusKey].errorMessage = adapterResult.errorMessage;
        currentStatus[statusKey].diagnosticDetails = adapterResult.diagnosticDetails;
        currentStatus[statusKey].structuredErrors = adapterResult.structuredErrors;
        // RULE 4: Preserves existing valid snapshot in Netlify Blobs!
        console.warn(`[${retailer}] ${adapterResult.status}: Retaining existing valid snapshot.`);
        continue;
      }

      if (!adapterResult.success || adapterResult.products.length === 0) {
        currentStatus[statusKey].status = "error";
        currentStatus[statusKey].errorMessage =
          adapterResult.errorMessage || "No products could be extracted from page.";
        currentStatus[statusKey].diagnosticDetails = adapterResult.diagnosticDetails || null;
        currentStatus[statusKey].structuredErrors = adapterResult.structuredErrors || [];
        // RULE 4: Preserves existing valid snapshot in Netlify Blobs!
        console.warn(`[${retailer}] Collection returned 0 items: Retaining existing valid snapshot.`);
        continue;
      }

      // Valid products collected!
      // Deduplicate strictly by stable SKU/ID (Rule 5)
      const existingSnapshot = await getRetailerSnapshot(retailer);
      const existingMap = new Map<string, ProductObservation>(
        existingSnapshot.map((p) => [p.id, p])
      );

      const processedProducts: ProductObservation[] = [];

      for (const fresh of adapterResult.products) {
        const prev = existingMap.get(fresh.id);
        const history = await getProductHistory(fresh.id);

        // Price drop check
        const isRecentDrop =
          prev &&
          prev.currentPrice !== null &&
          fresh.currentPrice !== null &&
          fresh.currentPrice < prev.currentPrice;

        // Lowest historical price comparison
        const allHistoricalPrices = history
          .map((h) => h.price)
          .filter((p): p is number => p !== null);
        if (fresh.currentPrice !== null) {
          allHistoricalPrices.push(fresh.currentPrice);
        }
        const lowestHistorical =
          allHistoricalPrices.length > 0 ? Math.min(...allHistoricalPrices) : fresh.currentPrice;

        const merged: ProductObservation = {
          ...fresh,
          sourceType: "netlify-cron",
          isRecentDrop: Boolean(isRecentDrop),
          lowestHistoricalPrice: lowestHistorical,
          observedAt: now
        };

        // Append to append-only history (Rule 2)
        const newPoint: PricePoint = {
          date: now.slice(0, 10),
          price: fresh.currentPrice,
          priceStatus: fresh.priceStatus,
          promoType: fresh.promoType,
          promoDetails: fresh.promoDetails
        };
        await appendProductHistory(fresh.id, newPoint);

        existingMap.set(fresh.id, merged);
        processedProducts.push(merged);
      }

      const updatedSnapshotList = Array.from(existingMap.values());
      // Save valid snapshot (Rule 1 & Rule 4)
      await saveRetailerSnapshot(retailer, updatedSnapshotList);

      currentStatus[statusKey].status = "success";
      currentStatus[statusKey].lastSuccess = now;
      currentStatus[statusKey].itemCount = updatedSnapshotList.length;
      currentStatus[statusKey].errorMessage = null;
      currentStatus[statusKey].diagnosticDetails = null;
      currentStatus[statusKey].structuredErrors = [];
      currentStatus[statusKey].lastSourceType = "netlify-cron";
    } catch (err: any) {
      currentStatus[statusKey].status = "error";
      currentStatus[statusKey].errorMessage = err.message || "Unknown error during collection";
      console.error(`[${retailer}] Unhandled error:`, err);
    }
  }

  currentStatus.updatedAt = now;
  await updateTrackerStatus(currentStatus);
  return currentStatus;
}

/**
 * Securely ingests external scraped products (from GitHub Actions or local Playwright),
 * deduplicating against existing Netlify Blobs snapshot, updating append-only price history,
 * recalculating lowestHistoricalPrice & isRecentDrop, and protecting valid snapshots if empty.
 */
export async function ingestScrapedProducts(
  retailer: Retailer,
  products: ProductObservation[],
  incomingStatus?: Partial<RetailerStatus>
): Promise<TrackerStatus> {
  const statusKey = retailer.toLowerCase() as "cvs" | "costco";
  const currentStatus = await getTrackerStatus();
  const now = new Date().toISOString();

  currentStatus[statusKey].lastAttempt = now;

  // RULE 4: If empty products array or failure, preserve existing valid snapshot!
  if (!products || products.length === 0) {
    console.warn(`[${retailer}] Ingest received 0 products: Preserving existing valid snapshot.`);
    if (incomingStatus) {
      if (incomingStatus.status) currentStatus[statusKey].status = incomingStatus.status;
      if (incomingStatus.errorMessage) currentStatus[statusKey].errorMessage = incomingStatus.errorMessage;
      if (incomingStatus.diagnosticDetails) currentStatus[statusKey].diagnosticDetails = incomingStatus.diagnosticDetails;
      if (incomingStatus.structuredErrors) currentStatus[statusKey].structuredErrors = incomingStatus.structuredErrors;
      if (incomingStatus.lastSourceType) currentStatus[statusKey].lastSourceType = incomingStatus.lastSourceType;
    } else {
      currentStatus[statusKey].status = "error";
      currentStatus[statusKey].errorMessage = "Ingest received 0 items.";
    }
    currentStatus.updatedAt = now;
    await updateTrackerStatus(currentStatus);
    return currentStatus;
  }

  // Deduplicate and merge against existing snapshot
  const existingSnapshot = await getRetailerSnapshot(retailer);
  const existingMap = new Map<string, ProductObservation>(
    existingSnapshot.map((p) => [p.id, p])
  );

  for (const fresh of products) {
    const prev = existingMap.get(fresh.id);
    const history = await getProductHistory(fresh.id);

    // 1. Append new point to append-only history (Rule 2)
    const observationDate = (fresh.observedAt || now).slice(0, 10);
    const newPoint: PricePoint = {
      date: observationDate,
      price: fresh.currentPrice,
      priceStatus: fresh.priceStatus,
      promoType: fresh.promoType,
      promoDetails: fresh.promoDetails
    };
    await appendProductHistory(fresh.id, newPoint);

    // 2. Accurate price drop comparison
    const isRecentDrop =
      prev &&
      prev.currentPrice !== null &&
      fresh.currentPrice !== null &&
      fresh.currentPrice < prev.currentPrice;

    // 3. Accurate lowestHistoricalPrice comparison
    const allHistoricalPrices = history
      .map((h) => h.price)
      .filter((p): p is number => p !== null);
    if (fresh.currentPrice !== null) {
      allHistoricalPrices.push(fresh.currentPrice);
    }
    const lowestHistorical =
      allHistoricalPrices.length > 0 ? Math.min(...allHistoricalPrices) : fresh.currentPrice;

    const merged: ProductObservation = {
      ...fresh,
      isRecentDrop: Boolean(isRecentDrop),
      lowestHistoricalPrice: lowestHistorical,
      observedAt: fresh.observedAt || now
    };

    existingMap.set(fresh.id, merged);
  }

  const updatedSnapshotList = Array.from(existingMap.values());
  // Save merged snapshot (Rule 1 & Rule 4)
  await saveRetailerSnapshot(retailer, updatedSnapshotList);

  currentStatus[statusKey].status = incomingStatus?.status || "success";
  currentStatus[statusKey].lastSuccess = now;
  currentStatus[statusKey].itemCount = updatedSnapshotList.length;
  currentStatus[statusKey].errorMessage = incomingStatus?.errorMessage || null;
  currentStatus[statusKey].diagnosticDetails = incomingStatus?.diagnosticDetails || null;
  currentStatus[statusKey].structuredErrors = incomingStatus?.structuredErrors || [];
  currentStatus[statusKey].lastSourceType =
    products[0]?.sourceType || incomingStatus?.lastSourceType || "github-actions";

  currentStatus.updatedAt = now;
  await updateTrackerStatus(currentStatus);
  return currentStatus;
}

export async function getAllProductsData(): Promise<ProductsApiResponse> {
  const [snapshots, status, watchlist] = await Promise.all([
    Promise.all(ALL_RETAILERS.map((r) => getRetailerSnapshot(r))),
    getTrackerStatus(),
    getWatchlist()
  ]);

  const allProducts = snapshots.flat();
  const histories: Record<string, PricePoint[]> = {};

  await Promise.all(
    allProducts.map(async (p) => {
      histories[p.id] = await getProductHistory(p.id);
    })
  );

  return {
    products: allProducts,
    histories,
    status,
    watchlist
  };
}

export async function addWatchlistUrl(url: string): Promise<string[]> {
  const list = await getWatchlist();
  if (!list.includes(url)) {
    list.push(url);
    await saveWatchlist(list);
  }
  return list;
}

export async function importManualProducts(products: ProductObservation[]): Promise<void> {
  const cvsToImport = products.filter((p) => p.retailer === "CVS");
  const costcoToImport = products.filter((p) => p.retailer === "Costco");

  if (cvsToImport.length > 0) {
    const existing = await getRetailerSnapshot("CVS");
    const map = new Map(existing.map((p) => [p.id, p]));
    cvsToImport.forEach((p) => map.set(p.id, p));
    await saveRetailerSnapshot("CVS", Array.from(map.values()));
  }

  if (costcoToImport.length > 0) {
    const existing = await getRetailerSnapshot("Costco");
    const map = new Map(existing.map((p) => [p.id, p]));
    costcoToImport.forEach((p) => map.set(p.id, p));
    await saveRetailerSnapshot("Costco", Array.from(map.values()));
  }

  // Also append price points
  for (const item of products) {
    await appendProductHistory(item.id, {
      date: item.observedAt.slice(0, 10),
      price: item.currentPrice,
      priceStatus: item.priceStatus,
      promoType: item.promoType,
      promoDetails: item.promoDetails
    });
  }
}
