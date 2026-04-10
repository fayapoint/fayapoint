// Facebook OAuth callback for social account connection
// GET /api/social/connect/facebook/callback?code=xxx&state=xxx
// Exchanges code for token, fetches user info + pages, saves as SocialAccount

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SocialAccount from '@/models/SocialAccount';

export const dynamic = 'force-dynamic';

const FB_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const GRAPH_API = 'https://graph.facebook.com/v21.0';

function getPublicOrigin(request: NextRequest): string {
  const canonical = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (canonical) return canonical.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  error?: { message: string; type: string; code: number };
}

interface FBUser {
  id: string;
  name: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

interface FBPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  instagram_business_account?: { id: string };
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH_API}/oauth/access_token?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

async function getLongLivedToken(shortToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${GRAPH_API}/oauth/access_token?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

async function getUserInfo(token: string): Promise<FBUser> {
  const res = await fetch(`${GRAPH_API}/me?fields=id,name,email,picture&access_token=${token}`, {
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

async function getUserPages(token: string): Promise<FBPage[]> {
  const res = await fetch(`${GRAPH_API}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${token}`, {
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  return data.data || [];
}

async function getInstagramAccount(igId: string, pageToken: string) {
  const res = await fetch(`${GRAPH_API}/${igId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website&access_token=${pageToken}`, {
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');

    const origin = getPublicOrigin(request);
    const redirectUri = `${origin}/api/social/connect/facebook/callback`;

    // Decode state
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

    if (!FB_APP_ID || !FB_APP_SECRET) {
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', 'config_missing');
      return NextResponse.redirect(errorUrl.toString());
    }

    // 1. Exchange code for short-lived token
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    if (tokenData.error) {
      console.error('[FB CALLBACK] Token exchange error:', tokenData.error);
      const errorUrl = new URL(`/pt-BR${redirectPath}`, origin);
      errorUrl.searchParams.set('social_error', 'token_exchange');
      return NextResponse.redirect(errorUrl.toString());
    }

    // 2. Exchange for long-lived token (~60 days)
    const longLived = await getLongLivedToken(tokenData.access_token);
    const accessToken = longLived.access_token || tokenData.access_token;
    const expiresIn = longLived.expires_in || tokenData.expires_in || 5184000; // 60 days default

    // 3. Get user info
    const fbUser = await getUserInfo(accessToken);

    // 4. Get pages (and Instagram business accounts linked to pages)
    const pages = await getUserPages(accessToken);

    await dbConnect();

    // 5. Save Facebook personal account
    await SocialAccount.findOneAndUpdate(
      { userId, platform: 'facebook' },
      {
        platformUserId: fbUser.id,
        username: fbUser.name,
        profileUrl: `https://facebook.com/${fbUser.id}`,
        accessToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        isActive: true,
        status: 'active',
        lastSync: new Date(),
        metadata: {
          profilePictureUrl: fbUser.picture?.data?.url || '',
          businessAccount: pages.length > 0,
        },
      },
      { upsert: true, new: true }
    );

    // 6. Save each Page as a separate "facebook" connection? No — save page tokens for posting
    // For now, store the first page's token in the account for publishing
    if (pages.length > 0) {
      const primaryPage = pages[0];
      // Update with page-level access (page tokens don't expire if user token is long-lived)
      await SocialAccount.findOneAndUpdate(
        { userId, platform: 'facebook' },
        {
          $set: {
            'metadata.pageName': primaryPage.name,
            'metadata.pageId': primaryPage.id,
            'metadata.pageCategory': primaryPage.category,
            // Store page access token (never expires) for publishing
            accessToken: primaryPage.access_token,
          },
        }
      );
    }

    // 7. Auto-discover and save Instagram business accounts
    for (const page of pages) {
      if (page.instagram_business_account?.id) {
        try {
          const igAccount = await getInstagramAccount(page.instagram_business_account.id, page.access_token);
          await SocialAccount.findOneAndUpdate(
            { userId, platform: 'instagram' },
            {
              platformUserId: igAccount.id,
              username: igAccount.username || igAccount.name || '',
              profileUrl: `https://instagram.com/${igAccount.username || ''}`,
              accessToken: page.access_token, // Use page token for IG API
              tokenExpiresAt: new Date(Date.now() + 5184000 * 1000), // ~60 days
              isActive: true,
              status: 'active',
              lastSync: new Date(),
              metadata: {
                followerCount: igAccount.followers_count || 0,
                followingCount: igAccount.follows_count || 0,
                postCount: igAccount.media_count || 0,
                profilePictureUrl: igAccount.profile_picture_url || '',
                biography: igAccount.biography || '',
                websiteUrl: igAccount.website || '',
                businessAccount: true,
              },
            },
            { upsert: true, new: true }
          );
        } catch (e) {
          console.error('[FB CALLBACK] Instagram discovery error:', e);
        }
      }
    }

    // 8. Redirect back to social dashboard with success
    const successUrl = new URL(`/pt-BR${redirectPath}`, origin);
    successUrl.searchParams.set('social_connected', 'facebook');
    if (pages.some(p => p.instagram_business_account?.id)) {
      successUrl.searchParams.set('also_connected', 'instagram');
    }
    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('[FB CALLBACK] Error:', error);
    const origin = getPublicOrigin(request);
    const errorUrl = new URL('/pt-BR/admin/social', origin);
    errorUrl.searchParams.set('social_error', 'server_error');
    return NextResponse.redirect(errorUrl.toString());
  }
}
