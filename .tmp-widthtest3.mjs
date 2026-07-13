import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
for (const vw of [1024, 1280, 1440, 1920]) {
  const b = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await b.newPage({ viewport: { width: vw, height: 900 } });
  await page.goto("http://localhost:8081", { waitUntil: "networkidle" });
  await page.waitForSelector(".hero-lead", { timeout: 15000 });
  const result = await page.evaluate(() => {
    const el = document.querySelector(".hero-lead");
    const parent = el.parentElement;
    const parentWidth = parent.getBoundingClientRect().width;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    el.style.maxWidth = Math.min(608, parentWidth) + "px";
    const h = el.getBoundingClientRect().height;
    const lines = Math.round(h / lineHeight);
    el.style.maxWidth = "";
    return { parentWidth, lines };
  });
  console.log(vw, JSON.stringify(result));
  await b.close();
}
await browser.close();
