"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { contactBase, contactPage, contactPath } from "@/content/contact";
import "./contact-fab.css";

// The bird in the corner: once the opening screen is behind, the site's mark lands
// bottom right as the way to the contact page. It says what it is the first time it
// lands, then folds to the bird (the label opens again under the pointer). It steps
// aside wherever a contact form is already on screen, and on the contact page.
export function ContactFab({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const onContactPage = pathname.split("/")[2] === contactBase[locale];
  const [past, setPast] = useState(false);
  // Which page's form is on screen, so a new page starts clear without a reset.
  const [formOn, setFormOn] = useState<string | null>(null);
  const formInView = formOn === pathname;
  const [peek, setPeek] = useState(false);
  const shown = past && !formInView && !onContactPage;

  useEffect(() => {
    // The home hero carries its own button, so the bird waits until it has scrolled away.
    const threshold = () => (pathname === `/${locale}` ? window.innerHeight * 0.9 : 320);
    const update = () => setPast(window.scrollY > threshold());
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname, locale]);

  useEffect(() => {
    const form = document.getElementById("contact");
    if (!form) return;
    const io = new IntersectionObserver(([entry]) => setFormOn(entry.isIntersecting ? pathname : null), {
      rootMargin: "0px 0px -15% 0px",
    });
    io.observe(form);
    return () => io.disconnect();
  }, [pathname]);

  // The first landing of a visit introduces itself, then tucks the words away.
  useEffect(() => {
    if (!shown) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("ab_fab") === "1";
      sessionStorage.setItem("ab_fab", "1");
    } catch {}
    if (seen) return;
    // Opens once the landing has settled.
    const open = window.setTimeout(() => setPeek(true), 500);
    const close = window.setTimeout(() => setPeek(false), 3700);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(close);
      setPeek(false);
    };
  }, [shown]);

  return (
    <Link
      href={contactPath(locale)}
      data-track="cta_contact"
      data-shown={shown || undefined}
      data-peek={peek || undefined}
      aria-hidden={!shown || undefined}
      tabIndex={shown ? undefined : -1}
      className="fab"
    >
      <span className="fab-label">
        {contactPage[locale].cta} <span aria-hidden>↗</span>
      </span>
      <span className="fab-mark" aria-hidden>
        <span className="fab-bird" />
      </span>
    </Link>
  );
}
