import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = path.resolve(
  "C:/Users/brian/.gemini/antigravity/brain/1e9b3b8a-d45c-462d-9e3e-8dbfce0d4744/screenshots"
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVisualCapture() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  console.log("Launched Chrome for visual verification...");

  // 1. Mobile 390px (iPhone 14/15/16) - Default Scan Homepage
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const outPath = path.join(SCREENSHOT_DIR, "scanner-390-homepage.png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved: ${outPath}`);

    // Click "Start scanning" to open camera modal
    const startScanBtn = await page.$(".editorial-scanner-start-btn");
    if (startScanBtn) {
      await startScanBtn.click();
      await page.waitForTimeout(800);
      const modalPath = path.join(SCREENSHOT_DIR, "scanner-390-camera-modal.png");
      await page.screenshot({ path: modalPath, fullPage: false });
      console.log(`Saved: ${modalPath}`);

      // Close modal
      const closeBtn = await page.$(".scanner-close-btn");
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // Open Manual Barcode Entry
    const manualBtn = await page.$(".scanner-manual-link-btn");
    if (manualBtn) {
      await manualBtn.click();
      await page.waitForTimeout(400);
      const manualPath = path.join(SCREENSHOT_DIR, "scanner-390-manual-entry.png");
      await page.screenshot({ path: manualPath, fullPage: false });
      console.log(`Saved: ${manualPath}`);

      // Click the quick test sample for BP Monitor (Eligible)
      const sampleChip = await page.$("button:has-text('BP Monitor')");
      if (sampleChip) {
        await sampleChip.click();
        await page.waitForTimeout(200);
        const submitBtn = await page.$("button:has-text('Look Up FSA Eligibility')");
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(600);

        const eligibleResultPath = path.join(SCREENSHOT_DIR, "scanner-390-result-eligible.png");
        await page.screenshot({ path: eligibleResultPath, fullPage: false });
        console.log(`Saved: ${eligibleResultPath}`);

        // Dismiss result
        const resultClose = await page.$(".scan-result-close-btn");
        if (resultClose) await resultClose.click();
        await page.waitForTimeout(300);
      }
    }

    // Test Multivitamin (Conditional / Needs LMN)
    const manualBtn2 = await page.$(".scanner-manual-link-btn");
    if (manualBtn2) {
      await manualBtn2.click();
      await page.waitForTimeout(300);
      const multiChip = await page.$("button:has-text('Multivitamin')");
      if (multiChip) {
        await multiChip.click();
        const submitBtn = await page.$("button:has-text('Look Up FSA Eligibility')");
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(600);

        const condPath = path.join(SCREENSHOT_DIR, "scanner-390-result-conditional.png");
        await page.screenshot({ path: condPath, fullPage: false });
        console.log(`Saved: ${condPath}`);

        const resultClose = await page.$(".scan-result-close-btn");
        if (resultClose) await resultClose.click();
        await page.waitForTimeout(300);
      }
    }

    // Test Doritos (Ineligible / Not Eligible)
    const manualBtn3 = await page.$(".scanner-manual-link-btn");
    if (manualBtn3) {
      await manualBtn3.click();
      await page.waitForTimeout(300);
      const doritosChip = await page.$("button:has-text('Doritos')");
      if (doritosChip) {
        await doritosChip.click();
        const submitBtn = await page.$("button:has-text('Look Up FSA Eligibility')");
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(600);

        const inelPath = path.join(SCREENSHOT_DIR, "scanner-390-result-not-eligible.png");
        await page.screenshot({ path: inelPath, fullPage: false });
        console.log(`Saved: ${inelPath}`);

        const resultClose = await page.$(".scan-result-close-btn");
        if (resultClose) await resultClose.click();
        await page.waitForTimeout(300);
      }
    }

    // Test Unknown Barcode -> Manual Identification Modal
    const manualBtn4 = await page.$(".scanner-manual-link-btn");
    if (manualBtn4) {
      await manualBtn4.click();
      await page.waitForTimeout(300);
      const input = await page.$(".scanner-digits-input");
      if (input) {
        await input.fill("999999000001");
        await page.waitForTimeout(200);
        await input.press("Enter");
        // Wait for Product Not Found modal to appear after lookup completes
        await page.waitForSelector("h3:has-text('Product Not Found')", { timeout: 6000 });
        await page.waitForTimeout(400);

        const unkPath = path.join(SCREENSHOT_DIR, "scanner-390-result-unidentified.png");
        await page.screenshot({ path: unkPath, fullPage: false });
        console.log(`Saved: ${unkPath}`);

        const modalClose = await page.$(".scanner-close-btn");
        if (modalClose) await modalClose.click();
        await page.waitForTimeout(300);
      }
    }

    // Navigate to Saved Tab
    const savedNavBtn = await page.$("button[aria-label='Saved products and scans']");
    if (savedNavBtn) {
      await savedNavBtn.click();
      await page.waitForTimeout(500);
      const savedPath = path.join(SCREENSHOT_DIR, "scanner-390-saved-tab.png");
      await page.screenshot({ path: savedPath, fullPage: false });
      console.log(`Saved: ${savedPath}`);
    }

    // Navigate to Deals Tab
    const dealsNavBtn = await page.$("button[aria-label='Active FSA deals and discounts']");
    if (dealsNavBtn) {
      await dealsNavBtn.click();
      await page.waitForTimeout(500);
      const dealsPath = path.join(SCREENSHOT_DIR, "scanner-390-deals-tab.png");
      await page.screenshot({ path: dealsPath, fullPage: false });
      console.log(`Saved: ${dealsPath}`);
    }

    await page.close();
  }

  // 2. Mobile 375px (iPhone SE)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const outPath = path.join(SCREENSHOT_DIR, "scanner-375-homepage.png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved: ${outPath}`);
    await page.close();
  }

  // 3. Mobile 430px (iPhone 15 Pro Max)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const outPath = path.join(SCREENSHOT_DIR, "scanner-430-homepage.png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved: ${outPath}`);
    await page.close();
  }

  // 4. Tablet 768px (iPad)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const outPath = path.join(SCREENSHOT_DIR, "scanner-768-homepage.png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved: ${outPath}`);
    await page.close();
  }

  // 5. Desktop 1440px
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const outPath = path.join(SCREENSHOT_DIR, "scanner-1440-homepage.png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved: ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log("All in-store visual screenshots captured successfully!");
}

runVisualCapture().catch(console.error);
