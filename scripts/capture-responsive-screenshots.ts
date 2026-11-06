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
    { name: "mobile-320-dark", width: 320, height: 568, theme: "dark" },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: vp.theme as any
    });

    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // If light mode requested, click theme toggle
    if (vp.theme === "light") {
      const toggle = page.locator('button[aria-label*="Light Mode"]');
      if (await toggle.count() > 0) {
        await toggle.click();
        await page.waitForTimeout(500);
      }
    }

    const filepath = path.join(OUTPUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Saved screenshot: ${filepath}`);

    // If mobile-390, also take one with overflow menu open and one scrolled to cards
    if (vp.name === "mobile-390-dark") {
      // Scrolled to cards
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(400);
      const scrolledFile = path.join(OUTPUT_DIR, "mobile-390-cards-scrolled.png");
      await page.screenshot({ path: scrolledFile });
      console.log(`Saved screenshot: ${scrolledFile}`);

      // Reset scroll and open overflow menu
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const menuBtn = page.locator('button[aria-label="Open secondary navigation menu"]');
      if (await menuBtn.count() > 0) {
        await menuBtn.click();
        await page.waitForTimeout(300);
        const overflowFile = path.join(OUTPUT_DIR, "mobile-390-overflow-menu.png");
        await page.screenshot({ path: overflowFile });
        console.log(`Saved screenshot: ${overflowFile}`);
      }
    }

    // If mobile-320, also take one scrolled to cards
    if (vp.name === "mobile-320-dark") {
      await page.evaluate(() => window.scrollTo(0, 650));
      await page.waitForTimeout(400);
      const scrolledFile320 = path.join(OUTPUT_DIR, "mobile-320-cards-scrolled.png");
      await page.screenshot({ path: scrolledFile320 });
      console.log(`Saved screenshot: ${scrolledFile320}`);
    }

    await page.close();
  }

  // Also take one with Product Inspector Drawer open at 1440px
  const drawerPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark"
  });
  await drawerPage.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await drawerPage.waitForTimeout(1000);
  const firstInspectBtn = drawerPage.locator(".btn-inspect").first();
  if (await firstInspectBtn.count() > 0) {
    await firstInspectBtn.click();
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
