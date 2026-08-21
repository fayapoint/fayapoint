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
 * ── ⛔ O que NÃO se pode fazer aqui, nunca ─────────────────────────────────
 *
 * **Tirar do `<head>` um `<link>` que o React desenhou.** Foi o que a primeira
 * versão fazia — removia os ícones do Next (`/favicon.ico` e `/icon.svg`) para
 * ficar sozinha na aba — e foi o que travou o site inteiro em 21/08/2026.
 *
 * `<link>`, `<meta>` e `<title>` no `<head>` são *hoistables* do React 19, e o
 * desmonte deles não tem rede:
 *
 * ```js
 * case 26: ... t.stateNode && (t = t.stateNode).parentNode.removeChild(t)
 * ```
 *
 * Sem checagem de nulo, e — ao contrário dos casos 5 e 6, logo abaixo — **sem
 * `try/catch`**. Com o nó já destacado, `parentNode` é `null`, o commit lança
 * `Cannot read properties of null (reading 'removeChild')` e **morre no meio**:
 * o conteúdo novo nunca é escrito na tela e o `loading.tsx` fica para sempre.
 * Do lado de fora: clicou no menu, o logo ficou enchendo, e nada mais
 * aconteceu.
 *
 * Por isso aqui só se **muda atributo** de nó alheio (`href`, `type`), que o
 * React tolera, e se devolve o valor original no fim. O `<link>` que sai e
 * entra do `<head>` a cada quadro — o empurrão que faz o navegador reler o
 * ícone — é um nó **nosso**, criado aqui, e nó nosso pode ir e vir à vontade.
 *
 * ── O que dispara ──────────────────────────────────────────────────────────
 *
 * 1. a primeira carga da página, até o evento `load`;
 * 2. qualquer loader da marca em cena (`estado-de-carga.ts`) — troca de rota,
 *    painel do portal, checkout.
 *
 * ── O que NÃO faz ──────────────────────────────────────────────────────────
 *
 * Não fica animando à toa: quando a carga acaba o relógio PARA e os `href`
 * originais voltam. (A primeira versão restaurava sem parar o relógio, e 66 ms
 * depois o quadro seguinte reinstalava tudo — na prática o favicon nunca
 * parava, e os ícones do React passavam o dia inteiro entrando e saindo do
 * `<head>`.) E respeita `prefers-reduced-motion`: quem pediu menos movimento
 * não ganha uma aba piscando.
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

    let relogio = 0;
    let encerrado = false;

    // A primeira carga anima até o `load`; depois quem manda é o contador.
    let ativo = carregando;
    let pararPrimeira: (() => void) | undefined;
    if (primeiraCarga.current && document.readyState !== "complete") {
      ativo = true;
      const fim = () => {
        primeiraCarga.current = false;
        // Se um loader da marca entrou em cena nesse meio-tempo a animação
        // continua — quem a desliga então é o efeito que roda quando
        // `carregando` muda.
        if (!carregando) encerrar();
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

    // O que cada `<link>` era antes de a gente pintar por cima. É o bilhete de
    // devolução — e a razão de nunca precisarmos destacar nó nenhum.
    const originais = new Map<HTMLLinkElement, { href: string | null; type: string | null }>();
    let proprio: HTMLLinkElement | null = null;

    /**
     * Os `<link rel=icon>` que o React desenhou. Reconsultado a cada quadro de
     * propósito: numa troca de rota o React pode trocar o nó por outro, e uma
     * referência guardada apontaria para um `<link>` que já saiu da página.
     */
    function alheios(): HTMLLinkElement[] {
      return Array.from(
        document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']")
      ).filter((l) => l !== proprio);
    }

    /**
     * Escreve o quadro na aba sem mexer em quem é dono do `<head>`.
     *
     * São duas metades, e as duas são necessárias:
     *
     * 1. **O `href` dos ícones do Next passa a apontar para o quadro.** Sem
     *    isso o `/icon.svg` (`sizes="any"`) ganharia a disputa e a animação
     *    nunca apareceria. Mudar atributo é o máximo que se faz em nó alheio —
     *    ver o aviso no topo do arquivo. O preço disso é conhecido e medido:
     *    o React procura o hoistable dele pelo par `rel`+`href`, e enquanto o
     *    `href` está pintado ele não acha o nó e desenha OUTRO. Sobra um par
     *    repetido de `<link rel=icon>` no `<head>` — **quatro no total, e
     *    para de crescer aí** (medido em cinco trocas de rota seguidas). São
     *    nós idênticos e inertes: o navegador escolhe um, e nenhum deles
     *    volta a ser tocado.
     * 2. **Um `<link>` NOSSO sai e entra a cada quadro.** Trocar `href` nem
     *    sempre faz o navegador reler o ícone; tirar e pôr um `<link>` sempre
     *    faz — e força a releitura de todos, que a essa altura já apontam para
     *    o quadro novo. Como o nó é nosso, tirar e pôr não custa nada a
     *    ninguém.
     */
    function pintar(href: string) {
      for (const l of alheios()) {
        if (!originais.has(l)) {
          originais.set(l, { href: l.getAttribute("href"), type: l.getAttribute("type") });
        }
        l.setAttribute("href", href);
        l.setAttribute("type", "image/png");
      }

      if (!proprio) {
        proprio = document.createElement("link");
        proprio.rel = "icon";
        proprio.type = "image/png";
      }
      proprio.href = href;
      proprio.remove();
      document.head.appendChild(proprio);
    }

    function restaurar() {
      for (const [l, antes] of originais) {
        if (antes.href === null) l.removeAttribute("href");
        else l.setAttribute("href", antes.href);
        if (antes.type === null) l.removeAttribute("type");
        else l.setAttribute("type", antes.type);
      }
      originais.clear();
      proprio?.remove();
      proprio = null;
    }

    /**
     * Fim de festa: para o relógio E devolve os ícones. Um sem o outro deixa a
     * animação se reinstalando sozinha no quadro seguinte.
     */
    function encerrar() {
      if (encerrado) return;
      encerrado = true;
      window.clearInterval(relogio);
      restaurar();
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

      pintar(canvas.toDataURL("image/png"));
    }

    const inicio = performance.now();
    relogio = window.setInterval(() => {
      if (encerrado) return;
      const t = ((performance.now() - inicio) % DURACAO_MS) / DURACAO_MS;
      desenhar(t);
    }, 1000 / QUADROS_POR_SEGUNDO);
    desenhar(0);

    return () => {
      pararPrimeira?.();
      encerrar();
    };
  }, [carregando]);

  return null;
}
