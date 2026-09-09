"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PeleFabrica } from "./PeleFabrica";
import { CHAVE_VISTA } from "./Desmontagem";
import { EVENTO_DESMONTAR, type PedidoDeDesmontagem } from "./PalcoDesmontagem";

/**
 * O BANNER DA FÁBRICA — o widget que se desmonta.
 *
 * ## Como o clique funciona
 *
 * 1. **Antes do clique**, no primeiro `hover` ou `focus`, a rota é pré-buscada.
 *    Quem passa o mouse já baixou a página que ainda não pediu.
 * 2. **No clique**, três coisas acontecem no MESMO quadro: a cortina sobe, a
 *    navegação começa, e a coreografia dispara. A página carrega POR BAIXO da
 *    animação — é isso que compra os 8 segundos sem cobrar espera de ninguém.
 * 3. **No fim**, a cortina sai por cima de `/fabrica/loading.tsx`, que já
 *    desenhou a mesma torre no mesmo lugar. Sem piscar, sem corte.
 *
 * ## ⛔ Ele continua sendo um link
 *
 * O elemento é um `<Link>` de verdade, com `href`. Sem JavaScript, com o
 * JavaScript quebrado, no meio do carregamento, ou num leitor de tela que
 * segue links: o clique leva à página. A animação é enfeite por cima de algo
 * que funciona sem ela — nunca o contrário.
 */
export function BannerFabrica() {
  const router = useRouter();
  const locale = useLocale();
  const destino = `/${locale}/fabrica`;

  const [aceso, setAceso] = useState(false);
  const jaBuscou = useRef(false);

  const prebuscar = useCallback(() => {
    if (jaBuscou.current) return;
    jaBuscou.current = true;
    router.prefetch(destino);
  }, [router, destino]);

  const abrir = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Clique do meio, ctrl/cmd, ou botão que não é o principal: é intenção de
      // abrir noutra aba. A animação não tem nada a ver com isso.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      // ⚠️ A geometria sai de `currentTarget`, NUNCA de uma `ref` no `<Link>`.
      // Com a ref, `caixa.current` vinha nulo, a função saía no `return` antes
      // do `preventDefault`, e o link navegava normalmente: a página trocava
      // certinho e a animação de 8 segundos simplesmente não existia. Nada
      // quebrava, nada avisava. `currentTarget` é o elemento em que o próprio
      // manipulador está pendurado — ele não tem como estar vazio.
      const r = e.currentTarget.getBoundingClientRect();

      e.preventDefault();

      let vista = false;
      try {
        vista = Boolean(window.localStorage.getItem(CHAVE_VISTA));
        window.localStorage.setItem(CHAVE_VISTA, String(Date.now()));
      } catch {
        // Janela anônima ou site bloqueado: cai na versão longa. Um erro aqui
        // nunca pode impedir a navegação.
      }

      // O palco vive no layout de `(site)`, que sobrevive à troca de rota.
      // Daqui sai só o pedido: onde o banner estava, e por quanto tempo.
      const pedido: PedidoDeDesmontagem = {
        origem: { x: r.x, y: r.y, largura: r.width, altura: r.height },
        duracao: vista ? 2000 : 8000,
      };
      window.dispatchEvent(new CustomEvent(EVENTO_DESMONTAR, { detail: pedido }));
      // A navegação começa AGORA, junto com a cortina: a página carrega por
      // baixo da animação, que é o que compra os 8 segundos sem cobrar espera.
      router.push(destino);
    },
    [router, destino],
  );

  return (
    <section className="relative px-4 sm:px-8 pb-3 shrink-0">
      {/* O movimento ambiente vive AQUI, fora da pele: ele não é clonado, então
          as 24 peças não herdam 24 relógios fora de sincronia. */}
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 340,
          height: 340,
          left: "8%",
          top: -60,
          background: "radial-gradient(circle, rgba(245,192,78,.34), transparent 65%)",
          animation: "fx-drift-a 14s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="fx-orb"
        style={{
          width: 280,
          height: 280,
          right: "10%",
          top: 30,
          background: "radial-gradient(circle, rgba(56,189,248,.26), transparent 65%)",
          animation: "fx-drift-b 17s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        <Link
          href={destino}
          prefetch
          onMouseEnter={() => { setAceso(true); prebuscar(); }}
          onMouseLeave={() => setAceso(false)}
          onFocus={() => { setAceso(true); prebuscar(); }}
          onBlur={() => setAceso(false)}
          onClick={abrir}
          aria-label="Conhecer a Fábrica Autônoma"
          className="block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          style={{
            // A elevação no hover é a promessa física: a peça já está solta.
            transform: aceso ? "translateY(-3px)" : "none",
            transition: "transform 380ms cubic-bezier(0.22,1,0.36,1)",
            minHeight: 260,
          }}
        >
          <div style={{ minHeight: 260 }}>
            <PeleFabrica aceso={aceso} />
          </div>
        </Link>
      </div>
    </section>
  );
}
