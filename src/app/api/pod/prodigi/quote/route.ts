/**
 * Prodigi Quote API
 * Get real-time pricing and shipping quotes from Prodigi
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  createQuote,
  getQuotesAllMethods,
  convertProdigiCost,
  calculateSellingPrice,
  calculateEstimatedDelivery,
  ProdigiShippingMethod,
} from '@/lib/prodigi-api';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Default profit margins by product category
const PROFIT_MARGINS: Record<string, number> = {
  canvas: 45,
  framedPrints: 50,
  fineArtPrints: 55,
  posters: 40,
  metalPrints: 50,
  acrylicPrints: 55,
  phoneCases: 45,
  mugs: 40,
  greetingCards: 50,
  calendars: 45,
  photobooks: 45,
  default: 45,
};

// POST - Create quote for items
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      items,
      destinationCountryCode = 'BR', // Default to Brazil
      currencyCode = 'GBP', // Prodigi's base currency
      shippingMethod, // Optional - if not specified, get all methods
      includeAllMethods = true, // Get quotes for all shipping methods
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate items
    const validatedItems = items.map((item: { sku: string; copies?: number; attributes?: Record<string, string> }) => ({
      sku: item.sku,
      copies: item.copies || 1,
      attributes: item.attributes || {},
      assets: [{ printArea: 'default' }],
    }));

    let quotes;

    if (includeAllMethods && !shippingMethod) {
      // Get quotes for all shipping methods
      quotes = await getQuotesAllMethods(
        destinationCountryCode,
        currencyCode,
        validatedItems
      );
    } else {
      // Get quote for specific shipping method
      const response = await createQuote({
        shippingMethod: shippingMethod || 'Standard',
        destinationCountryCode,
        currencyCode,
        items: validatedItems,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quotes = (response as any).quotes || [];
    }

    // Process quotes and convert to BRL with profit calculation
    const processedQuotes = quotes.map((quote: {
      shipmentMethod: ProdigiShippingMethod;
      costSummary: { items: { amount: string; currency: string }; shipping: { amount: string; currency: string } };
      shipments: { carrier: { name: string; service: string }; fulfillmentLocation: { countryCode: string; labCode: string }; cost: { amount: string; currency: string }; items: string[] }[];
      items: { id: string; sku: string; copies: number; unitCost: { amount: string; currency: string }; attributes: Record<string, string> }[];
    }) => {
      const itemsCostBRL = convertProdigiCost(quote.costSummary.items, true);
      const shippingCostBRL = convertProdigiCost(quote.costSummary.shipping, true);
      const totalCostBRL = itemsCostBRL + shippingCostBRL;
      
      // Calculate selling prices with profit
      const suggestedSellingPrice = calculateSellingPrice(itemsCostBRL, 45);
      const suggestedShippingCharge = Math.round(shippingCostBRL * 1.1 * 100) / 100; // 10% markup on shipping
      const suggestedTotal = suggestedSellingPrice + suggestedShippingCharge;
      const profit = suggestedTotal - totalCostBRL;
      
      // Get delivery estimates
      const delivery = calculateEstimatedDelivery(
        quote.shipmentMethod,
        destinationCountryCode
      );

      return {
        shippingMethod: quote.shipmentMethod,
        shippingMethodLabel: getShippingMethodLabel(quote.shipmentMethod),
        
        // Original costs (in original currency)
        originalCosts: {
          items: quote.costSummary.items,
          shipping: quote.costSummary.shipping,
          total: {
            amount: (parseFloat(quote.costSummary.items.amount) + parseFloat(quote.costSummary.shipping.amount)).toFixed(2),
            currency: currencyCode,
          },
        },
        
        // Converted to BRL (our cost)
        costsBRL: {
          items: itemsCostBRL,
          shipping: shippingCostBRL,
          total: totalCostBRL,
        },
        
        // Suggested pricing for customers
        suggestedPricing: {
          items: suggestedSellingPrice,
          shipping: suggestedShippingCharge,
          total: suggestedTotal,
          profit: profit,
          profitMargin: Math.round((profit / suggestedTotal) * 100),
        },
        
        // Delivery estimates
        delivery: {
          minDays: delivery.minDays,
          maxDays: delivery.maxDays,
          estimatedMinDate: addBusinessDays(new Date(), delivery.minDays).toISOString(),
          estimatedMaxDate: addBusinessDays(new Date(), delivery.maxDays).toISOString(),
        },
        
        // Fulfillment info
        shipments: quote.shipments.map(s => ({
          carrier: s.carrier,
          fulfillmentLocation: s.fulfillmentLocation,
          cost: convertProdigiCost(s.cost, true),
          items: s.items,
        })),
        
        // Item breakdown
        items: quote.items.map(item => ({
          id: item.id,
          sku: item.sku,
          copies: item.copies,
          unitCostOriginal: item.unitCost,
          unitCostBRL: convertProdigiCost(item.unitCost, true),
          suggestedUnitPrice: calculateSellingPrice(convertProdigiCost(item.unitCost, true), 45),
        })),
      };
    });

    // Sort by price (cheapest first)
    processedQuotes.sort((a: { costsBRL: { total: number } }, b: { costsBRL: { total: number } }) => a.costsBRL.total - b.costsBRL.total);

    return NextResponse.json({
      quotes: processedQuotes,
      destinationCountryCode,
      destinationCountryName: getCountryName(destinationCountryCode),
      requestedItems: items.length,
      cheapestOption: processedQuotes[0]?.shippingMethod,
      fastestOption: 'Overnight',
      recommendedOption: 'Standard',
      currency: 'BRL',
      note: 'Preços incluem margem de lucro sugerida de 45%. Você pode ajustar os preços conforme sua estratégia.',
    });
  } catch (error) {
    console.error('[Prodigi Quote] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular cotação. Verifique os SKUs e tente novamente.' },
      { status: 500 }
    );
  }
}

// Helper to get shipping method label in Portuguese
function getShippingMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'Budget': 'Econômico',
    'Standard': 'Padrão',
    'StandardPlus': 'Padrão Plus',
    'Express': 'Expresso',
    'Overnight': 'Urgente',
  };
  return labels[method] || method;
}

// Helper to get country name
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    'BR': 'Brasil',
    'US': 'Estados Unidos',
    'GB': 'Reino Unido',
    'DE': 'Alemanha',
    'FR': 'França',
    'AR': 'Argentina',
    'CL': 'Chile',
    'MX': 'México',
    'PT': 'Portugal',
    'ES': 'Espanha',
  };
  return countries[code] || code;
}

// Helper to add business days to a date
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
}
