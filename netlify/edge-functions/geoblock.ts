import type { Context, Config } from "@netlify/edge-functions";

// =============================================================================
// GEOBLOCKING EDGE FUNCTION v2 - STRICT MODE - BRAZIL ONLY
// This runs at the CDN edge BEFORE anything else for MAXIMUM protection
// Returns 403 directly (not redirect) to minimize bandwidth consumption
// =============================================================================

const ALLOWED_COUNTRIES = new Set(["BR"]);

// Paths that MUST bypass geoblocking (webhooks from external services)
const BYPASS_PATHS = [
  // Internal
  "/blocked",
  "/api/health",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  
  // Asaas Payment Webhooks (Brazilian payment provider - but whitelist anyway)
  "/api/payments/webhook",
  
  // Printify Webhooks (US/EU servers)
  "/api/pod/webhooks/printify",
  "/api/webhooks/printify",
  
  // Prodigi Webhooks (UK servers)
  "/api/pod/prodigi/webhooks",
  "/api/webhooks/prodigi",
  
  // General webhook paths
  "/api/webhooks",
  "/api/pod/webhooks",
  
  // Fulfillment API (might be called externally)
  "/api/fulfillment",
];

const BYPASS_SECRET = Netlify.env.get("GEOBLOCK_BYPASS_SECRET") || "fayapoint-bypass-2024";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  
  // =========================================================================
  // 1. BYPASS CHECK - Webhooks and static assets always allowed
  // =========================================================================
  const shouldBypass = BYPASS_PATHS.some(bypass => 
    pathname.startsWith(bypass) || pathname === bypass
  );
  
  if (shouldBypass) {
    return context.next();
  }
  
  // =========================================================================
  // 2. BYPASS SECRET - For admin access from anywhere
  // =========================================================================
  const bypassHeader = request.headers.get("x-geobypass-secret");
  if (bypassHeader === BYPASS_SECRET) {
    return context.next();
  }
  
  // =========================================================================
  // 3. TEST OVERRIDE - For local testing with ?_geo=BR or ?_geo=US
  // =========================================================================
  const testGeo = url.searchParams.get("_geo");
  if (testGeo) {
    const testCountry = testGeo.toUpperCase();
    if (!ALLOWED_COUNTRIES.has(testCountry)) {
      return blockRequest(testCountry, pathname, context.ip || "unknown", userAgent);
    }
    return context.next();
  }
  
  // =========================================================================
  // 4. GEOBLOCKING - STRICT MODE
  // =========================================================================
  const country = context.geo?.country?.code;
  
  // STRICT MODE: If country is detected and NOT Brazil -> BLOCK
  if (country && !ALLOWED_COUNTRIES.has(country)) {
    return blockRequest(country, pathname, context.ip || "unknown", userAgent);
  }
  
  // STRICT MODE: If country is UNKNOWN -> BLOCK (attackers often hide geo)
  if (!country) {
    console.log(`[GEOBLOCK_STRICT] Unknown country BLOCKED: Path=${pathname}, IP=${context.ip}, UA=${userAgent.slice(0, 50)}`);
    return blockRequest("UNKNOWN", pathname, context.ip || "unknown", userAgent);
  }
  
  // =========================================================================
  // 5. ALLOWED - Brazil traffic passes through
  // =========================================================================
  const response = await context.next();
  
  // Add country header for downstream middleware
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("x-geo-country", country);
  
  return newResponse;
};

// Return 403 directly - NO redirect, NO page render = minimal bandwidth
function blockRequest(country: string, pathname: string, ip: string, userAgent: string): Response {
  console.log(`[GEOBLOCK_EDGE] BLOCKED: Country=${country}, Path=${pathname}, IP=${ip}, UA=${userAgent.slice(0, 50)}`);
  
  // Minimal response - just text, no HTML = ~50 bytes vs ~20KB for page
  return new Response(
    `Access denied. This service is only available in Brazil. [${country}]`,
    {
      status: 403,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400", // Cache 403 for 24h at CDN
        "X-Blocked-Country": country,
        "X-Blocked-Reason": "geoblocking",
      },
    }
  );
}

export const config: Config = {
  // Run on all paths except static assets
  path: "/*",
  excludedPath: [
    "/_next/static/*",
    "/_next/image/*",
    "/images/*",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.svg",
    "/*.webp",
    "/*.woff",
    "/*.woff2",
    "/*.css",
    "/*.js",
  ],
};
