"use client";

import { Peca3D } from "@/components/portal/Peca3D";
import { ICONES_PERSONA_3D } from "@/data/icones3d-persona";

/**
 * O ícone do construtor de persona vira 3D quando o cursor chega.
 *
 * Mesma regra do menu (`IconeMenu3D`) e pela mesma razão: **2D primeiro, 3D no
 * hover**. O emoji continua sendo a leitura padrão — instantâneo, legível em
 * qualquer tamanho, acessível. O volume é recompensa.
 *
 * Aqui o cartão é grande (o dobro do item de menu), então o balanço é mais
 * folgado: em 40 px um giro largo esconde a peça, em 100 px ele mostra a
 * forma.
 *
 * Quem decide quem desenha é a GRADE, nunca o cartão — ver o comentário em
 * `Peca3D` sobre o limite de contextos WebGL do navegador.
 */

const CAMINHOS = new Map(ICONES_PERSONA_3D.map((i) => [i.slug, i.arquivo]));

export function IconePersona3D({ grupo, id, aceso }: { grupo: string; id: string; aceso: boolean }) {
  const url = CAMINHOS.get(`${grupo}-${id}`);
  if (!url) return null;

  return (
    <Peca3D
      url={url}
      aceso={aceso}
      balanco={0.62}
      // Transborda a caixa do emoji: o ganho do 3D é o volume, e volume
      // espremido na mesma caixa do glifo não aparece.
      className="pointer-events-none absolute -inset-5 block"
    />
  );
}
