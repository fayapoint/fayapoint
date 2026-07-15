import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emails/followup-due — sequência de follow-up pós-cadastro (P5.2).
 * D+2: "seu próximo passo na trilha" para quem se cadastrou há 2+ dias.
 * D+7: "sentimos sua falta" para quem está inativo há 7+ dias.
 * Idempotente: marca followups.d2SentAt / d7SentAt no usuário.
 * Auth: header x-social-secret === SOCIAL_CRON_SECRET (fallback AINEWS_SECRET).
 * Disparado por cron diário na VPS (9h BRT). Opt-out: preferences.notifications.email.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@fayai.com.br';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ricardofaya@gmail.com';
const SITE = 'https://fayai.com.br/pt-BR';
const MAX_PER_RUN = 25;

function shell(title: string, inner: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0c0e1d;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="font-size:30px;letter-spacing:2px;font-weight:800;color:#ffffff;margin:0 0 4px;">FAY<span style="color:#f5c04e;">AI</span></p>
    <div style="background:#141731;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:26px;">
      <h1 style="color:#ffffff;font-size:21px;margin:0 0 12px;">${title}</h1>
      ${inner}
    </div>
    <p style="color:rgba(255,255,255,.35);font-size:11px;text-align:center;margin:16px 0 0;line-height:1.6;">
      Não quer mais receber? <a href="${SITE}/portal/conta?tab=preferencias" style="color:rgba(255,255,255,.5);">Desative em Preferências</a> ·
      <a href="${SITE}/privacidade" style="color:rgba(255,255,255,.5);">Privacidade</a>
    </p>
  </div></body></html>`;
}

function d2Email(firstName: string) {
  return {
    subject: `${firstName}, seu próximo passo na trilha te espera 🗺️`,
    html: shell(`Oi de novo, ${firstName}!`, `
      <p style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.6;margin:0 0 16px;">
        Dois dias atrás você deu o primeiro passo. A trilha
        <strong style="color:#f5c04e;">"Seu caminho para dominar IA"</strong> tem 8 passos —
        e o próximo leva menos de 10 minutos.
      </p>
      <p style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.6;margin:0 0 20px;">
        Sugestão de hoje: comece um curso. Tem um <strong style="color:#a3e635;">grátis todo mês</strong>
        — este mês é o ChatGPT do Zero.
      </p>
      <div style="text-align:center;">
        <a href="${SITE}/portal" style="display:inline-block;background:linear-gradient(135deg,#f5c04e,#ffd97a);color:#241a05;font-weight:800;font-size:15px;padding:13px 30px;border-radius:12px;text-decoration:none;">Continuar minha trilha →</a>
      </div>`),
  };
}

function d7Email(firstName: string) {
  return {
    subject: `${firstName}, uma carta nova te espera no Arcade 🃏`,
    html: shell(`Sentimos sua falta, ${firstName}`, `
      <p style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.6;margin:0 0 16px;">
        Uma semana sem te ver por aqui! Enquanto isso, o
        <strong style="color:#a78bfa;">Verdade ou Mito?</strong> ganhou cartas novas.
        Que tal testar seu radar contra o hype?
      </p>
      <p style="color:rgba(255,255,255,.75);font-size:15px;line-height:1.6;margin:0 0 20px;">
        "A IA sempre diz a verdade quando responde com confiança." — verdade ou mito?
        A resposta (com explicação) está no Arcade. 😉
      </p>
      <div style="text-align:center;">
        <a href="${SITE}/portal?tab=minigames" style="display:inline-block;background:linear-gradient(135deg,#a78bfa,#c4b5fd);color:#1e1145;font-weight:800;font-size:15px;padding:13px 30px;border-radius:12px;text-decoration:none;">Jogar agora →</a>
      </div>`),
  };
}

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `FayAi <${FROM_EMAIL}>`, to: [to], subject, html, reply_to: ADMIN_EMAIL }),
  });
  return res.ok;
}

export async function POST(request: NextRequest) {
  const secret = process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
  if (!secret || request.headers.get('x-social-secret') !== secret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await dbConnect();
    const now = Date.now();
    const d2Cutoff = new Date(now - 2 * 864e5);
    const d7Cutoff = new Date(now - 7 * 864e5);
    const results = { d2: 0, d7: 0, skipped: 0 };

    // D+2 — cadastrou há 2+ dias e nunca recebeu o follow-up
    const d2Users = await User.find({
      createdAt: { $lte: d2Cutoff, $gte: new Date(now - 14 * 864e5) },
      'followups.d2SentAt': { $exists: false },
      'preferences.notifications.email': { $ne: false },
    }).select('name email createdAt').limit(MAX_PER_RUN);

    for (const u of d2Users) {
      const first = (u.name || 'aluno').split(' ')[0];
      const { subject, html } = d2Email(first);
      const ok = await send(u.email, subject, html);
      await User.updateOne({ _id: u._id }, { $set: { 'followups.d2SentAt': new Date(), 'followups.d2Ok': ok } });
      if (ok) results.d2++; else results.skipped++;
    }

    // D+7 — inativo há 7+ dias, já recebeu D+2, nunca recebeu D+7
    const d7Users = await User.find({
      'followups.d2SentAt': { $exists: true },
      'followups.d7SentAt': { $exists: false },
      'preferences.notifications.email': { $ne: false },
      $or: [
        { lastLoginAt: { $lte: d7Cutoff } },
        { lastLoginAt: { $exists: false }, createdAt: { $lte: d7Cutoff } },
      ],
    }).select('name email').limit(MAX_PER_RUN);

    for (const u of d7Users) {
      const first = (u.name || 'aluno').split(' ')[0];
      const { subject, html } = d7Email(first);
      const ok = await send(u.email, subject, html);
      await User.updateOne({ _id: u._id }, { $set: { 'followups.d7SentAt': new Date(), 'followups.d7Ok': ok } });
      if (ok) results.d7++; else results.skipped++;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[followup-due] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
