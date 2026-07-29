import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const servicesMeta = {
  "pt-BR": {
    title: "Serviços de IA, automação e sites | FayAI",
    description:
      "Consultoria em Inteligência Artificial, automação de processos com n8n e Make, construção de sites, SEO local e edição de vídeo com IA. Cinco frentes, uma agenda de diagnóstico.",
  },
  en: {
    title: "AI, automation and web services | FayAI",
    description:
      "Artificial Intelligence consulting, process automation with n8n and Make, website development, local SEO and AI video editing. Five services, one diagnostic call.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = servicesMeta[locale as "pt-BR" | "en"] ?? servicesMeta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos",
    title: config.title,
    description: config.description,
  });
}

export default function ServicosLayout({ children }: Props) {
  return children;
}
