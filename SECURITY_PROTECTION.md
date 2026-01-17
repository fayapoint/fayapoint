# 🛡️ FayaPoint Security & Bot Protection System

## Overview

This document describes the comprehensive security measures implemented to protect against scraping, bot attacks, and unauthorized access.

## Problem Identified

- **75% credit usage** on Netlify (775.4/1000)
- **618 requests in 24 hours** with many RSC (`_rsc=`) requests
- Suspected scraping/bot activity targeting public pages

## Protection Layers Implemented

### 1. Middleware-Level Protection (`src/middleware.ts`)

**Features:**
- ✅ Global rate limiting (60 requests/min for normal users)
- ✅ Suspicious behavior scoring (0-100 scale)
- ✅ Automatic IP blocking for bad actors
- ✅ Honeypot path detection (WordPress, PHP probes)
- ✅ Known bad bot user agent blocking
- ✅ Strike system (3 rate limit violations = 1 hour block)
- ✅ Request fingerprinting for tracking

**Rate Limit Tiers:**
- `SUSPICIOUS`: 10 requests/min (high suspicion score)
- `NORMAL`: 60 requests/min (regular traffic)
- `TRUSTED`: 120 requests/min (authenticated users)
- `API`: 30 requests/min (API endpoints)
- `AUTH`: 5 requests/min (login/register)
- `IMAGE_GEN`: 3 requests/min (expensive AI operations)

### 2. Bot Detection Library (`src/lib/bot-detection.ts`)

**Detects and blocks:**
- SEO scrapers (Ahrefs, SEMrush, Majestic, etc.)
- AI training crawlers (GPTBot, CCBot, ClaudeBot, etc.)
- Vulnerability scanners (sqlmap, Nikto, Nmap, etc.)
- Generic scrapers (Python, Go, Java clients)
- Headless browsers (HeadlessChrome, PhantomJS)

**Suspicion scoring based on:**
- Missing/malformed user agent (+40)
- Known bad bot pattern (+50)
- Honeypot path access (+100)
- No referer on navigation (+10)
- No accept-language header (+15)
- High request count (+20-40)
- RSC without proper session (+15)

### 3. Netlify Configuration (`netlify.toml`)

**Features:**
- Aggressive caching headers for static content
- Security headers (X-Frame-Options, CSP, etc.)
- Attack path redirects (410 Gone for WordPress probes)
- Edge function hooks (ready for advanced protection)

### 4. Next.js Configuration (`next.config.ts`)

**Caching strategy:**
- Static pages: 1 hour cache, 24 hour stale-while-revalidate
- API routes: No cache, no indexing
- Public APIs: 1 hour edge cache
- Static assets: 1 year immutable cache

**Protected pages with caching:**
- `/ajuda`, `/faq`, `/recursos/*`
- `/instrutores`, `/carreiras`, `/parcerias`
- `/cursos/*`, `/ferramentas/*`

### 5. Robots.txt (Comprehensive)

**Blocks:**
- All RSC requests (`/*?_rsc=*`)
- 50+ known bad bot user agents
- Private paths (/api, /admin, /portal)
- Attack vectors (WordPress, PHP, etc.)

**Allows:**
- Search engines (Google, Bing, DuckDuckGo)
- Social media crawlers (for OG previews)

### 6. Cloudflare Turnstile CAPTCHA

**Components:**
- `src/components/security/TurnstileWidget.tsx` - Client widget
- `src/lib/turnstile.ts` - Server verification

**Usage:**
```tsx
import TurnstileWidget from "@/components/security/TurnstileWidget";

<TurnstileWidget
  onVerify={(token) => setTurnstileToken(token)}
  onError={() => setError("CAPTCHA failed")}
/>
```

**Environment variables needed:**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

### 7. Security Monitoring API

**Endpoint:** `GET /api/security/stats`

Returns:
- Number of blocked IPs
- Active rate limit strikes
- High traffic IP list
- Blocked IP samples

**Manual block/unblock:** `POST /api/security/stats`
```json
{
  "action": "block",
  "ip": "1.2.3.4",
  "duration": 3600
}
```

## Environment Variables Required

```env
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Cloudflare Turnstile (for CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx
TURNSTILE_SECRET_KEY=xxx

# Admin API (for security stats)
ADMIN_API_KEY=your-secure-key
```

## Expected Impact

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Credit usage | 75% | <30% |
| Bad bot requests | Unchecked | Blocked at edge |
| Rate limit violations | None | Tracked & blocked |
| Page cache hits | ~0% | ~80%+ |

## Monitoring

1. Check Netlify function logs for `[HONEYPOT]`, `[BAD_BOT]`, `[SUSPICIOUS]`, `[RATE_LIMITED]` entries
2. Use `/api/security/stats` to monitor blocked IPs
3. Review Netlify Analytics for traffic patterns

## Additional Recommendations

1. **Enable Netlify's built-in bot protection** if on Pro plan
2. **Consider Cloudflare** for additional DDoS protection
3. **Set up alerts** for unusual traffic spikes
4. **Review logs weekly** for new attack patterns

## Files Modified/Created

### New Files:
- `netlify.toml` - Netlify configuration
- `src/lib/bot-detection.ts` - Bot detection utilities
- `src/lib/turnstile.ts` - CAPTCHA verification
- `src/components/security/TurnstileWidget.tsx` - CAPTCHA widget
- `src/app/api/security/stats/route.ts` - Security monitoring API
- `SECURITY_PROTECTION.md` - This documentation

### Modified Files:
- `src/middleware.ts` - Comprehensive bot protection
- `next.config.ts` - Aggressive caching headers
- `public/robots.txt` - Comprehensive bot blocking
