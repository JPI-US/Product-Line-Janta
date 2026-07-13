import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:8081";
const outPath = process.argv[3] || "/tmp/claude-1000/-home-msalla-Desktop-JPI-Github-Product-Line-Janta/ac188b3e-6527-4b9a-8619-40af059679a4/scratchpad/hero-stats.png";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".hero-stats", { timeout: 15000 });
const el = await page.$(".hero-stats-wrap");
await el.screenshot({ path: outPath });
console.log("saved", outPath);
await browser.close();
