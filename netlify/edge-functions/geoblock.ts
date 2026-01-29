import type { Context, Config } from "@netlify/edge-functions";

// =============================================================================
// GEOBLOCKING EDGE FUNCTION - BRAZIL ONLY
// This runs at the CDN edge BEFORE the Next.js middleware for maximum protection
// =============================================================================

const ALLOWED_COUNTRIES = new Set(["BR"]);

const BYPASS_PATHS = [
  "/blocked",
  "/api/health",
  "/api/webhooks",
  "/api/payments/webhook",
  "/api/pod/webhooks",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

const BYPASS_SECRET = Netlify.env.get("GEOBLOCK_BYPASS_SECRET") || "fayapoint-bypass-2024";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check if path should bypass geoblocking
  const shouldBypass = BYPASS_PATHS.some(bypass => 
    pathname.startsWith(bypass) || pathname === bypass
  );
  
  if (shouldBypass) {
    return context.next();
  }
  
  // Check for bypass secret header
  const bypassHeader = request.headers.get("x-geobypass-secret");
  if (bypassHeader === BYPASS_SECRET) {
    return context.next();
  }
  
  // Check for test override (development only)
  const testGeo = url.searchParams.get("_geo");
  if (testGeo) {
    const testCountry = testGeo.toUpperCase();
    if (!ALLOWED_COUNTRIES.has(testCountry)) {
      return redirectToBlocked(request, testCountry, pathname);
    }
    return context.next();
  }
  
  // Get country from Netlify's geo context
  const country = context.geo?.country?.code;
  
  if (country && !ALLOWED_COUNTRIES.has(country)) {
    // Log the blocked request
    console.log(`[GEOBLOCK_EDGE] Blocked: Country=${country}, Path=${pathname}, IP=${context.ip}`);
    
    return redirectToBlocked(request, country, pathname);
  }
  
  // If country is unknown, allow through (Next.js middleware will handle)
  // This is permissive mode - change to block if you want strict mode
  if (!country) {
    console.log(`[GEOBLOCK_EDGE] Unknown country, allowing: Path=${pathname}, IP=${context.ip}`);
  }
  
  // Add country header for downstream use
  const response = await context.next();
  
  // Clone response to add headers
  const newResponse = new Response(response.body, response);
  if (country) {
    newResponse.headers.set("x-geo-country", country);
  }
  
  return newResponse;
};

function redirectToBlocked(request: Request, country: string, pathname: string): Response {
  const blockedUrl = new URL("/blocked", request.url);
  blockedUrl.searchParams.set("from", country);
  blockedUrl.searchParams.set("path", pathname);
  
  return Response.redirect(blockedUrl.toString(), 307);
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
