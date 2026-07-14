import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getMonthlyCourseOfferSetAsync } from "@/lib/monthly-course-offers";

export async function GET() {
  try {
    // Uses MongoDB override if available, falls back to deterministic algorithm
    const offerSet = await getMonthlyCourseOfferSetAsync();
    const products = await getAllProducts({ type: "course", limit: 100, sortBy: "students" });
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
