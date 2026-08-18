import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";
import fatia from "../../../../../messages/rotas/blog.json";
import { ProvedorDeRota } from "@/i18n/rota";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = pageMetadataConfig.blog[locale as "pt-BR" | "en"] ?? pageMetadataConfig.blog["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/blog",
    title: config.title,
    description: config.description,
  });
}

export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ProvedorDeRota locale={locale} fatia={fatia}>
      {children}
    </ProvedorDeRota>
  );
}
