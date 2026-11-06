# Personal FSA Deal Tracker

A production-ready, full-stack personal deal intelligence system that discovers, monitors, and tracks genuine discounts on FSA/HSA-eligible health products from **CVS** and **Costco**.

![FSA Tracker Banner](https://img.shields.io/badge/FSA%2FHSA-Eligible_Deals-0284c7?style=for-the-badge)
![React 18](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![AG Grid Community v33](https://img.shields.io/badge/AG_Grid-v33-red?style=for-the-badge)
![Playwright](https://img.shields.io/badge/Playwright-Automated_Collector-45ba4b?style=for-the-badge&logo=playwright)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Scheduled_Sync-2088FF?style=for-the-badge&logo=githubactions)
![Netlify Functions v2](https://img.shields.io/badge/Netlify_Functions-v2-00ad9f?style=for-the-badge&logo=netlify)
![Netlify Blobs](https://img.shields.io/badge/Netlify_Blobs-Strong_Consistency-00ad9f?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-21_Tests_Passing-green?style=for-the-badge)

---

## 1. Core Architecture & Tech Stack

```
 personal-fsa-deal-tracker/
 ├── .github/
 │   └── workflows/
 │       └── scrape-deals.yml         # GitHub Actions cron (every 12h) & workflow_dispatch
 ├── scripts/
 │   └── playwright-sync.ts           # Headless Chromium collector with bot-masking & pacing
 ├── src/
 │   ├── components/
 │   │   ├── ControlsBar.tsx          # Quick search, retailer tabs, category dropdown, filter toggles
 │   │   ├── HeaderStatusBar.tsx      # Retailer healthbeats, source badges, WAF alerts, on-demand refresh
 │   │   ├── MetricsBar.tsx            # Deal KPIs (active deals, avg savings, drops, all-time lows)
 │   │   ├── MobileCardView.tsx       # Touch-first card layout for mobile viewports (<768px)
 │   │   ├── ProductDetailDrawer.tsx  # Recharts price-history curve, all-time lows, deal conditions
 │   │   ├── ProductGrid.tsx          # AG Grid v33 Community with sorting, filtering, CSV export
 │   │   └── WatchlistImportModal.tsx # URL watchlist manager, JSON/CSV importer, browser bookmarklet
 │   ├── data/
 │   │   └── seedData.ts              # Seed product catalog & historical price points
 │   ├── styles/
 │   │   └── index.css                # Quartz design system tokens & layout styling
 │   ├── types/
 │   │   └── product.ts               # Strict ProductObservation & TrackerStatus contracts
 │   ├── utils/
 │   │   └── sourceTypeHelper.ts      # Pipeline badge labels and icons
 │   ├── App.tsx                      # State coordinator with API loader and fallback
 │   └── main.tsx                     # React 18 bootstrap
 ├── netlify/
 │   └── functions/
 │       ├── products.ts              # GET/POST /api/products (merged snapshots, histories, metadata)
 │       ├── refresh.ts               # POST /api/refresh (webhook ingestion, on-demand sync, imports)
 │       ├── refresh-scheduled.mts    # Cron job: schedule '0 */12 * * *' (Netlify Scheduled Functions)
 │       └── shared/
 │           ├── collector.ts         # Collection engine, webhook ingestion, deduplication, price drops
 │           ├── costcoAdapter.ts     # Costco scraper & Instant Savings parser with 429 circuit breaker
 │           ├── cvsAdapter.ts        # CVS scraper & ExtraCare/BOGO parser with 403 circuit breaker
 │           └── storage.ts           # Netlify Blobs wrapper + automatic local filesystem fallback (.data/)
 ├── tests/
 │   ├── fixtures/                    # Sanitized HTML/JSON payloads (CVS & Costco)
 │   ├── circuitBreakerAndRateLimit.test.ts # Sequential queue, 3-URL cap, and circuit breaker tests
 │   ├── costcoAdapter.test.ts        # Costco parser & WAF challenge unit tests
 │   ├── cvsAdapter.test.ts           # CVS parser & ExtraCare coupon unit tests
 │   ├── storageAndCollection.test.ts # Snapshot preservation & append-only history tests
 │   └── webhookIngestion.test.ts     # Webhook ingestion, secret token auth & drop recalculation tests
 ├── netlify.toml                     # Netlify build, redirects, functions, dev port 8888
 ├── vite.config.ts                   # Vite 6 + API dev middleware + Rollup chunking
 └── tsconfig.json                    # Strict TypeScript 2022 configuration
```

- **Frontend**: React 18 + Vite + TypeScript.
- **Data Grid**: AG Grid Community v33+ (`ag-grid-community`, `ag-grid-react`, `AllCommunityModule`).
- **Charts**: Recharts with `ResponsiveContainer`, `AreaChart`, gradient fills, tooltips, and all-time low reference lines.
- **Backend & Webhook**: Netlify Functions v2 (`@netlify/functions`) utilizing modern Web standard `Request`/`Response` handlers and optional Bearer token authentication.
- **Automated Collector**: Headless Playwright Chromium runner (`scripts/playwright-sync.ts`) configured with `navigator.webdriver` masking, randomized jitter delays, network inspection, and 429/403 circuit breakers.
- **CI/CD Automation**: GitHub Actions workflow (`.github/workflows/scrape-deals.yml`) running on a 12-hour cron schedule with 1-click manual trigger support.
- **Persistence**: Netlify Blobs (`@netlify/blobs`) with `getStore({ name: 'fsa-tracker', consistency: 'strong' })` and automatic local filesystem fallback (`.data/blobs/`) for raw Vite runs.
- **Zero Paid Dependencies**: No paid scraping proxies, no external databases, and zero LLM API calls for data gathering.

---

## 2. Scraping & Automation Pipelines

To solve retailer anti-bot protections (Akamai Bot Manager and Cloudflare rate-limiting) outside of Netlify's 30-second serverless execution limits, this project provides three complementary data collection paths:

### Pipeline A: Automated GitHub Actions + Playwright (Recommended Cloud Path)
- Configured in `.github/workflows/scrape-deals.yml`.
- Runs automatically every 12 hours (`0 */12 * * *`) and on-demand via `workflow_dispatch`.
- Spins up an Ubuntu runner with a full Playwright Chromium browser.
- Pushes verified product snapshots and diagnostic status directly into the Netlify Blobs store via `/api/refresh`.

#### How to Trigger Manually in the GitHub UI:
1. Navigate to your repository on GitHub: `https://github.com/briannl/FSA_Tracker`.
2. Click the **Actions** tab at the top.
3. In the left sidebar, select **"Automated FSA Deal Discovery & Sync"**.
4. Click the **"Run workflow"** button on the right, select branch `main`, and click the green **"Run workflow"** button.
5. The runner will execute `npm run sync:playwright` and push fresh prices to your Netlify dashboard.

---

### Pipeline B: Local Residential Terminal Sync (Bypass Cloud IP Bans)
If commercial datacenter IP ranges (such as Azure / AWS) are temporarily blocked or rate-limited by retailer bot guards, you can execute the Playwright collector directly from your personal home connection:

#### 1. Quick Local Execution (Against Local Dev Server):
```bash
npm run sync:playwright
```

#### 2. Local Execution (Pushing to Production Netlify Site):
On macOS / Linux / Git Bash:
```bash
APP_URL="https://fsatracker.netlify.app" SYNC_SECRET_TOKEN="your-secret-token" npm run sync:playwright
```

On Windows PowerShell:
```powershell
$env:APP_URL="https://fsatracker.netlify.app"
$env:SYNC_SECRET_TOKEN="your-secret-token"
npm run sync:playwright
```

---

### Pipeline C: 1-Click Browser Bookmarklet
- Available directly inside the web application via the **"Watchlist / Import"** modal or the **"1-Click Bookmarklet Sync"** button.
- Drag the bookmarklet link to your browser bookmarks bar.
- Whenever you are browsing any product page on `cvs.com` or `costco.com`, click the bookmarklet to extract verified pricing and import it directly into your dashboard.

---

## 3. Webhook Authentication & Storage Reliability

The `/api/refresh` endpoint supports ingesting externally scraped product batches.

### Security: Optional Bearer Token Authentication
To secure your webhook against unauthorized writes, define `SYNC_SECRET_TOKEN` in your Netlify site settings:
- In Netlify: **Site configuration** > **Environment variables** > Add `SYNC_SECRET_TOKEN`.
- In GitHub: **Repository Settings** > **Secrets and variables** > **Actions** > Add repository secret `SYNC_SECRET_TOKEN`.
- When set, incoming external push requests must supply:
  ```http
  Authorization: Bearer <SYNC_SECRET_TOKEN>
  ```
- Same-origin dashboard actions and local manual imports continue to operate smoothly.

### Reliability Principles
1. **Never Overwrite on Failure**: When a collector job returns 0 items or trips an Akamai challenge, existing valid product snapshots in Netlify Blobs (`snapshot:cvs` and `snapshot:costco`) are **never overwritten or cleared**.
2. **Append-Only History**: Observations are appended under `history:<product_id>`, preserving historical data for trend analysis.
3. **Accurate Drop & All-Time Low Calculations**: `isRecentDrop` and `lowestHistoricalPrice` are dynamically recalculated against full historical price points.
4. **Stable SKU Deduplication**: Products are deduplicated strictly by retailer identifier (`cvs-<sku>` or `costco-<sku>`).

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js 20+ (tested on Node v25.9.0)
- npm 10+

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
- Built-in Vite API middleware serves `/api/products` and `/api/refresh`.
- Automatic local filesystem fallback stores data under `.data/blobs/`, requiring zero external database credentials.

### Run Tests & Build
```bash
# Run all Vitest unit tests (21 tests)
npm test

# Run TypeScript compilation and production bundle build
npm run build
```

---

## 5. Verification Summary

| Suite | Focus Area | Status | Verification Detail |
|---|---|---|---|
| **Rate Limiting & Circuit Breakers** | Costco/CVS HTTP 429/403 Circuit Breakers | **Passed** | Halts queue immediately on 429/403 without hammering remaining URLs |
| **Webhook Ingestion & Auth** | Netlify `/api/refresh` Endpoint | **Passed** | Validates Bearer token, history appending, drops, and snapshot protection |
| **Storage & Reliability** | Netlify Blobs & Fallback | **Passed** | Refuses empty overwrites, preserves history, updates tracker metadata |
| **CVS Adapter** | HTML & JSON-LD Parser | **Passed** | ExtraCare digital coupons, BOGO multibuy, and Akamai challenge detection |
| **Costco Adapter** | HTML & JSON-LD Parser | **Passed** | Instant Savings reference price calculation and diagnostic bundles |
| **Browser UI Polish** | Visual Ergonomics & Diagnostics | **Passed** | Single-line bot notice, collapsible diagnostics drawer, pipeline source badges |
