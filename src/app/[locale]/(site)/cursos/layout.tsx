import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = pageMetadataConfig.cursos[locale as "pt-BR" | "en"] ?? pageMetadataConfig.cursos["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/cursos",
    title: config.title,
    description: config.description,
  });
}

export default function CursosLayout({ children }: Props) {
  return children;
}
