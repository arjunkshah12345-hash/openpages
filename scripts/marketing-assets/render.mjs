#!/usr/bin/env node
/**
 * Render OpenPages marketing mockups → public/space-clone/
 * Replaces scraped OpenAI Space assets with our own product UI.
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const outDir = path.join(root, "public/space-clone");
const assets = path.join(__dirname);

const jobs = [
  { file: "hero.html", out: "hero-visual.png", w: 1080, h: 1080 },
  { file: "visualize.html", out: "visualize.png", w: 1600, h: 900 },
  { file: "collab.html", out: "collab.png", w: 1144, h: 1144 },
  { file: "conversation.html", out: "conversation.png", w: 1144, h: 1144 },
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const job of jobs) {
  const url = `file://${path.join(assets, job.file)}`;
  await page.setViewportSize({ width: job.w, height: job.h });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  const dest = path.join(outDir, job.out);
  await page.screenshot({ path: dest, type: "png" });
  console.log("wrote", dest);
}

// Also write webp-named copies via sharp if available, else symlink png as webp fallback using copy
// Landing references .webp — convert with sips/cwebp or just update page to png.
// Prefer png paths in page; also emit .webp via macOS sips if possible later.

await browser.close();
console.log("done");
