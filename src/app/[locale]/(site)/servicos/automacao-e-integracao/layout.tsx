import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Automação e Integração - FayaPoint AI Academy",
    description: "Automatize processos e integre sistemas com n8n, Make, Zapier e APIs personalizadas.",
  },
  en: {
    title: "Automation & Integration - FayaPoint AI Academy",
    description: "Automate processes and integrate systems with n8n, Make, Zapier and custom APIs.",
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
