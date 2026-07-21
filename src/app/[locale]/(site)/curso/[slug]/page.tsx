import type { Metadata } from "next";
import CourseSalesPage from "./CourseSalesPage";
import { allCourses } from "@/data/courses";
import { getProductBySlug } from "@/lib/products";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return allCourses.map((course) => ({
    slug: course.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  // O banco é a fonte da verdade — e `seo.metaTitle` deixa o título de busca
  // editável sem deploy. Antes isto lia só a lista estática @/data/courses:
  // curso ausente dela caía no genérico "Curso - FayAi AI Academy", que era o
  // caso de rag-knowledge, ia-producao e aprenda-a-usar-ia-no-dia-a-dia — três
  // páginas jogando fora o maior sinal de relevância que existe (21/07).
  const product = await getProductBySlug(slug).catch(() => null);
  const course = allCourses.find((c) => c.slug === slug);

  const title =
    product?.seo?.metaTitle?.trim() ||
    (product?.name ? `${product.name} | FayAI` : null) ||
    (course?.title ? `${course.title} | FayAI` : null) ||
    "Cursos de IA | FayAI";

  const description =
    product?.seo?.metaDescription?.trim() ||
    product?.copy?.shortDescription ||
    course?.shortDescription ||
    "Aprenda IA com cursos práticos e atualizados.";

  return generatePageMetadata({
    locale,
    path: `/curso/${slug}`,
    title,
    description,
  });
}

export default function Page() {
  return <CourseSalesPage />;
}
