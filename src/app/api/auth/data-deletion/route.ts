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

// GET returns an HTML page so Meta's URL validator sees a browsable page
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusão de Dados - FayAI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .container { max-width: 640px; width: 100%; }
    .card { background: #171717; border: 1px solid #262626; border-radius: 1rem; padding: 2.5rem; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff; }
    .subtitle { color: #a3a3a3; margin-bottom: 2rem; }
    h2 { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem; margin-top: 1.5rem; }
    p, li { color: #a3a3a3; line-height: 1.7; }
    ul { padding-left: 1.25rem; margin-top: 0.5rem; }
    li { margin-bottom: 0.25rem; }
    .email-box { background: #1a1a2e; border: 1px solid #2d2d5e; border-radius: 0.75rem; padding: 1rem; margin: 1rem 0; display: flex; align-items: center; gap: 0.75rem; }
    .email-box span { color: #818cf8; font-weight: 600; }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.875rem; color: #f87171; margin-bottom: 1rem; }
    .footer { text-align: center; margin-top: 1.5rem; color: #525252; font-size: 0.875rem; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="badge">&#128465; Data Deletion / Exclusao de Dados</div>
      <h1>Solicitacao de Exclusao de Dados</h1>
      <p class="subtitle">FayAI - fayai.com.br</p>

      <h2>Como solicitar a exclusao dos seus dados</h2>
      <p>Voce pode solicitar a exclusao completa dos seus dados pessoais armazenados pela FayAI a qualquer momento. Envie um email para:</p>
      <div class="email-box">
        <span>fayai.com.br@gmail.com</span>
      </div>
      <p>Inclua no assunto: "Exclusao de Dados" e informe o email cadastrado na plataforma.</p>

      <h2>Dados que serao excluidos</h2>
      <ul>
        <li>Informacoes do perfil (nome, email, foto)</li>
        <li>Dados de uso e progresso em cursos</li>
        <li>Dados de conexao com Facebook/Instagram</li>
        <li>Preferencias e configuracoes da conta</li>
        <li>Historico de interacoes na plataforma</li>
      </ul>

      <h2>Prazo</h2>
      <p>Sua solicitacao sera processada em ate 15 dias uteis. Voce recebera uma confirmacao por email quando a exclusao for concluida.</p>

      <h2>Exclusao via Facebook/Instagram</h2>
      <p>Se voce conectou sua conta do Facebook ou Instagram a FayAI, voce tambem pode solicitar a exclusao dos dados diretamente pelas configuracoes do aplicativo no Facebook. A FayAI recebera a notificacao automaticamente e processara a exclusao.</p>

      <h2>Contato</h2>
      <p>Email: <a href="mailto:fayai.com.br@gmail.com">fayai.com.br@gmail.com</a></p>
      <p>Site: <a href="https://fayai.com.br">fayai.com.br</a></p>
    </div>
    <p class="footer">FayAI &copy; 2026 - Rio de Janeiro, Brasil | <a href="https://fayai.com.br/pt-BR/privacidade">Politica de Privacidade</a> | <a href="https://fayai.com.br/pt-BR/termos">Termos de Uso</a></p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
