import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { sql } from "@/lib/track/db";
import { RESERVED } from "@/lib/track/reserved";

// The visitor's locale: cookie first, then Accept-Language, then TR.
function localeOf(request: NextRequest) {
  const cookie = request.cookies.get("locale")?.value;
  const header = request.headers.get("accept-language")?.slice(0, 2);
  return (cookie && isLocale(cookie) && cookie) || (header && isLocale(header) && header) || defaultLocale;
}

// `/` goes to the visitor's locale. A personal link `/birkan` (a row in `links`)
// goes there too, tagged ?ref=birkan for components/track/Tracker.tsx.
export async function proxy(request: NextRequest) {
  const url = new URL(`/${localeOf(request)}`, request.url);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/") {
    url.search = search; // keeps ?ref= from older links
    return NextResponse.redirect(url);
  }

  const slug = pathname.slice(1).toLowerCase();
  if (RESERVED.has(slug) || !/^[a-z0-9-]{1,64}$/.test(slug)) return NextResponse.next();
  const found = (await sql()`select 1 from links where slug = ${slug}`.catch(() => [])) as unknown[];
  if (found.length === 0) return NextResponse.next();
  url.searchParams.set("ref", slug);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/:slug"],
};
