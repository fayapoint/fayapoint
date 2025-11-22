import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CourseProgress from '@/models/CourseProgress';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || '';

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

    // Here we would ideally fetch course details (title, thumbnail) from the Products collection
    // For now, we'll return the raw progress and let the frontend map it to known courses,
    // OR we could fetch the product data here if we had the model.
    // Since products are in a different DB or collection, we might need a Product model.
    // But we know the `fayapoint` connection is used. If products are in `fayapointProdutos`, we can't easily join.
    // The frontend has `allCourses` in `src/data/courses`. We can use that on the frontend to enrich the data.

    return NextResponse.json({
      user,
      courses: progress,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
