// Google OAuth for social account connection (YouTube, Google Business)
// GET /api/social/connect/google -> redirects to Google OAuth
// Scopes include YouTube read access

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

function getPublicOrigin(request: NextRequest): string {
  const canonical = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (canonical) return canonical.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
  }

  const origin = getPublicOrigin(request);
  const redirectUri = `${origin}/api/social/connect/google/callback`;

  // De onde o usuário saiu é onde ele volta. Antes era sempre /admin/social,
  // e quem clicava no portal era despejado numa tela de administrador.
  const pedido = request.nextUrl.searchParams.get('redirect');
  const volta = pedido && pedido.startsWith('/') && !pedido.startsWith('//') ? pedido : '/portal?tab=social';
  const state = Buffer.from(JSON.stringify({ userId: user.id, redirect: volta })).toString('base64url');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  // Quem já entrou com o Google não escolhe conta de novo: o e-mail vai como
  // dica e a tela do Google fica só com o "permitir".
  authUrl.searchParams.set('login_hint', user.email);
  authUrl.searchParams.set('include_granted_scopes', 'true');

  return NextResponse.redirect(authUrl.toString());
}
