// Required env vars:
// GOOGLE_CLIENT_ID=xxx
// GOOGLE_CLIENT_SECRET=xxx

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { fireWelcomeFlow } from '@/lib/welcome-email';
import { vincularGoogleDoLogin } from '@/lib/social-identity';
import { rateLimit, getClientIpFromRequest } from '@/lib/rate-limit';
import { acharPorQualquerEmail, vincularEmail } from '@/lib/identidade';

const JWT_SECRET = process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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
        { error: 'Configuração OAuth incompleta: GOOGLE_CLIENT_ID ausente' },
        { status: 500 }
      );
    }

    // Verify the Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    await dbConnect();

    /**
     * Find or create user.
     *
     * ⚠️ Esta é a TERCEIRA porta de entrada pelo Google (as outras duas são os
     * callbacks de código). Ela ficou para trás quando a regra de identidade
     * foi centralizada em `lib/identidade.ts`, e uma porta desatualizada é pior
     * do que porta nenhuma: com `findOne({email})` cru, quem entrasse por aqui
     * com um e-mail que já é secundário verificado de outra conta ganharia uma
     * conta NOVA — a duplicação que o CPF e o índice único existem para
     * impedir, e um crédito de boas-vindas a mais por tentativa.
     */
    let user = await acharPorQualquerEmail(googleUser.email);

    if (user) {
      // Update existing user with Google info
      user.image = user.image || googleUser.picture;
      user.emailVerified = user.emailVerified || new Date();
      user.lastLoginAt = new Date();
      if (!user.name && googleUser.name) user.name = googleUser.name;
      await user.save();
      await vincularEmail(user, googleUser.email, { verificado: true, origem: 'google' });
    } else {
      // Create new user from Google profile
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        emailVerified: new Date(),
        role: 'student',
        lastLoginAt: new Date(),
        emails: [{ email: googleUser.email, verificado: true, origem: 'google', addedAt: new Date() }],
        emailsVerificados: [googleUser.email.toLowerCase()],
      });
      // P5: boas-vindas + aviso ao admin — só em conta NOVA
      fireWelcomeFlow(user.name, user.email, 'google-oauth');
    }

    // Mesma decisão do fluxo de código: quem entrou com o Google já tem o
    // Google conectado. Aqui o `sub` do token é o id da conta.
    await vincularGoogleDoLogin(user._id, {
      id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    response.cookies.set('token', jwtToken, cookieOptions);
    response.cookies.set('fayai_token', jwtToken, cookieOptions);

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro na autenticação Google';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
