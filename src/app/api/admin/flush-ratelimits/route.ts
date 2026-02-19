import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

// POST /api/admin/flush-ratelimits
// Flushes all rate limit, strike, and block keys from Redis
// Protected by a secret header to prevent abuse
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  const expectedSecret = process.env.GEOBLOCK_BYPASS_SECRET || "fayapoint-bypass-2024";

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patterns = [
      "ratelimit:*",
      "ratelimit:rsc:*",
      "ratelimit:pages:*",
      "ratelimit:admin:*",
      "api:global:*",
      "api:strikes:*",
      "api:datacenter:*",
      "blocked:ip:*",
      "strikes:*",
      "requests:count:*",
      "bandwidth:*",
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Flushed ${totalDeleted} rate limit keys`,
      patterns,
    });
  } catch (error) {
    console.error("Error flushing rate limits:", error);
    return NextResponse.json(
      { error: "Failed to flush rate limits" },
      { status: 500 }
    );
  }
}
