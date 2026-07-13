import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 768, height: 900 } });
await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
await page.waitForSelector(".hero-lead", { timeout: 15000 });
const result = await page.evaluate(() => {
  const el = document.querySelector(".hero-lead");
  const parent = el.parentElement;
  const parentWidth = parent.getBoundingClientRect().width;
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
  el.style.maxWidth = parentWidth + "px";
  const h = el.getBoundingClientRect().height;
  const lines = Math.round(h / lineHeight);
  el.style.maxWidth = "";
  return { parentWidth, lineHeight, linesAtFullWidth: lines };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
