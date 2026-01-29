# 🚨 Bandwidth Abuse Investigation Guide

**Created:** January 18, 2026  
**Issue:** 29.9 GB bandwidth in current period, 4.4 GB spike on Jan 17

---

## 🔍 IMMEDIATE ACTIONS - Netlify Dashboard

### 1. Check Per-Site Bandwidth
Go to **Netlify Dashboard → Team → Usage & billing → Bandwidth detail**

Look at "Top bandwidth usage per domain" - this will tell you WHICH of your 16 projects is consuming the most.

### 2. Check Function Logs
For each high-bandwidth site:
1. Go to **Site → Functions tab**
2. Click on any function to see **invocation logs**
3. Look for patterns: same IP, unusual paths, rapid requests

### 3. Download Analytics CSV
On the Usage page, click **"Download CSV"** to get detailed bandwidth data.

---

## 💻 Netlify CLI Commands

Install Netlify CLI if not already:
```bash
npm install -g netlify-cli
netlify login
```

### List All Sites (find which one is the problem)
```bash
netlify sites:list
```

### Get Site-Specific Bandwidth (requires site linking)
```bash
# Link to a specific site
netlify link --name YOUR_SITE_NAME

# View recent deploys and their stats
netlify deploy --list

# View function logs in real-time
netlify functions:serve
```

### Check Function Invocations
```bash
# Stream function logs live
netlify logs:function FUNCTION_NAME --site YOUR_SITE_ID
```

---

## 🕵️ Using Netlify Log Drains (Pro Feature)

If you have Netlify Pro, you can set up log drains to capture all traffic:

```bash
# Add a log drain to capture traffic
netlify log:add-drain --url https://your-logging-service.com/webhook
```

---

## 📊 What to Look For

### Red Flags in Logs:
1. **Same IP making 100s of requests** - Bot/scraper
2. **Requests to `/api/*` without proper headers** - API abuse
3. **Requests from data center IPs** (AWS, DigitalOcean, Google Cloud)
4. **Unusual User-Agents** - Python, Go, Java, curl
5. **Requests to non-existent paths** - Vulnerability scanner

### Common Abusive Patterns:
- `/api/public/gallery?limit=9999` - Trying to dump your database
- `/api/user/dashboard` without auth - Probing
- Rapid RSC requests (`?_rsc=xxxxx`) - SSR abuse
- Sequential page scraping - Bot crawling all pages

---

## 🛡️ PROTECTION IMPLEMENTED

### 1. Middleware Now Covers API Routes
The middleware matcher was changed from:
```typescript
// OLD - APIs were UNPROTECTED!
matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]

// NEW - APIs are now protected
matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|css|js)$).*)"]
```

### 2. API Rate Limiting
- **30 requests/minute** for all API routes
- **10 requests/minute** for data center IPs
- Automatic blocking after 2 rate limit violations

### 3. IP Blocklist
Edit `src/middleware.ts` to add IPs to `BLOCKED_IPS`:
```typescript
const BLOCKED_IPS: Set<string> = new Set([
  "1.2.3.4",  // Add abusive IPs here
  "5.6.7.8",
]);
```

### 4. Data Center IP Blocking
Requests from known cloud provider IP ranges (AWS, GCP, DigitalOcean, Linode) get stricter limits.

### 5. Logging
All API requests now logged with:
```
[API_ACCESS] timestamp | IP: xxx | Path: /api/xxx | UA: xxx
```

Check Netlify function logs for these entries!

---

## 🔧 Admin Bandwidth Report API

Use this endpoint to see which IPs are hitting your site:

```bash
# Get bandwidth report (requires admin auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://fayapoint.com/api/admin/bandwidth-report

# Block an IP manually
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4", "action": "block", "duration": 86400}' \
  https://fayapoint.com/api/admin/bandwidth-report
```

---

## 🚀 DEPLOY CHANGES

After reviewing this, deploy the protection updates:

```bash
cd c:\WORKS\Consultoria\fayapoint-ai
git add .
git commit -m "fix: Add aggressive rate limiting and API protection"
git push
```

---

## 📞 Contact Netlify Support

If abuse continues, contact Netlify support with:
1. Your team name: **FAYA**
2. The suspicious traffic dates: **Jan 9-17, 2026**
3. Ask them to check their server-side logs for:
   - Top IPs by request count
   - Top paths by bandwidth
   - Geographic distribution of requests

They have access to data you can't see in the dashboard.

---

## ⚡ NUCLEAR OPTION: Take Site Offline

If nothing else works:

1. **Pause the site** in Netlify dashboard (Site settings → Danger zone)
2. Deploy only the maintenance site
3. Wait for abuse to stop
4. Re-deploy with new protection

---

## 🔮 After Investigation

Once you identify the abusive IPs:

1. Add them to `BLOCKED_IPS` in middleware
2. Consider using Cloudflare in front of Netlify for better DDoS protection
3. Set up Netlify Analytics (paid) for better insights
4. Consider moving to a plan with better abuse protection

---

**Files Modified:**
- `src/middleware.ts` - API protection, IP blocking, rate limiting
- `netlify.toml` - Aggressive redirect rules
- `src/app/api/admin/bandwidth-report/route.ts` - NEW: Admin monitoring endpoint
