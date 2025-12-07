import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import dbConnect from '@/lib/mongodb';
import DropshippingSource from '@/models/DropshippingSource';
import DropshippingProduct from '@/models/DropshippingProduct';
import {
  convertToBRL,
  calculateSellingPrice,
  calculateTrendingScore,
  estimateDeliveryDays,
  inferCategory,
  calculateDemandScore,
} from '@/lib/dropshipping-utils';
import {
  searchAllPlatforms,
  ScrapedProduct,
} from '@/lib/product-scrapers';
import {
  searchAllProductAPIs,
  searchGoogleShopping,
  searchBraveProducts,
  ProductSearchResult,
} from '@/lib/product-search-apis';

interface SearchFilters {
  query: string;
  sources?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minCommission?: number;
  maxDeliveryDays?: number;
  sortBy?: 'price' | 'rating' | 'trending' | 'commission' | 'delivery';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  limit?: number;
}

interface ProcessedProduct {
  externalId: string;
  sourceSlug: string;
  sourceName: string;
  sourceUrl: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory: string;
  thumbnail: string;
  images: string[];
  originalPrice: number;
  currentPrice: number;
  originalCurrency: string;
  priceBRL: number;
  originalPriceBRL: number;
  exchangeRate: number;
  exchangeRateUpdatedAt: Date;
  sellingPrice: number;
  profitMargin: number;
  profitAmount: number;
  shippingToBrazil: boolean;
  estimatedDeliveryDays: { min: number; max: number };
  supplier: {
    name: string;
    storeUrl: string;
    rating: number;
    totalSales: number;
    responseTime: string;
    onTimeDelivery: number;
    positiveRating: number;
  };
  affiliate: {
    hasProgram: boolean;
    commissionRate: number;
    commissionType: string;
    programName?: string;
  };
  stock: number;
  minOrderQuantity: number;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  trendingScore: number;
  demandScore: number;
  status: string;
}

/**
 * Process scraped products into our standard format
 */
async function processScrapedProducts(
  scrapedProducts: ScrapedProduct[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesMap: Map<string, any>
): Promise<ProcessedProduct[]> {
  const processedProducts: ProcessedProduct[] = [];

  for (const product of scrapedProducts) {
    try {
      // Skip products without essential data
      if (!product.name || product.price <= 0) {
        continue;
      }

      // Find matching source config
      const source = sourcesMap.get(product.sourceSlug);
      const region = source?.region || (product.sourceSlug === 'aliexpress' ? 'china' : 'global');

      // Convert prices to BRL if needed
      const isBRL = product.currency === 'BRL';
      const priceBRL = isBRL ? product.price : await convertToBRL(product.price, product.currency);
      const shippingBRL = product.shippingCost 
        ? (isBRL ? product.shippingCost : await convertToBRL(product.shippingCost, product.currency))
        : 0;

      // Calculate selling price with 30% margin
      const pricing = calculateSellingPrice(priceBRL, shippingBRL, 30);

      // Estimate delivery
      const deliveryEstimate = estimateDeliveryDays(region, 'standard');
      const deliveryDays = product.deliveryDays || deliveryEstimate;

      // Infer category
      const categoryInfo = inferCategory(product.name, product.description);

      // Calculate scores
      const trendingScore = calculateTrendingScore({
        soldCount: product.soldCount || 0,
        reviewCount: product.reviewCount || 0,
        rating: product.rating || 4,
        daysSinceCreated: 30,
        searchVolume: 500,
        priceCompetitiveness: 70,
      });

      const demandScore = calculateDemandScore({
        soldCount: product.soldCount || 0,
        reviewCount: product.reviewCount || 0,
        rating: product.rating || 4,
        stockLevel: product.inStock ? 1000 : 0,
      });

      // Build delivery days object
      let estimatedDeliveryDays: { min: number; max: number };
      if (typeof deliveryDays === 'object' && 'min' in deliveryDays && 'max' in deliveryDays) {
        estimatedDeliveryDays = deliveryDays;
      } else {
        const days = typeof deliveryDays === 'number' ? deliveryDays : 30;
        estimatedDeliveryDays = { min: Math.max(1, days - 5), max: days + 10 };
      }

      processedProducts.push({
        externalId: product.externalId,
        sourceSlug: product.sourceSlug,
        sourceName: product.sourceName,
        sourceUrl: product.productUrl,

        name: product.name,
        description: product.description || product.name,
        shortDescription: (product.description || product.name).substring(0, 150),
        category: categoryInfo.category,
        subcategory: categoryInfo.subcategory || '',

        thumbnail: product.imageUrl || '',
        images: product.images?.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []),

        originalPrice: product.originalPrice || product.price,
        currentPrice: product.price,
        originalCurrency: product.currency,

        priceBRL,
        originalPriceBRL: priceBRL,
        exchangeRate: priceBRL / (product.price || 1),
        exchangeRateUpdatedAt: new Date(),

        sellingPrice: pricing.sellingPrice,
        profitMargin: pricing.profitMargin,
        profitAmount: pricing.profitAmount,

        shippingToBrazil: true,
        estimatedDeliveryDays,

        supplier: {
          name: product.sellerName || product.sourceName,
          storeUrl: product.productUrl,
          rating: product.sellerRating || product.rating || 4,
          totalSales: product.soldCount || 0,
          responseTime: '24h',
          onTimeDelivery: 85,
          positiveRating: 95,
        },

        affiliate: {
          hasProgram: source?.affiliate?.available || false,
          commissionRate: source?.affiliate?.commissionRate || 0,
          commissionType: source?.affiliate?.commissionType || 'percentage',
          programName: source?.affiliate?.name,
        },

        stock: product.inStock !== false ? 1000 : 0,
        minOrderQuantity: 1,
        isAvailable: product.inStock !== false,

        rating: product.rating || 4,
        reviewCount: product.reviewCount || 0,
        soldCount: product.soldCount || 0,

        trendingScore,
        demandScore,

        status: 'pending',
      });
    } catch (error) {
      console.error('Error processing product:', product.name, error);
    }
  }

  return processedProducts;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body: SearchFilters = await request.json();
    const {
      query,
      sources = [],
      minPrice,
      maxPrice,
      minRating,
      minCommission,
      maxDeliveryDays,
      sortBy = 'trending',
      sortOrder = 'desc',
      category,
      limit = 20,
    } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    console.log(`[Dropshipping Search] Query: "${query}", Sources: ${sources.length > 0 ? sources.join(', ') : 'all'}`);

    // Get active sources from database
    let activeSources = await DropshippingSource.find({
      isActive: true,
      'shipping.shipsToBrazil': true,
    }).lean();

    // Filter by requested sources if specified
    if (sources.length > 0) {
      activeSources = activeSources.filter(s => sources.includes(s.slug));
    }

    // Create sources map for quick lookup
    const sourcesMap = new Map(activeSources.map(s => [s.slug, s]));

    // Determine which platforms to search
    const platformsToSearch = sources.length > 0 
      ? sources 
      : ['google', 'amazon', 'mercadolivre', 'aliexpress'];

    console.log(`[Dropshipping Search] Searching platforms: ${platformsToSearch.join(', ')}`);

    // STRATEGY: Try multiple methods for better results
    // 1. First try reliable external APIs (SerpAPI, RapidAPI)
    // 2. Then try direct scraping as fallback
    // 3. Finally use Brave Search as last resort

    let searchResults: { platform: string; products: ScrapedProduct[]; error?: string }[] = [];
    
    // Method 1: Try reliable external APIs first
    const hasRapidAPI = !!process.env.RAPIDAPI_KEY;
    const hasSerpAPI = !!(process.env.SERPAPI_KEY || process.env.SerpAPI);
    const hasBraveAPI = !!(process.env.BRAVE_API_KEY || process.env.Brave_API);
    
    console.log(`[Dropshipping Search] API keys: RapidAPI=${hasRapidAPI}, SerpAPI=${hasSerpAPI}, Brave=${hasBraveAPI}`);

    if (hasRapidAPI || hasSerpAPI) {
      const apiResults = await searchAllProductAPIs(query, platformsToSearch, Math.ceil(limit / platformsToSearch.length) + 5);
      
      // Convert ProductSearchResult to ScrapedProduct format
      for (const result of apiResults) {
        const convertedProducts: ScrapedProduct[] = result.products.map(p => ({
          externalId: p.externalId,
          name: p.name,
          description: p.description,
          price: p.price,
          currency: p.currency,
          originalPrice: p.originalPrice,
          imageUrl: p.imageUrl,
          images: p.images,
          productUrl: p.productUrl,
          sourceName: p.sourceName,
          sourceSlug: p.sourceSlug,
          rating: p.rating,
          reviewCount: p.reviewCount,
          soldCount: p.soldCount,
          deliveryDays: p.deliveryDays,
          sellerName: p.sellerName,
          inStock: p.inStock,
          shippingInfo: p.shippingInfo,
        }));
        
        searchResults.push({
          platform: result.platform,
          products: convertedProducts,
          error: result.error,
        });
      }
    }
    
    // Method 2: If no API keys or no results, try direct scraping
    if (searchResults.every(r => r.products.length === 0)) {
      console.log('[Dropshipping Search] Trying direct scraping as fallback...');
      searchResults = await searchAllPlatforms(query, {
        platforms: platformsToSearch,
        maxResultsPerPlatform: Math.ceil(limit / platformsToSearch.length) + 5,
        minPrice,
        maxPrice,
      });
    }
    
    // Method 3: If still no results and have Brave API, use it as last resort
    if (hasBraveAPI && searchResults.every(r => r.products.length === 0)) {
      console.log('[Dropshipping Search] Using Brave Search as last resort...');
      const braveResults = await searchBraveProducts(query, limit);
      if (braveResults.length > 0) {
        searchResults.push({
          platform: 'brave',
          products: braveResults.map(p => ({
            externalId: p.externalId,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            originalPrice: p.originalPrice,
            imageUrl: p.imageUrl,
            images: p.images,
            productUrl: p.productUrl,
            sourceName: p.sourceName,
            sourceSlug: p.sourceSlug,
            rating: p.rating,
            reviewCount: p.reviewCount,
            soldCount: p.soldCount,
            deliveryDays: p.deliveryDays,
            sellerName: p.sellerName,
            inStock: p.inStock,
            shippingInfo: p.shippingInfo,
          })),
        });
      }
    }

    // Log results from each platform
    const platformSummary: Record<string, number> = {};
    const allScrapedProducts: ScrapedProduct[] = [];
    const searchErrors: string[] = [];

    for (const result of searchResults) {
      platformSummary[result.platform] = result.products.length;
      console.log(`[Dropshipping Search] ${result.platform}: ${result.products.length} products${result.error ? ` (error: ${result.error})` : ''}`);
      
      if (result.error) {
        searchErrors.push(`${result.platform}: ${result.error}`);
      }
      
      allScrapedProducts.push(...result.products);
    }

    console.log(`[Dropshipping Search] Total scraped: ${allScrapedProducts.length} products`);

    // If no results at all, return helpful message
    if (allScrapedProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum produto encontrado. Tente outra busca ou verifique as fontes.',
        query,
        results: [],
        platformsSearched: platformsToSearch,
        platformSummary,
        errors: searchErrors,
        suggestions: [
          `${query} original`,
          `${query} novo`,
          `melhor ${query}`,
        ],
        meta: {
          total: 0,
          totalScraped: 0,
          platformsSearched: platformsToSearch,
          platformSummary,
        }
      });
    }

    // Process scraped products into our format
    const processedProducts = await processScrapedProducts(allScrapedProducts, sourcesMap);

    // Apply filters
    let filteredProducts = processedProducts;

    if (minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.sellingPrice >= minPrice);
    }
    if (maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.sellingPrice <= maxPrice);
    }
    if (minRating !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.rating >= minRating);
    }
    if (minCommission !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.affiliate.commissionRate >= minCommission);
    }
    if (maxDeliveryDays !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.estimatedDeliveryDays.max <= maxDeliveryDays);
    }
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    // Sort results
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.sellingPrice - b.sellingPrice) * sortMultiplier;
        case 'rating':
          return (a.rating - b.rating) * sortMultiplier;
        case 'trending':
          return (a.trendingScore - b.trendingScore) * sortMultiplier;
        case 'commission':
          return (a.affiliate.commissionRate - b.affiliate.commissionRate) * sortMultiplier;
        case 'delivery':
          return (a.estimatedDeliveryDays.max - b.estimatedDeliveryDays.max) * sortMultiplier;
        default:
          return (a.trendingScore - b.trendingScore) * sortMultiplier;
      }
    });

    // Limit results
    filteredProducts = filteredProducts.slice(0, limit);

    // Log admin action
    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Dropshipping search: "${query}"`,
      'product',
      { details: { query, resultsCount: filteredProducts.length, platforms: platformsToSearch } }
    );

    return NextResponse.json({
      success: true,
      query,
      results: filteredProducts,
      suggestions: [
        `${query} premium`,
        `${query} barato`,
        `melhor ${query} 2024`,
      ],
      meta: {
        total: filteredProducts.length,
        totalScraped: allScrapedProducts.length,
        platformsSearched: platformsToSearch,
        platformSummary,
        errors: searchErrors.length > 0 ? searchErrors : undefined,
        filters: { minPrice, maxPrice, minRating, minCommission, maxDeliveryDays, category },
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Dropshipping search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check existing products by URL
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (url) {
      // Check if product already exists
      const existing = await DropshippingProduct.findOne({ sourceUrl: url }).lean();
      return NextResponse.json({
        exists: !!existing,
        product: existing,
      });
    }

    // Return search tips and available sources
    const sources = await DropshippingSource.find({ isActive: true })
      .select('slug displayName logo affiliate.commissionRate shipping.averageDeliveryDays')
      .lean();

    return NextResponse.json({
      sources,
      tips: [
        'Use specific product names for better results',
        'Filter by affiliate commission for passive income',
        'Check delivery times for customer satisfaction',
        'Compare prices across sources',
        'Look for trending products with high demand',
      ],
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
