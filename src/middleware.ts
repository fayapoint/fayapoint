import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing, type Locale } from "./i18n/routing";

const nextIntlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const hasLocalePrefix = segments.length > 0 && routing.locales.includes(segments[0] as Locale);

  if (!hasLocalePrefix) {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
    const locale = cookieLocale && routing.locales.includes(cookieLocale) ? cookieLocale : routing.defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = searchParams.toString();
    return NextResponse.redirect(url, 307);
  }

  return nextIntlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
