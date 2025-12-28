import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Consultoria em Inteligência Artificial | FayaPoint",
    description: "Consultoria especializada em IA para transformar seu negócio. Implementação de ChatGPT, automação com IA, análise de dados e treinamento de equipes. ROI comprovado em 90 dias.",
  },
  en: {
    title: "Artificial Intelligence Consulting | FayaPoint",
    description: "Specialized AI consulting to transform your business. ChatGPT implementation, AI automation, data analysis and team training. Proven ROI within 90 days.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos/consultoria-ai",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
