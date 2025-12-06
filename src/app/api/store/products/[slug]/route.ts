import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StoreProduct from '@/models/StoreProduct';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const product = await StoreProduct.findOne({
      slug,
      isActive: true,
    }).lean();

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Get related products (same category, excluding current)
    const relatedProducts = await StoreProduct.find({
      category: product.category,
      slug: { $ne: slug },
      isActive: true,
    })
      .limit(4)
      .lean();

    return NextResponse.json({
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}
