"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * O estado compartilhado da galeria /casos.
 *
 * ── Por que uma loja de fora do React ──────────────────────────────────────
 *
 * A rolagem alimenta duas coisas ao mesmo tempo: a cena WebGL (que lê a 60 fps
 * dentro do `useFrame`) e o cromo em DOM (régua do tempo, trilha, cor do ato).
 * Se o progresso fosse `useState`, cada pixel de rolagem re-renderizaria a
 * árvore inteira — com 32 estações e 235 miniaturas isso derruba o quadro.
 *
 * Então: o valor contínuo mora num `ref` que a cena lê direto, e só o que é
 * DISCRETO (o ato atual, a estação atual) é publicado para o React. Trocar de
 * ato acontece seis vezes na página inteira; trocar de estação, 32.
 */

export type Instante = {
  /** 0 → 1 ao longo da página inteira */
  progresso: number;
  /** velocidade de rolagem normalizada, para a tira reagir ao gesto */
  velocidade: number;
};

const instante: Instante = { progresso: 0, velocidade: 0 };

export function lerInstante() {
  return instante;
}

// ── a parte discreta, publicada para o React ────────────────────────────────
let atoAtual = 1;
let estacaoAtual = "";
const ouvintes = new Set<() => void>();
let versao = 0;
let instantaneo = { ato: 1, estacao: "", versao: 0 };

function avisar() {
  versao += 1;
  instantaneo = { ato: atoAtual, estacao: estacaoAtual, versao };
  ouvintes.forEach((f) => f());
}

export function definirAto(n: number) {
  if (n === atoAtual) return;
  atoAtual = n;
  avisar();
}

export function definirEstacao(slug: string) {
  if (slug === estacaoAtual) return;
  estacaoAtual = slug;
  avisar();
}

export function useGaleria() {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => instantaneo,
    () => instantaneo
  );
}

/**
 * Liga a rolagem ao `instante`. Um só ouvinte para a página toda, passivo, e
 * a conta é feita no `requestAnimationFrame` — não no evento — para não
 * disputar com o Lenis.
 */
export function useRolagemDaGaleria(alvo: React.RefObject<HTMLElement | null>) {
  const quadro = useRef(0);

  useEffect(() => {
    let anterior = 0;
    let vivo = true;

    const passo = () => {
      if (!vivo) return;
      const el = alvo.current;
      if (el) {
        const total = el.scrollHeight - window.innerHeight;
        const y = window.scrollY - el.offsetTop;
        const p = total > 0 ? Math.min(1, Math.max(0, y / total)) : 0;
        // suavização exponencial: a tira não pode pular quando o dedo solta
        instante.velocidade += ((p - anterior) * 60 - instante.velocidade) * 0.12;
        instante.progresso += (p - instante.progresso) * 0.14;
        anterior = p;
      }
      quadro.current = requestAnimationFrame(passo);
    };

    quadro.current = requestAnimationFrame(passo);
    return () => {
      vivo = false;
      cancelAnimationFrame(quadro.current);
    };
  }, [alvo]);
}

/** `true` quando o usuário pediu menos movimento no sistema. */
export function usePrefereCalma() {
  const calma = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    calma.current = mq.matches;
    const ao = () => (calma.current = mq.matches);
    mq.addEventListener("change", ao);
    return () => mq.removeEventListener("change", ao);
  }, []);
  return calma;
}
