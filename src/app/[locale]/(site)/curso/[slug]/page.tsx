import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseSalesPage from "./CourseSalesPage";
import { allCourses } from "@/data/courses";
import { getProductBySlug, getTodosSlugsDeCurso, paraIdioma, paraObjetoSimples } from "@/lib/products";
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

/**
 * ⚠️ `dynamicParams = false` — é o que faz `/curso/nao-existe` responder 404.
 *
 * Medido em 10/09/2026, no build de produção servido por `next start`, com
 * User-Agent de navegador (sem `-A` o proxy devolve 403 e a medição mente):
 * `/pt-BR/curso/nao-existe` respondia **HTTP 200** servindo a página de 404,
 * com `x-nextjs-cache: HIT` e `x-nextjs-prerender: 1` no cabeçalho.
 *
 * A causa está nesses dois cabeçalhos: com `dynamicParams` ligado (o padrão), o
 * Next renderiza a resposta do `notFound()` sob demanda, guarda no cache de
 * prerender — esta rota tem `revalidate = 900` logo acima — e passa a servi-la
 * como página válida. O `notFound()` dispara e o corpo está certo; o que se
 * perde é o STATUS. Isso é soft 404, e num site cujo problema medido é
 * indexação (442 URLs para 358 impressões, 8% indexado) é orçamento de rastreio
 * gasto em URL fantasma que o Google aprende que existe.
 *
 * ⛔ Não tente consertar criando `app/not-found.tsx` na raiz (testado em 10/09,
 * NÃO resolve) nem `app/layout.tsx` (já existiu e derrubou a renderização
 * estática do site inteiro — o aviso está em `[locale]/layout.tsx`).
 */
export const dynamicParams = false;

/**
 * Os slugs vêm do BANCO, não da lista estática — e as duas proteções abaixo
 * existem porque `dynamicParams = false` transforma "slug ausente daqui" em
 * 404 de verdade.
 *
 * 1. **Nem a lista estática, nem `getAllProducts`.** `@/data/courses` ficou defasada
 *    das fusões e arquivamentos de 19/07: anunciava curso arquivado e omitia
 *    curso ativo. Com `dynamicParams` desligado, cada curso ativo que faltasse
 *    nela viraria 404 — desindexando página que vende. E `getAllProducts`
 *    também não serve: ele filtra `status: 'active'`, e o primeiro build
 *    desta mudança fez `/curso/ganhar-dinheiro-com-ia`, que está `draft`,
 *    responder 404. Por isso `getTodosSlugsDeCurso`, que não filtra nada.
 *
 * 2. **União, nunca substituição.** O resultado é a união do banco com a lista
 *    estática: um curso que exista só num dos dois lados continua tendo página.
 *
 * 3. **Se o banco falhar, o build FALHA.** Antes disto, uma queda do Mongo
 *    durante o build geraria o site inteiro sem os cursos do banco e, com
 *    `dynamicParams = false`, publicaria 404 em massa — que é exatamente o
 *    desastre que o `notFound()` desta página foi escrito para evitar (ver o
 *    comentário dele mais abaixo). Falhar o build é barulhento e reversível;
 *    desindexar 26 páginas de venda não é.
 *
 * ⚠️ O custo consciente: curso criado no banco só ganha página no próximo
 * build. Para publicar um curso novo, rode o deploy.
 */
export async function generateStaticParams() {
  const doBanco = await getTodosSlugsDeCurso().catch(() => null);

  if (doBanco === null) {
    throw new Error(
      "generateStaticParams de /curso/[slug]: o banco não respondeu. " +
        "Build abortado de propósito — seguir com a lista estática publicaria " +
        "404 para todo curso ativo que não estivesse nela.",
    );
  }

  const slugs = new Set<string>([...doBanco, ...allCourses.map((c) => c.slug)]);

  return Array.from(slugs).map((slug) => ({ slug }));
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
      {/* `paraObjetoSimples` na fronteira: o documento do Mongo traz `_id`
          como ObjectId e as datas como `Date`, e nenhum dos dois é objeto
          simples. Sem isto, a página de venda cuspia o aviso "Only plain
          objects can be passed to Client Components" a cada carregamento
          (26/08/2026). Aqui NÃO se usa `paraVitrine`: esta página precisa do
          currículo, dos bônus e do FAQ, e o custo é de um curso só. */}
      <CourseSalesPage initialProduct={paraObjetoSimples(product)} />
    </>
  );
}
