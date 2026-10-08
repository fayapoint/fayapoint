"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * O MOVIMENTO DA HOME — Lenis suaviza a rolagem, GSAP anima.
 *
 * Só monta na home: o leitor de aula mede a rolagem da janela e não pode ter
 * Lenis por cima. Quem usa marca o HTML, este arquivo não conhece seção nenhuma:
 *
 * - `data-revela` — o elemento entra (sobe e aparece) ao ser alcançado;
 * - `data-revela-filhos` — os filhos diretos entram em cascata;
 * - `data-paralaxe` — a imagem desliza dentro da própria moldura com a rolagem;
 * - `data-inclina` — o cartão inclina em 3D na direção do ponteiro.
 *
 * Seção de primeiro nível sem marca nenhuma entra inteira.
 *
 * O paralaxe e a inclinação saem daqui como NÚMEROS (`--py`, `--rx`, `--ry`); o
 * `transform` que os usa mora no CSS da página. ⚠️ Se o GSAP escrevesse o
 * `transform` direto, ele zeraria `translate` e `scale` em linha — e o `:hover`
 * da porta e o zoom das imagens morreriam sem erro nenhum (medido).
 *
 * ## ⚠️ As três regras que a primeira versão quebrava
 *
 * 1. **Só some o que está ABAIXO da dobra.** `gsap.from(opacity: 0)` em toda
 *    `section` apagava o topo logo depois de hidratar e o acendia de novo: a
 *    página piscava na cara de quem chegava, e o banner da Fábrica — o maior
 *    elemento da primeira tela — sumia junto.
 * 2. **`opacity`, nunca `visibility`.** Elemento com `visibility: hidden` sai
 *    da ordem do Tab: quem navega por teclado pularia a página inteira.
 * 3. **Quem detecta a chegada é o `IntersectionObserver`.** Ele não guarda
 *    posição, então não envelhece quando o cartão do minigame abre e empurra
 *    tudo para baixo. O `ScrollTrigger` fica com o que depende do progresso da
 *    rolagem: a barra do topo e o paralaxe.
 */
export function MovimentoDeRolagem({ alvo }: { alvo: string }) {
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>(alvo);
    if (!raiz || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    // O trilho de cursos barra o `wheel` horizontal para si; sem esta linha o
    // Lenis rolaria a página junto.
    const lenis = new Lenis({ virtualScroll: ({ event }) => !event.defaultPrevented });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const abaixoDaDobra = (el: Element) => el.getBoundingClientRect().top > window.innerHeight;

    const itens = [
      ...raiz.querySelectorAll<HTMLElement>("[data-revela]"),
      ...[...raiz.querySelectorAll<HTMLElement>("[data-revela-filhos]")].flatMap((g) =>
        ([...g.children] as HTMLElement[]).filter((f) => !f.hasAttribute("data-revela-filhos")),
      ),
      ...[...raiz.querySelectorAll<HTMLElement>(":scope > section")].filter(
        (s) => !s.querySelector("[data-revela], [data-revela-filhos]"),
      ),
    ].filter(abaixoDaDobra);

    // Quem chega junto entra em cascata; `clearProps` devolve o `transform` ao
    // CSS, senão o estilo em linha mataria o `:hover` dos cartões. A transição
    // do CSS fica desligada até lá: com ela, cada quadro do GSAP viraria uma
    // transição nova e o cartão chegaria arrastado.
    // Sem margem: com "-8%" a última fileira da página nunca cruzava a linha
    // quando o WhatsApp pousava acima dela, e ficava invisível para sempre.
    const io = new IntersectionObserver(
      (entradas) => {
        const vistos = entradas.filter((e) => e.isIntersecting).map((e) => e.target);
        if (!vistos.length) return;
        vistos.forEach((el) => io.unobserve(el));
        gsap.to(vistos, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          clearProps: "opacity,transform,transition",
        });
      },
    );

    const ctx = gsap.context(() => {
      gsap.set(itens, { opacity: 0, y: 28, transition: "none" });
      itens.forEach((el) => io.observe(el));

      gsap.fromTo(
        barra.current,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.4 } },
      );

      gsap.utils.toArray<HTMLElement>("[data-paralaxe]").filter(abaixoDaDobra).forEach((el) => {
        gsap.fromTo(
          el,
          { "--py": -5 },
          {
            "--py": 5,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    }, raiz);

    // Delegado na raiz: as portas do minigame desmontam e remontam a cada
    // rodada, e um ouvinte por elemento ficaria preso ao nó antigo.
    const porta = (e: PointerEvent) => (e.target as Element).closest<HTMLElement>("[data-inclina]");
    const inclinar = (e: PointerEvent) => {
      const el = porta(e);
      if (!el) return;
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        "--ry": ((e.clientX - r.left) / r.width - 0.5) * 9,
        "--rx": (0.5 - (e.clientY - r.top) / r.height) * 9,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    const soltar = (e: PointerEvent) => {
      const el = porta(e);
      if (!el || el.contains(e.relatedTarget as Node | null)) return;
      gsap.to(el, { "--rx": 0, "--ry": 0, duration: 0.7, ease: "power3.out", overwrite: "auto" });
    };
    const ponteiroFino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (ponteiroFino) {
      raiz.addEventListener("pointermove", inclinar);
      raiz.addEventListener("pointerout", soltar);
    }

    // A altura da página muda (cartão do minigame, globo do Radar): a barra e
    // o paralaxe precisam remedir.
    let espera = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(espera);
      espera = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(raiz);

    return () => {
      window.clearTimeout(espera);
      ro.disconnect();
      io.disconnect();
      raiz.removeEventListener("pointermove", inclinar);
      raiz.removeEventListener("pointerout", soltar);
      ctx.revert();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [alvo]);

  return (
    <div
      ref={barra}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
      style={{ transform: "scaleX(0)", background: "linear-gradient(90deg, #5cc8ff, #a78bfa 55%, #f472b6)" }}
    />
  );
}
