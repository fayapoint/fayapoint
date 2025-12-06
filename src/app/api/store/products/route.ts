import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StoreProduct, { STORE_CATEGORIES } from '@/models/StoreProduct';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { isActive: true };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (featured === 'true') query.isFeatured = true;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions: Record<string, 1 | -1> = {};
    if (search) {
      sortOptions.score = { $meta: 'textScore' } as unknown as 1;
    }
    
    switch (sort) {
      case 'price':
        sortOptions.price = order === 'asc' ? 1 : -1;
        break;
      case 'name':
        sortOptions.name = order === 'asc' ? 1 : -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      case 'sold':
        sortOptions.soldCount = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    // Execute queries
    const [products, total] = await Promise.all([
      StoreProduct.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      StoreProduct.countDocuments(query),
    ]);

    // Get categories with counts for sidebar filters
    const categoryCounts = await StoreProduct.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Get brands for filters
    const brands = await StoreProduct.distinct('brand', { isActive: true });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories: STORE_CATEGORIES,
        categoryCounts: categoryCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {} as Record<string, number>),
        brands,
      },
    });
  } catch (error) {
    console.error('Error fetching store products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}
