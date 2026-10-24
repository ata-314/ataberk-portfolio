import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

// Opening of every inner page in the home page's matter: the trail, a large
// gradient title, the lead, actions, and a live visual beside it (the bust, a
// service scene, falling code). Text stays server-rendered for search engines.
export function PageHero({
  crumbs,
  title,
  lead,
  meta,
  actions,
  visual,
  visualFirst,
  compact,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
  // Phones show the visual above the words (the About page's bust is the hook).
  visualFirst?: boolean;
  compact?: boolean;
}) {
  return (
    <header className={`sub-hero ${visual ? "sub-hero-split" : ""} ${compact ? "sub-hero-compact" : ""} ${visualFirst ? "sub-hero-visual-first" : ""}`}>
      <div className="sub-hero-copy">
        <nav aria-label="Breadcrumb" className="sub-crumbs">
          {crumbs.map((c, i) => (
            <span key={c.label}>
              {i > 0 && <span aria-hidden> / </span>}
              {c.href ? (
                <Link href={c.href} className="link-draw hover:text-bone">{c.label}</Link>
              ) : (
                <span aria-current="page" className="text-bone">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="sub-title font-display">{title}</h1>
        {meta && <p className="sub-meta">{meta}</p>}
        {lead && <p className="sub-lead">{lead}</p>}
        {actions && <div className="sub-actions">{actions}</div>}
      </div>
      {visual && <div className="sub-hero-visual" aria-hidden>{visual}</div>}
    </header>
  );
}

// A section with its heading held in a left column on wide screens.
export function SubSection({ heading, children, id }: { heading: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="sub-section" data-reveal-group>
      <h2 className="sub-h2">{heading}</h2>
      <div className="sub-section-body">{children}</div>
    </section>
  );
}

// Questions as an accordion: every answer stays in the page for search engines.
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="sub-faq">
      {items.map((f, i) => (
        <details key={f.q} open={i === 0}>
          <summary>
            <span>{f.q}</span>
            <span aria-hidden className="sub-faq-mark" />
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
