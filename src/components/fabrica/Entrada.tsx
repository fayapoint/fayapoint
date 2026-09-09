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
 *     tela trocada; em cascata lê como página se montando.
 *
 * ⛔ **A PÁGINA NUNCA PODE FICAR EM BRANCO.**
 *
 * A primeira versão começava com `opacity: 0` no elemento e só revelava dentro
 * de um `useEffect`. Quer dizer: **sem JavaScript, a página que vende ficava
 * invisível para sempre** — e com JavaScript, qualquer falha de hidratação
 * dava o mesmo resultado. Uma página de venda em branco não avisa que está em
 * branco; ela só não vende, e ninguém descobre por quê.
 *
 * Agora existem duas redes por baixo do efeito:
 *
 *   1. `<noscript>` devolve a opacidade — quem não tem JavaScript vê a página
 *      inteira, sem animação nenhuma, que é o correto.
 *   2. Uma animação de CSS revela o conteúdo em 1,2 s **aconteça o que
 *      acontecer**. Se o efeito rodar (o caso normal), ele assume antes disso
 *      e ninguém vê a rede.
 */
export function Entrada({ children }: { children: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    el.style.opacity = "1";
    el.style.animation = "none";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const secoes = Array.from(el.children) as HTMLElement[];
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
    <>
      <noscript>
        {/* Sem JavaScript não há animação — e não precisa haver. Só a página. */}
        <style>{`[data-entrada]{opacity:1 !important;animation:none !important}`}</style>
      </noscript>
      <style>{`
        @keyframes fabrica-rede-de-seguranca { to { opacity: 1; } }
        [data-entrada] { animation: fabrica-rede-de-seguranca 1ms linear 1200ms forwards; }
      `}</style>
      <div ref={raiz} data-entrada style={{ opacity: 0 }}>
        {children}
      </div>
    </>
  );
}
