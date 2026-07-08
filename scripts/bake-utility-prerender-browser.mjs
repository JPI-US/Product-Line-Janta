/**
 * Browser GPU bake — real WebGL frames (headless `gl` outputs blank WebPs).
 *
 * Usage: npm run bake:utility-prerender
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const outDir = path.join(projectRoot, "public/towers/utility-prerender");
const frameCount = 48;
const width = 1280;
const height = 720;
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(`${baseUrl}/`);
        if (res.ok) {
          resolve(undefined);
          return;
        }
      } catch {
        /* retry */
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not start on ${baseUrl}`));
        return;
      }
      setTimeout(tick, 400);
    };
    tick();
  });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: projectRoot,
      shell: true,
      stdio: "inherit",
      ...opts,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

function spawnPreview() {
  return spawn(
    "npm",
    [
      "run",
      "preview",
      "--",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: projectRoot,
      shell: true,
      stdio: "pipe",
      env: { ...process.env, BROWSER: "none" },
    }
  );
}

function killPortWindows(p) {
  try {
    const out = spawnSync(
      "netstat",
      ["-ano"],
      { shell: true, encoding: "utf8" }
    );
    const lines = out.stdout?.split("\n") ?? [];
    for (const line of lines) {
      if (!line.includes(`:${p}`) || !line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (pid && pid !== "0") {
        spawnSync("taskkill", ["/F", "/PID", pid], { shell: true, stdio: "ignore" });
      }
    }
  } catch {
    /* optional */
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  killPortWindows(port);
  console.log("Building app…");
  await run("npm", ["run", "build"]);

  console.log(`Baking ${frameCount} frames @ ${width}x${height} (Chromium)`);
  console.log(`Output: ${path.relative(projectRoot, outDir)}`);

  const preview = spawnPreview();
  preview.stdout?.on("data", (d) => process.stdout.write(d));
  preview.stderr?.on("data", (d) => process.stderr.write(d));

  try {
    await waitForServer();

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    page.setDefaultTimeout(180_000);

    const framePath = (i) =>
      path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`);

    let baked = 0;
    let skipped = 0;

    for (let i = 0; i < frameCount; i++) {
      /* Re-bake when fixing sun-invariant rotation (frames must be > ~20KB) */
      if (fs.existsSync(framePath(i)) && fs.statSync(framePath(i)).size > 25_000) {
        skipped++;
        continue;
      }

      await page.goto(`${baseUrl}/utility-prerender-bake?frame=${i}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForFunction(
        () => document.documentElement.dataset.utilityBakeReady === "1"
      );
      await page.waitForTimeout(350);

      const png = await page.locator("[data-bake-root]").screenshot({
        type: "png",
        animations: "disabled",
      });

      const name = `frame-${String(i).padStart(3, "0")}.webp`;
      await sharp(png).webp({ quality: 86 }).toFile(path.join(outDir, name));

      baked++;
      if (i % 8 === 0 || i === frameCount - 1) {
        console.log(`  ${i + 1}/${frameCount}`);
      }
    }

    if (skipped > 0) {
      console.log(`Skipped ${skipped} existing frame(s), baked ${baked} new.`);
    }

    const manifest = {
      frameCount,
      width,
      height,
      format: "webp",
      pattern: "frame-{index}.webp",
      basePath: "/towers/utility-prerender",
    };
    fs.writeFileSync(
      path.join(outDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    const sample = fs.statSync(path.join(outDir, "frame-000.webp"));
    console.log(`Sample frame size: ${(sample.size / 1024).toFixed(1)} KB`);
    if (sample.size < 4000) {
      console.warn("[bake] Frames look very small — check bake page output.");
    }

    await browser.close();
    console.log("\nDone. Hard-refresh /3d");
  } finally {
    preview.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
