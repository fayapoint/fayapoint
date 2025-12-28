import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = pageMetadataConfig.faq[locale as "pt-BR" | "en"] ?? pageMetadataConfig.faq["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/faq",
    title: config.title,
    description: config.description,
  });
}

export default function FaqLayout({ children }: Props) {
  return children;
}
