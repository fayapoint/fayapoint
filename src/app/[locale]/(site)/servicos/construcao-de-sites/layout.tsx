import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Construção de Sites - FayaPoint AI Academy",
    description: "Criamos sites modernos, responsivos e otimizados para SEO com as melhores tecnologias.",
  },
  en: {
    title: "Website Development - FayaPoint AI Academy",
    description: "We build modern, responsive, SEO-optimized websites using the best technologies.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos/construcao-de-sites",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
