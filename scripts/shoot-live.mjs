// Captures the live products shown on Selected Work cards, so the card and
// its particle interior show the real screen. A browser cannot read another
// site's pixels at runtime (cross-origin), so this runs here and the image
// ships with the site. Re-run to refresh: node scripts/shoot-live.mjs
// Each shot opens the page, scrolls to `scroll` (px) when given, lets the
// page's own motion settle and crops `clip` to the card's 1 : 0.62 shape.
// Patika is an app, not a site: its card is composed from three of its
// screenshots (pass PATIKA_SCREENS=<dir of its docs/screenshots/ios>).
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";

const desktop = { width: 1440, height: 900 };
const shots = [
  {
    url: "https://www.moddteam.com/login",
    out: "public/work/moddteam-login.jpg",
    clip: { x: 330, y: 110, width: 780, height: 484 },
  },
  // The hero without the enquiry panel on its right.
  { url: "https://www.alacekmekoynefes.com/", out: "public/work/ala-cekmekoy.jpg", clip: { x: 0, y: 120, width: 990, height: 614 } },
  { url: "https://www.ucay360.com.tr/", out: "public/work/ucay-360.jpg", scroll: 2200, clip: { x: 0, y: 0, width: 1440, height: 893 } },
  { url: "https://dbh-group-site.vercel.app/", out: "public/work/dbh-group.jpg", intro: 15000, scroll: 2330, settle: 9000, scale: 1, clip: { x: 0, y: 0, width: 1440, height: 893 } },
  { url: "https://www.thelock.com.tr/", out: "public/work/the-lock.jpg", clip: { x: 0, y: 0, width: 1440, height: 893 } },
  { url: "https://www.fidanproperty.com/", out: "public/work/fidan-property.jpg", clip: { x: 0, y: 0, width: 1440, height: 893 } },
];

// ONLY=patika skips the site shots; ONLY=<text> shoots only outputs matching it.
const only = process.env.ONLY;
const browser = only === "patika" ? null : await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
for (const s of browser ? shots.filter((x) => !only || x.out.includes(only)) : []) {
  // DBH plays its chapters only at 1x (its 2x pass holds the logo mosaic).
  const page = await browser.newPage({ viewport: desktop, deviceScaleFactor: s.scale ?? 2 });
  // Some of these pages stream video and never go network-idle.
  await page.goto(s.url, { waitUntil: "load", timeout: 60000 });
  // DBH's opening holds the page until its logo animation ends.
  await page.waitForTimeout(s.intro ?? 5000);
  if (s.scroll) {
    // One long wheel lands on a chapter the way a visitor's flick does.
    await page.mouse.wheel(0, s.scroll);
    await page.waitForTimeout(s.settle ?? 3000);
  }
  const png = await page.screenshot({ clip: s.clip });
  await sharp(png).resize(1600, 992, { fit: "cover" }).jpeg({ quality: 86, mozjpeg: true }).toFile(s.out);
  console.log("saved", s.out);
  await page.close();
}
await browser?.close();

const screens = process.env.PATIKA_SCREENS;
if (screens) {
  // Three phones side by side on the app's own warm dark ground.
  const W = 2048, H = 1270, phoneH = 1110, gap = 70;
  const files = ["01-odak.png", "02-dostlarim-yuva.png", "04-ozet.png"];
  const phones = await Promise.all(files.map(async (f) => {
    const { data, info } = await sharp(path.join(screens, f)).resize({ height: phoneH }).png().toBuffer({ resolveWithObject: true });
    const mask = Buffer.from(`<svg width="${info.width}" height="${phoneH}"><rect width="${info.width}" height="${phoneH}" rx="${Math.round(info.width * 0.11)}"/></svg>`);
    return { buf: await sharp(data).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer(), width: info.width };
  }));
  const total = phones.reduce((a, p) => a + p.width, 0) + gap * (phones.length - 1);
  let x = Math.round((W - total) / 2);
  const layers = phones.map((p) => {
    const layer = { input: p.buf, left: x, top: Math.round((H - phoneH) / 2) };
    x += p.width + gap;
    return layer;
  });
  // Composite first: sharp would otherwise resize the ground before it.
  const sheet = await sharp({ create: { width: W, height: H, channels: 3, background: "#1a1209" } }).composite(layers).png().toBuffer();
  await sharp(sheet)
    .resize(1600, 992)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile("public/work/patika.jpg");
  console.log("saved public/work/patika.jpg");
}
