import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import UserPODProduct, { generateProductSlug, POD_CATEGORIES } from '@/models/UserPODProduct';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).lean();
    return user as { _id: string; name?: string; email?: string } | null;
  } catch {
    return null;
  }
}

// GET - List user's POD products
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: user._id };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      UserPODProduct.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserPODProduct.countDocuments(query),
    ]);

    // Get stats
    const allProducts = await UserPODProduct.find({ userId: user._id }).lean();
    const stats = {
      total: allProducts.length,
      draft: allProducts.filter(p => p.status === 'draft').length,
      active: allProducts.filter(p => p.status === 'active').length,
      paused: allProducts.filter(p => p.status === 'paused').length,
      totalSales: allProducts.reduce((sum, p) => sum + (p.sales || 0), 0),
      totalRevenue: allProducts.reduce((sum, p) => sum + (p.revenue || 0), 0),
    };

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
      categories: POD_CATEGORIES,
    });
  } catch (error) {
    console.error('Error fetching user POD products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

// POST - Create new POD product
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      tags,
      designFiles,
      mockupImages,
      primaryMockup,
      templateId,
      templateName,
      baseProductType,
      variants,
      baseCost,
      suggestedPrice,
      minimumPrice,
      providers,
      primaryProvider,
      showInUserStore,
      showInMarketplace,
    } = body;

    // Validate required fields
    if (!title || !description || !category || !templateId || !designFiles?.length) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, description, category, templateId, designFiles' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = generateProductSlug(title, user._id.toString());

    // Create product
    const product = new UserPODProduct({
      userId: user._id,
      title,
      slug,
      description,
      shortDescription,
      category,
      subcategory,
      tags: tags || [],
      designFiles,
      mockupImages: mockupImages || [],
      primaryMockup,
      templateId,
      templateName: templateName || templateId,
      baseProductType: baseProductType || category,
      variants: variants || [],
      baseCost: baseCost || 0,
      suggestedPrice: suggestedPrice || baseCost * 1.5,
      minimumPrice: minimumPrice || baseCost * 1.2,
      currency: 'BRL',
      providers: providers || [],
      primaryProvider,
      status: 'draft',
      isPublished: false,
      showInUserStore: showInUserStore ?? true,
      showInMarketplace: showInMarketplace ?? false,
    });

    await product.save();

    return NextResponse.json({
      message: 'Produto criado com sucesso',
      product,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating POD product:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}

// PUT - Update POD product
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, ...updates } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    // Find and verify ownership
    const product = await UserPODProduct.findOne({
      _id: productId,
      userId: user._id,
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Handle status changes
    if (updates.status === 'active' && product.status !== 'active') {
      updates.isPublished = true;
      updates.publishedAt = new Date();
    } else if (updates.status === 'paused' || updates.status === 'archived') {
      updates.isPublished = false;
    }

    // Update product
    Object.assign(product, updates);
    await product.save();

    return NextResponse.json({
      message: 'Produto atualizado com sucesso',
      product,
    });
  } catch (error) {
    console.error('Error updating POD product:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE - Delete POD product
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const result = await UserPODProduct.findOneAndDelete({
      _id: productId,
      userId: user._id,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Produto excluído com sucesso',
    });
  } catch (error) {
    console.error('Error deleting POD product:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
}
