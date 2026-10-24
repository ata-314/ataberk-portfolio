import Link from "next/link";
import { isSignedIn } from "@/lib/track/auth";
import { sql } from "@/lib/track/db";
import { deleteLink, signOut } from "./actions";
import { CopyLink, NewLink, NoTrack, SignIn } from "./ui";
import {
  type Event, type LinkRow, type Message, type Visit, EVENT_NAMES, HOME_SECTIONS, avg, browsers, count, countryName, dayKey,
  filmName, groupBy, hourKey, isHome, labeler, median, minutes, pct, people, place, reach, requestTime, secs, sessionsOf, timeline, when,
} from "./model";
import {
  type Bucket, BarList, Card, Chip, DailyChart, Delta, Empty, Facts, Feed, Funnel, Heading, Kpi, LIME_CHIP, Messages, People, Visitors,
} from "./views";

export const dynamic = "force-dynamic";

const RANGES = [1, 7, 30, 90];
// Conversion steps from Tracker.tsx, in the order a visitor takes them (people, not clicks).
const FUNNEL = [
  ["cta_contact", "İletişim butonuna tıkladı"],
  ["form_start", "Formu doldurmaya başladı"],
  ["form_sent", "Formu gönderdi"],
  ["whatsapp", "WhatsApp'a geçti"],
  ["email", "E-posta linkine tıkladı"],
] as const;
const DAY = 86400000;

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  if (!(await isSignedIn())) return <SignIn />;
  const asked = Number((await searchParams).gun);
  const days = RANGES.includes(asked) ? asked : 30;
  const now = requestTime();
  const since = now - days * DAY;

  const db = sql();
  // This range and the one before it (for the change on the tiles), the actions in
  // range, every personal-link visit ever, links and messages.
  const [recent, events, tagged, links, messages] = (await Promise.all([
    db`select * from visits where created_at > now() - make_interval(days => ${days * 2})
      order by created_at desc limit 20000`,
    db`select * from events where created_at > now() - make_interval(days => ${days})
      order by created_at desc limit 20000`,
    db`select * from visits where ref is not null order by created_at desc limit 3000`,
    db`select slug, label, note, created_at from links order by created_at desc`,
    db`select * from messages order by created_at desc limit 200`,
  ])) as [Visit[], Event[], Visit[], LinkRow[], Message[]];

  const visits = recent.filter((v) => +new Date(v.created_at) > since);
  const before = recent.filter((v) => +new Date(v.created_at) <= since);
  const list = browsers(visits);
  const prevVisitors = new Set(before.map((v) => v.visitor)).size;
  const label = labeler(messages, links);
  const labels = new Map(links.map((l) => [l.slug, l.label]));
  const wrote = new Set(messages.map((m) => m.visitor).filter(Boolean) as string[]);
  const latest = new Map<string, Visit>();
  for (const v of recent) if (!latest.has(v.visitor)) latest.set(v.visitor, v);
  for (const v of tagged) if (!latest.has(v.visitor)) latest.set(v.visitor, v);
  const who = (visitor: string) => {
    const v = latest.get(visitor);
    return { label: label(visitor, v?.ref), detail: v ? `${place(v)} · ${v.device} · ${v.browser}` : "" };
  };

  // Tiles.
  const sent = messages.filter((m) => +new Date(m.created_at) > since).length;
  const whatsapp = events.filter((e) => e.name === "whatsapp").length;
  const returning = list.filter((b) => b.returning).length;
  const avgTime = avg(list.map((b) => b.total));
  const prevAvg = avg(browsers(before).map((b) => b.total));

  // Visitors and views per day (per hour for today).
  const hourly = days === 1;
  const slots = hourly ? 24 : days;
  const fmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short" });
  const buckets: Bucket[] = Array.from({ length: slots }, (_, i) => {
    const d = new Date(now - (slots - 1 - i) * (hourly ? 3600000 : DAY));
    const key = hourly ? hourKey(d) : dayKey(d);
    return { key, label: hourly ? `${key.slice(-2)}:00` : fmt.format(d), visitors: 0, views: 0 };
  });
  const slot = new Map(buckets.map((b) => [b.key, b]));
  const seenIn = new Map<string, Set<string>>();
  for (const v of visits) {
    const d = new Date(v.created_at);
    const b = slot.get(hourly ? hourKey(d) : dayKey(d));
    if (!b) continue;
    b.views++;
    const s = seenIn.get(b.key) ?? new Set();
    s.add(v.visitor);
    seenIn.set(b.key, s);
    b.visitors = s.size;
  }

  // Who they are and where from: each visitor counted once, by their first view.
  const firsts = list.map((b) => b.visits[b.visits.length - 1]);
  const lasts = list.map((b) => b.visits[0]);
  const sessions = list.flatMap((b) => sessionsOf([...b.visits].reverse()));

  // Pages: views, people, time and scroll.
  const pages = [...groupBy(visits, (v) => v.path).entries()]
    .map(([path, vs]) => ({
      path,
      views: vs.length,
      people: new Set(vs.map((v) => v.visitor)).size,
      time: avg(vs.map((v) => v.duration_s).filter((n): n is number => n != null)),
      scroll: avg(vs.map((v) => v.scroll_pct).filter((n): n is number => n != null)),
    }))
    .sort((a, b) => b.views - a.views);

  // Actions.
  const named = (name: string) => events.filter((e) => e.name === name);
  const d = (e: Event, k: string) => (e.data?.[k] == null ? null : String(e.data[k]));
  const steps = new Map(reach(events, (e) => e.name));
  const funnel = FUNNEL.map(([name, text]) => [text, steps.get(name) ?? 0] as [string, number]);
  const outbound = count(named("outbound"), (e) => d(e, "href")?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
  const navClicks = count(named("nav_click"), (e) => `${d(e, "text") || "(metinsiz)"} → ${d(e, "href") ?? ""}`);
  const films = count(named("film_play"), (e) => filmName(d(e, "film")));
  const watched = avg(named("film_close").map((e) => Number(e.data?.watched) || 0));
  const lab = count([...named("lab_touch"), ...named("lab_control")], (e) => d(e, "lab"));
  const fields = reach(named("field_focus"), (e) => d(e, "field"));
  const errors = count(named("js_error"), (e) => d(e, "msg"));
  const allActions = count(events, (e) => EVENT_NAMES[e.name] ?? e.name);

  // How far down the home page people got. Only views since section tracking began
  // (they carry a session number) count in the base.
  const homeBase = new Set(visits.filter((v) => isHome(v.path) && v.session_n != null).map((v) => v.visitor)).size;
  const sectionReach = new Map(reach(named("section_view").filter((e) => isHome(e.path)), (e) => d(e, "section")));
  const sectionRows = HOME_SECTIONS.map(([k, text]) => [text, sectionReach.get(k) ?? 0] as [string, number]);

  // Speed and settings, from the views that report them.
  const nums = (k: keyof Visit) => visits.map((v) => v[k]).filter((n): n is number => typeof n === "number");
  const measured = lasts.filter((v) => v.scheme);
  const share = (f: (v: Visit) => boolean) => pct(measured.filter(f).length, measured.length);

  // The cards beside the feed; empty ones collapse into one line.
  const actionCards: { title: string; note: string; rows: [string, number][]; limit?: number; link?: (k: string) => string }[] = [
    { title: "Dış linkler", note: "tıklama", rows: outbound, link: (k) => `https://${k}` },
    { title: "Tüm hareketler", note: "adet", rows: allActions, limit: 8 },
    { title: "Site içi tıklamalar", note: "tıklama", rows: navClicks, limit: 6 },
    { title: "Filmler", note: watched != null ? `ort. ${secs(watched)} açık kaldı` : "oynatma", rows: films },
    { title: "Lab deneyleri", note: "etkileşim", rows: lab },
    { title: "Form alanları", note: "giren kişi", rows: fields },
    { title: "Sayfa hataları", note: "adet", rows: errors },
  ];

  const feed = timeline(visits.slice(0, 400), events.slice(0, 600)).slice(0, 100);

  // Personal links.
  const byRef = groupBy(tagged, (v) => v.ref!);
  const known = new Set(links.map((l) => l.slug));
  const unknownRefs = [...byRef.keys()].filter((r) => !known.has(r));
  const linkWrote = new Set(messages.map((m) => m.ref).filter(Boolean));

  return (
    <div className="min-h-svh">
      <NoTrack />
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/stats" className="font-display text-lg font-semibold tracking-[-0.02em] text-bone">Ziyaretçiler</Link>
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto text-sm text-bone-dim sm:order-none sm:w-auto">
            {[["#genel", "Genel"], ["#hareketler", "Hareketler"], ["#sayfalar", "Sayfalar"], ["#mesajlar", "Mesajlar"], ["#linkler", "Linkler"], ["#kisiler", "Kişiler"]].map(([h, t]) => (
              <a key={h} href={h} className="shrink-0 rounded-md px-2 py-1 hover:bg-white/[0.06] hover:text-bone">{t}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <nav className="flex rounded-lg bg-white/[0.05] p-0.5 text-xs">
              {RANGES.map((n) => (
                <Link
                  key={n}
                  href={`/stats?gun=${n}`}
                  className={`rounded-md px-2.5 py-1.5 ${n === days ? "bg-lime font-medium text-ink" : "text-bone-dim hover:text-bone"}`}
                >
                  {n === 1 ? "Bugün" : `${n} gün`}
                </Link>
              ))}
            </nav>
            <form action={signOut}>
              <button className="text-xs text-bone-dim/70 hover:text-bone">Çıkış</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div id="genel" className="scroll-mt-28 pt-8">
          <p className="text-sm text-bone-dim">{days === 1 ? "Son 24 saat" : `Son ${days} gün`}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Kpi label="Ziyaretçi" value={String(list.length)} sub={<Delta now={list.length} before={prevVisitors} />} />
          <Kpi label="Görüntüleme" value={String(visits.length)} sub={<Delta now={visits.length} before={before.length} />} />
          <Kpi label="Ort. süre" value={minutes(avgTime)} sub={prevAvg != null ? `önceki: ${minutes(prevAvg)}` : undefined} />
          <Kpi label="Tekrar gelen" value={pct(returning, list.length)} sub={`${returning} kişi`} />
          <Kpi label="Form gönderimi" value={String(sent)} accent={sent > 0} />
          <Kpi label="WhatsApp" value={String(whatsapp)} />
          <Kpi label="Dönüşüm" value={pct(sent, list.length)} sub="form / ziyaretçi" accent={sent > 0} className="col-span-2 md:col-span-1" />
        </div>

        <Card title={hourly ? "Saat saat" : "Gün gün"} className="mt-3">
          <DailyChart buckets={buckets} />
        </Card>

        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card title="Kaynak" note="kişi">
            <BarList rows={count(list, (b) => b.source)} />
          </Card>
          <Card title="Ülke" note="kişi">
            <BarList rows={count(firsts, (v) => countryName(v.country))} />
          </Card>
          <Card title="Şehir" note="kişi">
            <BarList rows={count(firsts, (v) => (v.city ? place(v) : "Bilinmiyor"))} />
          </Card>
          <Card title="Cihaz" note="kişi">
            <BarList rows={count(firsts, (v) => v.device)} />
          </Card>
          <Card title="İşletim sistemi" note="kişi">
            <BarList rows={count(firsts, (v) => v.os)} />
          </Card>
          <Card title="Tarayıcı" note="kişi">
            <BarList rows={count(firsts, (v) => v.browser)} />
          </Card>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Card title="Dönüşüm hunisi" note={`${list.length} ziyaretçiden`}>
            <Funnel rows={funnel} base={list.length} />
          </Card>
          <Card title="Ana sayfada nereye kadar indiler" note={homeBase ? `${homeBase} kişiden` : undefined}>
            {homeBase ? <Funnel rows={sectionRows} base={homeBase} /> : <Empty>Bölüm takibi yeni başladı; ilk ziyaretlerle dolacak.</Empty>}
          </Card>
        </div>

        <Heading id="hareketler">Son hareketler</Heading>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <Feed items={feed} who={who} now={now} />
          <div className="flex flex-col gap-3">
            {actionCards.filter((c) => c.rows.length).map((c) => (
              <Card key={c.title} title={c.title} note={c.note}>
                <BarList rows={c.rows} limit={c.limit} link={c.link} />
              </Card>
            ))}
            {actionCards.some((c) => !c.rows.length) && (
              <p className="px-1 text-xs text-bone-dim/60">
                {`Henüz hareket yok: ${actionCards.filter((c) => !c.rows.length).map((c) => c.title).join(", ")}.`}
              </p>
            )}
          </div>
        </div>

        <Heading id="sayfalar">Sayfalar</Heading>
        <Card>
          {pages.length === 0 ? (
            <Empty />
          ) : (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-bone-dim/70">
                  <tr>
                    {["Sayfa", "Görüntüleme", "Kişi", "Ort. süre", "Ort. kaydırma"].map((h, i) => (
                      <th key={h} className={`px-1 pb-2 font-normal whitespace-nowrap ${i ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {pages.slice(0, 20).map((p) => (
                    <tr key={p.path} className="border-t border-white/[0.05]">
                      <td className="max-w-[16rem] truncate px-1 py-2 text-bone">{p.path}</td>
                      <td className="px-1 py-2 text-right text-bone">{p.views}</td>
                      <td className="px-1 py-2 text-right text-bone-dim">{p.people}</td>
                      <td className="px-1 py-2 text-right whitespace-nowrap text-bone-dim">{secs(p.time)}</td>
                      <td className="px-1 py-2 text-right text-bone-dim">{p.scroll == null ? "–" : `%${p.scroll}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Card title="Giriş sayfası" note="oturum">
            <BarList rows={count(sessions, (s) => s[0].path)} />
          </Card>
          <Card title="Çıkış sayfası" note="oturum">
            <BarList rows={count(sessions, (s) => s[s.length - 1].path)} />
          </Card>
          <Card title="Hız ve ayarlar" note={measured.length ? `${measured.length} kişiden` : undefined}>
            {measured.length ? (
              <Facts
                rows={[
                  ["İlk bayt (medyan)", nums("ttfb_ms").length ? `${median(nums("ttfb_ms"))} ms` : null],
                  ["Sayfa hazır (medyan)", nums("dom_ms").length ? `${median(nums("dom_ms"))} ms` : null],
                  ["En büyük görsel (LCP)", nums("lcp_ms").length ? `${median(nums("lcp_ms"))} ms` : null],
                  ["Karanlık mod", share((v) => v.scheme === "dark")],
                  ["Dokunmatik", share((v) => v.pointer === "coarse")],
                  ["Hareket azaltma açık", share((v) => !!v.reduced_motion)],
                  ["Bağlantı", count(measured, (v) => v.connection).map(([k, n]) => `${k} ${n}`).join(" · ") || null],
                ]}
              />
            ) : (
              <Empty>Yeni ölçümler ilk ziyaretlerle gelecek.</Empty>
            )}
          </Card>
        </div>

        <Heading id="mesajlar">{`Mesajlar (${messages.length})`}</Heading>
        <Messages list={messages} labels={labels} />

        <Heading id="linkler">{`Kişiye özel linkler (${links.length})`}</Heading>
        <Card title="Yeni link">
          <NewLink />
        </Card>
        <div className="mt-3 flex flex-col gap-2">
          {links.length === 0 && <Empty>Henüz link yok.</Empty>}
          {links.map((l) => {
            const vs = byRef.get(l.slug) ?? [];
            const total = vs.reduce((s, v) => s + (v.duration_s ?? 0), 0);
            const ps = people(vs);
            const forwarded = ps.filter((p) => p.verdict === "maybe" || p.verdict === "likely").length;
            return (
              <details key={l.slug} className="rounded-2xl border border-white/[0.07] bg-coal p-4 open:border-white/15">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`h-2 w-2 rounded-full ${vs.length ? "bg-lime" : "bg-white/20"}`} />
                  <span className="font-medium text-bone">{l.label}</span>
                  {l.note && <span className="text-xs text-bone-dim/70">{l.note}</span>}
                  {linkWrote.has(l.slug) && <Chip tone={LIME_CHIP}>Form gönderdi</Chip>}
                  {ps.length > 1 && (
                    <Chip tone={forwarded ? "bg-orange-400/15 text-orange-300" : undefined}>
                      {forwarded ? `${ps.length} kişi · iletilmiş olabilir` : `${ps.length} cihaz`}
                    </Chip>
                  )}
                  <span className="ml-auto text-xs text-bone-dim">
                    {vs.length
                      ? `${vs.length} sayfa · ${secs(total)} · son: ${when(vs[0].created_at)}`
                      : `Henüz açılmadı · gönderildi: ${when(l.created_at)}`}
                  </span>
                </summary>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <code className="text-xs break-all text-bone-dim">ataberksoylu.com/{l.slug}</code>
                  <CopyLink slug={l.slug} />
                  <form action={deleteLink} className="ml-auto">
                    <input type="hidden" name="slug" value={l.slug} />
                    <button className="text-xs text-bone-dim/50 hover:text-red-400">Linki sil</button>
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
            <details key={r} className="rounded-2xl border border-dashed border-white/10 p-4">
              <summary className="cursor-pointer text-sm text-bone">
                {r} <span className="text-xs text-bone-dim/70">(listede olmayan / silinmiş link)</span>
              </summary>
              <div className="mt-4">
                <People visits={byRef.get(r)!} />
              </div>
            </details>
          ))}
        </div>

        <Heading id="kisiler" aside={<span className="text-xs text-bone-dim">{list.length > 200 ? `son 200 / ${list.length}` : `${list.length} kişi`}</span>}>
          Kişiler
        </Heading>
        <Visitors list={list.slice(0, 200)} label={label} wrote={wrote} now={now} />
      </main>
    </div>
  );
}
