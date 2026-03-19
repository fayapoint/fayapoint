import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();

    const decoded = await getAuthUser();
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        subscription: user.subscription,
        billing: user.billing,
        savedCards: user.savedCards?.map(card => ({
          _id: card._id,
          lastFour: card.lastFour,
          brand: card.brand,
          holderName: card.holderName,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          isDefault: card.isDefault,
        })),
        profile: user.profile,
        progress: user.progress,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Account GET error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const decoded = await getAuthUser();
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, profile, preferences } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    if (profile) {
      const allowedProfileFields = ['bio', 'linkedin', 'company', 'position', 'interests', 'skills', 'website', 'location'];
      for (const [key, value] of Object.entries(profile)) {
        if (allowedProfileFields.includes(key)) {
          updateData[`profile.${key}`] = value;
        }
      }
    }

    if (preferences) {
      const allowedPrefFields = ['language', 'theme', 'playbackSpeed'];
      for (const [key, value] of Object.entries(preferences)) {
        if (allowedPrefFields.includes(key)) {
          updateData[`preferences.${key}`] = value;
        }
      }
      if (preferences.notifications && typeof preferences.notifications === 'object') {
        const allowedNotifFields = ['email', 'push', 'marketing', 'courseUpdates', 'communityActivity'];
        for (const [key, value] of Object.entries(preferences.notifications as Record<string, unknown>)) {
          if (allowedNotifFields.includes(key)) {
            updateData[`preferences.notifications.${key}`] = value;
          }
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        role: updatedUser.role,
        subscription: updatedUser.subscription,
        profile: updatedUser.profile,
        preferences: updatedUser.preferences,
      },
    });
  } catch (error) {
    console.error('Account PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
