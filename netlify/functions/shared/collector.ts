import {
  ProductObservation,
  PricePoint,
  TrackerStatus,
  Retailer,
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
  saveWatchlist
} from "./storage";
import { fetchCvsProducts } from "./cvsAdapter";
import { fetchCostcoProducts } from "./costcoAdapter";

export interface RefreshOptions {
  retailer?: "all" | Retailer;
  force?: boolean;
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
      const adapterResult =
        retailer === "CVS"
          ? await fetchCvsProducts(watchlist)
          : await fetchCostcoProducts(watchlist);

      if (adapterResult.status === "blocked_waf") {
        currentStatus[statusKey].status = "blocked_waf";
        currentStatus[statusKey].errorMessage = adapterResult.errorMessage;
        currentStatus[statusKey].diagnosticDetails = adapterResult.diagnosticDetails;
        // RULE 4: Preserves existing valid snapshot!
        console.warn(`[${retailer}] Blocked by WAF: Retaining existing valid snapshot.`);
        continue;
      }

      if (!adapterResult.success || adapterResult.products.length === 0) {
        currentStatus[statusKey].status = "error";
        currentStatus[statusKey].errorMessage =
          adapterResult.errorMessage || "No products could be extracted from page.";
        // RULE 4: Preserves existing valid snapshot!
        console.warn(`[${retailer}] Collection returned 0 items: Retaining existing valid snapshot.`);
        continue;
      }

      // We have new valid products!
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

export async function getAllProductsData(): Promise<ProductsApiResponse> {
  const [cvsList, costcoList, status, watchlist] = await Promise.all([
    getRetailerSnapshot("CVS"),
    getRetailerSnapshot("Costco"),
    getTrackerStatus(),
    getWatchlist()
  ]);

  const allProducts = [...cvsList, ...costcoList];
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
