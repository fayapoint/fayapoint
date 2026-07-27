import type { Metadata } from "next";
import CourseSalesPage from "./CourseSalesPage";
import { allCourses } from "@/data/courses";
import { getProductBySlug } from "@/lib/products";
import { generatePageMetadata } from "@/lib/metadata";
import { schemaCurso, schemaTrilha } from "@/lib/structured-data";

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

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;

  // O JSON-LD sai do SERVIDOR: a página de vendas é client component, e dado
  // estruturado injetado depois da hidratação chega tarde para o rastreador.
  const product = await getProductBySlug(slug).catch(() => null);
  const course = allCourses.find((c) => c.slug === slug);

  const nome = product?.name || course?.title || slug;
  const descricao =
    product?.seo?.metaDescription?.trim() ||
    product?.copy?.shortDescription ||
    course?.shortDescription ||
    "";

  const dados = [
    schemaCurso({
      slug,
      locale,
      nome,
      descricao,
      nivel: product?.level || course?.level,
      duracao: product?.metrics?.duration || course?.duration,
      aulas: product?.metrics?.lessons,
      preco: product?.pricing?.price,
      moeda: product?.pricing?.currency,
    }),
    schemaTrilha(locale, [
      { nome: "Início", caminho: "" },
      { nome: "Cursos", caminho: "/cursos" },
      { nome, caminho: `/curso/${slug}` },
    ]),
  ];

  return (
    <>
      {dados.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
      <CourseSalesPage />
    </>
  );
}
