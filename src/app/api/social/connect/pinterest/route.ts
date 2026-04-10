// Pinterest OAuth initiation
// GET /api/social/connect/pinterest -> redirects to Pinterest OAuth

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PINTEREST_APP_ID = process.env.PINTEREST_APP_ID || '';
const SCOPES = 'boards:read,pins:read,user_accounts:read';

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

  if (!PINTEREST_APP_ID) {
    return NextResponse.json({ error: 'Pinterest App ID not configured. Set PINTEREST_APP_ID in .env.local' }, { status: 500 });
  }

  const origin = getPublicOrigin(request);
  const redirectUri = `${origin}/api/social/connect/pinterest/callback`;
  const state = Buffer.from(JSON.stringify({ userId: user.id, redirect: '/admin/social' })).toString('base64url');

  const authUrl = new URL('https://www.pinterest.com/oauth/');
  authUrl.searchParams.set('client_id', PINTEREST_APP_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(authUrl.toString());
}
