import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";
import {
  ProductObservation,
  PricePoint,
  TrackerStatus,
  Retailer
} from "../../../src/types/product";
import {
  SEED_PRODUCTS,
  SEED_PRICE_HISTORIES,
  INITIAL_STATUS
} from "../../../src/data/seedData";

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  listKeys(prefix?: string): Promise<string[]>;
}

class NetlifyBlobsStorage implements StorageAdapter {
  private store: ReturnType<typeof getStore>;

  constructor() {
    this.store = getStore({ name: "fsa-tracker", consistency: "strong" });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await this.store.get(key, { type: "json" });
      return (res as T) ?? null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.store.setJSON(key, value);
  }

  async listKeys(prefix?: string): Promise<string[]> {
    const list = await this.store.list({ prefix });
    return list.blobs.map((b) => b.key);
  }
}

class LocalFsStorage implements StorageAdapter {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), ".data", "blobs");
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private keyToFilePath(key: string): string {
    const safeKey = encodeURIComponent(key);
    return path.join(this.baseDir, `${safeKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.keyToFilePath(key);
    try {
      if (!fs.existsSync(filePath)) return null;
      const raw = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.ensureDir();
    const filePath = this.keyToFilePath(key);
    await fs.promises.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
  }

  async listKeys(prefix?: string): Promise<string[]> {
    try {
      this.ensureDir();
      const files = await fs.promises.readdir(this.baseDir);
      const keys = files
        .filter((f) => f.endsWith(".json"))
        .map((f) => decodeURIComponent(f.replace(/\.json$/, "")));
      if (prefix) {
        return keys.filter((k) => k.startsWith(prefix));
      }
      return keys;
    } catch {
      return [];
    }
  }
}

// Factory returning Netlify Blobs or Local fallback
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (storageInstance) return storageInstance;

  try {
    storageInstance = new NetlifyBlobsStorage();
    if (!process.env.NETLIFY_BLOBS_CONTEXT && !process.env.BLOBS_CONTEXT) {
      throw new Error("Local environment: fallback to filesystem");
    }
  } catch {
    storageInstance = new LocalFsStorage();
  }

  return storageInstance;
}

export const ALL_RETAILERS: Retailer[] = [
  "CVS",
  "Costco",
  "Amazon",
  "Ralphs",
  "Vons",
  "Instacart",
  "H Mart",
  "99 Ranch",
  "Smart & Final",
  "Trader Joe's"
];

// Seed helper: ensure initial data exists in storage
export async function ensureSeeded(storage: StorageAdapter): Promise<void> {
  const existingStatus = await storage.get<TrackerStatus>("meta:status");
  if (!existingStatus) {
    await storage.set("meta:status", INITIAL_STATUS);

    for (const retailer of ALL_RETAILERS) {
      const items = SEED_PRODUCTS.filter((p) => p.retailer === retailer);
      const key = `snapshot:${retailer.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      await storage.set(key, items);
    }

    for (const [id, history] of Object.entries(SEED_PRICE_HISTORIES)) {
      await storage.set(`history:${id}`, history);
    }

    await storage.set("meta:watchlist", [
      "https://www.cvs.com/shop/cvs-health-series-400-upper-arm-blood-pressure-monitor-prodid-108201",
      "https://www.costco.com/kirkland-signature-aller-tec-10-mg.-365-tablets.product.100412345.html"
    ]);
  }
}

// Higher-level storage methods adhering to rules
export async function getRetailerSnapshot(retailer: Retailer): Promise<ProductObservation[]> {
  const storage = getStorage();
  await ensureSeeded(storage);
  const key = `snapshot:${retailer.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const data = await storage.get<ProductObservation[]>(key);
  if (!data || data.length === 0) {
    return SEED_PRODUCTS.filter((p) => p.retailer === retailer);
  }
  return data;
}

export async function saveRetailerSnapshot(
  retailer: Retailer,
  products: ProductObservation[]
): Promise<void> {
  const storage = getStorage();
  const key = `snapshot:${retailer.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  if (!products || products.length === 0) {
    console.warn(`Refusing to overwrite ${key} with empty results`);
    return;
  }
  await storage.set(key, products);
}

export async function getProductHistory(productId: string): Promise<PricePoint[]> {
  const storage = getStorage();
  const history = await storage.get<PricePoint[]>(`history:${productId}`);
  return history || [];
}

export async function appendProductHistory(productId: string, point: PricePoint): Promise<void> {
  const storage = getStorage();
  const key = `history:${productId}`;
  const existing = (await storage.get<PricePoint[]>(key)) || [];
  existing.push(point);
  await storage.set(key, existing);
}

export async function getTrackerStatus(): Promise<TrackerStatus> {
  const storage = getStorage();
  await ensureSeeded(storage);
  const status = await storage.get<TrackerStatus>("meta:status");
  return status || INITIAL_STATUS;
}

export async function updateTrackerStatus(status: TrackerStatus): Promise<void> {
  const storage = getStorage();
  await storage.set("meta:status", status);
}

export async function getWatchlist(): Promise<string[]> {
  const storage = getStorage();
  await ensureSeeded(storage);
  const list = await storage.get<string[]>("meta:watchlist");
  return list || [];
}

export async function saveWatchlist(list: string[]): Promise<void> {
  const storage = getStorage();
  await storage.set("meta:watchlist", list);
}
