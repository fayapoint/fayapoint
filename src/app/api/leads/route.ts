import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/users";
import { getClientIpFromRequest, rateLimit } from "@/lib/rate-limit";

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Lead";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractUtm(urlString?: string) {
  if (!urlString) return undefined;
  try {
    const u = new URL(urlString);
    const get = (k: string) => u.searchParams.get(k) ?? undefined;
    const utm = {
      utm_source: get("utm_source"),
      utm_medium: get("utm_medium"),
      utm_campaign: get("utm_campaign"),
      utm_content: get("utm_content"),
      utm_term: get("utm_term"),
    };
    const hasAny = Object.values(utm).some(Boolean);
    return hasAny ? utm : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromRequest(request);
    const ua = request.headers.get("user-agent") ?? "";

    if (!ua || /bot|crawler|spider|headless/i.test(ua)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const resolvedReferrerUrl =
      referrerUrl || request.headers.get("referer") || undefined;

    const resolvedUtm = utm || extractUtm(resolvedReferrerUrl);

    const lead = await upsertUser({
      name: name ? String(name).trim() : deriveNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      source: source || "lead",
      leadType: leadType || "unknown",
      leadDetails: {
        referrerUrl: resolvedReferrerUrl,
        details,
        utm: resolvedUtm,
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
