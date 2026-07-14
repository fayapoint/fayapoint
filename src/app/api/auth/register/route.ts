import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getClientIpFromRequest, rateLimit } from '@/lib/rate-limit';
import { fireWelcomeFlow } from '@/lib/welcome-email';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: Request) {
  try {
    const ip = getClientIpFromRequest(request);
    const ua = request.headers.get('user-agent') ?? '';

    if (!ua || /bot|crawler|spider|headless/i.test(ua)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rl = await rateLimit({
      key: `ratelimit:auth:register:ip:${ip}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.resetSeconds) },
        }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, password, role, interest, source } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student', // Default role
      profile: {
        interests: interest ? interest.split(',') : [],
        position: role // Store the selected role (developer, designer, etc) in profile.position or create a new field if needed, but 'role' in schema is enum student/instructor/admin
      },
      source: source || 'onboarding_v2',
      preferences: {
        theme: 'dark', // Default to dark mode based on UI
      },
      subscription: {
        plan: 'free',
        status: 'active'
      }
    });

    // P5: boas-vindas + aviso ao admin — fire-and-forget, nunca bloqueia
    fireWelcomeFlow(newUser.name, newUser.email, source || 'onboarding_v2');

    // Create token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (without password)
    const userObject = newUser.toObject();
    delete userObject.password;

    const response = NextResponse.json({
      success: true,
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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
