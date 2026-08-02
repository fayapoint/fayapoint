import type { MetadataRoute } from "next";
import { allCourses } from "@/data/courses";
import { getAllProducts } from "@/lib/products";
import { getAllNews } from "@/lib/ai-news";
import { toolsData } from "@/data/tools-complete";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.com.br";

/**
 * Só pt-BR entra no sitemap.
 *
 * A árvore `/en/` existe como rota, mas serve o MESMO texto em português —
 * verificado em 27/07/2026. Anunciar 64 cópias ao Google num domínio novo
 * gastava metade do orçamento de rastreamento com duplicata e ainda dava a
 * ele a chance de escolher a versão errada como canônica. O `site:` mostrava
 * exatamente isso: páginas indexadas em `/cursos` e `/blog` com título antigo
 * em inglês, e o aviso de resultados "bastante semelhantes" omitidos.
 *
 * Quando existir tradução de verdade, `en` volta para cá — junto com ela.
 */
const LOCALES = ["pt-BR"] as const;

// O sitemap consulta o banco (cursos ativos + artigos do blog), então precisa
// ser revalidado — antes era uma função síncrona congelada no build, e cada
// artigo novo do IA Hoje (1-3 por dia) ficava invisível para o Google até o
// próximo deploy.
export const revalidate = 3600;

function url(path: string) {
  return `${SITE_URL}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths = [
    "",
    "/o-que-fazemos",
    "/servicos/construcao-de-sites",
    "/servicos/seo-local",
    "/servicos/automacao-e-integracao",
    "/servicos/consultoria-ai",
    "/servicos/edicao-de-video",
    "/cursos",
    // hub real das matérias — "/blog" responde 307 para cá (URL que redireciona
    // não deve figurar em sitemap)
    "/noticias",
    // Radar: dado medido que ninguém mais publica de graça. Sem esta linha a
    // única porta de entrada é o link da home — e foi exatamente a descoberta
    // interna cortada que deixou as matérias invisíveis até 21/07.
    "/radar",
    // Arcade: joga sem cadastro, é o degrau de menor compromisso do funil.
    "/arcade",
    "/faq",
    "/contato",
    "/agendar-consultoria",
    "/precos",
    "/sobre",
    // Hub dos cinco serviços. Existia no menu da home e no sitemap-de-intenção
    // (tinha layout com canônica), mas não tinha `page.tsx` — respondia 404 até
    // 29/07/2026. Ver `src/app/[locale]/(site)/servicos/page.tsx`.
    "/servicos",
  ];

  /**
   * Páginas públicas que existiam há meses e nunca foram anunciadas.
   *
   * Em 29/07/2026 o Search Console reportava 89 URLs em "Detectada, mas não
   * indexada" — descobertas pelo link interno, jamais rastreadas. O sitemap
   * declarava 67 URLs e o Google conhecia 169. A diferença é esta lista mais
   * as 56 páginas de ferramenta abaixo: conteúdo real, medido em produção
   * (`/ferramentas` 14.772 caracteres, `/descobrir` 8.180, `/recursos/glossario`
   * 5.513, `/chatgpt-allowlisting` 5.365, `/casos` 4.980), competindo por
   * nada porque ninguém contou ao Google que existiam.
   *
   * Ficaram DE FORA de propósito, por servirem `noindex` desde 29/07:
   * `/status` (estado transitório), `/waiting-list` (confirmação pós-cadastro)
   * e `/certificacoes` (placeholder "em breve"). Sitemap que anuncia página
   * noindex é instrução contraditória, e o Google reclama dela.
   */
  const secondaryPaths = [
    "/descobrir",
    "/casos",
    "/chatgpt-allowlisting",
    "/aula-gratis",
    "/ferramentas",
    "/projetos",
    "/recursos",
    "/recursos/glossario",
    "/recursos/guias",
    "/recursos/templates",
    "/recursos/calculadora-roi",
    "/cursos/por-ferramenta",
    "/cursos/por-setor",
    "/api-docs",
    "/comunidade",
    "/instrutores",
    "/afiliados",
    "/parcerias",
    "/carreiras",
    "/ajuda",
    "/contato/vendas",
    // Legais: entram com prioridade baixa. Não disputam busca, mas o Google
    // usa a existência delas como sinal de que o site é um negócio de verdade.
    "/termos",
    "/privacidade",
    "/exclusao-de-dados",
  ];

  /**
   * `toolsData`, e não o `toolsMap` da página.
   *
   * A página soma a `toolsData` alguns apelidos legados (`dalle` para
   * `dall-e`, por exemplo) para não quebrar link antigo. Eles respondem 200 e
   * servem exatamente a mesma ficha — anunciá-los seria entregar ao Google um
   * par de duplicatas por ferramenta, que é o problema que estamos fechando,
   * não abrindo. O sitemap declara só o slug canônico.
   */
  const toolSlugs = Object.keys(toolsData);

  // Cursos: o banco é a fonte da verdade. A lista estática @/data/courses
  // ficou defasada das fusões/arquivamentos de 19/07 — anunciava curso
  // arquivado e omitia curso ativo. Só cai nela se o banco falhar, para o
  // sitemap nunca quebrar o build.
  const [products, articles] = await Promise.all([
    getAllProducts({ type: "course", limit: 200 }).catch(() => []),
    getAllNews(500).catch(() => []),
  ]);

  const courseSlugs = products.length
    ? products.map((p) => p.slug)
    : allCourses.map((c) => c.slug);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const p of staticPaths) {
      entries.push({
        url: url(`/${locale}${p}`),
        lastModified: now,
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }

    for (const p of secondaryPaths) {
      entries.push({
        url: url(`/${locale}${p}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: p.startsWith("/termos") || p.startsWith("/privacidade") || p.startsWith("/exclusao") ? 0.3 : 0.5,
      });
    }

    for (const slug of toolSlugs) {
      entries.push({
        url: url(`/${locale}/ferramentas/${slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const slug of courseSlugs) {
      entries.push({
        url: url(`/${locale}/curso/${slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });

      // A prévia carrega o conteúdo REAL do curso — ementa dos 30 capítulos e
      // um capítulo inteiro. É a única URL do curso com texto de profundidade,
      // então ela vale mais como sinal de busca que a própria página de vendas,
      // que é copy comercial. Prioridade acima de propósito.
      entries.push({
        url: url(`/${locale}/curso/${slug}/previa`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const article of articles) {
      if (!article.slug) continue;
      const published = article.date ? new Date(article.date) : now;
      entries.push({
        // /noticias/<slug> é a URL canônica e a que o hub linka internamente;
        // /blog/<slug> é rota legada que renderiza a listagem genérica.
        url: url(`/${locale}/noticias/${article.slug}`),
        lastModified: Number.isNaN(published.valueOf()) ? now : published,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
