import { stripFilms } from "@/content/strip";

// Rows as stored by app/api/t/route.ts and app/api/contact, and the pure helpers the
// dashboard computes with. Every time is shown in İstanbul time.

export type Visit = {
  id: string;
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
  viewport: string | null;
  dpr: number | null;
  scheme: string | null;
  reduced_motion: boolean | null;
  pointer: string | null;
  connection: string | null;
  memory_gb: number | null;
  cores: number | null;
  ttfb_ms: number | null;
  dom_ms: number | null;
  lcp_ms: number | null;
  session_n: number | null;
  scroll_pct: number | null;
  latitude: number | null;
  longitude: number | null;
  postal: string | null;
  created_at: string;
};
export type Event = {
  id: string;
  visitor: string;
  ref: string | null;
  name: string;
  path: string | null;
  country: string | null;
  data: Record<string, string | number | boolean> | null;
  created_at: string;
};
export type LinkRow = { slug: string; label: string; note: string | null; created_at: string };
export type Message = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  intent: string | null;
  message: string;
  ref: string | null;
  visitor: string | null;
  city: string | null;
  country: string | null;
  device: string | null;
  emailed: boolean;
  mail_error: string | null;
  created_at: string;
};

const TZ = "Europe/Istanbul";
export const when = (d: string) =>
  new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(d),
  );
export const clock = (d: string) =>
  new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(d));
export const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
export const hourKey = (d: Date) =>
  `${dayKey(d)} ${new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(d)}`;

// "3 dk önce" for the live feed; older rows fall back to the date.
export function ago(d: string, now = Date.now()) {
  const s = Math.round((now - +new Date(d)) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return when(d);
}
// The moment this request renders (every /stats page is dynamic).
export const requestTime = () => Date.now();
export const secs = (s: number | null) => (s == null ? "–" : s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60} sn`);
// "1:19 dk" for tiles, where "1 dk 19 sn" would wrap.
export const minutes = (s: number | null) => (s == null ? "–" : s < 60 ? `${s} sn` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} dk`);
export const pct = (n: number, of: number) => (of ? `%${Math.round((n / of) * 100)}` : "–");
export const avg = (ns: number[]) => (ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : null);
export const median = (ns: number[]) => {
  if (!ns.length) return null;
  const s = [...ns].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export const DIRECT = "Direkt / bilinmiyor";
export const host = (r: string | null) => {
  if (!r) return DIRECT;
  try {
    return new URL(r).host.replace(/^www\./, "");
  } catch {
    return r;
  }
};
// Region arrives as a subdivision code (34 for İstanbul), so it stays out of the label.
// "TR" as "Türkiye".
const regions = new Intl.DisplayNames("tr", { type: "region" });
export const countryName = (code: string | null) => {
  if (!code) return "Bilinmiyor";
  try {
    return regions.of(code) ?? code;
  } catch {
    return code;
  }
};
export const place = (v: Pick<Visit, "city" | "country">) => [v.city, v.country].filter(Boolean).join(", ") || "Konum bilinmiyor";
export const deviceOf = (v: Visit) => `${v.device} · ${v.os} · ${v.browser}`;

export const SOURCES: [RegExp, string][] = [
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
export const visitorSource = (vs: Visit[]) => vs.map(sourceOf).find(Boolean) ?? DIRECT;

export function count<T>(rows: T[], key: (r: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
// Like count, but each visitor counts once per key.
export function reach<T extends { visitor: string }>(rows: T[], key: (r: T) => string | null | undefined) {
  const m = new Map<string, Set<string>>();
  for (const r of rows) {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? new Set()).add(r.visitor));
  }
  return [...m.entries()].map(([k, s]) => [k, s.size] as [string, number]).sort((a, b) => b[1] - a[1]);
}

export function groupBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>();
  for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
  return m;
}

// A browser's views (oldest first) split into sessions at 30 quiet minutes.
export function sessionsOf(vs: Visit[]) {
  const out: Visit[][] = [];
  let last = 0;
  for (const v of vs) {
    const t = +new Date(v.created_at);
    if (!out.length || t - last > 30 * 60 * 1000) out.push([]);
    out[out.length - 1].push(v);
    last = t + (v.duration_s ?? 0) * 1000;
  }
  return out;
}

// One personal link opened on several browsers: each browser is a "person". Later ones
// are judged against the earlier: same network reads as the same person on another
// device (or their office); another network, and above all another city, reads as forwarded.
export type Person = { visits: Visit[]; verdict: "first" | "same" | "maybe" | "likely" };

export function people(visits: Visit[]): Person[] {
  const groups = groupBy([...visits].reverse(), (v) => v.visitor);
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
  first: ["İlk açan", "text-lime"],
  same: ["Aynı ağ — muhtemelen aynı kişi başka cihazda ya da aynı ofisten biri", "text-bone-dim"],
  maybe: ["Farklı cihaz ve ağ — iletilmiş olabilir (ya da aynı kişi mobil veriyle)", "text-amber-300"],
  likely: ["Farklı şehir — büyük ihtimalle iletildi", "text-orange-400"],
};

// Cities that are mostly cloud and social-network data centres (Meta in Luleå, Clonee,
// Prineville, Altoona, Forest City, Odense; Google, Microsoft and AWS in the US).
// A browser seen only there and never staying a second is most likely a link
// scanner with a normal user agent. Flagged, not hidden.
const DATACENTERS = new Set([
  "Luleå", "Clonee", "Prineville", "Altoona", "Forest City", "Odense", "Los Lunas", "Papillion", "Fort Worth",
  "Council Bluffs", "The Dalles", "Boardman", "Ashburn", "Dulles Town Center", "Boydton", "Quincy", "Moncks Corner",
  "Pryor", "Lenoir", "Mayes County",
]);

export type Browser = {
  id: string;
  visits: Visit[]; // newest first
  source: string;
  sessions: number;
  total: number;
  sharedNet: number;
  returning: boolean;
  datacenter: boolean;
};

export function browsers(visits: Visit[]): Browser[] {
  const groups = groupBy([...visits].reverse(), (v) => v.visitor);
  const netVisitors = new Map<string, Set<string>>();
  for (const v of visits)
    if (v.network) netVisitors.set(v.network, (netVisitors.get(v.network) ?? new Set()).add(v.visitor));
  return [...groups.entries()]
    .map(([id, vs]) => {
      const nets = new Set(vs.map((v) => v.network).filter(Boolean) as string[]);
      const sharedNet = Math.max(0, ...[...nets].map((n) => (netVisitors.get(n)?.size ?? 1) - 1));
      const sessions = sessionsOf(vs).length;
      return {
        id,
        visits: [...vs].reverse(),
        source: visitorSource(vs),
        sessions,
        total: vs.reduce((s, v) => s + (v.duration_s ?? 0), 0),
        sharedNet,
        // A later session here, or the browser's own count says it was here before.
        returning: sessions > 1 || vs.some((v) => (v.session_n ?? 0) > 1),
        datacenter: vs.every((v) => !!v.city && DATACENTERS.has(v.city) && !v.duration_s),
      };
    })
    .sort((a, b) => +new Date(b.visits[0].created_at) - +new Date(a.visits[0].created_at));
}

// The short name a visitor goes by: who wrote, whose link it was, else a tag of the id.
export function labeler(messages: Message[], links: LinkRow[]) {
  const wrote = new Map(messages.filter((m) => m.visitor).map((m) => [m.visitor!, m.name]));
  const linkLabel = new Map(links.map((l) => [l.slug, l.label]));
  return (visitor: string, ref?: string | null) =>
    wrote.get(visitor) ?? (ref ? (linkLabel.get(ref) ?? ref) : null) ?? `Ziyaretçi ${visitor.slice(0, 4).toUpperCase()}`;
}

// Home page sections in page order (components/track/Tracker.tsx section_view).
export const HOME_SECTIONS: [string, string][] = [
  ["strip", "Film şeridi"],
  ["voyage", "Yolculuk"],
  ["services", "Hizmetler"],
  ["clients", "Müşteriler"],
  ["about", "Hakkımda"],
  ["work", "İşler"],
  ["manifesto", "Manifesto"],
  ["ai-systems", "AI sistemleri"],
  ["contact", "İletişim formu"],
];
const SECTION = new Map(HOME_SECTIONS);
export const isHome = (path: string | null) => path === "/tr" || path === "/en";
const film = (slug: unknown) => stripFilms.find((f) => f.slug === slug)?.title ?? String(slug);

// One line of Turkish for an action.
export function eventText(e: Pick<Event, "name" | "data">) {
  const d = e.data ?? {};
  switch (e.name) {
    case "cta_contact": return "İletişim butonuna tıkladı";
    case "form_start": return "Formu doldurmaya başladı";
    case "form_sent": return "Formu gönderdi";
    case "whatsapp": return "WhatsApp'a geçti";
    case "email": return "E-posta linkine tıkladı";
    case "outbound": return `Dış linke gitti: ${d.host ?? "?"}`;
    case "nav_click": return `${d.text ? `“${d.text}” linkine tıkladı` : "Site içi linke tıkladı"} → ${d.href ?? ""}`;
    case "lang_switch": return "Dili değiştirdi";
    case "case_open": return `Proje sayfasını açtı: ${d.case ?? ""}`;
    case "film_play": return `Filmi oynattı: ${film(d.film)}`;
    case "film_close": return `Filmi kapattı: ${film(d.film)} · ${secs(Number(d.watched) || 0)}`;
    case "lab_touch": return `Lab deneyine dokundu: ${d.lab ?? ""}`;
    case "lab_control": return `Lab ayarını değiştirdi: ${d.lab ?? ""} · ${d.control ?? ""}`;
    case "section_view": return `Bölümü gördü: ${SECTION.get(String(d.section)) ?? d.section}`;
    case "field_focus": return `Form alanına girdi: ${d.field ?? ""}`;
    case "copy": return `Metin kopyaladı · ${d.len ?? "?"} karakter`;
    case "tab_return": return `Sekmeye geri döndü · ${secs(Number(d.away) || 0)} sonra`;
    case "js_error": return `Sayfada hata: ${d.msg ?? ""}`;
    default: return e.name;
  }
}
export const sectionName = (s: string) => SECTION.get(s) ?? s;
export const filmName = film;

// Event names the conversion tallies care about, and how the feed tints them.
export const CONVERSION = new Set(["cta_contact", "form_start", "form_sent", "whatsapp", "email"]);

export const EVENT_NAMES: Record<string, string> = {
  cta_contact: "İletişim butonu",
  form_start: "Form başlatma",
  form_sent: "Form gönderimi",
  whatsapp: "WhatsApp",
  email: "E-posta linki",
  outbound: "Dış link",
  nav_click: "Site içi link",
  lang_switch: "Dil değiştirme",
  case_open: "Proje sayfası",
  film_play: "Film oynatma",
  film_close: "Film kapatma",
  lab_touch: "Lab dokunuşu",
  lab_control: "Lab ayarı",
  section_view: "Bölüm görüntüleme",
  field_focus: "Form alanı",
  copy: "Kopyalama",
  tab_return: "Sekmeye dönüş",
  js_error: "Sayfa hatası",
};

// `bits` is a page view's time and scroll, for views that show the path on its own.
export type Item = { at: string; visitor: string; what: string; path: string | null; tone: "view" | "act" | "goal" | "error"; bits?: string };

// Page views and actions as one stream, newest first. A run of sections seen on the
// same page folds into one line so scrolling doesn't drown the rest.
export function timeline(visits: Visit[], events: Event[]): Item[] {
  const rows: (Item & { sections?: string[] })[] = [];
  const merged = [
    ...visits.map((v) => ({ at: v.created_at, v })),
    ...events.map((e) => ({ at: e.created_at, e })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  for (const r of merged) {
    if ("v" in r) {
      const v = r.v;
      const bits = [v.duration_s != null && secs(v.duration_s), v.scroll_pct != null && `%${v.scroll_pct} kaydırdı`].filter(Boolean);
      const extra = bits.join(" · ");
      rows.push({ at: v.created_at, visitor: v.visitor, path: v.path, tone: "view", what: `sayfayı açtı${extra ? ` · ${extra}` : ""}`, bits: extra });
      continue;
    }
    const e = r.e;
    const prev = rows[rows.length - 1];
    if (e.name === "section_view") {
      const name = sectionName(String(e.data?.section ?? ""));
      if (prev?.sections && prev.visitor === e.visitor && prev.path === e.path) {
        prev.sections.unshift(name);
        prev.what = `bölümleri gördü: ${prev.sections.join(", ")}`;
        continue;
      }
      rows.push({ at: e.created_at, visitor: e.visitor, path: e.path, tone: "act", what: `bölümü gördü: ${name}`, sections: [name] });
      continue;
    }
    const text = eventText(e);
    rows.push({
      at: e.created_at,
      visitor: e.visitor,
      path: e.path,
      tone: CONVERSION.has(e.name) ? "goal" : e.name === "js_error" ? "error" : "act",
      what: text.charAt(0).toLocaleLowerCase("tr") + text.slice(1),
    });
  }
  return rows;
}
