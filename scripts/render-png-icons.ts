import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function renderIcons() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const svgPath = path.resolve("public/icon.svg");
  const svgContent = fs.readFileSync(svgPath, "utf8");

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:transparent;">${svgContent}</body></html>`);

  await page.setViewportSize({ width: 512, height: 512 });
  const svgElement = await page.$("svg");
  if (svgElement) {
    await svgElement.screenshot({ path: "public/icon-512.png", omitBackground: false });
    console.log("Generated public/icon-512.png");
  }

  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:transparent;">${svgContent.replace('width="512" height="512"', 'width="192" height="192"')}</body></html>`);
  const svgElement192 = await page.$("svg");
  if (svgElement192) {
    await svgElement192.screenshot({ path: "public/icon-192.png", omitBackground: false });
    console.log("Generated public/icon-192.png");
  }

  await browser.close();
}

renderIcons().catch(console.error);
