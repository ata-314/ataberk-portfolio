// Work helix screenshots. Usage: node scripts/shoot-work.mjs <outDir> [steps]
// Scrolls the pinned work section through its runway, then opens a card.
import { chromium } from "playwright";

const out = process.argv[2] ?? ".";
const steps = (process.argv[3] ?? "0,0.35,0.7").split(",").map(Number);
const open = process.argv[4] !== "noopen";
// MOBILE=1 shoots a phone viewport (touch, coarse pointer).
const phone = process.env.MOBILE === "1";
const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage(
  phone
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } },
);
const vh = phone ? 844 : 900;
const [cx, cy] = phone ? [195, 422] : [720, 450];
const logs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto("http://localhost:3000/tr", { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
const span = await page.evaluate(() => {
  const el = document.querySelector("#work");
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height };
});
for (const s of steps) {
  await page.evaluate(([y]) => window.scrollTo(0, y), [span.top + s * Math.max(span.height - vh, 0)]);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/work-${s}.png` });
}
if (open) {
  await page.mouse.move(cx, cy, { steps: 8 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/work-hover.png` });
  await page.mouse.click(cx, cy);
  let waited = 0;
  for (const t of [350, 900, 1800, 3200]) {
    await page.waitForTimeout(t - waited);
    waited = t;
    await page.screenshot({ path: `${out}/work-open-${t}.png` });
  }
  // Cursor through the opened card, then a click burst.
  const [sx, sy] = phone ? [80, 380] : [420, 380];
  await page.mouse.move(sx, sy);
  await page.mouse.move(sx + (phone ? 220 : 620), sy + 90, { steps: 24 });
  await page.waitForTimeout(60);
  await page.screenshot({ path: `${out}/work-beads.png` });
  await page.mouse.click(cx, cy - 40);
  await page.waitForTimeout(280);
  await page.screenshot({ path: `${out}/work-burst.png` });
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/work-closing.png` });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/work-closed.png` });
}
// Scroll back up: the bird turns and climbs.
if (open) {
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, -90);
    await page.waitForTimeout(90);
  }
  await page.screenshot({ path: `${out}/work-climb.png` });
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 90);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/work-dive.png` });
}
console.log(logs.slice(-15).join("\n"));
await browser.close();
