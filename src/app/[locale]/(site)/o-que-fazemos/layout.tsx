import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "O Que Fazemos - FayaPoint AI Academy",
    description: "Descubra como ajudamos empresas e profissionais a dominar a Inteligência Artificial.",
  },
  en: {
    title: "What We Do - FayaPoint AI Academy",
    description: "Discover how we help businesses and professionals master Artificial Intelligence.",
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
