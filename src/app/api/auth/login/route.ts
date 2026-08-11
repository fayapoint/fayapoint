import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit, getClientIpFromRequest } from '@/lib/rate-limit';
import { registrarUsoAssincrono, prefixoDeIp } from '@/lib/uso';
import { filtroPorQualquerEmail } from '@/lib/identidade';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: Request) {
  try {
    // Rate limit: 10 login attempts per 15 minutes per IP
    const ip = getClientIpFromRequest(request);
    const rl = await rateLimit({
      key: `login:${ip}`,
      limit: 10,
      windowSeconds: 900,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.resetSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    await dbConnect();

    const { email, password } = await request.json();

    // Explicitly select password since it's set to select: false
    //
    // ⚠️ Qualquer e-mail VERIFICADO da conta serve para entrar (10/08/2026) —
    // quem vinculou o e-mail do trabalho não deveria descobrir, no login, que
    // ele não vale. `acharPorQualquerEmail` ignora e-mail não verificado, que é
    // o que impede alguém de entrar numa conta escrevendo o e-mail dela.
    const user = await User.findOne(filtroPorQualquerEmail(email)).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 }
      );
    }

    // DEBUG: Log what select('+password') actually returned
    console.log('[LOGIN DEBUG] email:', email);
    console.log('[LOGIN DEBUG] user found:', !!user);
    console.log('[LOGIN DEBUG] user.password exists:', !!user.password);
    console.log('[LOGIN DEBUG] user.password length:', user.password?.length || 0);
    console.log('[LOGIN DEBUG] user.password type:', typeof user.password);
    console.log('[LOGIN DEBUG] user.password preview:', user.password ? `${user.password.slice(0, 7)}...${user.password.slice(-3)}` : 'EMPTY');

    // SAFEGUARD: If select('+password') didn't return the password,
    // try a direct Mongoose findOne with explicit projection as fallback.
    if (!user.password) {
      console.warn('[LOGIN DEBUG] select(+password) returned no password — trying raw projection fallback');
      const rawUser = await User.findOne({ _id: user._id }, { password: 1 }).lean();
      console.log('[LOGIN DEBUG] Raw projection result — password exists:', !!rawUser?.password, 'length:', (rawUser?.password as string)?.length || 0);
      if (rawUser?.password && typeof rawUser.password === 'string') {
        user.password = rawUser.password;
        console.log('[LOGIN DEBUG] Password recovered via raw projection');
      }
    }

    // Check if user has a valid password set
    if (!user.password || user.password.length < 20) {
      console.error('[LOGIN DEBUG] PASSWORD CHECK FAILED — password is missing or too short even after fallback.');
      return NextResponse.json(
        { error: 'Sua conta não tem senha definida. Por favor, use o link "Esqueci a senha" para criar uma.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 400 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // A entrada na conta é o começo de toda sessão — sem ela a linha do tempo
    // do usuário começa no meio. `lastLoginAt` guarda só a ÚLTIMA; isto guarda
    // todas, com IP e agente.
    registrarUsoAssincrono({
      userId: String(user._id),
      userEmail: user.email,
      kind: 'auth',
      route: 'auth/login',
      method: 'POST',
      status: 200,
      label: 'Entrou na conta',
      ipPrefix: prefixoDeIp(
        request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for'),
      ),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (strip sensitive fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObject: any = user.toObject();
    delete userObject.password;
    delete userObject.savedCards;
    if (userObject.billing) {
      delete userObject.billing.asaasCustomerId;
    }

    const response = NextResponse.json({
      token,
      user: userObject,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    response.cookies.set('token', token, cookieOptions);
    response.cookies.set('fayai_token', token, cookieOptions);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
