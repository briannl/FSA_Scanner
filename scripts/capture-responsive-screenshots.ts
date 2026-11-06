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

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
