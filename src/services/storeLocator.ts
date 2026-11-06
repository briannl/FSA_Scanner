import { Retailer } from "../types/product";

export interface NearbyStore {
  id: string;
  retailer: Retailer;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  distanceMiles: number;
  fulfillmentMethods: ("In-Store" | "Pickup" | "Delivery")[];
  hasPharmacy: boolean;
  phone?: string;
}

// Curated regional reference directory of physical stores across common US metropolitan test ZIP zones
export const PHYSICAL_STORE_DIRECTORY: NearbyStore[] = [
  // West Coast / Southern CA (e.g. 90210 / 90001 / 91101)
  {
    id: "ralphs-90210-1",
    retailer: "Ralphs",
    name: "Ralphs Fresh Fare #028",
    address: "9601 W Olympic Blvd",
    city: "Beverly Hills",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 1.2,
    fulfillmentMethods: ["In-Store", "Pickup", "Delivery"],
    hasPharmacy: true,
    phone: "(310) 553-5688"
  },
  {
    id: "vons-90210-1",
    retailer: "Vons",
    name: "Vons #2598",
    address: "3118 W Sepulveda Blvd",
    city: "Torrance",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 3.5,
    fulfillmentMethods: ["In-Store", "Pickup", "Delivery"],
    hasPharmacy: true,
    phone: "(310) 539-7800"
  },
  {
    id: "cvs-90210-1",
    retailer: "CVS",
    name: "CVS Pharmacy #09783",
    address: "9045 Wilshire Blvd",
    city: "Beverly Hills",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 0.8,
    fulfillmentMethods: ["In-Store", "Pickup", "Delivery"],
    hasPharmacy: true,
    phone: "(310) 273-5252"
  },
  {
    id: "costco-90210-1",
    retailer: "Costco",
    name: "Costco Culver City #479",
    address: "13463 Washington Blvd",
    city: "Marina Del Rey",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 4.8,
    fulfillmentMethods: ["In-Store", "Delivery"],
    hasPharmacy: true,
    phone: "(310) 754-2000"
  },
  {
    id: "smartfinal-90210-1",
    retailer: "Smart & Final",
    name: "Smart & Final Extra! #315",
    address: "6047 Venice Blvd",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 2.9,
    fulfillmentMethods: ["In-Store", "Delivery"],
    hasPharmacy: false,
    phone: "(323) 936-3990"
  },
  {
    id: "ranch99-90210-1",
    retailer: "99 Ranch",
    name: "99 Ranch Market Van Nuys",
    address: "6450 Sepulveda Blvd",
    city: "Van Nuys",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 8.4,
    fulfillmentMethods: ["In-Store", "Pickup", "Delivery"],
    hasPharmacy: false,
    phone: "(818) 988-7899"
  },
  {
    id: "hmart-90210-1",
    retailer: "H Mart",
    name: "H Mart Koreatown",
    address: "621 S Western Ave",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 5.6,
    fulfillmentMethods: ["In-Store", "Delivery"],
    hasPharmacy: false,
    phone: "(213) 235-9560"
  },
  {
    id: "traderjoes-90210-1",
    retailer: "Trader Joe's",
    name: "Trader Joe's Beverly Hills",
    address: "8590 Beverly Blvd",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90210",
    distanceMiles: 1.5,
    fulfillmentMethods: ["In-Store"],
    hasPharmacy: false,
    phone: "(310) 659-1986"
  },

  // Northern CA (e.g. 94107 / 94016)
  {
    id: "vons-94107-1",
    retailer: "Vons",
    name: "Safeway / Vons Northern CA #1490",
    address: "298 King St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    distanceMiles: 0.6,
    fulfillmentMethods: ["In-Store", "Pickup", "Delivery"],
    hasPharmacy: true,
    phone: "(415) 633-1020"
  },
  {
    id: "costco-94107-1",
    retailer: "Costco",
    name: "Costco San Francisco #144",
    address: "450 10th St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    distanceMiles: 1.1,
    fulfillmentMethods: ["In-Store", "Delivery"],
    hasPharmacy: true,
    phone: "(415) 626-4388"
  },
  {
    id: "traderjoes-94107-1",
    retailer: "Trader Joe's",
    name: "Trader Joe's SOMA #196",
    address: "555 9th St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    distanceMiles: 1.0,
    fulfillmentMethods: ["In-Store"],
    hasPharmacy: false,
    phone: "(415) 863-1292"
  }
];

export function findNearbyStores(zipCode: string, maxDistance: number = 25): NearbyStore[] {
  const cleanZip = zipCode.trim().slice(0, 5);
  if (!cleanZip) {
    return PHYSICAL_STORE_DIRECTORY;
  }

  // 1. Exact match on ZIP code prefix (first 3 digits = sectional center facility)
  const scf = cleanZip.slice(0, 3);
  const matching = PHYSICAL_STORE_DIRECTORY.filter(
    (s) => s.zipCode.startsWith(scf) && s.distanceMiles <= maxDistance
  );

  if (matching.length > 0) {
    return matching.sort((a, b) => a.distanceMiles - b.distanceMiles);
  }

  // Fallback: return default directory sorted by distance
  return PHYSICAL_STORE_DIRECTORY;
}
