// Twitter/X OAuth 2.0 PKCE callback
// GET /api/social/connect/twitter/callback?code=xxx&state=xxx

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';

export const dynamic = 'force-dynamic';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';

function getPublicOrigin(request: NextRequest): string {
  const canonical = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (canonical) return canonical.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    const origin = getPublicOrigin(request);

    let userId = '';
    let redirectPath = '/admin/social';
    let codeVerifier = '';

    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
        userId = state.userId || '';
        redirectPath = state.redirect || '/admin/social';
        codeVerifier = state.codeVerifier || '';
      } catch { /* ignore */ }
    }

    if (error || !code) {
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', error || 'no_code');
      return NextResponse.redirect(errorUrl.toString());
    }

    const redirectUri = `${origin}/api/social/connect/twitter/callback`;

    // Exchange code for token (Basic auth with client credentials)
    const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      signal: AbortSignal.timeout(15000),
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[TWITTER CALLBACK] Token error:', tokenData.error);
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', 'token_exchange');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Get user info
    const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,description,url', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(15000),
    });
    const userData = await userRes.json();
    const twitterUser = userData.data;

    if (!twitterUser) {
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', 'user_fetch');
      return NextResponse.redirect(errorUrl.toString());
    }

    await dbConnect();

    const metrics = twitterUser.public_metrics || {};
    await SocialAccount.findOneAndUpdate(
      { userId, platform: 'twitter' },
      {
        platformUserId: twitterUser.id,
        username: twitterUser.username,
        profileUrl: `https://x.com/${twitterUser.username}`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 7200) * 1000),
        isActive: true,
        status: 'active',
        lastSync: new Date(),
        metadata: {
          followerCount: metrics.followers_count || 0,
          followingCount: metrics.following_count || 0,
          postCount: metrics.tweet_count || 0,
          profilePictureUrl: twitterUser.profile_image_url || '',
          biography: twitterUser.description || '',
          websiteUrl: twitterUser.url || '',
        },
      },
      { upsert: true, new: true }
    );

    const successUrl = new URL(`/pt-BR${redirectPath}`, origin);
    successUrl.searchParams.set('social_connected', 'twitter');
    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('[TWITTER CALLBACK] Error:', error);
    const origin = getPublicOrigin(request);
    const errorUrl = new URL('/pt-BR/admin/social', origin);
    errorUrl.searchParams.set('social_error', 'server_error');
    return NextResponse.redirect(errorUrl.toString());
  }
}
