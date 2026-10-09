"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isSignedIn, passwordMatches, sessionToken, SESSION_COOKIE } from "@/lib/track/auth";
import { sql } from "@/lib/track/db";
import { RESERVED } from "@/lib/track/reserved";

export async function signIn(_: unknown, form: FormData) {
  const password = String(form.get("password") ?? "");
  const token = sessionToken();
  if (!token || !passwordMatches(password)) return { error: "Şifre yanlış." };
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/stats",
    maxAge: 60 * 60 * 24 * 90,
  });
  revalidatePath("/stats");
  return { error: null };
}

export async function signOut() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/stats" });
  revalidatePath("/stats");
}

const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

// Personal links read as ataberksoylu.com/<name>; a taken name gets a number (birkan2).
export async function createLink(
  _: unknown,
  form: FormData,
): Promise<{ error: string | null; slug?: string }> {
  if (!(await isSignedIn())) return { error: "Oturum kapalı." };
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const note = String(form.get("note") ?? "").trim().slice(0, 200) || null;
  if (!label) return { error: "İsim gerekli." };
  const base = slugify(label) || "link";
  const taken = new Set(
    ((await sql()`select slug from links where slug like ${base + "%"}`) as { slug: string }[]).map((r) => r.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug) || RESERVED.has(slug); n++) slug = `${base}${n}`;
  await sql()`insert into links (slug, label, note) values (${slug}, ${label}, ${note})`;
  revalidatePath("/stats");
  return { error: null, slug };
}

export async function deleteLink(form: FormData) {
  if (!(await isSignedIn())) return;
  const slug = String(form.get("slug") ?? "");
  await sql()`delete from links where slug = ${slug}`;
  revalidatePath("/stats");
}
