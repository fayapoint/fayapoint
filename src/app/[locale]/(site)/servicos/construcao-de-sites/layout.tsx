import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "Construção de Sites e Aplicativos Web | FayaPoint",
    description: "Desenvolvemos sites modernos, responsivos e otimizados para SEO com Next.js, React e as melhores tecnologias. Landing pages, e-commerce, sistemas web e aplicativos sob medida.",
  },
  en: {
    title: "Website & Web App Development | FayaPoint",
    description: "We build modern, responsive, SEO-optimized websites with Next.js, React and cutting-edge technologies. Landing pages, e-commerce, web systems and custom applications.",
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
