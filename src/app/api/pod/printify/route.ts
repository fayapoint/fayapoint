import { NextRequest, NextResponse } from 'next/server';
import {
  getShops,
  getBlueprints,
  getProducts,
  getBlueprintPrintProviders,
  getBlueprintVariants,
  getBlueprintShipping,
  PrintifyBlueprint,
} from '@/lib/printify-api';

// GET - Fetch Printify data (shops, blueprints, products)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'shops';
    const shopId = searchParams.get('shopId');
    const blueprintId = searchParams.get('blueprintId');
    const printProviderId = searchParams.get('printProviderId');
    const page = parseInt(searchParams.get('page') || '1');

    switch (action) {
      case 'shops': {
        // Get all shops
        const shops = await getShops();
        return NextResponse.json({
          success: true,
          shops,
          message: shops.length > 0 
            ? `Encontradas ${shops.length} lojas` 
            : 'Nenhuma loja encontrada. Crie uma loja API no Printify.',
        });
      }

      case 'blueprints': {
        // Get all product blueprints (templates)
        const blueprints = await getBlueprints();
        
        // Group by category
        const categories: Record<string, PrintifyBlueprint[]> = {};
        blueprints.forEach(bp => {
          const category = bp.brand || 'Outros';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(bp);
        });

        return NextResponse.json({
          success: true,
          total: blueprints.length,
          categories: Object.keys(categories).length,
          blueprints: blueprints.slice(0, 50), // Limit for response size
          allCategories: Object.keys(categories),
        });
      }

      case 'blueprint-details': {
        // Get details for a specific blueprint
        if (!blueprintId) {
          return NextResponse.json({ error: 'blueprintId required' }, { status: 400 });
        }

        const bpId = parseInt(blueprintId);
        const providers = await getBlueprintPrintProviders(bpId);

        return NextResponse.json({
          success: true,
          blueprintId: bpId,
          providers,
        });
      }

      case 'variants': {
        // Get variants for blueprint + provider
        if (!blueprintId || !printProviderId) {
          return NextResponse.json({ error: 'blueprintId and printProviderId required' }, { status: 400 });
        }

        const bpId = parseInt(blueprintId);
        const ppId = parseInt(printProviderId);
        
        const [variantsData, shippingData] = await Promise.all([
          getBlueprintVariants(bpId, ppId),
          getBlueprintShipping(bpId, ppId),
        ]);

        return NextResponse.json({
          success: true,
          blueprintId: bpId,
          printProviderId: ppId,
          variants: variantsData.variants,
          shipping: shippingData,
        });
      }

      case 'products': {
        // Get products for a shop
        if (!shopId) {
          return NextResponse.json({ error: 'shopId required' }, { status: 400 });
        }

        const products = await getProducts(parseInt(shopId), page);
        return NextResponse.json({
          success: true,
          ...products,
        });
      }

      case 'test': {
        // Test connection
        try {
          const shops = await getShops();
          const blueprints = await getBlueprints();
          
          return NextResponse.json({
            success: true,
            message: 'Conexão com Printify estabelecida!',
            data: {
              shopsCount: shops.length,
              shops: shops.map(s => ({ id: s.id, title: s.title })),
              blueprintsCount: blueprints.length,
              sampleBlueprints: blueprints.slice(0, 5).map(b => ({
                id: b.id,
                title: b.title,
                brand: b.brand,
              })),
            },
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: 'Erro ao conectar com Printify',
            error: String(error),
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Printify API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao comunicar com Printify',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
