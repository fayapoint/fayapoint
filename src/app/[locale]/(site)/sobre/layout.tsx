import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = pageMetadataConfig.sobre[locale as "pt-BR" | "en"] ?? pageMetadataConfig.sobre["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/sobre",
    title: config.title,
    description: config.description,
  });
}

export default function SobreLayout({ children }: Props) {
  return children;
}
