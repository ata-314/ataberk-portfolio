"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n";
import { privacy, privacyPath } from "@/content/privacy";
import { CONSENT_OPEN_EVENT, openConsent, setConsent, useConsent, type Consent } from "@/lib/track/consent";

// Asks once for statistics consent, bottom left, until the visitor chooses. Accept
// and reject sit side by side in the same style (the KVKK cookie guideline wants
// refusing to be as easy as accepting). Opens again from the footer and the
// privacy page. The owner's browser (signed in to /stats) is never asked.
const noSubscribe = () => () => {};
function isOwner() {
  try {
    return !!localStorage.getItem("ab_notrack");
  } catch {
    return false;
  }
}

export function ConsentBanner({ locale }: { locale: Locale }) {
  const t = privacy[locale].banner;
  const consent = useConsent();
  // Hidden on the server; the browser decides once it hydrates.
  const owner = useSyncExternalStore(noSubscribe, isOwner, () => true);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!reopened && (owner || consent)) return null;
  const choose = (value: Consent) => {
    setConsent(value);
    setReopened(false);
  };
  const button =
    "flex-1 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-bone transition-colors hover:border-lime hover:text-lime";

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      className="fixed inset-x-4 bottom-4 z-[60] rounded-2xl border border-white/10 bg-ink/90 p-5 text-sm text-bone-dim shadow-2xl backdrop-blur-xl sm:right-auto sm:max-w-[26rem] md:left-6 md:bottom-6"
    >
      <p id="consent-title" className="font-display text-base font-semibold text-bone">{t.title}</p>
      <p className="mt-2 leading-relaxed">
        {t.body}{" "}
        <Link href={privacyPath(locale)} className="link-draw text-bone">{t.more}</Link>
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => choose("denied")} className={button}>{t.reject}</button>
        <button type="button" onClick={() => choose("granted")} className={button}>{t.accept}</button>
      </div>
    </div>
  );
}

// A link-styled button that opens the banner again.
export function ConsentSettings({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={openConsent} className={className}>
      {label}
    </button>
  );
}
