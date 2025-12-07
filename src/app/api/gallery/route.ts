import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import ImageCreation from '@/models/ImageCreation';

const JWT_SECRET = process.env.JWT_SECRET || '';

export const dynamic = 'force-dynamic';

// GET - Fetch public gallery or user's images
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'public'; // public, my-creations, my-uploads
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'recent'; // recent, popular

    // Auth check for user-specific queries
    let userId: string | null = null;
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string };
        userId = decoded.id || decoded.userId || null;
      } catch {
        // Invalid token, continue without auth for public queries
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = {};
    
    switch (type) {
      case 'public':
        query = { isPublic: true };
        break;
      case 'my-creations':
        // AI-generated images (not uploads or mockups)
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        query = { userId, provider: { $nin: ['upload', 'printify-mockup'] } };
        break;
      case 'my-uploads':
        // User-uploaded designs
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        query = { userId, provider: 'upload' };
        break;
      case 'my-mockups':
        // Printify-generated mockups
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        query = { userId, provider: 'printify-mockup' };
        break;
      case 'all-my':
        // All user's images (creations, uploads, mockups)
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        query = { userId };
        break;
      default:
        query = { isPublic: true };
    }

    // Apply category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Determine sort order
    const sortOption: Record<string, 1 | -1> = sort === 'popular' 
      ? { likes: -1 as const, createdAt: -1 as const } 
      : { createdAt: -1 as const };

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      ImageCreation.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('imageUrl prompt userName category tags likes usedInProducts createdAt provider isPublic')
        .lean(),
      ImageCreation.countDocuments(query),
    ]);

    return NextResponse.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Gallery error:', error);
    return NextResponse.json({ error: 'Erro ao buscar galeria' }, { status: 500 });
  }
}

// POST - Share image to public gallery or update image settings
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Auth required
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string };
      userId = decoded.id || decoded.userId || '';
      if (!userId) throw new Error('No user ID');
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { imageId, action, category, tags } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'imageId required' }, { status: 400 });
    }

    // Find image and verify ownership
    const image = await ImageCreation.findOne({ _id: imageId, userId });
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    switch (action) {
      case 'share':
        // Share to public gallery
        image.isPublic = true;
        if (category) image.category = category;
        if (tags) image.tags = tags;
        break;
      case 'unshare':
        // Remove from public gallery
        image.isPublic = false;
        break;
      case 'update':
        // Update category/tags
        if (category) image.category = category;
        if (tags) image.tags = tags;
        break;
      case 'like':
        // Increment likes (for public images)
        if (image.isPublic) {
          image.likes = (image.likes || 0) + 1;
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await image.save();

    return NextResponse.json({ success: true, image });

  } catch (error) {
    console.error('Gallery update error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

// PUT - Save uploaded image to user's collection
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    // Auth required
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    let userName: string = 'User';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string; name?: string };
      userId = decoded.id || decoded.userId || '';
      userName = decoded.name || 'User';
      if (!userId) throw new Error('No user ID');
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, prompt, category, tags, publicId } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    }

    // Save as an uploaded image
    const newImage = new ImageCreation({
      userId,
      userName,
      imageUrl,
      prompt: prompt || 'Upload manual',
      provider: 'upload',
      category: category || 'general',
      tags: tags || [],
      publicId,
      isPublic: false,
    });

    await newImage.save();

    return NextResponse.json({ success: true, image: newImage });

  } catch (error) {
    console.error('Upload save error:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
