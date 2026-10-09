"use client";

import { useActionState, useEffect, useState } from "react";
import { createLink, signIn } from "./actions";

const SITE = "https://www.ataberksoylu.com";
export const linkFor = (slug: string) => `${SITE}/?ref=${slug}`;

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#c8ff3e]/60";
const button = "rounded-lg bg-[#c8ff3e] px-4 py-2 text-sm font-medium text-black disabled:opacity-50";

export function SignIn() {
  const [state, action, pending] = useActionState(signIn, { error: null as string | null });
  return (
    <form action={action} className="mx-auto mt-32 flex max-w-xs flex-col gap-3 px-4">
      <h1 className="text-lg font-semibold">Ziyaretçiler</h1>
      <input name="password" type="password" placeholder="Şifre" autoFocus className={input} />
      <button disabled={pending} className={button}>Giriş</button>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

// The owner's own browser never counts as a visitor.
export function NoTrack() {
  useEffect(() => {
    try {
      localStorage.setItem("ab_notrack", "1");
    } catch {}
  }, []);
  return null;
}

export function CopyLink({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(linkFor(slug));
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="rounded-md border border-white/15 px-2 py-1 text-xs hover:border-[#c8ff3e]/60"
    >
      {done ? "Kopyalandı" : "Linki kopyala"}
    </button>
  );
}

export function NewLink() {
  const [state, action, pending] = useActionState(createLink, {
    error: null as string | null,
    slug: undefined as string | undefined,
  });
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input name="label" placeholder="Kime? (ör. Ahmet – X Ajans)" required className={input} />
      <input name="note" placeholder="Not (ör. teklif maili, LinkedIn DM)" className={input} />
      <button disabled={pending} className={button}>Link oluştur</button>
      {state.error && <p className="text-sm text-red-400 sm:col-span-3">{state.error}</p>}
      {state.slug && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#c8ff3e]/30 bg-[#c8ff3e]/5 p-3 text-sm sm:col-span-3">
          <code className="break-all">{linkFor(state.slug)}</code>
          <CopyLink slug={state.slug} />
        </div>
      )}
    </form>
  );
}
