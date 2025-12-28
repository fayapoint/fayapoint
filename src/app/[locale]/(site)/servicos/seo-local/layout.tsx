import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

const meta = {
  "pt-BR": {
    title: "SEO Local e Google Meu Negócio | FayaPoint",
    description: "Otimização para buscas locais e Google Meu Negócio. Aumente visibilidade no Google Maps, gere avaliações positivas e atraia clientes da sua região. Resultados em 30 dias.",
  },
  en: {
    title: "Local SEO & Google Business Profile | FayaPoint",
    description: "Local search optimization and Google Business Profile management. Boost Google Maps visibility, generate positive reviews and attract local customers. Results in 30 days.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = meta[locale as "pt-BR" | "en"] ?? meta["pt-BR"];
  
  return generatePageMetadata({
    locale,
    path: "/servicos/seo-local",
    title: config.title,
    description: config.description,
  });
}

export default function Layout({ children }: Props) {
  return children;
}
