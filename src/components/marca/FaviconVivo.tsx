"use client";

import { useEffect, useRef } from "react";

import { AZUL, AZUL_CLARO, AZUL_FUNDO, BRANCO_DA_MARCA, NAVY } from "@/components/marca/cores";
import { MARCA } from "@/components/marca/glifos";
import { useCarregando } from "@/components/marca/estado-de-carga";

/**
 * O favicon que enche enquanto o site carrega.
 *
 * ── Por que existe, se `src/app/icon.svg` já é animado ─────────────────────
 *
 * Porque o Chrome não anima favicon SVG. Ele desenha o primeiro quadro e para
 * — por isso o `icon.svg` nasce CHEIO (o quadro parado tem de ser a marca de
 * verdade) e a animação SMIL só é vista no Firefox. Como o Ricardo trabalha no
 * Chrome, sem isto aqui o recurso não existiria para ele.
 *
 * A saída conhecida é desenhar os quadros no `<canvas>` e trocar o `href` do
 * `<link rel=icon>`. É o mesmo desenho: `Path2D` recebe os MESMOS contornos da
 * Inter Bold que o SVG usa (`glifos.ts`), então o favicon animado e o parado
 * não podem divergir.
 *
 * ── O que dispara ──────────────────────────────────────────────────────────
 *
 * 1. a primeira carga da página, até o evento `load`;
 * 2. qualquer loader da marca em cena (`estado-de-carga.ts`) — troca de rota,
 *    painel do portal, checkout.
 *
 * ── O que NÃO faz ──────────────────────────────────────────────────────────
 *
 * Não fica animando à toa: fora de carregamento os `<link>` originais voltam
 * exatamente como estavam. E respeita `prefers-reduced-motion` — quem pediu
 * menos movimento não ganha uma aba piscando.
 */

const LADO = 32; // o favicon vive entre 16 e 32; acima disso é peso por nada
const QUADROS_POR_SEGUNDO = 15;
const DURACAO_MS = 2200;

export function FaviconVivo() {
  const carregando = useCarregando();
  const primeiraCarga = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // A primeira carga anima até o `load`; depois quem manda é o contador.
    let ativo = carregando;
    let pararPrimeira: (() => void) | undefined;
    if (primeiraCarga.current && document.readyState !== "complete") {
      ativo = true;
      const fim = () => {
        primeiraCarga.current = false;
        restaurar();
      };
      window.addEventListener("load", fim, { once: true });
      pararPrimeira = () => window.removeEventListener("load", fim);
    } else {
      primeiraCarga.current = false;
    }

    if (!ativo) return;

    const canvas = document.createElement("canvas");
    canvas.width = LADO;
    canvas.height = LADO;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    // Cópia depois da guarda: `desenhar` é uma declaração de função (içada), e
    // o TypeScript não leva o estreitamento de `contexto` para dentro dela.
    const ctx: CanvasRenderingContext2D = contexto;

    const { escala, dx, dy, lado, glifos, caixaDoAcento } = MARCA.simbolo;
    const k = LADO / lado;
    const caminhos = glifos.map((g) => ({
      acento: g.acento,
      // O `d` já vem no sistema de tela; o deslocamento do monograma entra na
      // matriz, não no caminho — assim o mesmo `d` serve ao React e a isto.
      caminho: new Path2D(g.d),
      dx: g.dx,
    }));

    const topo = caixaDoAcento[1] * k;
    const base = caixaDoAcento[3] * k;
    const folga = (base - topo) * 0.06;

    const tinta = ctx.createLinearGradient(
      caixaDoAcento[0] * k,
      topo,
      caixaDoAcento[2] * k,
      base
    );
    tinta.addColorStop(0, AZUL_CLARO);
    tinta.addColorStop(0.55, AZUL);
    tinta.addColorStop(1, AZUL_FUNDO);

    /** Leva o espaço do canvas para o espaço dos glifos. */
    const aplicarMatriz = () => {
      ctx.scale(k, k);
      ctx.translate(dx, dy);
      ctx.scale(escala, escala);
    };

    /** O contorno do acento como UM caminho, já com o deslocamento do par. */
    const contornoDoAcento = () => {
      const junto = new Path2D();
      for (const c of caminhos) {
        if (!c.acento) continue;
        junto.addPath(c.caminho, new DOMMatrix().translate(c.dx, 0));
      }
      return junto;
    };

    /** Onde está o nível em `t` (0–1): sobe, respira no cheio, e desce. */
    function nivel(t: number) {
      const suave = (x: number) => x * x * (3 - 2 * x);
      if (t < 0.55) return suave(t / 0.55);
      if (t < 0.74) return 1;
      return 1 - suave((t - 0.74) / 0.26);
    }

    const anteriores = Array.from(
      document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']")
    );
    const nosso = document.createElement("link");
    nosso.rel = "icon";
    nosso.type = "image/png";
    let instalado = false;

    function restaurar() {
      if (!instalado) return;
      instalado = false;
      nosso.remove();
      // Os originais foram retirados de propósito: com dois `rel=icon` o
      // navegador escolhe um e a animação some no meio do caminho.
      for (const l of anteriores) document.head.appendChild(l);
    }

    function desenhar(t: number) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, LADO, LADO);
      ctx.fillStyle = NAVY;
      ctx.beginPath();
      ctx.roundRect(0, 0, LADO, LADO, LADO * 0.22);
      ctx.fill();

      // O "F": desenhado direto, sem enchimento — ele é a metade clara.
      ctx.save();
      aplicarMatriz();
      ctx.fillStyle = BRANCO_DA_MARCA;
      for (const c of caminhos) {
        if (c.acento) continue;
        ctx.save();
        ctx.translate(c.dx, 0);
        ctx.fill(c.caminho);
        ctx.restore();
      }
      ctx.restore();

      // O "A": recorta no contorno e enche por dentro. O recorte é aplicado
      // COM a matriz dos glifos e sobrevive ao `setTransform` — clip é estado,
      // e só o `restore` o desfaz. É isso que deixa os retângulos do nível
      // serem escritos em pixels de tela.
      ctx.save();
      aplicarMatriz();
      ctx.clip(contornoDoAcento());
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BRANCO_DA_MARCA;
      ctx.fillRect(0, 0, LADO, LADO);
      const y = base + folga - (base - topo + folga * 1.4) * nivel(t);
      ctx.fillStyle = tinta;
      ctx.fillRect(0, y, LADO, LADO);
      ctx.fillStyle = AZUL_CLARO;
      ctx.fillRect(0, y, LADO, Math.max(1, LADO * 0.03));
      ctx.restore();

      nosso.href = canvas.toDataURL("image/png");
      if (!instalado) {
        instalado = true;
        for (const l of anteriores) l.remove();
        document.head.appendChild(nosso);
      }
    }

    const inicio = performance.now();
    const relogio = window.setInterval(() => {
      const t = ((performance.now() - inicio) % DURACAO_MS) / DURACAO_MS;
      desenhar(t);
    }, 1000 / QUADROS_POR_SEGUNDO);
    desenhar(0);

    return () => {
      window.clearInterval(relogio);
      pararPrimeira?.();
      restaurar();
    };
  }, [carregando]);

  return null;
}
