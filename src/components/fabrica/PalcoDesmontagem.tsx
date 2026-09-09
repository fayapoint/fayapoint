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
/** Avisa que a corrida acabou e um pedido novo pode entrar. */
const EVENTO_LIBERAR = "fabrica:desmontar-fim";

export type PedidoDeDesmontagem = { origem: Origem; duracao: number };

export function PalcoDesmontagem() {
  const [pedido, setPedido] = useState<(PedidoDeDesmontagem & { n: number }) | null>(null);

  useEffect(() => {
    /**
     * ⚠️ UM PEDIDO POR VEZ, E CADA UM COM INSTÂNCIA NOVA.
     *
     * Sem a trava, dois cliques rápidos no banner trocavam a geometria (o
     * estilo estático das peças saltava para o novo `getBoundingClientRect`)
     * enquanto as animações já em voo continuavam mirando o alvo calculado com
     * a geometria antiga — porque a coreografia é montada uma vez só, no
     * `useLayoutEffect` com dependências vazias. O `n` crescente vira `key` e
     * força uma instância nova; a trava evita até isso na maioria dos casos.
     */
    let emVoo = false;
    const ouvir = (e: Event) => {
      const d = (e as CustomEvent<PedidoDeDesmontagem>).detail;
      if (!d?.origem || emVoo) return;
      emVoo = true;
      setPedido({ ...d, n: Date.now() });
    };
    const liberar = () => { emVoo = false; };
    window.addEventListener(EVENTO_DESMONTAR, ouvir);
    window.addEventListener(EVENTO_LIBERAR, liberar);
    return () => {
      window.removeEventListener(EVENTO_DESMONTAR, ouvir);
      window.removeEventListener(EVENTO_LIBERAR, liberar);
    };
  }, []);

  if (!pedido) return null;

  return (
    <Desmontagem
      key={pedido.n}
      origem={pedido.origem}
      duracao={pedido.duracao}
      onFim={() => {
        setPedido(null);
        window.dispatchEvent(new Event(EVENTO_LIBERAR));
      }}
    >
      <PeleFabrica aceso />
    </Desmontagem>
  );
}
