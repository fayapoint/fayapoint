/**
 * Prodigi Products API
 * Browse catalog, get product details, and pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  getProductDetails,
  PRODIGI_CATALOG,
  searchProdigiCatalog,
  getProdigiProductsByCategory,
  convertProdigiCost,
  calculateSellingPrice,
} from '@/lib/prodigi-api';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Currency exchange rates (should be fetched from API in production)
const EXCHANGE_RATES = {
  GBP_TO_BRL: parseFloat(process.env.GBP_TO_BRL || '6.30'),
  USD_TO_BRL: parseFloat(process.env.USD_TO_BRL || '5.00'),
};

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    await dbConnect();
    const user = await User.findById(decoded.id).lean();
    return user;
  } catch {
    return null;
  }
}

// Product category metadata with images
const CATEGORY_INFO = {
  canvas: {
    name: 'Canvas',
    namePT: 'Quadros Canvas',
    description: 'Premium stretched canvas on quality wooden frames',
    descriptionPT: 'Canvas premium esticado em molduras de madeira de qualidade',
    icon: 'Frame',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400',
    baseMargin: 45,
  },
  framedPrints: {
    name: 'Framed Prints',
    namePT: 'Impressões Emolduradas',
    description: 'Gallery-quality framed prints with various frame options',
    descriptionPT: 'Impressões emolduradas de qualidade galeria com várias opções de moldura',
    icon: 'Frame',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400',
    baseMargin: 50,
  },
  fineArtPrints: {
    name: 'Fine Art Prints',
    namePT: 'Fine Art / Giclée',
    description: 'Museum-quality giclée prints on archival paper',
    descriptionPT: 'Impressões giclée de qualidade museu em papel arquivístico',
    icon: 'Palette',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
    baseMargin: 55,
  },
  posters: {
    name: 'Posters',
    namePT: 'Pôsteres',
    description: 'High-quality posters on premium paper',
    descriptionPT: 'Pôsteres de alta qualidade em papel premium',
    icon: 'Image',
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400',
    baseMargin: 40,
  },
  metalPrints: {
    name: 'Metal Prints',
    namePT: 'Impressões em Metal',
    description: 'Stunning HD prints on aluminum with vibrant colors',
    descriptionPT: 'Impressões HD impressionantes em alumínio com cores vibrantes',
    icon: 'Square',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    baseMargin: 50,
  },
  acrylicPrints: {
    name: 'Acrylic Prints',
    namePT: 'Impressões em Acrílico',
    description: 'Luxurious prints under polished acrylic glass',
    descriptionPT: 'Impressões luxuosas sob vidro acrílico polido',
    icon: 'Gem',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
    baseMargin: 55,
  },
  phoneCases: {
    name: 'Phone Cases',
    namePT: 'Capinhas de Celular',
    description: 'Custom phone cases for iPhone and Samsung',
    descriptionPT: 'Capinhas personalizadas para iPhone e Samsung',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
    baseMargin: 45,
  },
  mugs: {
    name: 'Mugs',
    namePT: 'Canecas',
    description: 'Ceramic and enamel mugs with wrap-around printing',
    descriptionPT: 'Canecas de cerâmica e esmaltadas com impressão em volta',
    icon: 'Coffee',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    baseMargin: 40,
  },
  greetingCards: {
    name: 'Greeting Cards',
    namePT: 'Cartões',
    description: 'Premium greeting cards with envelopes',
    descriptionPT: 'Cartões premium com envelopes',
    icon: 'Mail',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400',
    baseMargin: 50,
  },
  calendars: {
    name: 'Calendars',
    namePT: 'Calendários',
    description: 'Wall calendars with custom photos',
    descriptionPT: 'Calendários de parede com fotos personalizadas',
    icon: 'Calendar',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400',
    baseMargin: 45,
  },
  photobooks: {
    name: 'Photobooks',
    namePT: 'Álbuns de Fotos',
    description: 'Hardcover and softcover photobooks',
    descriptionPT: 'Álbuns de fotos com capa dura ou mole',
    icon: 'Book',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    baseMargin: 45,
  },
};

// GET - List products or get product details
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'catalog';
    const category = searchParams.get('category');
    const sku = searchParams.get('sku');
    const search = searchParams.get('search');

    // Get product details by SKU
    if (action === 'details' && sku) {
      try {
        const response = await getProductDetails(sku);
        const product = response.product;

        if (!product) {
          return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        // Find product in our catalog for additional metadata
        const catalogProduct = searchProdigiCatalog(sku).find(p => p.sku === sku);
        const categoryKey = Object.entries(PRODIGI_CATALOG).find(
          ([, products]) => products.some(p => p.sku === sku)
        )?.[0];
        const categoryInfo = categoryKey ? CATEGORY_INFO[categoryKey as keyof typeof CATEGORY_INFO] : null;

        return NextResponse.json({
          product: {
            ...product,
            catalogInfo: catalogProduct,
            categoryInfo,
            shipsToSouthAmerica: product.variants?.some(v => 
              v.shipsTo?.includes('BR') || v.shipsTo?.includes('AR') || v.shipsTo?.includes('CL')
            ),
            shipsToBrazil: product.variants?.some(v => v.shipsTo?.includes('BR')),
          },
        });
      } catch (error) {
        console.error('[Prodigi] Error fetching product details:', error);
        return NextResponse.json({ error: 'Erro ao buscar detalhes do produto' }, { status: 500 });
      }
    }

    // Search products
    if (action === 'search' && search) {
      const results = searchProdigiCatalog(search);
      
      // Enrich with category info
      const enrichedResults = results.map(product => {
        const categoryKey = Object.entries(PRODIGI_CATALOG).find(
          ([, products]) => products.some(p => p.sku === product.sku)
        )?.[0];
        const categoryInfo = categoryKey ? CATEGORY_INFO[categoryKey as keyof typeof CATEGORY_INFO] : null;
        
        return {
          ...product,
          categoryInfo,
          estimatedBaseCostBRL: 50, // Placeholder - should fetch from API
          suggestedSellingPriceBRL: calculateSellingPrice(50, categoryInfo?.baseMargin || 45),
        };
      });

      return NextResponse.json({ products: enrichedResults });
    }

    // Get products by category
    if (category && category !== 'all') {
      const products = getProdigiProductsByCategory(category as keyof typeof PRODIGI_CATALOG);
      const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];

      // Enrich with pricing estimates
      const enrichedProducts = products.map(product => ({
        ...product,
        categoryInfo,
        estimatedBaseCostBRL: getEstimatedBaseCost(product.sku),
        suggestedSellingPriceBRL: calculateSellingPrice(
          getEstimatedBaseCost(product.sku),
          categoryInfo?.baseMargin || 45
        ),
      }));

      return NextResponse.json({
        category: categoryInfo,
        products: enrichedProducts,
      });
    }

    // Default: return full catalog with categories
    const catalog = Object.entries(PRODIGI_CATALOG).map(([key, products]) => {
      const info = CATEGORY_INFO[key as keyof typeof CATEGORY_INFO];
      return {
        key,
        ...info,
        productCount: products.length,
        products: products.map(p => ({
          ...p,
          estimatedBaseCostBRL: getEstimatedBaseCost(p.sku),
          suggestedSellingPriceBRL: calculateSellingPrice(
            getEstimatedBaseCost(p.sku),
            info?.baseMargin || 45
          ),
        })),
      };
    });

    // Stats
    const totalProducts = Object.values(PRODIGI_CATALOG).reduce(
      (sum, products) => sum + products.length, 0
    );

    return NextResponse.json({
      catalog,
      stats: {
        totalProducts,
        categories: catalog.length,
        shippingToSouthAmerica: true,
        fulfillmentLocations: ['UK', 'USA', 'EU', 'Australia'],
        averageProductionDays: '2-5',
        averageShippingDaysToBrazil: '10-20',
      },
      exchangeRates: EXCHANGE_RATES,
    });
  } catch (error) {
    console.error('[Prodigi Products] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

// Helper to estimate base cost in BRL based on SKU
function getEstimatedBaseCost(sku: string): number {
  // Base costs in GBP (approximate Prodigi pricing)
  const skuPricing: Record<string, number> = {
    // Canvas
    'GLOBAL-CAN-10X10': 12,
    'GLOBAL-CAN-12X12': 14,
    'GLOBAL-CAN-16X16': 18,
    'GLOBAL-CAN-20X20': 24,
    'GLOBAL-CAN-8X10': 11,
    'GLOBAL-CAN-11X14': 15,
    'GLOBAL-CAN-12X16': 16,
    'GLOBAL-CAN-16X20': 20,
    'GLOBAL-CAN-18X24': 26,
    'GLOBAL-CAN-20X30': 32,
    'GLOBAL-CAN-24X36': 42,
    // Framed
    'GLOBAL-CFPM-8X10': 18,
    'GLOBAL-CFPM-11X14': 24,
    'GLOBAL-CFPM-12X16': 28,
    'GLOBAL-CFPM-16X20': 35,
    'GLOBAL-CFPM-18X24': 42,
    'GLOBAL-CFPM-20X30': 52,
    'GLOBAL-CFPM-24X36': 68,
    // Fine Art
    'GLOBAL-FAP-8X10': 8,
    'GLOBAL-FAP-10X10': 9,
    'GLOBAL-FAP-11X14': 11,
    'GLOBAL-FAP-12X12': 10,
    'GLOBAL-FAP-12X16': 13,
    'GLOBAL-FAP-16X20': 17,
    'GLOBAL-FAP-18X24': 22,
    'GLOBAL-FAP-20X30': 28,
    'GLOBAL-FAP-24X36': 38,
    // Posters
    'GLOBAL-HPR-8X10': 4,
    'GLOBAL-HPR-11X14': 6,
    'GLOBAL-HPR-12X16': 7,
    'GLOBAL-HPR-16X20': 9,
    'GLOBAL-HPR-18X24': 12,
    'GLOBAL-HPR-24X36': 18,
    // Metal
    'GLOBAL-MET-8X10': 22,
    'GLOBAL-MET-10X10': 26,
    'GLOBAL-MET-12X12': 32,
    'GLOBAL-MET-12X16': 36,
    'GLOBAL-MET-16X16': 45,
    'GLOBAL-MET-16X20': 52,
    'GLOBAL-MET-18X24': 65,
    'GLOBAL-MET-20X20': 58,
    'GLOBAL-MET-20X30': 78,
    'GLOBAL-MET-24X36': 105,
    // Acrylic
    'GLOBAL-ACRY-8X10': 28,
    'GLOBAL-ACRY-10X10': 32,
    'GLOBAL-ACRY-12X12': 42,
    'GLOBAL-ACRY-12X16': 48,
    'GLOBAL-ACRY-16X20': 68,
    'GLOBAL-ACRY-18X24': 85,
    'GLOBAL-ACRY-20X30': 110,
    // Phone Cases
    'GLOBAL-TECH-IP15PM-SC-CP': 8,
    'GLOBAL-TECH-IP15P-SC-CP': 8,
    'GLOBAL-TECH-IP15-SC-CP': 8,
    'GLOBAL-TECH-IP14PM-SC-CP': 8,
    'GLOBAL-TECH-IP14P-SC-CP': 8,
    'GLOBAL-TECH-IP14-SC-CP': 8,
    'GLOBAL-TECH-IP13PM-SC-CP': 8,
    'GLOBAL-TECH-IP13P-SC-CP': 8,
    'GLOBAL-TECH-IP13-SC-CP': 8,
    'GLOBAL-TECH-SAMS24U-SC-CP': 8,
    'GLOBAL-TECH-SAMS24P-SC-CP': 8,
    'GLOBAL-TECH-SAMS24-SC-CP': 8,
    // Mugs
    'GLOBAL-CER-11OZ': 5,
    'GLOBAL-CER-15OZ': 6,
    'GLOBAL-CER-MUG-ENAMEL': 9,
    // Cards
    'GLOBAL-GCB-A5': 2,
    'GLOBAL-GCB-A6': 1.5,
    'GLOBAL-GCB-SQ': 2,
    // Calendars
    'GLOBAL-WCCL-A3-LAND': 15,
    'GLOBAL-WCCL-A4-PORT': 12,
    // Photobooks
    'BOOK-A4-L-HARD-M': 22,
    'BOOK-A4-P-HARD-M': 22,
    'BOOK-A5-L-HARD-M': 18,
    'BOOK-A5-P-HARD-M': 18,
    'BOOK-8X8-HARD-M': 20,
  };

  const priceGBP = skuPricing[sku] || 15; // Default £15
  return Math.round(priceGBP * EXCHANGE_RATES.GBP_TO_BRL * 100) / 100;
}
