/**
 * Individual Product API Route
 * 
 * GET /api/products/[slug] - Get a single product by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const product = await getProductBySlug(slug);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get related products
    const related = await getRelatedProducts(slug, 3);
    
    return NextResponse.json({ 
      product,
      related
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
