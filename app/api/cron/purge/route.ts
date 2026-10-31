import { sql } from "@/lib/track/db";

// Retention (content/privacy.ts, KVKK m.7): visits and events go after 12 months,
// contact messages after 2 years. Vercel Cron calls this daily (vercel.json). It
// only ever deletes rows already past their time, so a stray call does no harm;
// with CRON_SECRET set, Vercel's bearer token is required as well.

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }
  const db = sql();
  const [visits, events, messages] = (await Promise.all([
    db`delete from visits where created_at < now() - interval '12 months' returning 1`,
    db`delete from events where created_at < now() - interval '12 months' returning 1`,
    db`delete from messages where created_at < now() - interval '2 years' returning 1`,
  ])) as unknown[][];
  return Response.json({ visits: visits.length, events: events.length, messages: messages.length });
}
