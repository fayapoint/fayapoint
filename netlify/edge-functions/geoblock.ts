import type { Context, Config } from "@netlify/edge-functions";

// =============================================================================
// GEOBLOCKING EDGE FUNCTION v2 - STRICT MODE - BRAZIL ONLY
// This runs at the CDN edge BEFORE anything else for MAXIMUM protection
// Returns 403 directly (not redirect) to minimize bandwidth consumption
// =============================================================================

const ALLOWED_COUNTRIES = new Set(["BR"]);

// Whitelisted IPs - always allowed regardless of country
const WHITELISTED_IPS = new Set([
  "76.13.234.38", // Admin server
]);

// Paths that MUST bypass geoblocking (webhooks from external services)
const BYPASS_PATHS = [
  // Internal
  "/blocked",
  "/api/health",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/google302d853608efe717.html", // Google Search Console verification file

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

  // Meta data deletion callback (called by Meta servers)
  "/api/auth/data-deletion",

  // Legal/policy pages (must be accessible for Meta, Google, app stores)
  "/pt-BR/privacidade",
  "/pt-BR/termos",
  "/pt-BR/exclusao-de-dados",
  "/en/privacidade",
  "/en/termos",
  "/en/exclusao-de-dados",
];

// Search crawlers whose UA claim MUST be verified against the official IP
// ranges published by Google/Microsoft. UA-only allowlisting let scrapers with
// fake "Googlebot" UAs drain 78GB of bandwidth in Jan/2026.
const VERIFIED_CRAWLER_UAS = [
  "googlebot",             // Google search crawler (also matches Googlebot-Image)
  "google-inspectiontool", // Search Console URL inspection / live test
  "google-site-verification", // Search Console ownership verification
  "storebot-google",       // Google Shopping crawler
  "bingbot",               // Bing search crawler
];

// Motores de RESPOSTA de IA — liberados por UA.
//
// O robots.txt abriu para eles em 21/07/2026 com o argumento certo: quem só
// coleta para treino consome e não devolve nada, mas quem responde perguntas
// CITA a fonte e manda usuário real — e o nosso público pergunta "qual curso
// de IA fazer" dentro do ChatGPT e do Perplexity.
//
// Só que a permissão nunca valeu: eles rastreiam de IPs fora do Brasil, então
// caíam no bloqueio geográfico e recebiam 403. O robots dizia "entre" e a
// borda dizia "não". Sem esta lista, aquela decisão era letra morta.
//
// Vão por UA, e não por faixa de IP, porque nenhum deles publica faixas
// oficiais como o Google e a Microsoft. O risco de falsificação é o mesmo dos
// bots sociais: buscam páginas avulsas, não varrem o site.
const ANSWER_ENGINE_UAS = [
  "oai-searchbot",   // busca do ChatGPT
  "chatgpt-user",    // navegação a pedido de um usuário do ChatGPT
  "perplexitybot",   // índice do Perplexity
  "perplexity-user", // navegação a pedido de um usuário do Perplexity
  "claudebot",       // busca do Claude
];

// Preview/validator bots allowed by UA alone — they fetch single pages for
// link previews, so spoofing them has little scraping value.
const SOCIAL_BOT_UAS = [
  "facebookexternalhit",   // Meta URL validator
  "facebot",               // Facebook crawler
  "facebookcatalog",       // Facebook catalog
  "twitterbot",            // Twitter/X card validator
  "linkedinbot",           // LinkedIn preview
  "whatsapp",              // WhatsApp link preview
  "telegrambot",           // Telegram link preview
  "pinterest",             // Pinterest crawler
  "posthog",               // PostHog analytics
];

// Official crawler IP range feeds (Google + Bing publish these as JSON)
const CRAWLER_RANGE_SOURCES = [
  "https://developers.google.com/static/search/apis/ipranges/googlebot.json",
  "https://developers.google.com/static/search/apis/ipranges/special-crawlers.json",
  "https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json",
  "https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers-google.json",
  "https://www.bing.com/toolbox/bingbot.json",
];

const RANGES_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Prazo para o Google e a Bing responderem com as faixas de IP.
 *
 * ⚠️ Sem isto, um `fetch` pendurado pendura o Googlebot junto.
 *
 * Estas cinco buscas acontecem no meio do caminho de quem se diz Googlebot ou
 * bingbot, e o `Promise.allSettled` só termina quando a ÚLTIMA termina. Sem
 * prazo, uma dessas URLs lenta segurava a requisição até a borda desistir — e
 * quem via o erro era o rastreador do Google, na página que a gente quer
 * indexar. O `isVerifiedCrawlerIp` já sabe cair para `null` ("não consegui
 * conferir") e a chamadora deixa passar, então perder as faixas é barato:
 * custa um bot não verificado. Ficar esperando é que era caro.
 */
const RANGES_FETCH_TIMEOUT_MS = 3_000;

/**
 * Quanto esperar antes de tentar de novo quando as cinco buscas falham.
 *
 * Sem isto, feed fora do ar significava CINCO buscas externas por requisição
 * de rastreador, para sempre — `crawlerRanges` continuava `null` e nada
 * lembrava da tentativa. O intervalo curto mantém a recuperação rápida sem
 * transformar uma queda do Google numa enxurrada saindo da nossa borda.
 */
const RANGES_RETRY_MS = 5 * 60 * 1000;

let crawlerRanges: { v4: Array<[bigint, bigint]>; v6: Array<[bigint, bigint]> } | null = null;
let rangesFetchedAt = 0;
let ultimaFalhaEm = 0;

function ipToBigInt(ip: string): { value: bigint; bits: number } | null {
  if (ip.includes(":")) {
    const sections = ip.split("::");
    if (sections.length > 2) return null;
    const head = sections[0] ? sections[0].split(":") : [];
    const tail = sections.length === 2 && sections[1] ? sections[1].split(":") : [];
    const missing = 8 - head.length - tail.length;
    if (missing < 0 || (sections.length === 1 && missing !== 0)) return null;
    const groups = [...head, ...Array(missing).fill("0"), ...tail];
    let value = BigInt(0);
    for (const g of groups) {
      const n = parseInt(g || "0", 16);
      if (Number.isNaN(n) || n < 0 || n > 0xffff) return null;
      value = (value << BigInt(16)) | BigInt(n);
    }
    return { value, bits: 128 };
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = BigInt(0);
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    value = (value << BigInt(8)) | BigInt(n);
  }
  return { value, bits: 32 };
}

function cidrToRange(cidr: string): { start: bigint; end: bigint; bits: number } | null {
  const [ip, prefixStr] = cidr.split("/");
  const parsed = ipToBigInt(ip);
  if (!parsed) return null;
  const prefix = prefixStr === undefined ? parsed.bits : Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > parsed.bits) return null;
  const hostBits = BigInt(parsed.bits - prefix);
  const start = (parsed.value >> hostBits) << hostBits;
  const end = start + ((BigInt(1) << hostBits) - BigInt(1));
  return { start, end, bits: parsed.bits };
}

async function loadCrawlerRanges() {
  if (crawlerRanges && Date.now() - rangesFetchedAt < RANGES_TTL_MS) return crawlerRanges;
  // Falhou há pouco: não repete as cinco buscas agora.
  if (!crawlerRanges && Date.now() - ultimaFalhaEm < RANGES_RETRY_MS) return null;

  const v4: Array<[bigint, bigint]> = [];
  const v6: Array<[bigint, bigint]> = [];
  const results = await Promise.allSettled(
    CRAWLER_RANGE_SOURCES.map((u) =>
      fetch(u, { signal: AbortSignal.timeout(RANGES_FETCH_TIMEOUT_MS) }).then((r) => r.json())
    )
  );
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    for (const p of res.value?.prefixes ?? []) {
      const cidr = p.ipv4Prefix || p.ipv6Prefix;
      if (!cidr) continue;
      const parsed = cidrToRange(cidr);
      if (!parsed) continue;
      (parsed.bits === 32 ? v4 : v6).push([parsed.start, parsed.end]);
    }
  }
  if (v4.length || v6.length) {
    crawlerRanges = { v4, v6 };
    rangesFetchedAt = Date.now();
    ultimaFalhaEm = 0;
  } else {
    ultimaFalhaEm = Date.now();
  }
  return crawlerRanges;
}

// true = IP is in the official ranges; false = definitely not; null = feeds
// unreachable (caller must fail open — never block a real Googlebot by accident)
async function isVerifiedCrawlerIp(ip: string | undefined): Promise<boolean | null> {
  if (!ip) return false;
  const parsed = ipToBigInt(ip);
  if (!parsed) return false;
  const ranges = await loadCrawlerRanges();
  if (!ranges) return null;
  const list = parsed.bits === 32 ? ranges.v4 : ranges.v6;
  return list.some(([start, end]) => parsed.value >= start && parsed.value <= end);
}

/**
 * Sem valor padrão, de propósito.
 *
 * Antes caía em `"fayapoint-bypass-2024"` quando a variável não estava
 * configurada — uma senha fixa, escrita no código, que abre o site inteiro de
 * qualquer país. Agora, se `GEOBLOCK_BYPASS_SECRET` não existir, o bypass
 * simplesmente não existe (o `null` abaixo nunca casa com um cabeçalho, porque
 * a comparação só acontece quando o segredo está definido).
 */
const BYPASS_SECRET = Netlify.env.get("GEOBLOCK_BYPASS_SECRET") || null;

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
  // 1.5. WHITELISTED IPS - Always allowed regardless of country
  // =========================================================================
  if (context.ip && WHITELISTED_IPS.has(context.ip)) {
    return context.next();
  }

  // =========================================================================
  // 1.6. CRAWLERS - Search bots verified by official IP ranges, social by UA
  // =========================================================================
  const uaLower = userAgent.toLowerCase();

  const claimsSearchCrawler = VERIFIED_CRAWLER_UAS.some((bot) => uaLower.includes(bot));
  if (claimsSearchCrawler) {
    const verified = await isVerifiedCrawlerIp(context.ip);
    if (verified === false) {
      // UA claims Googlebot/bingbot but the IP is outside the published ranges
      return blockRequest("SPOOFED_BOT", pathname, context.ip || "unknown", userAgent);
    }
    // true = IP verified; null = range feeds unreachable, fail open so a real
    // Googlebot is never blocked by our own outage
    console.log(`[GEOBLOCK_BOT] Search crawler allowed (${verified === null ? "failopen" : "ip-verified"}): UA=${userAgent.slice(0, 80)}, Path=${pathname}`);
    return context.next();
  }

  const isAnswerEngine = ANSWER_ENGINE_UAS.some((bot) => uaLower.includes(bot));
  if (isAnswerEngine) {
    console.log(`[GEOBLOCK_BOT_BYPASS] Answer engine: UA=${userAgent.slice(0, 80)}, Path=${pathname}`);
    return context.next();
  }

  const isSocialBot = SOCIAL_BOT_UAS.some((bot) => uaLower.includes(bot));
  if (isSocialBot) {
    console.log(`[GEOBLOCK_BOT_BYPASS] Social bot: UA=${userAgent.slice(0, 80)}, Path=${pathname}`);
    return context.next();
  }

  // =========================================================================
  // 2. BYPASS SECRET - For admin access from anywhere
  // =========================================================================
  const bypassHeader = request.headers.get("x-geobypass-secret");
  if (BYPASS_SECRET && bypassHeader === BYPASS_SECRET) {
    return context.next();
  }

  // =========================================================================
  // 3. TEST OVERRIDE - simular país com ?_geo=XX
  //
  // ⚠️ ISTO ERA UM BYPASS COMPLETO DO BLOQUEIO, EM PRODUÇÃO.
  //
  // A versão anterior fazia `return context.next()` quando `?_geo` valia um
  // país permitido — ANTES de olhar o país de verdade. Efeito prático:
  // qualquer pessoa, de qualquer lugar do mundo, entrava no site inteiro
  // digitando `fayai.com.br/?_geo=BR`. Não era preciso segredo, cabeçalho nem
  // ferramenta: um parâmetro na barra de endereço.
  //
  // Agora o override só vale para BLOQUEAR (testar `?_geo=IN` continua
  // devolvendo 403, que é o que se quer poder testar em produção) e para
  // LIBERAR apenas em pré-visualização ou com o segredo — nunca no site
  // publicado só por causa do parâmetro.
  // =========================================================================
  const testGeo = url.searchParams.get("_geo");
  if (testGeo) {
    const testCountry = testGeo.toUpperCase();
    if (!ALLOWED_COUNTRIES.has(testCountry)) {
      return blockRequest(testCountry, pathname, context.ip || "unknown", userAgent);
    }
    // Simular país permitido só passa fora do site publicado. Em produção,
    // cai adiante e o país REAL decide.
    const contexto = Netlify.env.get("CONTEXT"); // "production" | "deploy-preview" | "branch-deploy" | "dev"
    if (contexto && contexto !== "production") {
      return context.next();
    }
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
  //
  // ⚠️ NÃO volte a esperar a resposta aqui. Foi isto que apareceu como
  // "This edge function has crashed / the edge function timed out".
  //
  // A versão anterior fazia:
  //
  //     const response = await context.next();
  //     const newResponse = new Response(response.body, response);
  //     newResponse.headers.set("x-geo-country", country);
  //
  // Três defeitos numa coisa só:
  //
  //  1. **O cabeçalho não servia para nada.** O único lugar do site que lê
  //     `x-geo-country` é `/api/health` — e `/api/health` está em
  //     `BYPASS_PATHS`, ou seja, sai no passo 1 e nunca chega aqui. O
  //     cabeçalho era escrito para um leitor que, por construção, não podia
  //     recebê-lo. (E `/api/health` já tenta antes o
  //     `x-nf-client-geo-country`, que a própria Netlify entrega.)
  //
  //  2. **Custava o site inteiro passando pela borda.** Cada página de HTML —
  //     a home tem 578 KB — era lida e reembrulhada num `Response` novo.
  //
  //  3. **Amarrava o relógio da borda ao servidor.** Esperando aqui, qualquer
  //     lentidão do origin virava "a função da borda quebrou": a pilha do
  //     incidente de 13/08/2026 apontava exatamente esta linha. Sem o `await`,
  //     origin lento continua sendo origin lento — que é a verdade, e que dá
  //     para consertar no lugar certo.
  //
  // Devolver sem valor é o "passe adiante" da Netlify: a resposta vai do
  // servidor ao visitante sem escala. O bloqueio continua idêntico — quem não
  // é do Brasil já foi barrado nos passos acima e nunca chega aqui.
  // =========================================================================
  return;
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
