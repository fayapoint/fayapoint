// Facebook OAuth initiation for social account connection (not login)
// GET /api/social/connect/facebook -> redirects to Facebook OAuth dialog

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const FB_APP_ID = process.env.FACEBOOK_APP_ID || '';
// Standard access permissions (no app review needed in dev mode):
// - public_profile, email: always granted
// - pages_show_list: standard access
// - pages_read_engagement, pages_manage_posts: need advanced access for production
// - instagram_basic, instagram_manage_insights: need advanced for production
// In development mode, these all work for app admins/developers/testers
const SCOPES = [
  'public_profile',
  'email',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_manage_insights',
].join(',');

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

  if (!FB_APP_ID) {
    return NextResponse.json({ error: 'Facebook App ID not configured' }, { status: 500 });
  }

  const origin = getPublicOrigin(request);
  const redirectUri = `${origin}/api/social/connect/facebook/callback`;
  // State encodes user ID + redirect path for security
  const state = JSON.stringify({ userId: user.id, redirect: '/admin/social' });
  const encodedState = Buffer.from(state).toString('base64url');

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', FB_APP_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', encodedState);
  authUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(authUrl.toString());
}
