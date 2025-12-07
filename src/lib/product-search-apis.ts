/**
 * Reliable Product Search APIs
 * Uses external APIs that actually work for product searches
 */

export interface ProductSearchResult {
  externalId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  originalPrice?: number;
  imageUrl: string;
  images: string[];
  productUrl: string;
  sourceName: string;
  sourceSlug: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  shippingInfo?: string;
  deliveryDays?: { min: number; max: number };
  sellerName?: string;
  inStock: boolean;
}

// ============================================
// Method 1: Google Shopping via SerpAPI
// Sign up: https://serpapi.com (100 free searches/month)
// ============================================
export async function searchGoogleShopping(
  query: string,
  maxResults = 20
): Promise<ProductSearchResult[]> {
  // Support both SERPAPI_KEY and SerpAPI variable names
  const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.SerpAPI;
  
  if (!SERPAPI_KEY) {
    console.log('SerpAPI key not configured - skipping Google Shopping');
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: query,
      api_key: SERPAPI_KEY,
      gl: 'br', // Brazil
      hl: 'pt', // Portuguese
      num: String(maxResults),
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    
    if (!response.ok) {
      console.error('SerpAPI error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: ProductSearchResult[] = [];

    for (const item of data.shopping_results || []) {
      products.push({
        externalId: item.product_id || `serp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.title,
        description: item.snippet || item.title,
        price: parsePrice(item.extracted_price || item.price),
        currency: 'BRL',
        originalPrice: item.extracted_old_price,
        imageUrl: item.thumbnail,
        images: [item.thumbnail],
        productUrl: item.link,
        sourceName: item.source || 'Google Shopping',
        sourceSlug: extractSourceSlug(item.source || item.link),
        rating: item.rating,
        reviewCount: item.reviews,
        inStock: true,
        deliveryDays: item.delivery ? parseDelivery(item.delivery) : undefined,
      });
    }

    return products;
  } catch (error) {
    console.error('Google Shopping search error:', error);
    return [];
  }
}

// ============================================
// Method 2: AliExpress via RapidAPI
// Sign up: https://rapidapi.com/apidojo/api/aliexpress-datahub
// ============================================
export async function searchAliExpressRapidAPI(
  query: string,
  maxResults = 20
): Promise<ProductSearchResult[]> {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  if (!RAPIDAPI_KEY) {
    console.log('RapidAPI key not configured - skipping AliExpress');
    return [];
  }

  try {
    const response = await fetch(
      `https://aliexpress-datahub.p.rapidapi.com/item_search_2?keywords=${encodeURIComponent(query)}&page=1&sort=default&region=BR&locale=pt_BR`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('AliExpress RapidAPI error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: ProductSearchResult[] = [];

    for (const item of (data.result?.resultList || []).slice(0, maxResults)) {
      const product = item.item;
      products.push({
        externalId: product.itemId || String(product.productId),
        name: product.title,
        description: product.title,
        price: parseFloat(product.sku?.def?.price || product.price || 0),
        currency: 'USD',
        originalPrice: parseFloat(product.sku?.def?.originalPrice || 0),
        imageUrl: product.image || product.imgUrl,
        images: product.images || [product.image],
        productUrl: `https://www.aliexpress.com/item/${product.itemId}.html`,
        sourceName: 'AliExpress',
        sourceSlug: 'aliexpress',
        rating: parseFloat(product.starRating || 0),
        reviewCount: parseInt(product.reviews || 0),
        soldCount: parseInt(product.orders || product.sold || 0),
        sellerName: product.sellerName || product.storeName,
        inStock: true,
        deliveryDays: { min: 20, max: 45 },
      });
    }

    return products;
  } catch (error) {
    console.error('AliExpress RapidAPI error:', error);
    return [];
  }
}

// ============================================
// Method 3: Amazon via RapidAPI
// Sign up: https://rapidapi.com/apidojo/api/amazon-product-reviews-keywords
// ============================================
export async function searchAmazonRapidAPI(
  query: string,
  maxResults = 20
): Promise<ProductSearchResult[]> {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  if (!RAPIDAPI_KEY) {
    console.log('RapidAPI key not configured - skipping Amazon');
    return [];
  }

  try {
    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&country=BR&category_id=aps`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('Amazon RapidAPI error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: ProductSearchResult[] = [];

    for (const item of (data.data?.products || []).slice(0, maxResults)) {
      products.push({
        externalId: item.asin,
        name: item.product_title,
        description: item.product_title,
        price: parseFloat(item.product_price?.replace(/[^\d.,]/g, '').replace(',', '.') || 0),
        currency: 'BRL',
        originalPrice: parseFloat(item.product_original_price?.replace(/[^\d.,]/g, '').replace(',', '.') || 0),
        imageUrl: item.product_photo,
        images: [item.product_photo],
        productUrl: item.product_url,
        sourceName: 'Amazon',
        sourceSlug: 'amazon',
        rating: parseFloat(item.product_star_rating || 0),
        reviewCount: parseInt(item.product_num_ratings || 0),
        inStock: item.is_available !== false,
        deliveryDays: { min: 3, max: 15 },
        shippingInfo: item.delivery,
      });
    }

    return products;
  } catch (error) {
    console.error('Amazon RapidAPI error:', error);
    return [];
  }
}

// ============================================
// Method 4: Mercado Livre via RapidAPI
// Sign up: https://rapidapi.com/meli-mercadolibre-meli-mercadolibre-default/api/mercadolibre-argentina
// ============================================
export async function searchMercadoLivreRapidAPI(
  query: string,
  maxResults = 20
): Promise<ProductSearchResult[]> {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  if (!RAPIDAPI_KEY) {
    console.log('RapidAPI key not configured - skipping Mercado Livre');
    return [];
  }

  try {
    // Try using a proxy/alternative endpoint
    const response = await fetch(
      `https://mercadolibre-brasil.p.rapidapi.com/search?q=${encodeURIComponent(query)}&limit=${maxResults}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'mercadolibre-brasil.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.error('Mercado Livre RapidAPI error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: ProductSearchResult[] = [];

    for (const item of (data.results || []).slice(0, maxResults)) {
      products.push({
        externalId: item.id,
        name: item.title,
        description: item.title,
        price: item.price,
        currency: 'BRL',
        originalPrice: item.original_price,
        imageUrl: item.thumbnail?.replace('http:', 'https:'),
        images: [item.thumbnail?.replace('http:', 'https:')],
        productUrl: item.permalink,
        sourceName: 'Mercado Livre',
        sourceSlug: 'mercadolivre',
        rating: item.seller?.seller_reputation?.level_id === 'platinum' ? 4.8 : 4.0,
        soldCount: item.sold_quantity,
        sellerName: item.seller?.nickname,
        inStock: item.available_quantity > 0,
        deliveryDays: { min: 1, max: 10 },
        shippingInfo: item.shipping?.free_shipping ? 'Frete Grátis' : 'Frete a calcular',
      });
    }

    return products;
  } catch (error) {
    console.error('Mercado Livre RapidAPI error:', error);
    return [];
  }
}

// ============================================
// Method 5: Brave Search (fallback for any platform)
// Sign up: https://brave.com/search/api/
// ============================================
export async function searchBraveProducts(
  query: string,
  maxResults = 20
): Promise<ProductSearchResult[]> {
  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
  
  if (!BRAVE_API_KEY) {
    console.log('Brave API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' comprar preço')}&count=${maxResults}&search_lang=pt-br&country=br&result_filter=web`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('Brave API error:', response.status);
      return [];
    }

    const data = await response.json();
    const products: ProductSearchResult[] = [];

    for (const result of data.web?.results || []) {
      // Try to identify if it's a product page
      const priceMatch = result.description?.match(/R\$\s*([\d.,]+)/) || 
                        result.extra_snippets?.join(' ').match(/R\$\s*([\d.,]+)/);
      
      if (!priceMatch) continue; // Skip non-product results

      const sourceSlug = extractSourceSlug(result.url);
      
      products.push({
        externalId: `brave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: result.title.replace(/ - .*$/, '').trim(),
        description: result.description || '',
        price: parsePrice(priceMatch[1]),
        currency: 'BRL',
        imageUrl: result.thumbnail?.src || '',
        images: result.thumbnail?.src ? [result.thumbnail.src] : [],
        productUrl: result.url,
        sourceName: sourceSlug.charAt(0).toUpperCase() + sourceSlug.slice(1),
        sourceSlug,
        inStock: true,
      });
    }

    return products;
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}

// ============================================
// MASTER SEARCH: Searches all available APIs
// ============================================
export async function searchAllProductAPIs(
  query: string,
  platforms: string[] = ['google', 'aliexpress', 'amazon', 'mercadolivre'],
  maxResultsPerPlatform = 10
): Promise<{ platform: string; products: ProductSearchResult[]; error?: string }[]> {
  const results: { platform: string; products: ProductSearchResult[]; error?: string }[] = [];

  const searchPromises = platforms.map(async (platform) => {
    try {
      let products: ProductSearchResult[] = [];

      switch (platform.toLowerCase()) {
        case 'google':
        case 'google_shopping':
          products = await searchGoogleShopping(query, maxResultsPerPlatform);
          break;
        case 'aliexpress':
          products = await searchAliExpressRapidAPI(query, maxResultsPerPlatform);
          break;
        case 'amazon':
          products = await searchAmazonRapidAPI(query, maxResultsPerPlatform);
          break;
        case 'mercadolivre':
          products = await searchMercadoLivreRapidAPI(query, maxResultsPerPlatform);
          break;
        case 'brave':
        default:
          products = await searchBraveProducts(query, maxResultsPerPlatform);
          break;
      }

      return { platform, products };
    } catch (error) {
      console.error(`Error searching ${platform}:`, error);
      return { platform, products: [], error: String(error) };
    }
  });

  const searchResults = await Promise.allSettled(searchPromises);

  for (const result of searchResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    }
  }

  return results;
}

// ============================================
// Helper Functions
// ============================================

function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = priceStr.replace(/[R$\s]/g, '').trim();
  
  // Handle Brazilian format (1.234,56) vs US format (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Brazilian format: 1.234,56
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    // US format: 1,234.56
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  
  // Only comma: Brazilian decimal (1234,56)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  
  return parseFloat(cleaned) || 0;
}

function extractSourceSlug(urlOrName: string): string {
  const url = urlOrName.toLowerCase();
  
  if (url.includes('aliexpress')) return 'aliexpress';
  if (url.includes('amazon')) return 'amazon';
  if (url.includes('mercadolivre') || url.includes('mercadolibre')) return 'mercadolivre';
  if (url.includes('shopee')) return 'shopee';
  if (url.includes('magazineluiza') || url.includes('magalu')) return 'magazineluiza';
  if (url.includes('americanas')) return 'americanas';
  if (url.includes('casasbahia')) return 'casasbahia';
  if (url.includes('kabum')) return 'kabum';
  if (url.includes('pichau')) return 'pichau';
  if (url.includes('terabyte')) return 'terabyte';
  if (url.includes('shein')) return 'shein';
  if (url.includes('temu')) return 'temu';
  
  // Try to extract domain
  const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/);
  return domainMatch ? domainMatch[1] : 'other';
}

function parseDelivery(deliveryStr: string): { min: number; max: number } | undefined {
  if (!deliveryStr) return undefined;
  
  // Extract numbers from delivery string
  const numbers = deliveryStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return undefined;
  
  if (numbers.length === 1) {
    const days = parseInt(numbers[0]);
    return { min: Math.max(1, days - 2), max: days + 3 };
  }
  
  return {
    min: parseInt(numbers[0]),
    max: parseInt(numbers[1]),
  };
}
