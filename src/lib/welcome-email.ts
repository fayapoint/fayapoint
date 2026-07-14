/**
 * Boas-vindas e notificação de novo aluno (P5, 14/07/2026).
 * Ninguém mais se cadastra e fica no vácuo — e Ricardo nunca mais
 * descobre usuário novo por acaso.
 * Resend, mesmo padrão do email-service; degrada graciosamente sem chave.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@fayai.com.br';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ricardofaya@gmail.com';
const SITE = 'https://fayai.com.br/pt-BR';

async function sendViaResend(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) {
    console.log('[Welcome] Resend não configurado — pulando e-mail');
    return { success: true, messageId: 'not-configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `FayAi <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error('[Welcome] Falha no envio:', await res.text());
      return { success: false };
    }
    return { success: true };
  } catch (e) {
    console.error('[Welcome] Erro:', e);
    return { success: false };
  }
}

/** E-mail de boas-vindas — nome, trilha, minigame e canal humano aberto */
export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = (name || 'aluno').split(' ')[0];
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0c0e1d;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="font-size:34px;letter-spacing:2px;font-weight:800;color:#ffffff;margin:0 0 4px;">
      FAY<span style="color:#f5c04e;">AI</span>
    </p>
    <div style="background:#141731;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:28px;">
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 12px;">Oi, ${firstName}! 👋</h1>
      <p style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.6;margin:0 0 18px;">
        Que bom ter você na FayAi. Aqui a regra é uma só:
        <strong style="color:#f5c04e;">aprenda IA fazendo, não assistindo.</strong>
      </p>
      <p style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.6;margin:0 0 6px;">
        Seus próximos 10 minutos bem gastos:
      </p>
      <ol style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.9;margin:0 0 22px;padding-left:20px;">
        <li><a href="${SITE}/portal" style="color:#38bdf8;">Continuar sua trilha</a> — 8 passos para dominar IA, no seu ritmo</li>
        <li><a href="${SITE}/portal?tab=minigames" style="color:#a78bfa;">Jogar no Arcade da IA</a> — aprenda vocabulário de IA jogando</li>
        <li><a href="${SITE}/cursos" style="color:#f472b6;">Começar um curso</a> — tem um grátis todo mês</li>
      </ol>
      <div style="text-align:center;margin:0 0 22px;">
        <a href="${SITE}/portal"
           style="display:inline-block;background:linear-gradient(135deg,#f5c04e,#ffd97a);color:#241a05;font-weight:800;font-size:15px;padding:13px 30px;border-radius:12px;text-decoration:none;">
          Entrar no meu Portal →
        </a>
      </div>
      <p style="color:rgba(255,255,255,.6);font-size:14px;line-height:1.6;margin:0;border-top:1px solid rgba(255,255,255,.1);padding-top:16px;">
        💬 <strong style="color:#ffffff;">Tem uma dúvida de IA?</strong> Responda este e-mail —
        um humano de verdade (o Ricardo, fundador da FayAi) lê e responde.
      </p>
    </div>
    <p style="color:rgba(255,255,255,.35);font-size:11px;text-align:center;margin:18px 0 0;line-height:1.6;">
      Você recebeu este e-mail porque criou uma conta na FayAi.<br>
      Não quer mais receber? <a href="${SITE}/exclusao-de-dados" style="color:rgba(255,255,255,.5);">Gerencie seus dados</a> ·
      <a href="${SITE}/privacidade" style="color:rgba(255,255,255,.5);">Privacidade</a>
    </p>
  </div>
</body>
</html>`;
  return sendViaResend(to, `${firstName}, sua jornada na IA começa agora 🚀`, html, ADMIN_EMAIL);
}

/** Aviso imediato ao admin — nunca mais descobrir aluno novo por acaso */
export async function notifyAdminNewUser(name: string, email: string, source?: string) {
  const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#333;">
  <h2>🎉 Novo aluno na FayAi</h2>
  <p><strong>Nome:</strong> ${name}<br>
     <strong>E-mail:</strong> ${email}<br>
     <strong>Origem:</strong> ${source || 'registro direto'}<br>
     <strong>Quando:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
  <p><a href="https://fayai.com.br/pt-BR/admin">Abrir admin</a></p>
</body></html>`;
  return sendViaResend(ADMIN_EMAIL, `🎉 Novo aluno: ${name}`, html);
}

/** Dispara os dois sem bloquear a resposta do cadastro */
export function fireWelcomeFlow(name: string, email: string, source?: string) {
  Promise.allSettled([sendWelcomeEmail(email, name), notifyAdminNewUser(name, email, source)]).catch(
    () => { /* nunca derruba o cadastro */ }
  );
}
