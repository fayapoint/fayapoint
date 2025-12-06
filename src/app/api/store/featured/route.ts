import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StoreProduct from '@/models/StoreProduct';

export async function GET() {
  try {
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

    return NextResponse.json({
      featured,
      newArrivals,
      bestSellers,
      deals,
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar destaques' },
      { status: 500 }
    );
  }
}
