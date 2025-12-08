# 🎯 FayaPoint Netlify Optimization - Action Plan

**Status:** Site offline to prevent overages  
**Goal:** Reduce serverless function calls by 70%+  
**Timeline:** Execute in order, test after each phase

---

## Phase 1: EMERGENCY FIXES (Before Going Live)

### Step 1.1: Disable CommunityGallery on Home Page

**File:** `src/app/[locale]/page.tsx`

**Change:** Comment out the CommunityGallery import and usage

```tsx
// BEFORE
import { CommunityGallery } from "@/components/home/CommunityGallery";

// AFTER
// import { CommunityGallery } from "@/components/home/CommunityGallery";
```

```tsx
// BEFORE
<CommunityGallery />

// AFTER
{/* <CommunityGallery /> */}
```

**Savings:** ~12,000+ serverless calls/month

---

### Step 1.2: Remove force-dynamic from Public APIs

**File:** `src/app/api/public/gallery/route.ts`

```typescript
// REMOVE THIS LINE:
export const dynamic = 'force-dynamic';

// ADD THIS:
export const revalidate = 3600; // Cache for 1 hour
```

**File:** `src/app/api/public/community-stats/route.ts`

```typescript
// REMOVE THIS LINE:
export const dynamic = 'force-dynamic';

// ADD THIS:
export const revalidate = 3600;
```

**File:** `src/app/api/user/creations/route.ts`

```typescript
// REMOVE THIS LINE:
export const dynamic = 'force-dynamic';

// This one can stay dynamic since it's user-specific, but add cache headers
```

---

### Step 1.3: Remove force-dynamic from POD APIs

**File:** `src/app/api/pod/mockup/route.ts`
**File:** `src/app/api/pod/render-text/route.ts`
**File:** `src/app/api/gallery/route.ts`
**File:** `src/app/api/calendar/next-slot/route.ts`

Remove `force-dynamic` where not truly needed.

---

### Step 1.4: Block API Crawling

**Create:** `public/robots.txt`

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# Allow social media crawlers for OG images only
User-agent: facebookexternalhit
Allow: /api/og/

User-agent: Twitterbot
Allow: /api/og/

User-agent: LinkedInBot
Allow: /api/og/
```

---

### Step 1.5: Add API Headers to Prevent Indexing

**File:** `next.config.ts`

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/api/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
});
```

---

## Phase 2: DASHBOARD OPTIMIZATION

### Step 2.1: Remove Duplicate Checkin Call

**File:** `src/app/[locale]/(site)/portal/page.tsx`

Find and REMOVE the automatic daily checkin call inside `fetchDashboardData`:

```typescript
// REMOVE THIS ENTIRE BLOCK (lines ~340-362):
// Daily login checkin for XP
try {
  const checkinRes = await fetch("/api/user/checkin", {
    method: "POST",
    // ...
  });
  // ...
} catch (checkinError) {
  console.error("Checkin error:", checkinError);
}
```

Instead, handle checkin INSIDE the dashboard API itself.

---

### Step 2.2: Merge Checkin into Dashboard API

**File:** `src/app/api/user/dashboard/route.ts`

Add checkin logic directly into dashboard API to save 1 serverless call:

```typescript
// At the end of dashboard API, before returning:

// Handle daily login checkin inline
const today = new Date();
today.setHours(0, 0, 0, 0);
const lastActive = user.progress?.lastActiveDate 
  ? new Date(user.progress.lastActiveDate) 
  : null;
lastActive?.setHours(0, 0, 0, 0);

if (!lastActive || lastActive.getTime() !== today.getTime()) {
  // Update streak inline
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let newStreak = user.progress?.currentStreak || 0;
  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }
  
  await User.findByIdAndUpdate(userId, {
    $set: {
      'progress.lastActiveDate': new Date(),
      'progress.currentStreak': newStreak,
      'progress.longestStreak': Math.max(newStreak, user.progress?.longestStreak || 0),
    },
    $inc: {
      'progress.xp': 10, // Daily login XP
      'progress.weeklyXp': 10,
    }
  });
}
```

---

### Step 2.3: Remove Image Generation Checkin

**File:** `src/app/[locale]/(site)/portal/page.tsx`

In `handleGenerateImage`, REMOVE:

```typescript
// REMOVE THIS BLOCK (lines ~424-435):
// Award XP for image generation
try {
  await fetch("/api/user/checkin", {
    method: "POST",
    // ...
    body: JSON.stringify({ action: "image_generated" }),
  });
} catch (e) {
  console.error("Checkin error:", e);
}
```

Instead, update user XP directly in `/api/ai/generate-image`:

```typescript
// In generate-image route, after successful creation:
await User.findByIdAndUpdate(user._id, {
  $inc: { 
    'gamification.totalImagesGenerated': 1,
    'progress.xp': 5,
    'progress.weeklyXp': 5,
  }
});
```

---

## Phase 3: ADD CACHING TO PORTAL

### Step 3.1: Create a Custom Hook with Caching

**Create:** `src/hooks/useDashboard.ts`

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const dashboardCache = {
  data: null as any,
  timestamp: 0,
};

export function useDashboard() {
  const [data, setData] = useState(dashboardCache.data);
  const [isLoading, setIsLoading] = useState(!dashboardCache.data);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchDashboard = useCallback(async (force = false) => {
    // Check cache first
    const now = Date.now();
    if (!force && dashboardCache.data && (now - dashboardCache.timestamp) < CACHE_DURATION) {
      setData(dashboardCache.data);
      setIsLoading(false);
      return dashboardCache.data;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const token = localStorage.getItem('fayapoint_token');
    if (!token) {
      setError('No token');
      setIsLoading(false);
      fetchingRef.current = false;
      return null;
    }

    try {
      const res = await fetch('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const result = await res.json();
      
      // Update cache
      dashboardCache.data = result;
      dashboardCache.timestamp = now;
      
      setData(result);
      setError(null);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: () => fetchDashboard(true) };
}
```

---

### Step 3.2: Update Portal to Use Hook

**File:** `src/app/[locale]/(site)/portal/page.tsx`

```typescript
// Replace the fetchDashboardData useEffect with:
import { useDashboard } from '@/hooks/useDashboard';

// Inside component:
const { data: dashboardData, isLoading, error, refetch } = useDashboard();
```

---

## Phase 4: LAZY LOAD TAB DATA

### Step 4.1: Don't Fetch Tab Data Until Needed

**File:** `src/app/[locale]/(site)/portal/page.tsx`

Change from:
```typescript
useEffect(() => {
  if (activeTab === "courses") {
    fetchCourseAccess();
  }
}, [activeTab]);
```

To:
```typescript
// Add debounce to prevent rapid switching
const [debouncedTab, setDebouncedTab] = useState(activeTab);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTab(activeTab);
  }, 300);
  return () => clearTimeout(timer);
}, [activeTab]);

useEffect(() => {
  if (debouncedTab === "courses") {
    fetchCourseAccess();
  }
}, [debouncedTab]);
```

---

## Phase 5: SIMPLIFY DASHBOARD API

### Step 5.1: Remove Leaderboard from Dashboard (Optional but Recommended)

**File:** `src/app/api/user/dashboard/route.ts`

The leaderboard query is expensive:
```typescript
const leaderboard = await User.find({})
  .select('name image progress.weeklyXp progress.level subscription.plan')
  .sort({ 'progress.weeklyXp': -1 })
  .limit(10)
  .lean();

const userRank = await User.countDocuments({ 'progress.weeklyXp': { $gt: user.progress?.weeklyXp || 0 } }) + 1;
```

**Option A:** Remove entirely and create separate `/api/leaderboard` with 10-min cache.

**Option B:** Add server-side caching:
```typescript
// Simple in-memory cache
let leaderboardCache = { data: null, timestamp: 0 };
const LEADERBOARD_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// In the route:
const now = Date.now();
if (!leaderboardCache.data || (now - leaderboardCache.timestamp) > LEADERBOARD_CACHE_TTL) {
  leaderboardCache.data = await User.find({})
    .select('name image progress.weeklyXp progress.level subscription.plan')
    .sort({ 'progress.weeklyXp': -1 })
    .limit(10)
    .lean();
  leaderboardCache.timestamp = now;
}
const leaderboard = leaderboardCache.data;
```

---

## Phase 6: MONITORING

### Add Simple Request Counter

**Create:** `src/lib/request-counter.ts`

```typescript
// In-memory counter (resets on cold start)
const requestCounts: Record<string, number> = {};

export function countRequest(endpoint: string) {
  const key = `${endpoint}-${new Date().toISOString().split('T')[0]}`;
  requestCounts[key] = (requestCounts[key] || 0) + 1;
  
  // Log every 100 requests
  if (requestCounts[key] % 100 === 0) {
    console.log(`[REQUEST COUNT] ${key}: ${requestCounts[key]}`);
  }
}
```

Usage in routes:
```typescript
import { countRequest } from '@/lib/request-counter';

export async function GET() {
  countRequest('/api/user/dashboard');
  // ...
}
```

---

## 📋 Execution Checklist

### Before Re-launching:

- [ ] 1.1: Comment out CommunityGallery from home page
- [ ] 1.2: Remove force-dynamic from public APIs
- [ ] 1.3: Remove force-dynamic from POD APIs
- [ ] 1.4: Add robots.txt
- [ ] 1.5: Add API headers in next.config.ts
- [ ] 2.1: Remove duplicate checkin call from portal
- [ ] 2.2: Add checkin logic to dashboard API
- [ ] 2.3: Move image XP to generate-image API

### After Re-launching (Monitor First):

- [ ] 3.1: Add useDashboard hook
- [ ] 3.2: Update portal to use hook
- [ ] 4.1: Add tab debouncing
- [ ] 5.1: Cache/separate leaderboard

### Future Optimization:

- [ ] Split dashboard into smaller endpoints
- [ ] Add Redis/Upstash caching
- [ ] Move public APIs to Edge Functions
- [ ] Implement SSG for static pages

---

## 🎯 Expected Results

| Phase | Estimated Savings |
|-------|------------------|
| Phase 1 (Emergency) | 40-50% reduction |
| Phase 2 (Dashboard) | 15-20% reduction |
| Phase 3 (Caching) | 10-15% reduction |
| Phase 4 (Lazy Load) | 5-10% reduction |
| **Total** | **70-95% reduction** |

---

## ⚠️ Things NOT to Change

1. **Authentication APIs** - Must stay dynamic
2. **Image generation** - Can't cache
3. **Order/checkout** - Must be real-time
4. **User-specific data** - Can cache briefly, not long-term

---

*Execute Phase 1 first, deploy, monitor for 24 hours, then proceed with Phase 2.*
