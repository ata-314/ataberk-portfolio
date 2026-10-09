import { isSignedIn } from "@/lib/track/auth";
import { sql } from "@/lib/track/db";
import { deleteLink, signOut } from "./actions";
import { CopyLink, NewLink, NoTrack, SignIn } from "./ui";
import Link from "next/link";
import { type LinkRow, type Message, type Visit, Messages, People, Tally, Visitors, browsers, count, deviceOf, people, place, secs, when } from "./views";

export const dynamic = "force-dynamic";

const RANGES = [1, 7, 30, 90];

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  if (!(await isSignedIn())) return <SignIn />;
  const asked = Number((await searchParams).gun);
  const days = RANGES.includes(asked) ? asked : 30;

  const db = sql();
  const links = (await db`select slug, label, note, created_at from links order by created_at desc`) as LinkRow[];
  const tagged = (await db`select * from visits where ref is not null
    order by created_at desc limit 2000`) as Visit[];
  const other = (await db`select * from visits where ref is null
    and created_at > now() - make_interval(days => ${days})
    order by created_at desc limit 5000`) as Visit[];

  const messages = (await db`select * from messages order by created_at desc limit 200`) as Message[];
  const labels = new Map(links.map((l) => [l.slug, l.label]));
  const wrote = new Set(messages.map((m) => m.ref).filter(Boolean));

  const byRef = new Map<string, Visit[]>();
  for (const v of tagged) byRef.set(v.ref!, [...(byRef.get(v.ref!) ?? []), v]);
  const known = new Set(links.map((l) => l.slug));
  const unknownRefs = [...byRef.keys()].filter((r) => !known.has(r));
  const list = browsers(other);
  const firstOf = (b: (typeof list)[number]) => b.visits[b.visits.length - 1];
  const returning = list.filter((b) => b.sessions > 1).length;
  const avg = list.length ? Math.round(list.reduce((s, b) => s + b.total, 0) / list.length) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <NoTrack />
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ziyaretçiler</h1>
        <form action={signOut}>
          <button className="text-xs text-white/50 hover:text-white">Çıkış</button>
        </form>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium">Mesajlar ({messages.length})</h2>
        <Messages list={messages} labels={labels} />
      </section>

      <section className="mb-10 rounded-xl border border-white/10 p-4">
        <h2 className="mb-3 text-sm font-medium">Kişiye özel link</h2>
        <NewLink />
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-sm font-medium">Linkler ({links.length})</h2>
        <div className="flex flex-col gap-2">
          {links.length === 0 && <p className="text-sm text-white/40">Henüz link yok.</p>}
          {links.map((l) => {
            const vs = byRef.get(l.slug) ?? [];
            const total = vs.reduce((s, v) => s + (v.duration_s ?? 0), 0);
            const ps = people(vs);
            const forwarded = ps.filter((p) => p.verdict === "maybe" || p.verdict === "likely").length;
            return (
              <details key={l.slug} className="rounded-xl border border-white/10 p-4 open:border-white/20">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                  <span className={`h-2 w-2 rounded-full ${vs.length ? "bg-[#c8ff3e]" : "bg-white/20"}`} />
                  <span className="font-medium">{l.label}</span>
                  {l.note && <span className="text-xs text-white/40">{l.note}</span>}
                  {wrote.has(l.slug) && (
                    <span className="rounded-full bg-[#c8ff3e]/10 px-2 py-0.5 text-xs text-[#c8ff3e]">Form gönderdi</span>
                  )}
                  {ps.length > 1 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${forwarded ? "bg-orange-400/15 text-orange-300" : "bg-white/10 text-white/60"}`}
                    >
                      {forwarded ? `${ps.length} kişi · iletilmiş olabilir` : `${ps.length} cihaz`}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-white/60">
                    {vs.length
                      ? `${vs.length} sayfa · ${secs(total)} · son: ${when(vs[0].created_at)}`
                      : `Henüz açılmadı · gönderildi: ${when(l.created_at)}`}
                  </span>
                </summary>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <code className="break-all text-xs text-white/60">ataberksoylu.com/{l.slug}</code>
                  <CopyLink slug={l.slug} />
                  <form action={deleteLink} className="ml-auto">
                    <input type="hidden" name="slug" value={l.slug} />
                    <button className="text-xs text-white/30 hover:text-red-400">Linki sil</button>
                  </form>
                </div>
                {vs.length > 0 && (
                  <div className="mt-4">
                    <People visits={vs} />
                  </div>
                )}
              </details>
            );
          })}
          {unknownRefs.map((r) => (
            <details key={r} className="rounded-xl border border-dashed border-white/10 p-4">
              <summary className="cursor-pointer text-sm">
                {r} <span className="text-xs text-white/40">(listede olmayan / silinmiş link)</span>
              </summary>
              <div className="mt-4">
                <People visits={byRef.get(r)!} />
              </div>
            </details>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Diğer ziyaretçiler (linksiz)</h2>
          <nav className="flex gap-1 text-xs">
            {RANGES.map((d) => (
              <Link
                key={d}
                href={`/stats?gun=${d}`}
                className={`rounded-md px-2 py-1 ${d === days ? "bg-white/15" : "text-white/50 hover:text-white"}`}
              >
                {d === 1 ? "Bugün" : `${d} gün`}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Ziyaretçi", String(list.length)],
            ["Sayfa görüntüleme", String(other.length)],
            ["Tekrar gelen", String(returning)],
            ["Ortalama süre", secs(avg)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 p-4">
              <p className="text-xs text-white/50">{k}</p>
              <p className="mt-1 text-2xl font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tally title="Kaynak (ziyaretçi)" rows={count(list, (b) => b.source)} />
          <Tally title="Ülke / şehir (ziyaretçi)" rows={count(list, (b) => place(firstOf(b)))} />
          <Tally title="Cihaz (ziyaretçi)" rows={count(list, (b) => deviceOf(firstOf(b)))} />
          <Tally title="Sayfa (görüntüleme)" rows={count(other, (v) => v.path)} />
        </div>
        <Visitors list={list.slice(0, 150)} />
      </section>
    </main>
  );
}
