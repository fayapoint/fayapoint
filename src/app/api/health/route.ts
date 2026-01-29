import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const country = 
    request.headers.get("x-nf-client-geo-country") ||
    request.headers.get("x-country") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-geo-country") ||
    "unknown";

  const ip = 
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    geo: {
      country,
      ip: ip.slice(0, 10) + "...", // Partial IP for privacy
    },
    environment: process.env.NODE_ENV,
  });
}
