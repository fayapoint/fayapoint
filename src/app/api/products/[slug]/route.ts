/**
 * Individual Product API Route
 *
 * GET /api/products/[slug] - Get a single product by slug
 * Query params:
 *   - locale: `en` serve o produto traduzido; qualquer outra coisa, português
 *
 * ## Por que o idioma vem da query
 *
 * Ver o cabeçalho de `../route.ts`: esta rota também é cacheada na borda por
 * 10 minutos, e cache de CDN é chaveado pela URL. Idioma fora da URL faria a
 * primeira leitura inglesa servir inglês a todos os leitores portugueses dos
 * dez minutos seguintes.
 *
 * ⚠️ `getProductBySlug` guarda no cache o documento CRU, com o subdocumento
 * `i18n` dentro — e é assim que tem de ser: um cache por idioma dobraria as
 * entradas. Quem resolve o idioma é `paraIdioma`, aqui na saída, que também
 * apaga o `i18n`. Sem isso a resposta viajaria com o produto nas duas línguas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug, getRelatedProducts, paraIdioma, paraIdiomaLista } from '@/lib/products';
import { localeDaBusca } from '@/lib/idioma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const locale = localeDaBusca(request.nextUrl.searchParams);

    const product = await getProductBySlug(slug);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get related products
    const related = await getRelatedProducts(slug, 3);

    return NextResponse.json({
      product: paraIdioma(product, locale),
      related: paraIdiomaLista(related, locale),
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
