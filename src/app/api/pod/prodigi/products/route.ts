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

// Category metadata is now in prodigi-catalog.ts via PRODIGI_CATEGORIES

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
