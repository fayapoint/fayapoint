import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

const RESOURCES_BY_PLAN = {
  free: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Cursos Introdutórios', available: true },
    { name: 'Geração de Imagens AI', available: false, limit: '0/mês' },
    { name: 'Suporte Prioritário', available: false },
    { name: 'Download de Materiais', available: false },
  ],
  starter: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Cursos Introdutórios', available: true },
    { name: 'Geração de Imagens AI', available: true, limit: '50/mês' },
    { name: 'Suporte Prioritário', available: false },
    { name: 'Download de Materiais', available: true },
  ],
  pro: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Todos os Cursos', available: true },
    { name: 'Geração de Imagens AI', available: true, limit: 'Ilimitado' },
    { name: 'Suporte Prioritário', available: true },
    { name: 'Download de Materiais', available: true },
    { name: 'Mentoria Mensal', available: true },
  ],
  business: [
    { name: 'Acesso à Comunidade', available: true },
    { name: 'Todos os Cursos', available: true },
    { name: 'Geração de Imagens AI', available: true, limit: 'Ilimitado' },
    { name: 'Suporte Dedicado', available: true },
    { name: 'Download de Materiais', available: true },
    { name: 'Gestão de Equipe', available: true },
    { name: 'API Access', available: true },
  ],
};

export async function GET(request: Request) {
  try {
    await dbConnect();

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded: { id: string; iat: number; exp: number } | string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (typeof decoded === 'string' || !decoded.id) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Fetch user details
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Fetch course progress
    const progress = await CourseProgress.find({ userId }).sort({ lastAccessedAt: -1 });

    // Fetch orders
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // Determine resources based on plan
    const plan = user.subscription?.plan || 'free';
    const resources = RESOURCES_BY_PLAN[plan as keyof typeof RESOURCES_BY_PLAN] || RESOURCES_BY_PLAN.free;

    return NextResponse.json({
      user,
      courses: progress,
      orders,
      resources,
      plan,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
