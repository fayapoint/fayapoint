import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/users";
import { getClientIpFromRequest, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);

    const rl = await rateLimit({
      key: `ratelimit:leads:ip:${ip}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Muitas solicitações. Tente novamente em alguns minutos.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.resetSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      source,
      leadType,
      referrerUrl,
      details,
      bookDiscountCode,
      utm,
    } = body ?? {};

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const lead = await upsertUser({
      name: String(name).trim(),
      email: normalizedEmail,
      source: source || "lead",
      leadType: leadType || "unknown",
      leadDetails: {
        referrerUrl,
        details,
        utm,
        capturedAt: new Date().toISOString(),
      },
      ...(bookDiscountCode ? { bookDiscountCode } : {}),
    });

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("[Leads] Error:", error);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
