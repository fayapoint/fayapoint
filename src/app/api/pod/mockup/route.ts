/**
 * API Route for generating Printify mockups
 * Fast path - returns Printify mockup URLs directly without extra processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  uploadImageByUrl, 
  createProduct, 
  deleteProduct, 
  getShops,
  getProduct
} from '@/lib/printify-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30 seconds for Printify operations

// POST - Generate mockups using Printify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      designUrl, 
      blueprintId, 
      printProviderId, 
      variantIds,
      productTitle = 'Mockup Preview'
    } = body;

    // Validate required fields
    if (!designUrl || !blueprintId || !printProviderId || !variantIds?.length) {
      return NextResponse.json({ 
        error: 'Missing required fields: designUrl, blueprintId, printProviderId, variantIds' 
      }, { status: 400 });
    }

    console.log('[Mockup API] Starting mockup generation for blueprint:', blueprintId);

    // Step 1: Get shop ID
    const shops = await getShops();
    if (!shops.length) {
      return NextResponse.json({ error: 'No Printify shop found' }, { status: 400 });
    }
    const shopId = shops[0].id;

    // Step 2: Upload design image to Printify
    console.log('[Mockup API] Uploading design to Printify...');
    const timestamp = Date.now();
    const fileName = `design_${timestamp}.png`;
    
    let upload;
    try {
      upload = await uploadImageByUrl(fileName, designUrl);
      console.log('[Mockup API] Design uploaded:', upload.id);
    } catch (uploadError) {
      console.error('[Mockup API] Upload failed:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload design to Printify',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 3: Create draft product with the design
    const variants = variantIds.map((id: number) => ({
      id,
      price: 2500,
      is_enabled: true
    }));

    const printAreas = [{
      variant_ids: variantIds as number[],
      placeholders: [{
        position: 'front',
        images: [{
          id: upload.id,
          x: 0.5,
          y: 0.5,
          scale: 1,
          angle: 0
        }]
      }]
    }];

    let product;
    try {
      product = await createProduct(shopId, {
        title: `${productTitle} - ${timestamp}`,
        description: 'Mockup preview product',
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants,
        print_areas: printAreas
      });
      console.log('[Mockup API] Draft product created:', product.id);
    } catch (createError) {
      console.error('[Mockup API] Product creation failed:', createError);
      return NextResponse.json({ 
        error: 'Failed to create mockup product',
        details: createError instanceof Error ? createError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 4: Wait briefly for Printify to generate mockups
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fetch the product to get mockup images
    let updatedProduct;
    try {
      updatedProduct = await getProduct(shopId, product.id);
    } catch {
      updatedProduct = product;
    }

    // Extract mockup images - return Printify URLs directly (fast)
    const mockups = (updatedProduct.images || []).map((img: { src: string; variant_ids?: number[]; position?: string; is_default?: boolean }) => ({
      src: img.src,
      variantIds: img.variant_ids,
      position: img.position,
      isDefault: img.is_default
    }));

    console.log('[Mockup API] Generated', mockups.length, 'mockups');

    return NextResponse.json({
      success: true,
      mockups,
      productId: product.id,
      uploadId: upload.id,
      shopId
    });

  } catch (error) {
    console.error('[Mockup API] Error:', error);
    return NextResponse.json({ 
      error: 'Mockup generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Clean up draft product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const shopId = searchParams.get('shopId');

    if (productId && shopId) {
      await deleteProduct(parseInt(shopId), productId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Mockup API] Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
