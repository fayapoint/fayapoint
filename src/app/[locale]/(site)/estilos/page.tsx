import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";
import { AtlasEstilos } from "@/components/estilos/AtlasEstilos";
import { ESTILOS, FAMILIAS, MODELO_DOS_EXEMPLOS } from "@/lib/estilos";
import "@/components/estilos/atlas.css";

/**
 * O ATLAS DE ESTILOS — uma biblioteca aberta de estilos de imagem, cada um com
 * o prompt pronto e um exemplo gerado com esse mesmo prompt.
 *
 * Três decisões que valem mais que o desenho:
 *
 * 1. **O exemplo não mente.** A imagem de cada cartão saiu do prompt que o
 *    cartão entrega (`scripts/estilos/gerar.mjs` lê o mesmo JSON).
 * 2. **O contador é real.** Começa em zero e sobe quando alguém copia. Antes
 *    de haver cópias, a vitrine da frente é curadoria e diz que é.
 * 3. **Nenhum estilo interno.** Os estilos de produção da casa ficam em
 *    `autoresearch/estilos/`; aqui só entra o que é de uso geral.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://fayai.com.br";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const base = generatePageMetadata({
    locale,
    path: "/estilos",
    title: `Atlas de Estilos: ${ESTILOS.length} estilos de imagem com prompt pronto | FayAI`,
    description:
      "Ghibli, Pixar, cyberpunk, aquarela, film noir e mais: escolha o estilo, veja o exemplo real e copie o prompt pronto para o seu gerador de imagem.",
  });

  /* Só em português: nomes e descrições dos estilos não têm versão inglesa.
   * O sitemap acompanha por `SO_EM_PORTUGUES`. */
  const soPt = {
    ...base,
    alternates: {
      ...base.alternates,
      languages: { "x-default": `${SITE_URL}/pt-BR/estilos`, "pt-BR": `${SITE_URL}/pt-BR/estilos` },
    },
  };
  if (locale !== "pt-BR") return { ...soPt, robots: { index: false, follow: true } };
  return soPt;
}

export default function PaginaEstilos() {
  return <AtlasEstilos estilos={ESTILOS} familias={FAMILIAS} modelo={MODELO_DOS_EXEMPLOS} />;
}
