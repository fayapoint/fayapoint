# Fayapoint Security Analysis & Solution

## ✅ IMPLEMENTED SOLUTION (Ready to Deploy)

### Changes Made:
1. **Edge Function v2** (`netlify/edge-functions/geoblock.ts`)
   - STRICT MODE: Unknown country = BLOCKED
   - Returns 403 directly (not redirect) = ~50 bytes vs ~20KB
   - Webhooks whitelisted: Asaas, Printify, Prodigi
   - Cache 403 responses for 24h at CDN

2. **Middleware Cleanup** (`src/middleware.ts`)
   - Geoblocking DISABLED (edge handles it)
   - Suspicion threshold raised to 100 (no false positives)
   - Removed IP blocklist that was causing 403s

3. **netlify.toml** - Edge function re-enabled

### Webhook Whitelist:
- `/api/payments/webhook` - Asaas (Brazil)
- `/api/pod/webhooks/printify` - Printify (US/EU)
- `/api/webhooks/printify` - Printify alternate
- `/api/pod/prodigi/webhooks` - Prodigi (UK)
- `/api/webhooks/prodigi` - Prodigi alternate
- `/api/webhooks` - General webhooks
- `/api/fulfillment` - Fulfillment API

---

## Current Situation (Critical)

### Credit Consumption (Jan 9 - Feb 8)
| Resource | Usage | Credits | % of Total |
|----------|-------|---------|------------|
| Web Requests | 2,116,246 | 634.9 | **52%** |
| Bandwidth | 33.76 GB | 337.6 | **28%** |
| Production Deploys | 16 | 240 | 20% |
| **Total Consumed** | - | **1,212.5** | - |
| **Remaining** | - | **287.5** | - |

### Attack Pattern
- **Spike**: Jan 15 = 7.4 GB in ONE DAY (attack peak)
- **Origin**: 99.9% from US and China
- **Type**: Scraping/crawling bots consuming bandwidth and serverless invocations

---

## Root Cause Analysis

### Problem 1: Edge Function Not Blocking Effectively

**Current edge function behavior** (`netlify/edge-functions/geoblock.ts`):
```
Line 56-61: IF country detected AND not Brazil → redirect to /blocked
Line 63-67: IF country UNKNOWN → ALLOW through (permissive mode)
```

**Issues:**
1. **Permissive mode**: Unknown country = allowed. Sophisticated attackers can hide geo.
2. **Redirect instead of block**: Redirecting to `/blocked` still consumes:
   - Bandwidth (serving the blocked page)
   - Serverless invocations (page render)
3. **Edge function was commented out** in netlify.toml (my earlier debug change)

### Problem 2: You Got 403 From Brazil

The 403 you received was **NOT from the edge function** (which does 307 redirect).
It came from the **middleware** (`src/middleware.ts`), likely due to:

1. **IP already in Redis blocklist** from previous rate limiting (lines 361-374 - now commented)
2. **Bot detection false positive** (lines 288-292)
3. **Suspicion score too high** (lines 403-413)

The middleware runs as a **serverless function** = costs credits on EVERY request.

### Problem 3: Architecture Flaw

```
Current Flow (EXPENSIVE):
Request → Edge (free) → Middleware ($$) → Page ($$)
                ↓
        Even blocked requests hit middleware!
```

```
Optimal Flow (CHEAP):
Request → Edge Blocks Non-BR (free, returns 403) → Done
Request → Edge Allows BR → Middleware → Page
```

---

## Cost Analysis

### Why 2.1M Requests Cost So Much

Every request that reaches the middleware = 1 serverless invocation.
Even if middleware blocks it, the invocation already happened.

**The edge function is FREE**. Blocking at the edge = $0.

### Bandwidth Waste

Redirecting blocked users to `/blocked` page:
- Page is ~15-20KB with JS/CSS
- If 1M blocked requests × 20KB = **20GB of bandwidth wasted**

Returning `403` directly from edge:
- Response: ~20 bytes
- 1M blocked requests × 20 bytes = **20MB** (1000x cheaper)

---

## Proposed Solution: Ultra-Aggressive Edge-First Blocking

### Strategy

1. **Block at Edge** - Return 403 directly, no redirect, no page render
2. **Strict Mode** - Unknown country = BLOCKED (not allowed)
3. **Minimal Response** - Just "Forbidden" text, no HTML
4. **Remove Middleware Geoblocking** - Redundant and expensive
5. **Simplify Middleware** - Remove aggressive rate limiting that causes false positives

### New Edge Function Design

```typescript
// Key changes:
// 1. STRICT MODE: Unknown country = blocked
// 2. Return 403 directly instead of redirect (saves bandwidth)
// 3. Minimal response body
// 4. Cache the 403 response at edge
```

### What This Achieves

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Non-BR Request Cost | ~$0.001 (middleware + page) | $0 (edge block) | **100%** |
| Blocked Response Size | ~20KB (page) | ~20 bytes | **99.9%** |
| False Positive Risk | High (middleware complexity) | Low (simple geo check) | Significant |

---

## Implementation Plan

### Phase 1: New Edge Function (geoblock-v2.ts)
- Strict mode (unknown = blocked)
- Return 403 directly with minimal body
- Add cache headers for blocked responses
- Whitelist webhook paths

### Phase 2: Middleware Cleanup
- Remove geoblocking (redundant)
- Remove IP blocklist check (was causing false positives)
- Keep only essential rate limiting for API abuse
- Lower suspicion thresholds

### Phase 3: Testing Strategy (Before Deploy)
- Test locally with `?_geo=BR` (should pass)
- Test locally with `?_geo=US` (should block)
- Test locally with no geo header (should block in strict mode)
- Verify webhooks still work

### Phase 4: Deploy & Monitor
- Single deploy with all changes
- Monitor Netlify logs for blocked requests
- Verify you can access from Brazil
- Check credit consumption after 1 hour

---

## Risk Mitigation

### What If Edge Blocking Breaks Brazil Access?

**Safeguard 1**: Bypass header for emergency access
```
Header: x-geobypass-secret: [your-secret]
```

**Safeguard 2**: Query param for testing
```
URL: ?_geo=BR (forces Brazil detection)
```

**Safeguard 3**: Keep middleware geoblocking as backup (but disabled by default)

### Rollback Plan

If the new edge function causes problems:
1. Comment out `[[edge_functions]]` in netlify.toml
2. Enable middleware geoblocking (`enabled: true`)
3. Redeploy

---

## Files to Modify

1. `netlify/edge-functions/geoblock.ts` - Rewrite for strict mode + 403
2. `netlify.toml` - Re-enable edge function
3. `src/middleware.ts` - Remove redundant checks, fix false positives

---

## Questions Before Proceeding

1. **Webhook paths**: Are there any external services that need to reach your API from outside Brazil? (Payment providers, etc.)

2. **Your IP**: When you accessed and got 403, were you using a VPN or unusual network?

3. **Acceptable risk**: Is it okay to potentially block the rare Brazilian user whose geo can't be detected (strict mode), in exchange for blocking all attackers?

