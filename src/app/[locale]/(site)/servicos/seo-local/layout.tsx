import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "SEO Local - FayaPoint AI Academy",
    description: "Otimização para buscas locais. Aumente sua visibilidade no Google Maps e resultados regionais.",
  },
  en: {
    title: "Local SEO - FayaPoint AI Academy",
    description: "Local search optimization. Increase your visibility on Google Maps and regional results.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos/seo-local",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
