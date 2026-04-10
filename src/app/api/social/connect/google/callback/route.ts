// Google/YouTube OAuth callback — saves YouTube channel as social account
// GET /api/social/connect/google/callback?code=xxx&state=xxx

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';

export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

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
    const redirectUri = `${origin}/api/social/connect/google/callback`;

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

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(15000),
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('[GOOGLE SOCIAL] Token error:', tokenData.error);
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', 'token_exchange');
      return NextResponse.redirect(errorUrl.toString());
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';
    const expiresIn = tokenData.expires_in || 3600;

    // Get YouTube channel info
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) }
    );
    const ytData = await ytRes.json();

    await dbConnect();
    const connected: string[] = [];

    if (ytData.items && ytData.items.length > 0) {
      const channel = ytData.items[0];
      const snippet = channel.snippet || {};
      const stats = channel.statistics || {};

      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'youtube' },
        {
          platformUserId: channel.id,
          username: snippet.title || snippet.customUrl || '',
          profileUrl: `https://youtube.com/channel/${channel.id}`,
          accessToken,
          refreshToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          isActive: true,
          status: 'active',
          lastSync: new Date(),
          metadata: {
            followerCount: parseInt(stats.subscriberCount || '0'),
            postCount: parseInt(stats.videoCount || '0'),
            profilePictureUrl: snippet.thumbnails?.medium?.url || '',
            biography: snippet.description || '',
          },
        },
        { upsert: true, new: true }
      );
      connected.push('youtube');
    }

    // Also save Google account info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const googleUser = await userRes.json();

    if (googleUser.id) {
      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'google' },
        {
          platformUserId: googleUser.id,
          username: googleUser.name || googleUser.email || '',
          profileUrl: `https://plus.google.com/${googleUser.id}`,
          accessToken,
          refreshToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          isActive: true,
          status: 'active',
          lastSync: new Date(),
          metadata: {
            profilePictureUrl: googleUser.picture || '',
          },
        },
        { upsert: true, new: true }
      );
      connected.push('google');
    }

    const successUrl = new URL(`/pt-BR${redirectPath}`, origin);
    successUrl.searchParams.set('social_connected', connected.join(','));
    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('[GOOGLE SOCIAL] Error:', error);
    const origin = getPublicOrigin(request);
    const errorUrl = new URL('/pt-BR/admin/social', origin);
    errorUrl.searchParams.set('social_error', 'server_error');
    return NextResponse.redirect(errorUrl.toString());
  }
}
