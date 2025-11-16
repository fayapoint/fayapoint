/**
 * Products API Route
 * 
 * GET /api/products - Get all products with optional filters
 * Query params:
 *   - category: Filter by category
 *   - tag: Filter by tag
 *   - search: Search query
 *   - limit: Max results
 *   - sortBy: Sort order (students, rating, price, newest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllProducts, 
  getProductsByCategory,
  getProductsByTag,
  searchProducts,
  getAllCategories,
  getFeaturedProducts,
  getProductStats
} from '@/lib/products';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'course' | 'tool' | undefined;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const sortBy = searchParams.get('sortBy') as 'students' | 'rating' | 'price' | 'newest' | undefined;
    const action = searchParams.get('action');
    
    // Handle special actions
    if (action === 'categories') {
      const categories = await getAllCategories();
      return NextResponse.json({ categories });
    }
    
    if (action === 'featured') {
      const featuredLimit = parseInt(searchParams.get('limit') || '3');
      const products = await getFeaturedProducts(featuredLimit);
      return NextResponse.json({ products, count: products.length });
    }
    
    if (action === 'stats') {
      const stats = await getProductStats();
      return NextResponse.json(stats);
    }
    
    // Search
    if (search) {
      const products = await searchProducts(search, type);
      return NextResponse.json({ 
        products, 
        count: products.length,
        query: search 
      });
    }
    
    // Filter by category
    if (category) {
      const products = await getProductsByCategory(category);
      return NextResponse.json({ 
        products, 
        count: products.length,
        category 
      });
    }
    
    // Filter by tag
    if (tag) {
      const products = await getProductsByTag(tag);
      return NextResponse.json({ 
        products, 
        count: products.length,
        tag 
      });
    }
    
    // Get all products
    const products = await getAllProducts({ limit, sortBy, type });
    return NextResponse.json({ 
      products, 
      count: products.length 
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
