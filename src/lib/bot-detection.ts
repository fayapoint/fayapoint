// =============================================================================
// BOT DETECTION & SECURITY UTILITIES
// =============================================================================

// Known bad bot user agents - scrapers, crawlers, vulnerability scanners
export const BAD_BOT_PATTERNS = [
  // Vulnerability scanners
  "sqlmap", "nikto", "nmap", "masscan", "zgrab", "gobuster", "dirbuster",
  "wpscan", "jorgee", "censys", "shodan", "nuclei", "httpx", "whatweb",
  
  // SEO crawlers (aggressive, ignore robots.txt)
  "ahrefsbot", "semrushbot", "mj12bot", "dotbot", "blexbot", "dataforseobot",
  "serpstatbot", "seokicks", "sistrix", "rogerbot", "screaming frog",
  
  // AI training crawlers
  "gptbot", "ccbot", "anthropic-ai", "claudebot", "bytespider", "petalbot",
  "amazonbot", "cohere-ai", "diffbot", "facebookbot", "ia_archiver",
  
  // Generic scrapers
  "scrapy", "python-requests", "go-http-client", "java/", "libwww-perl",
  "wget", "curl/", "httpclient", "okhttp", "axios", "node-fetch",
  "python-urllib", "httpunit", "webcopier", "offline explorer",
  "teleport", "webcapture", "webzip", "httrack", "sitesucker",
  
  // Headless browsers (often used for scraping)
  "headlesschrome", "phantomjs", "slimerjs",
  
  // Other known bad actors
  "megaindex", "majestic", "bubing", "yandexbot", "baiduspider",
  "sogou", "exabot", "konqueror", "archive.org_bot",
];

// Patterns that indicate suspicious automated behavior
// RELAXED: Only match clear automation signatures, not partial matches
export const SUSPICIOUS_PATTERNS = [
  // Empty or minimal user agent
  /^$/,
  /^mozilla\/[0-9.]+$/i,
  /^-$/,
  
  // Unusual characters in user agent
  /[\x00-\x1f]/,
  
  // Only match obvious bot patterns at word boundaries (not partial matches)
  // Removed aggressive patterns that caused false positives
  /\bscraper\b/i,
  /\bcrawler\b/i,
];

// Good bots we want to allow (search engines, social media)
export const GOOD_BOTS = [
  "googlebot",
  "bingbot", 
  "duckduckbot",
  "slurp", // Yahoo
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "applebot",
  "pinterest",
];

// Paths that bots commonly probe (attack vectors)
export const HONEYPOT_PATHS = [
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/wp-includes",
  "/wordpress",
  "/xmlrpc.php",
  "/admin.php",
  "/config.php",
  "/setup.php",
  "/install.php",
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
  "/cgi-bin",
  "/shell",
  "/cmd",
  "/exec",
  "/eval",
  "/actuator",
  "/manager",
  "/jenkins",
  "/solr",
  "/struts",
  "/debug",
  "/test",
  "/console",
  "/elmah",
  "/trace.axd",
  "/server-status",
];

// Rate limit tiers based on behavior
// NOTE: A single Next.js page navigation generates 20-40+ sub-requests
// (HTML, RSC payloads, prefetches, layout RSC, API calls, images)
// Limits must account for this to avoid blocking legitimate users.
export const RATE_LIMITS = {
  // Strict limit for suspicious IPs (still allows basic browsing)
  SUSPICIOUS: { requests: 40, windowSeconds: 60 },
  // Normal limit for regular traffic
  NORMAL: { requests: 250, windowSeconds: 60 },
  // Higher limit for authenticated users
  TRUSTED: { requests: 500, windowSeconds: 60 },
  // API endpoints (authenticated users make many API calls per page)
  API: { requests: 120, windowSeconds: 60 },
  // Auth API endpoints (login, register)
  AUTH: { requests: 15, windowSeconds: 60 },
  // Image generation (expensive)
  IMAGE_GEN: { requests: 5, windowSeconds: 60 },
} as const;

/**
 * Check if user agent matches a bad bot pattern
 */
export function isBadBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  
  // Check against bad bot patterns
  for (const pattern of BAD_BOT_PATTERNS) {
    if (ua.includes(pattern)) {
      return true;
    }
  }
  
  // Check against suspicious regex patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(ua)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if user agent is a known good bot
 */
export function isGoodBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return GOOD_BOTS.some(bot => ua.includes(bot));
}

/**
 * Check if path is a honeypot (commonly attacked path)
 */
export function isHoneypotPath(pathname: string): boolean {
  const lowerPath = pathname.toLowerCase();
  return HONEYPOT_PATHS.some(hp => lowerPath.includes(hp));
}

/**
 * Calculate suspicion score for a request (0-100)
 * Higher score = more suspicious
 */
export function calculateSuspicionScore(params: {
  userAgent: string;
  pathname: string;
  hasReferer: boolean;
  acceptLanguage: string;
  acceptEncoding: string;
  isRSC: boolean;
  requestCount: number;
}): number {
  let score = 0;
  
  const ua = params.userAgent.toLowerCase();
  
  // No user agent = very suspicious
  if (!params.userAgent || params.userAgent.length < 10) {
    score += 40;
  }
  
  // Known bad bot
  if (isBadBot(params.userAgent)) {
    score += 50;
  }
  
  // Honeypot path access = definitely bot
  if (isHoneypotPath(params.pathname)) {
    score += 100;
  }
  
  // No referer on direct navigation = mildly suspicious
  // (First visit or bookmark navigation legitimately has no referer)
  if (!params.hasReferer && !params.pathname.endsWith('/') && !params.isRSC) {
    score += 5;
  }
  
  // No accept-language = likely bot
  if (!params.acceptLanguage) {
    score += 15;
  }
  
  // No accept-encoding = likely bot
  if (!params.acceptEncoding) {
    score += 10;
  }
  
  // High request count = scraping
  if (params.requestCount > 30) {
    score += 20;
  } else if (params.requestCount > 60) {
    score += 40;
  }
  
  // RSC request without referer = only mildly suspicious
  // (Next.js prefetches generate RSC requests without referer normally)
  if (params.isRSC && !params.hasReferer) {
    score += 5;
  }
  
  // Python/Go/Java clients without proper headers
  if (ua.includes('python') || ua.includes('go-http') || ua.includes('java/')) {
    score += 30;
  }
  
  // Reduce score for good bots
  if (isGoodBot(params.userAgent)) {
    score = Math.max(0, score - 50);
  }
  
  return Math.min(100, score);
}

/**
 * Get appropriate rate limit based on request characteristics
 */
export function getRateLimitTier(params: {
  suspicionScore: number;
  pathname: string;
  isAuthenticated: boolean;
}): typeof RATE_LIMITS[keyof typeof RATE_LIMITS] {
  const { suspicionScore, pathname, isAuthenticated } = params;
  
  // Very suspicious = strict limit (raised threshold to reduce false positives)
  if (suspicionScore >= 60) {
    return RATE_LIMITS.SUSPICIOUS;
  }
  
  // Auth API endpoints only (NOT page routes like /pt-BR/login)
  if (pathname.startsWith('/api/auth/')) {
    return RATE_LIMITS.AUTH;
  }
  
  // Image generation
  if (pathname.includes('/ai/generate')) {
    return RATE_LIMITS.IMAGE_GEN;
  }
  
  // API endpoints
  if (pathname.startsWith('/api/')) {
    return RATE_LIMITS.API;
  }
  
  // Authenticated users get more leeway
  if (isAuthenticated) {
    return RATE_LIMITS.TRUSTED;
  }
  
  return RATE_LIMITS.NORMAL;
}

/**
 * Generate a fingerprint for the request (for tracking across requests)
 */
export function generateRequestFingerprint(params: {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
}): string {
  const data = `${params.ip}|${params.userAgent}|${params.acceptLanguage}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
