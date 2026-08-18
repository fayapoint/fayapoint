import { NextRequest, NextResponse } from "next/server";

/**
 * ⚠️ SEM O PADRÃO "SEMPRE PASSA".
 *
 * Estava `|| "1x0000000000000000000000000000000AA"`, que é a chave de TESTE
 * publicada pela Cloudflare: ela aprova qualquer token, inclusive um inventado.
 * E `TURNSTILE_SECRET_KEY` não está configurada na Netlify — ou seja, a
 * verificação em produção aprovava tudo. Hoje ninguém é ferido por isso porque
 * `GateLandingPage` não está montada em página nenhuma (a rota existe e não é
 * chamada), mas o dia em que o portão voltasse a ser usado ele nasceria aberto.
 *
 * `lib/turnstile.ts` já fazia certo — lê a variável e recusa sem ela. Este
 * arquivo é a cópia que ficou para trás.
 */
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!TURNSTILE_SECRET) {
      console.error("[GATE] TURNSTILE_SECRET_KEY não configurada — recusando em vez de aprovar.");
      return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token missing" }, { status: 400 });
    }

    // Verify with Cloudflare Turnstile
    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET);
    formData.append("response", token);

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    if (ip !== "unknown") {
      formData.append("remoteip", ip);
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      console.warn("[GATE] Turnstile verification failed:", verifyData);
      return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }

    // Set httpOnly cookie valid for 7 days
    const response = NextResponse.json({ success: true });
    response.cookies.set("fayai_gate", "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[GATE] Verification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
