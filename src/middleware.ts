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

// =============================================================================
// GEOBLOCKING CONFIGURATION - BRAZIL ONLY
// =============================================================================
const GEOBLOCK_CONFIG = {
  enabled: true, // Master switch - set to false to disable geoblocking
  allowedCountries: new Set(["BR"]), // Only Brazil allowed
  
  // Paths that bypass geoblocking (always accessible)
  bypassPaths: [
    "/blocked",           // The blocked page itself
    "/api/health",        // Health checks
    "/api/webhooks",      // Webhooks from external services
    "/api/payments/webhook", // Payment webhooks (Asaas)
    "/api/pod/webhooks",  // POD webhooks (Printify, Prodigi)
    "/_next",             // Next.js assets
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ],
  
  // For local testing: add ?_geo=BR or ?_geo=US to simulate countries
  testQueryParam: "_geo",
  
  // Secret header for bypassing (for your own access from abroad)
  bypassHeader: "x-geobypass-secret",
  bypassSecret: process.env.GEOBLOCK_BYPASS_SECRET || "fayapoint-bypass-2024",
};

// Get country code from various Netlify/Vercel/Cloudflare headers
function getCountryFromRequest(request: NextRequest): string | null {
  // Check for test override first (only in development or with correct format)
  const testGeo = request.nextUrl.searchParams.get(GEOBLOCK_CONFIG.testQueryParam);
  if (testGeo && (process.env.NODE_ENV === "development" || testGeo.length === 2)) {
    return testGeo.toUpperCase();
  }
  
  // Netlify Edge Functions provide geo in context, but also via headers
  const netlifyCountry = request.headers.get("x-nf-client-geo-country");
  if (netlifyCountry) return netlifyCountry.toUpperCase();
  
  // Netlify also provides via x-country (legacy)
  const xCountry = request.headers.get("x-country");
  if (xCountry) return xCountry.toUpperCase();
  
  // Vercel provides geo via this header
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();
  
  // Cloudflare provides via cf-ipcountry
  const cfCountry = request.headers.get("cf-ipcountry");
  if (cfCountry) return cfCountry.toUpperCase();
  
  // Next.js geo (if available)
  // @ts-expect-error - geo may exist on request in edge runtime
  const nextGeo = request.geo?.country;
  if (nextGeo) return nextGeo.toUpperCase();
  
  return null;
}

// Check if path should bypass geoblocking
function shouldBypassGeoblock(pathname: string): boolean {
  return GEOBLOCK_CONFIG.bypassPaths.some(bypass => 
    pathname.startsWith(bypass) || pathname === bypass
  );
}

// Paths that should bypass bot detection (health checks, webhooks)
const BOT_DETECTION_BYPASS_PATHS = [
  "/api/health",
  "/api/webhooks",
  "/api/payments/webhook",
  "/api/pod/webhooks",
  "/api/fulfillment",
];

function shouldBypassBotDetection(pathname: string): boolean {
  return BOT_DETECTION_BYPASS_PATHS.some(bypass => 
    pathname.startsWith(bypass) || pathname === bypass
  );
}

// Check if request has valid bypass secret
function hasValidBypassSecret(request: NextRequest): boolean {
  const secret = request.headers.get(GEOBLOCK_CONFIG.bypassHeader);
  return secret === GEOBLOCK_CONFIG.bypassSecret;
}

// =============================================================================
// EMERGENCY IP BLOCKLIST - Add IPs here to block immediately
// =============================================================================
const BLOCKED_IPS: Set<string> = new Set([
  // Add abusive IPs here:
  // "1.2.3.4",
]);

// Suspicious IP ranges (first 2 octets) - data centers, known VPNs
const SUSPICIOUS_IP_PREFIXES = [
  "45.33",   // Linode
  "45.56",   // Linode
  "104.131", // DigitalOcean
  "104.236", // DigitalOcean
  "107.170", // DigitalOcean
  "138.68",  // DigitalOcean
  "139.59",  // DigitalOcean
  "142.93",  // DigitalOcean
  "157.245", // DigitalOcean
  "159.65",  // DigitalOcean
  "159.89",  // DigitalOcean
  "161.35",  // DigitalOcean
  "164.90",  // DigitalOcean
  "167.71",  // DigitalOcean
  "167.172", // DigitalOcean
  "174.138", // DigitalOcean
  "178.62",  // DigitalOcean
  "188.166", // DigitalOcean
  "192.241", // DigitalOcean
  "206.189", // DigitalOcean
  "34.64",   // Google Cloud
  "34.65",   // Google Cloud
  "34.66",   // Google Cloud
  "35.184",  // Google Cloud
  "35.192",  // Google Cloud
  "35.200",  // Google Cloud
  "35.201",  // Google Cloud
  "35.202",  // Google Cloud
  "35.203",  // Google Cloud
  "35.204",  // Google Cloud
  "35.205",  // Google Cloud
  "35.206",  // Google Cloud
  "35.207",  // Google Cloud
  "35.208",  // Google Cloud
  "35.209",  // Google Cloud
  "35.210",  // Google Cloud
  "35.211",  // Google Cloud
  "35.212",  // Google Cloud
  "52.0",    // AWS
  "52.1",    // AWS
  "52.2",    // AWS
  "54.0",    // AWS
  "54.1",    // AWS
  "54.2",    // AWS
  "54.3",    // AWS
  "3.0",     // AWS
  "3.1",     // AWS
  "13.0",    // AWS
  "13.1",    // AWS
];

const nextIntlMiddleware = createMiddleware(routing);

// Check if IP is from a suspicious prefix (data center)
function isSuspiciousIpPrefix(ip: string): boolean {
  for (const prefix of SUSPICIOUS_IP_PREFIXES) {
    if (ip.startsWith(prefix)) return true;
  }
  return false;
}

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
  const isApiRoute = pathname.startsWith("/api");
  
  // =========================================================================
  // 0. EMERGENCY BLOCKLIST - Immediate block for known bad actors
  // =========================================================================
  if (BLOCKED_IPS.has(ip)) {
    console.warn(`[BLOCKED_IP] ${ip} attempted access to ${pathname}`);
    return new NextResponse("Forbidden", { status: 403 });
  }
  
  // =========================================================================
  // 0.5. GEOBLOCKING - BRAZIL ONLY (First major check after blocklist)
  // =========================================================================
  if (GEOBLOCK_CONFIG.enabled) {
    // Check if path bypasses geoblocking
    if (!shouldBypassGeoblock(pathname)) {
      // Check for bypass secret header (for admin access from abroad)
      if (!hasValidBypassSecret(request)) {
        const country = getCountryFromRequest(request);
        
        // If we can determine the country and it's not allowed, block
        if (country && !GEOBLOCK_CONFIG.allowedCountries.has(country)) {
          console.warn(`[GEOBLOCK] Blocked: IP=${ip}, Country=${country}, Path=${pathname}, UA=${userAgent.slice(0, 50)}`);
          
          // Redirect to blocked page
          const blockedUrl = new URL("/blocked", request.url);
          blockedUrl.searchParams.set("from", country);
          blockedUrl.searchParams.set("path", pathname);
          
          return NextResponse.redirect(blockedUrl, { status: 307 });
        }
        
        // If country is unknown (null), we can choose to:
        // Option 1: Allow (permissive) - good for local dev
        // Option 2: Block (strict) - maximum security
        // Using permissive for now to not break local development
        if (country === null && process.env.NODE_ENV === "production") {
          // In production, if we can't determine country, log but allow
          // This handles edge cases where geo headers aren't available
          console.log(`[GEOBLOCK_UNKNOWN] IP=${ip}, Path=${pathname} - allowing (unknown country)`);
        }
      }
    }
  }
  
  // -------------------------------------------------------------------------
  // 1. IMMEDIATE BLOCKS - Zero tolerance (with bypass for health/webhooks)
  // -------------------------------------------------------------------------
  
  // Skip bot detection for health checks and webhooks
  const skipBotDetection = shouldBypassBotDetection(pathname);
  
  // Block honeypot paths (WordPress, PHP, etc.)
  if (!skipBotDetection && isHoneypotPath(pathname)) {
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
  
  // Block known bad bots immediately (but not for health/webhook endpoints)
  if (!skipBotDetection && isBadBot(userAgent)) {
    console.warn(`[BAD_BOT] IP: ${ip}, UA: ${userAgent.slice(0, 100)}`);
    return new NextResponse("Forbidden", { status: 403 });
  }
  
  // =========================================================================
  // 1.5 API ROUTE PROTECTION - Aggressive limits for API endpoints
  // =========================================================================
  if (isApiRoute) {
    // Stricter rate limit for API routes
    const apiRl = await rateLimit({
      key: `api:global:${ip}`,
      limit: 30, // 30 requests per minute for API
      windowSeconds: 60,
    });
    
    if (!apiRl.allowed) {
      console.warn(`[API_RATE_LIMITED] IP: ${ip}, Path: ${pathname}, UA: ${userAgent.slice(0, 50)}`);
      
      // Strike system for repeat offenders
      const strikeResult = await rateLimit({
        key: `api:strikes:${ip}`,
        limit: 2,
        windowSeconds: 300,
      });
      
      if (!strikeResult.allowed) {
        // Block for 1 hour after 2 API rate limit hits
        await rateLimit({
          key: `blocked:ip:${ip}`,
          limit: 1,
          windowSeconds: 3600,
        });
        console.warn(`[API_BLOCKED] IP: ${ip} blocked for 1 hour after repeated API abuse`);
      }
      
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(apiRl.resetSeconds),
          "X-RateLimit-Limit": String(apiRl.limit),
          "X-RateLimit-Remaining": "0",
        },
      });
    }
    
    // Extra protection: Block data center IPs from heavy API usage
    if (isSuspiciousIpPrefix(ip)) {
      const dcRl = await rateLimit({
        key: `api:datacenter:${ip}`,
        limit: 10, // Only 10 requests/min for data center IPs
        windowSeconds: 60,
      });
      
      if (!dcRl.allowed) {
        console.warn(`[DATACENTER_BLOCKED] IP: ${ip}, Path: ${pathname}`);
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    // Bandwidth tracking per IP
    await rateLimit({
      key: `bandwidth:${ip}`,
      limit: 500, // Track up to 500 requests for monitoring
      windowSeconds: 3600, // Per hour
    });
    
    // Log all API requests for investigation
    const now = new Date().toISOString();
    console.log(`[API_ACCESS] ${now} | IP: ${ip} | Path: ${pathname} | UA: ${userAgent.slice(0, 80)}`);
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
  
  // Very suspicious = block (but not for health/webhook bypass paths)
  if (suspicionScore >= 80 && !skipBotDetection) {
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
  // 6. LOCALE DETECTION WITH GEO-IP (skip for API routes)
  // -------------------------------------------------------------------------
  
  // API routes should NOT get locale prefix
  if (isApiRoute) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  }
  
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
  // UPDATED: Now includes API routes for protection
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|css|js)$).*)"
  ]
};
