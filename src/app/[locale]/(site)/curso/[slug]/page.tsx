import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseSalesPage from "./CourseSalesPage";
import { allCourses } from "@/data/courses";
import { getProductBySlug, paraIdioma } from "@/lib/products";
import { generatePageMetadata } from "@/lib/metadata";
import { schemaCurso, schemaTrilha } from "@/lib/structured-data";
import { ogDaCapa } from "@/lib/capa-og";
import { AvisoTraducao } from "@/components/courses/AvisoTraducao";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Agora que o curso vem embutido no HTML, ele também congela no HTML: sem esta
// linha a página é gerada uma vez no build e um preço alterado no banco só
// apareceria no deploy seguinte. 900s é o mesmo intervalo já usado nas matérias.
export const revalidate = 900;

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
  const bruto = await getProductBySlug(slug).catch(() => null);
  const product = bruto ? paraIdioma(bruto, locale) : null;
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
    // A capa do curso vira o cartão de compartilhamento. Antes daqui, os 27
    // cursos apontavam para `/images/courses/<slug>-og.jpg`, um caminho sem
    // nenhum arquivo por trás — todo link colado no WhatsApp mostrava o OG
    // genérico do site.
    image: ogDaCapa(product?.thumbnail),
  });
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;

  // O JSON-LD sai do SERVIDOR: a página de vendas é client component, e dado
  // estruturado injetado depois da hidratação chega tarde para o rastreador.
  //
  // O `catch` aqui separa "o banco disse que não existe" de "o banco não
  // respondeu" de propósito. Se ele engolisse o erro num `null`, uma queda do
  // Mongo transformaria as 20 páginas de curso em 404 de uma vez — e 404 é o
  // que o Google usa para remover URL do índice. Banco fora do ar tem que
  // degradar para a busca no cliente, nunca para 404.
  let product = null;
  let bancoRespondeu = true;
  try {
    const bruto = await getProductBySlug(slug);
    // Nome, resumo, benefícios, módulos e FAQ no idioma da URL. `i18n` sai da
    // saída — a página de venda é Client Component e levaria as duas versões
    // do texto inteiro para o navegador.
    product = bruto ? paraIdioma(bruto, locale) : null;
  } catch {
    bancoRespondeu = false;
  }
  const course = allCourses.find((c) => c.slug === slug);

  // Sem isto, /curso/<qualquer-coisa> respondia 200 com a página de vendas
  // vazia e canonical apontando para si mesma: uma fábrica infinita de soft
  // 404 para o rastreador (verificado em produção 28/07/2026).
  if (bancoRespondeu && !product && !course) {
    notFound();
  }

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
      imagem: ogDaCapa(product?.thumbnail),
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
      <AvisoTraducao slug={slug} locale={locale} />
      <CourseSalesPage initialProduct={product} />
    </>
  );
}
