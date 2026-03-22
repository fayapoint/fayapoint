// Google OAuth2 Authorization Code Flow callback (ALTERNATIVE PATH)
// Handles: GET /api/auth/google-callback?code=xxx
//
// This is a duplicate of /api/auth/google/callback that lives at a
// non-nested path. In Next.js 16 + Turbopack, the nested route under
// /api/auth/google/ (which also has its own route.ts) was returning 404.
// This flat path avoids the parent/child route conflict.

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const LOCALES = ['pt-BR', 'en'] as const;

function getCanonicalOrigin(): string | null {
  const canonicalEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL;

  if (canonicalEnv) {
    return canonicalEnv.replace(/\/$/, '');
  }

  return null;
}

function getPublicOrigin(request: NextRequest): string {
  const canonicalOrigin = getCanonicalOrigin();
  if (canonicalOrigin) {
    return canonicalOrigin;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host');

  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  return url.origin;
}

function getRedirectUri(request: NextRequest): string {
  // IMPORTANT: Must match the redirect_uri used in the initial OAuth request
  return `${getPublicOrigin(request)}/api/auth/google-callback`;
}

function sanitizeRedirectPath(state: string | null): string {
  if (!state || !state.startsWith('/')) {
    return '/portal';
  }

  if (state.startsWith('//')) {
    return '/portal';
  }

  return state;
}

function getLocaleAwareLoginPath(state: string | null): string {
  const safeRedirect = sanitizeRedirectPath(state);
  const matchedLocale = LOCALES.find(
    (locale) => safeRedirect === `/${locale}` || safeRedirect.startsWith(`/${locale}/`)
  );

  return matchedLocale ? `/${matchedLocale}/login` : '/pt-BR/login';
}

function buildLoginRedirectUrl(
  request: NextRequest,
  errorCode: string,
  state: string | null,
  extraParams?: Record<string, string | null | undefined>
): URL {
  const safeRedirect = sanitizeRedirectPath(state);
  const loginUrl = new URL(getLocaleAwareLoginPath(state), getPublicOrigin(request));
  loginUrl.searchParams.set('error', errorCode);
  loginUrl.searchParams.set('redirect', safeRedirect);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) {
        loginUrl.searchParams.set(key, value);
      }
    }
  }
  return loginUrl;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export async function GET(request: NextRequest) {
  console.log('[GOOGLE-CALLBACK] Route handler entered — URL:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    console.log('[GOOGLE-CALLBACK] code:', code ? `${code.slice(0, 10)}...` : 'null', 'error:', error, 'state:', state);

    if (error) {
      return NextResponse.redirect(buildLoginRedirectUrl(request, error, state));
    }

    if (!code) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'no_code', state)
      );
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('[GOOGLE-CALLBACK] OAuth credentials not configured');
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'config', state)
      );
    }

    // Exchange authorization code for tokens
    const redirectUri = getRedirectUri(request);
    console.log('[GOOGLE-CALLBACK] Token exchange with redirect_uri:', redirectUri);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

    const tokenData: GoogleTokenResponse = await tokenResponse.json();
    console.log('[GOOGLE-CALLBACK] Token exchange status:', tokenResponse.status, 'error:', tokenData.error || 'none');

    if (tokenData.error) {
      console.error('[GOOGLE-CALLBACK] Token exchange error:', tokenData.error_description);

      if (tokenData.error === 'invalid_grant') {
        const authUser = await getAuthUser();
        if (authUser) {
          return NextResponse.redirect(
            new URL(sanitizeRedirectPath(state), getPublicOrigin(request))
          );
        }
      }

      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'token_exchange', state, {
          google_error: tokenData.error,
          google_error_description: tokenData.error_description,
        })
      );
    }

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'userinfo', state)
      );
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();
    console.log('[GOOGLE-CALLBACK] Google user:', googleUser.email, googleUser.name);

    if (!googleUser.verified_email) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'email_not_verified', state)
      );
    }

    await dbConnect();

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      console.log('[GOOGLE-CALLBACK] Existing user found:', user.email, 'plan:', user.subscription?.plan, 'level:', user.progress?.level);
      user.image = user.image || googleUser.picture;
      user.emailVerified = user.emailVerified || new Date();
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      console.log('[GOOGLE-CALLBACK] Creating new user:', googleUser.email);
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        emailVerified: new Date(),
        role: 'student',
        lastLoginAt: new Date(),
      });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to the app with token in cookie
    const redirectPath = sanitizeRedirectPath(state);
    console.log('[GOOGLE-CALLBACK] Login successful — redirecting to:', redirectPath);
    const response = NextResponse.redirect(
      new URL(redirectPath, getPublicOrigin(request))
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    };

    response.cookies.set('token', jwtToken, cookieOptions);
    response.cookies.set('fayai_token', jwtToken, cookieOptions);

    return response;
  } catch (error) {
    console.error('[GOOGLE-CALLBACK] Error:', error);
    const errorName = error instanceof Error ? error.name : null;
    const errorCode = errorName === 'TimeoutError' ? 'timeout' : 'server';
    return NextResponse.redirect(
      buildLoginRedirectUrl(request, errorCode, request.nextUrl.searchParams.get('state'))
    );
  }
}
