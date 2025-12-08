# 🚨 FayaPoint Netlify Usage Crisis Analysis

**Generated:** December 8, 2025  
**Status:** CRITICAL - 75% usage reached, site taken offline  
**Objective:** Deep analysis of all features causing high Netlify usage and action plan

---

## 📊 Current Usage Summary (December 2025)

| Metric | October | November | December | Trend |
|--------|---------|----------|----------|-------|
| **Bandwidth** | 1.2 GB | 1.6 GB | 2.1 GB | ⬆️ +75% |
| **Web Requests** | 73K | 111K | 127K | ⬆️ +74% |
| **Serverless Functions** | 24K | 38K | **110K** | ⬆️ **358%** 🔴 |
| **Edge Functions** | 69 | 14K | 9.2K | ⬆️ Volatile |
| **Build Minutes** | 8 min | 103 min | 78 min | ⬆️ |
| **Projects** | 14/500 | | | |

### 💰 Cost Structure (Credits)
- **Production Deploys:** 15 credits each
- **Bandwidth:** 10 credits per GB
- **Web Requests:** 3 credits per 10K requests
- **Compute:** 5 credits per GB-hour
- **Form Submissions:** 1 credit each
- **AI Inference:** Varies by model

---

## 🔴 CRITICAL ISSUE: Serverless Functions Explosion

The **110K serverless function requests** in December (vs 24K in October = **4.5x increase**) is the primary cause. This is directly tied to API route usage.

---

## 📁 Complete API Inventory

The codebase has **59 API routes**. Each serverless function invocation counts toward the limit.

### 🔥 HIGH-IMPACT ROUTES (Called Frequently)

| Route | DB Queries | External APIs | Called From | Severity |
|-------|------------|---------------|-------------|----------|
| `/api/user/dashboard` | **6+ queries** | 0 | Portal load, every page visit | 🔴 CRITICAL |
| `/api/public/gallery` | 2 queries | 0 | Home page (CommunityGallery) | 🔴 CRITICAL |
| `/api/public/community-stats` | **4 queries** | 0 | Unknown (force-dynamic) | 🟠 HIGH |
| `/api/user/checkin` | 3-4 queries | 0 | Portal load (daily login) + every image gen | 🟠 HIGH |
| `/api/ai/generate-image` | 3 queries | OpenRouter + Cloudinary | Studio tab | 🟠 HIGH |
| `/api/ai/chat` | 2 queries | OpenRouter | AI Assistant (Pro only) | 🟠 HIGH |
| `/api/courses/access` | 2 queries | 0 | Courses tab in portal | 🟡 MEDIUM |
| `/api/user/creations` | 1 query | 0 | Studio tab | 🟡 MEDIUM |
| `/api/service-prices` | 1 query | 0 | Service builder | 🟡 MEDIUM |
| `/api/store/products` | **4 queries** | 0 | Store page | 🟡 MEDIUM |
| `/api/products` | 1 query | 0 | Multiple pages | 🟡 MEDIUM |

### `force-dynamic` Routes (Never Cached)

These routes bypass Next.js caching entirely:

1. `/api/calendar/next-slot/route.ts` - Never cached
2. `/api/gallery/route.ts` - Never cached  
3. `/api/pod/mockup/route.ts` - Never cached
4. `/api/pod/render-text/route.ts` - Never cached
5. `/api/public/community-stats/route.ts` - Never cached 🔴
6. `/api/public/gallery/route.ts` - Never cached 🔴
7. `/api/user/creations/route.ts` - Never cached

---

## 🔍 Detailed Analysis by Feature

### 1. `/api/user/dashboard` - THE BIGGEST PROBLEM

**Location:** `src/app/api/user/dashboard/route.ts` (318 lines)

**Database Operations Per Request:**
1. `dbConnect()` - MongoDB connection
2. `User.findById(userId)` - Fetch user
3. `CourseProgress.find({ userId })` - Fetch all course progress
4. `Order.find({ userId })` - Fetch all orders
5. **Secondary DB connection** to `fayapointProdutos` for proposals
6. `User.find({}).sort().limit(10)` - Fetch leaderboard (10 users)
7. `User.countDocuments()` - Count for user rank
8. `CourseProgress.find()` - Recent activity (7 days)

**Called:** Every time user visits `/portal` (on page load)

**Impact Calculation:**
- If 100 users visit portal daily: 100 × 8 queries × 30 days = **24,000 DB operations/month**
- Plus the serverless invocation itself

---

### 2. `/api/public/gallery` - HOME PAGE KILLER

**Location:** `src/app/api/public/gallery/route.ts`

**Marked:** `export const dynamic = 'force-dynamic'`

**Called:** Every home page visit via `CommunityGallery.tsx`
```javascript
useEffect(() => {
  const fetchGallery = async () => {
    const res = await fetch('/api/public/gallery?limit=50');
    // ...
  };
  fetchGallery();
}, []);
```

**Impact:** Every visitor to your home page triggers a serverless function + 2 DB queries

---

### 3. `/api/user/checkin` - DOUBLE CALLS

**Location:** `src/app/api/user/checkin/route.ts`

**Called From Portal Page:**
1. On initial load: `daily_login` action
2. After every image generation: `image_generated` action

**Each call does:**
- 1 `User.findById()`
- 1 `User.findByIdAndUpdate()` (potentially 2)
- Achievement checking loop

---

### 4. POD Store Panel - MULTIPLE API CALLS

**Location:** `src/components/portal/PODStorePanel.tsx` (3151 lines!)

**Potential API calls on tab activation:**
- `/api/pod/providers`
- `/api/pod/products`
- `/api/pod/blueprints`
- `/api/pod/orders`
- `/api/pod/earnings`

**Plus Printify/Prodigi external API calls**

---

### 5. Dropshipping Admin - HEAVY SCRAPING

**Location:** `src/app/api/admin/dropshipping/search/route.ts` (533 lines)

**External API calls per search:**
- Multiple product search APIs
- Google Shopping
- Brave Products
- Web scraping multiple platforms

**Impact:** Each admin search = massive external API usage

---

## 🏠 Home Page Analysis

**File:** `src/app/[locale]/page.tsx`

**Components loaded on every visit:**
```tsx
<HeroSection />           // Static
<ValuePropositionCTA />   // Static
<CommunityGallery />      // 🔴 FETCHES /api/public/gallery (50 images)
<ChatGPTAllowlistingBanner /> // Static
<WhatWeDoSection />       // Static
<ServicesCarousel />      // Static
<AIToolsMarquee />        // Static (50+ tool logos from external URLs)
<FeaturesSection />       // Static
<CourseCategoriesSection /> // Static
<TestimonialsSection />   // Static
<CTASection />            // Static
```

**Problem:** `CommunityGallery` triggers serverless function on EVERY home page visit.

---

## 📱 Portal Page Analysis

**File:** `src/app/[locale]/(site)/portal/page.tsx` (1766 lines)

**API calls on load:**
1. `/api/user/dashboard` - Always (main data)
2. `/api/user/checkin` - Always (daily login XP)

**Tab-specific API calls:**
- **Courses tab:** `/api/courses/access`
- **Studio tab:** `/api/user/creations` + `/api/ai/generate-image` (on generate)
- **POD Store tab:** Multiple POD APIs
- **Store tab:** `/api/store/products` or similar

**Impact:** 2 guaranteed serverless calls per portal visit, more per tab

---

## 🔢 Usage Estimation

### Scenario: 200 daily active users

| Action | API Calls | Daily | Monthly |
|--------|-----------|-------|---------|
| Home page visit | 1 (gallery) | 400 | 12,000 |
| Portal visit | 2 (dashboard + checkin) | 400 | 12,000 |
| Tab changes (avg 2/user) | 2 | 400 | 12,000 |
| Image generation | 2 (gen + checkin) | 100 | 3,000 |
| **TOTAL** | | **1,300** | **39,000** |

**But we're seeing 110K...** This suggests either:
1. More traffic than expected
2. Bots/crawlers hitting API endpoints
3. Frontend polling or re-renders causing duplicate calls
4. Past infinite loop issues (fixed but damage done)

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### 🔴 IMMEDIATE (Do First)

#### 1. Remove CommunityGallery from Home Page
```tsx
// src/app/[locale]/page.tsx
// COMMENT OUT or REMOVE:
// <CommunityGallery />
```
**Impact:** Eliminates 1 serverless call per home visit

#### 2. Add Caching to Public Gallery API
```typescript
// src/app/api/public/gallery/route.ts
// REMOVE: export const dynamic = 'force-dynamic';
// ADD:
export const revalidate = 3600; // Cache for 1 hour
```

#### 3. Add Caching to Community Stats
```typescript
// src/app/api/public/community-stats/route.ts
// REMOVE: export const dynamic = 'force-dynamic';
export const revalidate = 3600;
```

#### 4. Simplify Dashboard API
Split into smaller, cacheable endpoints:
- `/api/user/profile` - Just user data (cached 5 min)
- `/api/user/stats` - Just stats (cached 5 min)
- `/api/leaderboard` - Public, cached 10 min
- `/api/user/progress` - Course progress only

---

### 🟠 SHORT-TERM (This Week)

#### 5. Add SWR/React Query with Caching
```typescript
// Use SWR with deduplication
const { data } = useSWR('/api/user/dashboard', fetcher, {
  dedupingInterval: 60000, // 1 minute
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
});
```

#### 6. Debounce Tab Changes
Don't fetch immediately on tab click - wait 300ms to prevent rapid switching.

#### 7. Remove Duplicate Checkin Calls
The checkin for `image_generated` is redundant if you're already tracking in the generate-image route.

#### 8. Add API Rate Limiting
```typescript
// Simple in-memory rate limit per IP
const RATE_LIMIT = 100; // requests per minute
```

---

### 🟡 MEDIUM-TERM (This Month)

#### 9. Implement Edge Caching
Use Netlify Edge Functions for:
- Public gallery (ISR/SSG)
- Leaderboard
- Static content APIs

#### 10. Convert Heavy APIs to ISR (Incremental Static Regeneration)
```typescript
// For public data
export async function generateStaticParams() {
  return [{ locale: 'pt-BR' }, { locale: 'en' }];
}
export const revalidate = 300; // 5 minutes
```

#### 11. Move Images to CDN
Currently using Cloudinary which is good. Ensure images are served from cache.

#### 12. Implement Lazy Loading for Portal Tabs
Don't fetch any tab data until user actually clicks on it.

---

### 🟢 LONG-TERM (Architecture)

#### 13. Consider Serverless to Edge Migration
Edge functions are cheaper (included in more plans).

#### 14. Database Query Optimization
- Add indexes for frequent queries
- Use projection to fetch only needed fields
- Implement cursor-based pagination

#### 15. Implement Server-Sent Events for Leaderboard
Instead of polling, push updates.

---

## 📋 Feature-by-Feature Action Plan

### Features to DISABLE Immediately
1. ❌ `CommunityGallery` on home page
2. ❌ Community Stats widget (if exists)
3. ❌ Auto-leaderboard refresh

### Features to OPTIMIZE
1. 🔧 Dashboard API - Split and cache
2. 🔧 POD Store - Lazy load on tab click
3. 🔧 Dropshipping - Admin only, add rate limits

### Features to KEEP (Low Impact)
1. ✅ Static home sections
2. ✅ Service pricing (already optimized)
3. ✅ Course pages (mostly static)

---

## 🎯 Quick Wins Checklist

- [ ] Remove `CommunityGallery` from home page
- [ ] Remove `force-dynamic` from public APIs
- [ ] Add `revalidate: 3600` to gallery and stats APIs
- [ ] Merge dashboard + checkin into single call
- [ ] Add SWR caching to portal
- [ ] Disable leaderboard auto-refresh
- [ ] Add loading skeletons (reduce perceived need to refresh)
- [ ] Remove duplicate checkin after image generation
- [ ] Add robots.txt rules to block API crawling

---

## 🤖 Potential Bot/Crawler Issues

If bots are hitting your API endpoints:

```text
# robots.txt
User-agent: *
Disallow: /api/
Allow: /api/og/
```

Also add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
    },
  ];
}
```

---

## 📈 Monitoring Plan

After implementing fixes:

1. **Day 1-3:** Monitor Netlify dashboard hourly
2. **Week 1:** Compare daily averages to pre-fix
3. **Week 2:** Analyze which endpoints still high
4. **Month 1:** Full report and next optimization round

---

## 💡 Alternative Architectures (If Problem Persists)

1. **Vercel** - Better serverless pricing for Next.js
2. **Railway/Render** - Fixed-cost hosting
3. **Self-hosted** - VPS with Coolify or Dokploy
4. **Hybrid** - Static on Netlify, APIs on Railway

---

## 🏁 Conclusion

The **primary culprits** are:
1. **Dashboard API** - Too heavy, called too often
2. **CommunityGallery** - Force-dynamic on home page
3. **Multiple API calls** per user action
4. **No caching strategy** for public data

**Estimated savings after quick wins:** 60-70% reduction in serverless calls

---

*Document prepared for FayaPoint usage optimization. Execute quick wins first before re-enabling site.*
