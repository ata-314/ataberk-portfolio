// Real-time screenshot harness for the portfolio hero.
// Usage: node shoot.mjs <outDir>
import { chromium } from "playwright";

const out = process.argv[2] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));

await page.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await page.waitForTimeout(5000); // let the opening gather finish

await page.screenshot({ path: `${out}/pw-rest.png` });

// Pointer interaction: sweep across the terrain
await page.mouse.move(900, 600);
await page.waitForTimeout(300);
await page.mouse.move(700, 550, { steps: 20 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/pw-pointer.png` });

// Scroll choreography states (hero runway is 260svh)
await page.mouse.wheel(0, 900 * 0.8);
await page.waitForTimeout(1600);
await page.screenshot({ path: `${out}/pw-scroll40.png` });

await page.mouse.wheel(0, 900 * 0.8);
await page.waitForTimeout(1600);
await page.screenshot({ path: `${out}/pw-scroll80.png` });

await page.mouse.wheel(0, 900 * 2.5);
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/pw-work.png` });

console.log(logs.slice(-30).join("\n"));

await browser.close();
