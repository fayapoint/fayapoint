import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).select('-password').lean();
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });

  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { name, email, role, plan, planStatus, password, profile, preferences } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Track changes for logging
    const changes: Record<string, unknown> = {};

    // Update basic fields
    if (name && name !== user.name) {
      changes.name = { from: user.name, to: name };
      user.name = name;
    }
    
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
      }
      changes.email = { from: user.email, to: email };
      user.email = email.toLowerCase();
    }
    
    if (role && role !== user.role) {
      changes.role = { from: user.role, to: role };
      user.role = role;
    }
    
    if (plan && plan !== user.subscription?.plan) {
      changes.plan = { from: user.subscription?.plan, to: plan };
      user.subscription = user.subscription || {};
      user.subscription.plan = plan;
    }
    
    if (planStatus && planStatus !== user.subscription?.status) {
      changes.planStatus = { from: user.subscription?.status, to: planStatus };
      user.subscription = user.subscription || {};
      user.subscription.status = planStatus;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
      changes.password = 'updated';
    }

    // Update profile if provided
    if (profile) {
      user.profile = { ...user.profile, ...profile };
      changes.profile = 'updated';
    }

    // Update preferences if provided
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
      changes.preferences = 'updated';
    }

    await user.save();

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Updated user',
      'user',
      {
        targetType: 'user',
        targetId: id,
        details: changes,
      }
    );

    const updatedUser = await User.findById(id).select('-password').lean();

    return NextResponse.json({
      success: true,
      user: updatedUser,
      changes,
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Prevent deleting yourself
    if (user.email === authResult.admin.email) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      );
    }

    // Store user info for logging before deletion
    const userInfo = { email: user.email, name: user.name, role: user.role };

    await User.findByIdAndDelete(id);

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Deleted user',
      'user',
      {
        targetType: 'user',
        targetId: id,
        details: userInfo,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso',
    });

  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    );
  }
}
