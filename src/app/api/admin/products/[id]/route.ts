import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import { invalidarCursoNoCache, invalidateProductCache } from '@/lib/products';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database') || 'fayapointProdutos';
    const collection = searchParams.get('collection') || 'products';

    const db = mongoose.connection.useDb(database);
    const col = db.collection(collection);

    let product;
    try {
      product = await col.findOne({ _id: new ObjectId(id) });
    } catch {
      // If ObjectId fails, try as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      product = await col.findOne({ _id: id as any });
    }

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });

  } catch (error) {
    console.error('Admin get product error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { database = 'fayapointProdutos', collection = 'products', data } = body;

    if (!data) {
      return NextResponse.json({ error: 'Dados são obrigatórios' }, { status: 400 });
    }

    const db = mongoose.connection.useDb(database);
    const col = db.collection(collection);

    // Add updated timestamp
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // Remove _id from update data if present
    delete updateData._id;

    let result;
    try {
      result = await col.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    } catch {
      result = await col.findOneAndUpdate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: id as any },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    }

    if (!result) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    /**
     * ⚠️ ISTO É O QUE FAZ "EDITEI E NÃO MUDOU NADA" DEIXAR DE ACONTECER.
     *
     * A edição grava no Mongo na hora, mas quem serve a página é o cache: a
     * lista (`products:list`, 10 min), o produto (`product:<slug>`, 10 min), a
     * tradução do corpo (`conteudo:en:<slug>`) e os capítulos já picados do
     * livro e do Ateliê (1 hora). Sem invalidar, o painel confirma o salvamento
     * e o site continua mostrando o texto anterior por até uma hora.
     *
     * `invalidarCursoNoCache` quando sabemos o slug (apaga chave exata, mais
     * barato); a limpeza geral quando não sabemos — produto sem slug existe
     * nesta coleção.
     */
    const slugAlterado = (result as { slug?: string } | null)?.slug ?? (data as { slug?: string })?.slug;
    if (slugAlterado) {
      await invalidarCursoNoCache(slugAlterado);
    } else {
      await invalidateProductCache();
    }

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Updated product',
      'product',
      {
        targetType: 'product',
        targetId: id,
        details: { database, collection, fields: Object.keys(data) },
      }
    );

    return NextResponse.json({
      success: true,
      product: result,
    });

  } catch (error) {
    console.error('Admin update product error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database') || 'fayapointProdutos';
    const collection = searchParams.get('collection') || 'products';

    const db = mongoose.connection.useDb(database);
    const col = db.collection(collection);

    // Get product info before deletion
    let product;
    try {
      product = await col.findOne({ _id: new ObjectId(id) });
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      product = await col.findOne({ _id: id as any });
    }

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Delete the product
    try {
      await col.deleteOne({ _id: new ObjectId(id) });
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await col.deleteOne({ _id: id as any });
    }

    // Apagado do banco, mas ainda no cache: sem isto o curso excluído continua
    // na lista e na própria página por até 10 minutos, com botão de compra.
    const slugApagado = (product as { slug?: string })?.slug;
    if (slugApagado) {
      await invalidarCursoNoCache(slugApagado);
    } else {
      await invalidateProductCache();
    }

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Deleted product',
      'product',
      {
        targetType: 'product',
        targetId: id,
        details: { database, collection, name: product.name || product.title },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Produto deletado com sucesso',
    });

  } catch (error) {
    console.error('Admin delete product error:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar produto' },
      { status: 500 }
    );
  }
}
