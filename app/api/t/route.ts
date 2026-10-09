import { createHmac } from "node:crypto";
import { sql } from "@/lib/track/db";
import { isBot, parseUa } from "@/lib/track/ua";

// Page-view beacon from components/track/Tracker.tsx.
// { id, visitor, ref, path, referrer } records a view; { id, duration } closes it.

const UUID = /^[0-9a-f-]{36}$/i;
const REF = /^[a-z0-9-]{1,64}$/;

// Salted hash of the network (IPv4 address, or the /64 an IPv6 home or office shares).
// Only ever compared for equality; the IP itself is never stored.
function networkOf(request: Request) {
  const salt = process.env.IP_SALT;
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (!salt || !ip) return null;
  const net = ip.includes(":") ? ip.split(":").slice(0, 4).join(":") : ip;
  return createHmac("sha256", salt).update(net).digest("hex").slice(0, 16);
}

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

  await sql()`insert into visits (id, visitor, ref, path, referrer, country, city, device, browser, os, network)
    values (${id}, ${visitor}, ${ref}, ${path}, ${referrer}, ${country}, ${city}, ${device}, ${browser}, ${os}, ${network})
    on conflict (id) do nothing`;
  return new Response(null, { status: 204 });
}
