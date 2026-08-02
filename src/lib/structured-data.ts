/**
 * Dados estruturados (JSON-LD).
 *
 * O site tinha schema nas cinco páginas de serviço e na organização, e
 * **nenhum** nos 20 cursos e nas 29 matérias — que são justamente as páginas
 * que competem por busca. Sem `Course`, um curso é texto qualquer para o
 * Google; com ele, entra na disputa por resultado rico.
 *
 * **Regra que não se quebra aqui: só entra o que é verdade.** Nada de
 * `aggregateRating` — as notas e contagens no banco vêm de dado de teste
 * (confirmado na auditoria de catálogo de 18/07), e estrela inventada em
 * resultado de busca é motivo de ação manual do Google, além de ser mentira
 * para quem lê. Quando houver avaliação real de aluno, ela entra.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://fayai.com.br";

const ORGANIZACAO = {
  "@type": "Organization",
  name: "FayAI",
  url: SITE_URL,
} as const;

/** Converte "6 horas" / "4h30" no formato ISO 8601 que o Google espera. */
function paraDuracaoISO(texto: string | undefined): string | undefined {
  if (!texto) return undefined;
  const horas = texto.match(/(\d+)\s*h/i);
  const minutos = texto.match(/(\d+)\s*(min|m\b)/i);
  if (!horas && !minutos) return undefined;
  return `PT${horas ? `${horas[1]}H` : ""}${minutos ? `${minutos[1]}M` : ""}`;
}

export interface DadosCurso {
  slug: string;
  locale: string;
  nome: string;
  descricao: string;
  nivel?: string;
  duracao?: string;
  aulas?: number;
  preco?: number;
  moeda?: string;
}

export function schemaCurso(c: DadosCurso) {
  const url = `${SITE_URL}/${c.locale}/curso/${c.slug}`;
  const carga = paraDuracaoISO(c.duracao);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.nome,
    description: c.descricao,
    url,
    provider: ORGANIZACAO,
    inLanguage: c.locale === "en" ? "en" : "pt-BR",
    ...(c.nivel && { educationalLevel: c.nivel }),
    // `hasCourseInstance` é obrigatório para o resultado rico de cursos.
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      // Sob demanda: sem data de início, o aluno começa quando compra.
      courseWorkload: carga ?? undefined,
      ...(c.aulas ? { name: `${c.nome} — ${c.aulas} aulas` } : {}),
    },
    ...(typeof c.preco === "number"
      ? {
          offers: {
            "@type": "Offer",
            price: c.preco,
            priceCurrency: c.moeda ?? "BRL",
            availability: "https://schema.org/InStock",
            url,
            category: "Paid",
          },
        }
      : {}),
  };
}

/**
 * Ementa do curso para a página de prévia.
 *
 * `syllabusSections` é o que permite ao Google entender que a URL descreve um
 * programa de estudo com N unidades, e não uma landing page a mais. Cada seção
 * carrega a descrição real do módulo — não um rótulo genérico.
 */
export function schemaEmenta(
  c: DadosCurso & { modulos: Array<{ numero: number; titulo: string; descricao: string; capitulos: number }> }
) {
  const url = `${SITE_URL}/${c.locale}/curso/${c.slug}/previa`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.nome,
    description: c.descricao,
    url,
    provider: ORGANIZACAO,
    inLanguage: c.locale === "en" ? "en" : "pt-BR",
    ...(c.nivel && { educationalLevel: c.nivel }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: paraDuracaoISO(c.duracao) ?? undefined,
    },
    syllabusSections: c.modulos.map((m) => ({
      "@type": "Syllabus",
      position: m.numero,
      name: m.titulo,
      description: m.descricao,
      timeRequired: undefined,
      ...(m.capitulos ? { about: `${m.capitulos} capítulos` } : {}),
    })),
  };
}

export interface DadosMateria {
  slug: string;
  locale: string;
  titulo: string;
  resumo?: string;
  publicadoEm?: string;
  imagem?: string;
}

export function schemaMateria(m: DadosMateria) {
  const url = `${SITE_URL}/${m.locale}/noticias/${m.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: m.titulo.slice(0, 110), // o Google trunca acima disso
    ...(m.resumo && { description: m.resumo }),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(m.publicadoEm && { datePublished: m.publicadoEm }),
    ...(m.imagem && { image: [m.imagem.startsWith("http") ? m.imagem : `${SITE_URL}${m.imagem}`] }),
    publisher: ORGANIZACAO,
    author: ORGANIZACAO,
    inLanguage: m.locale === "en" ? "en" : "pt-BR",
  };
}

/** Trilha de navegação — aparece no lugar da URL crua no resultado de busca. */
export function schemaTrilha(locale: string, itens: Array<{ nome: string; caminho: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nome,
      item: `${SITE_URL}/${locale}${it.caminho}`,
    })),
  };
}

/** O `<script>` pronto, para não repetir o boilerplate em cada página. */
export function jsonLd(dados: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(dados) },
  };
}
