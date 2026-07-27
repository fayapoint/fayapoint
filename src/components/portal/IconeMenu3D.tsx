"use client";

import { Peca3D } from "@/components/portal/Peca3D";
import { ICONES_3D } from "@/data/icones3d";

/**
 * O ícone do menu vira 3D quando o cursor chega.
 *
 * Regra do Ricardo, e ela é a razão de isto funcionar: **2D primeiro, 3D no
 * hover**. A primeira leitura continua sendo o ícone vetorial de sempre —
 * instantâneo, nítido em qualquer tamanho, legível por leitor de tela. O 3D é
 * recompensa, não estado padrão.
 *
 * **Um contexto WebGL no menu inteiro, nunca dezessete.** Quem decide quem
 * desenha é a barra lateral (`hover3d`), não cada item: o cursor só está sobre
 * um item de cada vez, então só um `<Canvas>` existe. Sem esse controle, uma
 * varrida rápida pela lista empilharia canvases enquanto os anteriores ainda
 * saem — e o navegador para de criar contexto por volta de dezesseis.
 *
 * A malha, o material e o balanço moram em `Peca3D`, compartilhados com o
 * construtor de persona desde 27/07.
 */

const CAMINHOS = new Map(ICONES_3D.map((i) => [i.slug, i.opcoes[0]?.arquivo]).filter(([, a]) => !!a) as [string, string][]);

export function IconeMenu3D({ slug, aceso }: { slug: string; aceso: boolean }) {
  const url = CAMINHOS.get(slug);
  if (!url) return null;

  return (
    <Peca3D
      url={url}
      aceso={aceso}
      // Maior que o ícone 2D e transbordando a caixa dele: em 20px um volume
      // não se vê, e o ganho do 3D é justamente o volume.
      className="pointer-events-none absolute -inset-[11px] block"
    />
  );
}
