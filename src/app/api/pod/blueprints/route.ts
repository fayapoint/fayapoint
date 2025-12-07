import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import {
  getBlueprints,
  getBlueprint,
  getBlueprintPrintProviders,
  getBlueprintVariants,
  getBlueprintShipping,
  getShops,
  PrintifyBlueprint,
} from '@/lib/printify-api';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

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

// Popular blueprint categories for filtering
const POPULAR_CATEGORIES = [
  { key: 't-shirt', label: 'Camisetas', icon: 'Shirt' },
  { key: 'hoodie', label: 'Moletons', icon: 'Shirt' },
  { key: 'mug', label: 'Canecas', icon: 'Coffee' },
  { key: 'poster', label: 'Posters', icon: 'Frame' },
  { key: 'canvas', label: 'Canvas', icon: 'Frame' },
  { key: 'phone case', label: 'Capinhas', icon: 'Smartphone' },
  { key: 'tote bag', label: 'Bolsas', icon: 'ShoppingBag' },
  { key: 'pillow', label: 'Almofadas', icon: 'Home' },
  { key: 'blanket', label: 'Cobertores', icon: 'Home' },
  { key: 'sticker', label: 'Adesivos', icon: 'Sparkles' },
  { key: 'hat', label: 'Bonés', icon: 'Crown' },
  { key: 'tank', label: 'Regatas', icon: 'Shirt' },
];

// GET - Fetch blueprints catalog
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'catalog';
    const blueprintId = searchParams.get('blueprintId');
    const providerId = searchParams.get('providerId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    switch (action) {
      case 'catalog': {
        // Get all blueprints and organize by category
        const allBlueprints = await getBlueprints();
        
        // Filter and categorize
        const categorized: Record<string, PrintifyBlueprint[]> = {};
        const featured: PrintifyBlueprint[] = [];
        
        for (const bp of allBlueprints) {
          const title = bp.title.toLowerCase();
          
          // Apply search filter
          if (search && !title.includes(search.toLowerCase())) {
            continue;
          }
          
          // Apply category filter
          if (category && category !== 'all') {
            if (!title.includes(category.toLowerCase())) {
              continue;
            }
          }
          
          // Categorize
          for (const cat of POPULAR_CATEGORIES) {
            if (title.includes(cat.key)) {
              if (!categorized[cat.key]) categorized[cat.key] = [];
              categorized[cat.key].push(bp);
              break;
            }
          }
          
          // Add to featured (first 12 from popular brands)
          if (featured.length < 12 && bp.brand) {
            featured.push(bp);
          }
        }

        return NextResponse.json({
          success: true,
          totalBlueprints: allBlueprints.length,
          categories: POPULAR_CATEGORIES,
          blueprintsByCategory: categorized,
          featured,
          // Return filtered results if searching
          results: search || category ? Object.values(categorized).flat().slice(0, 50) : undefined,
        });
      }

      case 'blueprint': {
        // Get single blueprint details
        if (!blueprintId) {
          return NextResponse.json({ error: 'blueprintId required' }, { status: 400 });
        }

        const blueprint = await getBlueprint(parseInt(blueprintId));
        const providers = await getBlueprintPrintProviders(parseInt(blueprintId));

        return NextResponse.json({
          success: true,
          blueprint,
          providers,
        });
      }

      case 'variants': {
        // Get variants for blueprint + provider
        if (!blueprintId || !providerId) {
          return NextResponse.json({ error: 'blueprintId and providerId required' }, { status: 400 });
        }

        const variants = await getBlueprintVariants(
          parseInt(blueprintId),
          parseInt(providerId)
        );
        
        // Also get shipping info
        let shipping = null;
        try {
          shipping = await getBlueprintShipping(
            parseInt(blueprintId),
            parseInt(providerId)
          );
        } catch (e) {
          console.log('Shipping info not available:', e);
        }

        return NextResponse.json({
          success: true,
          variants: variants.variants,
          shipping,
        });
      }

      case 'shops': {
        // Get user's Printify shops
        try {
          const shops = await getShops();
          return NextResponse.json({
            success: true,
            shops,
            hasShop: shops.length > 0,
          });
        } catch (error) {
          console.error('Error fetching shops:', error);
          return NextResponse.json({
            success: false,
            shops: [],
            hasShop: false,
            error: 'Could not fetch Printify shops. Check API key.',
          });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Blueprints API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
