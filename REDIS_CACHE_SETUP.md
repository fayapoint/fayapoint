# Redis Cache Setup (Upstash)

This project uses **Upstash Redis** for caching to reduce Netlify serverless invocations and MongoDB queries.

## Setup

### 1. Create an Upstash Account
Go to [upstash.com](https://upstash.com) and create a free account.

### 2. Create a Redis Database
- Click "Create Database"
- Choose a region close to your Netlify deployment (e.g., `us-east-1`)
- Name: `fayapoint-cache`
- Select "REST Only" for serverless compatibility

### 3. Get Your Credentials
After creating the database, copy the REST credentials:
- **UPSTASH_REDIS_REST_URL**: `https://xxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN**: `AXxxxx...`

### 4. Add to Netlify Environment Variables
In your Netlify dashboard:
1. Go to Site Settings > Environment Variables
2. Add:
   - `UPSTASH_REDIS_REST_URL` = your REST URL
   - `UPSTASH_REDIS_REST_TOKEN` = your REST token

### 5. Add to Local Development (.env.local)
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx...
```

## What Gets Cached

| Route | TTL | Cache Key | Description |
|-------|-----|-----------|-------------|
| `/api/public/community-stats` | 5 min | `community:stats` | Aggregate stats |
| `/api/public/gallery` | 2 min | `gallery:p{page}:l{limit}` | Gallery pages |
| `/api/user/dashboard` (leaderboard) | 5 min | `leaderboard:weekly` | Shared leaderboard |
| `/api/products` | 10 min | `products:*` | Product listings |
| `/api/store/featured` | 5 min | `store:featured` | Featured products |
| `/api/store/products/[slug]` | 10 min | `store:product:{slug}` | Individual products |
| `/api/service-prices` | 30 min | `service:prices` | Service pricing |
| `/api/calendar/next-slot` | 5 min | `calendar:next-slot` | Calendar availability |
| `/api/github-repos` | 1 hour | `github:repos:{user}:{limit}` | GitHub repos |
| `/api/user/creations` | 1 min | `user:{id}:creations` | User's images |

## Cache Invalidation

The cache is automatically invalidated when:
- New images are generated → Gallery cache cleared
- Products are updated → Product cache cleared

## Graceful Degradation

If Redis is not configured or unavailable:
- The system automatically falls back to direct database queries
- No errors are thrown - the app continues to work normally
- You can deploy without Redis first and add it later

## Free Tier Limits (Upstash)

- **10,000 commands/day** (very generous for caching)
- **1GB bandwidth/month**
- **1 database**

This is more than enough for most use cases. The caching strategy is designed to minimize commands.

## Expected Impact

With Redis caching enabled, expect:
- **~70-80% reduction** in serverless function invocations
- **~60-70% reduction** in MongoDB queries
- **Faster response times** (cached responses in <10ms vs 100-300ms for DB)
- **Lower data transfer** (cached JSON served directly)
- **Reduced GitHub API calls** (saves rate limit)
- **Reduced external calendar fetches**
