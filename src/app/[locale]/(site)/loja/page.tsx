import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";
import { getProdutosDaLoja } from "@/lib/loja";
import LojaCatalogo from "./LojaCatalogo";

/**
 * A vitrine pública da loja é montada no SERVIDOR, como a de cursos: os cards
 * saem no HTML para o rastreador, e o filtro por categoria é estado de cliente
 * (ler `searchParams` desligaria o ISR — ver o cabeçalho de /noticias).
 *
 * `catch(() => [])`: banco fora do ar mostra a vitrine vazia em vez de
 * derrubar a página — o estado vazio é desenhado para isso.
 */
export const revalidate = 900;

const META = {
  "pt-BR": {
    title: "Loja FayAI — equipamentos e produtos para IA",
    description:
      "Produtos selecionados pela FayAI: equipamentos, periféricos e itens exclusivos. Preços em reais e compra direta no site.",
  },
  en: {
    title: "FayAI Store — gear and products for AI",
    description:
      "Products curated by FayAI: hardware, peripherals and exclusive items. Prices in BRL, purchased directly on the site.",
  },
} as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = META[locale as keyof typeof META] ?? META["pt-BR"];
  return generatePageMetadata({
    locale,
    path: "/loja",
    title: config.title,
    description: config.description,
  });
}

export default async function Page() {
  const produtos = await getProdutosDaLoja().catch(() => []);
  return <LojaCatalogo produtos={produtos} />;
}
