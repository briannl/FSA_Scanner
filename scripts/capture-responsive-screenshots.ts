import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const OUTPUT_DIR = "C:/Users/brian/.gemini/antigravity/brain/1e9b3b8a-d45c-462d-9e3e-8dbfce0d4744/screenshots";

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const viewports = [
    { name: "desktop-1920-dark", width: 1920, height: 1080, theme: "dark" },
    { name: "desktop-1920-light", width: 1920, height: 1080, theme: "light" },
    { name: "desktop-1440-dark", width: 1440, height: 900, theme: "dark" },
    { name: "tablet-1024-dark", width: 1024, height: 768, theme: "dark" },
    { name: "tablet-768-dark", width: 768, height: 1024, theme: "dark" },
    { name: "mobile-390-dark", width: 390, height: 844, theme: "dark" },
    { name: "mobile-390-light", width: 390, height: 844, theme: "light" },
    { name: "mobile-320-dark", width: 320, height: 568, theme: "dark" },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: vp.theme as any
    });

    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // If light mode requested, click theme toggle
    if (vp.theme === "light") {
      const toggle = page.locator('button[aria-label*="Light Mode"]').first();
      if (await toggle.count() > 0) {
        await toggle.click();
        await page.waitForTimeout(400);
      }
    }

    const filepath = path.join(OUTPUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Saved screenshot: ${filepath}`);

    // If mobile-390-dark, take scrolled card view and bottom sheet view
    if (vp.name === "mobile-390-dark") {
      // 1. Scrolled to cards
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(400);
      const scrolledFile = path.join(OUTPUT_DIR, "mobile-390-cards-scrolled.png");
      await page.screenshot({ path: scrolledFile });
      console.log(`Saved screenshot: ${scrolledFile}`);

      // 2. Open Inspect Bottom Sheet
      const firstInspectBtn = page.locator(".mobile-action-btn").first();
      if (await firstInspectBtn.count() > 0) {
        await firstInspectBtn.click();
        await page.waitForTimeout(600);
        const sheetFile = path.join(OUTPUT_DIR, "mobile-390-bottom-sheet.png");
        await page.screenshot({ path: sheetFile });
        console.log(`Saved screenshot: ${sheetFile}`);
      }
    }

    // If mobile-320-dark, take scrolled view
    if (vp.name === "mobile-320-dark") {
      await page.evaluate(() => window.scrollTo(0, 520));
      await page.waitForTimeout(400);
      const scrolled320 = path.join(OUTPUT_DIR, "mobile-320-cards-scrolled.png");
      await page.screenshot({ path: scrolled320 });
      console.log(`Saved screenshot: ${scrolled320}`);
    }

    await page.close();
  }

  // Desktop side panel drawer at 1440px
  const drawerPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark"
  });
  await drawerPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await drawerPage.waitForTimeout(800);
  const firstDeskInspect = drawerPage.locator(".btn-inspect").first();
  if (await firstDeskInspect.count() > 0) {
    await firstDeskInspect.click();
    await drawerPage.waitForTimeout(600);
    const drawerFile = path.join(OUTPUT_DIR, "desktop-1440-drawer-open.png");
    await drawerPage.screenshot({ path: drawerFile });
    console.log(`Saved screenshot: ${drawerFile}`);
  }
  await drawerPage.close();

  // Discover & Compare Stores View (Desktop)
  const discoverPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark"
  });
  await discoverPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await discoverPage.waitForTimeout(800);

  const discoverTab = discoverPage.locator('button:has-text("Discover Stores & Compare")').first();
  if (await discoverTab.count() > 0) {
    await discoverTab.click();
    await discoverPage.waitForTimeout(600);
    const discoverFile = path.join(OUTPUT_DIR, "desktop-1440-discover.png");
    await discoverPage.screenshot({ path: discoverFile });
    console.log(`Saved screenshot: ${discoverFile}`);

    // Click "Compare" button on first multi-store item to open CompareOffersModal
    const compareBtn = discoverPage.locator('button:has-text("Compare (")').first();
    if (await compareBtn.count() > 0) {
      await compareBtn.click();
      await discoverPage.waitForTimeout(600);
      const compareModalFile = path.join(OUTPUT_DIR, "desktop-1440-compare-modal.png");
      await discoverPage.screenshot({ path: compareModalFile });
      console.log(`Saved screenshot: ${compareModalFile}`);
    }
  }
  await discoverPage.close();

  // Mobile Discover & Compare View (Mobile 390px)
  const mobileDiscoverPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark"
  });
  await mobileDiscoverPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await mobileDiscoverPage.waitForTimeout(800);
  const mobileDiscoverTab = mobileDiscoverPage.locator('button:has-text("Discover")').first();
  if (await mobileDiscoverTab.count() > 0) {
    await mobileDiscoverTab.click();
    await mobileDiscoverPage.waitForTimeout(500);
    const mobDiscoverFile = path.join(OUTPUT_DIR, "mobile-390-discover.png");
    await mobileDiscoverPage.screenshot({ path: mobDiscoverFile });
    console.log(`Saved screenshot: ${mobDiscoverFile}`);

    const mobCompareBtn = mobileDiscoverPage.locator('button:has-text("Compare (")').first();
    if (await mobCompareBtn.count() > 0) {
      await mobCompareBtn.click();
      await mobileDiscoverPage.waitForTimeout(600);
      const mobCompareModalFile = path.join(OUTPUT_DIR, "mobile-390-compare-modal.png");
      await mobileDiscoverPage.screenshot({ path: mobCompareModalFile });
      console.log(`Saved screenshot: ${mobCompareModalFile}`);
    }
  }
  await mobileDiscoverPage.close();

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
