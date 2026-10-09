import { sql } from "@/lib/track/db";
import { isBot, parseUa } from "@/lib/track/ua";
import { networkOf } from "@/lib/track/network";

// Page-view beacon from components/track/Tracker.tsx.
// { id, visitor, ref, path, referrer } records a view; { id, duration } closes it.

const UUID = /^[0-9a-f-]{36}$/i;
const REF = /^[a-z0-9-]{1,64}$/;

const clip = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new Response(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
  if (!id) return new Response(null, { status: 400 });

  if (typeof body.duration === "number") {
    const seconds = Math.max(0, Math.min(Math.round(body.duration), 6 * 3600));
    await sql()`update visits set duration_s = ${seconds}
      where id = ${id} and created_at > now() - interval '1 day'`;
    return new Response(null, { status: 204 });
  }

  const visitor = typeof body.visitor === "string" && UUID.test(body.visitor) ? body.visitor : null;
  const path = clip(body.path, 300);
  if (!visitor || !path?.startsWith("/")) return new Response(null, { status: 400 });
  const ref = typeof body.ref === "string" && REF.test(body.ref) ? body.ref : null;
  const referrer = clip(body.referrer, 500);
  const country = request.headers.get("x-vercel-ip-country");
  const cityRaw = request.headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw) : null;
  const { device, os, browser } = parseUa(ua);

  const network = networkOf(request);
  const regionRaw = request.headers.get("x-vercel-ip-country-region");
  const region = regionRaw ? decodeURIComponent(regionRaw) : null;
  const lang = clip(body.lang, 20);
  const screen = typeof body.screen === "string" && /^\d{2,5}x\d{2,5}$/.test(body.screen) ? body.screen : null;
  const tz = clip(body.tz, 50);
  const utm = clip(body.utm, 200);

  await sql()`insert into visits (id, visitor, ref, path, referrer, country, city, device, browser, os, network,
      region, lang, screen, tz, utm)
    values (${id}, ${visitor}, ${ref}, ${path}, ${referrer}, ${country}, ${city}, ${device}, ${browser}, ${os}, ${network},
      ${region}, ${lang}, ${screen}, ${tz}, ${utm})
    on conflict (id) do nothing`;
  return new Response(null, { status: 204 });
}
