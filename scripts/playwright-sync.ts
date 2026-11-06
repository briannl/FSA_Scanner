import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { ProductObservation, Retailer, RetailerStatus, SourceType } from "../src/types/product";
import { parseCvsHtml } from "../netlify/functions/shared/cvsAdapter";
import { parseCostcoHtml } from "../netlify/functions/shared/costcoAdapter";

// Environment Configuration
const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
const appUrl = (process.env.APP_URL || "https://fsatracker.netlify.app").replace(/\/$/, "");
const syncToken = process.env.SYNC_SECRET_TOKEN || "";
const sourceType: SourceType = isGitHubActions ? "github-actions" : "local-playwright";

const DEFAULT_CVS_URLS = [
  "https://www.cvs.com/shop/cvs-health-series-400-upper-arm-blood-pressure-monitor-prodid-108201",
  "https://www.cvs.com/shop/cvs-health-antibacterial-flexible-fabric-bandages-60ct-prodid-882103",
  "https://www.cvs.com/shop/la-roche-posay-anthelios-mineral-ultra-light-sunscreen-spf-50-prodid-492104"
];

const DEFAULT_COSTCO_URLS = [
  "https://www.costco.com/kirkland-signature-aller-tec-10-mg.-365-tablets.product.100412345.html",
  "https://www.costco.com/accu-chek-guide-me-glucose-monitoring-system.product.100654321.html",
  "https://www.costco.com/curad-performance-bandages-200ct.product.100194827.html"
];

interface ScrapeResult {
  retailer: Retailer;
  products: ProductObservation[];
  status: Partial<RetailerStatus>;
}

async function getWatchlistUrls(): Promise<{ cvs: string[]; costco: string[] }> {
  try {
    const res = await fetch(`${appUrl}/api/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.watchlist) && data.watchlist.length > 0) {
        const cvs = data.watchlist.filter((u: string) => u.includes("cvs.com"));
        const costco = data.watchlist.filter((u: string) => u.includes("costco.com"));
        return {
          cvs: cvs.length > 0 ? cvs.slice(0, 5) : DEFAULT_CVS_URLS,
          costco: costco.length > 0 ? costco.slice(0, 5) : DEFAULT_COSTCO_URLS
        };
      }
    }
  } catch (err) {
    console.warn(`[Playwright Sync] Could not fetch remote watchlist from ${appUrl}, using default seed URLs.`);
  }

  return { cvs: DEFAULT_CVS_URLS, costco: DEFAULT_COSTCO_URLS };
}

async function scrapeRetailer(
  retailer: Retailer,
  urls: string[],
  browserContext: any,
  diagnosticLogs: string[]
): Promise<ScrapeResult> {
  const products: ProductObservation[] = [];
  const errors: string[] = [];
  let isRateLimited = false;
  let isBlockedWaf = false;
  let retryAfterSeconds: number | null = null;

  console.log(`\n======================================================`);
  console.log(`[Playwright Sync] Starting ${retailer} Discovery (${urls.length} URLs)`);
  console.log(`======================================================`);

  const page = await browserContext.newPage();

  // Intercept responses for status tracking and circuit breaker triggers
  page.on("response", (response: any) => {
    const status = response.status();
    const url = response.url();
    if (url.includes(retailer.toLowerCase())) {
      if (status === 429) {
        isRateLimited = true;
        const retryHeader = response.headers()["retry-after"];
        if (retryHeader) {
          retryAfterSeconds = parseInt(retryHeader, 10);
        }
      } else if (status === 403) {
        isBlockedWaf = true;
      }
    }
  });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${retailer}] [${i + 1}/${urls.length}] Navigating to: ${url}`);

    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 25000
      });

      const httpStatus = response?.status() ?? 200;

      // 1. Immediate HTTP 429 / 403 Circuit Breaker Check
      if (httpStatus === 429 || isRateLimited) {
        const retryText = retryAfterSeconds ? ` (Retry-After: ${retryAfterSeconds}s)` : "";
        const msg = `HTTP 429: ${retailer} rate limit triggered on ${url}${retryText}`;
        console.warn(`[${retailer}] CIRCUIT BREAKER TRIPPED: ${msg}`);
        errors.push(msg);
        diagnosticLogs.push(`[${retailer}] ${msg}`);
        isRateLimited = true;
        break; // Halt immediately! Do not hammer subsequent URLs.
      }

      if (httpStatus === 403 || isBlockedWaf) {
        const msg = `HTTP 403: ${retailer} Bot Manager / Akamai challenge triggered on ${url}`;
        console.warn(`[${retailer}] CIRCUIT BREAKER TRIPPED: ${msg}`);
        errors.push(msg);
        diagnosticLogs.push(`[${retailer}] ${msg}`);
        isBlockedWaf = true;
        break; // Halt immediately!
      }

      // 2. Human-like natural mouse & scroll jitter
      await page.mouse.move(200 + Math.random() * 400, 300 + Math.random() * 200);
      await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
      await page.waitForTimeout(1000 + Math.random() * 800);

      // 3. Extract rendered page HTML
      const html = await page.content();

      // Check in-page Akamai challenge
      if (html.toLowerCase().includes("access denied") || (html.includes("Reference #") && html.includes("akamai"))) {
        const msg = `HTTP 403: Akamai WAF Challenge page rendered for ${url}`;
        console.warn(`[${retailer}] CIRCUIT BREAKER TRIPPED: ${msg}`);
        errors.push(msg);
        diagnosticLogs.push(`[${retailer}] ${msg}`);
        isBlockedWaf = true;
        break;
      }

      // 4. Parse using existing robust HTML parser
      const parsed = retailer === "CVS" ? parseCvsHtml(html, url) : parseCostcoHtml(html, url);

      if (parsed.length > 0) {
        for (const item of parsed) {
          item.sourceType = sourceType;
          products.push(item);
          console.log(`  ✓ Extracted: "${item.name}" | Price: $${item.currentPrice?.toFixed(2) ?? "—"} | Discount: ${item.discountPercent}%`);
        }
      } else {
        const warnMsg = `No structured product data found in DOM for ${url}`;
        console.warn(`  ⚠ ${warnMsg}`);
        diagnosticLogs.push(`[${retailer}] ${warnMsg}`);
      }

      // 5. Sequential human-like pacing (8,000ms to 12,000ms delay between pages)
      if (i < urls.length - 1) {
        const jitterWait = 8000 + Math.floor(Math.random() * 4000);
        console.log(`  ⏳ Pausing ${jitterWait}ms (human jitter delay) before next product...`);
        await page.waitForTimeout(jitterWait);
      }
    } catch (err: any) {
      const errMsg = `Navigation/Extraction failed for ${url}: ${err.message}`;
      console.error(`  ✖ ${errMsg}`);
      errors.push(errMsg);
      diagnosticLogs.push(`[${retailer}] ${errMsg}`);
    }
  }

  await page.close();

  // Determine final status
  let finalStatus: "success" | "rate_limited" | "blocked_waf" | "error" = "success";
  let diagnosticDetails: string | null = null;

  if (isRateLimited) {
    finalStatus = "rate_limited";
    diagnosticDetails = `${retailer} returned HTTP 429 rate limit. Sequential queue aborted. Prior verified snapshot retained.`;
  } else if (isBlockedWaf) {
    finalStatus = "blocked_waf";
    diagnosticDetails = `${retailer} Akamai Bot Manager challenge detected. Prior verified snapshot retained.`;
  } else if (products.length === 0 && errors.length > 0) {
    finalStatus = "error";
    diagnosticDetails = errors.join("; ");
  }

  return {
    retailer,
    products,
    status: {
      status: finalStatus,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
      diagnosticDetails,
      lastSourceType: sourceType
    }
  };
}

async function postResults(scrapeResult: ScrapeResult): Promise<boolean> {
  const endpoint = `${appUrl}/api/refresh`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (syncToken) {
    headers["Authorization"] = `Bearer ${syncToken}`;
  }

  console.log(`[Playwright Sync] Pushing ${scrapeResult.retailer} payload (${scrapeResult.products.length} products) to: ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        retailer: scrapeResult.retailer,
        products: scrapeResult.products,
        status: scrapeResult.status
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Playwright Sync] Failed to push ${scrapeResult.retailer} to webhook: HTTP ${res.status} - ${errText}`);
      return false;
    }

    const data = await res.json();
    console.log(`[Playwright Sync] Successfully pushed ${scrapeResult.retailer} deals! Webhook response:`, JSON.stringify(data));
    return true;
  } catch (err: any) {
    console.error(`[Playwright Sync] Network error posting ${scrapeResult.retailer} payload:`, err.message);
    return false;
  }
}

async function main() {
  console.log(`[Playwright Sync] Initializing Automated Collector Pipeline`);
  console.log(`  Source: ${sourceType}`);
  console.log(`  Target App: ${appUrl}`);
  console.log(`  Auth Configured: ${syncToken ? "Yes (Bearer token set)" : "No (Open / Local)"}`);

  const diagnosticLogs: string[] = [
    `Playwright Collector Execution Run: ${new Date().toISOString()}`,
    `Source: ${sourceType}`,
    `Target: ${appUrl}`
  ];

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled"
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
  });

  // Mask webdriver flag & mock chrome runtime
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined
    });
    (window as any).chrome = { runtime: {} };
  });

  const { cvs: cvsUrls, costco: costcoUrls } = await getWatchlistUrls();

  // 1. Scrape CVS
  const cvsResult = await scrapeRetailer("CVS", cvsUrls, context, diagnosticLogs);
  await postResults(cvsResult);

  // Small delay between retailer suites
  await new Promise((r) => setTimeout(r, 3000));

  // 2. Scrape Costco
  const costcoResult = await scrapeRetailer("Costco", costcoUrls, context, diagnosticLogs);
  await postResults(costcoResult);

  await browser.close();

  // Write diagnostic log summary for GitHub Actions artifact upload
  const logPath = path.resolve(process.cwd(), "sync-diagnostics.log");
  fs.writeFileSync(logPath, diagnosticLogs.join("\n"), "utf-8");
  console.log(`\n[Playwright Sync] Pipeline completed. Diagnostic log saved to: ${logPath}`);
}

main().catch((err) => {
  console.error("[Playwright Sync] Fatal execution error:", err);
  process.exit(1);
});
