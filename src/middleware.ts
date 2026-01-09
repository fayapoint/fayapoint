import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing, type Locale } from "./i18n/routing";

const nextIntlMiddleware = createMiddleware(routing);

// ============================================================================
// SECURITY: Bot/Scanner patterns to block immediately
// ============================================================================
const BLOCKED_PATHS = [
  // WordPress probes (common attack vectors)
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/wp-includes",
  "/wordpress",
  "/xmlrpc.php",
  // PHP probes
  "/index.php",
  "/admin.php",
  "/config.php",
  "/setup.php",
  "/install.php",
  // Common vulnerability scanners
  "/.env",
  "/.git",
  "/.svn",
  "/phpmyadmin",
  "/phpinfo",
  "/mysql",
  "/backup",
  "/db",
  "/database",
  "/sql",
  // Other common attack paths
  "/cgi-bin",
  "/shell",
  "/cmd",
  "/exec",
  "/eval",
];

// Suspicious user agents (bots/scanners)
const BLOCKED_USER_AGENTS = [
  "sqlmap",
  "nikto",
  "nmap",
  "masscan",
  "zgrab",
  "gobuster",
  "dirbuster",
  "wpscan",
  "jorgee",
  "censys",
  "shodan",
];

// ============================================================================
// GEO-IP: Country to locale mapping
// ============================================================================
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // Portuguese-speaking countries -> pt-BR
  BR: "pt-BR",
  PT: "pt-BR",
  AO: "pt-BR", // Angola
  MZ: "pt-BR", // Mozambique
  CV: "pt-BR", // Cape Verde
  GW: "pt-BR", // Guinea-Bissau
  ST: "pt-BR", // São Tomé
  TL: "pt-BR", // Timor-Leste
  // Everything else -> en
};

function getLocaleFromCountry(countryCode: string | null): Locale {
  if (!countryCode) return "en"; // Default to English for unknown
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] || "en";
}

// ============================================================================
// RATE LIMITING: Simple in-memory rate limiter for admin routes
// ============================================================================
const adminAttempts = new Map<string, { count: number; timestamp: number }>();
const ADMIN_RATE_LIMIT = 10; // max attempts
const ADMIN_RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = adminAttempts.get(ip);
  
  if (!record || now - record.timestamp > ADMIN_RATE_WINDOW) {
    adminAttempts.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  record.count++;
  if (record.count > ADMIN_RATE_LIMIT) {
    return true;
  }
  
  return false;
}

// Clean up old entries on each request (serverless-safe)
function cleanupOldEntries() {
  const now = Date.now();
  // Only clean if map is getting large
  if (adminAttempts.size > 100) {
    for (const [ip, record] of adminAttempts.entries()) {
      if (now - record.timestamp > ADMIN_RATE_WINDOW * 2) {
        adminAttempts.delete(ip);
      }
    }
  }
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================
export default function middleware(request: NextRequest) {
  // Serverless-safe cleanup
  cleanupOldEntries();
  
  const { pathname, searchParams } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
  
  // -------------------------------------------------------------------------
  // 1. BLOCK MALICIOUS REQUESTS
  // -------------------------------------------------------------------------
  
  // Block known bad paths (WordPress probes, etc.)
  const lowerPath = pathname.toLowerCase();
  for (const blocked of BLOCKED_PATHS) {
    if (lowerPath.includes(blocked)) {
      // Return 404 to not reveal we're blocking them
      return new NextResponse("Not Found", { status: 404 });
    }
  }
  
  // Block suspicious user agents
  for (const blocked of BLOCKED_USER_AGENTS) {
    if (userAgent.includes(blocked)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  
  // -------------------------------------------------------------------------
  // 2. ADMIN ROUTE PROTECTION
  // -------------------------------------------------------------------------
  if (pathname.includes("/admin")) {
    // Rate limit admin access attempts
    if (isRateLimited(ip)) {
      console.warn(`[SECURITY] Rate limited IP: ${ip} on admin route`);
      return new NextResponse("Too Many Requests", { 
        status: 429,
        headers: { "Retry-After": "60" }
      });
    }
    
    // Log admin access attempts (for monitoring)
    console.log(`[ADMIN ACCESS] IP: ${ip}, Path: ${pathname}, UA: ${userAgent.slice(0, 50)}`);
  }
  
  // -------------------------------------------------------------------------
  // 3. LOCALE DETECTION WITH GEO-IP
  // -------------------------------------------------------------------------
  const segments = pathname.split("/").filter(Boolean);
  const hasLocalePrefix = segments.length > 0 && routing.locales.includes(segments[0] as Locale);

  if (!hasLocalePrefix) {
    // Priority order for locale detection:
    // 1. Cookie (user explicitly chose)
    // 2. Geo-IP (Netlify header)
    // 3. Accept-Language header
    // 4. Default (English for international)
    
    let locale: Locale = "en"; // Default to English
    
    // Check cookie first (user's explicit choice)
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
    if (cookieLocale && routing.locales.includes(cookieLocale)) {
      locale = cookieLocale;
    } else {
      // Try Geo-IP (Netlify provides this header)
      const country = request.headers.get("x-country") || 
                      request.headers.get("x-vercel-ip-country") ||
                      request.headers.get("cf-ipcountry"); // Cloudflare
      
      if (country) {
        locale = getLocaleFromCountry(country);
      } else {
        // Fall back to Accept-Language header
        const acceptLanguage = request.headers.get("accept-language") || "";
        if (acceptLanguage.toLowerCase().includes("pt")) {
          locale = "pt-BR";
        }
        // Otherwise stays "en"
      }
    }
    
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = searchParams.toString();
    
    const response = NextResponse.redirect(url, 307);
    
    // Set security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    
    return response;
  }

  const response = nextIntlMiddleware(request);
  
  // Add security headers to all responses
  if (response) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
