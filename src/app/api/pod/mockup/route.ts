/**
 * API Route for generating Printify mockups
 * Returns Printify mockup URLs with proper scaling
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
export const maxDuration = 60; // Allow up to 60 seconds for Printify operations

// Helper to wait with timeout
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST - Generate mockups using Printify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      designUrl, 
      blueprintId, 
      printProviderId, 
      variantIds,
      productTitle = 'Mockup Preview',
      // Optional: placeholder dimensions for proper scaling
      placeholderWidth = 4500, // Default print area width
      placeholderHeight = 5100, // Default print area height
      // User-selected placement options
      scaleFactor = 0.6, // 0.4=small, 0.6=medium, 0.8=large, 1.0=fill
      yPosition = 0.5 // 0.3=top, 0.5=center, 0.7=bottom
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
      console.log('[Mockup API] Design uploaded:', upload.id, 'size:', upload.width, 'x', upload.height);
    } catch (uploadError) {
      console.error('[Mockup API] Upload failed:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload design to Printify',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 3: Calculate proper scale based on user selection
    // scaleX/scaleY = how much to scale image to fit placeholder
    const scaleX = placeholderWidth / upload.width;
    const scaleY = placeholderHeight / upload.height;
    // Base scale to fit the image in the area
    const baseScale = Math.min(scaleX, scaleY);
    // Apply user's scale factor (0.4=small, 0.6=medium, 0.8=large, 1.0=fill)
    const scale = baseScale * scaleFactor;
    
    console.log('[Mockup API] Scale:', scale, '(factor:', scaleFactor, ') Position Y:', yPosition);

    // Step 4: Create draft product with the design
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
          x: 0.5, // Center horizontally
          y: yPosition, // User-selected vertical position (0.3=top, 0.5=center, 0.7=bottom)
          scale: scale, // User-selected scale
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

    // Step 5: Poll for mockups (Printify generates them asynchronously)
    // Try up to 5 times with increasing delays
    let mockups: { src: string; variantIds?: number[]; position?: string; isDefault?: boolean }[] = [];
    const maxAttempts = 5;
    const delays = [1500, 2000, 2500, 3000, 3500];
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await wait(delays[attempt]);
      
      try {
        const updatedProduct = await getProduct(shopId, product.id);
        const images = updatedProduct.images || [];
        
        console.log('[Mockup API] Attempt', attempt + 1, '- found', images.length, 'images');
        
        if (images.length > 0) {
          mockups = images.map((img: { src: string; variant_ids?: number[]; position?: string; is_default?: boolean }) => ({
            src: img.src,
            variantIds: img.variant_ids,
            position: img.position,
            isDefault: img.is_default
          }));
          
          // If we have multiple mockups, we're done
          if (mockups.length >= 2 || attempt >= 2) {
            break;
          }
        }
      } catch (e) {
        console.error('[Mockup API] Poll attempt', attempt + 1, 'failed:', e);
      }
    }

    console.log('[Mockup API] Final result:', mockups.length, 'mockups');

    return NextResponse.json({
      success: true,
      mockups,
      productId: product.id,
      uploadId: upload.id,
      shopId,
      imageSize: { width: upload.width, height: upload.height },
      calculatedScale: scale
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
