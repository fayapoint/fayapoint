import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

/**
 * Publicação de notícias da seção IA HOJE pelo agente autônomo (Kirmes/VPS).
 * Auth: header x-ainews-secret === env AINEWS_SECRET.
 * POST body: { items: [{ slug, tag, title, summary, url, source }] } (1..5)
 * GET: retorna os itens das últimas 48h (verificação do agente).
 */

function authorized(request: Request): boolean {
  const secret = process.env.AINEWS_SECRET;
  if (!secret) return false;
  return request.headers.get('x-ainews-secret') === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ error: 'DB indisponível' }, { status: 500 });

    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items.slice(0, 5) : [];
    const clean = items
      .map((i: Record<string, unknown>) => ({
        slug: String(i.slug ?? '').slice(0, 80),
        tag: String(i.tag ?? 'IA HOJE').slice(0, 30).toUpperCase(),
        title: String(i.title ?? '').slice(0, 120),
        summary: String(i.summary ?? '').slice(0, 300),
        url: typeof i.url === 'string' && /^https?:\/\//.test(i.url) ? i.url.slice(0, 500) : undefined,
        source: i.source ? String(i.source).slice(0, 60) : undefined,
        body: Array.isArray(i.body) ? (i.body as unknown[]).slice(0, 8).map((p) => String(p).slice(0, 900)) : undefined,
        sourceImage:
          typeof i.sourceImage === 'string' && /^https?:\/\//.test(i.sourceImage)
            ? i.sourceImage.slice(0, 600)
            : undefined,
        publishedAt: new Date(),
      }))
      .filter((i: { slug: string; title: string; summary: string }) => i.slug && i.title && i.summary);

    if (clean.length === 0) {
      return NextResponse.json({ error: 'Nenhum item válido' }, { status: 400 });
    }

    const col = db.collection('ainews');
    for (const item of clean) {
      // Dedup por URL: o LLM pode gerar slugs diferentes para a mesma matéria
      const filter = item.url ? { $or: [{ slug: item.slug }, { url: item.url }] } : { slug: item.slug };
      await col.updateOne(filter, { $set: item }, { upsert: true });
    }
    // Higiene: o hub guarda um trimestre de histórico
    await col.deleteMany({ publishedAt: { $lt: new Date(Date.now() - 90 * 24 * 3600 * 1000) } });

    return NextResponse.json({ published: clean.length, slugs: clean.map((i: { slug: string }) => i.slug) });
  } catch (error) {
    console.error('[AINEWS-PUBLISH]', error);
    return NextResponse.json({ error: 'Erro ao publicar' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return NextResponse.json({ error: 'DB indisponível' }, { status: 500 });
  const docs = await db
    .collection('ainews')
    .find({ publishedAt: { $gte: new Date(Date.now() - 48 * 3600 * 1000) } })
    .sort({ publishedAt: -1 })
    .limit(10)
    .toArray();
  return NextResponse.json({ count: docs.length, items: docs });
}
