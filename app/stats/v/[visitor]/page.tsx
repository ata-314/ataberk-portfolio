import Link from "next/link";
import { notFound } from "next/navigation";
import { isSignedIn } from "@/lib/track/auth";
import { sql } from "@/lib/track/db";
import { NoTrack, SignIn } from "../../ui";
import {
  type Event, type LinkRow, type Message, type Visit, browsers, clock, countryName, labeler, median, place, secs, sessionsOf, sourceOf, timeline,
  visitorSource, when,
} from "../../model";
import { Card, Chip, Empty, Facts, Heading, Kpi, LIME_CHIP, MessageBody, TONE, visitorHref } from "../../views";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const yes = (b: boolean | null | undefined) => (b == null ? null : b ? "Evet" : "Hayır");

// One visitor (one browser): everything known about them and their whole journey,
// session by session.
export default async function VisitorPage({ params }: { params: Promise<{ visitor: string }> }) {
  if (!(await isSignedIn())) return <SignIn />;
  const { visitor } = await params;
  if (!UUID.test(visitor)) notFound();

  const db = sql();
  const [visits, events, messages, links] = (await Promise.all([
    db`select * from visits where visitor = ${visitor} order by created_at asc limit 5000`,
    db`select * from events where visitor = ${visitor} order by created_at asc limit 5000`,
    db`select * from messages where visitor = ${visitor} order by created_at desc`,
    db`select slug, label, note, created_at from links`,
  ])) as [Visit[], Event[], Message[], LinkRow[]];
  if (!visits.length && !events.length) notFound();

  const nets = [...new Set(visits.map((v) => v.network).filter(Boolean) as string[])];
  const peers = nets.length
    ? ((await db`select visitor, max(created_at) as last, count(*)::int as n from visits
        where network = any(${nets}) and visitor <> ${visitor} group by visitor order by last desc limit 20`) as {
        visitor: string;
        last: string;
        n: number;
      }[])
    : [];

  const first = visits[0];
  const last = visits[visits.length - 1];
  const ref = visits.find((v) => v.ref)?.ref ?? events.find((e) => e.ref)?.ref ?? null;
  const label = labeler(messages, links)(visitor, ref);
  const link = links.find((l) => l.slug === ref);
  // Latest known value of a field (older views predate some columns).
  const latest = <K extends keyof Visit>(k: K) => [...visits].reverse().find((v) => v[k] != null)?.[k] ?? null;
  const nums = (k: keyof Visit) => visits.map((v) => v[k]).filter((n): n is number => typeof n === "number");
  const total = visits.reduce((s, v) => s + (v.duration_s ?? 0), 0);
  const sessions = sessionsOf(visits);
  const lat = latest("latitude");
  const lon = latest("longitude");

  // Each action belongs to the session it happened in (the last one begun before it).
  const starts = sessions.map((s) => +new Date(s[0].created_at));
  const bySession = sessions.map(() => [] as Event[]);
  for (const e of events) {
    const t = +new Date(e.created_at);
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= t) i++;
    bySession[i]?.push(e);
  }

  return (
    <div className="min-h-svh">
      <NoTrack />
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/stats#kisiler" className="text-sm text-bone-dim hover:text-bone">← Tüm ziyaretçiler</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="pt-8">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-bone sm:text-4xl">{label}</h1>
          {first && <p className="mt-1 text-sm text-bone-dim">{`${place(last)} · ${last.device} · ${last.os} · ${last.browser}`}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {link && <Chip tone={LIME_CHIP}>{`Kişiye özel link: ${link.label}`}</Chip>}
            {messages.length > 0 && <Chip tone={LIME_CHIP}>Form gönderdi</Chip>}
            {first && <Chip tone="bg-cyan/10 text-cyan">{visitorSource(visits)}</Chip>}
            {sessions.length > 1 && <Chip tone="bg-sky-400/15 text-sky-300">{`${sessions.length} kez geldi`}</Chip>}
            {peers.length > 0 && <Chip>{`Aynı ağdan ${peers.length} kişi daha`}</Chip>}
            {visits.length > 0 && browsers([...visits].reverse())[0].datacenter && (
              <Chip tone="bg-orange-400/10 text-orange-300/90">Veri merkezi · muhtemelen otomatik tarama</Chip>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="İlk geliş" value={first ? when(first.created_at) : "–"} small />
          <Kpi label="Son görülme" value={last ? when(last.created_at) : "–"} small />
          <Kpi label="Oturum" value={String(sessions.length)} />
          <Kpi label="Sayfa" value={String(visits.length)} />
          <Kpi label="Toplam süre" value={secs(total)} />
          <Kpi label="Hareket" value={String(events.length)} />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Card title="Nereden geldi">
            <Facts
              rows={[
                ["Kaynak", first ? visitorSource(visits) : null],
                ["Geldiği adres", first?.referrer],
                ["Kampanya", visits.find((v) => v.utm)?.utm],
                ["Kişiye özel link", link ? `${link.label} (ataberksoylu.com/${link.slug})` : ref],
                ["İlk açtığı sayfa", first?.path],
                ["Ağ", nets.length ? `${nets.length} farklı ağ (IP saklanmaz, yalnızca karşılaştırma için özet)` : null],
                [
                  "Aynı ağdan",
                  peers.length ? (
                    <span className="flex flex-wrap gap-x-3">
                      {peers.map((p) => (
                        <Link key={p.visitor} href={visitorHref(p.visitor)} className="text-lime hover:underline">
                          {`${p.visitor.slice(0, 4).toUpperCase()} · ${p.n} sayfa`}
                        </Link>
                      ))}
                    </span>
                  ) : null,
                ],
              ]}
            />
          </Card>
          <Card title="Konum" note="IP'den, şehir düzeyinde">
            <Facts
              rows={[
                ["Şehir", latest("city")],
                ["Bölge kodu", latest("region")],
                ["Ülke", latest("country") ? countryName(latest("country")) : null],
                ["Posta kodu", latest("postal")],
                [
                  "Yaklaşık nokta",
                  lat != null && lon != null ? (
                    <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`} target="_blank" rel="noreferrer" className="text-lime hover:underline">
                      {`${lat.toFixed(2)}, ${lon.toFixed(2)} · haritada aç`}
                    </a>
                  ) : null,
                ],
                ["Saat dilimi", latest("tz")],
                ["Dil", latest("lang")],
              ]}
            />
          </Card>
          <Card title="Cihaz">
            <Facts
              rows={[
                ["Cihaz", last ? `${last.device} · ${last.os} · ${last.browser}` : null],
                ["Ekran", latest("screen")],
                ["Pencere", latest("viewport")],
                ["Piksel yoğunluğu", latest("dpr") != null ? `${latest("dpr")}x` : null],
                ["Giriş", latest("pointer") === "coarse" ? "Dokunmatik" : latest("pointer") === "fine" ? "Fare / trackpad" : latest("pointer")],
                ["Tema", latest("scheme") === "dark" ? "Karanlık" : latest("scheme") === "light" ? "Açık" : null],
                ["Hareket azaltma", yes(latest("reduced_motion"))],
                ["Bağlantı", latest("connection")],
                ["Bellek", latest("memory_gb") != null ? `${latest("memory_gb")} GB ve üzeri` : null],
                ["İşlemci çekirdeği", latest("cores")],
              ]}
            />
          </Card>
          <Card title="Hız" note="bu kişinin açılışları">
            <Facts
              rows={[
                ["İlk bayt", nums("ttfb_ms").length ? `${median(nums("ttfb_ms"))} ms` : null],
                ["Sayfa hazır", nums("dom_ms").length ? `${median(nums("dom_ms"))} ms` : null],
                ["En büyük görsel (LCP)", nums("lcp_ms").length ? `${median(nums("lcp_ms"))} ms` : null],
                ["Ortalama kaydırma", nums("scroll_pct").length ? `%${Math.round(nums("scroll_pct").reduce((a, b) => a + b, 0) / nums("scroll_pct").length)}` : null],
              ]}
            />
          </Card>
        </div>

        {messages.length > 0 && (
          <>
            <Heading>Gönderdiği mesajlar</Heading>
            <div className="flex flex-col gap-2">
              {messages.map((m) => (
                <Card key={m.id} title={`${m.name}${m.intent ? ` · ${m.intent}` : ""}`} note={when(m.created_at)}>
                  <MessageBody m={m} />
                </Card>
              ))}
            </div>
          </>
        )}

        <Heading>Yolculuk</Heading>
        {!sessions.length && <Empty>Sayfa görüntülemesi yok.</Empty>}
        <div className="flex flex-col gap-3">
          {sessions
            .map((s, i) => ({ s, i, items: timeline(s, bySession[i]).reverse() }))
            .reverse()
            .map(({ s, i, items }) => {
              const time = s.reduce((t, v) => t + (v.duration_s ?? 0), 0);
              const src = sourceOf(s[0]);
              return (
                <Card
                  key={s[0].id}
                  title={`${i + 1}. oturum · ${when(s[0].created_at)}`}
                  note={`${s.length} sayfa · ${secs(time)}${src ? ` · ${src}` : ""}`}
                >
                  <p className="mb-3 text-xs text-bone-dim">{`Giriş: ${s[0].path} · Çıkış: ${s[s.length - 1].path}`}</p>
                  <ol className="relative ml-1 border-l border-white/[0.08]">
                    {items.map((it, j) => (
                      <li key={j} className="relative py-1.5 pl-5">
                        <span aria-hidden className={`absolute top-3 -left-[4.5px] h-2 w-2 rounded-full ${TONE[it.tone]}`} />
                        <p className="text-sm break-words">
                          <span className="mr-2 text-xs text-bone-dim/70 tabular-nums">{clock(it.at)}</span>
                          {it.tone === "view" ? (
                            <>
                              <span className="font-medium text-bone">{it.path}</span>
                              {it.bits && <span className="text-bone/70">{` · ${it.bits}`}</span>}
                            </>
                          ) : (
                            <span className="text-bone/80">{it.what}</span>
                          )}
                          {it.tone !== "view" && it.path && <span className="text-xs text-bone-dim/60">{` · ${it.path}`}</span>}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Card>
              );
            })}
        </div>
      </main>
    </div>
  );
}
