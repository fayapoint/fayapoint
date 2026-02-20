import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const servicesMeta = {
  "pt-BR": {
    title: "Serviços - FayAi AI Academy",
    description: "Conheça nossos serviços de consultoria em IA, automação, desenvolvimento web e mais.",
  },
  en: {
    title: "Services - FayAi AI Academy",
    description: "Discover our AI consulting, automation, web development services and more.",
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
