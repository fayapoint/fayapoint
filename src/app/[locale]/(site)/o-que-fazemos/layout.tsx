import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "O Que Fazemos - Serviços de IA | FayaPoint",
    description: "Desenvolvimento web, automação com IA, consultoria e produção de conteúdo. Ajudamos empresas e profissionais a dominar Inteligência Artificial com soluções sob medida.",
  },
  en: {
    title: "What We Do - AI Services | FayaPoint",
    description: "Web development, AI automation, consulting and content production. We help businesses and professionals master Artificial Intelligence with custom solutions.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/o-que-fazemos",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
