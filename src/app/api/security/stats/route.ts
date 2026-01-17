import { NextResponse } from "next/server";
import redis from "@/lib/redis";

// Security stats API - monitor bot activity and rate limiting
export async function GET(request: Request) {
  try {
    // Check for admin auth (basic check - improve for production)
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get blocked IPs count
    const blockedKeys = await redis.keys("blocked:ip:*");
    
    // Get rate limit strikes
    const strikeKeys = await redis.keys("strikes:*");
    
    // Get current request counts (sample)
    const requestKeys = await redis.keys("requests:count:*");
    
    // Get rate limit keys
    const rateLimitKeys = await redis.keys("ratelimit:global:*");

    // Get sample of blocked IPs
    const blockedSample: string[] = [];
    for (const key of blockedKeys.slice(0, 10)) {
      const ip = key.replace("blocked:ip:", "");
      const ttl = await redis.ttl(key);
      blockedSample.push(`${ip} (${Math.round(ttl / 60)}min remaining)`);
    }

    // Get high request count IPs
    const highTrafficIps: { ip: string; count: number }[] = [];
    for (const key of requestKeys.slice(0, 20)) {
      const count = await redis.get<number>(key);
      if (count && count > 30) {
        const ip = key.replace("requests:count:", "");
        highTrafficIps.push({ ip, count });
      }
    }
    highTrafficIps.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats: {
        blockedIps: blockedKeys.length,
        activeStrikes: strikeKeys.length,
        activeRateLimits: rateLimitKeys.length,
        uniqueIpsLastMinute: requestKeys.length,
      },
      blockedSample,
      highTrafficIps: highTrafficIps.slice(0, 10),
      message: blockedKeys.length > 0 
        ? `⚠️ ${blockedKeys.length} IPs currently blocked`
        : "✅ No blocked IPs",
    });
  } catch (error) {
    console.error("Security stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch security stats" },
      { status: 500 }
    );
  }
}

// Manual IP block/unblock
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ip, duration = 3600 } = body;

    if (!ip) {
      return NextResponse.json({ error: "IP required" }, { status: 400 });
    }

    if (action === "block") {
      await redis.set(`blocked:ip:${ip}`, 1, { ex: duration });
      return NextResponse.json({ 
        success: true, 
        message: `Blocked ${ip} for ${Math.round(duration / 60)} minutes` 
      });
    } else if (action === "unblock") {
      await redis.del(`blocked:ip:${ip}`);
      await redis.del(`strikes:${ip}`);
      return NextResponse.json({ 
        success: true, 
        message: `Unblocked ${ip}` 
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Security action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
