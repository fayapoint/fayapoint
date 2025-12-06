import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import mongoose from 'mongoose';

// GET - List all products from both databases
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database') || 'fayapointProdutos';
    const collection = searchParams.get('collection') || 'products';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Connect to specified database
    const db = mongoose.connection.useDb(database);
    const col = db.collection(collection);

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      col.find(query).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      database,
      collection,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Admin products list error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar produtos' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { database = 'fayapointProdutos', collection = 'products', data } = body;

    if (!data) {
      return NextResponse.json({ error: 'Dados do produto são obrigatórios' }, { status: 400 });
    }

    // Connect to specified database
    const db = mongoose.connection.useDb(database);
    const col = db.collection(collection);

    // Add timestamps
    const productData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(productData);

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Created product',
      'product',
      {
        targetType: 'product',
        targetId: result.insertedId.toString(),
        details: { database, collection, name: data.name || data.title },
      }
    );

    return NextResponse.json({
      success: true,
      product: { _id: result.insertedId, ...productData },
    });

  } catch (error) {
    console.error('Admin create product error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}
