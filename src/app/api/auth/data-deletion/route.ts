import { NextRequest, NextResponse } from "next/server";

/**
 * Meta Data Deletion Callback Endpoint
 *
 * When a user removes the app from their Facebook/Instagram settings,
 * Meta sends a POST request here. We respond with a confirmation URL
 * and a tracking code so Meta knows we received the request.
 *
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData().catch(() => null);

    // Meta sends signed_request in the body
    const signedRequest = body?.get("signed_request") as string | null;

    // Generate a unique confirmation code
    const confirmationCode = `DEL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Log the deletion request
    console.log(`[DATA_DELETION] Request received. Code: ${confirmationCode}, signed_request: ${signedRequest ? "present" : "absent"}`);

    // TODO: In production, decode the signed_request to get the user_id
    // and queue actual data deletion from MongoDB

    // Meta expects this exact JSON response format
    return NextResponse.json({
      url: `https://fayai.com.br/pt-BR/exclusao-de-dados?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("[DATA_DELETION] Error:", error);
    return NextResponse.json(
      { url: "https://fayai.com.br/pt-BR/exclusao-de-dados", confirmation_code: "ERROR" },
      { status: 200 } // Meta expects 200 even on errors
    );
  }
}

// Also handle GET for Meta's URL validation check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "FayAi Data Deletion Endpoint. Send a POST request to initiate data deletion.",
    info_url: "https://fayai.com.br/pt-BR/exclusao-de-dados",
  });
}
