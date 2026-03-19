import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const decoded = await getAuthUser();
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = decoded.id;
    const { currentPassword, newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // If user has existing password, verify current one
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Senha atual é obrigatória' },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
      }
    }

    const hadPassword = !!user.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: hadPassword ? 'Senha alterada com sucesso' : 'Senha definida com sucesso',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
