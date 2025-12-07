/**
 * Prodigi Products API
 * Browse catalog, get product details, and pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  PRODIGI_CATALOG,
  PRODIGI_CATEGORIES,
  getProductBySku,
  getAllProducts,
  searchProducts,
  gbpToBrl,
  getProductWithPricing,
} from '@/lib/prodigi-catalog';
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
      const product = getProductBySku(sku);
      if (!product) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      const productWithPricing = getProductWithPricing(product);
      const categoryInfo = PRODIGI_CATEGORIES.find(c => 
        PRODIGI_CATALOG[c.key]?.some(p => p.sku === sku)
      );

      return NextResponse.json({
        product: {
          ...productWithPricing,
          categoryInfo,
          shipsToBrazil: true,
        },
      });
    }

    // Search products
    if (action === 'search' && search) {
      const results = searchProducts(search);
      const enrichedResults = results.map(product => {
        const pricedProduct = getProductWithPricing(product);
        return {
          ...pricedProduct,
          estimatedBaseCostBRL: pricedProduct.basePriceBRL,
          suggestedSellingPriceBRL: pricedProduct.suggestedPriceBRL,
        };
      });

      return NextResponse.json({ products: enrichedResults });
    }

    // Get products by category
    if (category && category !== 'all') {
      const products = PRODIGI_CATALOG[category] || [];
      const categoryInfo = PRODIGI_CATEGORIES.find(c => c.key === category);

      const enrichedProducts = products.map(product => {
        const pricedProduct = getProductWithPricing(product);
        return {
          ...pricedProduct,
          estimatedBaseCostBRL: pricedProduct.basePriceBRL,
          suggestedSellingPriceBRL: pricedProduct.suggestedPriceBRL,
        };
      });

      return NextResponse.json({
        category: categoryInfo,
        products: enrichedProducts,
      });
    }

    // Default: return full catalog with categories
    const catalog = PRODIGI_CATEGORIES.map(catInfo => {
      const products = PRODIGI_CATALOG[catInfo.key] || [];
      return {
        ...catInfo,
        productCount: products.length,
        products: products.map(product => {
          const pricedProduct = getProductWithPricing(product);
          return {
            ...pricedProduct,
            estimatedBaseCostBRL: pricedProduct.basePriceBRL,
            suggestedSellingPriceBRL: pricedProduct.suggestedPriceBRL,
          };
        }),
      };
    });

    // Stats
    const totalProducts = getAllProducts().length;

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

// Pricing is now managed in prodigi-catalog.ts with basePriceGBP in each product
