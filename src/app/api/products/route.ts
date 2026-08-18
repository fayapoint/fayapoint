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
 *   - locale: `en` serve o catálogo traduzido; qualquer outra coisa, português
 *
 * ## O `locale`, e por que ele TEM de estar na URL
 *
 * Até 18/08/2026 esta rota respondia sempre em português, para qualquer
 * visitante: nenhum dos componentes que a chamam passava idioma, e a tradução
 * do catálogo (`i18n.en` dentro de cada produto) nunca era aplicada. O leitor
 * inglês via a vitrine renderizada no servidor em inglês e, assim que o
 * `useEffect` trocava a lista pela resposta desta rota, os cartões voltavam ao
 * português na frente dele.
 *
 * O idioma vem da query, e não do `Referer`, porque esta rota é cacheada na
 * borda por 10 minutos (`next.config.ts` e `netlify.toml`, os dois com
 * `s-maxage=600` para `/api/products/:path*`): com o idioma fora da chave do
 * cache, a primeira visita inglesa serviria inglês a todos os leitores
 * portugueses dos dez minutos seguintes. Ver `localeDaBusca` em
 * `src/lib/idioma.ts`.
 *
 * ⚠️ Estar na query NÃO basta sozinho. A Netlify responde com
 * `Netlify-Vary: query=<lista>`, e a lista padrão do adaptador do Next tem só
 * `__nextDataReq|_rsc` — todo o resto da query é ignorado pela chave. Medido em
 * produção antes do conserto: `?action=stats`, `?action=categories` e
 * `?search=chatgpt` recebiam todos a LISTA DE PRODUTOS, com `Cache-Status:
 * hit`. Parâmetro novo aqui entra também em `CHAVE_DE_CACHE_DE_PRODUTOS`
 * (`next.config.ts` e `netlify.toml`), senão a borda o ignora em silêncio.
 *
 * ⚠️ Tudo que sai daqui passa por `paraIdioma*`, inclusive os ramos que já
 * estavam em português por outro motivo. Não é só tradução: `paraIdioma`
 * também APAGA o subdocumento `i18n`, e sem ele as respostas de `category`,
 * `tag`, `search` e `featured` viajavam com o catálogo inteiro nas duas
 * línguas.
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
  paraIdiomaLista,
  type Product
} from '@/lib/products';
import { localeDaBusca } from '@/lib/idioma';
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
    const locale = localeDaBusca(searchParams);
    
    // Handle special actions
    if (action === 'categories') {
      const categories = await getAllCategories();
      return NextResponse.json({ categories });
    }
    
    if (action === 'featured') {
      const featuredLimit = parseInt(searchParams.get('limit') || '3');
      const products = paraIdiomaLista(await getFeaturedProducts(featuredLimit), locale);
      return NextResponse.json({ products, count: products.length });
    }
    
    if (action === 'stats') {
      const stats = await getProductStats();
      return NextResponse.json(stats);
    }
    
    // Search
    if (search) {
      const products = paraIdiomaLista(await searchProducts(search, type), locale);
      return NextResponse.json({ 
        products, 
        count: products.length,
        query: search 
      });
    }
    
    // Filter by category
    if (category) {
      const products = paraIdiomaLista(await getProductsByCategory(category), locale);
      return NextResponse.json({ 
        products, 
        count: products.length,
        category 
      });
    }
    
    // Filter by tag
    if (tag) {
      const products = paraIdiomaLista(await getProductsByTag(tag), locale);
      return NextResponse.json({ 
        products, 
        count: products.length,
        tag 
      });
    }
    
    // Get all products
    const products = await getAllProducts({ limit, sortBy, type, locale });

    // Fallback to static course data when MongoDB is empty.
    // ⚠️ Continua em português nos dois idiomas: `@/data/courses` é um arquivo
    // escrito à mão, sem tradução. É a rede de segurança para banco vazio —
    // preferir texto em português a vitrine vazia. Traduzir isto seria
    // traduzir um arquivo que só existe para o caso de o banco sumir.
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
