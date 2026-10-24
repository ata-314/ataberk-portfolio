import { sql } from "@/lib/track/db";
import { isBot, parseUa } from "@/lib/track/ua";
import { networkOf } from "@/lib/track/network";

// Page-view beacon from components/track/Tracker.tsx.
// { id, visitor, ref, path, referrer, …signals } records a view; { id, duration, scroll }
// closes it; { event, visitor, path, data } records an action.
// Bots (lib/track/ua.ts) never count: link previews and scanners would drown the
// people. The raw IP is never stored, only its salted hash (lib/track/network.ts).

const UUID = /^[0-9a-f-]{36}$/i;
const REF = /^[a-z0-9-]{1,64}$/;

const clip = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);
const num = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : null;
const int = (v: unknown, min: number, max: number) => {
  const n = num(v, min, max);
  return n == null ? null : Math.round(n);
};
const pick = (v: unknown, allowed: string[]) => (typeof v === "string" && allowed.includes(v) ? v : null);
const header = (request: Request, name: string) => {
  const raw = request.headers.get(name);
  try {
    return raw ? decodeURIComponent(raw) : null;
  } catch {
    return raw;
  }
};

// An event's payload: a small flat object of short strings, numbers and flags.
function eventData(v: unknown) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, x] of Object.entries(v).slice(0, 8)) {
    if (!/^[a-zA-Z_]{1,24}$/.test(k)) continue;
    if (typeof x === "string") out[k] = x.slice(0, 300);
    else if (typeof x === "number" && Number.isFinite(x)) out[k] = x;
    else if (typeof x === "boolean") out[k] = x;
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new Response(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  // An action (Tracker.tsx trackEvent).
  if (typeof body.event === "string") {
    const event = /^[a-z_]{2,40}$/.test(body.event) ? body.event : null;
    const visitor = typeof body.visitor === "string" && UUID.test(body.visitor) ? body.visitor : null;
    if (!event || !visitor) return new Response(null, { status: 400 });
    const ref = typeof body.ref === "string" && REF.test(body.ref) ? body.ref : null;
    await sql()`insert into events (visitor, ref, name, path, country, data)
      values (${visitor}, ${ref}, ${event}, ${clip(body.path, 300)}, ${request.headers.get("x-vercel-ip-country")},
        ${eventData(body.data)}::jsonb)`;
    return new Response(null, { status: 204 });
  }

  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
  if (!id) return new Response(null, { status: 400 });

  if (typeof body.duration === "number") {
    const seconds = Math.max(0, Math.min(Math.round(body.duration), 6 * 3600));
    const scroll = int(body.scroll, 0, 100);
    const lcp = int(body.lcp, 0, 120000);
    await sql()`update visits set duration_s = ${seconds},
        scroll_pct = greatest(coalesce(scroll_pct, 0), ${scroll}::int),
        lcp_ms = coalesce(${lcp}::int, lcp_ms)
      where id = ${id} and created_at > now() - interval '1 day'`;
    return new Response(null, { status: 204 });
  }

  const visitor = typeof body.visitor === "string" && UUID.test(body.visitor) ? body.visitor : null;
  const path = clip(body.path, 300);
  if (!visitor || !path?.startsWith("/")) return new Response(null, { status: 400 });
  const ref = typeof body.ref === "string" && REF.test(body.ref) ? body.ref : null;
  const referrer = clip(body.referrer, 500);
  const country = request.headers.get("x-vercel-ip-country");
  const city = header(request, "x-vercel-ip-city");
  const { device, os, browser } = parseUa(ua);

  const network = networkOf(request);
  const region = header(request, "x-vercel-ip-country-region");
  // City-level coordinates Vercel derives from the IP; not the visitor's position.
  const latitude = num(Number(request.headers.get("x-vercel-ip-latitude") || NaN), -90, 90);
  const longitude = num(Number(request.headers.get("x-vercel-ip-longitude") || NaN), -180, 180);
  const postal = clip(header(request, "x-vercel-ip-postal-code"), 20);
  const lang = clip(body.lang, 20);
  const screen = typeof body.screen === "string" && /^\d{2,5}x\d{2,5}$/.test(body.screen) ? body.screen : null;
  const viewport = typeof body.viewport === "string" && /^\d{2,5}x\d{2,5}$/.test(body.viewport) ? body.viewport : null;
  const tz = clip(body.tz, 50);
  const utm = clip(body.utm, 200);
  const dpr = num(body.dpr, 0.5, 8);
  const scheme = pick(body.scheme, ["dark", "light"]);
  const reducedMotion = typeof body.reducedMotion === "boolean" ? body.reducedMotion : null;
  const pointer = pick(body.pointer, ["coarse", "fine", "none"]);
  const connection = pick(body.connection, ["slow-2g", "2g", "3g", "4g"]);
  const memory = num(body.memory, 0, 64);
  const cores = int(body.cores, 1, 256);
  const ttfb = int(body.ttfb, 0, 120000);
  const dom = int(body.dom, 0, 120000);
  const session = int(body.session, 1, 100000);

  await sql()`insert into visits (id, visitor, ref, path, referrer, country, city, device, browser, os, network,
      region, lang, screen, tz, utm, viewport, dpr, scheme, reduced_motion, pointer, connection, memory_gb, cores,
      ttfb_ms, dom_ms, session_n, latitude, longitude, postal)
    values (${id}, ${visitor}, ${ref}, ${path}, ${referrer}, ${country}, ${city}, ${device}, ${browser}, ${os}, ${network},
      ${region}, ${lang}, ${screen}, ${tz}, ${utm}, ${viewport}, ${dpr}, ${scheme}, ${reducedMotion}, ${pointer},
      ${connection}, ${memory}, ${cores}, ${ttfb}, ${dom}, ${session}, ${latitude}, ${longitude}, ${postal})
    on conflict (id) do nothing`;
  return new Response(null, { status: 204 });
}
