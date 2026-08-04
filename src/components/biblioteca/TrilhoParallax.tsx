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
const ATRASO_ENCAIXE = 300;
const FORCA_ENCAIXE = 0.08;

/** A folga do parallax. Ver a conta no laço de animação antes de mudar. */
const ESCALA_CAPA = 1.05;
const DESLOC_MAX = 7;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

  const alvo = useRef(0);
  const atual = useRef(0);
  const velocidade = useRef(0);
  const arrastando = useRef(false);
  const emLaco = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const percorrido = useRef(0);

  const [pronto, setPronto] = useState(false);
  const idTrilho = useId();

  // Sem itens suficientes o laço infinito não faz sentido — repetir 4 cards
  // três vezes fica óbvio e parece defeito.
  const repetir = itens.length >= 4 ? CLONES : 1;
  const lista = Array.from({ length: repetir }, () => itens).flat();

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    cards.current = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    imagens.current = cards.current.map((c) => c.querySelector<HTMLElement>("[data-capa]")!);
    if (desloc.current.length !== cards.current.length) {
      desloc.current = new Array(cards.current.length).fill(0);
    }
  }, []);

  const larguraDoConjunto = useCallback(() => {
    if (cards.current.length === 0 || repetir === 1) return 0;
    const primeiro = cards.current[0].getBoundingClientRect();
    const ultimo = cards.current[itens.length - 1].getBoundingClientRect();
    return ultimo.right - primeiro.left + 16;
  }, [itens.length, repetir]);

  const encaixar = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const el = trilho.current;
      if (!el || Math.abs(velocidade.current) > 0.5) return;
      const centro = el.getBoundingClientRect().left + el.clientWidth / 2;
      let maisPerto = 0;
      let menor = Infinity;
      cards.current.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(centro - (r.left + r.width / 2));
        if (d < menor) {
          menor = d;
          maisPerto = i;
        }
      });
      const r = cards.current[maisPerto]?.getBoundingClientRect();
      if (!r) return;
      const destino = alvo.current + (r.left + r.width / 2 - centro);
      const max = el.scrollWidth - el.clientWidth;
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
      const w = larguraDoConjunto();
      alvo.current = w;
      atual.current = w;
      el.scrollLeft = w;
    }
    setPronto(true);

    // Respeita quem pediu menos movimento: sem parallax, sem inércia.
    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let quadro = 0;
    const animar = () => {
      const c = trilho.current;
      if (!c) return;

      if (!arrastando.current) {
        alvo.current += velocidade.current;
        velocidade.current *= AMORTECIMENTO;
        if (Math.abs(velocidade.current) < 0.05) velocidade.current = 0;
      }

      const max = c.scrollWidth - c.clientWidth;
      alvo.current = Math.max(0, Math.min(alvo.current, max));

      // O laço infinito: salta um conjunto inteiro sem que nada pisque.
      if (repetir > 1 && !emLaco.current) {
        const w = larguraDoConjunto();
        const limiar = w * 0.3;
        if (alvo.current > max - limiar || alvo.current < limiar) {
          emLaco.current = true;
          const novo = alvo.current > max - limiar ? alvo.current - w : alvo.current + w;
          alvo.current = novo;
          atual.current = novo;
          c.scrollLeft = novo;
          requestAnimationFrame(() => {
            emLaco.current = false;
          });
        }
      }

      atual.current = lerp(atual.current, alvo.current, SUAVIZACAO);
      c.scrollLeft = atual.current;

      if (!menosMovimento) {
        const centro = c.getBoundingClientRect().left + c.clientWidth / 2;
        for (let i = 0; i < imagens.current.length; i++) {
          const card = cards.current[i];
          const img = imagens.current[i];
          if (!card || !img) continue;
          const r = card.getBoundingClientRect();
          // Fora da tela não vale calcular: 3 clones × N cards vira muito
          // getBoundingClientRect por quadro.
          if (r.right < -400 || r.left > window.innerWidth + 400) continue;
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
          let off = (centro - (r.left + r.width / 2)) / 20;
          off = Math.max(-DESLOC_MAX, Math.min(DESLOC_MAX, off));
          desloc.current[i] = lerp(desloc.current[i] ?? 0, off, 0.12);
          img.style.transform = `translateX(${desloc.current[i].toFixed(1)}px) scale(${ESCALA_CAPA})`;
        }
      }

      quadro = requestAnimationFrame(animar);
    };
    quadro = requestAnimationFrame(animar);

    const aoRedimensionar = () => {
      medir();
      const c = trilho.current;
      if (!c) return;
      const max = c.scrollWidth - c.clientWidth;
      alvo.current = Math.max(0, Math.min(alvo.current, max));
      atual.current = alvo.current;
      c.scrollLeft = alvo.current;
    };
    window.addEventListener("resize", aoRedimensionar);

    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", aoRedimensionar);
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [medir, larguraDoConjunto, repetir]);

  /* ── Gestos ──────────────────────────────────────────────────────────── */

  const inicioX = useRef(0);
  const inicioScroll = useRef(0);
  const ultimoX = useRef(0);
  const ultimoT = useRef(0);

  const aoDescer = (e: React.PointerEvent) => {
    arrastando.current = true;
    percorrido.current = 0;
    inicioX.current = e.clientX;
    inicioScroll.current = alvo.current;
    ultimoX.current = e.clientX;
    ultimoT.current = Date.now();
    velocidade.current = 0;
    if (temporizador.current) clearTimeout(temporizador.current);
  };

  const aoMover = (e: React.PointerEvent) => {
    if (!arrastando.current) return;
    const el = trilho.current;
    if (!el) return;
    const dx = inicioX.current - e.clientX;
    percorrido.current = Math.max(percorrido.current, Math.abs(dx));
    const max = el.scrollWidth - el.clientWidth;
    const novo = Math.max(0, Math.min(inicioScroll.current + dx, max));
    alvo.current = novo;
    atual.current = novo;
    el.scrollLeft = novo;

    const agora = Date.now();
    const dt = agora - ultimoT.current;
    if (dt > 0 && dt < 100) velocidade.current = ((ultimoX.current - e.clientX) / dt) * 8;
    ultimoX.current = e.clientX;
    ultimoT.current = agora;
  };

  const aoSubir = () => {
    if (!arrastando.current) return;
    arrastando.current = false;
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
    const largura = (cards.current[0]?.getBoundingClientRect().width ?? 320) + 16;
    const el = trilho.current;
    if (!el) return;

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
      alvo.current = repetir > 1 ? largura * itens.length - el.clientWidth : el.scrollWidth - el.clientWidth;
    }
  };

  const empurrar = (direcao: 1 | -1) => {
    const largura = cards.current[0]?.getBoundingClientRect().width ?? 400;
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
        onPointerLeave={aoSubir}
        className="flex cursor-grab gap-4 overflow-x-hidden px-4 pb-3 active:cursor-grabbing sm:px-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        style={{
          scrollBehavior: "auto",
          opacity: pronto ? 1 : 0,
          transition: "opacity .35s",
          // Sem isto, arrastar na diagonal no celular disputa com a rolagem
          // vertical da página e as duas travam. `pan-y` entrega o eixo
          // vertical ao navegador e fica com o horizontal.
          touchAction: "pan-y",
        }}
      >
        {lista.map((item, i) => (
          <div
            key={`${item.slug}-${i}`}
            data-card
            className="group relative h-[330px] w-[228px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d16] sm:h-[440px] sm:w-[306px]"
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
              loading="lazy"
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
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#05060a] via-[#05060a]/94 to-transparent"
            />

            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                {item.ferramenta && <span>{item.ferramenta}</span>}
                {item.nivel && <span>· {item.nivel}</span>}
              </span>

              <span className="text-base font-bold leading-snug text-white sm:text-lg">
                {item.titulo}
              </span>

              {item.resumo && (
                <span className="line-clamp-2 text-xs leading-relaxed text-white/55">
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
