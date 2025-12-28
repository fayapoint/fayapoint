import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = pageMetadataConfig.precos[locale as "pt-BR" | "en"] ?? pageMetadataConfig.precos["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/precos",
    title: config.title,
    description: config.description,
  });
}

export default function PrecosLayout({ children }: Props) {
  return children;
}
