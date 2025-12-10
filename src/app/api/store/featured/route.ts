import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StoreProduct from '@/models/StoreProduct';
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

interface FeaturedData {
  featured: unknown[];
  newArrivals: unknown[];
  bestSellers: unknown[];
  deals: unknown[];
}

async function fetchFeaturedProducts(): Promise<FeaturedData> {
  await dbConnect();

  // Get featured products
  const featured = await StoreProduct.find({
    isActive: true,
    isFeatured: true,
  })
    .sort({ soldCount: -1 })
    .limit(8)
    .lean();

  // Get new arrivals
  const newArrivals = await StoreProduct.find({
    isActive: true,
    isNewArrival: true,
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  // Get best sellers
  const bestSellers = await StoreProduct.find({
    isActive: true,
  })
    .sort({ soldCount: -1 })
    .limit(8)
    .lean();

  // Get deals (products with discount)
  const deals = await StoreProduct.find({
    isActive: true,
    discount: { $gt: 0 },
  })
    .sort({ discount: -1 })
    .limit(8)
    .lean();

  return { featured, newArrivals, bestSellers, deals };
}

export async function GET() {
  try {
    // REDIS CACHE: 5 minutes TTL
    const data = await getOrSet<FeaturedData>(
      CACHE_KEYS.STORE_FEATURED,
      fetchFeaturedProducts,
      CACHE_TTL.STORE_FEATURED
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar destaques' },
      { status: 500 }
    );
  }
}
