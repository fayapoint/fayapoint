import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const creations = await ImageCreation.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('userName imageUrl prompt createdAt');

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Erro ao carregar galeria' }, { status: 500 });
  }
}
