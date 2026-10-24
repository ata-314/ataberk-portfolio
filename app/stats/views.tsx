import Link from "next/link";
import {
  type Browser, type Message, type Visit, VERDICT, deviceOf, people, place, secs, when, ago, pct,
} from "./model";

// Server-rendered pieces of the dashboard. Charts are plain SVG and CSS.

export function Card({ title, note, children, className = "" }: { title?: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-white/[0.07] bg-coal p-4 sm:p-5 ${className}`}>
      {title && (
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[15px] font-semibold text-bone">{title}</h3>
          {note && <span className="text-right text-xs text-bone-dim/70">{note}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Heading({ id, children, aside }: { id?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div id={id} className="mt-14 mb-4 flex scroll-mt-28 flex-wrap items-end justify-between gap-2">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-bone sm:text-[28px]">{children}</h2>
      {aside}
    </div>
  );
}

export function Empty({ children = "Henüz veri yok." }: { children?: React.ReactNode }) {
  return <p className="text-sm text-bone-dim/60">{children}</p>;
}

export function Chip({ children, tone = "bg-white/[0.08] text-bone-dim" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${tone}`}>{children}</span>;
}
export const LIME_CHIP = "bg-lime/10 text-lime";

export function Kpi({ label, value, sub, accent, small, className = "" }: { label: string; value: string; sub?: React.ReactNode; accent?: boolean; small?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-white/[0.07] bg-coal p-4 ${className}`}>
      <p className="text-[13px] text-bone-dim">{label}</p>
      <p className={`mt-1 font-display leading-tight font-semibold tracking-[-0.02em] ${small ? "text-lg" : "text-[26px] sm:text-[30px]"} ${accent ? "text-lime" : "text-bone"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-bone-dim/70">{sub}</p>}
    </div>
  );
}

// Change against the period before, as "+12%" in lime or "−8%" muted.
export function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return null;
  const d = Math.round(((now - before) / before) * 100);
  return <span className={d >= 0 ? "text-lime" : "text-orange-300"}>{`${d >= 0 ? "+" : "−"}%${Math.abs(d)} öncekine göre`}</span>;
}

// Ranked rows with a bar behind each; the rest fold away.
export function BarList({ rows, limit = 7, unit, link }: { rows: [string, number][]; limit?: number; unit?: string; link?: (k: string) => string | null }) {
  if (!rows.length) return <Empty />;
  const max = rows[0][1] || 1;
  const row = ([k, n]: [string, number]) => {
    const href = link?.(k);
    return (
      <div key={k} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2 py-1.5 text-sm">
        <span aria-hidden className="absolute inset-y-0 left-0 rounded-md bg-lime/[0.09]" style={{ width: `${(n / max) * 100}%` }} />
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="relative truncate text-bone hover:text-lime">{k}</a>
        ) : (
          <span className="relative truncate text-bone">{k}</span>
        )}
        <span className="relative shrink-0 tabular-nums text-bone-dim">{unit ? `${n} ${unit}` : n}</span>
      </div>
    );
  };
  return (
    <div className="flex flex-col">
      {rows.slice(0, limit).map(row)}
      {rows.length > limit && (
        <details>
          <summary className="cursor-pointer px-2 pt-1.5 text-xs text-bone-dim/70 hover:text-bone">{`${rows.length - limit} tane daha`}</summary>
          {rows.slice(limit).map(row)}
        </details>
      )}
    </div>
  );
}

export type Bucket = { key: string; label: string; visitors: number; views: number };

// Visitors (lime) over page views (graphite) per day, or per hour for "Bugün".
export function DailyChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.views));
  const w = 10;
  const h = 120;
  const step = Math.ceil(buckets.length / 7);
  return (
    <div>
      <div className="relative">
        <span className="absolute top-0 right-0 text-[11px] text-bone-dim/50 tabular-nums">{max}</span>
        <svg viewBox={`0 0 ${buckets.length * w} ${h}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label="Ziyaretçi grafiği">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={buckets.length * w} y1={h - h * f} y2={h - h * f} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {buckets.map((b, i) => (
            <g key={b.key}>
              <title>{`${b.label}: ${b.visitors} ziyaretçi, ${b.views} görüntüleme`}</title>
              <rect x={i * w} width={w} y="0" height={h} fill="transparent" />
              <rect x={i * w + 1.5} width={w - 3} y={h - (b.views / max) * h} height={(b.views / max) * h} fill="#2a2a31" />
              <rect x={i * w + 1.5} width={w - 3} y={h - (b.visitors / max) * h} height={(b.visitors / max) * h} fill="#c8ff3e" />
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex text-[11px] text-bone-dim/60">
        {buckets.map((b, i) => (
          <span key={b.key} className="w-0 flex-1 overflow-visible text-center whitespace-nowrap">{i % step === 0 ? b.label : ""}</span>
        ))}
      </div>
      <p className="mt-3 flex gap-4 text-xs text-bone-dim">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-lime" />Ziyaretçi</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#2a2a31]" />Sayfa görüntüleme</span>
      </p>
    </div>
  );
}

// Steps as shares of a base (visitors), each bar against that base.
export function Funnel({ rows, base, unit = "kişi" }: { rows: [string, number][]; base: number; unit?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map(([k, n]) => (
        <div key={k}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-bone">{k}</span>
            <span className="shrink-0 tabular-nums text-bone-dim">{`${n} ${unit} · ${pct(n, base)}`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-lime" style={{ width: `${base ? Math.min(100, Math.max(n ? 1.5 : 0, (n / base) * 100)) : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Label/value pairs for the visitor page.
export function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  const shown = rows.filter(([, v]) => v != null && v !== "" && v !== false);
  if (!shown.length) return <Empty />;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-bone-dim">{k}</dt>
          <dd className="min-w-0 break-words text-bone">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export const visitorHref = (id: string) => `/stats/v/${id}`;

export function VisitRows({ visits }: { visits: Visit[] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-bone-dim/60">
          <tr>
            {["Zaman", "Sayfa", "Süre", "Kaydırma", "Yer", "Cihaz"].map((h) => (
              <th key={h} className="px-1 py-1 pr-4 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id} className="border-t border-white/5 text-bone/85">
              <td className="px-1 py-1.5 pr-4 whitespace-nowrap">{when(v.created_at)}</td>
              <td className="px-1 py-1.5 pr-4">{v.path}</td>
              <td className="px-1 py-1.5 pr-4 whitespace-nowrap">{secs(v.duration_s)}</td>
              <td className="px-1 py-1.5 pr-4 whitespace-nowrap">{v.scroll_pct == null ? "–" : `%${v.scroll_pct}`}</td>
              <td className="px-1 py-1.5 pr-4 whitespace-nowrap">{place(v)}</td>
              <td className="px-1 py-1.5 whitespace-nowrap">{deviceOf(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function People({ visits }: { visits: Visit[] }) {
  return (
    <div className="flex flex-col gap-5">
      {people(visits).map((p, i) => {
        const v = p.visits[p.visits.length - 1];
        const [text, tone] = VERDICT[p.verdict];
        return (
          <div key={v.visitor}>
            <p className="mb-1 flex flex-wrap items-baseline gap-x-2 text-sm">
              <Link href={visitorHref(v.visitor)} className="font-medium text-bone underline decoration-white/20 underline-offset-4 hover:text-lime">
                {`${i + 1}. kişi`}
              </Link>
              <span className={`text-xs ${tone}`}>{text}</span>
            </p>
            <p className="mb-2 text-xs text-bone-dim">{`${deviceOf(v)} · ${place(v)} · ilk: ${when(v.created_at)} · ${p.visits.length} sayfa`}</p>
            <VisitRows visits={p.visits} />
          </div>
        );
      })}
    </div>
  );
}

// Every visitor in the range, newest first, each opening their own page.
export function Visitors({ list, label, wrote, now }: { list: Browser[]; label: (id: string, ref?: string | null) => string; wrote: Set<string>; now: number }) {
  if (!list.length) return <Empty>Bu aralıkta ziyaret yok.</Empty>;
  const row = (b: Browser) => {
    const first = b.visits[b.visits.length - 1];
    const last = b.visits[0];
    return (
      <Link
        key={b.id}
        href={visitorHref(b.id)}
        className="flex flex-col gap-1.5 border-t border-white/[0.05] px-4 py-3 first:border-t-0 hover:bg-white/[0.03] lg:flex-row lg:items-center lg:gap-4"
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-medium text-bone">{label(b.id, first.ref)}</span>
          <span className="text-xs text-bone-dim">{`${place(first)} · ${deviceOf(first)}`}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {first.ref && <Chip tone={LIME_CHIP}>Kişiye özel link</Chip>}
          {wrote.has(b.id) && <Chip tone={LIME_CHIP}>Form gönderdi</Chip>}
          <Chip tone={b.source === "Direkt / bilinmiyor" ? undefined : "bg-cyan/10 text-cyan"}>{b.source}</Chip>
          {b.returning && <Chip tone="bg-sky-400/15 text-sky-300">{b.sessions > 1 ? `Tekrar gelen · ${b.sessions} oturum` : "Tekrar gelen"}</Chip>}
          {b.sharedNet > 0 && <Chip>{`Aynı ağdan ${b.sharedNet} kişi daha`}</Chip>}
        </span>
        <span className="text-xs whitespace-nowrap text-bone-dim tabular-nums lg:w-52 lg:text-right">
          {`${b.visits.length} sayfa · ${secs(b.total)} · ${ago(last.created_at, now)}`}
        </span>
      </Link>
    );
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-coal">
      {list.slice(0, 50).map(row)}
      {list.length > 50 && (
        <details className="border-t border-white/[0.05]">
          <summary className="cursor-pointer px-4 py-3 text-sm text-bone-dim hover:text-bone">{`${list.length - 50} kişi daha`}</summary>
          {list.slice(50).map(row)}
        </details>
      )}
    </div>
  );
}

// Contact-form messages, newest first, tied to the personal link and visitor they came from.
export function Messages({ list, labels }: { list: Message[]; labels: Map<string, string> }) {
  if (!list.length) return <Empty>Henüz mesaj yok.</Empty>;
  return (
    <div className="flex flex-col gap-2">
      {list.map((m) => (
        <details key={m.id} className="rounded-2xl border border-white/[0.07] bg-coal p-4 open:border-white/15">
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-bone">{m.name}</span>
            {m.intent && <Chip>{m.intent}</Chip>}
            {m.ref && <Chip tone={LIME_CHIP}>{`Link: ${labels.get(m.ref) ?? m.ref}`}</Chip>}
            {!m.emailed && <Chip tone="bg-red-400/15 text-red-300">Mail gitmedi</Chip>}
            <span className="ml-auto text-xs text-bone-dim">{when(m.created_at)}</span>
          </summary>
          <MessageBody m={m} />
        </details>
      ))}
    </div>
  );
}

export function MessageBody({ m }: { m: Message }) {
  return (
    <div className="mt-3 text-sm">
      <p className="text-xs text-bone-dim">
        <a href={`mailto:${m.email}`} className="text-bone underline underline-offset-2">{m.email}</a>
        {m.company && ` · ${m.company}`}
        {m.phone && (
          <>
            {" · "}
            <a href={`tel:${m.phone}`} className="text-bone underline underline-offset-2">{m.phone}</a>
          </>
        )}
        {` · ${[m.city, m.country].filter(Boolean).join(", ") || "Konum bilinmiyor"}`}
        {m.device && ` · ${m.device}`}
        {m.visitor && (
          <>
            {" · "}
            <Link href={visitorHref(m.visitor)} className="text-lime hover:underline">Ziyaretçi sayfası</Link>
          </>
        )}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-bone/90">{m.message}</p>
      {m.mail_error && <p className="mt-3 text-xs text-red-300/80">{m.mail_error}</p>}
    </div>
  );
}

export type FeedItem = { at: string; visitor: string; what: string; path: string | null; tone: "view" | "act" | "goal" | "error" };
export const TONE: Record<FeedItem["tone"], string> = {
  view: "bg-white/25",
  act: "bg-cyan",
  goal: "bg-lime",
  error: "bg-red-400",
};

// The latest page views and actions across the site, newest first.
export function Feed({ items, who, now }: { items: FeedItem[]; who: (visitor: string) => { label: string; detail: string }; now: number }) {
  if (!items.length) return <Empty>Bu aralıkta hareket yok.</Empty>;
  return (
    <ol className="max-h-[75svh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.07] bg-coal lg:max-h-[1240px]">
      {items.map((it, i) => {
        const w = who(it.visitor);
        return (
          <li key={i} className="flex gap-3 border-t border-white/[0.05] px-4 py-2.5 first:border-t-0">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[it.tone]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm break-words text-bone">
                <Link href={visitorHref(it.visitor)} className="font-medium hover:text-lime">{w.label}</Link>
                <span className="text-bone/75">{` ${it.what}`}</span>
              </p>
              <p className="truncate text-xs text-bone-dim/80">{[it.path, w.detail].filter(Boolean).join(" · ")}</p>
            </div>
            <span className="shrink-0 text-xs whitespace-nowrap text-bone-dim/70" title={when(it.at)}>{ago(it.at, now)}</span>
          </li>
        );
      })}
    </ol>
  );
}
