import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Receipt from '@/models/Receipt';

// =============================================================================
// GET - List user's receipts
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const skip = (page - 1) * limit;

    const receipts = await Receipt.find({ userId: authUser.id, status: 'issued' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Receipt.countDocuments({ userId: authUser.id, status: 'issued' });

    return NextResponse.json({
      receipts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Receipts] GET Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
