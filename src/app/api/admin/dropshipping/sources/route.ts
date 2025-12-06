import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import dbConnect from '@/lib/mongodb';
import DropshippingSource, { DEFAULT_DROPSHIPPING_SOURCES, IDropshippingSource } from '@/models/DropshippingSource';
import DropshippingProduct from '@/models/DropshippingProduct';

// GET - List all sources with stats
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const withStats = searchParams.get('withStats') !== 'false';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (activeOnly) query.isActive = true;

    const sources = await DropshippingSource.find(query)
      .sort({ isPriority: -1, name: 1 })
      .lean();

    // Get product counts per source
    let sourcesWithStats = sources;
    if (withStats) {
      const productCounts = await DropshippingProduct.aggregate([
        { $group: { _id: '$sourceSlug', count: { $sum: 1 } } },
      ]);
      
      const countsMap = new Map(productCounts.map(p => [p._id, p.count]));
      
      sourcesWithStats = sources.map(source => ({
        ...source,
        productCount: countsMap.get(source.slug) || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      sources: sourcesWithStats,
      total: sources.length,
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}

// POST - Add new source or initialize defaults
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Special action: initialize default sources
    if (body.action === 'initialize-defaults') {
      const existingSlugs = await DropshippingSource.distinct('slug');
      const newSources = DEFAULT_DROPSHIPPING_SOURCES.filter(
        s => !existingSlugs.includes(s.slug!)
      );

      if (newSources.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All default sources already exist',
          added: 0,
        });
      }

      await DropshippingSource.insertMany(newSources);

      await logAdminAction(
        authResult.admin!.id,
        authResult.admin!.email,
        `Initialized ${newSources.length} default dropshipping sources`,
        'system'
      );

      return NextResponse.json({
        success: true,
        message: `Added ${newSources.length} new sources`,
        added: newSources.length,
        sources: newSources.map(s => s.displayName),
      });
    }

    // Validate required fields
    if (!body.slug || !body.name || !body.website) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, website' },
        { status: 400 }
      );
    }

    // Check for existing source
    const existing = await DropshippingSource.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json(
        { error: 'Source with this slug already exists' },
        { status: 400 }
      );
    }

    const source = new DropshippingSource(body);
    await source.save();

    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Added new dropshipping source: ${body.displayName || body.name}`,
      'system',
      { targetId: (source._id as { toString(): string }).toString() }
    );

    return NextResponse.json({
      success: true,
      source,
    });
  } catch (error) {
    console.error('Error adding source:', error);
    return NextResponse.json({ error: 'Failed to add source' }, { status: 500 });
  }
}

// PUT - Update source
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Source ID required' }, { status: 400 });
    }

    // Prevent changing slug if products exist
    if (updateData.slug) {
      const source = await DropshippingSource.findById(id);
      if (source && source.slug !== updateData.slug) {
        const productCount = await DropshippingProduct.countDocuments({ sourceSlug: source.slug });
        if (productCount > 0) {
          return NextResponse.json(
            { error: `Cannot change slug. ${productCount} products are linked to this source.` },
            { status: 400 }
          );
        }
      }
    }

    const updated = await DropshippingSource.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Updated dropshipping source: ${updated.displayName}`,
      'system',
      { targetId: id }
    );

    return NextResponse.json({
      success: true,
      source: updated,
    });
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

// DELETE - Remove source
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const force = searchParams.get('force') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Source ID required' }, { status: 400 });
    }

    const source = await DropshippingSource.findById(id);
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Check for linked products
    const productCount = await DropshippingProduct.countDocuments({ sourceSlug: source.slug });
    if (productCount > 0 && !force) {
      return NextResponse.json({
        error: `Cannot delete. ${productCount} products are linked to this source. Use force=true to delete anyway.`,
        productCount,
      }, { status: 400 });
    }

    // Delete source and optionally its products
    if (force && productCount > 0) {
      await DropshippingProduct.deleteMany({ sourceSlug: source.slug });
    }

    await DropshippingSource.findByIdAndDelete(id);

    await logAdminAction(
      authResult.admin!.id,
      authResult.admin!.email,
      `Deleted dropshipping source: ${source.displayName}${force ? ` (and ${productCount} products)` : ''}`,
      'system',
      { targetId: id }
    );

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully',
      productsDeleted: force ? productCount : 0,
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
