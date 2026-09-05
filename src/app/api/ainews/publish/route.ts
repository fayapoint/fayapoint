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

/**
 * ── A MESMA NOTÍCIA, DE OUTRA FONTE ─────────────────────────────────────────
 *
 * O `upsert` abaixo já casava por `slug` e por `url`. Não bastou: em 05/09/2026
 * o acervo tinha 78 matérias e DUAS delas eram literalmente a mesma —
 * "Google redesenha a caixa de busca após 25 anos", publicada em 31/07 e de
 * novo em 01/08, com slugs e URLs diferentes. Outras duas cobriam o Suno 2.0
 * com títulos reescritos. São veículos diferentes falando do mesmo fato: o
 * dedupe por identificador nunca ia pegar.
 *
 * Conteúdo duplicado não é só feio — é passivo de busca. A política de Scaled
 * Content Abuse do Google desindexa exatamente isso, e as duas páginas ainda
 * competem entre si pela mesma consulta.
 *
 * A comparação é por CONJUNTO DE PALAVRAS, com três decisões deliberadas:
 *
 *  · palavras cortadas em 6 letras, para "música"/"músicas" e
 *    "redesenha"/"redesenhou" contarem como a mesma coisa sem um radicalizador
 *    de verdade;
 *  · corte por CONTENÇÃO no conjunto menor, não Jaccard: título curto que é
 *    subconjunto de um longo é a mesma matéria;
 *  · limite 0,65 — medido contra o acervo real. Acima disso as duplicatas
 *    escapam; muito abaixo, notícias legitimamente parecidas do mesmo produto
 *    passam a se bloquear.
 *
 * ⚠️ Item pulado sai NA RESPOSTA, nunca em silêncio. Guarda que descarta sem
 * dizer vira o defeito seguinte, e este endpoint já foi invisível uma vez
 * (a quebra de 17–19/07 passou três dias sem ninguém ver).
 */
const PARADAS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na',
  'nos', 'nas', 'um', 'uma', 'para', 'por', 'com', 'que', 'se', 'ao', 'aos',
  'sua', 'seu', 'mais', 'como', 'sem', 'the', 'of', 'to', 'and',
]);

function assinaturaDoTitulo(titulo: string): Set<string> {
  return new Set(
    String(titulo || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !PARADAS.has(t))
      .map((t) => t.slice(0, 6)),
  );
}

function pareceAMesma(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let iguais = 0;
  for (const t of a) if (b.has(t)) iguais++;
  return iguais / Math.min(a.size, b.size);
}

const LIMITE_DE_SEMELHANCA = 0.65;

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
        // Capa gerada especificamente pra esta matéria (regra do espelho, IDENTIDADE_VISUAL.md §9).
        // Se ausente, mapDoc() cai no pool genérico por editoria (ai-news.ts).
        image:
          typeof i.image === 'string' && /^https?:\/\//.test(i.image)
            ? i.image.slice(0, 600)
            : undefined,
        // A cena que o LLM descreveu para a capa, guardada com a matéria.
        //
        // Ela já era gerada e já era usada — mas morria aqui, porque este
        // `clean` é lista branca. Sem ela no banco, o backfill de capas
        // (scripts/arcade/backfill_news_covers.py) só tinha o TÍTULO como
        // prompt: a imagem saía no estilo certo e desligada do assunto.
        // O agente manda em snake_case; aqui vira camelCase como o resto.
        imagePrompt:
          typeof i.image_prompt === 'string'
            ? i.image_prompt.slice(0, 600)
            : typeof i.imagePrompt === 'string'
              ? i.imagePrompt.slice(0, 600)
              : undefined,
        glow: typeof i.glow === 'string' ? i.glow.slice(0, 20) : undefined,
        publishedAt: new Date(),
      }))
      .filter((i: { slug: string; title: string; summary: string }) => i.slug && i.title && i.summary);

    if (clean.length === 0) {
      return NextResponse.json({ error: 'Nenhum item válido' }, { status: 400 });
    }

    const col = db.collection('ainews');

    // As assinaturas do que já está publicado nos últimos 60 dias. Uma leitura
    // só, com projeção mínima — o acervo inteiro tem menos de 100 matérias.
    const recentes = await col
      .find(
        { publishedAt: { $gte: new Date(Date.now() - 60 * 24 * 3600 * 1000) } },
        { projection: { title: 1, slug: 1 } },
      )
      .toArray();
    const jaPublicadas = recentes.map((d) => ({
      slug: String(d.slug ?? ''),
      title: String(d.title ?? ''),
      assinatura: assinaturaDoTitulo(String(d.title ?? '')),
    }));

    const publicados: string[] = [];
    const pulados: { slug: string; title: string; igualA: string; semelhanca: number }[] = [];

    for (const item of clean) {
      const assinatura = assinaturaDoTitulo(item.title);
      // Reeditar a MESMA matéria (mesmo slug) continua permitido — é correção,
      // não duplicata. A guarda só olha para o que tem slug diferente.
      let parecida: { slug: string; title: string; grau: number } | null = null;
      for (const antiga of jaPublicadas) {
        if (antiga.slug === item.slug) continue;
        const grau = pareceAMesma(assinatura, antiga.assinatura);
        if (grau >= LIMITE_DE_SEMELHANCA && (!parecida || grau > parecida.grau)) {
          parecida = { slug: antiga.slug, title: antiga.title, grau };
        }
      }
      if (parecida) {
        pulados.push({
          slug: item.slug,
          title: item.title,
          igualA: parecida.slug,
          semelhanca: Number(parecida.grau.toFixed(2)),
        });
        continue;
      }

      // Dedup por URL: o LLM pode gerar slugs diferentes para a mesma matéria
      const filter = item.url ? { $or: [{ slug: item.slug }, { url: item.url }] } : { slug: item.slug };
      await col.updateOne(filter, { $set: item }, { upsert: true });
      publicados.push(item.slug);
      jaPublicadas.push({ slug: item.slug, title: item.title, assinatura });
    }

    // Higiene: o hub guarda um trimestre de histórico
    await col.deleteMany({ publishedAt: { $lt: new Date(Date.now() - 90 * 24 * 3600 * 1000) } });

    if (pulados.length) console.warn('[AINEWS-PUBLISH] repetidas puladas:', JSON.stringify(pulados));

    return NextResponse.json({
      published: publicados.length,
      slugs: publicados,
      ...(pulados.length ? { pulados } : {}),
    });
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
