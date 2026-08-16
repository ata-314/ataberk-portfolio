// Full-site visual QA. Usage: node scripts/qa.mjs <outDir>
import { chromium } from "playwright";

const out = process.argv[2] ?? ".";
const browser = await chromium.launch();

async function shoot(name, opts, actions) {
  const page = await browser.newPage(opts);
  const logs = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" || (m.type() === "warning" && !t.includes("Clock") && !t.includes("ReadPixels")))
      logs.push(`${m.type()}: ${t}`);
  });
  await actions(page);
  if (logs.length) console.log(`[${name}]`, logs.slice(0, 4).join(" | "));
  await page.close();
}

// Desktop journey
await shoot("desktop", { viewport: { width: 1440, height: 900 } }, async (p) => {
  await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
  await p.waitForTimeout(5500);
  await p.screenshot({ path: `${out}/qa-hero.png` });
  await p.mouse.wheel(0, 900 * 1.5);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/qa-hero-mid.png` });
  await p.mouse.wheel(0, 900 * 1.3);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/qa-bird.png` });
  await p.mouse.wheel(0, 900 * 1.4);
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${out}/qa-manifesto.png` });
  await p.mouse.wheel(0, 900 * 2.2);
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${out}/qa-work.png` });
  await p.mouse.wheel(0, 900 * 14);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${out}/qa-contact.png` });
});

// Case study + about
await shoot("case", { viewport: { width: 1440, height: 900 } }, async (p) => {
  await p.goto("http://localhost:3000/en/work/modd-ai", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/qa-case.png` });
  await p.goto("http://localhost:3000/tr/about", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/qa-about.png` });
});

// Mobile
await shoot("mobile", { viewport: { width: 390, height: 844 }, hasTouch: true }, async (p) => {
  await p.goto("http://localhost:3000/tr", { waitUntil: "networkidle" });
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${out}/qa-mob-hero.png` });
  await p.mouse.wheel(0, 844 * 3.2);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/qa-mob-work.png` });
});

// Reduced motion
await shoot("reduced", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, async (p) => {
  await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/qa-reduced.png` });
});

// Keyboard smoke: tab reveals skip link, menu focusable
await shoot("kbd", { viewport: { width: 1440, height: 900 } }, async (p) => {
  await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
  await p.keyboard.press("Tab");
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/qa-skiplink.png` });
});

console.log("QA done");
await browser.close();
