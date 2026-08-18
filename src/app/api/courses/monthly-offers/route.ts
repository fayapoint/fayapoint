/**
 * A oferta do mês — o curso grátis e as três piscinas por nível.
 *
 * GET /api/courses/monthly-offers
 * Query params:
 *   - locale: `en` serve os cursos traduzidos; qualquer outra coisa, português
 *
 * ## O idioma
 *
 * Até 18/08/2026 esta rota respondia sempre em português, para qualquer
 * visitante. Ela alimenta seis telas — a faixa da home, o herói, a `/precos`, o
 * catálogo de `/cursos`, o painel do aluno e a biblioteca —, e em todas o
 * mesmo roteiro: o servidor renderiza em inglês e, quando o `useEffect`
 * responde, o card da oferta vira português na frente do leitor.
 *
 * O idioma vem da query, pela mesma razão de `/api/products` (ver o cabeçalho
 * de lá): a URL é a chave de cache, e idioma fora dela contamina a resposta
 * compartilhada. Aqui a rota nem é cacheada na borda — `/api/*` é `no-store` —,
 * mas o cache do NAVEGADOR também é chaveado por URL, e quatro dos seis
 * chamadores pedem sem `no-store`. Uma regra só para as duas rotas é mais fácil
 * de acertar do que duas regras parecidas.
 *
 * ⚠️ O `getAllProducts` já tem o idioma na chave do cache dele
 * (`products:...:en`), então pedir nos dois idiomas não embaralha nada.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getMonthlyCourseOfferSetAsync } from "@/lib/monthly-course-offers";
import { localeDaBusca } from "@/lib/idioma";

export async function GET(request: NextRequest) {
  try {
    const locale = localeDaBusca(request.nextUrl.searchParams);

    // Uses MongoDB override if available, falls back to deterministic algorithm
    const offerSet = await getMonthlyCourseOfferSetAsync();
    const products = await getAllProducts({
      type: "course",
      limit: 100,
      sortBy: "students",
      locale,
    });
    const bySlug = new Map(products.map((product) => [product.slug, product]));

    // Só produtos ATIVOS podem ser o curso grátis do mês — o fallback estático
    // não tem `metrics` e quebrava a vitrine quando o slug sorteado estava
    // arquivado (visto em 14/07/2026 com perplexity-pesquisa-inteligente).
    const freeCourse = offerSet.freeCourseSlug
      ? bySlug.get(offerSet.freeCourseSlug) || null
      : null;

    return NextResponse.json({
      monthKey: offerSet.monthKey,
      startsAt: offerSet.startsAt,
      endsAt: offerSet.endsAt,
      freeCourse,
      pools: {
        beginner: offerSet.pools.beginner.map((slug) => bySlug.get(slug)).filter(Boolean),
        intermediate: offerSet.pools.intermediate.map((slug) => bySlug.get(slug)).filter(Boolean),
        advanced: offerSet.pools.advanced.map((slug) => bySlug.get(slug)).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Monthly offers error:", error);
    return NextResponse.json({ error: "Erro ao carregar ofertas mensais" }, { status: 500 });
  }
}
