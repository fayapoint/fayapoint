import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';

const JWT_SECRET = process.env.JWT_SECRET || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const creations = await ImageCreation.find({ userId: decoded.userId })
        .sort({ createdAt: -1 })
        .select('imageUrl prompt createdAt provider');

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching user creations:', error);
    return NextResponse.json({ error: 'Erro ao buscar criações' }, { status: 500 });
  }
}
