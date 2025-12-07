import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import StoreProduct from '@/models/StoreProduct';
import User from '@/models/User';
import {
  getShops,
  getProducts,
  getBlueprints,
  getBlueprintPrintProviders,
  PrintifyProduct,
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
    const user = await User.findById(decoded.id).lean();
    return user as { _id: string; name?: string; email?: string } | null;
  } catch {
    return null;
  }
}

// GET - List Printify products available to sync
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'products';
    const shopId = searchParams.get('shopId');

    await dbConnect();

    switch (action) {
      case 'shops': {
        const shops = await getShops();
        return NextResponse.json({ success: true, shops });
      }

      case 'products': {
        if (!shopId) {
          // Get first shop
          const shops = await getShops();
          if (shops.length === 0) {
            return NextResponse.json({ 
              success: false, 
              error: 'No Printify shops found. Create a shop first.' 
            });
          }
          const products = await getProducts(shops[0].id);
          return NextResponse.json({ 
            success: true, 
            shopId: shops[0].id,
            shopName: shops[0].title,
            ...products 
          });
        }
        const products = await getProducts(parseInt(shopId));
        return NextResponse.json({ success: true, ...products });
      }

      case 'blueprints': {
        // Get popular blueprints for POD store
        const blueprints = await getBlueprints();
        
        // Group by popular categories
        const popularCategories = [
          't-shirt', 'hoodie', 'mug', 'poster', 'canvas', 'phone case', 
          'tote bag', 'pillow', 'blanket', 'sticker'
        ];
        
        const categorized: Record<string, PrintifyBlueprint[]> = {};
        
        for (const bp of blueprints) {
          const title = bp.title.toLowerCase();
          for (const cat of popularCategories) {
            if (title.includes(cat)) {
              if (!categorized[cat]) categorized[cat] = [];
              if (categorized[cat].length < 5) {
                categorized[cat].push(bp);
              }
              break;
            }
          }
        }

        return NextResponse.json({
          success: true,
          totalBlueprints: blueprints.length,
          categories: Object.keys(categorized),
          blueprintsByCategory: categorized,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Printify sync GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Import Printify products to store
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { action, shopId, productIds, blueprintId } = body;

    switch (action) {
      case 'import-products': {
        // Import specific products from Printify shop to store
        if (!shopId) {
          return NextResponse.json({ error: 'shopId required' }, { status: 400 });
        }

        const allProducts = await getProducts(shopId);
        const productsToImport = productIds 
          ? allProducts.data.filter(p => productIds.includes(p.id))
          : allProducts.data;

        const imported: string[] = [];
        const errors: string[] = [];

        for (const product of productsToImport) {
          try {
            const storeProduct = convertPrintifyToStoreProduct(product);
            
            // Check if already exists
            const existing = await StoreProduct.findOne({ sku: storeProduct.sku });
            if (existing) {
              // Update
              await StoreProduct.updateOne({ sku: storeProduct.sku }, storeProduct);
              imported.push(`Updated: ${product.title}`);
            } else {
              // Create
              await StoreProduct.create(storeProduct);
              imported.push(`Created: ${product.title}`);
            }
          } catch (err) {
            errors.push(`${product.title}: ${String(err)}`);
          }
        }

        return NextResponse.json({
          success: true,
          imported: imported.length,
          errors: errors.length,
          details: { imported, errors },
        });
      }

      case 'create-from-blueprint': {
        // Create a store product placeholder from a blueprint
        if (!blueprintId) {
          return NextResponse.json({ error: 'blueprintId required' }, { status: 400 });
        }

        // This would typically be used to create a POD product
        // For now, return the blueprint info
        const blueprints = await getBlueprints();
        const blueprint = blueprints.find(b => b.id === parseInt(blueprintId));
        
        if (!blueprint) {
          return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
        }

        const providers = await getBlueprintPrintProviders(blueprint.id);

        return NextResponse.json({
          success: true,
          blueprint,
          providers,
          message: 'Use this data to create a product with your design',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Printify sync POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Helper: Convert Printify product to StoreProduct format
function convertPrintifyToStoreProduct(product: PrintifyProduct) {
  const slug = product.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Find base price from variants
  const enabledVariants = product.variants.filter(v => v.is_enabled && v.is_available);
  const basePrice = enabledVariants.length > 0
    ? Math.min(...enabledVariants.map(v => v.price)) / 100 // Printify prices are in cents
    : 0;

  // Calculate selling price with 40% margin
  const sellingPrice = Math.round(basePrice * 1.4 * 100) / 100;

  // Get images
  const images = product.images
    .filter(img => img.src)
    .map(img => img.src);

  return {
    slug: `printify-${slug}-${product.id.slice(-6)}`,
    name: product.title,
    shortDescription: product.description?.slice(0, 200) || product.title,
    fullDescription: product.description || product.title,
    category: 'pod', // Print on Demand category
    subcategory: inferPODSubcategory(product.title),
    brand: 'Printify POD',
    sku: `PRINTIFY-${product.id}`,
    thumbnail: images[0] || '',
    images,
    price: sellingPrice,
    originalPrice: sellingPrice,
    discount: 0,
    currency: 'USD',
    stock: 999, // POD = unlimited
    isActive: product.visible,
    isFeatured: false,
    isNewArrival: true,
    tags: [...product.tags, 'pod', 'print-on-demand', 'printify'],
    specifications: [
      { key: 'Tipo', value: 'Print on Demand' },
      { key: 'Fornecedor', value: 'Printify' },
      { key: 'Variantes', value: String(enabledVariants.length) },
    ],
    rating: 4.5,
    reviewCount: 0,
    soldCount: 0,
    externalUrl: `https://printify.com/app/products/${product.id}`,
  };
}

function inferPODSubcategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('t-shirt') || lower.includes('tee')) return 'Camisetas';
  if (lower.includes('hoodie') || lower.includes('sweatshirt')) return 'Moletons';
  if (lower.includes('mug')) return 'Canecas';
  if (lower.includes('poster') || lower.includes('print')) return 'Posters';
  if (lower.includes('canvas')) return 'Canvas';
  if (lower.includes('phone') || lower.includes('case')) return 'Capinhas';
  if (lower.includes('tote') || lower.includes('bag')) return 'Bolsas';
  if (lower.includes('pillow')) return 'Almofadas';
  if (lower.includes('blanket')) return 'Cobertores';
  if (lower.includes('sticker')) return 'Adesivos';
  return 'Outros';
}
