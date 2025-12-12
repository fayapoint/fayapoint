import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getClientIpFromRequest, rateLimit } from '@/lib/rate-limit';

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

    // Create token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (without password)
    const userObject = newUser.toObject();
    delete userObject.password;

    return NextResponse.json({
      success: true,
      token,
      user: userObject,
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
