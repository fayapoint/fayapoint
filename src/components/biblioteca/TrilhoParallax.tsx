"use client";

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
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Layers, Loader2, PlayCircle, Sparkles, Wand2 } from "lucide-react";
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
const DESLOC_MAX = 7;

/** Um quadro a 60Hz, em ms. É a unidade em que as constantes acima foram medidas. */
const QUADRO_60HZ = 1000 / 60;

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

  const alvo = useRef(0);
  const atual = useRef(0);
  const velocidade = useRef(0);
  const arrastando = useRef(false);
  const emLaco = useRef(false);
  const ativo = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const percorrido = useRef(0);

  const [pronto, setPronto] = useState(false);
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

    const origem = el.offsetLeft;
    pos.current = cards.current.map((c) => c.offsetLeft - origem);
    larg.current = cards.current.map((c) => c.offsetWidth);
    visivel.current = el.clientWidth;
    total.current = el.scrollWidth;

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

    const animar = (agora: number) => {
      const c = trilho.current;
      if (!c) return;

      // Passo em unidades de "quadro a 60Hz" — é nessa unidade que
      // AMORTECIMENTO, SUAVIZACAO e as velocidades foram medidas.
      const dt = Math.min(agora - anterior, PASSO_MAX_MS);
      anterior = agora;
      const passo = dt / QUADRO_60HZ;

      if (!arrastando.current) {
        alvo.current += velocidade.current * passo;
        velocidade.current *= porTempo(AMORTECIMENTO, passo);
        if (Math.abs(velocidade.current) < 0.05) velocidade.current = 0;
      }

      const max = Math.max(0, total.current - visivel.current);
      alvo.current = Math.max(0, Math.min(alvo.current, max));

      // Parado é parado: sem isto o quadro reescrevia 66 transformações para
      // sempre, segurando as camadas de composição e o rádio da GPU acesos.
      if (!arrastando.current && velocidade.current === 0 && Math.abs(alvo.current - atual.current) < 0.05) {
        if (atual.current !== alvo.current) {
          atual.current = alvo.current;
          c.scrollLeft = atual.current;
        }
        marcarAtivo(false);
        quadro = requestAnimationFrame(animar);
        return;
      }
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

  const inicioX = useRef(0);
  const inicioScroll = useRef(0);
  const ultimoX = useRef(0);
  const ultimoT = useRef(0);

  const aoDescer = (e: React.PointerEvent) => {
    // Botão do meio e direito não arrastam: o do meio é "abrir em nova aba" e
    // sequestrá-lo tira do visitante o gesto mais útil que um trilho de links
    // tem.
    if (e.button !== 0 && e.pointerType === "mouse") return;
    arrastando.current = true;
    percorrido.current = 0;
    inicioX.current = e.clientX;
    inicioScroll.current = alvo.current;
    ultimoX.current = e.clientX;
    ultimoT.current = performance.now();
    velocidade.current = 0;
    if (temporizador.current) clearTimeout(temporizador.current);
    // Captura do ponteiro: o arrasto continua funcionando com o cursor fora do
    // trilho, e o `pointerup` chega mesmo que ele suba sobre outro elemento.
    // Sem isso, sair um pixel para cima no meio do gesto cortava o movimento
    // pela metade — era o `onPointerLeave` fazendo as vezes de `pointerup`.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* navegador sem captura: o arrasto ainda funciona dentro do trilho */
    }
  };

  const aoMover = (e: React.PointerEvent) => {
    if (!arrastando.current) return;
    const el = trilho.current;
    if (!el) return;
    const dx = inicioX.current - e.clientX;
    percorrido.current = Math.max(percorrido.current, Math.abs(dx));
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
    if (!arrastando.current) return;
    arrastando.current = false;
    if (e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* já solto */
      }
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
          {titulo && <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{titulo}</h2>}
          {subtitulo && <p className="mt-1 text-sm text-white/50">{subtitulo}</p>}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => empurrar(-1)}
            aria-label="Anterior"
            aria-controls={idTrilho}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => empurrar(1)}
            aria-label="Próximo"
            aria-controls={idTrilho}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={trilho}
        id={idTrilho}
        role="region"
        aria-roledescription="carrossel"
        aria-label={titulo || "Cursos"}
        tabIndex={0}
        onKeyDown={aoTeclar}
        onPointerDown={aoDescer}
        onPointerMove={aoMover}
        onPointerUp={aoSubir}
        onPointerCancel={aoSubir}
        className="flex cursor-grab gap-4 overflow-x-hidden px-4 pb-3 active:cursor-grabbing sm:px-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
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
            className="group/card group relative h-[330px] w-[228px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d16] shadow-[0_18px_50px_-24px_rgba(0,0,0,.95)] transition-[border-color,box-shadow] duration-300 hover:border-amber-400/35 hover:shadow-[0_24px_60px_-22px_rgba(245,192,78,.28)] sm:h-[440px] sm:w-[306px]"
          >
            {/* O link cobre o card inteiro em vez de envolvê-lo.
                É o que permite o botão de ação viver POR CIMA da capa: um
                <button> dentro de um <a> é HTML inválido, e o navegador
                desmonta a árvore de um jeito que o clique some. */}
            <Link
              href={item.href}
              draggable={false}
              onClick={(e) => {
                // Arrastar não navega.
                if (percorrido.current > 8) e.preventDefault();
              }}
              className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              <span className="sr-only">{item.titulo}</span>
            </Link>

            {item.estado && (
              <span
                className={cn(
                  "pointer-events-none absolute left-3 top-3 z-[2] rounded-full border px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm sm:left-4 sm:top-4",
                  TONS_ESTADO[item.estado.tom],
                )}
              >
                {item.estado.rotulo}
              </span>
            )}

            {/* A capa, com folga lateral para o parallax não abrir borda */}
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
              width={306}
              height={440}
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
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
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

            {/* A PRATELEIRA DE VIDRO.
                O texto ficava direto sobre a ilustração, e por mais escuro que
                fosse o véu ele continuava disputando com a arte. Um painel de
                vidro fosco resolve as duas coisas: `backdrop-blur` desmancha o
                que está atrás, então a leitura para de depender de o pixel de
                trás ser escuro, e o filete claro no topo mais a sombra funda
                fazem o painel POUSAR sobre a capa em vez de manchá-la. */}
            <span
              className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2 rounded-2xl border-t border-white/[0.14] bg-white/[0.055] p-3.5 backdrop-blur-md backdrop-saturate-150 sm:inset-x-3 sm:bottom-3 sm:p-4"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,.14), 0 -1px 0 rgba(255,255,255,.05), 0 18px 40px -16px rgba(0,0,0,.9)",
              }}
            >
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                {item.ferramenta && <span>{item.ferramenta}</span>}
                {item.nivel && <span>· {item.nivel}</span>}
              </span>

              <span
                className="line-clamp-2 text-[15px] font-bold leading-snug text-white sm:text-lg"
                style={{ textShadow: "0 1px 12px rgba(0,0,0,.75)" }}
              >
                {item.titulo}
              </span>

              {item.resumo && (
                <span className="line-clamp-2 text-xs leading-relaxed text-white/60">
                  {item.resumo}
                </span>
              )}

              <span className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50">
                {typeof item.aulas === "number" && (
                  <span className="inline-flex items-center gap-1">
                    <Layers size={11} /> {item.aulas} aulas
                  </span>
                )}
                {item.duracao && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {item.duracao}
                  </span>
                )}
              </span>

              {typeof item.progresso === "number" ? (
                <span className="mt-1 block">
                  <span className="flex items-center justify-between text-[11px] text-white/55">
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <PlayCircle size={12} />
                      {item.progresso > 0 ? "Continuar" : "Começar"}
                    </span>
                    <span className="tabular-nums">{item.progresso}%</span>
                  </span>
                  <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/12">
                    <span
                      className="block h-full rounded-full bg-emerald-400"
                      style={{ width: `${Math.max(2, item.progresso)}%` }}
                    />
                  </span>
                </span>
              ) : (
                typeof item.preco === "number" && (
                  <span className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-[#f5c04e]">
                      R$ {item.preco}
                    </span>
                    {item.precoDe ? (
                      <span className="text-xs text-white/35 line-through">R$ {item.precoDe}</span>
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
                    if (percorrido.current > 8) return;
                    item.acao!.aoClicar();
                  }}
                  disabled={item.acao.carregando}
                  className="pointer-events-auto relative z-[2] mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  {item.acao.carregando ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {item.acao.rotulo}
                </button>
              )}

              {item.atelie && (
                <Link
                  href={item.atelie.href}
                  onClick={(e) => {
                    // Arrastar o trilho não pode virar navegação. É a mesma
                    // guarda do botão acima — o `percorrido` mede quantos
                    // pixels o ponteiro andou desde que encostou no card.
                    if (percorrido.current > 8) e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="pointer-events-auto relative z-[2] mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  <Wand2 size={12} />
                  {item.atelie.rotulo}
                </Link>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
