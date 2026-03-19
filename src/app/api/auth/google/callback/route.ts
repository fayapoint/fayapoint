// Google OAuth2 Authorization Code Flow callback
// Handles: GET /api/auth/google/callback?code=xxx

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const LOCALES = ['pt-BR', 'en'] as const;

function getRedirectUri(request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/google/callback`;
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
  state: string | null
): URL {
  const safeRedirect = sanitizeRedirectPath(state);
  const loginUrl = new URL(getLocaleAwareLoginPath(state), request.url);
  loginUrl.searchParams.set('error', errorCode);
  loginUrl.searchParams.set('redirect', safeRedirect);
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
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // Contains redirect path

    if (error) {
      return NextResponse.redirect(buildLoginRedirectUrl(request, error, state));
    }

    if (!code) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'no_code', state)
      );
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'config', state)
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(request),
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData.error_description);
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'token_exchange', state)
      );
    }

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'userinfo', state)
      );
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.verified_email) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request, 'email_not_verified', state)
      );
    }

    await dbConnect();

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      user.image = user.image || googleUser.picture;
      user.emailVerified = user.emailVerified || new Date();
      user.lastLoginAt = new Date();
      await user.save();
    } else {
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
    const response = NextResponse.redirect(
      new URL(redirectPath, request.url)
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
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      buildLoginRedirectUrl(request, 'server', request.nextUrl.searchParams.get('state'))
    );
  }
}
