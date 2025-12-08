import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';

// OPTIMIZATION: Cache for 1 hour instead of force-dynamic
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Fetch all images - both public shared ones and AI-generated ones (excluding manual uploads)
    const query = { provider: { $nin: ['upload'] } }; // Show AI creations, exclude manual uploads
    
    const [creations, total] = await Promise.all([
      ImageCreation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('userName imageUrl prompt createdAt category likes'),
      ImageCreation.countDocuments(query)
    ]);

    return NextResponse.json({
      creations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + creations.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Error loading gallery' }, { status: 500 });
  }
}
