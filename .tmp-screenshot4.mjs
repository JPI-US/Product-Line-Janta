import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
await page.waitForSelector(".hero-lead", { timeout: 15000 });
const box = await page.evaluate(() => {
  const el = document.querySelector(".hero-lead");
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { rect, maxWidth: cs.maxWidth, fontSize: cs.fontSize, lineHeight: cs.lineHeight, text: el.textContent };
});
console.log(JSON.stringify(box, null, 2));
const el = await page.$(".hero-copy");
await el.screenshot({ path: process.argv[2] });
await browser.close();
