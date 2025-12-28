import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Automação e Integração de Sistemas | FayaPoint",
    description: "Automatize processos empresariais e integre sistemas com n8n, Make, Zapier e APIs personalizadas. Reduza trabalho manual, elimine erros e aumente produtividade com workflows inteligentes.",
  },
  en: {
    title: "Business Automation & System Integration | FayaPoint",
    description: "Automate business processes and integrate systems with n8n, Make, Zapier and custom APIs. Reduce manual work, eliminate errors and boost productivity with intelligent workflows.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos/automacao-e-integracao",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
