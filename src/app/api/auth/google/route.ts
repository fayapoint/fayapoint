// Required env vars:
// GOOGLE_CLIENT_ID=xxx
// GOOGLE_CLIENT_SECRET=xxx

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { rateLimit, getClientIpFromRequest } from '@/lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

interface GoogleTokenInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  exp: string;
  error_description?: string;
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );

  if (!response.ok) {
    throw new Error('Invalid Google token');
  }

  const payload: GoogleTokenInfo = await response.json();

  // Verify the token was issued for our app
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Token was not issued for this application');
  }

  // Verify email is verified
  if (payload.email_verified !== 'true') {
    throw new Error('Google email not verified');
  }

  return payload;
}

export async function POST(request: Request) {
  try {
    // Rate limit: 10 requests per hour per IP
    const ip = getClientIpFromRequest(request);
    const rateLimitResult = await rateLimit({
      key: `google-auth:${ip}`,
      limit: 10,
      windowSeconds: 3600,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'Retry-After': String(rateLimitResult.resetSeconds),
          },
        }
      );
    }

    const { token: idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Token do Google não fornecido' },
        { status: 400 }
      );
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'Configuração OAuth incompleta' },
        { status: 500 }
      );
    }

    // Verify the Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    await dbConnect();

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // Update existing user with Google info
      user.image = user.image || googleUser.picture;
      user.emailVerified = user.emailVerified || new Date();
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user from Google profile
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        emailVerified: new Date(),
        role: 'student',
        lastLoginAt: new Date(),
      });
    }

    // Create JWT token (same format as login route)
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;

    const response = NextResponse.json({
      token: jwtToken,
      user: userObject,
    });

    // Set httpOnly cookie for middleware portal protection
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro na autenticação Google';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
