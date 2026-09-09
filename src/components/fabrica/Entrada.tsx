"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A ENTRADA DA PÁGINA — o último segundo, e nem um a mais.
 *
 * A animação entregou a torre; a página tem de aparecer POR TRÁS dela e subir,
 * sem cortar. São três decisões, e as três foram pedidas por escrito:
 *
 *   · **≤ 1 segundo.** 640ms de conteúdo + 260ms da torre saindo. Depois de 8
 *     segundos de espetáculo, mais espera vira pedágio.
 *   · **Suave, com aceleração.** `cubic-bezier(0.22, 1, 0.36, 1)` — sai rápido
 *     e desacelera longo, que é o movimento que o olho lê como "chegou", não
 *     como "está chegando".
 *   · **Escalonado por seção**, 60ms entre elas. Tudo aparecendo junto lê como
 *     tela trocada; em cascata lê como página se montando — que é a mesma
 *     ideia da peça inteira.
 *
 * ⛔ Quem pediu menos movimento não recebe nada disto: aparece pronto.
 */
export function Entrada({ children }: { children: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      return;
    }

    const secoes = Array.from(el.children) as HTMLElement[];
    el.style.opacity = "1";
    const animacoes = secoes.map((s, i) =>
      s.animate(
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 640,
          delay: Math.min(i * 60, 300),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      ),
    );
    return () => { for (const a of animacoes) a.cancel(); };
  }, []);

  return (
    <div ref={raiz} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
