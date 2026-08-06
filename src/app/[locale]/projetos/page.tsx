import type { Metadata } from "next";
import { ProjetosPage } from "@/components/landing/ProjetosPage";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/projetos"][locale === "en" ? "en" : "pt-BR"];
  return generatePageMetadata({
    locale,
    path: "/projetos",
    title: copy.title,
    description: copy.description,
  });
}

export default function Projetos() {
  return <ProjetosPage />;
}
