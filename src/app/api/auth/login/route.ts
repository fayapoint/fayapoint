import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function POST(request: Request) {
  try {
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

    const isMatch = await bcrypt.compare(password, user.password || '');

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

    // Return user info (without password)
    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json({
      token,
      user: userObject,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
