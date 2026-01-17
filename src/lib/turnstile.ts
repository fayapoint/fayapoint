// =============================================================================
// CLOUDFLARE TURNSTILE VERIFICATION
// =============================================================================

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token server-side
 * @param token The token from the client-side widget
 * @param ip Optional IP address for additional validation
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development without keys, allow bypass
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }
    console.error("TURNSTILE_SECRET_KEY not configured");
    return { success: false, error: "CAPTCHA not configured" };
  }

  // Allow dev bypass token
  if (token === "dev-bypass-token" && process.env.NODE_ENV === "development") {
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error("Turnstile API error:", response.status);
      return { success: false, error: "Verification service unavailable" };
    }

    const result = await response.json();

    if (!result.success) {
      const errorCodes = result["error-codes"] || [];
      console.warn("Turnstile verification failed:", errorCodes);
      return { 
        success: false, 
        error: errorCodes.includes("invalid-input-response") 
          ? "Invalid CAPTCHA" 
          : "Verification failed" 
      };
    }

    return {
      success: true,
      challenge_ts: result.challenge_ts,
      hostname: result.hostname,
      action: result.action,
      cdata: result.cdata,
    };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Middleware helper to verify Turnstile in API routes
 */
export async function requireTurnstile(
  request: Request,
  body: { turnstileToken?: string }
): Promise<{ valid: boolean; error?: string }> {
  const token = body.turnstileToken;

  if (!token) {
    return { valid: false, error: "CAPTCHA token required" };
  }

  // Get IP from headers
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             request.headers.get("x-real-ip") ||
             undefined;

  const result = await verifyTurnstileToken(token, ip);

  if (!result.success) {
    return { valid: false, error: result.error || "CAPTCHA verification failed" };
  }

  return { valid: true };
}
