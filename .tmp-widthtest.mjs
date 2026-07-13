import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
await page.waitForSelector(".hero-lead", { timeout: 15000 });

const result = await page.evaluate(() => {
  const el = document.querySelector(".hero-lead");
  const parent = el.parentElement;
  const parentWidth = parent.getBoundingClientRect().width;
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
  const widths = {};
  for (let w = 576; w <= parentWidth; w += 16) {
    el.style.maxWidth = w + "px";
    const h = el.getBoundingClientRect().height;
    const lines = Math.round(h / lineHeight);
    widths[w] = lines;
  }
  el.style.maxWidth = ""; // reset
  return { parentWidth, lineHeight, widths };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
