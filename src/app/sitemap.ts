import type { MetadataRoute } from "next";
import { allCourses } from "@/data/courses";
import { getAllProducts } from "@/lib/products";
import { getAllNews } from "@/lib/ai-news";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.com.br";

const LOCALES = ["pt-BR", "en"] as const;

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
    "/faq",
    "/contato",
    "/agendar-consultoria",
    "/precos",
    "/sobre",
  ];

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

    for (const slug of courseSlugs) {
      entries.push({
        url: url(`/${locale}/curso/${slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
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
