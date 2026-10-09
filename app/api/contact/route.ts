import { sql } from "@/lib/track/db";
import { networkOf } from "@/lib/track/network";
import { isBot, parseUa } from "@/lib/track/ua";
import { sendMail } from "@/lib/mail";

// Contact form (components/sections/ContactForm.tsx). Every message is stored first,
// then mailed; a failed mail is recorded on the row and still shows in /stats.

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f-]{36}$/i;
const REF = /^[a-z0-9-]{1,64}$/;
const field = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad" }, { status: 400 });
  }

  // Bots: a hidden field people never see, and a form sent faster than anyone types.
  const elapsed = Number(body.elapsed);
  if (isBot(ua) || field(body.website, 200)) return Response.json({ ok: true });
  if (!(elapsed >= 3000)) return Response.json({ error: "fast" }, { status: 429 });

  const name = field(body.name, 120);
  const email = field(body.email, 200);
  const company = field(body.company, 200) || null;
  const intent = field(body.intent, 80) || null;
  const message = field(body.message, 5000);
  const locale = field(body.locale, 5) || null;
  if (!name || !EMAIL.test(email) || message.length < 2) return Response.json({ error: "invalid" }, { status: 400 });
  const ref = typeof body.ref === "string" && REF.test(body.ref) ? body.ref : null;
  const visitor = typeof body.visitor === "string" && UUID.test(body.visitor) ? body.visitor : null;

  const network = networkOf(request);
  if (network) {
    const [{ n }] = (await sql()`select count(*)::int as n from messages
      where network = ${network} and created_at > now() - interval '1 hour'`) as { n: number }[];
    if (n >= 5) return Response.json({ error: "limit" }, { status: 429 });
  }
  const cityRaw = request.headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw) : null;
  const country = request.headers.get("x-vercel-ip-country");
  const { device, os, browser } = parseUa(ua);
  const deviceLabel = `${device} · ${os} · ${browser}`;

  const [{ id }] = (await sql()`insert into messages
      (name, email, company, intent, message, locale, ref, visitor, network, city, country, device)
    values (${name}, ${email}, ${company}, ${intent}, ${message}, ${locale}, ${ref}, ${visitor}, ${network},
      ${city}, ${country}, ${deviceLabel})
    returning id`) as { id: string }[];

  const label = ref
    ? (((await sql()`select label from links where slug = ${ref}`) as { label: string }[])[0]?.label ?? ref)
    : null;
  const lines: (string | null)[] = [
    `${name} <${email}>`,
    company && `Şirket / site: ${company}`,
    intent && `Konu: ${intent}`,
    "",
    message,
    "",
    "—",
    label ? `Kişiye özel link: ${label} (ataberksoylu.com/${ref})` : "Kişiye özel link yok",
    `Yer: ${[city, country].filter(Boolean).join(", ") || "bilinmiyor"} · ${deviceLabel} · dil: ${locale ?? "?"}`,
    "Ziyaret geçmişi: https://www.ataberksoylu.com/stats",
  ];

  try {
    await sendMail({
      subject: `Portfolyo formu: ${intent ?? "Mesaj"} — ${name}`,
      text: lines.filter((l) => l !== null).join("\n"),
      replyTo: email,
    });
    await sql()`update messages set emailed = true where id = ${id}`;
  } catch (e) {
    await sql()`update messages set mail_error = ${String(e).slice(0, 300)} where id = ${id}`;
  }
  return Response.json({ ok: true });
}
