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
  generateSlug,
  extractProductId,
  inferCategory,
  calculateDemandScore,
} from '@/lib/dropshipping-utils';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

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

interface AISearchResult {
  products: {
    name: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string;
    sourceUrl: string;
    sourceName: string;
    rating?: number;
    soldCount?: number;
    shippingCost?: number;
    deliveryDays?: number;
    features?: string[];
  }[];
  suggestions?: string[];
}

/**
 * AI-powered product search using OpenRouter
 */
async function aiProductSearch(query: string, sources: string[]): Promise<AISearchResult> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not configured, using mock data');
    return generateMockSearchResults(query, sources);
  }

  try {
    const systemPrompt = `You are a product research assistant specializing in dropshipping and e-commerce. 
Your task is to search for products across multiple platforms and return structured data.
Always focus on products that:
1. Ship to Brazil
2. Have competitive pricing
3. Have good reviews/ratings
4. Are trending or in high demand

Return your response as a valid JSON object with this structure:
{
  "products": [
    {
      "name": "Product name",
      "description": "Brief description",
      "price": 29.99,
      "currency": "USD",
      "imageUrl": "https://...",
      "sourceUrl": "https://...",
      "sourceName": "AliExpress",
      "rating": 4.5,
      "soldCount": 1500,
      "shippingCost": 3.50,
      "deliveryDays": 25,
      "features": ["Feature 1", "Feature 2"]
    }
  ],
  "suggestions": ["related search 1", "related search 2"]
}`;

    const userPrompt = `Search for products matching: "${query}"
Focus on these platforms: ${sources.join(', ')}
Find 10-20 products with the best value for dropshipping to Brazil.
Include price in original currency, estimated shipping cost to Brazil, and delivery time.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://fayapoint.com',
        'X-Title': 'FayaPoint Dropshipping Search',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('AI search failed:', await response.text());
      return generateMockSearchResults(query, sources);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.error('Failed to parse AI response as JSON');
      }
    }

    return generateMockSearchResults(query, sources);
  } catch (error) {
    console.error('AI search error:', error);
    return generateMockSearchResults(query, sources);
  }
}

/**
 * Generate mock search results for testing/fallback
 */
function generateMockSearchResults(query: string, sources: string[]): AISearchResult {
  const mockProducts = [
    {
      name: `${query} - High Quality Version`,
      description: `Premium ${query} with excellent features and fast shipping to Brazil`,
      price: 29.99,
      currency: 'USD',
      imageUrl: 'https://via.placeholder.com/400x400?text=Product',
      sourceUrl: 'https://aliexpress.com/item/example',
      sourceName: sources[0] || 'AliExpress',
      rating: 4.7,
      soldCount: 2500,
      shippingCost: 5.99,
      deliveryDays: 25,
      features: ['High quality materials', 'Fast shipping', '30-day warranty'],
    },
    {
      name: `${query} - Budget Edition`,
      description: `Affordable ${query} with good value for money`,
      price: 15.99,
      currency: 'USD',
      imageUrl: 'https://via.placeholder.com/400x400?text=Product2',
      sourceUrl: 'https://aliexpress.com/item/example2',
      sourceName: sources[0] || 'AliExpress',
      rating: 4.3,
      soldCount: 5000,
      shippingCost: 3.50,
      deliveryDays: 30,
      features: ['Good value', 'Popular choice', 'Free shipping option'],
    },
    {
      name: `${query} - Pro Version`,
      description: `Professional grade ${query} for demanding users`,
      price: 59.99,
      currency: 'USD',
      imageUrl: 'https://via.placeholder.com/400x400?text=Product3',
      sourceUrl: 'https://amazon.com/dp/example',
      sourceName: sources[1] || 'Amazon',
      rating: 4.9,
      soldCount: 800,
      shippingCost: 12.99,
      deliveryDays: 14,
      features: ['Premium quality', 'Extended warranty', 'Fast Amazon delivery'],
    },
  ];

  return {
    products: mockProducts,
    suggestions: [`${query} accessories`, `${query} premium`, `best ${query} 2024`],
  };
}

/**
 * Process and enrich search results
 */
async function processSearchResults(
  results: AISearchResult,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesMap: Map<string, any>
) {
  const processedProducts = [];

  for (const product of results.products) {
    try {
      // Find matching source
      const sourceSlug = product.sourceName.toLowerCase().replace(/\s+/g, '');
      const source = sourcesMap.get(sourceSlug) || sourcesMap.values().next().value;

      // Convert prices to BRL
      const priceBRL = await convertToBRL(product.price, product.currency);
      const shippingBRL = await convertToBRL(product.shippingCost || 0, product.currency);

      // Calculate selling price with 30% margin
      const pricing = calculateSellingPrice(priceBRL, shippingBRL, 30);

      // Estimate delivery
      const delivery = estimateDeliveryDays(
        source?.region || 'china',
        'standard'
      );

      // Infer category
      const categoryInfo = inferCategory(product.name, product.description);

      // Calculate scores
      const trendingScore = calculateTrendingScore({
        soldCount: product.soldCount || 0,
        reviewCount: Math.floor((product.soldCount || 0) * 0.1),
        rating: product.rating || 4,
        daysSinceCreated: 30,
        searchVolume: 500,
        priceCompetitiveness: 70,
      });

      const demandScore = calculateDemandScore({
        soldCount: product.soldCount || 0,
        reviewCount: Math.floor((product.soldCount || 0) * 0.1),
        rating: product.rating || 4,
        stockLevel: 1000,
      });

      processedProducts.push({
        externalId: extractProductId(product.sourceUrl, sourceSlug) || `temp-${Date.now()}`,
        sourceSlug: sourceSlug,
        sourceName: product.sourceName,
        sourceUrl: product.sourceUrl,

        name: product.name,
        description: product.description,
        shortDescription: product.description.substring(0, 150),
        category: categoryInfo.category,
        subcategory: categoryInfo.subcategory,

        thumbnail: product.imageUrl,
        images: [product.imageUrl],

        originalPrice: product.price,
        currentPrice: product.price,
        originalCurrency: product.currency,

        priceBRL,
        originalPriceBRL: priceBRL,
        exchangeRate: priceBRL / product.price,
        exchangeRateUpdatedAt: new Date(),

        sellingPrice: pricing.sellingPrice,
        profitMargin: pricing.profitMargin,
        profitAmount: pricing.profitAmount,

        shippingOptions: [{
          method: 'Standard Shipping',
          cost: shippingBRL,
          currency: 'BRL',
          estimatedDays: delivery,
          trackable: true,
        }],
        bestShippingOption: {
          method: 'Standard Shipping',
          cost: shippingBRL,
          currency: 'BRL',
          estimatedDays: delivery,
          trackable: true,
        },
        shippingToBrazil: true,
        estimatedDeliveryDays: {
          min: product.deliveryDays ? product.deliveryDays - 5 : delivery.min,
          max: product.deliveryDays ? product.deliveryDays + 10 : delivery.max,
        },

        supplier: {
          name: product.sourceName,
          storeUrl: product.sourceUrl,
          rating: product.rating || 4,
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

        stock: 1000,
        minOrderQuantity: 1,
        isAvailable: true,

        rating: product.rating || 4,
        reviewCount: Math.floor((product.soldCount || 0) * 0.1),
        soldCount: product.soldCount || 0,

        priceHistory: [{
          price: priceBRL,
          shippingCost: shippingBRL,
          totalCost: pricing.totalCost,
          currency: 'BRL',
          recordedAt: new Date(),
        }],
        lowestPrice: priceBRL,
        highestPrice: priceBRL,
        priceTrend: 'stable' as const,

        trendingScore,
        searchVolume: 500,
        competitorCount: 10,
        demandScore,

        extractedDetails: {
          features: product.features || [],
          materials: [],
          includedItems: [],
          targetAudience: [],
          useCases: [],
          warnings: [],
          certifications: [],
        },

        tags: product.name.toLowerCase().split(' ').filter(w => w.length > 2),
        keywords: product.name.toLowerCase().split(' ').filter(w => w.length > 2),

        status: 'pending' as const,
        lastPriceCheck: new Date(),
        lastStockCheck: new Date(),
      });
    } catch (error) {
      console.error('Error processing product:', error);
    }
  }

  return {
    products: processedProducts,
    suggestions: results.suggestions || [],
  };
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

    // Get active sources
    let activeSources = await DropshippingSource.find({
      isActive: true,
      'shipping.shipsToBrazil': true,
    }).lean();

    // Filter by requested sources if specified
    if (sources.length > 0) {
      activeSources = activeSources.filter(s => sources.includes(s.slug));
    }

    if (activeSources.length === 0) {
      return NextResponse.json({ error: 'No active sources available' }, { status: 400 });
    }

    // Create sources map for quick lookup
    const sourcesMap = new Map(activeSources.map(s => [s.slug, s]));
    const sourceNames = activeSources.map(s => s.displayName);

    // Perform AI search
    const searchResults = await aiProductSearch(query, sourceNames);

    // Process and enrich results
    const processed = await processSearchResults(searchResults, sourcesMap);

    // Apply filters
    let filteredProducts = processed.products;

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
      { details: { query, resultsCount: filteredProducts.length } }
    );

    return NextResponse.json({
      success: true,
      query,
      results: filteredProducts,
      suggestions: processed.suggestions,
      meta: {
        total: filteredProducts.length,
        sources: sourceNames,
        filters: { minPrice, maxPrice, minRating, minCommission, maxDeliveryDays, category },
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Dropshipping search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
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
