// Captures the screens shown on each project's case study: a few chapters
// of the live site on desktop and on a phone. A browser cannot read another
// site's pixels at runtime, so this runs here and the images ship with the
// site. Re-run to refresh: node scripts/shoot-cases.mjs [slug]
// Each stop scrolls with one long wheel (as a visitor's flick lands on a
// chapter) and waits for the page's own motion to settle. Output:
// public/work/<slug>/d<n>.jpg (1600 wide) and m<n>.jpg (phone, 780 wide).
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const sites = [
  { slug: "ala-cekmekoy", url: "https://www.alacekmekoynefes.com/", desktop: [3200, 6500, 10500, 8500], phone: [0, 4000, 6500] },
  // Üçay opens on its logo for several seconds; on phones its scroll-played
  // opening is passed with its own "Girişi atla" button.
  { slug: "ucay-360", url: "https://www.ucay360.com.tr/", intro: 10000, skip: "Girişi atla", desktop: [2200, 8000, 6500, 9500], phone: [1, 1800, 4200] },
  // DBH's opening holds the page until its logo animation ends, and it
  // plays its chapters only at 1x.
  { slug: "dbh-group", url: "https://dbh-group-site.vercel.app/", intro: 15000, scale: 1, desktop: [2330, 4700, 7600, 10500], phone: [0, 2600, 6000] },
  { slug: "the-lock", url: "https://www.thelock.com.tr/", desktop: [900, 2600, 6600, 8200], phone: [0, 2200, 5200] },
  { slug: "fidan-property", url: "https://www.fidanproperty.com/", desktop: [900, 2100, 3600, 5200], phone: [0, 1900, 4200] },
];

const only = process.argv[2];
const browser = await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
for (const site of sites.filter((s) => !only || s.slug === only)) {
  await mkdir(`public/work/${site.slug}`, { recursive: true });
  for (const [kind, stops, opts] of [
    ["d", site.desktop, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: site.scale ?? 2 }],
    ["m", site.phone, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    for (let i = 0; i < stops.length; i++) {
      // A fresh page per stop: wheel scrolling on pinned, smoothed pages
      // lands more reliably from the top than from the previous stop.
      const page = await browser.newPage(opts);
      await page.goto(site.url, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(site.intro ?? 5000);
      if (kind === "m" && site.skip) {
        await page.getByText(site.skip).first().click().catch(() => {});
        await page.waitForTimeout(3000);
      }
      if (stops[i]) {
        if (kind === "m") await page.evaluate((y) => window.scrollTo(0, y), stops[i]);
        else await page.mouse.wheel(0, stops[i]);
        await page.waitForTimeout(kind === "m" ? 3000 : 9000);
      }
      const png = await page.screenshot();
      const out = `public/work/${site.slug}/${kind}${i + 1}.jpg`;
      await sharp(png).resize(kind === "d" ? 1600 : 780).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
      console.log("saved", out);
      await page.close();
    }
  }
}
await browser.close();
