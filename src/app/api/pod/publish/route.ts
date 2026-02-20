/**
 * API Route for publishing POD products to store and Printify
 * This handles the full workflow:
 * 1. Upload design to Printify
 * 2. Create product in Printify
 * 3. Publish product to Printify (make it live)
 * 4. Create store product listing with POD info
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import UserPODProduct from '@/models/UserPODProduct';
import StoreProduct from '@/models/StoreProduct';
import User from '@/models/User';
import {
  getShops,
  uploadImageByUrl,
  createProduct as createPrintifyProduct,
  publishProduct as publishToPrintify,
  getProduct as getPrintifyProduct,
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
    return user;
  } catch {
    return null;
  }
}

// Helper to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST - Publish POD product to store and Printify
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, subcategory } = body;

    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    // Get the POD product
    const podProduct = await UserPODProduct.findOne({
      _id: productId,
      userId: user._id,
    });

    if (!podProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Check if already published
    if (podProduct.isPublished && podProduct.providers?.some(p => p.syncStatus === 'synced')) {
      return NextResponse.json({ 
        error: 'Produto já está publicado',
        storeProductId: podProduct.providers?.find(p => p.providerSlug === 'store')?.providerProductId
      }, { status: 400 });
    }

    console.log('[Publish API] Starting publish flow for product:', podProduct.title);

    // Step 1: Get Printify shop
    const shops = await getShops();
    if (!shops.length) {
      return NextResponse.json({ error: 'Nenhuma loja Printify configurada' }, { status: 400 });
    }
    const shopId = shops[0].id;

    // Step 2: Upload design to Printify if not already uploaded
    let printifyImageId: string;
    const designUrl = podProduct.designFiles?.[0]?.url;
    
    if (!designUrl) {
      return NextResponse.json({ error: 'Design não encontrado' }, { status: 400 });
    }

    console.log('[Publish API] Uploading design to Printify...');
    try {
      const upload = await uploadImageByUrl(`design_${Date.now()}.png`, designUrl);
      printifyImageId = upload.id;
      console.log('[Publish API] Design uploaded:', printifyImageId);
    } catch (uploadError) {
      console.error('[Publish API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Erro ao fazer upload do design' }, { status: 500 });
    }

    // Step 3: Create product in Printify
    const blueprintId = parseInt(podProduct.templateId);
    const printProviderId = parseInt(podProduct.providers?.[0]?.providerId || '99'); // Default provider

    // Get variant IDs from POD product
    const variantIds = podProduct.variants.map(v => parseInt(v.providerVariantId));
    
    // Build print areas with proper scaling
    const printAreas = [{
      variant_ids: variantIds,
      placeholders: [{
        position: 'front',
        images: [{
          id: printifyImageId,
          x: 0.5,
          y: 0.5,
          scale: 0.6,
          angle: 0,
        }]
      }]
    }];

    // Build variants with pricing (convert BRL to USD cents)
    const USD_TO_BRL = 5.50;
    const variants = podProduct.variants.map(v => ({
      id: parseInt(v.providerVariantId),
      price: Math.round((v.sellingPrice / USD_TO_BRL) * 100), // Convert to USD cents
      is_enabled: v.isActive,
    }));

    console.log('[Publish API] Creating Printify product...');
    let printifyProduct;
    try {
      printifyProduct = await createPrintifyProduct(shopId, {
        title: podProduct.title,
        description: podProduct.description,
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants,
        print_areas: printAreas,
      });
      console.log('[Publish API] Printify product created:', printifyProduct.id);
    } catch (createError) {
      console.error('[Publish API] Create error:', createError);
      return NextResponse.json({ error: 'Erro ao criar produto no Printify' }, { status: 500 });
    }

    // Step 4: Wait for mockups to generate
    await wait(3000);
    
    // Get the product with mockups
    const updatedPrintifyProduct = await getPrintifyProduct(shopId, printifyProduct.id);
    const mockupImages = updatedPrintifyProduct.images?.map(img => img.src) || podProduct.mockupImages;

    // Step 5: Publish to Printify (make it live for orders)
    console.log('[Publish API] Publishing to Printify...');
    try {
      await publishToPrintify(shopId, printifyProduct.id, {
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
      });
      console.log('[Publish API] Published to Printify successfully');
    } catch (publishError) {
      console.error('[Publish API] Publish error:', publishError);
      // Continue anyway - product is created, just not published to external channel
    }

    // Step 6: Create Store Product listing
    console.log('[Publish API] Creating store product...');
    
    // Generate unique slug
    const baseSlug = podProduct.slug || podProduct.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const storeSlug = `${baseSlug}-${Date.now().toString(36)}`;
    
    // Determine subcategory based on product type
    const productSubcategory = subcategory || inferSubcategory(podProduct.templateName || podProduct.title);
    
    // Create store product
    const storeProduct = new StoreProduct({
      slug: storeSlug,
      name: podProduct.title,
      shortDescription: podProduct.shortDescription || podProduct.description.substring(0, 200),
      fullDescription: podProduct.description,
      category: 'pod', // Always in POD category
      subcategory: productSubcategory,
      brand: 'FayAi POD',
      sku: `POD-${printifyProduct.id}-${Date.now().toString(36)}`,
      thumbnail: mockupImages[0] || podProduct.primaryMockup || podProduct.mockupImages[0],
      images: mockupImages.length > 0 ? mockupImages : podProduct.mockupImages,
      price: podProduct.suggestedPrice,
      originalPrice: podProduct.suggestedPrice,
      discount: 0,
      currency: 'BRL',
      stock: 999, // POD has unlimited stock
      isActive: true,
      isFeatured: false,
      isNewArrival: true,
      tags: podProduct.tags || ['print-on-demand', 'personalizado'],
      specifications: [
        { key: 'Tipo', value: podProduct.templateName || 'Print on Demand' },
        { key: 'Produção', value: '3-5 dias úteis' },
        { key: 'Entrega Brasil', value: '15-30 dias úteis' },
      ],
      // POD-specific info
      podInfo: {
        isPOD: true,
        creatorId: user._id,
        creatorName: user.name,
        creatorEmail: user.email,
        podProductId: podProduct._id,
        printifyProductId: printifyProduct.id,
        printifyShopId: shopId,
        blueprintId,
        printProviderId,
        commissionRate: user.podEarnings?.commissionRate || 70,
        baseCost: podProduct.baseCost,
        designUrl: designUrl,
        variants: podProduct.variants.map(v => ({
          id: v.id,
          name: v.name,
          options: v.options,
          price: v.sellingPrice,
          stock: 999,
          sku: v.sku,
          printifyVariantId: parseInt(v.providerVariantId),
          isActive: v.isActive,
        })),
        publishedToPrintify: true,
        printifySyncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });

    await storeProduct.save();
    console.log('[Publish API] Store product created:', storeProduct._id);

    // Step 7: Update POD product with sync status
    podProduct.status = 'active';
    podProduct.isPublished = true;
    podProduct.publishedAt = new Date();
    podProduct.showInMarketplace = true;
    
    // Update providers array
    const printifyProviderIndex = podProduct.providers.findIndex(p => p.providerSlug === 'printify');
    if (printifyProviderIndex >= 0) {
      podProduct.providers[printifyProviderIndex].providerProductId = printifyProduct.id;
      podProduct.providers[printifyProviderIndex].syncStatus = 'synced';
      podProduct.providers[printifyProviderIndex].syncedAt = new Date();
    } else {
      podProduct.providers.push({
        providerId: String(printProviderId),
        providerSlug: 'printify',
        providerProductId: printifyProduct.id,
        syncStatus: 'synced',
        syncedAt: new Date(),
      });
    }
    
    // Add store provider
    podProduct.providers.push({
      providerId: String(storeProduct._id),
      providerSlug: 'store',
      providerProductId: String(storeProduct._id),
      publishedUrl: `/loja/produto/${storeSlug}`,
      syncStatus: 'synced',
      syncedAt: new Date(),
    });

    await podProduct.save();

    // Step 8: Update user's POD product count
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'podEarnings.totalProducts': 1 },
    });

    return NextResponse.json({
      success: true,
      message: 'Produto publicado com sucesso!',
      data: {
        podProductId: podProduct._id,
        storeProductId: storeProduct._id,
        printifyProductId: printifyProduct.id,
        storeUrl: `/loja/produto/${storeSlug}`,
        storeSlug,
      },
    });

  } catch (error) {
    console.error('[Publish API] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao publicar produto', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// Helper to infer subcategory from product name
function inferSubcategory(productName: string): string {
  const name = productName.toLowerCase();
  
  if (name.includes('shirt') || name.includes('camiseta') || name.includes('tee')) return 'Camisetas';
  if (name.includes('hoodie') || name.includes('moletom') || name.includes('sweat')) return 'Moletons';
  if (name.includes('mug') || name.includes('caneca') || name.includes('cup')) return 'Canecas';
  if (name.includes('poster') || name.includes('print')) return 'Posters';
  if (name.includes('canvas') || name.includes('quadro')) return 'Canvas';
  if (name.includes('phone') || name.includes('case') || name.includes('capinha')) return 'Capinhas';
  if (name.includes('bag') || name.includes('bolsa') || name.includes('tote')) return 'Bolsas';
  if (name.includes('pillow') || name.includes('almofada') || name.includes('cushion')) return 'Almofadas';
  if (name.includes('sticker') || name.includes('adesivo')) return 'Adesivos';
  
  return 'Outros';
}

// GET - Check publish status
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await getUserFromToken(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const podProduct = await UserPODProduct.findOne({
      _id: productId,
      userId: user._id,
    });

    if (!podProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Get store product if exists
    const storeProvider = podProduct.providers?.find(p => p.providerSlug === 'store');
    let storeProduct = null;
    if (storeProvider?.providerProductId) {
      storeProduct = await StoreProduct.findById(storeProvider.providerProductId);
    }

    return NextResponse.json({
      isPublished: podProduct.isPublished,
      status: podProduct.status,
      providers: podProduct.providers,
      storeProduct: storeProduct ? {
        id: storeProduct._id,
        slug: storeProduct.slug,
        url: `/loja/produto/${storeProduct.slug}`,
      } : null,
    });

  } catch (error) {
    console.error('[Publish API] Error:', error);
    return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 });
  }
}
