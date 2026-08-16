// Bird handoff + flight verification. Usage: node scripts/shoot-bird.mjs <outDir>
import { chromium } from "playwright";

const out = process.argv[2] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));

await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.waitForTimeout(6000); // opening + bird bake

// End of hero runway: streams fade, bird assembles
await page.mouse.wheel(0, 900 * 2.1);
await page.waitForTimeout(2200);
await page.screenshot({ path: `${out}/bird-assemble.png` });

// Into the sections: bird flying over Work
await page.mouse.wheel(0, 900 * 1.6);
await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/bird-work.png` });

// Deeper: Capabilities/About region
await page.mouse.wheel(0, 900 * 2.2);
await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/bird-mid.png` });

// Reverse scroll — flight must run backwards
await page.mouse.wheel(0, -900 * 3);
await page.waitForTimeout(2200);
await page.screenshot({ path: `${out}/bird-reverse.png` });

console.log(
  logs.filter((l) => !l.includes("Clock") && !l.includes("[HMR]")).slice(-12).join("\n") ||
    "console clean",
);
await browser.close();
