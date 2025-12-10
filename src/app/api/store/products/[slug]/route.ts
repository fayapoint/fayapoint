import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StoreProduct from '@/models/StoreProduct';
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

interface StoreProductData {
  product: unknown;
  relatedProducts: unknown[];
}

async function fetchStoreProduct(slug: string): Promise<StoreProductData | null> {
  await dbConnect();

  const product = await StoreProduct.findOne({
    slug,
    isActive: true,
  }).lean();

  if (!product) {
    return null;
  }

  // Get related products (same category, excluding current)
  const relatedProducts = await StoreProduct.find({
    category: product.category,
    slug: { $ne: slug },
    isActive: true,
  })
    .limit(4)
    .lean();

  return { product, relatedProducts };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // REDIS CACHE: 10 minutes TTL
    const data = await getOrSet<StoreProductData | null>(
      CACHE_KEYS.STORE_PRODUCT(slug),
      () => fetchStoreProduct(slug),
      CACHE_TTL.STORE_PRODUCT
    );

    if (!data) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}
