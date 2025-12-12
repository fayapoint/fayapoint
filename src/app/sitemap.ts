import type { MetadataRoute } from "next";
import { allCourses } from "@/data/courses";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

const LOCALES = ["pt-BR", "en"] as const;

function url(path: string) {
  return `${SITE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
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
    "/blog",
    "/faq",
    "/contato",
    "/agendar-consultoria",
    "/precos",
    "/sobre",
  ];

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

    for (const course of allCourses) {
      entries.push({
        url: url(`/${locale}/curso/${course.slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
