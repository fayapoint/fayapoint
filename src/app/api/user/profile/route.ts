import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.id;
    const body = await request.json();

    // Validate allowed fields to update
    const { name, profile, preferences } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (profile) {
        // Use dot notation for nested updates to avoid overwriting the whole object
        for (const [key, value] of Object.entries(profile)) {
            updateData[`profile.${key}`] = value;
        }
    }
    if (preferences) {
        for (const [key, value] of Object.entries(preferences)) {
            updateData[`preferences.${key}`] = value;
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
