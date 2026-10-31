// The visitor's choice about statistics (KVKK açık rıza, cookie guideline): nothing
// in components/track/Tracker.tsx runs and nothing is stored for it until the
// visitor accepts. The choice itself is the only key kept without consent.
// Withdrawing deletes what was stored for statistics.

import { useSyncExternalStore } from "react";

export type Consent = "granted" | "denied";

const KEY = "ab_consent";
// Keys that exist only for statistics; cleared when consent is refused or withdrawn.
const STATS_KEYS = ["ab_visitor", "ab_ref", "ab_session", "ab_seen"];
export const CONSENT_EVENT = "ab-consent";
export const CONSENT_OPEN_EVENT = "ab-consent-open";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value);
    if (value === "denied") STATS_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

function subscribe(onChange: () => void) {
  addEventListener(CONSENT_EVENT, onChange);
  addEventListener("storage", onChange);
  return () => {
    removeEventListener(CONSENT_EVENT, onChange);
    removeEventListener("storage", onChange);
  };
}

// The current choice, live; null on the server and before any choice.
export function useConsent() {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}

// Opens the banner again (footer "Cookie settings", the privacy page).
export function openConsent() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
