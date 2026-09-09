"use client";

import { useEffect, useState } from "react";
import { Desmontagem, type Origem } from "./Desmontagem";
import { PeleFabrica } from "./PeleFabrica";

/**
 * O PALCO — e por que ele mora no LAYOUT, e não no banner.
 *
 * ## O defeito que obrigou esta separação
 *
 * A primeira versão guardava o palco dentro do próprio `BannerFabrica`, que
 * vive na home. O clique fazia duas coisas ao mesmo tempo — subir a cortina e
 * navegar — e a navegação **desmontava a home**. Com ela ia o banner, e com o
 * banner ia o palco: a animação de 8 segundos morria no primeiro quadro, e o
 * que se via era um corte seco para a página nova.
 *
 * O sintoma era traiçoeiro porque a página de destino aparecia certinha. Nada
 * quebrava, nada avisava: só faltava o espetáculo inteiro. Um efeito que
 * depende de continuar vivo não pode morar dentro do que está sendo trocado.
 *
 * ## Como funciona agora
 *
 * Este componente está no layout de `(site)`, que é COMPARTILHADO entre a home
 * e `/fabrica`. Ele sobrevive à troca de rota. O banner só dispara um evento
 * com a geometria de onde ele estava, e some junto com a home — enquanto o
 * palco continua rodando por cima, com a página carregando por baixo.
 */

export const EVENTO_DESMONTAR = "fabrica:desmontar";

export type PedidoDeDesmontagem = { origem: Origem; duracao: number };

export function PalcoDesmontagem() {
  const [pedido, setPedido] = useState<PedidoDeDesmontagem | null>(null);

  useEffect(() => {
    const ouvir = (e: Event) => {
      const d = (e as CustomEvent<PedidoDeDesmontagem>).detail;
      if (d?.origem) setPedido(d);
    };
    window.addEventListener(EVENTO_DESMONTAR, ouvir);
    return () => window.removeEventListener(EVENTO_DESMONTAR, ouvir);
  }, []);

  if (!pedido) return null;

  return (
    <Desmontagem
      origem={pedido.origem}
      duracao={pedido.duracao}
      onFim={() => setPedido(null)}
    >
      <PeleFabrica aceso />
    </Desmontagem>
  );
}
