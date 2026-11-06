import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const OUTPUT_DIR = "C:\\Users\\brian\\.gemini\\antigravity\\brain\\1e9b3b8a-d45c-462d-9e3e-8dbfce0d4744\\screenshots";

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const viewports = [
    { name: "mockup-375-homepage", width: 375, height: 812 },
    { name: "mockup-390-homepage", width: 390, height: 844 },
    { name: "mockup-430-homepage", width: 430, height: 932 },
    { name: "mockup-768-homepage", width: 768, height: 1024 },
    { name: "mockup-1024-homepage", width: 1024, height: 768 },
    { name: "mockup-1440-homepage", width: 1440, height: 900 },
    { name: "mockup-1920-homepage", width: 1920, height: 1080 }
  ];

  for (const vp of viewports) {
    console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: "dark"
    });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const shotPath = path.join(OUTPUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved: ${shotPath}`);
    await page.close();
  }

  // Mobile 390px Interactive Flow Checks
  console.log("Capturing Mobile 390px Interactive States...");
  const mobPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark"
  });
  await mobPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await mobPage.waitForTimeout(500);

  // 1. Settings Sheet
  const settingsBtn = mobPage.locator(".mockup-settings-btn").first();
  if (await settingsBtn.count() > 0) {
    await settingsBtn.click();
    await mobPage.waitForTimeout(400);
    const settingsFile = path.join(OUTPUT_DIR, "mockup-390-settings-sheet.png");
    await mobPage.screenshot({ path: settingsFile });
    console.log(`Saved: ${settingsFile}`);
    await mobPage.keyboard.press("Escape");
    await mobPage.waitForTimeout(300);
  }

  // 2. Inspect Deal Drawer
  const inspectBtn = mobPage.locator(".editorial-inspect-btn").first();
  if (await inspectBtn.count() > 0) {
    await inspectBtn.click();
    await mobPage.waitForTimeout(400);
    const inspectFile = path.join(OUTPUT_DIR, "mockup-390-inspect-drawer.png");
    await mobPage.screenshot({ path: inspectFile });
    console.log(`Saved: ${inspectFile}`);
    await mobPage.keyboard.press("Escape");
    await mobPage.waitForTimeout(300);
  }

  // 3. Search Tab
  const searchTab = mobPage.locator(".mockup-nav-item:has-text('Search'), button[aria-label='Search and filter products']").first();
  if (await searchTab.count() > 0) {
    await searchTab.click();
    await mobPage.waitForTimeout(400);
    const searchFile = path.join(OUTPUT_DIR, "mockup-390-search-tab.png");
    await mobPage.screenshot({ path: searchFile });
    console.log(`Saved: ${searchFile}`);
  }

  // 4. Saved Tab
  const savedTab = mobPage.locator(".mockup-nav-item:has-text('Saved'), button[aria-label='Saved products']").first();
  if (await savedTab.count() > 0) {
    await savedTab.click();
    await mobPage.waitForTimeout(400);
    const savedFile = path.join(OUTPUT_DIR, "mockup-390-saved-tab.png");
    await mobPage.screenshot({ path: savedFile });
    console.log(`Saved: ${savedFile}`);
  }

  // 5. Insights Tab
  const insightsTab = mobPage.locator(".mockup-nav-item:has-text('Insights'), button[aria-label='Price insights and spreadsheet']").first();
  if (await insightsTab.count() > 0) {
    await insightsTab.click();
    await mobPage.waitForTimeout(400);
    const insightsFile = path.join(OUTPUT_DIR, "mockup-390-insights-tab.png");
    await mobPage.screenshot({ path: insightsFile });
    console.log(`Saved: ${insightsFile}`);
  }

  await mobPage.close();
  await browser.close();

  console.log("All pixel-accurate mockup screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
