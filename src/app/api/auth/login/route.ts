import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit, getClientIpFromRequest } from '@/lib/rate-limit';

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
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 }
      );
    }

    // Check if user has a valid password set
    if (!user.password || user.password.length < 20) {
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

    // Set httpOnly cookie for middleware portal protection
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
