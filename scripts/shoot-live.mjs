// Captures the live products shown on Selected Work cards, so the card and
// its particle interior show the real screen. A browser cannot read another
// site's pixels at runtime (cross-origin), so this runs here and the image
// ships with the site. Re-run to refresh: node scripts/shoot-live.mjs
import { chromium } from "playwright";
import sharp from "sharp";

// Card aspect is 1 : 0.62; the crop frames the product's own panel.
const shots = [
  {
    url: "https://www.moddteam.com/login",
    out: "public/work/moddteam-login.jpg",
    viewport: { width: 1440, height: 900 },
    clip: { x: 330, y: 110, width: 780, height: 484 },
  },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: s.viewport, deviceScaleFactor: 2 });
  await page.goto(s.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500); // let the page's own motion settle in
  const png = await page.screenshot({ clip: s.clip });
  await sharp(png).resize(1024, 635, { fit: "cover" }).jpeg({ quality: 86, mozjpeg: true }).toFile(s.out);
  console.log("saved", s.out);
  await page.close();
}
await browser.close();
