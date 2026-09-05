"use client";
import { useT } from "@/i18n/dicionario";

/**
 * O trilho horizontal com parallax — a biblioteca da home e do dashboard.
 *
 * ── De onde veio ───────────────────────────────────────────────────────────
 *
 * Do pen `codepen.io/ol-ivier/pen/myrKavB` ("Infinite Horizontal Parallax
 * Scroll"), escolhido pelo Ricardo: *"quero a fluidez deste design, integrando
 * a imagem e o card que temos de uma forma única"*. A técnica está anotada em
 * `docs/REFERENCIA_GALERIAS_CODEPEN.md`.
 *
 * ── O que foi copiado, e o que foi trocado de propósito ────────────────────
 *
 * COPIADO — é isto que dá a fluidez:
 *   · a imagem tem 130% de largura e é centrada; a folga de 30% é o que
 *     permite ela andar sem abrir borda vazia;
 *   · DOIS `lerp` em série — um suaviza o scroll, outro suaviza o próprio
 *     deslocamento da imagem. Com um só, o parallax fica preso ao ritmo do
 *     dedo e a sensação some;
 *   · três clones da lista e um salto de uma largura de conjunto quando o
 *     scroll passa do limiar: o laço é invisível porque o conteúdo se repete.
 *
 * TROCADO:
 *   · **A roda do mouse não é sequestrada.** O pen faz
 *     `window.addEventListener('wheel', e => e.preventDefault())`, que na home
 *     prenderia a página inteira num carrossel. Aqui só o gesto horizontal
 *     (`deltaX`, trackpad) move o trilho; a rolagem vertical continua da
 *     página. Arrasto, setas e os botões fazem o resto.
 *   · **Cada item é um `<a>` de verdade** com o texto em HTML. No pen o item é
 *     só uma imagem. Aqui ele precisa ser clicável (pedido explícito) e
 *     precisa ser lido pelo Google e pelo leitor de tela — a capa é ilustração,
 *     o texto é conteúdo.
 *   · **Clique não é arrasto.** Guardamos a distância percorrida no ponteiro e
 *     cancelamos a navegação acima de 8px, senão todo arrasto vira clique.
 *
 * ── O conserto de suavidade (03/08/2026) ───────────────────────────────────
 *
 * Veredito do Ricardo sobre a versão anterior: *"10x melhor… mas ainda não
 * está silky smooth"*. Eram três causas somadas, todas mensuráveis:
 *
 * 1. **Layout síncrono forçado, ~66 vezes por quadro.** O laço lia
 *    `getBoundingClientRect()` de um card e logo depois escrevia
 *    `img.style.transform` — leitura, escrita, leitura, escrita. Cada leitura
 *    que vem DEPOIS de uma escrita obriga o navegador a refazer o layout na
 *    hora, dentro do quadro. Com 3 clones de 22 cursos são 66 cards, e mais 2
 *    leituras de `larguraDoConjunto()` por quadro. Agora **todas** as medidas
 *    são tiradas uma vez (em `medir()`, disparado por `ResizeObserver`) e o
 *    quadro só escreve. Zero leitura de layout no laço.
 *
 * 2. **A física era por quadro, não por tempo.** `alvo += velocidade` e
 *    `velocidade *= 0.92` supõem 60Hz. Num monitor de 120Hz tudo corria em
 *    dobro — a inércia morria na metade do tempo e o encaixe chegava seco.
 *    Agora cada constante é elevada a `dt/16.67`, então o movimento é o mesmo
 *    a 60, 120 ou 144Hz. É o que mais muda a *sensação* no monitor do Ricardo.
 *
 * 3. **O laço repintava para sempre.** Mesmo parado, cada quadro reescrevia 66
 *    transformações. Agora, quando não há arrasto, velocidade nem distância
 *    para o alvo, o quadro sai em 3 comparações e o `will-change` é desligado
 *    — o navegador devolve as camadas de composição em vez de segurá-las.
 *
 * ⚠️ Ao mexer aqui: se precisar de uma medida nova, tire-a em `medir()`. Uma
 * única chamada de `getBoundingClientRect()` dentro do laço traz o problema 1
 * de volta inteiro, e ele não aparece em nenhum teste — só no dedo.
 *
 * ── A ampliação por proximidade (05/08/2026) ───────────────────────────────
 *
 * Ricardo: *"eu tinha imaginado um carrossel exatamente igual o do mac, onde
 * temos um aumento de escala onde estamos com o mouse … a estética deles
 * ficarem do tamanho certo apenas no selecionado e os demais dão uma diminuída
 * gradual"*.
 *
 * É o Dock do macOS, e a curva é uma gaussiana sobre a distância entre o
 * ponteiro e o centro de cada card. Quatro decisões que não são óbvias:
 *
 * **1. O card MAIOR é o tamanho natural — ninguém passa de `scale(1)`.** A
 * tentação é ampliar o card sob o cursor acima de 1. Não dá: a faixa é
 * `overflow-x: hidden`, e pela especificação do CSS um eixo escondido força o
 * outro a `auto` — o card que crescesse além da caixa seria CORTADO em cima e
 * ainda ganharia uma barra de rolagem vertical. Então o repouso é 0,955 e o
 * foco é 1,0: o contraste aparece, e nada nunca sai da caixa.
 *
 * **2. A escala mora no CARD, o parallax mora na CAPA.** São dois `transform`
 * em elementos diferentes de propósito. Somá-los no mesmo elemento faria a
 * ampliação multiplicar o deslocamento do parallax, e a capa abriria borda
 * vazia justo no card que está sendo olhado.
 *
 * **3. O `z-index` acompanha a escala.** Sem isso o card ampliado passa por
 * baixo do vizinho e o realce vira defeito de recorte.
 *
 * **4. O laço continua podendo dormir.** A parada de 03/08 (três comparações e
 * sai) valia só para o scroll. Agora ela também espera as escalas assentarem, e
 * o ponteiro acorda o laço escrevendo um `ref` — não um `useState`, que
 * re-renderizaria os 66 cards a cada pixel do mouse.
 *
 * ── O que abre a gaveta mudou ──────────────────────────────────────────────
 *
 * Ricardo: *"o fato de fazermos o hover no card inteiro todo não deve acionar
 * o aumento do card explicativo, tornando assim menos intromissivo, e dando
 * maior controle e mantendo a estética"*.
 *
 * O gatilho deixou de ser o card e passou a ser a PRATELEIRA de vidro. Passar
 * por cima da capa amplia e não abre nada; a gaveta só responde a quem desce
 * até o painel. E a prateleira cresce para CIMA (está ancorada em `bottom`),
 * então o cursor que a abriu continua dentro dela — se ela crescesse para
 * baixo, sairia de debaixo do cursor e a gaveta piscaria em laço.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Award, ChevronDown, Clock, Headphones, Layers, Loader2, PlayCircle, Sparkles, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ItemTrilho {
  slug: string;
  titulo: string;
  capa: string;
  /** A capa antiga, usada só se a nova falhar ao carregar. */
  capaReserva?: string;
  href: string;
  ferramenta?: string;
  nivel?: string;
  aulas?: number;
  duracao?: string;
  /**
   * O curso tem narração pronta.
   *
   * Mora aqui, e não só no cartão do catálogo público, porque é NO PORTAL que
   * o aluno escolhe o que estudar hoje — e quem quer ouvir dirigindo precisa
   * ver isso antes de abrir. O selo do catálogo existia desde 02/09 e nunca
   * chegou a esta lista: o Ricardo abriu o portal e não viu diferença nenhuma
   * entre um curso narrado e um curso sem áudio.
   */
  audiobook?: boolean;
  preco?: number;
  precoDe?: number;
  /** 0–100. Quando presente, desenha a barra e troca o rótulo do botão. */
  progresso?: number;
  resumo?: string;
  /**
   * O estado do curso para ESTA pessoa, estampado no card.
   *
   * Existe desde 03/08/2026, quando a biblioteca do dashboard virou uma lista
   * só. Antes havia duas — "Biblioteca" e "Catálogo do plano" — saídas da mesma
   * origem com filtros diferentes, e o Ricardo resumiu o efeito: *"fiquei sem
   * saber o que eu posso utilizar, imagina então o usuário"*. Uma lista só
   * exige que cada card diga em que pé está.
   */
  estado?: {
    rotulo: string;
    tom: "acervo" | "disponivel" | "fila" | "upgrade" | "concluido" | "gratis";
  };
  /** Ação direta no card — hoje só "Liberar no plano". */
  acao?: {
    rotulo: string;
    aoClicar: () => void;
    carregando?: boolean;
  };
  /**
   * O atalho para o Ateliê (03/08/2026).
   *
   * É link, e não botão com `onClick`, porque leva para outra página: link
   * abre em nova aba com o meio do mouse, aparece no histórico e funciona com
   * o teclado sem nada extra. A personalização é o coração do site e passou
   * quase um mês invisível — o lugar dela é no card de cada curso, não numa
   * aba escondida do perfil.
   */
  atelie?: { href: string; rotulo: string };
}

const TONS_ESTADO: Record<NonNullable<ItemTrilho["estado"]>["tom"], string> = {
  acervo: "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
  disponivel: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  // Âmbar, e não o fúcsia do upgrade: "espere uma vaga" é aviso, não cadeado
  // de pagamento, e a cor não pode dizer o contrário do texto.
  fila: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  upgrade: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200",
  concluido: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  gratis: "border-emerald-300/40 bg-emerald-400/20 text-emerald-100",
};

const CLONES = 3;
const AMORTECIMENTO = 0.92;
const SUAVIZACAO = 0.15;
const SUAVIZACAO_CAPA = 0.12;
const ATRASO_ENCAIXE = 300;
const FORCA_ENCAIXE = 0.08;

/** A folga do parallax. Ver a conta no laço de animação antes de mudar. */
const ESCALA_CAPA = 1.05;
/**
 * ⚠️ Caiu de 7 para 6 em 05/08/2026, junto com o card (306→272px de largura).
 *
 * A regra que o comentário do laço deixou escrita: **a folga lateral tem de ser
 * MAIOR que o deslocamento máximo**. A folga é `largura × (ESCALA_CAPA-1) / 2`.
 * Com 306px eram 7,65px e 7 cabia com sobra de 0,65px. Com 272px são **6,8px**
 * — e 7 passaria a raspar a borda, abrindo uma fresta vazia de meio pixel do
 * lado para onde a capa desliza. 6 devolve 0,8px de sobra.
 *
 * Na vertical: 272/0,6955 = 391px de altura, e a escala come 9,8px no topo. O
 * título gravado na capa começa a ~23px do topo do card nesta proporção, então
 * continua sobrando margem.
 */
const DESLOC_MAX = 6;

/* ── A ampliação por proximidade ───────────────────────────────────────────
   ⚠️ ESCALA_FOCO nunca passa de 1. Ver a decisão 1 do cabeçalho: a faixa é
   `overflow-x: hidden`, e o CSS transforma o eixo vertical em `auto` — um card
   acima de 1 seria cortado no topo e ganharia barra de rolagem. */
const ESCALA_FOCO = 1;
/** Todo mundo em repouso. A diferença para o foco é o que se percebe. */
const ESCALA_REPOUSO = 0.955;
/** O vizinho distante do cursor. É a "diminuída gradual" pedida. */
const ESCALA_LONGE = 0.9;
/** O alcance da gaussiana, em larguras de card. */
const RAIO_FOCO = 1.45;
/** Quão rápido a escala persegue o alvo. Medido por quadro a 60Hz. */
const SUAVIZACAO_ESCALA = 0.18;
/** Abaixo disto a escala é considerada assentada e o laço pode dormir. */
const ESCALA_PARADA = 0.0012;
/** O afundamento do card enquanto o dedo está em cima. É o "clicar não fade". */
const ESCALA_PRESSAO = 0.972;

/* ── O avanço nas pontas ───────────────────────────────────────────────────
   Ricardo: *"quando chegamos em uma das pontas hovering, o próximo curso já
   aparece, isso em ambos os lados fará com que a navegação fique bem mais
   intuitiva"*. A faixa sensível é medida a partir da borda visível e a força
   cresce ao QUADRADO da proximidade: o começo é quase imperceptível e só a
   ponta mesmo puxa de verdade — linear dispara cedo demais e o trilho anda
   sozinho quando ninguém pediu. */
const BORDA_SENSIVEL = 116;
/**
 * Medido no build: com 2,4 o trilho andava ~1080px/s com o cursor colado na
 * borda — três cards e meio por segundo, rápido demais para LER o que passa.
 * 1,7 dá ~700px/s no extremo, e a queda quadrática deixa quase parado a meio
 * caminho da faixa sensível.
 */
const FORCA_BORDA = 1.7;

/** Um quadro a 60Hz, em ms. É a unidade em que as constantes acima foram medidas. */
const QUADRO_60HZ = 1000 / 60;

/**
 * Quantos pixels o ponteiro pode andar e o gesto ainda contar como clique.
 *
 * Era o número 8 solto em quatro lugares. Virou constante porque agora ele
 * decide DUAS coisas que precisam concordar: se o clique navega e se a captura
 * de ponteiro é pedida. Se as duas usassem limiares diferentes existiria uma
 * faixa de pixels em que o gesto captura o ponteiro (roubando o `click`) mas
 * ainda se considera clique — e o link não levaria a lugar nenhum.
 */
const LIMIAR_ARRASTO = 8;

/**
 * Teto do passo de tempo.
 *
 * Aba em segundo plano (ou GC longo) devolve um `dt` de centenas de ms. Sem
 * teto, o primeiro quadro depois de voltar aplicaria a inércia acumulada de
 * uma vez e o trilho daria um salto. 50ms = 3 quadros a 60Hz.
 */
const PASSO_MAX_MS = 50;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Converte uma constante medida por quadro (a 60Hz) para o `dt` real.
 *
 * `0.92` de amortecimento por quadro vira `0.92^(dt/16.67)`; `0.15` de
 * suavização vira `1 - 0.85^(dt/16.67)`. É o que faz o movimento ser o mesmo
 * num monitor de 60, 120 ou 144Hz — sem isto a inércia some pela metade num
 * monitor rápido, que foi o que sobrou de "não silky" na versão anterior.
 */
const porTempo = (porQuadro: number, passo: number) => Math.pow(porQuadro, passo);
const suavePorTempo = (t60: number, passo: number) => 1 - Math.pow(1 - t60, passo);

export function TrilhoParallax({
  itens,
  titulo,
  subtitulo,
}: {
  itens: ItemTrilho[];
  titulo?: string;
  subtitulo?: string;
}) {
  const T = useT();
  const t = useTranslations("Trilho");
  const trilho = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLElement[]>([]);
  const imagens = useRef<HTMLElement[]>([]);
  const desloc = useRef<number[]>([]);

  /**
   * As medidas do trilho, tiradas UMA vez por mudança de tamanho.
   *
   * Tudo aqui está em "coordenada de trilho": o mesmo eixo do `scrollLeft`,
   * com a origem no início do conteúdo rolável. É o que permite o laço de
   * animação decidir o que está visível e onde está o centro sem tocar no
   * layout — a conta é `pos[i] - scrollLeft`, aritmética pura.
   */
  const pos = useRef<number[]>([]);
  const larg = useRef<number[]>([]);
  const visivel = useRef(0);
  const total = useRef(0);
  const conjunto = useRef(0);
  /** A borda esquerda da faixa na janela — converte `clientX` em coordenada de trilho. */
  const esqTrilho = useRef(0);

  /* ── A ampliação ─────────────────────────────────────────────────────── */

  /** A escala DESENHADA de cada card. Persegue o alvo, nunca salta. */
  const escala = useRef<number[]>([]);
  /**
   * Onde o ponteiro está, em px a partir da borda esquerda VISÍVEL da faixa.
   * `null` = nenhum ponteiro em cima, e aí todo mundo volta ao repouso.
   */
  const ponteiro = useRef<number | null>(null);
  /** Índice do card sob o dedo. Só para o afundamento do clique. */
  const pressionado = useRef<number | null>(null);
  /** Onde não há `hover`, o card do CENTRO é o selecionado, e ele abre a gaveta. */
  const temHover = useRef(true);
  const selecionado = useRef(-1);
  /**
   * Um pedido de quadro vindo de fora do laço (mouse, toque, foco).
   *
   * ⚠️ `ref` e não `useState`: o ponteiro escreve isto a cada pixel, e um
   * estado aqui re-renderizaria os 66 cards do trilho em cada movimento do
   * mouse — que é exatamente o defeito que o conserto de 03/08 removeu.
   */
  const acordado = useRef(true);

  const alvo = useRef(0);
  const atual = useRef(0);
  const velocidade = useRef(0);
  const arrastando = useRef(false);
  const emLaco = useRef(false);
  const ativo = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const percorrido = useRef(0);

  const [pronto, setPronto] = useState(false);
  /**
   * Qual card está com a gaveta aberta POR TOQUE.
   *
   * O `hover` não passa por aqui — ele é resolvido em CSS puro
   * (`[data-card]:hover .trilho-detalhes`), e tem de ser: um `useState` no
   * hover re-renderizaria os 66 cards do trilho a cada passada do mouse, e
   * este componente existe justamente porque cada escrita a mais por quadro
   * aparece no dedo. O estado só carrega o caso que o CSS não alcança.
   */
  const [abertoEm, setAbertoEm] = useState<number | null>(null);
  const idTrilho = useId();

  // Sem itens suficientes o laço infinito não faz sentido — repetir 4 cards
  // três vezes fica óbvio e parece defeito.
  const repetir = itens.length >= 4 ? CLONES : 1;
  const lista = Array.from({ length: repetir }, () => itens).flat();

  /**
   * Tira TODAS as medidas de uma vez. É o único lugar do componente que lê
   * layout — chamado na montagem e pelo `ResizeObserver`, nunca por quadro.
   *
   * `offsetLeft` (e não `getBoundingClientRect`) de propósito: ele é relativo
   * ao ancestral posicionado e **não** muda com o scroll, então a medida
   * sobrevive ao trilho andar. `card.offsetLeft - el.offsetLeft` dá a posição
   * na mesma origem do `scrollLeft`, que é o eixo em que o laço raciocina.
   */
  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    cards.current = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    imagens.current = cards.current.map((c) => c.querySelector<HTMLElement>("[data-capa]")!);
    if (desloc.current.length !== cards.current.length) {
      desloc.current = new Array(cards.current.length).fill(0);
    }
    if (escala.current.length !== cards.current.length) {
      escala.current = new Array(cards.current.length).fill(ESCALA_REPOUSO);
    }

    const origem = el.offsetLeft;
    pos.current = cards.current.map((c) => c.offsetLeft - origem);
    larg.current = cards.current.map((c) => c.offsetWidth);
    visivel.current = el.clientWidth;
    total.current = el.scrollWidth;
    // A ÚNICA `getBoundingClientRect` do componente, e ela mora aqui pelo mesmo
    // motivo que todas as outras medidas: é o que converte o `clientX` do mouse
    // em coordenada de trilho, e lê-la no `pointermove` (que dispara a 120Hz)
    // traria de volta o layout síncrono forçado por outro caminho.
    esqTrilho.current = el.getBoundingClientRect().left;

    // A largura de um conjunto é a distância entre o primeiro card e o
    // primeiro card do clone seguinte — exata, e sem depender do `gap`.
    conjunto.current =
      repetir > 1 && pos.current.length > itens.length
        ? pos.current[itens.length] - pos.current[0]
        : 0;
  }, [itens.length, repetir]);

  const encaixar = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      if (!trilho.current || Math.abs(velocidade.current) > 0.5) return;
      // Tudo em coordenada de trilho: nada de ler o DOM aqui.
      const centro = alvo.current + visivel.current / 2;
      let destino = alvo.current;
      let menor = Infinity;
      for (let i = 0; i < pos.current.length; i++) {
        const meio = pos.current[i] + larg.current[i] / 2;
        const d = Math.abs(centro - meio);
        if (d < menor) {
          menor = d;
          destino = meio - visivel.current / 2;
        }
      }
      const max = Math.max(0, total.current - visivel.current);
      velocidade.current += (Math.max(0, Math.min(destino, max)) - alvo.current) * FORCA_ENCAIXE;
    }, ATRASO_ENCAIXE);
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    medir();
    // Começa no meio: com três clones, o conjunto do meio é o que permite
    // rolar para os dois lados sem bater na borda logo de cara.
    if (repetir > 1) {
      const w = conjunto.current;
      alvo.current = w;
      atual.current = w;
      el.scrollLeft = w;
    }
    setPronto(true);

    // Respeita quem pediu menos movimento: sem parallax, sem inércia.
    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Onde não há mouse, quem manda é o card do centro — ver `aplicarSelecao`.
    temHover.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /**
     * Liga e desliga o `will-change` das capas visíveis.
     *
     * Deixá-lo ligado o tempo todo faria o navegador segurar uma camada de
     * composição por card — 66 camadas de 306×440 em DPR 2 são ~140MB de VRAM
     * paradas, e num celular isso é o bastante para a aba ser descartada.
     * Ligado só enquanto há movimento, custa nada e entrega o que promete:
     * a primeira fração de segundo do arrasto deixa de ter o soluço da
     * promoção de camada.
     */
    const marcarAtivo = (ligado: boolean) => {
      if (ativo.current === ligado) return;
      ativo.current = ligado;
      for (const img of imagens.current) {
        if (img) img.style.willChange = ligado ? "transform" : "";
      }
    };

    let quadro = 0;
    let anterior = performance.now();
    /**
     * Alguma escala ainda está a caminho do alvo?
     *
     * Calculada no fim de cada passagem e lida no começo da seguinte — é o que
     * deixa o laço dormir quando o Dock assentou, sem congelá-lo no meio de uma
     * ampliação.
     */
    let escalaViva = true;

    const animar = (agora: number) => {
      const c = trilho.current;
      if (!c) return;

      // Passo em unidades de "quadro a 60Hz" — é nessa unidade que
      // AMORTECIMENTO, SUAVIZACAO e as velocidades foram medidas.
      const dt = Math.min(agora - anterior, PASSO_MAX_MS);
      anterior = agora;
      const passo = dt / QUADRO_60HZ;

      /* O AVANÇO NAS PONTAS.
         Com o cursor perto de uma borda, o trilho anda sozinho e o próximo
         curso aparece. A força cresce ao quadrado da proximidade: no começo da
         faixa é quase nada, e só a ponta puxa de verdade.

         Só com mouse: no toque não existe "pairar sobre a ponta", e no celular
         isso viraria um trilho que anda enquanto o dedo está parado nele. */
      if (temHover.current && ponteiro.current !== null && !arrastando.current && !menosMovimento) {
        const p = ponteiro.current;
        const larguraVista = visivel.current;
        if (p < BORDA_SENSIVEL) {
          const forca = 1 - Math.max(0, p) / BORDA_SENSIVEL;
          velocidade.current -= forca * forca * FORCA_BORDA * passo;
        } else if (p > larguraVista - BORDA_SENSIVEL) {
          const forca = 1 - Math.max(0, larguraVista - p) / BORDA_SENSIVEL;
          velocidade.current += forca * forca * FORCA_BORDA * passo;
        }
      }

      if (!arrastando.current) {
        alvo.current += velocidade.current * passo;
        velocidade.current *= porTempo(AMORTECIMENTO, passo);
        if (Math.abs(velocidade.current) < 0.05) velocidade.current = 0;
      }

      const max = Math.max(0, total.current - visivel.current);
      alvo.current = Math.max(0, Math.min(alvo.current, max));

      // Parado é parado: sem isto o quadro reescrevia 66 transformações para
      // sempre, segurando as camadas de composição e o rádio da GPU acesos.
      //
      // ⚠️ A parada agora tem DUAS condições. Até 04/08 bastava o scroll estar
      // quieto — mas as escalas do Dock continuam se movendo com o trilho
      // imóvel (basta o mouse atravessar a faixa), e sair do quadro cedo
      // congelaria a ampliação no meio do caminho. `escalaViva` é o segundo
      // portão, e `acordado` é como o mouse pede um quadro sem re-renderizar
      // nada.
      const paradoNoEixo =
        !arrastando.current && velocidade.current === 0 && Math.abs(alvo.current - atual.current) < 0.05;
      if (paradoNoEixo && !escalaViva && !acordado.current) {
        if (atual.current !== alvo.current) {
          atual.current = alvo.current;
          c.scrollLeft = atual.current;
        }
        marcarAtivo(false);
        quadro = requestAnimationFrame(animar);
        return;
      }
      acordado.current = false;
      marcarAtivo(true);

      // O laço infinito: salta um conjunto inteiro sem que nada pisque.
      if (repetir > 1 && !emLaco.current) {
        const w = conjunto.current;
        const limiar = w * 0.3;
        if (w > 0 && (alvo.current > max - limiar || alvo.current < limiar)) {
          emLaco.current = true;
          const novo = alvo.current > max - limiar ? alvo.current - w : alvo.current + w;
          // O alvo E o atual saltam juntos: mover só um deles faria o `lerp`
          // do quadro seguinte atravessar o trilho inteiro em uma passada.
          alvo.current = novo;
          atual.current = novo;
          c.scrollLeft = novo;
          requestAnimationFrame(() => {
            emLaco.current = false;
          });
        }
      }

      atual.current = lerp(atual.current, alvo.current, suavePorTempo(SUAVIZACAO, passo));
      c.scrollLeft = atual.current;

      if (!menosMovimento) {
        // O centro do trilho na MESMA coordenada das posições medidas.
        // Nenhuma leitura de layout daqui para baixo — só aritmética e escrita.
        const centro = atual.current + visivel.current / 2;
        const suave = suavePorTempo(SUAVIZACAO_CAPA, passo);
        const bordaEsq = atual.current - 400;
        const bordaDir = atual.current + visivel.current + 400;

        for (let i = 0; i < imagens.current.length; i++) {
          const img = imagens.current[i];
          if (!img) continue;
          const esq = pos.current[i];
          const larguraCard = larg.current[i];
          // Fora da tela não vale calcular: 3 clones × N cards são muitas
          // escritas de estilo por quadro.
          if (esq + larguraCard < bordaEsq || esq > bordaDir) continue;
          // ±7px de deslocamento, e ESCALA só o suficiente para caber.
          //
          // ⚠️ Conserto de 03/08/2026. Ricardo: *"As capas atuais que você
          // gerou ficam muito cortadas"*. A versão anterior usava `scale(1.08)`
          // para criar folga: 8% de escala num card de 440px de altura come
          // ~17px em cima. O título em ouro da capa começa a 26px do topo do
          // card — sobrava 9px de margem, e qualquer arredondamento raspava a
          // primeira linha.
          //
          // A conta agora fecha com sobra: `scale(1.05)` gera 7,65px de folga
          // lateral (306px × 5% ÷ 2) e o deslocamento é travado em 7px — cabe.
          // Verticalmente perde 11px no topo, ainda 15px abaixo do título.
          //
          // Se um dia a capa ou o card mudar de proporção, refaça esta conta
          // antes de mexer nos números: a folga tem que ser MAIOR que o
          // deslocamento máximo, e a perda vertical MENOR que a margem do
          // título.
          let off = (centro - (esq + larguraCard / 2)) / 20;
          off = Math.max(-DESLOC_MAX, Math.min(DESLOC_MAX, off));
          desloc.current[i] = lerp(desloc.current[i] ?? 0, off, suave);
          img.style.transform = `translateX(${desloc.current[i].toFixed(2)}px) scale(${ESCALA_CAPA})`;
        }
      }

      /* ── O DOCK ───────────────────────────────────────────────────────────
         A escala de cada card sai de uma gaussiana sobre a distância entre o
         ponteiro e o centro daquele card. Sem ponteiro, todo mundo volta ao
         repouso; no toque, o card mais próximo do centro é o "selecionado" e
         recebe o foco inteiro.

         Continua valendo a regra da casa: NENHUMA leitura de layout daqui para
         baixo. Só aritmética sobre as medidas de `medir()` e escrita de estilo. */
      {
        const suaveEsc = suavePorTempo(SUAVIZACAO_ESCALA, passo);
        const centroVista = atual.current + visivel.current / 2;
        const ponteiroNoTrilho = ponteiro.current === null ? null : atual.current + ponteiro.current;
        const bordaEsq = atual.current - 400;
        const bordaDir = atual.current + visivel.current + 400;

        // Sem mouse: quem está mais perto do centro é o selecionado, e é ele
        // que abre a gaveta. Ricardo: *"se estivermos pensando no celular, a
        // mecânica de arrastar ou selecionar e aí o card se expandir faz mais
        // sentido por não haver o hover"*.
        let novoSelecionado = -1;
        if (!temHover.current) {
          let menor = Infinity;
          for (let i = 0; i < pos.current.length; i++) {
            const d = Math.abs(centroVista - (pos.current[i] + larg.current[i] / 2));
            if (d < menor) {
              menor = d;
              novoSelecionado = i;
            }
          }
          if (novoSelecionado !== selecionado.current) {
            // Escrita direta no DOM, e só nos DOIS que mudaram — trocar isto
            // por estado re-renderizaria os 66 cards a cada card que passa.
            const antes = cards.current[selecionado.current];
            if (antes) antes.removeAttribute("data-selecionado");
            const agora2 = cards.current[novoSelecionado];
            if (agora2) agora2.setAttribute("data-selecionado", "true");
            selecionado.current = novoSelecionado;
          }
        }

        escalaViva = false;
        const largRef = larg.current[0] || 300;
        const raio = largRef * RAIO_FOCO;

        for (let i = 0; i < cards.current.length; i++) {
          const card = cards.current[i];
          if (!card) continue;
          const esq = pos.current[i];
          const larguraCard = larg.current[i];
          const foraDaVista = esq + larguraCard < bordaEsq || esq > bordaDir;

          // O alvo: 0 = longe/repouso, 1 = é este que está sendo olhado.
          let foco = 0;
          if (!foraDaVista && !menosMovimento) {
            if (ponteiroNoTrilho !== null) {
              const d = (ponteiroNoTrilho - (esq + larguraCard / 2)) / raio;
              foco = Math.exp(-d * d);
            } else if (!temHover.current && i === novoSelecionado) {
              foco = 1;
            }
          }

          // Sem ponteiro E com mouse disponível, ninguém está em foco: o alvo é
          // o repouso liso. Com foco, a curva vai de LONGE (vizinho distante) a
          // FOCO (o card sob o cursor) — é a "diminuída gradual" pedida.
          // ⚠️ `menosMovimento` entra AQUI e não só no cálculo do foco. Sem
          // isso, quem pediu menos movimento receberia `foco = 0` para todos e
          // o trilho inteiro encolheria para ESCALA_LONGE — a acessibilidade
          // devolvendo um catálogo miniaturizado em vez de um catálogo parado.
          const semFoco =
            menosMovimento ||
            (ponteiroNoTrilho === null && (temHover.current || novoSelecionado < 0));
          let alvoEscala = semFoco
            ? ESCALA_REPOUSO
            : ESCALA_LONGE + (ESCALA_FOCO - ESCALA_LONGE) * foco;
          if (pressionado.current === i) alvoEscala *= ESCALA_PRESSAO;

          const anteriorEsc = escala.current[i] ?? ESCALA_REPOUSO;
          const nova = lerp(anteriorEsc, alvoEscala, suaveEsc);
          escala.current[i] = nova;
          if (Math.abs(nova - alvoEscala) > ESCALA_PARADA) escalaViva = true;

          if (foraDaVista) continue;
          card.style.transform = `scale(${nova.toFixed(4)})`;
          // O card ampliado tem de passar POR CIMA do vizinho, senão o realce
          // vira recorte. 100 é o piso para não brigar com as setas da faixa.
          card.style.zIndex = String(Math.round(nova * 100));
          // `--foco` é o que o CSS usa para acender a luz na borda e o filete
          // de ouro da prateleira. Ver `.trilho-*` em globals.css.
          card.style.setProperty("--foco", foco.toFixed(3));
        }
      }

      quadro = requestAnimationFrame(animar);
    };
    quadro = requestAnimationFrame(animar);

    const aoRedimensionar = () => {
      medir();
      const c = trilho.current;
      if (!c) return;
      const max = Math.max(0, total.current - visivel.current);
      alvo.current = Math.max(0, Math.min(alvo.current, max));
      atual.current = alvo.current;
      c.scrollLeft = alvo.current;
    };

    // `ResizeObserver` e não só `resize` da janela: o trilho encolhe quando
    // uma barra lateral abre, quando a fonte carrega e quando o painel do
    // dashboard troca de aba — nenhum desses eventos redimensiona a janela, e
    // sem remedir as posições ficam de uma largura antiga e o parallax
    // desalinha do card.
    const observador = new ResizeObserver(aoRedimensionar);
    observador.observe(el);
    window.addEventListener("resize", aoRedimensionar);

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      window.removeEventListener("resize", aoRedimensionar);
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [medir, repetir]);

  /* ── Gestos ──────────────────────────────────────────────────────────── */

  /** A captura do ponteiro já foi pedida neste gesto? Ver `aoDescer`. */
  const capturado = useRef(false);

  const inicioX = useRef(0);
  const inicioScroll = useRef(0);
  const ultimoX = useRef(0);
  const ultimoT = useRef(0);

  /**
   * Onde o ponteiro está, e um pedido de quadro.
   *
   * ⚠️ `esqTrilho` vem de `medir()` e NÃO é lido aqui. `pointermove` dispara a
   * até 120Hz; uma `getBoundingClientRect()` neste ponto traria de volta o
   * layout síncrono forçado que o conserto de 03/08 removeu — pelo caminho do
   * mouse em vez do caminho do quadro.
   */
  const registrarPonteiro = (clientX: number) => {
    ponteiro.current = clientX - esqTrilho.current;
    acordado.current = true;
  };

  const aoSairPonteiro = () => {
    ponteiro.current = null;
    pressionado.current = null;
    acordado.current = true;
  };

  const aoDescer = (e: React.PointerEvent) => {
    // Botão do meio e direito não arrastam: o do meio é "abrir em nova aba" e
    // sequestrá-lo tira do visitante o gesto mais útil que um trilho de links
    // tem.
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // O afundamento do clique. Ricardo: *"quando clicamos não fade"* — o card
    // não dava resposta nenhuma ao toque, e um card que não afunda parece
    // travado no instante em que a pessoa mais precisa de confirmação.
    //
    // `closest` é leitura de ÁRVORE, não de layout: percorre pais, não força
    // reflow. E acontece uma vez por clique, não por quadro.
    const alvoCard = (e.target as HTMLElement | null)?.closest?.("[data-card]");
    pressionado.current = alvoCard ? cards.current.indexOf(alvoCard as HTMLElement) : null;
    if (pressionado.current === -1) pressionado.current = null;
    registrarPonteiro(e.clientX);

    arrastando.current = true;
    percorrido.current = 0;
    inicioX.current = e.clientX;
    inicioScroll.current = alvo.current;
    ultimoX.current = e.clientX;
    ultimoT.current = performance.now();
    velocidade.current = 0;
    if (temporizador.current) clearTimeout(temporizador.current);
    /* ⚠️ A CAPTURA DO PONTEIRO NÃO ACONTECE MAIS AQUI — e é por isso que o
       clique voltou a navegar.

       Ricardo, 05/08/2026: *"quando clicamos no curso ele não vai para o
       curso"*.

       A causa: `setPointerCapture` no `pointerdown` faz o navegador **redirecionar
       o `click`** para o elemento que capturou. O `pointerdown` e o `pointerup`
       passavam a ter como alvo a FAIXA, e o `click` é despachado no ancestral
       comum dos dois — a faixa, nunca o `<a>` do card. O link continuava lá,
       válido e focável; simplesmente nunca recebia o clique.

       A captura continua sendo necessária para o arrasto (sem ela, sair um
       pixel para cima no meio do gesto corta o movimento pela metade). A saída
       é pedi-la TARDE: só quando o ponteiro já andou o bastante para aquilo ser
       um arrasto de verdade, e não um clique. Ver `aoMover`. */
    capturado.current = false;
  };

  const aoMover = (e: React.PointerEvent) => {
    // A ampliação segue o mouse mesmo sem arrasto — é o caso comum, e é ele
    // que faz o Dock existir. Por isso esta linha vem ANTES do `return`.
    registrarPonteiro(e.clientX);

    if (!arrastando.current) return;
    const el = trilho.current;
    if (!el) return;
    const dx = inicioX.current - e.clientX;
    percorrido.current = Math.max(percorrido.current, Math.abs(dx));

    // A captura chega AQUI, e só depois do limiar: até 8px o gesto ainda pode
    // virar clique, e capturar antes disso rouba o `click` do link (ver
    // `aoDescer`). Passado o limiar já é arrasto declarado, e aí a captura é
    // o que impede o gesto de morrer se o cursor sair da faixa.
    if (!capturado.current && percorrido.current > LIMIAR_ARRASTO) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        capturado.current = true;
      } catch {
        /* navegador sem captura: o arrasto ainda funciona dentro do trilho */
      }
    }
    const max = Math.max(0, total.current - visivel.current);
    const novo = Math.max(0, Math.min(inicioScroll.current + dx, max));
    alvo.current = novo;
    atual.current = novo;
    el.scrollLeft = novo;

    // `performance.now()` e não `Date.now()`: o relógio de parede tem
    // resolução de ~16ms no Windows e pode até andar para trás com o ajuste de
    // horário. Num dt de 8ms (120Hz) isso fazia a velocidade sair 0 ou
    // infinita, e o arremesso saía errado a esmo.
    const agora = performance.now();
    const dt = agora - ultimoT.current;
    if (dt > 0 && dt < 100) velocidade.current = ((ultimoX.current - e.clientX) / dt) * 8;
    ultimoX.current = e.clientX;
    ultimoT.current = agora;
  };

  const aoSubir = (e?: React.PointerEvent) => {
    // O afundamento solta SEMPRE, mesmo que o arrasto já tenha sido cancelado —
    // senão um card fica preso a 0,97 até a próxima passagem do mouse.
    pressionado.current = null;
    acordado.current = true;
    if (!arrastando.current) return;
    arrastando.current = false;
    if (e && capturado.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* já solto */
      }
      capturado.current = false;
    }
    encaixar();
  };

  /**
   * Só o gesto HORIZONTAL move o trilho.
   *
   * O pen chama `preventDefault()` em todo `wheel` da janela. Fazer isso aqui
   * prenderia a rolagem da home dentro do carrossel — o visitante rolaria a
   * página e ela não desceria. `deltaX` só aparece em trackpad e em shift+roda,
   * que é justamente a intenção horizontal.
   *
   * ⚠️ Por que `addEventListener` e não `onWheel`: o React registra `wheel` na
   * raiz como listener PASSIVO. Num listener passivo, `preventDefault()` é
   * ignorado pelo navegador e ainda escreve um aviso no console — a rolagem
   * horizontal por trackpad simplesmente não funcionava. Só um listener nativo
   * com `{ passive: false }` pode barrar o gesto.
   */
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;

    const aoRolar = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontal && !e.shiftKey) return;
      e.preventDefault();
      velocidade.current += (horizontal ? e.deltaX : e.deltaY) * 0.6;
      encaixar();
    };

    el.addEventListener("wheel", aoRolar, { passive: false });
    return () => el.removeEventListener("wheel", aoRolar);
  }, [encaixar]);

  /**
   * O teclado.
   *
   * Sem isto o trilho era inalcançável para quem não usa ponteiro: a faixa não
   * era focável e nenhuma tecla a movia. Setas andam um card, Home e End vão
   * para as pontas.
   */
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (!trilho.current) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      empurrar(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      empurrar(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      alvo.current = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      // Com o laço ligado, "fim" é o fim do PRIMEIRO conjunto — ir ao fim dos
      // três clones levaria a pessoa para uma repetição, o que parece defeito.
      const fimDoConjunto = repetir > 1 ? conjunto.current : total.current;
      alvo.current = Math.max(0, fimDoConjunto - visivel.current);
    }
  };

  const empurrar = (direcao: 1 | -1) => {
    const largura = larg.current[0] ?? 400;
    velocidade.current += direcao * largura * 0.22;
    encaixar();
  };

  if (itens.length === 0) return null;

  return (
    <section className="relative">
      {/* ⚠️ As setas NÃO dependem mais do título.
          Até 03/08/2026 este cabeçalho inteiro só era desenhado quando
          `titulo` ou `subtitulo` chegavam — e o dashboard não passa nenhum dos
          dois. Resultado: no acervo do aluno o trilho não tinha seta nenhuma,
          e no computador, sem toque, só restava arrastar. O cabeçalho é
          opcional; o controle, não. */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-4 sm:px-8">
        <div>
          {titulo && <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{T(titulo)}</h2>}
          {subtitulo && <p className="mt-1 text-sm text-white/50">{T(subtitulo)}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => empurrar(-1)}
            aria-label={t("previous")}
            aria-controls={idTrilho}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => empurrar(1)}
            aria-label={t("next")}
            aria-controls={idTrilho}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ── A MOLDURA ─────────────────────────────────────────────────────
          Ricardo, 05/08/2026: *"também fica feio e duro a forma que eles
          nascem, deveria ter algo que delimitasse e não desse a impressão de
          estarem jogados"*.

          E era isso mesmo: os cards flutuavam direto sobre o fundo da home,
          sem nada dizendo onde o trilho começa e onde acaba — no meio de uma
          seção que ainda tem dois orbes de luz atrás. Sem um limite, cada card
          lia como um objeto solto, e o conjunto não lia como uma prateleira.

          São três peças, e cada uma faz um trabalho:
          · o painel de fio de luz, que dá a caixa;
          · o CHÃO — uma linha de luz rente à base, que faz os cards pousarem
            sobre alguma coisa em vez de pairarem;
          · e o esmaecimento nas duas pontas (no `mask` da faixa), que troca o
            corte seco por uma dissolução. É ele também que faz o próximo curso
            "surgir" da borda quando o cursor puxa o trilho pela ponta, em vez
            de ele aparecer atravessando uma guilhotina. */}
      <div className="trilho-moldura relative mx-2 rounded-2xl sm:mx-8 sm:rounded-[28px]">
        <span aria-hidden className="trilho-chao pointer-events-none absolute inset-x-10 bottom-0 h-px" />
        <div
          ref={trilho}
          id={idTrilho}
          role="region"
          aria-roledescription="carrossel"
          aria-label={titulo || T("Cursos")}
          tabIndex={0}
          onKeyDown={aoTeclar}
          onPointerDown={aoDescer}
          onPointerMove={aoMover}
          onPointerUp={aoSubir}
          onPointerCancel={aoSubir}
          onPointerLeave={aoSairPonteiro}
          className="trilho-faixa flex cursor-grab gap-2 overflow-x-hidden px-2 pb-3 pt-3 active:cursor-grabbing sm:gap-3 sm:px-5 sm:pb-4 sm:pt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          style={{
          scrollBehavior: "auto",
          opacity: pronto ? 1 : 0,
          transition: "opacity .35s",
          // Sem isto, arrastar na diagonal no celular disputa com a rolagem
          // vertical da página e as duas travam. `pan-y` entrega o eixo
          // vertical ao navegador e fica com o horizontal.
          touchAction: "pan-y",
          // O trilho é o fim da linha do gesto horizontal: sem `contain`, o
          // arrasto que chega na ponta vira "voltar página" no trackpad do
          // Mac e no Chrome do Android — o visitante perde a página tentando
          // ver o próximo curso.
          overscrollBehaviorX: "contain",
          // Arrastar não seleciona texto. Sem isto, um arrasto que começa em
          // cima do título deixa meia biblioteca azul de seleção.
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {lista.map((item, i) => (
          <div
            key={`${item.slug}-${i}`}
            data-card
            data-aberto={abertoEm === i ? "true" : undefined}
            /* ⚠️ SEM `transition` no `transform`: quem move a escala é o laço
               de animação, quadro a quadro, com suavização por tempo. Uma
               transição CSS por cima disputaria com ele e o card ficaria
               sempre um pouco atrás do cursor — o defeito exato que o Dock não
               pode ter. As outras propriedades continuam com transição. */
            /* 254×365 no desktop (era 306×440). Ricardo, 05/08/2026:
               *"poderíamos diminuir um pouco o tamanho para caber 4"*.

               ⚠️ A conta tem de incluir TRÊS descontos, e foi por esquecer os
               dois últimos que a primeira tentativa (272px) ainda mostrou só
               três cards a 1280: a margem da moldura (`mx-8` = 64), o respiro
               interno da faixa (`px-5` = 40) e a barra de rolagem da janela
               (~15). Numa tela de 1200 sobram ~1081px úteis, e 4×254 + 3×12 de
               intervalo dá 1052 — quatro cards inteiros com 29px de folga.

               A proporção (0,6955) foi mantida para o recorte da capa
               continuar valendo; ver a conta em `DESLOC_MAX`. */
            /* ⚠️ 112×162 no celular (era 210×302). Ricardo, 05/08/2026:
               *"temos apenas 1 livro na tela, devemos diminuir o suficiente
               para em mobile termos pelo menos 3"*.

               ⚠️ A conta tem de sair da MEDIDA, não da aritmética de cabeça.
               Calculando à mão eu cheguei a 112px ("393 menos mx-2 menos px-2 =
               361"), e no aparelho couberam dois. O que faltava na conta: a
               seção da home tem o próprio `px-4`, então a moldura nasce com
               345px e a faixa entrega **327px úteis**, não 361.

               Com 327: 3×100 + 2×8 = 316. Três cards inteiros e o quarto
               espiando. Medido no build, não estimado.

               Para o card caber nessa largura, a GAVETA saiu do celular — ver o
               bloco `.trilho-detalhes` em globals.css. Era ela que cobria o
               livro. */
            className="trilho-card group/card group relative h-[145px] w-[100px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b0d16] shadow-[0_18px_50px_-24px_rgba(0,0,0,.95)] sm:h-[365px] sm:w-[254px] sm:rounded-2xl"
          >
            {/* O link cobre o card inteiro em vez de envolvê-lo.
                É o que permite o botão de ação viver POR CIMA da capa: um
                <button> dentro de um <a> é HTML inválido, e o navegador
                desmonta a árvore de um jeito que o clique some.

                ⚠️ Desde 05/08 ele é `aria-hidden` e não recebe foco: quem
                anuncia e recebe o teclado é o TÍTULO, dentro da prateleira.
                Com três links para o mesmo curso no mesmo card, expor todos
                faria o leitor de tela ler o catálogo três vezes. Este aqui
                continua existindo porque é ele que faz a CAPA ser clicável. */}
            <Link
              href={item.href}
              aria-hidden
              tabIndex={-1}
              draggable={false}
              onClick={(e) => {
                // Arrastar não navega.
                if (percorrido.current > LIMIAR_ARRASTO) e.preventDefault();
              }}
              className="absolute inset-0 z-[1] rounded-2xl"
            />

            {/* ⚠️ NO CELULAR O SELO É UM PONTO, NÃO UMA FRASE.
                Num card de 100px, "Conteúdo atualizado" quebrava em duas linhas
                e cobria o canto superior do livro — que é exatamente a parte
                que a redução do card existia para libertar. O ponto guarda o
                sinal (a cor já distingue acervo, disponível, fila, upgrade,
                concluído e grátis) sem gastar largura, e o rótulo por extenso
                volta assim que há espaço para ele. O texto continua no DOM, em
                `sr-only`, para quem usa leitor de tela. */}
            {item.estado && (
              <span
                className={cn(
                  "pointer-events-none absolute left-1.5 top-1.5 z-[2] h-2.5 w-2.5 rounded-full border backdrop-blur-sm sm:left-4 sm:top-4 sm:h-auto sm:w-auto sm:px-2 sm:py-0.5 sm:text-[10px] sm:font-bold",
                  TONS_ESTADO[item.estado.tom],
                )}
              >
                <span className="sr-only sm:not-sr-only">{T(item.estado.rotulo)}</span>
              </span>
            )}

            {/* A capa, com folga lateral para o parallax não abrir borda */}
            {/* ── O SELO FICA NA CAPA, NÃO NA GAVETA ─────────────────────
                A linha de "30 aulas · 2h45 · Audiobook" mora dentro da gaveta
                que só abre no hover — ou seja, invisível justamente na hora de
                escolher o curso. Na capa ele é visto sem nenhum gesto. */}
            {item.audiobook && (
              <span
                title={T("Tem audiobook")}
                className="pointer-events-none absolute right-1.5 top-1.5 z-[2] inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg shadow-black/40 ring-1 ring-violet-300/40 sm:right-4 sm:top-4 sm:px-2 sm:text-[10px]"
              >
                <Headphones size={10} />
                <span className="hidden sm:inline">{T("Audiobook")}</span>
              </span>
            )}

            <img
              data-capa
              src={item.capa}
              alt=""
              draggable={false}
              // Só o primeiro conjunto é ansioso. Os clones repetem as MESMAS
              // URLs, então o navegador os serve do cache sem uma requisição
              // a mais — e as capas do conjunto do meio, que é onde o trilho
              // começa, já estão desenhadas quando o dedo encosta. Era o
              // "aparece vazio no meio do movimento" do handoff.
              loading={i < itens.length ? "eager" : "lazy"}
              decoding="async"
              width={254}
              height={365}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ transform: `scale(${ESCALA_CAPA})` }}
              onError={(e) => {
                // Degradação: capa nova → capa antiga → fundo escuro.
                // Direto no DOM, e não por estado, porque isto é puro adorno:
                // um `useState` por card só para esconder uma imagem quebrada
                // faria a lista inteira re-renderizar por um pixel.
                const img = e.currentTarget;
                if (item.capaReserva && img.src !== item.capaReserva) {
                  img.src = item.capaReserva;
                } else {
                  img.style.display = "none";
                }
              }}
            />

            {/* Véu: a informação só é legível com ele, e ele escurece de baixo
                para cima para não cobrir a arte da capa do livro. */}
            {/* O veu comeca so onde o livro termina.
                Com o gradiente cobrindo 62% do card, ele apagava o titulo
                dourado gravado na capa — o unico lugar onde o nome do curso
                aparece DENTRO da ilustracao. Agora o livro tem os 62% de cima
                inteiros e limpos, e a informacao vive nos 38% de baixo. */}
            {/* ⚠️ O esfumado tem SEIS paradas de propósito.
                Com três (`from/via/to`), o navegador interpola rápido demais e
                nasce uma faixa horizontal visível cortando a capa ao meio — o
                véu deixava de ser sombra e virava uma laje encostada na arte.
                A curva longa abaixo faz a mesma escuridão chegar sem borda. */}
            <span
              aria-hidden
              className="trilho-veu pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(5,6,10,.97) 0%, rgba(5,6,10,.93) 16%, rgba(5,6,10,.78) 34%, rgba(5,6,10,.46) 54%, rgba(5,6,10,.18) 74%, rgba(5,6,10,0) 100%)",
              }}
            />

            {/* Um brilho quente rente à base, atrás do vidro: é ele que dá o
                calor de vitrine e separa o painel do fundo preto chapado. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-70 transition-opacity duration-500 group-hover/card:opacity-100"
              style={{
                background:
                  "radial-gradient(120% 100% at 50% 100%, rgba(245,192,78,.20), rgba(167,139,250,.10) 45%, transparent 72%)",
              }}
            />

            {/* ── A LUZ DA BORDA ────────────────────────────────────────────
                Ricardo: *"podíamos ter um mini reflexo ou uma luz em alguns
                pontos da borda do que está aumentado"*.

                Não é uma borda acesa por inteiro — isso viraria contorno de
                néon. São dois pontos de luz especular: um no canto superior
                esquerdo e outro na base à direita, como um objeto de vidro
                pegando duas fontes de luz da sala. A intensidade sai de
                `--foco`, o mesmo número que decide a escala, então a luz nasce
                junto com a ampliação em vez de piscar num limiar. */}
            <span aria-hidden className="trilho-luz pointer-events-none absolute inset-0 rounded-2xl" />

            {/* A PRATELEIRA DE VIDRO.
                O texto ficava direto sobre a ilustração, e por mais escuro que
                fosse o véu ele continuava disputando com a arte. Um painel de
                vidro fosco resolve as duas coisas: `backdrop-blur` desmancha o
                que está atrás, então a leitura para de depender de o pixel de
                trás ser escuro, e o filete claro no topo mais a sombra funda
                fazem o painel POUSAR sobre a capa em vez de manchá-la. */}
            {/* ⚠️ `pointer-events-auto` e `z-[2]`, e é AQUI que mora a mudança
                de 05/08: a prateleira é o GATILHO da gaveta, no lugar do card
                inteiro. Ricardo: *"o fato de fazermos o hover no card inteiro
                todo não deve acionar o aumento do card explicativo"*.

                Para receber `:hover` a prateleira precisa estar ACIMA do link
                que cobre o card — `pointer-events` não atravessa empilhamento.
                E como ela passa a cobrir os 38% de baixo, o link de card
                inteiro deixaria de valer ali; por isso a prateleira ganha o
                próprio link de fundo, logo abaixo. Clicar em qualquer ponto do
                painel continua levando ao curso. */}
            <span
              data-prateleira
              className="trilho-prateleira pointer-events-auto absolute inset-x-1.5 bottom-1.5 z-[2] flex flex-col rounded-lg border-t border-white/[0.14] bg-white/[0.055] p-1.5 backdrop-blur-md backdrop-saturate-150 sm:inset-x-3 sm:bottom-3 sm:rounded-2xl sm:p-4"
              /* A "sombrinha" pedida, e ela tem três camadas de propósito:
                 o anel interno de 1px que fecha o contorno do vidro por
                 dentro, o filete claro no topo que dá a aresta iluminada, e a
                 sombra funda por baixo — é ela que faz o painel POUSAR sobre a
                 capa em vez de manchá-la. Sem o anel, o painel se dissolvia
                 nas laterais e só tinha borda em cima. */
              style={{
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,.055), inset 0 1px 0 rgba(255,255,255,.16), 0 -1px 0 rgba(255,255,255,.05), 0 14px 34px -12px rgba(0,0,0,.92), 0 2px 10px -4px rgba(0,0,0,.7)",
              }}
            >
              {/* O link de fundo da prateleira.
                  `aria-hidden` + `tabIndex={-1}`: são três caminhos para o
                  mesmo curso no mesmo card (a capa, o painel e o título), e um
                  leitor de tela que anunciasse os três leria o catálogo em
                  triplicado. Só o TÍTULO é o link exposto — que é também o
                  texto que descreve o destino. */}
              <Link
                href={item.href}
                aria-hidden
                tabIndex={-1}
                draggable={false}
                onClick={(e) => {
                  if (percorrido.current > LIMIAR_ARRASTO) e.preventDefault();
                }}
                className="absolute inset-0 rounded-2xl"
              />

              {/* O CABEÇALHO — altura fixa, e é isto que dá a "altura padrão".
                  Duas linhas de título cabem sempre; um nome curto sobra espaço
                  em vez de encolher o card, porque um trilho onde cada card
                  fecha numa altura diferente lê como defeito de alinhamento. */}
              <span className="relative z-[1] flex h-[26px] items-start gap-1 sm:h-[50px] sm:gap-2.5">
                {/* A MARCA — um filete de ouro à esquerda do título.
                    Ricardo, 05/08/2026: *"ainda falta um flair no card que tem
                    o título, ainda está bem simplesinho … uma sombrinha, uma
                    linha tipo divider, alguns elementos"*.

                    Ela faz duas coisas de uma vez: dá um ponto de partida para
                    o olho (o título deixa de flutuar no canto do painel) e
                    ecoa a lombada do livro que está logo acima, na capa. É
                    vertical por isso — uma bolinha ou um ícone seriam adorno;
                    uma lombada é a mesma linguagem da ilustração. */}
                <span aria-hidden className="trilho-marca mt-[2px] block w-[2px] shrink-0 rounded-full sm:mt-1 sm:w-[3px]" />

                <Link
                  href={item.href}
                  draggable={false}
                  onClick={(e) => {
                    if (percorrido.current > LIMIAR_ARRASTO) e.preventDefault();
                  }}
                  className="line-clamp-2 flex-1 text-[9.5px] font-bold leading-[1.15] text-white outline-none sm:text-[15px] sm:leading-snug focus-visible:underline focus-visible:decoration-amber-400 focus-visible:underline-offset-4"
                  style={{ textShadow: "0 1px 12px rgba(0,0,0,.75), 0 0 24px rgba(0,0,0,.5)" }}
                >
                  {T(item.titulo)}
                </Link>

                {/* A alavanca só existe onde não há mouse. No celular não
                    acontece `hover`, e o toque já é do link que leva ao curso —
                    sequestrar o primeiro toque para abrir a gaveta faria a
                    pessoa tocar duas vezes para navegar, que é pior do que o
                    problema que estamos consertando. */}
                <button
                  type="button"
                  aria-expanded={abertoEm === i}
                  aria-label={abertoEm === i ? T("Recolher detalhes") : T("Ver detalhes")}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (percorrido.current > LIMIAR_ARRASTO) return;
                    setAbertoEm((a) => (a === i ? null : i));
                  }}
                  className="trilho-alavanca pointer-events-auto relative z-[2] -mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-white/55 transition-transform duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                  style={{ transform: abertoEm === i ? "rotate(180deg)" : "none" }}
                >
                  <ChevronDown size={16} />
                </button>

                {/* O DIVISOR. Fica no PÉ do cabeçalho, posicionado — se fosse
                    um elemento no fluxo, somaria altura e quebraria a "altura
                    padrão" de 42/50px que é a razão de o cabeçalho existir.

                    Ele é curto e centrado em vez de correr de ponta a ponta:
                    uma linha que atravessa o painel inteiro corta o card em
                    dois; uma que morre antes das bordas separa sem dividir. */}
                <span aria-hidden className="trilho-divisor pointer-events-none absolute inset-x-0 bottom-0 h-px" />
              </span>

              {/* A GAVETA. Tudo o que não é o nome do curso mora aqui dentro.
                  `relative` para ficar acima do link de fundo da prateleira —
                  sem isto, o botão do Ateliê seria coberto por ele. */}
              <span className="trilho-detalhes relative z-[1]">
                <span>
                  <span className="flex flex-col gap-1 pt-0.5 sm:gap-2 sm:pt-2">
              <span className="hidden flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-white/45 sm:flex">
                {item.ferramenta && <span>{T(item.ferramenta)}</span>}
                {item.nivel && <span>· {T(item.nivel)}</span>}
              </span>

              {item.resumo && (
                <span className="hidden line-clamp-2 text-xs leading-relaxed text-white/60 sm:block">
                  {T(item.resumo)}
                </span>
              )}

              <span className="mt-0.5 hidden flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 sm:flex">
                {typeof item.aulas === "number" && (
                  <span className="inline-flex items-center gap-1">
                    <Layers size={11} /> {t("lessons", { n: item.aulas })}
                  </span>
                )}
                {item.duracao && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {T(item.duracao)}
                  </span>
                )}
                {item.audiobook && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-200 ring-1 ring-violet-400/25">
                    <Headphones size={11} /> {T("Audiobook")}
                  </span>
                )}
              </span>

              {typeof item.progresso === "number" ? (
                /* ⚠️ CONCLUÍDO é um terceiro estado, não "continuar com 100%".
                   Ricardo, 05/08/2026: *"quando vejo no meu acervo um curso que
                   já completei, não vejo distinção alguma, ele simplesmente me
                   diz para continuar de onde parei, mesmo eu já tendo o
                   certificado"*.

                   A condição era `progresso > 0`, que é verdadeira em 100% — o
                   card mostrava "Continuar · 100%", uma frase que se contradiz
                   sozinha e faz a pessoa achar que o sistema perdeu o
                   progresso dela. O número já estava certo; era a palavra ao
                   lado que mentia. */
                <span className="mt-1 block">
                  <span className="flex items-center justify-between text-[11px] text-white/55">
                    {item.progresso >= 100 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                        <Award size={12} /> {t("done")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <PlayCircle size={12} />
                        {item.progresso > 0 ? t("continue") : t("start")}
                      </span>
                    )}
                    <span className="tabular-nums">{item.progresso}%</span>
                  </span>
                  <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-white/12 sm:mt-1">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        item.progresso >= 100 ? "bg-amber-400" : "bg-emerald-400",
                      )}
                      style={{ width: `${Math.max(2, item.progresso)}%` }}
                    />
                  </span>
                </span>
              ) : (
                typeof item.preco === "number" && (
                  <span className="mt-1 flex items-baseline gap-2">
                    <span className="text-[12px] font-extrabold leading-none text-[#f5c04e] sm:text-lg">
                      
                      {T("R$")} {item.preco}
                    </span>
                    {item.precoDe ? (
                      <span className="hidden text-xs text-white/35 line-through sm:inline">{T("R$")} {item.precoDe}</span>
                    ) : null}
                  </span>
                )
              )}

              {item.acao && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (percorrido.current > LIMIAR_ARRASTO) return;
                    item.acao!.aoClicar();
                  }}
                  disabled={item.acao.carregando}
                  className="pointer-events-auto relative z-[2] mt-1 hidden items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 sm:inline-flex px-3 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  {item.acao.carregando ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {T(item.acao.rotulo)}
                </button>
              )}

              {item.atelie && (
                <Link
                  href={item.atelie.href}
                  onClick={(e) => {
                    // Arrastar o trilho não pode virar navegação. É a mesma
                    // guarda do botão acima — o `percorrido` mede quantos
                    // pixels o ponteiro andou desde que encostou no card.
                    if (percorrido.current > LIMIAR_ARRASTO) e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="pointer-events-auto relative z-[2] mt-1 hidden items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 sm:inline-flex bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  <Wand2 size={12} />
                  {T(item.atelie.rotulo)}
                </Link>
              )}
                  </span>
                </span>
              </span>
            </span>
          </div>
          ))}
        </div>
      </div>
    </section>
  );
}
