import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from './mongodb';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function verifyAdminToken(request: NextRequest): Promise<{ 
  valid: boolean; 
  admin?: { id: string; email: string; name: string }; 
  error?: string 
}> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Token não fornecido' };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;

    await dbConnect();
    const user = await User.findById(decoded.id);

    if (!user) {
      return { valid: false, error: 'Usuário não encontrado' };
    }

    if (user.role !== 'admin') {
      return { valid: false, error: 'Acesso não autorizado - Apenas administradores' };
    }

    return { 
      valid: true, 
      admin: { 
        id: (user._id as { toString(): string }).toString(), 
        email: user.email, 
        name: user.name 
      } 
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expirado' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Token inválido' };
    }
    return { valid: false, error: 'Erro de autenticação' };
  }
}

export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  category: 'auth' | 'user' | 'product' | 'order' | 'system' | 'database',
  options?: {
    targetType?: 'user' | 'product' | 'order' | 'setting';
    targetId?: string;
    details?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }
) {
  try {
    await dbConnect();
    await AdminLog.create({
      adminId,
      adminEmail,
      action,
      category,
      ...options,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
