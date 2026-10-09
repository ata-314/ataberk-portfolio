import { isSignedIn } from "@/lib/track/auth";
import { sql } from "@/lib/track/db";
import { deleteLink, signOut } from "./actions";
import { CopyLink, NewLink, NoTrack, SignIn } from "./ui";

export const dynamic = "force-dynamic";

type Visit = {
  ref: string | null;
  visitor: string;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device: string;
  browser: string;
  os: string;
  duration_s: number | null;
  created_at: string;
};
type Link = { slug: string; label: string; note: string | null; created_at: string };

const when = (d: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
const secs = (s: number | null) => (s == null ? "–" : s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60} sn`);
const host = (r: string | null) => {
  if (!r) return "Direkt / bilinmiyor";
  try {
    return new URL(r).host.replace(/^www\./, "");
  } catch {
    return r;
  }
};
const place = (v: Visit) => [v.city, v.country].filter(Boolean).join(", ") || "–";

function count<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function VisitRows({ visits }: { visits: Visit[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-white/40">
          <tr>
            <th className="py-1 pr-4 font-normal">Zaman</th>
            <th className="py-1 pr-4 font-normal">Sayfa</th>
            <th className="py-1 pr-4 font-normal">Süre</th>
            <th className="py-1 pr-4 font-normal">Yer</th>
            <th className="py-1 pr-4 font-normal">Cihaz</th>
            <th className="py-1 font-normal">Geldiği yer</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v, i) => (
            <tr key={i} className="border-t border-white/5 text-white/80">
              <td className="py-1.5 pr-4 whitespace-nowrap">{when(v.created_at)}</td>
              <td className="py-1.5 pr-4">{v.path}</td>
              <td className="py-1.5 pr-4 whitespace-nowrap">{secs(v.duration_s)}</td>
              <td className="py-1.5 pr-4 whitespace-nowrap">{place(v)}</td>
              <td className="py-1.5 pr-4 whitespace-nowrap">{`${v.device} · ${v.os} · ${v.browser}`}</td>
              <td className="py-1.5 whitespace-nowrap">{v.referrer ? host(v.referrer) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tally({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <h3 className="mb-2 text-xs text-white/50">{title}</h3>
      {rows.length === 0 && <p className="text-xs text-white/40">Henüz yok.</p>}
      {rows.slice(0, 8).map(([k, n]) => (
        <div key={k} className="flex justify-between py-0.5 text-sm">
          <span className="truncate pr-3">{k}</span>
          <span className="text-white/60">{n}</span>
        </div>
      ))}
    </div>
  );
}

export default async function StatsPage() {
  if (!(await isSignedIn())) return <SignIn />;

  const db = sql();
  const links = (await db`select slug, label, note, created_at from links order by created_at desc`) as Link[];
  const tagged = (await db`select * from visits where ref is not null
    order by created_at desc limit 2000`) as Visit[];
  const other = (await db`select * from visits where ref is null and created_at > now() - interval '30 days'
    order by created_at desc limit 2000`) as Visit[];

  const byRef = new Map<string, Visit[]>();
  for (const v of tagged) byRef.set(v.ref!, [...(byRef.get(v.ref!) ?? []), v]);
  const known = new Set(links.map((l) => l.slug));
  const unknownRefs = [...byRef.keys()].filter((r) => !known.has(r));
  const otherVisitors = new Set(other.map((v) => v.visitor)).size;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <NoTrack />
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ziyaretçiler</h1>
        <form action={signOut}>
          <button className="text-xs text-white/50 hover:text-white">Çıkış</button>
        </form>
      </header>

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
            return (
              <details key={l.slug} className="rounded-xl border border-white/10 p-4 open:border-white/20">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                  <span className={`h-2 w-2 rounded-full ${vs.length ? "bg-[#c8ff3e]" : "bg-white/20"}`} />
                  <span className="font-medium">{l.label}</span>
                  {l.note && <span className="text-xs text-white/40">{l.note}</span>}
                  <span className="ml-auto text-xs text-white/60">
                    {vs.length
                      ? `${vs.length} sayfa · ${secs(total)} · son: ${when(vs[0].created_at)}`
                      : `Henüz açılmadı · gönderildi: ${when(l.created_at)}`}
                  </span>
                </summary>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <code className="break-all text-xs text-white/60">/?ref={l.slug}</code>
                  <CopyLink slug={l.slug} />
                  <form action={deleteLink} className="ml-auto">
                    <input type="hidden" name="slug" value={l.slug} />
                    <button className="text-xs text-white/30 hover:text-red-400">Linki sil</button>
                  </form>
                </div>
                {vs.length > 0 && (
                  <div className="mt-4">
                    <VisitRows visits={vs} />
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
                <VisitRows visits={byRef.get(r)!} />
              </div>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium">Linksiz ziyaretler · son 30 gün</h2>
        <p className="mb-4 text-xs text-white/50">
          {other.length} sayfa görüntüleme · {otherVisitors} farklı tarayıcı
        </p>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Tally title="Geldiği yer" rows={count(other.filter((v) => v.referrer), (v) => host(v.referrer))} />
          <Tally title="Ülke / şehir" rows={count(other, place)} />
          <Tally title="Sayfa" rows={count(other, (v) => v.path)} />
        </div>
        {other.length > 0 && <VisitRows visits={other.slice(0, 60)} />}
      </section>
    </main>
  );
}
