import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

// Redirects `/` to the visitor's locale: cookie first, then Accept-Language, then TR.
export function middleware(request: NextRequest) {
  const cookie = request.cookies.get("locale")?.value;
  const header = request.headers.get("accept-language")?.slice(0, 2);
  const locale =
    (cookie && isLocale(cookie) && cookie) ||
    (header && isLocale(header) && header) ||
    defaultLocale;
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: ["/"],
};
