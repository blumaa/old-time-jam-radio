#!/usr/bin/env node
/**
 * Generate PWA icons using Playwright to render the canvas from generate-icons.html.
 * Writes icon-192.png and icon-512.png to public/.
 */

import { chromium } from "playwright";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "generate-icons.html");
const publicDir = resolve(__dirname, "..", "public");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`);

  for (const size of [192, 512]) {
    const canvas = page.locator(`#c${size}`);
    const dataUrl = await canvas.evaluate((el) => el.toDataURL("image/png"));
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const outPath = resolve(publicDir, `icon-${size}.png`);
    const { writeFileSync } = await import("fs");
    writeFileSync(outPath, buffer);
    console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
