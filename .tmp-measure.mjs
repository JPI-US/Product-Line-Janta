import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
await page.waitForSelector(".hero-stats", { timeout: 15000 });
const data = await page.evaluate(() => {
  const wrap = document.querySelector(".hero-stats-wrap").getBoundingClientRect();
  const divider = document.querySelector(".hero-stat-divider").getBoundingClientRect();
  const values = [...document.querySelectorAll(".hero-stat__value")].map(el => el.getBoundingClientRect());
  const labels = [...document.querySelectorAll(".hero-stat__label")].map(el => el.getBoundingClientRect());
  const prefixes = [...document.querySelectorAll(".hero-stat__prefix")].map(el => el.getBoundingClientRect());
  const context = document.querySelector(".hero-stats__context").getBoundingClientRect();
  return { wrap, divider, values, labels, prefixes, context };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
