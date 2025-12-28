import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  const config = {
    "pt-BR": {
      title: "Ferramentas de IA - Diretório Completo | FayaPoint",
      description: "Descubra e compare as melhores ferramentas de Inteligência Artificial. ChatGPT, Midjourney, Claude, Gemini e mais de 100 ferramentas analisadas.",
    },
    en: {
      title: "AI Tools Directory - Complete Guide | FayaPoint",
      description: "Discover and compare the best Artificial Intelligence tools. ChatGPT, Midjourney, Claude, Gemini and 100+ tools analyzed.",
    },
  };

  const meta = config[locale as "pt-BR" | "en"] ?? config["pt-BR"];

  return generatePageMetadata({
    locale,
    path: "/ferramentas",
    title: meta.title,
    description: meta.description,
  });
}

export default function FerramentasLayout({ children }: Props) {
  return children;
}
