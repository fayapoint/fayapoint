import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function fetchUserCreations(userId: string) {
  await dbConnect();
  return ImageCreation.find({ userId })
    .sort({ createdAt: -1 })
    .select('imageUrl prompt createdAt provider')
    .lean();
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = authUser.id;

    // REDIS CACHE: 1 minute TTL - user-specific, refreshed on new creation
    const creations = await getOrSet(
      CACHE_KEYS.USER_CREATIONS(userId),
      () => fetchUserCreations(userId),
      CACHE_TTL.USER_SESSION
    );

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching user creations:', error);
    return NextResponse.json({ error: 'Erro ao buscar criações' }, { status: 500 });
  }
}
