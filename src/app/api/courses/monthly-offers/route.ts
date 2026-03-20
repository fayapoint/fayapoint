import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getMonthlyOfferEntries } from "@/lib/monthly-course-offers";

export async function GET() {
  try {
    const monthlyOffers = getMonthlyOfferEntries();
    const products = await getAllProducts({ type: "course", limit: 100, sortBy: "students" });
    const bySlug = new Map(products.map((product) => [product.slug, product]));

    return NextResponse.json({
      monthKey: monthlyOffers.monthKey,
      startsAt: monthlyOffers.startsAt,
      endsAt: monthlyOffers.endsAt,
      freeCourse: monthlyOffers.freeCourseSlug ? bySlug.get(monthlyOffers.freeCourseSlug) || monthlyOffers.freeCourse : null,
      pools: {
        beginner: monthlyOffers.pools.beginner.map((slug) => bySlug.get(slug)).filter(Boolean),
        intermediate: monthlyOffers.pools.intermediate.map((slug) => bySlug.get(slug)).filter(Boolean),
        advanced: monthlyOffers.pools.advanced.map((slug) => bySlug.get(slug)).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Monthly offers error:", error);
    return NextResponse.json({ error: "Erro ao carregar ofertas mensais" }, { status: 500 });
  }
}
