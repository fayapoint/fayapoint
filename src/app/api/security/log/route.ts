import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

interface SecurityLog {
  type: "bot_detected" | "rate_limited" | "suspicious_activity" | "failed_login" | "honeypot_triggered";
  ip: string;
  userAgent: string;
  path: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, details } = body;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const path = request.headers.get("referer") || "unknown";

    const log: SecurityLog = {
      type,
      ip,
      userAgent,
      path,
      details,
      timestamp: new Date(),
    };

    // Log to console for Netlify logs
    console.log(`[SECURITY LOG] ${JSON.stringify(log)}`);

    // Optionally save to database for analysis
    try {
      await connectToDatabase();
      const db = mongoose.connection.db;
      if (db) {
        await db.collection("security_logs").insertOne(log);
      }
    } catch (dbError) {
      // Don't fail if DB is unavailable
      console.error("[SECURITY] Failed to save to DB:", dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SECURITY] Log error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// GET endpoint to retrieve security stats (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }
    
    // Get counts by type for last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await db.collection("security_logs").aggregate([
      { $match: { timestamp: { $gte: oneDayAgo } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]).toArray();

    // Get top IPs
    const topIPs = await db.collection("security_logs").aggregate([
      { $match: { timestamp: { $gte: oneDayAgo } } },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).toArray();

    // Get recent logs
    const recentLogs = await db.collection("security_logs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      stats: {
        byType: stats,
        topIPs,
        recentLogs,
      },
    });
  } catch (error) {
    console.error("[SECURITY] Stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
