import type { MetadataRoute } from "next";

import { NAVY } from "@/components/marca/cores";

/**
 * O manifesto do site — o que o Android e o Windows leem quando alguém salva
 * o fayai.com.br na tela de início.
 *
 * Não existia até 20/08/2026. Sem ele, o atalho ganhava uma captura da página
 * como ícone: o logo novo pararia na aba e não chegaria ao telefone de
 * ninguém. Como o logo é o motivo desta mudança, o manifesto entra junto.
 *
 * ⚠️ `/manifest.webmanifest` precisa passar pelo `proxy.ts` e pelo geoblock
 * sem virar rota de idioma — ambos foram abertos junto com este arquivo.
 * `next-intl` reescreveria `/manifest.webmanifest` para `/pt-BR/...`, e o
 * navegador receberia HTML onde espera JSON.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FayAi — cursos de Inteligência Artificial",
    short_name: "FayAi",
    description:
      "Aprenda IA na prática, em português: ChatGPT, automação, agentes e criação de imagens.",
    start_url: "/pt-BR",
    display: "standalone",
    background_color: NAVY,
    theme_color: NAVY,
    lang: "pt-BR",
    icons: [
      { src: "/brand/fayai-icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/fayai-icone-512.png", sizes: "512x512", type: "image/png" },
      // "maskable" é o ícone com a folga que o Android recorta em círculo. Sem
      // uma entrada própria, o sistema recorta o quadrado normal e come as
      // pontas do "A".
      {
        src: "/brand/fayai-icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/brand/fayai-marca.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
