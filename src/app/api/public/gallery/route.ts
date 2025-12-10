import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

// OPTIMIZATION: Force dynamic because we use searchParams
export const dynamic = "force-dynamic";

interface GalleryResponse {
  creations: Array<{
    _id: string;
    userName: string;
    imageUrl: string;
    prompt: string;
    createdAt: Date;
    category?: string;
    likes?: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

async function fetchGalleryPage(page: number, limit: number): Promise<GalleryResponse> {
  await dbConnect();
  
  const skip = (page - 1) * limit;
  
  // Fetch all images - both public shared ones and AI-generated ones (excluding manual uploads)
  const query = { provider: { $nin: ['upload'] } }; // Show AI creations, exclude manual uploads
  
  const [creations, total] = await Promise.all([
    ImageCreation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('userName imageUrl prompt createdAt category likes')
      .lean(),
    ImageCreation.countDocuments(query)
  ]);

  return {
    creations: creations as unknown as GalleryResponse['creations'],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + creations.length < total
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // REDIS CACHE: 2 minutes TTL per page
    const data = await getOrSet<GalleryResponse>(
      CACHE_KEYS.GALLERY(page, limit),
      () => fetchGalleryPage(page, limit),
      CACHE_TTL.GALLERY
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Error loading gallery' }, { status: 500 });
  }
}
