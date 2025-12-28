import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = pageMetadataConfig.contato[locale as "pt-BR" | "en"] ?? pageMetadataConfig.contato["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/contato",
    title: config.title,
    description: config.description,
  });
}

export default function ContatoLayout({ children }: Props) {
  return children;
}
