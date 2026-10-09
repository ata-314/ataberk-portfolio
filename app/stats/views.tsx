export type Visit = {
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
  network: string | null;
  lang: string | null;
  screen: string | null;
  tz: string | null;
  region: string | null;
  utm: string | null;
  created_at: string;
};
export type LinkRow = { slug: string; label: string; note: string | null; created_at: string };

export const when = (d: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
export const secs = (s: number | null) => (s == null ? "–" : s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60} sn`);
export const host = (r: string | null) => {
  if (!r) return "Direkt / bilinmiyor";
  try {
    return new URL(r).host.replace(/^www\./, "");
  } catch {
    return r;
  }
};
export const place = (v: Visit) =>
  [v.city, v.region && v.region !== v.city ? v.region : null, v.country].filter(Boolean).join(", ") || "–";
export const deviceOf = (v: Visit) => `${v.device} · ${v.os} · ${v.browser}`;

const SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/yandex\./, "Yandex"],
  [/duckduckgo\.com$/, "DuckDuckGo"],
  [/linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/instagram\.com$/, "Instagram"],
  [/facebook\.com$|^fb\.me$/, "Facebook"],
  [/^t\.co$|twitter\.com$|^x\.com$/, "X / Twitter"],
  [/behance\.net$/, "Behance"],
  [/dribbble\.com$/, "Dribbble"],
  [/github\.com$/, "GitHub"],
  [/whatsapp\.com$/, "WhatsApp"],
  [/^t\.me$|telegram\.org$/, "Telegram"],
  [/chatgpt\.com$|openai\.com$/, "ChatGPT"],
  [/perplexity\.ai$/, "Perplexity"],
  [/claude\.ai$/, "Claude"],
  [/mail\.|outlook\.|webmail/, "E-posta"],
];

// Where a visit came from: campaign tag or ad click first, then the referring site,
// then the in-app browser it was opened in (Instagram and LinkedIn send no referrer).
export function sourceOf(v: Visit) {
  if (v.utm) return v.utm;
  if (v.referrer) {
    const h = host(v.referrer);
    return SOURCES.find(([re]) => re.test(h))?.[1] ?? h;
  }
  if (["Instagram", "Facebook", "LinkedIn"].includes(v.browser)) return `${v.browser} (uygulama içi)`;
  return null;
}
const DIRECT = "Direkt / bilinmiyor";
const visitorSource = (vs: Visit[]) => vs.map(sourceOf).find(Boolean) ?? DIRECT;

export function count<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function VisitRows({ visits }: { visits: Visit[] }) {
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
              <td className="py-1.5 pr-4 whitespace-nowrap">{deviceOf(v)}</td>
              <td className="py-1.5 whitespace-nowrap">{sourceOf(v) ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// One personal link opened on several browsers: each browser is a "person". Later ones
// are judged against the earlier: same network reads as the same person on another
// device (or their office); another network, and above all another city, reads as forwarded.
export type Person = { visits: Visit[]; verdict: "first" | "same" | "maybe" | "likely" };

export function people(visits: Visit[]): Person[] {
  const groups = new Map<string, Visit[]>();
  for (const v of [...visits].reverse()) groups.set(v.visitor, [...(groups.get(v.visitor) ?? []), v]);
  const seenNets = new Set<string>();
  const seenCities = new Set<string>();
  return [...groups.values()].map((vs, i) => {
    const nets = vs.map((v) => v.network).filter(Boolean) as string[];
    const cities = vs.map((v) => v.city).filter(Boolean) as string[];
    const verdict: Person["verdict"] =
      i === 0
        ? "first"
        : nets.some((n) => seenNets.has(n))
          ? "same"
          : cities.length && seenCities.size && !cities.some((c) => seenCities.has(c))
            ? "likely"
            : "maybe";
    nets.forEach((n) => seenNets.add(n));
    cities.forEach((c) => seenCities.add(c));
    return { visits: vs.reverse(), verdict };
  });
}

export const VERDICT: Record<Person["verdict"], [string, string]> = {
  first: ["İlk açan", "text-[#c8ff3e]"],
  same: ["Aynı ağ — muhtemelen aynı kişi başka cihazda ya da aynı ofisten biri", "text-white/50"],
  maybe: ["Farklı cihaz ve ağ — iletilmiş olabilir (ya da aynı kişi mobil veriyle)", "text-amber-300"],
  likely: ["Farklı şehir — büyük ihtimalle iletildi", "text-orange-400"],
};

export function People({ visits }: { visits: Visit[] }) {
  return (
    <div className="flex flex-col gap-5">
      {people(visits).map((p, i) => {
        const v = p.visits[p.visits.length - 1];
        const [text, tone] = VERDICT[p.verdict];
        return (
          <div key={v.visitor}>
            <p className="mb-1 text-sm">
              <span className="font-medium">{i + 1}. kişi</span>
              <span className={`ml-2 text-xs ${tone}`}>{text}</span>
            </p>
            <p className="mb-2 text-xs text-white/50">
              {`${deviceOf(v)} · ${place(v)} · ilk: ${when(v.created_at)} · ${p.visits.length} sayfa`}
            </p>
            <Extras v={v} />
            <VisitRows visits={p.visits} />
          </div>
        );
      })}
    </div>
  );
}

export function Tally({ title, rows }: { title: string; rows: [string, number][] }) {
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


function Extras({ v }: { v: Visit }) {
  const bits = [
    v.lang && `Dil: ${v.lang}`,
    v.screen && `Ekran: ${v.screen}`,
    v.tz && `Saat dilimi: ${v.tz}`,
  ].filter(Boolean);
  if (!bits.length) return null;
  return <p className="mb-2 text-xs text-white/40">{bits.join(" · ")}</p>;
}

function Chip({ children, tone = "bg-white/10 text-white/60" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${tone}`}>{children}</span>;
}

// A browser's views split into sessions at 30 quiet minutes.
function sessions(vs: Visit[]) {
  let n = 0;
  let last = 0;
  for (const v of vs) {
    const t = new Date(v.created_at).getTime();
    if (!n || t - last > 30 * 60 * 1000) n++;
    last = t;
  }
  return n;
}

type Browser = { id: string; visits: Visit[]; source: string; sessions: number; total: number; sharedNet: number };

export function browsers(visits: Visit[]): Browser[] {
  const groups = new Map<string, Visit[]>();
  for (const v of [...visits].reverse()) groups.set(v.visitor, [...(groups.get(v.visitor) ?? []), v]);
  const netVisitors = new Map<string, Set<string>>();
  for (const v of visits)
    if (v.network) netVisitors.set(v.network, (netVisitors.get(v.network) ?? new Set()).add(v.visitor));
  return [...groups.entries()]
    .map(([id, vs]) => {
      const nets = new Set(vs.map((v) => v.network).filter(Boolean) as string[]);
      const sharedNet = Math.max(0, ...[...nets].map((n) => (netVisitors.get(n)?.size ?? 1) - 1));
      return {
        id,
        visits: [...vs].reverse(),
        source: visitorSource(vs),
        sessions: sessions(vs),
        total: vs.reduce((s, v) => s + (v.duration_s ?? 0), 0),
        sharedNet,
      };
    })
    .sort((a, b) => +new Date(b.visits[0].created_at) - +new Date(a.visits[0].created_at));
}

// Visitors who came without a personal link, one row each, newest first.
export function Visitors({ list }: { list: Browser[] }) {
  if (!list.length) return <p className="text-sm text-white/40">Bu aralıkta ziyaret yok.</p>;
  return (
    <div className="flex flex-col gap-2">
      {list.map((b) => {
        const first = b.visits[b.visits.length - 1];
        return (
          <details key={b.id} className="rounded-xl border border-white/10 p-3 open:border-white/20">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>{place(first)}</span>
              <span className="text-xs text-white/50">{deviceOf(first)}</span>
              <Chip tone={b.source === DIRECT ? undefined : "bg-[#c8ff3e]/10 text-[#c8ff3e]"}>{b.source}</Chip>
              {b.sessions > 1 && <Chip tone="bg-sky-400/15 text-sky-300">{`Tekrar gelen · ${b.sessions} kez`}</Chip>}
              {b.sharedNet > 0 && <Chip>{`Aynı ağdan ${b.sharedNet} ziyaretçi daha`}</Chip>}
              <span className="ml-auto text-xs text-white/60">
                {`${b.visits.length} sayfa · ${secs(b.total)} · son: ${when(b.visits[0].created_at)}`}
              </span>
            </summary>
            <div className="mt-3">
              <p className="mb-1 text-xs text-white/50">
                {`İlk geliş: ${when(first.created_at)} · giriş sayfası: ${first.path}`}
                {first.referrer && ` · geldiği adres: ${first.referrer}`}
              </p>
              <Extras v={first} />
              <VisitRows visits={b.visits} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
