import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { getClientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import {
  isBadBot,
  isHoneypotPath,
  calculateSuspicionScore,
  getRateLimitTier,
  generateRequestFingerprint
} from "@/lib/bot-detection";
import { routing, type Locale } from "./i18n/routing";

// JWT secret for Edge runtime verification (jose)
const JWT_SECRET_BYTES = new TextEncoder().encode(process.env.JWT_SECRET || "");

// =============================================================================
// SEARCH ENGINE BOT DETECTION - Auto-pass gate for SEO
// =============================================================================
const SEARCH_ENGINE_BOTS = [
  "googlebot", "bingbot", "yandexbot", "duckduckbot", "baiduspider",
  "slurp", "facebot", "facebookexternalhit", "twitterbot", "linkedinbot",
  "applebot", "semrushbot", "ahrefsbot", "mj12bot", "rogerbot",
  "dotbot", "petalbot", "bytespider", "gptbot", "ia_archiver",
];

function isSearchEngineBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return SEARCH_ENGINE_BOTS.some(bot => lower.includes(bot));
}

// =============================================================================
// GEOBLOCKING CONFIGURATION - BRAZIL ONLY
// =============================================================================
const GEOBLOCK_CONFIG = {
  enabled: false, // DISABLED - Edge function handles geoblocking now (more efficient)
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
    "/icon.svg",
    "/apple-icon.png",
    "/manifest.webmanifest",
    "/robots.txt",
    "/sitemap.xml",
  ],

  // For local testing: add ?_geo=BR or ?_geo=US to simulate countries
  testQueryParam: "_geo",

  /**
   * Cabeçalho de bypass — SEM valor padrão, de propósito.
   *
   * Havia `|| "fayai-bypass-2024"` aqui: uma senha fixa, escrita num
   * repositório público, que liberava o geoblock de qualquer país. Hoje o
   * `enabled: false` acima mantém este bloco dormindo, então não era
   * explorável — mas era uma mina armada para o dia em que alguém trocasse o
   * `false` por `true`.
   *
   * `netlify/edge-functions/geoblock.ts` já tinha sido consertado assim; este
   * ficou para trás. Sem a variável no ambiente, `null` nunca casa com um
   * cabeçalho (a comparação abaixo exige o segredo definido).
   */
  bypassHeader: "x-geobypass-secret",
  bypassSecret: process.env.GEOBLOCK_BYPASS_SECRET || null,
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
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/google-callback",
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
  // Sem segredo configurado não há bypass. `null === null` seria verdadeiro para
  // quem não mandasse cabeçalho nenhum — que é justamente todo mundo.
  return Boolean(GEOBLOCK_CONFIG.bypassSecret) && secret === GEOBLOCK_CONFIG.bypassSecret;
}

// =============================================================================
// WHITELISTED IPS - Skip all rate limiting and bot detection
// =============================================================================
const WHITELISTED_IPS: Set<string> = new Set([
  "76.13.234.38", // Admin server
]);

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
/**
 * Para onde mandar quem pediu uma URL sem prefixo de idioma.
 *
 * **Com cookie:** respeita a escolha da pessoa, e o redirecionamento é
 * TEMPORÁRIO (307) — o destino varia por visitante, e um 308 cacheado
 * prenderia alguém num idioma para sempre.
 *
 * **Sem cookie:** vai para pt-BR, sempre, com 308 permanente.
 *
 * O "sempre" é o ponto. Um dos três caminhos partia de `en` e só virava
 * `pt-BR` se aparecesse cabeçalho de país ou `Accept-Language` com "pt" — e o
 * Googlebot não manda cookie nenhum. Tornar isso permanente sem fixar o
 * destino faria o Google gravar `/cursos → /en/cursos` para sempre, apontando
 * de vez para a árvore que acabamos de marcar como `noindex`. Todo o texto do
 * site é português e o acesso é só do Brasil: pt-BR não é palpite, é o idioma
 * do site.
 *
 * O 307 era o que mantinha `/cursos`, `/blog` e `/radar` vivos no índice com
 * título antigo em inglês, ao lado das versões `/pt-BR/…`. O `site:` do
 * domínio em 27/07/2026 mostrava as duas árvores convivendo — com o próprio
 * Google avisando que omitiu resultados "bastante semelhantes".
 */
function idiomaDestino(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
  return cookieLocale && routing.locales.includes(cookieLocale) ? cookieLocale : "pt-BR";
}

function redirecionaParaIdioma(request: NextRequest, url: URL) {
  const escolheu = !!request.cookies.get("NEXT_LOCALE")?.value;
  const response = NextResponse.redirect(url, escolheu ? 307 : 308);
  // Diz aos caches que a resposta depende do cookie de idioma.
  response.headers.set("Vary", "Cookie");
  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // =========================================================================
  // SEO FILES - Must NEVER be locale-redirected or blocked (Googlebot reads these)
  // /robots.txt is static (public/), /sitemap.xml is generated by app/sitemap.ts
  // =========================================================================
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // O mapa para motores de resposta. Sem esta linha ele levaria 308 para
    // `/pt-BR/llms.txt`, que nao existe — e a convencao e que o arquivo mora na
    // RAIZ. Um 404 aqui e um mapa que ninguem le.
    pathname === "/llms.txt" ||
    pathname === "/google302d853608efe717.html" // Search Console verification
  ) {
    return NextResponse.next();
  }

  const ip = getClientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer");
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  const isRSC = searchParams.has("_rsc");
  // Casar o SEGMENTO, nao o prefixo. Com `startsWith("/api")` a pagina
  // `/api-docs` era tratada como rota de API: escapava do redirecionamento de
  // idioma e servia 404 na versao sem prefixo, enquanto `/pt-BR/api-docs` e
  // `/en/api-docs` respondiam 200. O Google registrou o 404 (confirmado no
  // Search Console em 01/08/2026, rastreada em 12/07). Qualquer rota futura
  // comecada por "api" — /api-status, /apidocs — cairia na mesma armadilha.
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");

  // =========================================================================
  // 0. EMERGENCY BLOCKLIST - Immediate block for known bad actors
  // =========================================================================
  if (BLOCKED_IPS.has(ip)) {
    console.warn(`[BLOCKED_IP] ${ip} attempted access to ${pathname}`);
    return new NextResponse("Forbidden", { status: 403 });
  }

  // =========================================================================
  // 0.1. WHITELISTED IPS - Skip all rate limiting and bot detection
  // =========================================================================
  if (WHITELISTED_IPS.has(ip)) {
    // Whitelisted IPs go straight to locale/API handling - no rate limits
    if (isApiRoute) {
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }
    // For page routes, go straight to locale detection (step 6)
    const segments = pathname.split("/").filter(Boolean);
    const hasLocalePrefix = segments.length > 0 && routing.locales.includes(segments[0] as Locale);
    if (!hasLocalePrefix) {
      const locale = idiomaDestino(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
      url.search = searchParams.toString();
      const response = redirecionaParaIdioma(request, url);
      addSecurityHeaders(response);
      return response;
    }
    const response = nextIntlMiddleware(request);
    if (response) addSecurityHeaders(response);
    return response;
  }

  // =========================================================================
  // 0.6. SEARCH ENGINE BOT GATE BYPASS - Set gate cookie so bots see full page
  // =========================================================================
  if (isSearchEngineBot(userAgent) && !request.cookies.has("fayai_gate")) {
    // Let the request continue but set the gate cookie in the response
    // This is handled at the end of middleware by adding the cookie to the response
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

  if (pathname === "/api/auth/google" || pathname === "/api/auth/google/callback" || pathname === "/api/auth/google-callback") {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Block honeypot paths (WordPress, PHP, etc.)
  if (!skipBotDetection && isHoneypotPath(pathname)) {
    // Log for monitoring
    console.warn(`[HONEYPOT] IP: ${ip}, Path: ${pathname}, UA: ${userAgent.slice(0, 50)}`);

    /**
     * REGISTRA o IP por 24h — não bloqueia, e o comentário antigo dizia que
     * bloqueava.
     *
     * A seção "2. CHECK IF IP IS TEMPORARILY BLOCKED" mais abaixo é só prosa: a
     * chave `blocked:ip:*` é escrita aqui e **nunca lida** no caminho do pedido.
     * Quem a lê é o painel (`/api/admin/bandwidth-report` lista
     * `blocked:ip:*`), e para isso ela serve.
     *
     * Deixo assim de propósito. Fazer valer o bloqueio custaria uma ida ao
     * Redis em TODO pedido dentro da edge function — e a armadilha já responde
     * 410 na hora, de graça, sem consultar nada. Trocar isso por latência em
     * cada visita legítima é pagar caro para bloquear quem já foi bloqueado.
     */
    await rateLimit({
      key: `blocked:ip:${ip}`,
      limit: 1,
      windowSeconds: 86400, // 24 horas de registro, para o relatório
    });

    return new NextResponse("Gone", { status: 410 });
  }

  // Block known bad bots immediately (but not for health/webhook endpoints)
  // RELAXED: Only block if BOTH bad bot pattern AND missing essential headers
  // Edge function handles geo - middleware only blocks obvious automation
  if (!skipBotDetection && isBadBot(userAgent)) {
    // Only block if also missing essential browser headers (real bots)
    const hasAcceptLanguage = !!request.headers.get("accept-language");
    const hasAcceptEncoding = !!request.headers.get("accept-encoding");
    const hasSecFetchDest = !!request.headers.get("sec-fetch-dest");

    // Real browsers always have these headers, bots often don't
    if (!hasAcceptLanguage && !hasAcceptEncoding) {
      console.warn(`[BAD_BOT] IP: ${ip}, UA: ${userAgent.slice(0, 100)}`);
      return new NextResponse("Forbidden", { status: 403 });
    }
    // Log suspicious but don't block if they have browser headers
    console.log(`[SUSPICIOUS_UA] IP: ${ip}, UA: ${userAgent.slice(0, 100)}, hasHeaders: AL=${hasAcceptLanguage}, AE=${hasAcceptEncoding}, SFD=${hasSecFetchDest}`);
  }

  // =========================================================================
  // 1.5 API ROUTE PROTECTION
  // =========================================================================
  if (isApiRoute) {
    // Authenticated users get higher API limits
    const hasAuthToken = request.cookies.has("token") || request.cookies.has("fayai_token");
    const apiLimit = hasAuthToken ? 200 : 120;

    const apiRl = await rateLimit({
      key: `api:global:${ip}`,
      limit: apiLimit,
      windowSeconds: 60,
    });

    if (!apiRl.allowed) {
      console.warn(`[API_RATE_LIMITED] IP: ${ip}, Path: ${pathname}, Auth: ${hasAuthToken}`);

      // Soft strike system - 5 strikes over 10 minutes, block for 15 minutes
      const strikeResult = await rateLimit({
        key: `api:strikes:${ip}`,
        limit: 5,
        windowSeconds: 600,
      });

      if (!strikeResult.allowed) {
        await rateLimit({
          key: `blocked:ip:${ip}`,
          limit: 1,
          windowSeconds: 900, // 15 minutes (was 1 hour)
        });
        console.warn(`[API_BLOCKED] IP: ${ip} blocked for 15 min after repeated API abuse`);
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
        limit: 20, // 20 requests/min for data center IPs (was 10)
        windowSeconds: 60,
      });

      if (!dcRl.allowed) {
        console.warn(`[DATACENTER_BLOCKED] IP: ${ip}, Path: ${pathname}`);
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. CHECK IF IP IS TEMPORARILY BLOCKED (from strike system)
  // -------------------------------------------------------------------------
  // Only check, don't increment - the block key is set by strike systems above
  // Using a read-only check via incr + high limit to just peek at counter
  // If blocked:ip key exists with count > 0, this IP was recently blocked

  // -------------------------------------------------------------------------
  // 3. CALCULATE SUSPICION SCORE & GET RATE LIMIT
  // -------------------------------------------------------------------------

  // Skip expensive request counting Redis call for page routes
  // The global rate limiter (step 4) already handles page route limits
  const suspicionScore = calculateSuspicionScore({
    userAgent,
    pathname,
    hasReferer: !!referer,
    acceptLanguage,
    acceptEncoding,
    isRSC,
    requestCount: 0, // Don't burn a Redis call just to count
  });

  // Log highly suspicious requests
  if (suspicionScore >= 50) {
    const fingerprint = generateRequestFingerprint({ ip, userAgent, acceptLanguage });
    console.warn(`[SUSPICIOUS] Score: ${suspicionScore}, IP: ${ip}, FP: ${fingerprint}, Path: ${pathname}`);
  }

  // Very suspicious = log but DON'T block (edge handles geo, avoid false positives)
  // Only honeypot paths (score 100+) should block, and that's handled separately above
  if (suspicionScore >= 80 && !skipBotDetection) {
    console.warn(`[SUSPICIOUS_REQUEST] Score: ${suspicionScore}, IP: ${ip}, Path: ${pathname}, UA: ${userAgent.slice(0, 80)}`);
    // DO NOT BLOCK - just log for monitoring. Edge function handles geoblocking.
  }

  // -------------------------------------------------------------------------
  // 3.5 SKIP RATE LIMITING FOR NEXT.JS PREFETCH/RSC REQUESTS
  // These are automatic browser behavior, not user-initiated requests.
  // Counting them against the rate limit causes false positives.
  // -------------------------------------------------------------------------
  const isPrefetch = request.headers.get("next-router-prefetch") === "1" ||
                     request.headers.get("purpose") === "prefetch" ||
                     request.headers.get("sec-purpose") === "prefetch";

  if (isPrefetch) {
    // Let prefetches through without counting against rate limit
    if (isApiRoute) {
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }
    // For page prefetches, go to locale handling
    const segments = pathname.split("/").filter(Boolean);
    const hasLocalePrefix = segments.length > 0 && routing.locales.includes(segments[0] as Locale);
    if (!hasLocalePrefix) {
      const locale = idiomaDestino(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
      url.search = searchParams.toString();
      const response = redirecionaParaIdioma(request, url);
      addSecurityHeaders(response);
      return response;
    }
    const response = nextIntlMiddleware(request);
    if (response) addSecurityHeaders(response);
    return response;
  }

  // -------------------------------------------------------------------------
  // 4. GLOBAL RATE LIMITING (page routes only — API routes handled in step 1.5)
  // -------------------------------------------------------------------------

  /**
   * ⚠️ CONTADO, PARA NINGUÉM "OTIMIZAR" ISTO DE NOVO.
   *
   * Ficou escrito numa lista de pendências que este arquivo faz "3 a 4
   * `rateLimit()` sequenciais, cada um com uma ida ao Upstash, em toda visita" e
   * que um pipeline resolveria. Contado caminho a caminho em 18/08/2026, é
   * falso — e agir naquele número teria trocado uma coisa boa por uma pior.
   *
   * Há sete chamadas de `rateLimit()` no arquivo, mas elas são EXCLUDENTES.
   * Numa visita comum (página, sem prefetch, fora de /admin, sem cair na
   * armadilha nem na detecção de robô):
   *
   *     honeypot .................. não chama (só quando o caminho casa)
   *     API (passo 1.5) ........... não chama (`isApiRoute` é falso)
   *     pontuação de suspeita ..... não chama (`requestCount: 0`, de propósito)
   *     prefetch .................. sai antes, sem tocar no Redis
   *     ESTE (passo 4) ............ 1 comando `INCR`
   *     admin (passo 5) ........... não chama (só sob /admin)
   *
   * Total: **um comando por visita**. Numa rota de API é também um (o passo 1.5,
   * e este é pulado). Dois só sob `/admin`; três ou mais só nos caminhos de
   * ABUSO — quem já estourou o limite, que é exatamente quem não merece que se
   * gaste engenharia poupando-lhe latência.
   *
   * E o pipeline juntando `INCR`+`EXPIRE` (ver `rate-limit.ts`) pioraria o que
   * mais importa aqui: o `EXPIRE` hoje sai UMA vez por janela de 60s por IP,
   * enquanto o pipeline mandaria os dois comandos SEMPRE — dobrando o consumo
   * da cota do Upstash para economizar uma ida a cada sessenta.
   */

  // API routes already have their own rate limiter (step 1.5) with separate keys.
  // Only apply global rate limit to PAGE routes here to avoid double-counting.
  let rl = { allowed: true, remaining: 999, limit: 250, resetSeconds: 60 };

  if (!isApiRoute) {
    const hasAuthToken = request.cookies.has("token") || request.cookies.has("fayai_token");
    const rateLimitTier = getRateLimitTier({
      suspicionScore,
      pathname,
      isAuthenticated: hasAuthToken,
    });

    // RSC data requests get their own separate counter so they don't eat
    // into the main page navigation budget
    const rateLimitKey = isRSC
      ? `ratelimit:rsc:${ip}`
      : `ratelimit:pages:${ip}`;

    rl = await rateLimit({
      key: rateLimitKey,
      limit: rateLimitTier.requests,
      windowSeconds: rateLimitTier.windowSeconds,
    });

    if (!rl.allowed) {
      console.warn(`[PAGE_RATE_LIMITED] IP: ${ip}, Limit: ${rateLimitTier.requests}/min, Path: ${pathname}, RSC: ${isRSC}`);

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
  }

  // -------------------------------------------------------------------------
  // 5. SPECIAL PROTECTION FOR ADMIN ROUTES
  // Only applies to actual /admin path segments, not pages that contain "admin"
  // -------------------------------------------------------------------------
  const isAdminRoute = pathname.match(/\/admin(\/|$)/);
  if (isAdminRoute) {
    const adminRl = await rateLimit({
      key: `ratelimit:admin:ip:${ip}`,
      limit: 30, // 30/min (was 10 - too aggressive for SPA navigation)
      windowSeconds: 60,
    });

    if (!adminRl.allowed) {
      console.warn(`[ADMIN_BLOCKED] IP: ${ip}, Path: ${pathname}`);
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(adminRl.resetSeconds) },
      });
    }
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

  // -------------------------------------------------------------------------
  // 6.1. PORTAL ROUTE PROTECTION - Require valid JWT
  // -------------------------------------------------------------------------
  // Strip locale prefix to check raw path (e.g. /pt-BR/portal -> /portal)
  const rawPathname = hasLocalePrefix
    ? "/" + segments.slice(1).join("/")
    : pathname;

  const authCookieToken = request.cookies.get("token")?.value
    || request.cookies.get("fayai_token")?.value
    || null;

  // -------------------------------------------------------------------------
  // 6.0. ADMIN — PORTÃO NO SERVIDOR, FALHANDO FECHADO
  //
  // Medido em produção em 29/07/2026: `/pt-BR/admin`, `/pt-BR/admin/users` e
  // `/pt-BR/admin/payments` respondiam **200 para qualquer visitante**. Só as
  // APIs (`/api/admin/*`) devolviam 401, então o DADO estava protegido — mas a
  // interface inteira era servida, com a estrutura do painel, os nomes das
  // rotas e o JS que as chama. A proteção era só o `AdminContext`, que lê
  // `localStorage` **depois** de a página já ter sido entregue e renderizada.
  // Client-side não é proteção: é decoração.
  //
  // Duas diferenças deliberadas em relação ao portão do `/portal` logo abaixo:
  //
  //  1. **Falha FECHADO.** O portal deixa passar quando a verificação falha,
  //     para não deslogar gente de verdade por deriva de segredo no edge. Aqui
  //     não: token ausente, inválido, expirado ou sem `role: "admin"` volta
  //     para o login. Se o segredo do edge estiver quebrado, o certo é o admin
  //     não entrar — não o contrário.
  //  2. **Confere o papel**, não só a assinatura. Um JWT de aluno é
  //     perfeitamente válido; só não é de administrador.
  //
  // `/admin/login` fica de fora, senão não há como entrar. Ela é `noindex` e
  // tem limite de 30 req/min por IP (bloco 5).
  if (rawPathname.match(/^\/admin(\/|$)/) && !rawPathname.startsWith("/admin/login")) {
    const adminToken = request.cookies.get("fayai_admin_token")?.value || null;

    let ehAdmin = false;
    if (adminToken) {
      try {
        const { payload } = await jwtVerify(adminToken, JWT_SECRET_BYTES);
        ehAdmin = payload.role === "admin";
      } catch (error) {
        console.warn(`[ADMIN_GATE_REJEITADO] ${pathname}`, error);
      }
    }

    if (!ehAdmin) {
      console.warn(`[ADMIN_GATE] Acesso negado: Path=${pathname}, IP=${ip}`);
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = hasLocalePrefix
        ? `/${segments[0]}/admin/login`
        : "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  if (
    rawPathname.startsWith("/portal") &&
    (searchParams.has("code") || searchParams.has("error")) &&
    (searchParams.has("state") || searchParams.has("iss"))
  ) {
    if (authCookieToken) {
      const cleanPortalUrl = request.nextUrl.clone();
      cleanPortalUrl.search = "";
      return NextResponse.redirect(cleanPortalUrl);
    }

    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/api/auth/google-callback";
    callbackUrl.searchParams.set("oauth_redirect_path", pathname);
    return NextResponse.redirect(callbackUrl);
  }

  if (rawPathname.startsWith("/portal")) {
    // Get token from Authorization header or cookie
    let authToken: string | null = null;

    const authorizationHeader = request.headers.get("authorization");
    if (authorizationHeader?.startsWith("Bearer ")) {
      authToken = authorizationHeader.slice(7);
    }
    if (!authToken) {
      authToken = authCookieToken;
    }

    if (!authToken) {
      // No token - redirect to login with redirect param
      //
      // ⚠️ O prefixo de idioma PRECISA sobreviver ao redirecionamento. Escrito
      // como `/login` puro, o destino não tem locale: o middleware roda de novo,
      // cai no bloco `!hasLocalePrefix` e manda para `/pt-BR/login`, porque sem
      // cookie o padrão é português. Medido em 06/08/2026 no build local: quem
      // pedia `/en/portal` deslogado aterrissava numa tela de login inteira em
      // português. Dois redirecionamentos, e o idioma escolhido perdido no meio
      // — o mesmo descasamento de prefixo de [[reference_seo_armadilhas_locale]].
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = hasLocalePrefix ? `/${segments[0]}/login` : "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(authToken, JWT_SECRET_BYTES);
      // Token valid - continue to locale handling
    } catch (error) {
      // Let the app/API layer validate next. This avoids false negatives when
      // edge runtime secrets drift or when a fresh login cookie has just landed.
      console.warn(`[PORTAL_AUTH_VERIFY_FAILED] ${pathname}`, error);
    }
  }

  if (!hasLocalePrefix) {
    const locale = idiomaDestino(request);

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = searchParams.toString();

    const response = redirecionaParaIdioma(request, url);
    addSecurityHeaders(response);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));

    return response;
  }

  const response = nextIntlMiddleware(request);

  if (response) {
    addSecurityHeaders(response);
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));

    // Auto-set gate cookie for search engine bots so they see full page content
    if (isSearchEngineBot(userAgent) && !request.cookies.has("fayai_gate")) {
      response.cookies.set("fayai_gate", "bot-verified", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days for bots
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  // UPDATED: Now includes API routes for protection
  matcher: [
    // Match all paths except static files.
    //
    // ⚠️ Esta lista precisa crescer junto com os tipos de asset do site. TRÊS
    // vezes um arquivo estático novo voltou 404 sem explicação por não estar
    // aqui: em 26/07/2026 os GeoJSON do Radar (`json`) e o ícone 3D (`glb`), e
    // em 02/09/2026 o audiobook (`m4a`) — o formato em que os capítulos
    // narrados são entregues. Rotas de API não terminam nessas extensões, então
    // excluí-las não desprotege nada — mas esquecer de incluir custa uma hora
    // de depuração no lugar errado, porque o sintoma (404) aponta para o
    // arquivo e a causa está aqui.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|webm|mp4|m4v|mov|mp3|m4a|aac|wav|ogg|opus|woff|woff2|css|js|json|webmanifest|glb|gltf|hdr|ktx2|bin)$).*)"
  ]
};
