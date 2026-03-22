import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Returns current user profile. Reads from Bearer token or httpOnly cookie.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser();
    console.log('[PROFILE DEBUG] authUser:', authUser ? { id: authUser.id, email: authUser.email } : 'null');
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id).select('-password');

    if (!user) {
      console.log('[PROFILE DEBUG] User NOT FOUND for id:', authUser.id);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('[PROFILE DEBUG] User found:', { email: user.email, plan: user.subscription?.plan, xp: user.progress?.xp, level: user.progress?.level });
    return NextResponse.json({ user: user.toObject() });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = authUser.id;
    const body = await request.json();

    // Validate allowed fields to update
    const { name, profile, preferences } = body;

    const updateData: Record<string, unknown> = {};
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
