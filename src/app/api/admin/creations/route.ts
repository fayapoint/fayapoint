import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken } from '@/lib/admin-auth';
import ImageCreation from '@/models/ImageCreation';

// GET - List all image creations with filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category');
    const isPublic = searchParams.get('isPublic');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    // Build query
    const query: Record<string, unknown> = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (isPublic !== null && isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (search) {
      query.prompt = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      ImageCreation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ImageCreation.countDocuments(query),
    ]);

    // Get stats
    const stats = await ImageCreation.aggregate([
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          publicImages: { $sum: { $cond: ['$isPublic', 1, 0] } },
          totalLikes: { $sum: '$likes' },
          usedInProducts: { $sum: { $cond: [{ $gt: ['$usedInProducts', 0] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        totalImages: 0,
        publicImages: 0,
        totalLikes: 0,
        usedInProducts: 0,
      },
    });

  } catch (error) {
    console.error('Admin creations list error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar criações' },
      { status: 500 }
    );
  }
}

// PUT - Update image creation (toggle public, update category, etc.)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    let update = {};

    switch (action) {
      case 'togglePublic':
        const image = await ImageCreation.findById(id);
        if (!image) {
          return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
        update = { isPublic: !image.isPublic };
        break;

      case 'updateCategory':
        update = { category: updateData.category };
        break;

      case 'addTags':
        update = { $addToSet: { tags: { $each: updateData.tags } } };
        break;

      case 'incrementLikes':
        update = { $inc: { likes: 1 } };
        break;

      default:
        update = updateData;
    }

    const updatedImage = await ImageCreation.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!updatedImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });

  } catch (error) {
    console.error('Admin creations update error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar criação' },
      { status: 500 }
    );
  }
}

// DELETE - Delete image creation
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deletedImage = await ImageCreation.findByIdAndDelete(id);

    if (!deletedImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // TODO: Also delete from Cloudinary if publicId exists
    // if (deletedImage.publicId) {
    //   await cloudinary.uploader.destroy(deletedImage.publicId);
    // }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Admin creations delete error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir criação' },
      { status: 500 }
    );
  }
}
