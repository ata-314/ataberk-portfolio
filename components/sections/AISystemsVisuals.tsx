import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import "./ai-systems-visuals.css";

// The four AI Systems stages, drawn as real interface fragments rather
// than abstract chips: a brand memory card, a relay where one brief turns
// into a delivered post, an agent run that assembles a live site, and a
// design review with numbered marks. Each plays its story once in about
// five seconds and holds the end state; with reduced motion the end state
// is all there is (every keyframe animates *from* something).

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

export const visualCopy = {
  tr: {
    brain: {
      title: "Brand Brain", sub: "Marka hafıza kartı", learned: "+1 desen",
      rows: ["Ses", "Palet", "Yasaklı", "Desenler"],
      voice: "Net, sıcak, asla bağırmayan.",
      banned: ["çığır açan", "devrim niteliğinde"],
      patterns: ["3 sn'de kanca", "Önce kanıt, sonra iddia", "Gönderi başına tek fikir"],
    },
    team: {
      roles: [["S", "Stratejist", "açı ve brief"], ["AD", "Art direktör", "görsel yön"], ["Ü", "Üretim", "görsel ve metin"], ["QA", "QA", "marka denetimi"]],
      out: "Final teslim paketi", files: "brief.md · görseller · metinler",
    },
    web: {
      repo: "web-development-agent", branch: "main",
      steps: ["brief alındı", "marka okunuyor", "tasarım sistemi", "build", "lint · typecheck", "deploy → canlı"],
      url: "ataberksoylu.com", live: "Canlı",
      scores: [["Performans", 96], ["Erişilebilirlik", 100], ["En iyi pratik", 100], ["SEO", 100]] as [string, number][],
    },
    qc: {
      title: "Yayın öncesi denetim", headline: "Hızlı hareket eden markalar için.",
      caption: ["Bir sonraki kampanyanı brieflemenin ", "çığır açan", "daha net", " yolu."],
      checks: ["Marka sesi", "Palet ve görsel dil", "Yasaklı ifade", "Hafızadaki desenler"],
      fixed: "düzeltildi", ready: "Onaya hazır",
    },
  },
  en: {
    brain: {
      title: "Brand Brain", sub: "Brand memory card", learned: "+1 pattern",
      rows: ["Voice", "Palette", "Banned", "Patterns"],
      voice: "Clear, warm, never loud.",
      banned: ["game-changing", "revolutionary"],
      patterns: ["Hook in 3 s", "Proof before claim", "One idea per post"],
    },
    team: {
      roles: [["S", "Strategist", "angle & brief"], ["AD", "Art director", "visual direction"], ["P", "Production", "assets & copy"], ["QA", "QA", "brand check"]],
      out: "Final delivery package", files: "brief.md · visuals · captions",
    },
    web: {
      repo: "web-development-agent", branch: "main",
      steps: ["brief received", "reading the brand", "design system", "build", "lint · typecheck", "deploy → live"],
      url: "ataberksoylu.com", live: "Live",
      scores: [["Performance", 96], ["Accessibility", 100], ["Best practices", 100], ["SEO", 100]] as [string, number][],
    },
    qc: {
      title: "Pre-publish review", headline: "Built for brands that move fast.",
      caption: ["A ", "game-changing", "sharper", " way to brief your next campaign."],
      checks: ["Brand voice", "Palette and visual language", "Banned phrase", "Patterns from memory"],
      fixed: "rewritten", ready: "Ready for approval",
    },
  },
} satisfies Record<Locale, unknown>;
type Copy = (typeof visualCopy)["en"];

const PALETTE = ["#C8FF3E", "#8AE6FF", "#F3EFE7", "#1D2A22", "#0A0A0B"];

function Brain({ c }: { c: Copy }) {
  const b = c.brain;
  return (
    <div className="v-brain">
      <div className="v-stack"><i /><i /></div>
      <article className="v-card v-panel">
        <header>
          <span className="v-mark">B</span>
          <div><b>{b.title}</b><small>{b.sub}</small></div>
          <span className="v-learn">{b.learned}</span>
        </header>
        <dl>
          <div style={v({ "--i": 0 })}><dt>{b.rows[0]}</dt><dd className="v-voice">“{b.voice}”</dd></div>
          <div style={v({ "--i": 1 })}><dt>{b.rows[1]}</dt><dd className="v-swatches">
            {PALETTE.map((hex) => <span key={hex}><i style={v({ "--c": hex })} /><small>{hex}</small></span>)}
          </dd></div>
          <div style={v({ "--i": 2 })}><dt>{b.rows[2]}</dt><dd className="v-banned">{b.banned.map((w) => <s key={w}>{w}</s>)}</dd></div>
          <div style={v({ "--i": 3 })}><dt>{b.rows[3]}</dt><dd className="v-patterns">
            {b.patterns.map((p, i) => <span key={p} className={i === b.patterns.length - 1 ? "new" : undefined}>{p}</span>)}
          </dd></div>
        </dl>
      </article>
    </div>
  );
}

function Team({ c }: { c: Copy }) {
  return (
    <div className="v-team">
      <div className="v-relay">
        <span className="v-rail"><i /></span>
        <ol>
          {c.team.roles.map(([mono, role, out], i) => (
            <li key={role} style={v({ "--i": i })}>
              <span className="v-av">{mono}</span>
              <div className={`v-art v-panel v-art-${i}`}>
                {i === 0 && <><em /><i /><i className="hl" /><i /><i className="short" /></>}
                {i === 1 && <><i /><i /><i /><i /></>}
                {i >= 2 && <span className="v-mini"><em /><i /><i className="short" /></span>}
                {i === 3 && <span className="v-stamp" />}
              </div>
              <b>{role}</b>
              <small>{out}</small>
            </li>
          ))}
        </ol>
      </div>
      <div className="v-package v-panel">
        <span className="v-files"><i /><i /><i /></span>
        <span><b>{c.team.out}</b><small>{c.team.files}</small></span>
      </div>
    </div>
  );
}

function Web({ c }: { c: Copy }) {
  const w = c.web;
  return (
    <div className="v-web">
      <div className="v-log v-panel">
        <div className="v-head"><span>{w.repo}</span><span>{w.branch}</span></div>
        <ul>
          {w.steps.map((s, i) => (
            <li key={s} style={v({ "--i": i })}><time>00:{String(i * 7 + 2).padStart(2, "0")}</time>{s}<i /></li>
          ))}
        </ul>
      </div>
      <div className="v-site">
        <div className="v-browser v-panel">
          <div className="v-bar"><span className="v-url"><small>https://</small>{w.url}</span><span className="v-live">{w.live}</span></div>
          <div className="v-page">
            <div className="v-nav"><i /><span><i /><i /><i /></span></div>
            <div className="v-hero"><i /><i className="short" /></div>
            <div className="v-cards"><i /><i /><i /></div>
          </div>
        </div>
        <div className="v-scores">
          {w.scores.map(([label, score], i) => (
            <figure key={label} style={v({ "--i": i, "--v": score })}>
              <svg viewBox="0 0 36 36"><circle r="15.5" cx="18" cy="18" pathLength={100} /><circle className="val" r="15.5" cx="18" cy="18" pathLength={100} /></svg>
              <b>{score}</b><figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

function Review({ c }: { c: Copy }) {
  const q = c.qc;
  return (
    <div className="v-qc">
      <figure className="v-post v-panel">
        <div className="v-shot">
          <span className="v-logo" />
          <span className="v-strip"><i /><i /><i /></span>
          <p>{q.headline}</p>
          {[1, 2, 4].map((n) => <span key={n} className={`v-pin v-pin-${n}`} style={v({ "--i": n - 1 })}>{n}</span>)}
        </div>
        <figcaption>
          {q.caption[0]}<span className="v-pin v-pin-3" style={v({ "--i": 2 })}>3</span><s>{q.caption[1]}</s> <ins>{q.caption[2]}</ins>{q.caption[3]}
        </figcaption>
      </figure>
      <div className="v-checks v-panel">
        <small>{q.title}</small>
        <ol>
          {q.checks.map((k, i) => (
            <li key={k} style={v({ "--i": i })} className={i === 2 ? "issue" : undefined}>
              <span className="v-num">{i + 1}</span>
              <span>{k}{i === 2 && <em>{q.caption[1]} → {q.caption[2]} · {q.fixed}</em>}</span>
              <i className="v-tick" />
            </li>
          ))}
        </ol>
        <span className="v-ready">{q.ready}</span>
      </div>
    </div>
  );
}

export const stages = [Brain, Team, Web, Review];
