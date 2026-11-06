import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const OUTPUT_DIR = "C:\\Users\\brian\\.gemini\\antigravity\\brain\\1e9b3b8a-d45c-462d-9e3e-8dbfce0d4744\\screenshots";

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // 1. Mobile 390px — Deals Page (First Screen Above the Fold)
  console.log("Testing Mobile 390px Deals...");
  const page390 = await browser.newPage({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark"
  });
  await page390.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page390.waitForTimeout(600);

  const mobDealsFile = path.join(OUTPUT_DIR, "mobile-390-deals.png");
  await page390.screenshot({ path: mobDealsFile });
  console.log(`Saved: ${mobDealsFile}`);

  // 2. Open Product Inspector Bottom Sheet
  console.log("Testing Mobile 390px Product Inspector Sheet...");
  const firstCard = page390.locator(".minimal-product-card").first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
    await page390.waitForTimeout(500);
    const inspectFile = path.join(OUTPUT_DIR, "mobile-390-product-inspect.png");
    await page390.screenshot({ path: inspectFile });
    console.log(`Saved: ${inspectFile}`);

    // Close drawer / sheet
    await page390.keyboard.press("Escape");
    await page390.waitForTimeout(400);
  }

  // 3. Save an item via bookmark button
  console.log("Testing Save action on card...");
  const saveBtn = page390.locator(".minimal-save-btn").first();
  if (await saveBtn.count() > 0) {
    await saveBtn.click();
    await page390.waitForTimeout(300);
  }

  // 4. Navigate to Discover View
  console.log("Testing Mobile 390px Discover...");
  const discoverNavBtn = page390.locator(".minimal-bottom-btn:has-text('Discover')").first();
  await discoverNavBtn.click();
  await page390.waitForTimeout(500);
  const mobDiscoverFile = path.join(OUTPUT_DIR, "mobile-390-discover.png");
  await page390.screenshot({ path: mobDiscoverFile });
  console.log(`Saved: ${mobDiscoverFile}`);

  // 5. Open Store Filter Bottom Sheet
  console.log("Testing Store Filter Bottom Sheet...");
  const storeFilterBtn = page390.locator(".compact-filter-btn:has-text('Store')").first();
  if (await storeFilterBtn.count() > 0) {
    await storeFilterBtn.click();
    await page390.waitForTimeout(400);
    const storeSheetFile = path.join(OUTPUT_DIR, "mobile-390-store-sheet.png");
    await page390.screenshot({ path: storeSheetFile });
    console.log(`Saved: ${storeSheetFile}`);

    // Close sheet
    const doneBtn = page390.locator(".bottom-sheet-footer button:has-text('Done')").first();
    if (await doneBtn.count() > 0) {
      await doneBtn.click();
      await page390.waitForTimeout(300);
    }
  }

  // 6. Open Category Filter Bottom Sheet
  console.log("Testing Category Filter Bottom Sheet...");
  const catFilterBtn = page390.locator(".compact-filter-btn:has-text('Category')").first();
  if (await catFilterBtn.count() > 0) {
    await catFilterBtn.click();
    await page390.waitForTimeout(400);
    const catSheetFile = path.join(OUTPUT_DIR, "mobile-390-category-sheet.png");
    await page390.screenshot({ path: catSheetFile });
    console.log(`Saved: ${catSheetFile}`);

    // Close sheet
    const doneBtn = page390.locator(".bottom-sheet-footer button:has-text('Done')").first();
    if (await doneBtn.count() > 0) {
      await doneBtn.click();
      await page390.waitForTimeout(300);
    }
  }

  // 7. Open Advanced Filters Bottom Sheet
  console.log("Testing Advanced Filters Bottom Sheet...");
  const optFilterBtn = page390.locator(".compact-filter-btn:has-text('Filters')").first();
  if (await optFilterBtn.count() > 0) {
    await optFilterBtn.click();
    await page390.waitForTimeout(400);
    const optSheetFile = path.join(OUTPUT_DIR, "mobile-390-filter-sheet.png");
    await page390.screenshot({ path: optSheetFile });
    console.log(`Saved: ${optSheetFile}`);

    // Close sheet
    const applyBtn = page390.locator(".bottom-sheet-footer button:has-text('Apply')").first();
    if (await applyBtn.count() > 0) {
      await applyBtn.click();
      await page390.waitForTimeout(300);
    }
  }

  // 8. Navigate to Saved View
  console.log("Testing Mobile 390px Saved View...");
  const savedNavBtn = page390.locator(".minimal-bottom-btn:has-text('Saved')").first();
  await savedNavBtn.click();
  await page390.waitForTimeout(500);
  const mobSavedFile = path.join(OUTPUT_DIR, "mobile-390-saved-with-items.png");
  await page390.screenshot({ path: mobSavedFile });
  console.log(`Saved: ${mobSavedFile}`);

  await page390.close();

  // 9. Mobile 320px (iPhone SE 1st Gen)
  console.log("Testing Mobile 320px Deals...");
  const page320 = await browser.newPage({
    viewport: { width: 320, height: 568 },
    colorScheme: "dark"
  });
  await page320.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page320.waitForTimeout(500);
  const mob320File = path.join(OUTPUT_DIR, "mobile-320-deals.png");
  await page320.screenshot({ path: mob320File });
  console.log(`Saved: ${mob320File}`);
  await page320.close();

  // 10. Mobile 430px (iPhone 14/15 Pro Max)
  console.log("Testing Mobile 430px Deals...");
  const page430 = await browser.newPage({
    viewport: { width: 430, height: 932 },
    colorScheme: "dark"
  });
  await page430.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page430.waitForTimeout(500);
  const mob430File = path.join(OUTPUT_DIR, "mobile-430-deals.png");
  await page430.screenshot({ path: mob430File });
  console.log(`Saved: ${mob430File}`);
  await page430.close();

  // 11. Tablet 768px (iPad portrait)
  console.log("Testing Tablet 768px Deals...");
  const page768 = await browser.newPage({
    viewport: { width: 768, height: 1024 },
    colorScheme: "dark"
  });
  await page768.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page768.waitForTimeout(500);
  const tab768File = path.join(OUTPUT_DIR, "tablet-768-deals.png");
  await page768.screenshot({ path: tab768File });
  console.log(`Saved: ${tab768File}`);
  await page768.close();

  // 12. Desktop 1440px Deals View
  console.log("Testing Desktop 1440px Deals...");
  const deskPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark"
  });
  await deskPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await deskPage.waitForTimeout(600);
  const deskDealsFile = path.join(OUTPUT_DIR, "desktop-1440-deals.png");
  await deskPage.screenshot({ path: deskDealsFile });
  console.log(`Saved: ${deskDealsFile}`);

  // 13. Desktop 1440px Discover View
  console.log("Testing Desktop 1440px Discover...");
  const deskDiscoverTab = deskPage.locator(".minimal-nav-tab:has-text('Discover')").first();
  await deskDiscoverTab.click();
  await deskPage.waitForTimeout(500);
  const deskDiscoverFile = path.join(OUTPUT_DIR, "desktop-1440-discover.png");
  await deskPage.screenshot({ path: deskDiscoverFile });
  console.log(`Saved: ${deskDiscoverFile}`);

  // 14. Desktop 1440px Saved View
  console.log("Testing Desktop 1440px Saved...");
  const deskSavedTab = deskPage.locator(".minimal-nav-tab:has-text('Saved')").first();
  await deskSavedTab.click();
  await deskPage.waitForTimeout(500);
  const deskSavedFile = path.join(OUTPUT_DIR, "desktop-1440-saved.png");
  await deskPage.screenshot({ path: deskSavedFile });
  console.log(`Saved: ${deskSavedFile}`);

  // 15. Light Mode Check (Desktop)
  console.log("Testing Desktop Light Mode Deals...");
  const deskDealsTab = deskPage.locator(".minimal-nav-tab:has-text('Deals')").first();
  await deskDealsTab.click();
  await deskPage.waitForTimeout(300);
  const themeToggle = deskPage.locator("button[aria-label='Switch to Light Mode']").first();
  if (await themeToggle.count() > 0) {
    await themeToggle.click();
    await deskPage.waitForTimeout(400);
    const lightDealsFile = path.join(OUTPUT_DIR, "desktop-1440-light-deals.png");
    await deskPage.screenshot({ path: lightDealsFile });
    console.log(`Saved: ${lightDealsFile}`);
  }

  await deskPage.close();
  await browser.close();

  console.log("All automated screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
