"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Personal-link tracking. A link like /?ref=ahmet-x1y2 tags this browser as that
// recipient (kept in localStorage, so later visits count too); every page view is
// sent to /api/t, and its time on page when the page is left. Signing in to /stats
// turns tracking off on that browser so the owner's own visits never count.

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
    if (!visitor) {
      visitor = crypto.randomUUID();
      write("ab_visitor", visitor);
    }

    let referrer: string | null = null;
    if (firstView && document.referrer) {
      try {
        if (new URL(document.referrer).host !== window.location.host) referrer = document.referrer;
      } catch {}
    }
    firstView = false;

    const id = crypto.randomUUID();
    send({ id, visitor, ref: read("ab_ref"), path: pathname, referrer });

    // Time on page counts only while visible. Reported on every hide and on leaving;
    // the last report wins, so a tab closed later still counts.
    let visible = 0;
    let since = document.visibilityState === "visible" ? Date.now() : 0;
    const report = () => {
      if (since) visible += Date.now() - since;
      since = 0;
      if (visible > 0) send({ id, duration: visible / 1000 });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") report();
      else since = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", report);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      report();
    };
  }, [pathname]);

  return null;
}
