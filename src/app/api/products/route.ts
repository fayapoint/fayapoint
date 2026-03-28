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
  getProductStats,
  type Product
} from '@/lib/products';
import { allCourses, type CourseData } from '@/data/courses';

// Convert static course data to Product format as fallback
function courseToProduct(course: CourseData): Product {
  return {
    productId: course.slug,
    slug: course.slug,
    type: 'course',
    status: 'active',
    name: course.title,
    shortName: course.title.split(':')[0].trim(),
    tool: course.tool,
    categoryPrimary: course.category,
    categorySecondary: 'Geral',
    tags: [course.tool.toLowerCase().replace(/\s+/g, '-'), course.category.toLowerCase().replace(/\s+/g, '-')],
    level: course.level,
    targetAudience: course.targetAudience || ['Profissionais', 'Empreendedores'],
    pricing: {
      currency: 'BRL',
      price: course.price,
      originalPrice: course.originalPrice,
      discount: Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100),
      installments: { enabled: true, maxInstallments: 12 },
    },
    metrics: {
      duration: course.duration,
      lessons: course.totalLessons,
      students: course.students,
      rating: course.rating,
      reviewCount: 0,
      completionRate: 0,
      lastUpdated: course.lastUpdated,
    },
    copy: {
      headline: course.title,
      subheadline: course.subtitle,
      shortDescription: course.shortDescription,
      fullDescription: course.fullDescription,
      benefits: course.whatYouLearn?.slice(0, 5) || [],
      impactIndividuals: course.impactForIndividuals || [],
      impactEntrepreneurs: course.impactForEntrepreneurs || [],
      impactCompanies: course.impactForCompanies || [],
    },
    curriculum: {
      moduleCount: course.modules?.length || 0,
      modules: (course.modules || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        duration: m.duration,
        lessons: m.lessons,
      })),
    },
    bonuses: course.bonuses || [],
    guarantees: course.guarantees || ['7 dias de garantia incondicional'],
    testimonials: course.testimonials || [],
    faqs: course.faqs || [],
    cta: {
      primary: { text: 'Matricule-se Agora', url: `/curso/${course.slug}`, style: 'primary' },
    },
    seo: {
      metaTitle: course.title,
      metaDescription: course.shortDescription,
      keywords: [course.tool, course.category],
    },
    digitalAssets: [],
    features: course.features || [],
    createdAt: course.lastUpdated,
    updatedAt: course.lastUpdated,
  } as Product;
}

const staticCourseProducts = allCourses.map(courseToProduct);

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

    // Fallback to static course data when MongoDB is empty
    if (products.length === 0 && (!type || type === 'course')) {
      const fallback = type === 'course' ? staticCourseProducts : staticCourseProducts;
      return NextResponse.json({
        products: fallback.slice(0, limit),
        count: Math.min(fallback.length, limit),
      });
    }

    return NextResponse.json({
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    // On MongoDB error, fallback to static data for courses
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    if (type === 'course') {
      return NextResponse.json({
        products: staticCourseProducts,
        count: staticCourseProducts.length,
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
