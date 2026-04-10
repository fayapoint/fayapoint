// Twitter/X OAuth 2.0 PKCE initiation
// GET /api/social/connect/twitter -> redirects to Twitter OAuth

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const SCOPES = 'tweet.read users.read offline.access';

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

  if (!TWITTER_CLIENT_ID) {
    return NextResponse.json({ error: 'Twitter Client ID not configured' }, { status: 500 });
  }

  const origin = getPublicOrigin(request);
  const redirectUri = `${origin}/api/social/connect/twitter/callback`;

  // PKCE challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    redirect: '/admin/social',
    codeVerifier, // Stored in state for callback (in production, use server-side session)
  })).toString('base64url');

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return NextResponse.redirect(authUrl.toString());
}
