import { ProductLookupResult } from "../types/scanner";
import { normalizeBarcode } from "../utils/barcodeUtils";
import { CURATED_BARCODE_DATABASE } from "../data/barcodeCatalog";
import { SEED_PRODUCTS } from "../data/seedData";
import { ProductObservation } from "../types/product";

const CACHE_KEY = "fsa_upc_cache_v1";

interface CacheStore {
  [barcode: string]: {
    data: ProductLookupResult;
    cachedAt: number;
  };
}

class ProductLookupServiceImpl {
  private memoryCache: Map<string, ProductLookupResult> = new Map();

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: CacheStore = JSON.parse(raw);
        for (const [barcode, item] of Object.entries(parsed)) {
          // Cache entries valid for 30 days
          if (Date.now() - item.cachedAt < 30 * 24 * 60 * 60 * 1000) {
            this.memoryCache.set(barcode, item.data);
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private persistCache(barcode: string, result: ProductLookupResult) {
    this.memoryCache.set(barcode, result);
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const store: CacheStore = raw ? JSON.parse(raw) : {};
      store[barcode] = {
        data: result,
        cachedAt: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Main lookup method: checks cache -> curated catalog -> seed deals -> Open Products/Beauty/Food Facts -> UPCitemdb
   * Returns null if product is not identified (never fabricates).
   */
  async lookupByBarcode(
    rawBarcode: string,
    additionalDealsCatalog?: ProductObservation[]
  ): Promise<ProductLookupResult | null> {
    const barcode = normalizeBarcode(rawBarcode);
    if (!barcode) return null;

    // 1. Memory / LocalStorage Cache
    if (this.memoryCache.has(barcode)) {
      const cached = this.memoryCache.get(barcode)!;
      return { ...cached, source: "cache" };
    }

    // 2. Curated Barcode Registry
    if (CURATED_BARCODE_DATABASE[barcode]) {
      const curated = CURATED_BARCODE_DATABASE[barcode];
      const result: ProductLookupResult = {
        barcode,
        name: curated.name,
        brand: curated.brand,
        category: curated.category,
        imageUrl: curated.imageUrl,
        source: "local_catalog"
      };
      this.persistCache(barcode, result);
      return result;
    }

    // 3. Existing FSA Tracker Deals Catalog (Seed & live products)
    const catalog = additionalDealsCatalog || SEED_PRODUCTS;
    const matchingDeal = catalog.find(
      (p) => p.upc && normalizeBarcode(p.upc) === barcode
    );
    if (matchingDeal) {
      const result: ProductLookupResult = {
        barcode,
        name: matchingDeal.name,
        brand: matchingDeal.retailer,
        category: matchingDeal.fsafedsCategory || matchingDeal.category,
        imageUrl: matchingDeal.imageUrl,
        source: "local_catalog"
      };
      this.persistCache(barcode, result);
      return result;
    }

    // 4. Open Beauty Facts / Open Products Facts / Open Food Facts APIs
    // These are free, non-authenticated, CORS-enabled global open databases.
    const openFactsResult = await this.queryOpenFactsFamily(barcode);
    if (openFactsResult) {
      this.persistCache(barcode, openFactsResult);
      return openFactsResult;
    }

    // 5. UPCitemdb Trial Fallback (Non-blocking with short timeout)
    const upcItemDbResult = await this.queryUpcItemDb(barcode);
    if (upcItemDbResult) {
      this.persistCache(barcode, upcItemDbResult);
      return upcItemDbResult;
    }

    // Unidentified barcode: Return null so the UI can prompt the user
    // (Never fabricate a product identity)
    return null;
  }

  /**
   * Queries Open Beauty Facts and Open Food Facts APIs
   */
  private async queryOpenFactsFamily(barcode: string): Promise<ProductLookupResult | null> {
    const endpoints = [
      `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`,
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      `https://world.openproductsfacts.org/api/v2/product/${barcode}.json`
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2800); // 2.8s fast timeout
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "FSA-Tracker-InStore/1.0"
          }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 1 && data.product) {
            const prod = data.product;
            const name = prod.product_name || prod.product_name_en || prod.generic_name;
            if (name && name.trim().length > 1) {
              return {
                barcode,
                name: name.trim(),
                brand: prod.brands || prod.brand_owner || undefined,
                category: prod.categories || prod.categories_tags?.[0],
                imageUrl: prod.image_url || prod.image_front_url || null,
                ingredientsText: prod.ingredients_text || prod.ingredients_text_en,
                source: "open_facts",
                raw: prod
              };
            }
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }
    return null;
  }

  /**
   * Queries UPCitemdb Trial API
   */
  private async queryUpcItemDb(barcode: string): Promise<ProductLookupResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            barcode,
            name: item.title,
            brand: item.brand,
            category: item.category,
            imageUrl: item.images?.[0] || null,
            source: "upcitemdb",
            raw: item
          };
        }
      }
    } catch {
      // Ignore timeout or rate limit
    }
    return null;
  }

  /**
   * Clears lookup cache
   */
  clearCache(): void {
    this.memoryCache.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

export const ProductLookupService = new ProductLookupServiceImpl();
