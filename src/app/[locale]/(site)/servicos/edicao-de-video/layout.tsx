import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Edição de Vídeo Profissional com IA | FayAi",
    description: "Serviços de edição de vídeo com IA para YouTube, Instagram, TikTok e corporativo. Cortes inteligentes, legendas automáticas, color grading e motion graphics. Entrega rápida.",
  },
  en: {
    title: "Professional AI Video Editing | FayAi",
    description: "AI-powered video editing for YouTube, Instagram, TikTok and corporate content. Smart cuts, automatic captions, color grading and motion graphics. Fast turnaround.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos/edicao-de-video",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
