// Bird-fidelity QA: 8 staged screenshots along the 360vh hero runway.
// Usage: node scripts/qa-bird.mjs <outDir>
import { chromium } from "playwright";

const out = process.argv[2] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on("console", (m) => m.type() === "error" && logs.push(m.text()));

await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.waitForTimeout(6000); // opening + bake

// Runway: 360svh sticky → scrollable span ≈ 260svh. Stage % → scrollY.
const vh = 900;
const runway = 2.6 * vh;
const stages = [
  ["1-field", 0.06],
  ["2-form25", 0.5], // morph starts 0.45 → 25% formed
  ["3-form50", 0.55],
  ["4-formed", 0.63],
  ["5-left-grown", 0.72],
  ["6-right-close", 0.88],
  ["7-dissolve", 0.97],
];
for (const [name, h] of stages) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(runway * h));
  await page.waitForTimeout(1700); // damped uniforms settle
  await page.screenshot({ path: `${out}/qb-${name}.png` });
}

// 8 — mobile formed bird
await page.close();
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
await mob.goto("http://localhost:3000/tr", { waitUntil: "networkidle" });
await mob.waitForTimeout(5000);
await mob.evaluate(() => window.scrollTo(0, Math.round(844 * 1.2 * 0.63)));
await mob.waitForTimeout(1700);
await mob.screenshot({ path: `${out}/qb-8-mobile.png` });

console.log(logs.length ? "ERRORS: " + logs.slice(0, 3).join(" | ") : "console clean");
await browser.close();
