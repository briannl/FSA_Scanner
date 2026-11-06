# Personal FSA Deal Tracker

A production-ready, full-stack personal deal intelligence system that discovers, monitors, and tracks genuine discounts on FSA/HSA-eligible health products from **CVS** and **Costco**.

![FSA Tracker Banner](https://img.shields.io/badge/FSA%2FHSA-Eligible_Deals-0284c7?style=for-the-badge)
![React 18](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![AG Grid Community v33](https://img.shields.io/badge/AG_Grid-v33-red?style=for-the-badge)
![Netlify Functions v2](https://img.shields.io/badge/Netlify_Functions-v2-00ad9f?style=for-the-badge&logo=netlify)
![Netlify Blobs](https://img.shields.io/badge/Netlify_Blobs-Strong_Consistency-00ad9f?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-14_Tests_Passing-green?style=for-the-badge)

---

## 1. Core Architecture & Tech Stack

```
 personal-fsa-deal-tracker/
 ├── src/
 │   ├── components/
 │   │   ├── ControlsBar.tsx          # Quick search, retailer tabs, category dropdown, discounted-only switch
 │   │   ├── HeaderStatusBar.tsx      # Retailer healthbeats, sync times, WAF alerts, on-demand refresh
 │   │   ├── MetricsBar.tsx            # Deal KPIs (active deals, avg savings, drops, total monitored)
 │   │   ├── ProductDetailDrawer.tsx  # Recharts price-history curve, all-time lows, deal condition breakdown
 │   │   ├── ProductGrid.tsx          # AG Grid v33 Community with sorting, filtering, CSV export
 │   │   └── WatchlistImportModal.tsx # URL watchlist manager, JSON/CSV importer, browser bookmarklet
 │   ├── data/
 │   │   └── seedData.ts              # Seed product catalog & historical price points
 │   ├── styles/
 │   │   └── index.css                # Quartz design system tokens & layout styling
 │   ├── types/
 │   │   └── product.ts               # Strict ProductObservation & TrackerStatus contracts
 │   ├── App.tsx                      # State coordinator with API loader and fallback
 │   └── main.tsx                     # React 18 bootstrap
 ├── netlify/
 │   └── functions/
 │       ├── products.ts              # GET/POST /api/products (merged snapshots, histories, metadata)
 │       ├── refresh.ts               # POST /api/refresh (on-demand collection & manual imports)
 │       ├── refresh-scheduled.mts    # Cron job: schedule '0 */12 * * *' (Netlify Scheduled Functions)
 │       └── shared/
 │           ├── collector.ts         # Collection engine, price drop detection, deduplication
 │           ├── costcoAdapter.ts     # Costco scraper & Instant Savings parser
 │           ├── cvsAdapter.ts        # CVS scraper & ExtraCare/BOGO parser
 │           └── storage.ts           # Netlify Blobs wrapper + automatic local filesystem fallback (.data/)
 ├── tests/
 │   ├── fixtures/                    # Sanitized HTML/JSON payloads (CVS & Costco)
 │   ├── costcoAdapter.test.ts        # Costco parser & WAF challenge unit tests
 │   ├── cvsAdapter.test.ts           # CVS parser & ExtraCare coupon unit tests
 │   └── storageAndCollection.test.ts # Snapshot preservation & append-only history tests
 ├── netlify.toml                     # Netlify build, redirects, functions, dev port 8888
 ├── vite.config.ts                   # Vite 6 + API middleware + Rollup chunking
 └── tsconfig.json                    # Strict TypeScript 2022 configuration
```

- **Frontend**: React 18 + Vite + TypeScript.
- **Data Grid**: AG Grid Community v33+ (`ag-grid-community`, `ag-grid-react`, `AllCommunityModule`).
- **Charts**: Recharts with `ResponsiveContainer`, `LineChart`, `Tooltip`, and all-time low `ReferenceLine`.
- **Backend**: Netlify Functions v2 (`@netlify/functions`) utilizing modern Web standard `Request`/`Response` handlers.
- **Persistence**: Netlify Blobs (`@netlify/blobs`) with `getStore({ name: 'fsa-tracker', consistency: 'strong' })` and automatic local filesystem fallback (`.data/blobs/`) for raw Vite runs.
- **Zero Paid Dependencies**: No paid scraping proxies, no paid external databases, and zero LLM API calls for data gathering.

---

## 2. Strict Data Schema & Discount Rules

Every product observation strictly adheres to this TypeScript interface:

```typescript
export interface ProductObservation {
  id: string; // Stable retailer identifier (e.g., "cvs-108201" or "costco-100412345")
  retailer: "CVS" | "Costco";
  name: string;
  category: string; // "Diagnostic" | "OTC Meds" | "First Aid" | "Sun Care" | "Vision"
  currentPrice: number | null;
  regularPrice: number | null;
  unitPrice: string | null;
  size: string | null;
  discountAmount: number; // 0 if no verified reference price
  discountPercent: number; // 0 if no verified reference price (NEVER calculated without trustworthy regularPrice)
  promoType: "Standard Markdown" | "Costco Instant Savings" | "CVS Promo" | "Multi-Buy" | "Coupon Only" | "None";
  promoDetails: string | null; // Flags coupons, BOGO rules, and quantity limits separately
  fsaEligible: boolean;
  priceStatus: "confirmed" | "uncertain" | "unavailable";
  isRecentDrop: boolean; // true if currentPrice dropped compared to previous observation
  lowestHistoricalPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  sourceType: "catalog-api" | "watchlist-page" | "manual-import" | "fixture";
  observedAt: string; // ISO-8601 timestamp string
}
```

### Reliability Principles
1. **Never Overwrite on Failure**: When a retailer scraper encounters an error or bot challenge, valid existing snapshots are strictly retained.
2. **Append-Only History**: Price observations are appended under key `history:<product_id>`, preserving historical price trends.
3. **Trustworthy Discount Rule**: A discount percentage is **never** calculated unless a verifiable reference price exists.
4. **SKU Deduplication**: Deduplication is performed strictly on stable retailer SKUs/IDs.

---

## 3. Retailer Bot Protection (Akamai WAF) & Solution Strategy

### The Scraping Reality
Both **Costco** and **CVS** deploy enterprise bot management (such as **Akamai Bot Manager** and **Cloudflare WAF**). When scraping requests originate from cloud datacenter IP ranges (such as AWS Lambda IPs used by Netlify Functions), the retailers often respond with:
- `HTTP 403 Forbidden`
- Akamai `Reference #... Access Denied` challenge HTML
- Rate limiting `HTTP 429`

### How This App Solves It:
1. **Non-Destructive Degradation**: The scraper catches HTTP 403 / WAF challenges, flags `status: "blocked_waf"`, logs the diagnostic reason to `meta:status`, and **preserves the last valid snapshot**.
2. **Built-In 1-Click Browser Bookmarklet**: Users can bypass datacenter IP restrictions completely by running a 1-click bookmarklet in their personal, authenticated browser. The bookmarklet grabs the verified price and FSA tags from the open tab and copies JSON ready for instant 1-click import into this tracker.
3. **URL Watchlist & Bulk CSV/JSON Importer**: Allows importing individual URLs or bulk batches anytime.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v25.9.0)
- npm 10+

### Step-by-Step Setup
1. **Clone or navigate to the project directory**:
   ```bash
   cd "d:\Project Files\GIT\FSA_Tracker"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.
   - The Vite dev server includes built-in API middleware serving `/api/products` and `/api/refresh`.
   - The storage layer automatically uses local filesystem fallback (`.data/blobs/`), requiring zero cloud credentials to run locally.

4. **Run the test suite**:
   ```bash
   npm test
   ```
   Runs 14 Vitest unit tests verifying CVS parsing, Costco parsing, storage reliability, and WAF challenge handling.

5. **Run production TypeScript check & build**:
   ```bash
   npm run build
   ```

---

## 5. GitHub Synchronization

The local Git repository is initialized on branch `main` with clean, atomic commits:
- `03b3496` chore: scaffold project structure, configuration, and dependencies
- `e7d2cb5` feat(frontend): implement AG Grid v33 FSA deal dashboard, price charts, and import modals
- `4cbd3c9` feat(backend): implement Netlify Functions v2, storage layer with fallback, and collection engine
- `ee43f30` test: add Vitest suites and sanitized HTML/JSON fixtures for CVS and Costco adapters
- `222c807` fix(types): satisfy strict noUnusedParameters and noUnusedLocals compilation

### Link to Your Remote GitHub Repository (3 Terminal Commands)
Run these 3 commands in your terminal to link and push to your GitHub account:

```bash
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/fsa-deal-tracker.git
git branch -M main
git push -u origin main
```

---

## 6. Netlify Production Deployment

### Option A: Deploy via Netlify Web UI (Recommended)
1. Push your repository to GitHub using the 3 commands above.
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** > **Import an existing project** > **GitHub**.
4. Select `fsa-deal-tracker`.
5. Netlify will automatically detect `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
6. Click **Deploy fsa-deal-tracker**.

### Option B: Deploy via Netlify CLI
```bash
npx netlify login
npx netlify init
npx netlify deploy --prod
```

### Netlify Blobs & Scheduled Functions Configuration
- **Netlify Blobs**: Zero manual database provisioning required. The store `fsa-tracker` is provisioned automatically with strong consistency when deployed to Netlify.
- **Scheduled Functions**: Netlify will detect `netlify/functions/refresh-scheduled.mts` and automatically register the cron trigger:
  ```typescript
  export const config: Config = {
    schedule: "0 */12 * * *" // Runs every 12 hours
  };
  ```

---

## 7. Verification Summary

| Phase | Milestone | Status | Verification Method |
|---|---|---|---|
| **Phase 1** | Workspace Scaffold & AG Grid Dashboard | **Passed** | Vite build + Playwright browser visual tests |
| **Phase 2** | Storage Layer & Shared Collection Engine | **Passed** | Local Blobs fallback + API route integration |
| **Phase 3** | CVS Collector Adapter & Fixtures | **Passed** | 6 Vitest tests on sanitized HTML payloads |
| **Phase 4** | Costco Collector Adapter & WAF Guard | **Passed** | 5 Vitest tests on Instant Savings & WAF pages |
| **Phase 5** | Git & GitHub Synchronization | **Passed** | Clean atomic commits on `main` branch |
| **Phase 6** | Production Build & Documentation | **Passed** | `npm test` (14 passed) + `npm run build` (0 errors) |
