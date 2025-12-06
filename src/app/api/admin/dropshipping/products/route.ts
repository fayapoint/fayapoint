import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import dbConnect from '@/lib/mongodb';
import DropshippingProduct, { IDropshippingProduct } from '@/models/DropshippingProduct';
import StoreProduct from '@/models/StoreProduct';
import { generateSlug, convertToBRL, calculateSellingPrice } from '@/lib/dropshipping-utils';

// GET - List dropshipping products with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const hasAffiliate = searchParams.get('hasAffiliate');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (status) query.status = status;
    if (source) query.sourceSlug = source;
    if (category) query.category = category;
    if (hasAffiliate === 'true') query['affiliate.hasProgram'] = true;
    if (minPrice) query.sellingPrice = { $gte: parseFloat(minPrice) };
    if (maxPrice) query.sellingPrice = { ...query.sellingPrice, $lte: parseFloat(maxPrice) };
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      DropshippingProduct.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      DropshippingProduct.countDocuments(query),
    ]);

    // Get stats
    const stats = await DropshippingProduct.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$sellingPrice' },
          avgRating: { $avg: '$rating' },
          avgCommission: { $avg: '$affiliate.commissionRate' },
          totalWithAffiliate: {
            $sum: { $cond: ['$affiliate.hasProgram', 1, 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        avgPrice: 0,
        avgRating: 0,
        avgCommission: 0,
        totalWithAffiliate: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Save new product from search results
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Check if product already exists
    const existing = await DropshippingProduct.findOne({
      externalId: body.externalId,
      sourceSlug: body.sourceSlug,
    });

    if (existing) {
      // Update existing product
      const updated = await DropshippingProduct.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            ...body,
            lastPriceCheck: new Date(),
            lastStockCheck: new Date(),
          },
          $push: {
            priceHistory: {
              price: body.priceBRL,
              shippingCost: body.bestShippingOption?.cost || 0,
              totalCost: body.priceBRL + (body.bestShippingOption?.cost || 0),
              currency: 'BRL',
              recordedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      await logAdminAction(
        authResult.admin!.id,
        authResult.admin!.email,
        `Updated dropshipping product: ${body.name}`,
        'product',
        { targetType: 'product', targetId: (existing._id as { toString(): string }).toString() }
      );

      return NextResponse.json({
        success: true,
        product: updated,
        action: 'updated',
      });
    }

    // Create new product
    const product = new DropshippingProduct({
      ...body,
      status: 'pending',
      lastPriceCheck: new Date(),
      lastStockCheck: new Date(),
    });

    await product.save();

    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Saved new dropshipping product: ${body.name}`,
      'product',
      { targetType: 'product', targetId: (product._id as { toString(): string }).toString() }
    );

    return NextResponse.json({
      success: true,
      product,
      action: 'created',
    });
  } catch (error) {
    console.error('Error saving product:', error);
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
  }
}

// PUT - Update product status, notes, or import to store
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await DropshippingProduct.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'approve':
        product.status = 'approved';
        product.reviewedBy = authResult.admin!.email;
        product.reviewedAt = new Date();
        break;

      case 'reject':
        product.status = 'rejected';
        product.reviewedBy = authResult.admin!.email;
        product.reviewedAt = new Date();
        product.notes = updateData.notes || 'Rejected by admin';
        break;

      case 'import':
        // Import to store as StoreProduct
        const storeProduct = await importToStore(product, authResult.admin!.email);
        product.status = 'imported';
        product.importedToStoreAt = new Date();
        product.storeProductId = (storeProduct._id as { toString(): string }).toString();

        await logAdminAction(
          authResult.admin!.id,
          authResult.admin!.email,
          `Imported product to store: ${product.name}`,
          'product',
          { targetType: 'product', targetId: (storeProduct._id as { toString(): string }).toString() }
        );

        await product.save();

        return NextResponse.json({
          success: true,
          product,
          storeProduct,
          message: 'Product imported to store successfully',
        });

      case 'update-price':
        // Recalculate prices
        const newPriceBRL = await convertToBRL(
          updateData.currentPrice || product.currentPrice,
          product.originalCurrency
        );
        const shippingCost = product.bestShippingOption?.cost || 0;
        const pricing = calculateSellingPrice(newPriceBRL, shippingCost, product.profitMargin);

        product.currentPrice = updateData.currentPrice || product.currentPrice;
        product.priceBRL = newPriceBRL;
        product.sellingPrice = pricing.sellingPrice;
        product.profitAmount = pricing.profitAmount;
        product.lastPriceCheck = new Date();

        // Add to price history
        product.priceHistory.push({
          price: newPriceBRL,
          shippingCost,
          totalCost: pricing.totalCost,
          currency: 'BRL',
          recordedAt: new Date(),
        });

        // Update lowest/highest
        if (newPriceBRL < product.lowestPrice || product.lowestPrice === 0) {
          product.lowestPrice = newPriceBRL;
        }
        if (newPriceBRL > product.highestPrice) {
          product.highestPrice = newPriceBRL;
        }
        break;

      default:
        // General update
        Object.assign(product, updateData);
    }

    await product.save();

    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Updated dropshipping product: ${product.name} (${action || 'update'})`,
      'product',
      { targetType: 'product', targetId: id }
    );

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Remove product
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await DropshippingProduct.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Deleted dropshipping product: ${product.name}`,
      'product',
      { targetType: 'product', targetId: id }
    );

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

/**
 * Import dropshipping product to store
 */
async function importToStore(product: IDropshippingProduct, adminEmail: string) {
  const slug = generateSlug(product.nameTranslated || product.name);

  // Check for existing slug
  let uniqueSlug = slug;
  let counter = 1;
  while (await StoreProduct.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const storeProduct = new StoreProduct({
    slug: uniqueSlug,
    name: product.nameTranslated || product.name,
    shortDescription: product.shortDescription || product.description.substring(0, 200),
    fullDescription: product.descriptionTranslated || product.description,
    category: product.category,
    subcategory: product.subcategory || '',
    brand: product.brand || product.supplier.name,
    sku: `DROP-${product.sourceSlug.toUpperCase()}-${product.externalId}`,
    thumbnail: product.thumbnail,
    images: product.images,
    price: product.sellingPrice,
    originalPrice: product.originalPriceBRL,
    discount: Math.round((1 - product.sellingPrice / (product.originalPriceBRL * 1.3)) * 100),
    currency: 'BRL',
    stock: Math.min(product.stock, 100), // Limit displayed stock
    isActive: true,
    isFeatured: product.trendingScore > 70,
    isNewArrival: true,
    tags: product.tags,
    specifications: [
      { key: 'Origem', value: product.sourceName },
      { key: 'Tempo de Entrega', value: `${product.estimatedDeliveryDays.min}-${product.estimatedDeliveryDays.max} dias` },
      { key: 'Frete Incluso', value: product.bestShippingOption?.cost === 0 ? 'Sim' : 'Calculado no checkout' },
      ...(product.extractedDetails.features?.slice(0, 5).map((f, i) => ({
        key: `Característica ${i + 1}`,
        value: f,
      })) || []),
    ],
    rating: product.rating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    warranty: '30 dias de garantia',
    externalUrl: product.sourceUrl,
    weight: 0.5, // Default weight in kg
  });

  await storeProduct.save();

  return storeProduct;
}
