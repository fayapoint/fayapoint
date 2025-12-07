/**
 * Prodigi Mockup Generation API
 * Generates product mockups by combining user designs with product templates
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { getProductBySku, PRODIGI_CATEGORIES } from '@/lib/prodigi-catalog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to verify auth
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

/**
 * POST - Generate mockup image
 * Combines user's design with product template using Cloudinary transformations
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { sku, designUrl, sizing = 'fill' } = body;

    if (!sku || !designUrl) {
      return NextResponse.json(
        { error: 'SKU e designUrl são obrigatórios' },
        { status: 400 }
      );
    }

    // Get product info
    const product = getProductBySku(sku);
    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Generate mockup using Cloudinary transformations
    // We'll overlay the design onto the product mockup image
    const mockupUrl = await generateMockupWithCloudinary(
      product.mockupImage,
      designUrl,
      product.printArea,
      sizing
    );

    // Also generate a simple preview (design only, properly sized)
    const previewUrl = await generateDesignPreview(
      designUrl,
      product.printDimensions,
      product.aspectRatio
    );

    return NextResponse.json({
      success: true,
      mockups: [
        {
          type: 'product',
          url: mockupUrl,
          isDefault: true,
        },
        {
          type: 'design',
          url: previewUrl,
          isDefault: false,
        },
      ],
      product: {
        sku: product.sku,
        name: product.name,
        size: product.size,
        aspectRatio: product.aspectRatio,
        printDimensions: product.printDimensions,
      },
    });
  } catch (error) {
    console.error('[Prodigi Mockup] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar mockup' },
      { status: 500 }
    );
  }
}

/**
 * Generate mockup using Cloudinary overlay transformations
 */
async function generateMockupWithCloudinary(
  productImageUrl: string,
  designUrl: string,
  printArea: { x: number; y: number; width: number; height: number },
  sizing: string
): Promise<string> {
  try {
    // First, upload the design to Cloudinary if it's not already there
    let designPublicId: string;
    
    if (designUrl.includes('cloudinary.com')) {
      // Extract public ID from Cloudinary URL
      const match = designUrl.match(/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      designPublicId = match ? match[1] : '';
    } else {
      // Upload the design to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(designUrl, {
        folder: 'prodigi-designs',
        resource_type: 'image',
      });
      designPublicId = uploadResult.public_id;
    }

    if (!designPublicId) {
      throw new Error('Could not get design public ID');
    }

    // Calculate overlay position and size
    // Cloudinary uses relative positioning (0-1.0 or percentages)
    const overlayWidth = Math.round(printArea.width);
    const overlayHeight = Math.round(printArea.height);
    const overlayX = Math.round(printArea.x + printArea.width / 2); // Center position
    const overlayY = Math.round(printArea.y + printArea.height / 2);

    // Build Cloudinary URL with overlay transformation
    // We'll use the fetch feature to load the product image and overlay our design
    const transformations = [
      // Base: fetch the product mockup image
      { fetch_format: 'auto', quality: 'auto' },
      // Overlay the design
      {
        overlay: {
          url: designUrl,
        },
        width: overlayWidth,
        height: overlayHeight,
        crop: sizing === 'fit' ? 'fit' : 'fill',
        gravity: 'center',
        x: overlayX - 50, // Adjust from percentage
        y: overlayY - 50,
        flags: 'relative',
      },
    ];

    // Generate URL using Cloudinary's URL generation
    // Since we're working with external URLs, we'll use a different approach
    // Using Cloudinary's fetch + layer feature
    const mockupUrl = cloudinary.url('', {
      type: 'fetch',
      fetch_format: 'jpg',
      quality: 90,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        {
          overlay: {
            url: encodeURIComponent(designUrl),
          },
          width: `${overlayWidth}p`,
          height: `${overlayHeight}p`,
          crop: sizing === 'fit' ? 'fit' : 'fill',
          gravity: 'north_west',
          x: `${printArea.x}p`,
          y: `${printArea.y}p`,
          flags: 'layer_apply',
        },
      ],
      sign_url: true,
      secure: true,
    });

    // Alternative: Create a simple composite mockup URL
    // This approach uses Cloudinary's URL-based transformations
    const simpleUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/w_800,h_800,c_limit/l_fetch:${Buffer.from(designUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')},w_${overlayWidth * 8},h_${overlayHeight * 8},c_${sizing === 'fit' ? 'fit' : 'fill'},g_north_west,x_${Math.round(printArea.x * 8)},y_${Math.round(printArea.y * 8)}/${encodeURIComponent(productImageUrl)}`;

    return simpleUrl;
  } catch (error) {
    console.error('[Cloudinary Mockup] Error:', error);
    // Fallback: return the design URL with product info
    return designUrl;
  }
}

/**
 * Generate a properly sized design preview
 */
async function generateDesignPreview(
  designUrl: string,
  dimensions: { widthPx: number; heightPx: number },
  aspectRatio: string
): Promise<string> {
  try {
    // Parse aspect ratio
    const [w, h] = aspectRatio.split(':').map(Number);
    const targetWidth = Math.min(800, dimensions.widthPx);
    const targetHeight = Math.round(targetWidth * (h / w));

    // Generate resized preview URL using Cloudinary
    const previewUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/w_${targetWidth},h_${targetHeight},c_fill,q_90/${encodeURIComponent(designUrl)}`;

    return previewUrl;
  } catch (error) {
    console.error('[Design Preview] Error:', error);
    return designUrl;
  }
}

/**
 * GET - Get available mockup templates for a product
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      // Return all categories with sample mockups
      return NextResponse.json({
        categories: PRODIGI_CATEGORIES.map(cat => ({
          ...cat,
          sampleMockup: cat.image,
        })),
      });
    }

    // Get specific product mockup info
    const product = getProductBySku(sku);
    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product: {
        sku: product.sku,
        name: product.name,
        size: product.size,
        category: product.category,
        mockupImage: product.mockupImage,
        printArea: product.printArea,
        aspectRatio: product.aspectRatio,
        printDimensions: product.printDimensions,
      },
      mockupTemplates: [
        {
          id: 'default',
          name: 'Vista Frontal',
          url: product.mockupImage,
          printArea: product.printArea,
        },
      ],
    });
  } catch (error) {
    console.error('[Prodigi Mockup GET] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    );
  }
}
