import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Edição de Vídeo - FayaPoint AI Academy",
    description: "Serviços profissionais de edição de vídeo com IA para conteúdo de alta qualidade.",
  },
  en: {
    title: "Video Editing - FayaPoint AI Academy",
    description: "Professional AI-powered video editing services for high-quality content.",
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
