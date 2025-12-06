/**
 * Real Product Scrapers for Dropshipping Platforms
 * Multiple methods with fallbacks for reliable product data
 */

export interface ScrapedProduct {
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
  shippingCost?: number;
  shippingInfo?: string;
  deliveryDays?: { min: number; max: number };
  sellerName?: string;
  sellerRating?: number;
  specifications?: Record<string, string>;
  features?: string[];
  inStock?: boolean;
}

interface SearchOptions {
  query: string;
  maxResults?: number;
  minPrice?: number;
  maxPrice?: number;
}

// ============================================
// Method 1: Brave Search API for real product results
// ============================================
export async function searchWithBraveAPI(
  query: string,
  site: string,
  maxResults = 10
): Promise<ScrapedProduct[]> {
  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
  
  if (!BRAVE_API_KEY) {
    console.log('Brave API key not configured');
    return [];
  }

  try {
    // Search for products on specific site
    const searchQuery = `site:${site} ${query}`;
    
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=${maxResults}&search_lang=pt-br&country=br`,
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
    const products: ScrapedProduct[] = [];

    for (const result of data.web?.results || []) {
      // Extract product info from search results
      const product = parseSearchResultToProduct(result, site);
      if (product) {
        products.push(product);
      }
    }

    return products;
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}

// ============================================
// Method 2: Direct AliExpress Search via public endpoints
// ============================================
export async function searchAliExpress(options: SearchOptions): Promise<ScrapedProduct[]> {
  const { query, maxResults = 20 } = options;
  
  try {
    // AliExpress has a public search API endpoint
    const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&page=1&SortType=total_tranpro_desc`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.aliexpress.com/',
      },
    });

    if (!response.ok) {
      console.error('AliExpress fetch error:', response.status);
      return [];
    }

    const html = await response.text();
    return parseAliExpressHTML(html, maxResults);
  } catch (error) {
    console.error('AliExpress search error:', error);
    return [];
  }
}

// ============================================
// Method 3: Amazon Product Search
// ============================================
export async function searchAmazon(options: SearchOptions): Promise<ScrapedProduct[]> {
  const { query, maxResults = 20 } = options;
  
  try {
    // Amazon Brazil search
    const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!response.ok) {
      console.error('Amazon fetch error:', response.status);
      return [];
    }

    const html = await response.text();
    return parseAmazonHTML(html, maxResults);
  } catch (error) {
    console.error('Amazon search error:', error);
    return [];
  }
}

// ============================================
// Method 4: Mercado Livre API (public)
// ============================================
export async function searchMercadoLivre(options: SearchOptions): Promise<ScrapedProduct[]> {
  const { query, maxResults = 20, minPrice, maxPrice } = options;
  
  try {
    // Mercado Livre has a public API
    let url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=${maxResults}`;
    
    if (minPrice) url += `&price=${minPrice}-`;
    if (maxPrice) url += maxPrice ? `${maxPrice}` : '*';
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Mercado Livre API error:', response.status);
      return [];
    }

    const data = await response.json();
    return parseMercadoLivreResults(data.results || [], maxResults);
  } catch (error) {
    console.error('Mercado Livre search error:', error);
    return [];
  }
}

// ============================================
// Method 5: Shopee Search
// ============================================
export async function searchShopee(options: SearchOptions): Promise<ScrapedProduct[]> {
  const { query, maxResults = 20 } = options;
  
  try {
    // Shopee Brazil API endpoint
    const searchUrl = `https://shopee.com.br/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=${maxResults}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://shopee.com.br/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      console.error('Shopee API error:', response.status);
      return [];
    }

    const data = await response.json();
    return parseShopeeResults(data.items || [], maxResults);
  } catch (error) {
    console.error('Shopee search error:', error);
    return [];
  }
}

// ============================================
// Parsing Functions
// ============================================

function parseSearchResultToProduct(result: { title: string; url: string; description: string }, site: string): ScrapedProduct | null {
  try {
    // Extract product ID from URL
    const urlMatch = result.url.match(/\/(\d+)\.html/) || result.url.match(/\/dp\/([A-Z0-9]+)/) || result.url.match(/MLB-?(\d+)/);
    const externalId = urlMatch ? urlMatch[1] : `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to extract price from description
    const priceMatch = result.description?.match(/R\$\s*([\d.,]+)/) || result.description?.match(/\$\s*([\d.,]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : 0;

    const sourceSlug = site.includes('aliexpress') ? 'aliexpress' :
                       site.includes('amazon') ? 'amazon' :
                       site.includes('mercadolivre') || site.includes('mercadolibre') ? 'mercadolivre' :
                       site.includes('shopee') ? 'shopee' : 'unknown';

    return {
      externalId,
      name: result.title,
      description: result.description || '',
      price: price,
      currency: price > 0 && sourceSlug !== 'aliexpress' ? 'BRL' : 'USD',
      imageUrl: '',
      images: [],
      productUrl: result.url,
      sourceName: sourceSlug.charAt(0).toUpperCase() + sourceSlug.slice(1),
      sourceSlug,
      inStock: true,
    };
  } catch {
    return null;
  }
}

function parseAliExpressHTML(html: string, maxResults: number): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  
  try {
    // Look for JSON data in the page
    const jsonMatch = html.match(/window\._dida_config_\s*=\s*({[\s\S]*?});/) ||
                      html.match(/"itemList":\s*(\[[\s\S]*?\])/) ||
                      html.match(/data-product-id="(\d+)"[\s\S]*?data-product-title="([^"]+)"[\s\S]*?data-product-price="([\d.]+)"/g);
    
    if (jsonMatch) {
      // Parse structured data if available
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (Array.isArray(data)) {
          for (const item of data.slice(0, maxResults)) {
            products.push({
              externalId: item.productId || item.id || String(Date.now()),
              name: item.title || item.name || '',
              description: item.title || '',
              price: parseFloat(item.price?.minPrice || item.price || 0),
              currency: 'USD',
              imageUrl: item.image?.imgUrl || item.imageUrl || '',
              images: [item.image?.imgUrl || item.imageUrl || ''],
              productUrl: `https://www.aliexpress.com/item/${item.productId || item.id}.html`,
              sourceName: 'AliExpress',
              sourceSlug: 'aliexpress',
              rating: parseFloat(item.evaluation?.starRating || item.rating || 0),
              reviewCount: parseInt(item.evaluation?.totalValidNum || item.reviews || 0),
              soldCount: parseInt(item.trade?.tradeDesc?.replace(/[^\d]/g, '') || item.sold || 0),
              inStock: true,
            });
          }
        }
      } catch {
        console.log('Could not parse AliExpress JSON');
      }
    }

    // Fallback: regex extraction
    if (products.length === 0) {
      const productMatches = html.matchAll(/data-product-id="(\d+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?class="[^"]*title[^"]*"[^>]*>([^<]+)</g);
      
      for (const match of productMatches) {
        if (products.length >= maxResults) break;
        
        products.push({
          externalId: match[1],
          name: match[3].trim(),
          description: match[3].trim(),
          price: 0, // Would need additional parsing
          currency: 'USD',
          imageUrl: match[2].startsWith('//') ? `https:${match[2]}` : match[2],
          images: [],
          productUrl: `https://www.aliexpress.com/item/${match[1]}.html`,
          sourceName: 'AliExpress',
          sourceSlug: 'aliexpress',
          inStock: true,
        });
      }
    }
  } catch (error) {
    console.error('Error parsing AliExpress HTML:', error);
  }

  return products;
}

function parseAmazonHTML(html: string, maxResults: number): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  
  try {
    // Look for product data in Amazon's format
    const productBlocks = html.match(/data-asin="([A-Z0-9]{10})"[\s\S]*?<span class="a-price-whole">(\d+)<[\s\S]*?alt="([^"]+)"/g);
    
    if (productBlocks) {
      for (const block of productBlocks.slice(0, maxResults)) {
        const asinMatch = block.match(/data-asin="([A-Z0-9]{10})"/);
        const priceMatch = block.match(/<span class="a-price-whole">(\d+)</);
        const titleMatch = block.match(/alt="([^"]+)"/);
        
        if (asinMatch && titleMatch) {
          products.push({
            externalId: asinMatch[1],
            name: titleMatch[1],
            description: titleMatch[1],
            price: priceMatch ? parseFloat(priceMatch[1]) : 0,
            currency: 'BRL',
            imageUrl: '',
            images: [],
            productUrl: `https://www.amazon.com.br/dp/${asinMatch[1]}`,
            sourceName: 'Amazon',
            sourceSlug: 'amazon',
            inStock: true,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing Amazon HTML:', error);
  }

  return products;
}

function parseMercadoLivreResults(results: Array<{
  id: string;
  title: string;
  price: number;
  original_price?: number;
  thumbnail: string;
  permalink: string;
  seller?: { nickname: string };
  shipping?: { free_shipping: boolean };
  sold_quantity?: number;
  available_quantity?: number;
  condition?: string;
  attributes?: Array<{ name: string; value_name: string }>;
}>, maxResults: number): ScrapedProduct[] {
  return results.slice(0, maxResults).map(item => ({
    externalId: item.id,
    name: item.title,
    description: item.title,
    price: item.price,
    currency: 'BRL',
    originalPrice: item.original_price,
    imageUrl: item.thumbnail?.replace('-I.', '-O.') || '', // Get larger image
    images: [item.thumbnail?.replace('-I.', '-O.') || ''],
    productUrl: item.permalink,
    sourceName: 'Mercado Livre',
    sourceSlug: 'mercadolivre',
    sellerName: item.seller?.nickname,
    shippingInfo: item.shipping?.free_shipping ? 'Frete grátis' : undefined,
    soldCount: item.sold_quantity,
    inStock: (item.available_quantity || 0) > 0,
    specifications: item.attributes?.reduce((acc, attr) => {
      acc[attr.name] = attr.value_name;
      return acc;
    }, {} as Record<string, string>),
  }));
}

function parseShopeeResults(items: Array<{
  itemid: number;
  shopid: number;
  name: string;
  price: number;
  price_min: number;
  price_max: number;
  image: string;
  historical_sold: number;
  item_rating: { rating_star: number; rating_count: number[] };
  shop_location: string;
  stock: number;
}>, maxResults: number): ScrapedProduct[] {
  return items.slice(0, maxResults).map(item => ({
    externalId: String(item.itemid),
    name: item.name,
    description: item.name,
    price: (item.price_min || item.price) / 100000, // Shopee prices are in cents * 1000
    currency: 'BRL',
    imageUrl: `https://down-br.img.susercontent.com/file/${item.image}`,
    images: [`https://down-br.img.susercontent.com/file/${item.image}`],
    productUrl: `https://shopee.com.br/product/${item.shopid}/${item.itemid}`,
    sourceName: 'Shopee',
    sourceSlug: 'shopee',
    rating: item.item_rating?.rating_star || 0,
    reviewCount: item.item_rating?.rating_count?.reduce((a, b) => a + b, 0) || 0,
    soldCount: item.historical_sold || 0,
    inStock: (item.stock || 0) > 0,
  }));
}

// ============================================
// Master Search Function with Fallbacks
// ============================================
export async function searchAllPlatforms(
  query: string,
  options: {
    platforms?: string[];
    maxResultsPerPlatform?: number;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<{ platform: string; products: ScrapedProduct[]; error?: string }[]> {
  const {
    platforms = ['mercadolivre', 'aliexpress', 'amazon', 'shopee'],
    maxResultsPerPlatform = 10,
    minPrice,
    maxPrice,
  } = options;

  const searchOptions: SearchOptions = {
    query,
    maxResults: maxResultsPerPlatform,
    minPrice,
    maxPrice,
  };

  const results: { platform: string; products: ScrapedProduct[]; error?: string }[] = [];

  // Search in parallel
  const searchPromises = platforms.map(async (platform) => {
    try {
      let products: ScrapedProduct[] = [];

      switch (platform.toLowerCase()) {
        case 'mercadolivre':
          products = await searchMercadoLivre(searchOptions);
          break;
        case 'aliexpress':
          products = await searchAliExpress(searchOptions);
          break;
        case 'amazon':
          products = await searchAmazon(searchOptions);
          break;
        case 'shopee':
          products = await searchShopee(searchOptions);
          break;
        default:
          // Try Brave Search as fallback
          products = await searchWithBraveAPI(query, `${platform}.com`, maxResultsPerPlatform);
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
// Get Product Details (for enrichment)
// ============================================
export async function getProductDetails(
  productUrl: string,
  platform: string
): Promise<Partial<ScrapedProduct> | null> {
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Platform-specific parsing
    switch (platform.toLowerCase()) {
      case 'mercadolivre':
        return parseMercadoLivreProductPage(html);
      case 'aliexpress':
        return parseAliExpressProductPage(html);
      case 'amazon':
        return parseAmazonProductPage(html);
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting product details:', error);
    return null;
  }
}

function parseMercadoLivreProductPage(html: string): Partial<ScrapedProduct> | null {
  try {
    const priceMatch = html.match(/class="andes-money-amount__fraction"[^>]*>(\d+[.,]?\d*)</);
    const titleMatch = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</);
    const imageMatch = html.match(/data-zoom="([^"]+)"/);
    const ratingMatch = html.match(/class="[^"]*reviews-rating[^"]*"[^>]*>([\d.]+)</);
    const reviewsMatch = html.match(/(\d+)\s*opini/);
    const soldMatch = html.match(/(\d+)\s*vendido/);

    return {
      name: titleMatch?.[1]?.trim(),
      price: priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : undefined,
      imageUrl: imageMatch?.[1],
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
      reviewCount: reviewsMatch ? parseInt(reviewsMatch[1]) : undefined,
      soldCount: soldMatch ? parseInt(soldMatch[1]) : undefined,
    };
  } catch {
    return null;
  }
}

function parseAliExpressProductPage(html: string): Partial<ScrapedProduct> | null {
  try {
    // AliExpress stores data in JSON
    const dataMatch = html.match(/window\.runParams\s*=\s*({[\s\S]*?});/) ||
                      html.match(/"priceModule":\s*({[\s\S]*?}),/);
    
    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      return {
        name: data.titleModule?.subject,
        price: parseFloat(data.priceModule?.minPrice || 0),
        imageUrl: data.imageModule?.imagePathList?.[0],
        images: data.imageModule?.imagePathList,
        rating: parseFloat(data.titleModule?.feedbackRating?.averageStar || 0),
        reviewCount: parseInt(data.titleModule?.feedbackRating?.totalValidNum || 0),
        soldCount: parseInt(data.titleModule?.tradeCount || 0),
        description: data.descriptionModule?.descriptionUrl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function parseAmazonProductPage(html: string): Partial<ScrapedProduct> | null {
  try {
    const priceMatch = html.match(/class="a-price-whole"[^>]*>(\d+)/);
    const titleMatch = html.match(/id="productTitle"[^>]*>([^<]+)</);
    const imageMatch = html.match(/id="landingImage"[^>]+src="([^"]+)"/);
    const ratingMatch = html.match(/class="[^"]*a-icon-star[^"]*"[^>]*><span[^>]*>([\d.]+)/);
    const reviewsMatch = html.match(/id="acrCustomerReviewText"[^>]*>(\d+)/);

    return {
      name: titleMatch?.[1]?.trim(),
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
      imageUrl: imageMatch?.[1],
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
      reviewCount: reviewsMatch ? parseInt(reviewsMatch[1]) : undefined,
    };
  } catch {
    return null;
  }
}
