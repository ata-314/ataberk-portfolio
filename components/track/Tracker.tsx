"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Personal-link tracking. A link like /?ref=ahmet-x1y2 tags this browser as that
// recipient (kept in localStorage, so later visits count too); every page view is
// sent to /api/t, and its time on page and scroll depth when the page is left.
// Signing in to /stats turns tracking off on that browser so the owner's own
// visits never count.
//
// Privacy line: only what any page openly sees (window size, the CSS media
// preferences, the coarse device and connection hints, load timing) and what the
// visitor does on the site. No fingerprinting (no canvas, audio or font probing,
// nothing hashed into an id), no form values or keystrokes (the contact form sends
// its own message), no copied text. The IP never leaves the server, which keeps
// only a salted hash of it (lib/track/network.ts).

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

function send(body: object) {
  const data = JSON.stringify(body);
  if (navigator.sendBeacon?.("/api/t", new Blob([data], { type: "application/json" }))) return;
  fetch("/api/t", { method: "POST", body: data, keepalive: true }).catch(() => {});
}

let firstView = true;
let firstId: string | null = null;
let lcp = 0;
let errors = 0;

type EventData = Record<string, string | number | boolean>;

// Every action goes to the same beacon as { event, visitor, path, data }: conversion
// steps (contact buttons, form start and send, WhatsApp, email) and the rest below.
// Links carry data-track="<name>"; code calls trackEvent directly. `data` is a small
// flat object, e.g. { film: "piyes-levent" }.
export function trackEvent(name: string, data?: EventData) {
  const visitor = read("ab_visitor");
  if (!visitor || read("ab_notrack") || navigator.webdriver) return;
  send({ event: name, visitor, ref: read("ab_ref"), path: window.location.pathname, data });
}

// Campaign tags, or the click id an ad or a social app appends, as one short label.
function campaign(params: URLSearchParams) {
  const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => params.get(k)).filter(Boolean);
  if (utm.length) return utm.join(" / ");
  if (params.has("gclid") || params.has("gbraid") || params.has("wbraid")) return "Google Ads";
  if (params.has("fbclid")) return "Facebook / Instagram";
  if (params.has("li_fat_id")) return "LinkedIn";
  if (params.has("ttclid")) return "TikTok";
  if (params.has("msclkid")) return "Bing Ads";
  return null;
}

// A new session after 30 quiet minutes; its number tells a first visit from a return.
// Browsers tagged before sessions were counted start at their second.
const QUIET = 30 * 60 * 1000;
function sessionNumber(known: boolean) {
  const now = Date.now();
  let n = Number(read("ab_session") ?? (known ? 1 : 0)) || 0;
  if (!n || now - Number(read("ab_seen") ?? 0) > QUIET) write("ab_session", String(++n));
  write("ab_seen", String(now));
  return n;
}

// The browser's own coarse hints, as CSS and standard APIs expose them to any page.
function signals() {
  const nav = navigator as Navigator & { connection?: { effectiveType?: string }; deviceMemory?: number };
  const mq = (q: string) => matchMedia(q).matches;
  return {
    viewport: `${innerWidth}x${innerHeight}`,
    dpr: Math.round(devicePixelRatio * 100) / 100,
    scheme: mq("(prefers-color-scheme: dark)") ? "dark" : "light",
    reducedMotion: mq("(prefers-reduced-motion: reduce)"),
    pointer: mq("(pointer: coarse)") ? "coarse" : mq("(pointer: fine)") ? "fine" : "none",
    connection: nav.connection?.effectiveType,
    memory: nav.deviceMemory,
    cores: navigator.hardwareConcurrency,
  };
}

// Load speed of the document itself (first view only; later views are client-side).
function timing() {
  const n = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!n) return {};
  return {
    ttfb: Math.round(n.responseStart) || undefined,
    dom: Math.round(n.domContentLoadedEventEnd) || undefined,
  };
}

function watchLcp() {
  try {
    new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      if (last) lcp = Math.round(last.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
}

const label = (el: Element) =>
  (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60);

export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (read("ab_notrack") || navigator.webdriver) return;

    const url = new URL(window.location.href);
    const fromLink = url.searchParams.get("ref")?.toLowerCase();
    if (fromLink && /^[a-z0-9-]{1,64}$/.test(fromLink)) {
      write("ab_ref", fromLink);
      url.searchParams.delete("ref");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }

    let visitor = read("ab_visitor");
    const known = !!visitor;
    if (!visitor) {
      visitor = crypto.randomUUID();
      write("ab_visitor", visitor);
    }

    let referrer: string | null = null;
    const first = firstView;
    const utm = first ? campaign(url.searchParams) : null;
    if (first && document.referrer) {
      try {
        if (new URL(document.referrer).host !== window.location.host) referrer = document.referrer;
      } catch {}
    }
    firstView = false;

    const id = crypto.randomUUID();
    if (first) {
      firstId = id;
      watchLcp();
    }
    send({
      id,
      visitor,
      ref: read("ab_ref"),
      path: pathname,
      referrer,
      utm,
      lang: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      session: sessionNumber(known),
      ...signals(),
      ...(first ? timing() : {}),
    });

    const work = pathname.match(/^\/(?:tr|en)\/work\/([^/]+)/);
    if (work) trackEvent("case_open", { case: work[1] });

    // How far down the page got, in quarters (0, 25, 50, 75, 100).
    let depth = 0;
    const measure = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max <= 0 ? 100 : Math.min(100, ((scrollY + 1) / max) * 100);
      depth = Math.max(depth, Math.floor(pct / 25) * 25);
    };
    const settle = requestAnimationFrame(measure);
    addEventListener("scroll", measure, { passive: true });

    // Sections that crossed the middle of the screen: ids on the home page
    // (services, about, work, ai-systems, contact…) and anything with data-section.
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const name = el.dataset.section || el.id;
          if (!e.isIntersecting || seen.has(name)) continue;
          seen.add(name);
          trackEvent("section_view", { section: name });
        }
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    const watch = setTimeout(() => {
      document.querySelectorAll("main section[id], [data-section]").forEach((el) => io.observe(el));
    }, 300);

    // Time on page counts only while visible. Reported on every hide and on leaving;
    // the last report wins, so a tab closed later still counts.
    let visible = 0;
    let since = document.visibilityState === "visible" ? Date.now() : 0;
    let hiddenAt = 0;
    const report = () => {
      if (since) visible += Date.now() - since;
      since = 0;
      write("ab_seen", String(Date.now()));
      if (visible > 0) send({ id, duration: visible / 1000, scroll: depth, lcp: id === firstId && lcp ? lcp : undefined });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        report();
        return;
      }
      since = Date.now();
      const away = hiddenAt ? Math.round((since - hiddenAt) / 1000) : 0;
      if (away >= 10) trackEvent("tab_return", { away });
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", report);
    return () => {
      cancelAnimationFrame(settle);
      clearTimeout(watch);
      io.disconnect();
      removeEventListener("scroll", measure);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      report();
    };
  }, [pathname]);

  useEffect(() => {
    // Named clicks (data-track), links out to other sites, and the in-site links
    // that took the visitor somewhere.
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-track]");
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      const name = el?.getAttribute("data-track");
      if (name) trackEvent(name, a ? { href: a.href.slice(0, 300) } : undefined);
      if (!a || !/^https?:$/.test(a.protocol)) return;
      if (a.host !== window.location.host) trackEvent("outbound", { host: a.host.replace(/^www\./, ""), href: a.href.slice(0, 300) });
      else if (!name) trackEvent("nav_click", { href: (a.pathname + a.hash).slice(0, 300), text: label(a) });
    };
    // Which form field was entered, once per field and page; never what was typed.
    const focused = new Set<string>();
    const onFocus = (e: FocusEvent) => {
      const f = e.target as HTMLInputElement | null;
      if (!f?.form || !/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) return;
      if (["hidden", "password"].includes(f.type) || f.name === "website") return;
      const field = (f.name || f.id || f.type).slice(0, 40);
      const key = `${window.location.pathname}:${field}`;
      if (focused.has(key)) return;
      focused.add(key);
      trackEvent("field_focus", { field });
    };
    // That something was copied, and how much; never the text.
    const onCopy = () => {
      const len = String(window.getSelection() ?? "").length;
      if (len) trackEvent("copy", { len });
    };
    // Script errors, message only and capped, to see what broke for whom.
    const onError = (message: unknown) => {
      if (errors++ >= 5) return;
      trackEvent("js_error", { msg: String(message).slice(0, 160) });
    };
    const onWindowError = (e: ErrorEvent) => onError(e.message);
    const onRejection = (e: PromiseRejectionEvent) => onError((e.reason as Error)?.message ?? e.reason);
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("copy", onCopy);
    addEventListener("error", onWindowError);
    addEventListener("unhandledrejection", onRejection);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("copy", onCopy);
      removeEventListener("error", onWindowError);
      removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
