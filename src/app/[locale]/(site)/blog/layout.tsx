import type { Metadata } from "next";
import { generatePageMetadata, pageMetadataConfig } from "@/lib/metadata";

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

export default function BlogLayout({ children }: Props) {
  return children;
}
