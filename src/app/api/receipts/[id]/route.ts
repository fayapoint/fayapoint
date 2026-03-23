import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Receipt from '@/models/Receipt';

// =============================================================================
// GET - Get single receipt by ID or receiptNumber
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Try by ID first, then by receiptNumber
    let receipt = await Receipt.findById(id).lean().catch(() => null);
    if (!receipt) {
      receipt = await Receipt.findOne({ receiptNumber: id }).lean();
    }

    if (!receipt) {
      return NextResponse.json({ error: 'Recibo não encontrado' }, { status: 404 });
    }

    // Security: only the owner can view their receipt
    if (String(receipt.userId) !== String(authUser.id)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('[Receipt] GET Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
