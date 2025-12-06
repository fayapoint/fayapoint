/**
 * Dropshipping Utilities
 * Helpers for price calculation, currency conversion, and product parsing
 */

// Exchange rates cache
let exchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CNY: 0.14,
  BRL: 0.20,
};
let lastRateUpdate: Date | null = null;

/**
 * Fetch current exchange rates
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Check if rates are still fresh (less than 1 hour old)
  if (lastRateUpdate && (Date.now() - lastRateUpdate.getTime()) < 3600000) {
    return exchangeRates;
  }

  try {
    // Using free exchange rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      exchangeRates = {
        USD: 1,
        EUR: 1 / data.rates.EUR,
        GBP: 1 / data.rates.GBP,
        CNY: 1 / data.rates.CNY,
        BRL: 1 / data.rates.BRL,
      };
      lastRateUpdate = new Date();
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
  }

  return exchangeRates;
}

/**
 * Convert price to BRL
 */
export async function convertToBRL(price: number, fromCurrency: string): Promise<number> {
  const rates = await fetchExchangeRates();
  
  // First convert to USD if not already
  let priceInUSD = price;
  if (fromCurrency !== 'USD') {
    priceInUSD = price * (rates[fromCurrency] || 1);
  }
  
  // Then convert USD to BRL
  const brlRate = 1 / (rates.BRL || 0.20);
  return Math.round(priceInUSD * brlRate * 100) / 100;
}

/**
 * Calculate selling price with profit margin
 */
export function calculateSellingPrice(
  costBRL: number,
  shippingBRL: number,
  profitMargin: number = 30
): {
  totalCost: number;
  sellingPrice: number;
  profitAmount: number;
  profitMargin: number;
} {
  const totalCost = costBRL + shippingBRL;
  const profitMultiplier = 1 + (profitMargin / 100);
  const sellingPrice = Math.ceil(totalCost * profitMultiplier);
  const profitAmount = sellingPrice - totalCost;

  return {
    totalCost,
    sellingPrice,
    profitAmount,
    profitMargin,
  };
}

/**
 * Calculate trending score based on various factors
 */
export function calculateTrendingScore(params: {
  soldCount: number;
  reviewCount: number;
  rating: number;
  daysSinceCreated: number;
  searchVolume: number;
  priceCompetitiveness: number;
}): number {
  const {
    soldCount,
    reviewCount,
    rating,
    daysSinceCreated,
    searchVolume,
    priceCompetitiveness,
  } = params;

  // Normalize factors to 0-100 scale
  const salesScore = Math.min(100, (soldCount / 10000) * 100);
  const reviewScore = Math.min(100, (reviewCount / 500) * 100);
  const ratingScore = (rating / 5) * 100;
  const freshnessScore = Math.max(0, 100 - (daysSinceCreated / 30) * 10);
  const volumeScore = Math.min(100, (searchVolume / 1000) * 100);
  
  // Weighted average
  const trendingScore = (
    salesScore * 0.25 +
    reviewScore * 0.15 +
    ratingScore * 0.20 +
    freshnessScore * 0.15 +
    volumeScore * 0.15 +
    priceCompetitiveness * 0.10
  );

  return Math.round(Math.min(100, trendingScore));
}

/**
 * Calculate price trend
 */
export function calculatePriceTrend(
  priceHistory: { price: number; recordedAt: Date }[]
): 'rising' | 'stable' | 'falling' {
  if (priceHistory.length < 2) return 'stable';

  // Get last 7 days of prices
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPrices = priceHistory
    .filter(p => new Date(p.recordedAt) > oneWeekAgo)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  if (recentPrices.length < 2) return 'stable';

  const firstPrice = recentPrices[0].price;
  const lastPrice = recentPrices[recentPrices.length - 1].price;
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (changePercent > 5) return 'rising';
  if (changePercent < -5) return 'falling';
  return 'stable';
}

/**
 * Estimate delivery days based on source and shipping method
 */
export function estimateDeliveryDays(
  sourceRegion: string,
  shippingMethod: string
): { min: number; max: number } {
  const baseDelivery: Record<string, { min: number; max: number }> = {
    china: { min: 15, max: 45 },
    usa: { min: 7, max: 21 },
    europe: { min: 10, max: 25 },
    global: { min: 5, max: 15 },
  };

  const methodModifiers: Record<string, number> = {
    express: -0.4,
    expedited: -0.3,
    standard: 0,
    economy: 0.3,
    sea: 1.5,
    air: -0.2,
  };

  const base = baseDelivery[sourceRegion] || baseDelivery.china;
  
  // Find matching modifier
  let modifier = 0;
  for (const [key, value] of Object.entries(methodModifiers)) {
    if (shippingMethod.toLowerCase().includes(key)) {
      modifier = value;
      break;
    }
  }

  return {
    min: Math.max(1, Math.round(base.min * (1 + modifier))),
    max: Math.max(3, Math.round(base.max * (1 + modifier))),
  };
}

/**
 * Generate SEO-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Clean and validate product URL
 */
export function cleanProductUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'aff', 'clickid'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Extract product ID from URL based on source
 */
export function extractProductId(url: string, sourceSlug: string): string | null {
  const patterns: Record<string, RegExp> = {
    aliexpress: /item\/(\d+)\.html|\/(\d+)\.html/,
    amazon: /\/dp\/([A-Z0-9]+)|\/gp\/product\/([A-Z0-9]+)/,
    banggood: /products\/(\d+)\.html|-(\d+)\.html/,
    dhgate: /product\/(\d+)\.html/,
    wish: /product\/([a-f0-9]+)/,
    temu: /goods\.html\?.*goods_id=(\d+)/,
    shein: /-p-(\d+)/,
    shopee: /i\.(\d+)\.(\d+)/,
    mercadolivre: /MLB-(\d+)|\/p\/MLB(\d+)/,
  };

  const pattern = patterns[sourceSlug];
  if (!pattern) return null;

  const match = url.match(pattern);
  if (!match) return null;

  // Return first capturing group that matched
  return match.slice(1).find(m => m) || null;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Calculate affiliate earnings
 */
export function calculateAffiliateEarnings(
  sellingPrice: number,
  commissionRate: number,
  commissionType: 'percentage' | 'fixed'
): number {
  if (commissionType === 'fixed') {
    return commissionRate;
  }
  return Math.round((sellingPrice * commissionRate / 100) * 100) / 100;
}

/**
 * Parse product features from description using AI patterns
 */
export function extractFeatures(description: string): string[] {
  const features: string[] = [];
  
  // Look for bullet points or numbered lists
  const bulletPatterns = [
    /[•●■▪]\s*([^\n•●■▪]+)/g,
    /^\d+[\.\)]\s*([^\n]+)/gm,
    /^[-*]\s*([^\n]+)/gm,
  ];

  for (const pattern of bulletPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const feature = match[1].trim();
      if (feature.length > 5 && feature.length < 200) {
        features.push(feature);
      }
    }
  }

  // If no bullet points found, try to extract from sentences
  if (features.length === 0) {
    const sentences = description.split(/[.!?]+/);
    for (const sentence of sentences.slice(0, 5)) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 150) {
        features.push(trimmed);
      }
    }
  }

  return features.slice(0, 10);
}

/**
 * Determine product category from name and description
 */
export function inferCategory(name: string, description: string): { category: string; subcategory?: string } {
  const text = `${name} ${description}`.toLowerCase();
  
  const categoryPatterns: { category: string; subcategory?: string; keywords: string[] }[] = [
    { category: 'computers', subcategory: 'Placas de Vídeo', keywords: ['gpu', 'rtx', 'gtx', 'graphics card', 'placa de vídeo', 'geforce', 'radeon'] },
    { category: 'computers', subcategory: 'Processadores', keywords: ['cpu', 'processor', 'ryzen', 'intel core', 'processador'] },
    { category: 'computers', subcategory: 'Memória RAM', keywords: ['ram', 'ddr4', 'ddr5', 'memory', 'memória'] },
    { category: 'computers', subcategory: 'SSDs e HDDs', keywords: ['ssd', 'hdd', 'nvme', 'm.2', 'hard drive', 'armazenamento'] },
    { category: 'peripherals', subcategory: 'Mouses', keywords: ['mouse', 'gaming mouse', 'wireless mouse'] },
    { category: 'peripherals', subcategory: 'Teclados', keywords: ['keyboard', 'mechanical keyboard', 'teclado'] },
    { category: 'peripherals', subcategory: 'Headsets', keywords: ['headset', 'headphone', 'fone', 'earphone'] },
    { category: 'monitors', subcategory: 'Monitores Gaming', keywords: ['gaming monitor', 'monitor gamer', '144hz', '240hz'] },
    { category: 'monitors', subcategory: 'Monitores Profissionais', keywords: ['4k monitor', 'ultrawide', 'professional display'] },
    { category: 'accessories', subcategory: 'Cadeiras Gamer', keywords: ['gaming chair', 'cadeira gamer', 'office chair'] },
    { category: 'networking', subcategory: 'Roteadores', keywords: ['router', 'wifi', 'roteador', 'mesh'] },
    { category: 'software', keywords: ['software', 'license', 'windows', 'office', 'antivirus'] },
  ];

  for (const pattern of categoryPatterns) {
    for (const keyword of pattern.keywords) {
      if (text.includes(keyword)) {
        return { category: pattern.category, subcategory: pattern.subcategory };
      }
    }
  }

  return { category: 'accessories', subcategory: undefined };
}

/**
 * Calculate demand score based on market signals
 */
export function calculateDemandScore(params: {
  soldCount: number;
  viewCount?: number;
  wishlistCount?: number;
  reviewCount: number;
  rating: number;
  stockLevel: number;
}): number {
  const { soldCount, viewCount = 0, wishlistCount = 0, reviewCount, rating, stockLevel } = params;

  // Factors
  const salesVelocity = Math.min(40, (soldCount / 1000) * 40);
  const engagement = Math.min(20, ((viewCount + wishlistCount * 5) / 10000) * 20);
  const socialProof = Math.min(20, (reviewCount / 100) * 20);
  const satisfaction = (rating / 5) * 15;
  const scarcity = stockLevel < 100 ? 5 : 0;

  return Math.round(salesVelocity + engagement + socialProof + satisfaction + scarcity);
}
