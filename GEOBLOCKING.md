# 🛡️ Geoblocking - Brazil Only Access

This document describes the geoblocking implementation that restricts site access to **Brazil only**.

## Overview

The site is protected by a **dual-layer geoblocking system**:

1. **Netlify Edge Function** (`netlify/edge-functions/geoblock.ts`) - Blocks at the CDN edge
2. **Next.js Middleware** (`src/middleware.ts`) - Blocks at the application level

Both layers work together to ensure maximum protection against non-Brazilian traffic.

## How It Works

### Request Flow

```
User Request → Netlify CDN → Edge Function (geoblock) → Next.js Middleware → Application
                                    ↓
                           Check country code
                                    ↓
                         BR? → Allow through
                         Other? → Redirect to /blocked
```

### Country Detection

The system checks these headers (in order):
1. `x-nf-client-geo-country` (Netlify)
2. `x-country` (Netlify legacy)
3. `x-vercel-ip-country` (Vercel)
4. `cf-ipcountry` (Cloudflare)
5. `request.geo?.country` (Next.js runtime)

## Configuration

### Allowed Countries
Currently only **BR (Brazil)** is allowed. To add more countries:

```typescript
// In middleware.ts
const GEOBLOCK_CONFIG = {
  allowedCountries: new Set(["BR", "PT"]), // Add Portugal
  // ...
};

// In netlify/edge-functions/geoblock.ts
const ALLOWED_COUNTRIES = new Set(["BR", "PT"]);
```

### Bypass Paths
These paths are always accessible regardless of country:
- `/blocked` - The blocked message page
- `/api/health` - Health check endpoint
- `/api/webhooks/*` - External webhook endpoints
- `/api/payments/webhook` - Asaas payment webhooks
- `/api/pod/webhooks/*` - POD webhooks (Printify, Prodigi)
- `/_next/*` - Next.js assets
- `/favicon.ico`, `/robots.txt`, `/sitemap.xml`

### Environment Variables

```env
# Optional: Custom bypass secret for admin access from abroad
GEOBLOCK_BYPASS_SECRET=your-secret-here
```

## Testing

### Local Development

In development mode, geoblocking is permissive (unknown country = allow).

To simulate different countries, add `?_geo=XX` to any URL:

```
http://localhost:3000/?_geo=US    # Simulates US visitor (blocked)
http://localhost:3000/?_geo=BR    # Simulates Brazil visitor (allowed)
http://localhost:3000/?_geo=CN    # Simulates China visitor (blocked)
```

### Run Test Script

```bash
# Start dev server first
npm run dev

# In another terminal, run tests
npx ts-node scripts/test-geoblock.ts
```

### Manual Testing with cURL

```bash
# Test from Brazil (allowed)
curl -I "http://localhost:3000/?_geo=BR"

# Test from US (blocked - should redirect)
curl -I "http://localhost:3000/?_geo=US"

# Test bypass path (always allowed)
curl -I "http://localhost:3000/blocked?_geo=US"

# Test with bypass header (always allowed)
curl -I -H "x-geobypass-secret: fayapoint-bypass-2024" "http://localhost:3000/?_geo=US"
```

## Admin Bypass

If you need to access the site from outside Brazil:

### Option 1: Bypass Header
Add this header to your requests:
```
x-geobypass-secret: fayapoint-bypass-2024
```

Or set a custom secret via environment variable:
```env
GEOBLOCK_BYPASS_SECRET=my-custom-secret
```

### Option 2: Browser Extension
Use a header injection extension (like ModHeader) to add:
- Header Name: `x-geobypass-secret`
- Header Value: `fayapoint-bypass-2024` (or your custom secret)

### Option 3: VPN to Brazil
Use a VPN with a Brazilian server to appear as a Brazil visitor.

## Monitoring

Check logs for geoblocking activity:

```
[GEOBLOCK] Blocked: IP=x.x.x.x, Country=US, Path=/, UA=...
[GEOBLOCK_EDGE] Blocked: Country=CN, Path=/portal, IP=x.x.x.x
[GEOBLOCK_UNKNOWN] IP=x.x.x.x, Path=/ - allowing (unknown country)
```

## Disabling Geoblocking

To temporarily disable geoblocking:

### Option 1: Environment Variable (Recommended)
```env
GEOBLOCK_ENABLED=false
```

### Option 2: Code Change
```typescript
// In middleware.ts
const GEOBLOCK_CONFIG = {
  enabled: false, // Disable geoblocking
  // ...
};
```

## Blocked Page

Non-Brazilian visitors are redirected to `/blocked` which shows:
- Message in Portuguese and English
- Detected country code
- Attempted path
- Contact information

## Security Considerations

1. **VPN Detection**: Some users may use VPNs to bypass geoblocking. Consider adding VPN detection if needed.

2. **Data Center IPs**: The existing bot protection already blocks many data center IPs which helps prevent automated bypassing.

3. **Webhook Security**: Ensure your webhook endpoints have additional authentication (API keys, signatures) since they bypass geoblocking.

4. **Bypass Secret**: Keep the bypass secret confidential and rotate it periodically.

## Cost Savings

This implementation should significantly reduce costs by:
- Blocking malicious traffic at the CDN edge (before hitting serverless functions)
- Reducing database queries from blocked regions
- Preventing scraping and attacks from US/China/Hong Kong

## Troubleshooting

### "I'm in Brazil but getting blocked"

1. Check if using a VPN - disable it
2. Check your ISP - some may route through other countries
3. Try the bypass header temporarily
4. Check `/api/health` to see what country is detected

### "Webhooks are failing"

Ensure webhook paths are in the bypass list:
- `/api/payments/webhook`
- `/api/pod/webhooks/*`
- `/api/webhooks/*`

### "Edge function not working"

1. Verify `netlify/edge-functions/geoblock.ts` exists
2. Check `netlify.toml` has the edge function configured
3. Redeploy to Netlify

---

**Last Updated**: January 2026
**Implemented By**: Cascade AI
