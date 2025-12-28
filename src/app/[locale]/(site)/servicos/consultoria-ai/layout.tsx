import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Consultoria em IA - FayaPoint AI Academy",
    description: "Consultoria especializada em Inteligência Artificial para transformar seu negócio.",
  },
  en: {
    title: "AI Consulting - FayaPoint AI Academy",
    description: "Specialized Artificial Intelligence consulting to transform your business.",
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
