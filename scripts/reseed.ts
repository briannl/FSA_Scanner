import { SEED_PRODUCTS, INITIAL_STATUS } from "../src/data/seedData";
import { getStorage, ALL_RETAILERS } from "../netlify/functions/shared/storage";

async function main() {
  const storage = getStorage();
  await storage.set("meta:status", INITIAL_STATUS);
  for (const r of ALL_RETAILERS) {
    const items = SEED_PRODUCTS.filter((p) => p.retailer === r);
    const key = `snapshot:${r.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    await storage.set(key, items);
  }
  console.log("Successfully re-seeded clean snapshots for all 10 retailers!");
}

main().catch(console.error);
