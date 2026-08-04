import type { Metadata } from "next";
import { NovaLanding } from "@/components/landing/NovaLanding";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { getAiNews } from "@/lib/ai-news";
import { getAllProducts } from "@/lib/products";
import { generatePageMetadata } from "@/lib/metadata";
import { ORDEM_POR_VARIACAO_DE_CAPA } from "@/data/ordem-variacao-capas";

// Home oficial (12/07/2026): a experiência de imersão gamificada substituiu o
// gate de hype e o cubo 3D. O gate segue existindo apenas como código
// (components/gate) e o cubo continua acessível como componente — nada foi
// apagado, a home apenas deixou de usá-los.

// Revalida a cada 30 min — a seção IA HOJE pega as notícias novas do agente
export const revalidate = 1800;

// A canônica da home mora aqui desde 28/07/2026. Ela vinha do layout, e de lá
// descia para TODA página filha — que passava a se declarar home. Título e
// descrição continuam vindo do layout; só o `alternates` é próprio.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { alternates } = generatePageMetadata({ locale, path: "" });
  return { alternates };
}

export default async function Home() {
  const [{ items }, courses] = await Promise.all([
    getAiNews(3),
    getAllProducts({ type: "course" }),
  ]);

  // O trilho da home: os 6 destaques na frente, e depois o resto do catálogo
  // ativo na ordem de maior variação visual entre as capas.
  //
  // Antes ele tinha só os 6 `featured`. Com 22 cursos ativos, dava a volta cedo
  // demais e o mesmo livro reaparecia três vezes antes de a rolagem acabar — um
  // catálogo grande se anunciando como pequeno. Os destaques continuam intocados
  // na frente porque são os cursos reescritos do zero, que é o que a seção
  // promete; o critério da ordem do resto está em `ordem-variacao-capas.ts`.
  const ativos = courses.filter((c) => c.status !== "draft");
  const destaques = ativos
    .filter((course) => course.featured)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

  const porSlug = new Map(ativos.map((c) => [c.slug, c]));
  const jaEntrou = new Set(destaques.map((c) => c.slug));
  const complemento = ORDEM_POR_VARIACAO_DE_CAPA.map((s) => porSlug.get(s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c) && !jaEntrou.has(c!.slug),
  );

  const featuredCourses = [...destaques, ...complemento].map((course) => ({
    revisado: jaEntrou.has(course.slug),
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
    thumbnail: course.thumbnail,
  }));

  return (
    <>
      <NovaLanding news={items} featuredCourses={featuredCourses} />
      <WhatsAppButton />
    </>
  );
}
