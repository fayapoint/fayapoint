import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getClientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { 
  isBadBot, 
  isHoneypotPath, 
  calculateSuspicionScore,
  getRateLimitTier,
  generateRequestFingerprint 
} from "@/lib/bot-detection";
import { routing, type Locale } from "./i18n/routing";

const nextIntlMiddleware = createMiddleware(routing);

// ============================================================================
// GEO-IP: Country to locale mapping
// ============================================================================
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  BR: "pt-BR",
  PT: "pt-BR",
  AO: "pt-BR",
  MZ: "pt-BR",
  CV: "pt-BR",
  GW: "pt-BR",
  ST: "pt-BR",
  TL: "pt-BR",
};

function getLocaleFromCountry(countryCode: string | null): Locale {
  if (!countryCode) return "en";
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] || "en";
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function addSecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

// ============================================================================
// MAIN MIDDLEWARE - COMPREHENSIVE BOT PROTECTION
// ============================================================================
export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const ip = getClientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer");
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  const isRSC = searchParams.has("_rsc");
  
  // -------------------------------------------------------------------------
  // 1. IMMEDIATE BLOCKS - Zero tolerance
  // -------------------------------------------------------------------------
  
  // Block honeypot paths (WordPress, PHP, etc.)
  if (isHoneypotPath(pathname)) {
    // Log for monitoring
    console.warn(`[HONEYPOT] IP: ${ip}, Path: ${pathname}, UA: ${userAgent.slice(0, 50)}`);
    
    // Block this IP for 24 hours
    await rateLimit({
      key: `blocked:ip:${ip}`,
      limit: 1,
      windowSeconds: 86400, // 24 hours
    });
    
    return new NextResponse("Gone", { status: 410 });
  }
  
  // Block known bad bots immediately
  if (isBadBot(userAgent)) {
    console.warn(`[BAD_BOT] IP: ${ip}, UA: ${userAgent.slice(0, 100)}`);
    return new NextResponse("Forbidden", { status: 403 });
  }
  
  // -------------------------------------------------------------------------
  // 2. CHECK IF IP IS BLOCKED (from previous bad behavior)
  // -------------------------------------------------------------------------
  const blockCheck = await rateLimit({
    key: `blocked:ip:${ip}`,
    limit: 1,
    windowSeconds: 86400,
  });
  
  // If they've been blocked before and hit the limit, continue blocking
  if (!blockCheck.allowed && blockCheck.remaining === 0) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  
  // -------------------------------------------------------------------------
  // 3. CALCULATE SUSPICION SCORE & GET RATE LIMIT
  // -------------------------------------------------------------------------
  
  // Get request count for this IP in current window
  const requestCountResult = await rateLimit({
    key: `requests:count:${ip}`,
    limit: 1000, // High limit just to count
    windowSeconds: 60,
  });
  const requestCount = 1000 - requestCountResult.remaining;
  
  const suspicionScore = calculateSuspicionScore({
    userAgent,
    pathname,
    hasReferer: !!referer,
    acceptLanguage,
    acceptEncoding,
    isRSC,
    requestCount,
  });
  
  // Log highly suspicious requests
  if (suspicionScore >= 50) {
    const fingerprint = generateRequestFingerprint({ ip, userAgent, acceptLanguage });
    console.warn(`[SUSPICIOUS] Score: ${suspicionScore}, IP: ${ip}, FP: ${fingerprint}, Path: ${pathname}`);
  }
  
  // Very suspicious = block
  if (suspicionScore >= 80) {
    // Block this IP
    await rateLimit({
      key: `blocked:ip:${ip}`,
      limit: 1,
      windowSeconds: 3600, // 1 hour
    });
    return new NextResponse("Forbidden", { status: 403 });
  }
  
  // -------------------------------------------------------------------------
  // 4. GLOBAL RATE LIMITING
  // -------------------------------------------------------------------------
  
  const hasAuthToken = request.cookies.has("fayapoint_token");
  const rateLimitTier = getRateLimitTier({
    suspicionScore,
    pathname,
    isAuthenticated: hasAuthToken,
  });
  
  const rl = await rateLimit({
    key: `ratelimit:global:${ip}`,
    limit: rateLimitTier.requests,
    windowSeconds: rateLimitTier.windowSeconds,
  });
  
  if (!rl.allowed) {
    console.warn(`[RATE_LIMITED] IP: ${ip}, Limit: ${rateLimitTier.requests}/min, Path: ${pathname}`);
    
    // If they keep hitting rate limits, block them
    const strikeResult = await rateLimit({
      key: `strikes:${ip}`,
      limit: 3,
      windowSeconds: 300, // 3 strikes in 5 minutes = blocked
    });
    
    if (!strikeResult.allowed) {
      await rateLimit({
        key: `blocked:ip:${ip}`,
        limit: 1,
        windowSeconds: 3600, // Block for 1 hour
      });
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(rl.resetSeconds),
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(rl.resetSeconds),
      },
    });
  }
  
  // -------------------------------------------------------------------------
  // 5. SPECIAL PROTECTION FOR ADMIN ROUTES
  // -------------------------------------------------------------------------
  if (pathname.includes("/admin")) {
    const adminRl = await rateLimit({
      key: `ratelimit:admin:ip:${ip}`,
      limit: 10,
      windowSeconds: 60,
    });

    if (!adminRl.allowed) {
      console.warn(`[ADMIN_BLOCKED] IP: ${ip}, Path: ${pathname}`);
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(adminRl.resetSeconds) },
      });
    }
    
    console.log(`[ADMIN] IP: ${ip}, Path: ${pathname}`);
  }
  
  // -------------------------------------------------------------------------
  // 6. LOCALE DETECTION WITH GEO-IP
  // -------------------------------------------------------------------------
  const segments = pathname.split("/").filter(Boolean);
  const hasLocalePrefix = segments.length > 0 && routing.locales.includes(segments[0] as Locale);

  if (!hasLocalePrefix) {
    let locale: Locale = "en";
    
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
    if (cookieLocale && routing.locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else {
      const country = request.headers.get("x-country") ||
                      request.headers.get("x-vercel-ip-country") ||
                      request.headers.get("cf-ipcountry");

      if (country) {
        locale = getLocaleFromCountry(country);
      } else {
        if (acceptLanguage.toLowerCase().includes("pt")) {
          locale = "pt-BR";
        }
      }
    }

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = searchParams.toString();

    const response = NextResponse.redirect(url, 307);
    addSecurityHeaders(response);
    
    // Add rate limit headers
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    
    return response;
  }

  const response = nextIntlMiddleware(request);

  if (response) {
    addSecurityHeaders(response);
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
