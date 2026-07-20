import { NovaLanding } from "@/components/landing/NovaLanding";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { getAiNews } from "@/lib/ai-news";
import { getAllProducts } from "@/lib/products";

// Home oficial (12/07/2026): a experiência de imersão gamificada substituiu o
// gate de hype e o cubo 3D. O gate segue existindo apenas como código
// (components/gate) e o cubo continua acessível como componente — nada foi
// apagado, a home apenas deixou de usá-los.

// Revalida a cada 30 min — a seção IA HOJE pega as notícias novas do agente
export const revalidate = 1800;

export default async function Home() {
  const [{ items }, courses] = await Promise.all([
    getAiNews(3),
    getAllProducts({ type: "course" }),
  ]);

  const featuredCourses = courses
    .filter((course) => course.featured)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
    .map((course) => ({
      slug: course.slug,
      tool: course.tool,
      name: course.name,
      shortDescription: course.copy.shortDescription,
      level: course.level,
      duration: course.metrics.duration,
      lessons: course.metrics.lessons,
      price: course.pricing.price,
      originalPrice: course.pricing.originalPrice,
      discount: course.pricing.discount,
      priceNote: course.pricing.note,
    }));

  return (
    <>
      <NovaLanding news={items} featuredCourses={featuredCourses} />
      <WhatsAppButton />
    </>
  );
}
