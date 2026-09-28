import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import "./service-art.css";

// Animated product-UI vignettes for the services bento. Pure HTML/CSS so the
// inner panels can be real frosted glass; every size is in em and the root
// font-size is derived from the card (container query), so each scene scales
// as one drawing. Styles live in services.css under the `sa-` prefix.

const copy = {
  tr: {
    url: "ataberk.studio", hero: "Fikirden ürüne.", cta: "Başla", perf: "Performans", live: "Yayında", prod: "Production",
    week: "Bu hafta", revenue: "Gelir", order: "Yeni sipariş", now: "şimdi", orderSub: "#2481 · ₺1.240", users: "Aktif kullanıcı",
    trigger: "Form gönderildi", ai: "AI özetle", slack: "Slack", crm: "CRM", run: "Çalıştı · 1.2s",
    task: "Haftalık raporu hazırla", done: "Rapor hazır · 3 öneri", thinking: "Düşünüyor",
    prompt: "Sinematik, altın saat, yavaş kamera hareketi", generate: "Üret", render: "Render",
    palette: "Renk paleti", type: "Tipografi", dark: "Koyu tema", brand: "Marka sistemi",
  },
  en: {
    url: "ataberk.studio", hero: "Idea to product.", cta: "Start", perf: "Performance", live: "Live", prod: "Production",
    week: "This week", revenue: "Revenue", order: "New order", now: "now", orderSub: "#2481 · $124.00", users: "Active users",
    trigger: "Form submitted", ai: "AI summarize", slack: "Slack", crm: "CRM", run: "Ran · 1.2s",
    task: "Prepare the weekly report", done: "Report ready · 3 insights", thinking: "Thinking",
    prompt: "Cinematic, golden hour, slow dolly", generate: "Generate", render: "Render",
    palette: "Color palette", type: "Typography", dark: "Dark mode", brand: "Brand system",
  },
};
type T = (typeof copy)["tr"];

const Icon = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`sa-icon ${className ?? ""}`}><path d={d} /></svg>
);
const I = {
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  hash: "M5 9h14M4 15h14M10 4 8 20M16 4l-2 16",
  db: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  check: "M5 12.5 10 17 19 7",
  bag: "M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0",
  play: "M8 5v14l11-7z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  cal: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  chart: "M4 19h16M7 15l4-4 3 3 5-6",
};

function Scene({ w, className, children }: { w: number; className: string; children: ReactNode }) {
  return <div className={`sa ${className}`} style={{ "--sa-w": w } as CSSProperties} aria-hidden="true">{children}</div>;
}
const Cursor = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={`sa-cursor ${className}`}><path d="M5 3l14 8-6 1.5L10 19z" /></svg>
);

function Web({ t }: { t: T }) {
  return (
    <Scene w={40} className="sa-web">
      <div className="sa-glass sa-browser">
        <div className="sa-chrome"><i /><i /><i /><span className="sa-url"><Icon d={I.lock} />{t.url}</span></div>
        <div className="sa-page">
          <div className="sa-nav"><b /><span /><span /><span /></div>
          <p className="sa-headline">{t.hero}</p>
          <span className="sa-line" style={{ width: "70%" }} /><span className="sa-line" style={{ width: "48%" }} />
          <span className="sa-btn">{t.cta}</span>
          <div className="sa-tiles"><i /><i /><i /></div>
        </div>
      </div>
      <div className="sa-glass sa-score">
        <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" className="sa-track" /><circle cx="20" cy="20" r="16" className="sa-ring" pathLength="100" /></svg>
        <b>100</b><small>{t.perf}</small>
      </div>
      <div className="sa-glass sa-toast"><span className="sa-live" />{t.live}<em>{t.prod}</em></div>
      <Cursor className="sa-cursor-web" />
    </Scene>
  );
}

function Mobile({ t }: { t: T }) {
  return (
    <Scene w={34} className="sa-mobile">
      <div className="sa-glass sa-phone">
        <div className="sa-notch" />
        <small className="sa-muted">{t.week}</small>
        <p className="sa-big">₺48.2K <em>+24%</em></p>
        <svg viewBox="0 0 120 50" className="sa-chart" preserveAspectRatio="none">
          <defs><linearGradient id="sa-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity=".55" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
          <path d="M0 42 C15 40 20 30 35 32 S55 18 70 22 S95 6 120 8 V50 H0Z" fill="url(#sa-area)" className="sa-area" />
          <path d="M0 42 C15 40 20 30 35 32 S55 18 70 22 S95 6 120 8" className="sa-stroke" pathLength="100" />
        </svg>
        {[0, 1].map(i => <div key={i} className="sa-row"><span className={`sa-avatar sa-av${i}`} /><span className="sa-line" style={{ width: i ? "45%" : "60%" }} /></div>)}
        <div className="sa-tabbar"><i /><i className="on" /><i /><i /></div>
      </div>
      <div className="sa-glass sa-notif">
        <span className="sa-appicon"><Icon d={I.bag} /></span>
        <div><b>{t.order}</b><small>{t.orderSub}</small></div><em>{t.now}</em>
      </div>
      <div className="sa-glass sa-kpi"><small>{t.users}</small><b>12,840</b><span className="sa-bars"><i /><i /><i /><i /><i /></span></div>
    </Scene>
  );
}

function Flow({ t }: { t: T }) {
  return (
    <Scene w={24} className="sa-flow">
      <svg viewBox="0 0 240 220" className="sa-wires"><path d="M120 37V125C120 145 70 140 70 158M120 125C120 145 170 140 170 158" pathLength="100" className="sa-wire" /><path d="M120 37V125C120 145 70 140 70 158" pathLength="100" className="sa-wire-pulse" /><path d="M120 37V125C120 145 170 140 170 158" pathLength="100" className="sa-wire-pulse b" /></svg>
      <div className="sa-glass sa-step s1"><Icon d={I.bolt} /><span>{t.trigger}</span></div>
      <div className="sa-glass sa-step s2 sa-active"><Icon d={I.spark} /><span>{t.ai}</span><em className="sa-badge">3</em></div>
      <div className="sa-glass sa-chip c1"><Icon d={I.hash} />{t.slack}</div>
      <div className="sa-glass sa-chip c2"><Icon d={I.db} />{t.crm}</div>
      <small className="sa-run"><Icon d={I.check} />{t.run}</small>
    </Scene>
  );
}

function Agent({ t }: { t: T }) {
  return (
    <Scene w={24} className="sa-agent">
      <span className="sa-wave" /><span className="sa-wave w2" /><span className="sa-wave w3" />
      <div className="sa-orbit">{[I.mail, I.cal, I.chart].map((d, i) => <span key={i} className={`sa-glass sa-tool t${i}`}><Icon d={d} /></span>)}</div>
      <div className="sa-core"><span className="sa-core-ring" /><Icon d={I.spark} /></div>
      <div className="sa-glass sa-chat">
        <p className="sa-q">{t.task}</p>
        <p className="sa-a"><span className="sa-typing"><i /><i /><i /></span><span className="sa-done"><Icon d={I.check} />{t.done}</span></p>
      </div>
    </Scene>
  );
}

function Film({ t }: { t: T }) {
  return (
    <Scene w={40} className="sa-film">
      <div className="sa-glass sa-screen">
        <div className="sa-sky" /><div className="sa-sun" /><div className="sa-hills" /><div className="sa-hills near" />
        <span className="sa-glass sa-play"><Icon d={I.play} /></span>
        <span className="sa-tag">4K · 24fps</span>
      </div>
      <div className="sa-glass sa-prompt">
        <p>{t.prompt}<span className="sa-caret" /></p>
        <span className="sa-gen"><Icon d={I.spark} />{t.generate}</span>
      </div>
      <div className="sa-glass sa-render"><small>{t.render}</small><span className="sa-progress"><i /></span></div>
      <div className="sa-glass sa-timeline">
        <div className="sa-track-row"><i /><i /><i /><i /></div>
        <div className="sa-track-row audio"><i /><i /></div>
        <span className="sa-head" />
      </div>
    </Scene>
  );
}

function Brand({ t }: { t: T }) {
  return (
    <Scene w={34} className="sa-brand">
      <div className="sa-glass sa-logo"><span className="sa-mark">A</span><small>{t.brand}</small></div>
      <div className="sa-glass sa-palette"><small>{t.palette}</small><div>{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</div></div>
      <div className="sa-glass sa-type"><b>Aa</b><div><small>{t.type}</small><span>Archivo</span></div></div>
      <div className="sa-glass sa-toggle"><small>{t.dark}</small><span className="sa-switch"><i /></span></div>
      <Cursor className="sa-cursor-brand" />
    </Scene>
  );
}

const scenes = [Web, Mobile, Flow, Agent, Film, Brand];

export function ServiceArt({ kind, locale }: { kind: number; locale: Locale }) {
  const Art = scenes[kind];
  return <Art t={copy[locale]} />;
}
