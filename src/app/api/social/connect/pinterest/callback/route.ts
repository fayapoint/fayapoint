// Pinterest OAuth callback
// GET /api/social/connect/pinterest/callback?code=xxx&state=xxx

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';

export const dynamic = 'force-dynamic';

const PINTEREST_APP_ID = process.env.PINTEREST_APP_ID || '';
const PINTEREST_APP_SECRET = process.env.PINTEREST_APP_SECRET || '';

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
    if (stateParam) {
      try {
        const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
        userId = state.userId || '';
        redirectPath = state.redirect || '/admin/social';
      } catch { /* ignore */ }
    }

    if (error || !code) {
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', error || 'no_code');
      return NextResponse.redirect(errorUrl.toString());
    }

    const redirectUri = `${origin}/api/social/connect/pinterest/callback`;
    const basicAuth = Buffer.from(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`).toString('base64');

    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      signal: AbortSignal.timeout(15000),
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('[PINTEREST CALLBACK] Token error:', tokenData);
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', 'token_exchange');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Get user account info
    const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(15000),
    });
    const pinterestUser = await userRes.json();

    await dbConnect();

    await SocialAccount.findOneAndUpdate(
      { userId, platform: 'pinterest' },
      {
        platformUserId: pinterestUser.username || pinterestUser.id || '',
        username: pinterestUser.username || '',
        profileUrl: `https://pinterest.com/${pinterestUser.username || ''}`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 86400) * 1000),
        isActive: true,
        status: 'active',
        lastSync: new Date(),
        metadata: {
          followerCount: pinterestUser.follower_count || 0,
          followingCount: pinterestUser.following_count || 0,
          postCount: pinterestUser.pin_count || 0,
          profilePictureUrl: pinterestUser.profile_image || '',
          biography: pinterestUser.about || '',
          websiteUrl: pinterestUser.website_url || '',
          businessAccount: pinterestUser.account_type === 'BUSINESS',
        },
      },
      { upsert: true, new: true }
    );

    const successUrl = new URL(`/pt-BR${redirectPath}`, origin);
    successUrl.searchParams.set('social_connected', 'pinterest');
    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('[PINTEREST CALLBACK] Error:', error);
    const origin = getPublicOrigin(request);
    const errorUrl = new URL('/pt-BR/admin/social', origin);
    errorUrl.searchParams.set('social_error', 'server_error');
    return NextResponse.redirect(errorUrl.toString());
  }
}
