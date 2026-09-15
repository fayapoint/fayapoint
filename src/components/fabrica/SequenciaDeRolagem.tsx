"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./sequencia-de-rolagem.css";

/**
 * SEQUÊNCIA DE ROLAGEM — um vídeo que anda com o dedo, quadro a quadro.
 *
 * O vídeo vira N imagens (`scripts/fabrica-quadros.mjs`) e a rolagem escolhe
 * qual delas o canvas desenha. É a técnica das páginas de produto que montam e
 * desmontam o objeto enquanto a pessoa desce.
 *
 * ## Por que imagem solta e não `<video>` com `currentTime`
 *
 * Para mostrar o quadro 83, o `<video>` decodifica desde o último quadro-chave.
 * Na rolagem isso vira engasgo — e no Safari do celular a busca nem sempre
 * acontece. Imagem já decodificada é desenhada no mesmo quadro de tela.
 *
 * ## O texto entre as camadas
 *
 * Com `pastaFrente`, a sequência ganha uma segunda pilha de quadros: os mesmos
 * quadros, só com os objetos da frente e fundo transparente
 * (`scripts/fabrica-recorte.mjs` com SAM 3.1, depois `scripts/fabrica-frente.mjs`).
 * A ordem na tela fica:
 *
 *     quadro inteiro  →  frases com `camada: "atras"`  →  objetos da frente  →  demais frases
 *
 * É isso que faz o título passar POR TRÁS do tripé. As duas pilhas só são
 * desenhadas juntas num índice em que AMBAS já carregaram: frente de um quadro
 * sobre o fundo de outro desalinha a borda, e borda desalinhada é o defeito que
 * denuncia o truque.
 *
 * ⚠️ Todas as frases ficam num contêiner SÓ, na ordem do texto; quem põe uma
 * atrás é o z-index dela (`data-camada`). A primeira versão usava um contêiner
 * para as de trás, antes do canvas da frente — e "Sua voz. Sua marca." vinha
 * antes do h1 no HTML: o leitor de tela e a versão sem JavaScript liam fora de ordem.
 *
 * ⚠️ A máscara precisa ser ESTÁVEL onde a frase passa. Um objeto que o SAM acha
 * num quadro e perde no seguinte faz o título piscar entre "na frente" e "atrás"
 * (medido em 15/09/2026: o pé do softbox da esquerda aparecia só nos quadros 107–108).
 *
 * ## A caixa segura (o logo não pode sair cortado)
 *
 * O quadro cobre a tela, então numa tela estreita as laterais somem. No
 * fechamento isso cortava o "F" e o "i" do logo numa janela de 800 px — e no
 * celular sobrava só "ayA" (medido em 15/09/2026). Com `caixaSegura`, a partir
 * de `de` a câmera recua até a caixa caber inteira, e o que sobra em volta é
 * pintado com `fundo`. Numa tela larga a caixa já cabe e nada muda. A pasta do
 * celular dessa sequência precisa ser o quadro INTEIRO, não o recorte do centro.
 *
 * ## As decisões que fazem a diferença entre "anda" e "parece caro"
 *
 * - **Duas passadas de carga.** Primeiro 1 quadro a cada 8, depois o resto.
 * - **`decode()` antes de marcar pronto.** Baixado não é decodificado.
 * - **Quadro faltando = o vizinho carregado mais perto.** Nunca espera.
 * - **O quadro corre atrás da rolagem** (`suavidade`): colado no dedo, um gesto
 *   rápido pula 12 quadros de uma vez e lê como defeito.
 * - **Não redesenha o que já está na tela.**
 * - **Densidade de pixel limitada a 2** e recorte pela ORIGEM.
 *
 * ## ⛔ A página que vende não pode depender de JavaScript para existir
 *
 * O servidor desenha o primeiro quadro num `<img>` de verdade e as frases já
 * vêm no HTML. Sem JavaScript, ou com `prefers-reduced-motion`, o trilho some:
 * fica um quadro parado e as frases empilhadas embaixo dele.
 */

export type Batida = {
  /** Progresso (0–1) em que a frase entra. 0 = já visível no primeiro quadro. */
  de: number;
  /** Progresso em que ela termina de sair. 1 = fica até o fim. */
  ate: number;
  conteudo: ReactNode;
  posicao?: "esquerda" | "direita" | "centro" | "base";
  /** "atras" = entre o quadro e os objetos da frente (precisa de `pastaFrente`). */
  camada?: "atras" | "frente";
};

/** Região do quadro, em % (0–100), que tem de caber inteira na tela entre `de` e `ate` do progresso. */
export type CaixaSegura = { x0: number; y0: number; x1: number; y1: number; de: number; ate: number };

type Props = {
  id?: string;
  /** Pasta pública dos quadros largos: `${pasta}/001.webp`, `002.webp`… */
  pasta: string;
  /** Pasta dos quadros de celular — mesma contagem, recorte próprio. */
  pastaMovel?: string;
  /** Os mesmos quadros só com o primeiro plano, fundo transparente. */
  pastaFrente?: string;
  pastaFrenteMovel?: string;
  quadros: number;
  /** Comprimento do trilho, em alturas de tela. */
  telas?: number;
  /** O quadro (base 0) que representa a sequência quando ela não pode andar. */
  quadroParado?: number;
  /** Descrição do que a sequência mostra — vale para o quadro parado também. */
  alt: string;
  batidas?: Batida[];
  /** 0 = colado na rolagem; 0,85 = bem macio. */
  suavidade?: number;
  /** A câmera recua para esta região caber na tela (ver "A caixa segura"). */
  caixaSegura?: CaixaSegura;
  /** Cor pintada em volta do quadro quando a câmera recua. */
  fundo?: string;
  /** Aparece por cima do filme, fora das batidas (ex.: um selo fixo). */
  children?: ReactNode;
  className?: string;
};

const LARGURA_MOVEL = "(max-width: 760px)";
const PASSO_GROSSO = 8;
const FADE = 0.045;
/** Folga em volta da caixa segura: 8% da tela. */
const FOLGA_CAIXA = 0.92;

const urlDoQuadro = (pasta: string, i: number) => `${pasta}/${String(i + 1).padStart(3, "0")}.webp`;

/**
 * As regras do modo parado, escritas uma vez e usadas em dois lugares: dentro
 * de `@media (prefers-reduced-motion)` e dentro do `<noscript>`.
 */
const REGRAS_PARADAS = `
.seq{height:auto!important}
.seq-palco{position:relative!important;height:auto!important;display:flex;flex-direction:column}
.seq-canvas,.seq-inicio,.seq-inicio-frente{display:none!important}
.seq-parado{display:block!important;position:relative!important;aspect-ratio:16/9;width:100%;height:auto!important}
.seq-palco:after{display:none}
.seq-batidas{position:relative!important;inset:auto!important;display:grid;gap:28px;padding:40px var(--seq-margem) 64px}
.seq-batida{position:relative!important;inset:auto!important;translate:none!important;opacity:1!important;visibility:visible!important;transform:none!important;max-width:720px!important;text-align:left!important}
`;

type Camada = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; origem: string; imagens: (HTMLImageElement | null)[] };

export function SequenciaDeRolagem({
  id,
  pasta,
  pastaMovel,
  pastaFrente,
  pastaFrenteMovel,
  quadros,
  telas = 3.2,
  quadroParado,
  alt,
  batidas = [],
  suavidade = 0.82,
  caixaSegura,
  fundo = "#04060a",
  children,
  className,
}: Props) {
  const raizRef = useRef<HTMLElement>(null);
  const palcoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frenteRef = useRef<HTMLCanvasElement>(null);
  const parado = quadroParado ?? quadros - 1;
  // O objeto da prop muda de identidade a cada render; o efeito depende só dos números.
  const caixaChave = caixaSegura
    ? [caixaSegura.x0, caixaSegura.y0, caixaSegura.x1, caixaSegura.y1, caixaSegura.de, caixaSegura.ate].join(",")
    : "";

  useEffect(() => {
    const raiz = raizRef.current;
    const palco = palcoRef.current;
    const canvasBase = canvasRef.current;
    if (!raiz || !palco || !canvasBase) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const movel = window.matchMedia(LARGURA_MOVEL).matches;
    const criar = (canvas: HTMLCanvasElement | null, origem: string | undefined, alpha: boolean): Camada | null => {
      const ctx = canvas && origem ? canvas.getContext("2d", { alpha }) : null;
      return canvas && ctx && origem ? { canvas, ctx, origem, imagens: new Array(quadros).fill(null) } : null;
    };
    const base = criar(canvasBase, movel && pastaMovel ? pastaMovel : pasta, false);
    const frente = criar(frenteRef.current, movel && pastaFrenteMovel ? pastaFrenteMovel : pastaFrente, true);
    if (!base) return;
    const camadas = frente ? [base, frente] : [base];
    const elementosBatida = Array.from(raiz.querySelectorAll<HTMLElement>("[data-batida]"));
    const [cx0, cy0, cx1, cy1, cDe, cAte] = caixaChave ? caixaChave.split(",").map(Number) : [];

    let cancelado = false;
    let visivel = false;
    let pedido = 0;
    let atual = 0;
    let desenhado = -1;

    // ── carga ────────────────────────────────────────────────────────────
    const carregarUma = (camada: Camada, i: number) =>
      new Promise<void>((resolve) => {
        if (camada.imagens[i] || cancelado) return resolve();
        const img = new Image();
        img.decoding = "async";
        img.src = urlDoQuadro(camada.origem, i);
        img
          .decode()
          .then(() => {
            if (!cancelado) camada.imagens[i] = img;
          })
          .catch(() => {})
          .finally(resolve);
      });

    const carregar = async (i: number) => {
      await Promise.all(camadas.map((c) => carregarUma(c, i)));
      if (Math.abs(i - Math.round(atual)) <= PASSO_GROSSO) {
        desenhado = -1;
        pedir();
      }
    };

    const emFila = async (indices: number[], simultaneos: number) => {
      let cursor = 0;
      const trabalhador = async () => {
        while (!cancelado && cursor < indices.length) await carregar(indices[cursor++]);
      };
      await Promise.all(Array.from({ length: simultaneos }, trabalhador));
    };

    let cargaIniciada = false;
    const iniciarCarga = async () => {
      if (cargaIniciada) return;
      cargaIniciada = true;
      const todos = Array.from({ length: quadros }, (_, i) => i);
      await emFila(todos.filter((i) => i % PASSO_GROSSO === 0 || i === quadros - 1), 6);
      await emFila(todos.filter((i) => i % PASSO_GROSSO !== 0), 4);
    };

    // ── desenho ──────────────────────────────────────────────────────────
    const pronto = (i: number) => i >= 0 && i < quadros && camadas.every((c) => c.imagens[i]);
    const indiceMaisProximo = (i: number) => {
      if (pronto(i)) return i;
      for (let d = 1; d < quadros; d++) {
        if (pronto(i - d)) return i - d;
        if (pronto(i + d)) return i + d;
      }
      return -1;
    };

    /** Quanto a câmera já recuou no quadro `k`: 0 = cobre a tela, 1 = a caixa segura cabe. */
    const recuoNoQuadro = (k: number) => {
      if (!caixaChave) return 0;
      const t = Math.min(1, Math.max(0, (k / Math.max(1, quadros - 1) - cDe) / Math.max(0.001, cAte - cDe)));
      return t * t * (3 - 2 * t);
    };

    const pintar = (camada: Camada, img: HTMLImageElement, recuo: number) => {
      const { canvas, ctx } = camada;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const cobre = Math.max(canvas.width / iw, canvas.height / ih);
      let escala = cobre;
      if (recuo > 0) {
        const cabe = Math.min(
          (canvas.width * FOLGA_CAIXA) / (((cx1 - cx0) / 100) * iw),
          (canvas.height * FOLGA_CAIXA) / (((cy1 - cy0) / 100) * ih),
        );
        if (cabe < cobre) escala = cobre + (cabe - cobre) * recuo;
      }
      const dx = (canvas.width - iw * escala) / 2;
      const dy = (canvas.height - ih * escala) / 2;
      // Recorte pela origem: só a parte do quadro que cai dentro do canvas é lida.
      const x0 = Math.max(0, dx);
      const y0 = Math.max(0, dy);
      const x1 = Math.min(canvas.width, dx + iw * escala);
      const y1 = Math.min(canvas.height, dy + ih * escala);
      if (camada !== base) ctx.clearRect(0, 0, canvas.width, canvas.height);
      else if (dx > 0 || dy > 0) {
        ctx.fillStyle = fundo;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, (x0 - dx) / escala, (y0 - dy) / escala, (x1 - x0) / escala, (y1 - y0) / escala, x0, y0, x1 - x0, y1 - y0);
    };

    const desenhar = (i: number) => {
      const k = indiceMaisProximo(i);
      if (k < 0 || k === desenhado) return;
      const recuo = recuoNoQuadro(k);
      for (const c of camadas) pintar(c, c.imagens[k]!, recuo);
      if (desenhado < 0) raiz.dataset.viva = "pronta";
      desenhado = k;
    };

    const medir = () => {
      const r = palco.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of camadas) {
        c.canvas.width = Math.max(1, Math.round(r.width * dpr));
        c.canvas.height = Math.max(1, Math.round(r.height * dpr));
      }
      desenhado = -1;
      pedir();
    };

    // ── rolagem ──────────────────────────────────────────────────────────
    const progresso = () => {
      const r = raiz.getBoundingClientRect();
      const curso = r.height - window.innerHeight;
      return Math.min(1, Math.max(0, -r.top / Math.max(1, curso)));
    };

    const aplicarBatidas = (p: number) => {
      for (const el of elementosBatida) {
        const de = Number(el.dataset.de);
        const ate = Number(el.dataset.ate);
        const entrada = de <= 0 ? 1 : (p - de) / FADE;
        const saida = ate >= 1 ? 1 : (ate - p) / FADE;
        const o = Math.max(0, Math.min(1, entrada, saida));
        el.style.opacity = String(o);
        el.style.visibility = o > 0.001 ? "visible" : "hidden";
        el.style.transform = `translate3d(0, ${((1 - o) * 18).toFixed(1)}px, 0)`;
      }
    };

    const passo = () => {
      pedido = 0;
      const p = progresso();
      const alvo = p * (quadros - 1);
      atual += (alvo - atual) * (1 - suavidade);
      if (Math.abs(alvo - atual) < 0.08) atual = alvo;
      desenhar(Math.round(atual));
      const pVisto = atual / Math.max(1, quadros - 1);
      aplicarBatidas(pVisto);
      raiz.style.setProperty("--seq-progresso", pVisto.toFixed(4));
      if (atual !== alvo) pedir();
    };

    function pedir() {
      if (!pedido && visivel && !cancelado) pedido = requestAnimationFrame(passo);
    }

    // Só trabalha perto da tela: carrega a uma tela e meia de distância e
    // para de desenhar quando sai.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting;
        if (visivel) {
          void iniciarCarga();
          pedir();
        }
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    observador.observe(raiz);

    const redimensionar = new ResizeObserver(medir);
    redimensionar.observe(palco);
    window.addEventListener("scroll", pedir, { passive: true });
    raiz.dataset.viva = "carregando";
    medir();

    return () => {
      cancelado = true;
      cancelAnimationFrame(pedido);
      observador.disconnect();
      redimensionar.disconnect();
      window.removeEventListener("scroll", pedir);
    };
  }, [pasta, pastaMovel, pastaFrente, pastaFrenteMovel, quadros, suavidade, caixaChave, fundo]);

  return (
    <section
      ref={raizRef}
      id={id}
      className={`seq ${className ?? ""}`}
      style={{ ["--seq-telas" as string]: telas }}
    >
      <style>{`@media (prefers-reduced-motion: reduce){${REGRAS_PARADAS}}`}</style>
      <noscript>
        <style>{REGRAS_PARADAS}</style>
      </noscript>
      <div ref={palcoRef} className="seq-palco">
        <picture className="seq-inicio">
          {pastaMovel && <source media={LARGURA_MOVEL} srcSet={urlDoQuadro(pastaMovel, 0)} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlDoQuadro(pasta, 0)} alt={alt} fetchPriority="high" decoding="async" />
        </picture>
        <picture className="seq-parado">
          {pastaMovel && <source media={LARGURA_MOVEL} srcSet={urlDoQuadro(pastaMovel, parado)} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlDoQuadro(pasta, parado)} alt={alt} loading="lazy" decoding="async" />
        </picture>
        <canvas ref={canvasRef} className="seq-canvas seq-canvas--base" aria-hidden="true" />
        {pastaFrente && (
          <>
            <picture className="seq-inicio-frente" aria-hidden="true">
              {pastaFrenteMovel && <source media={LARGURA_MOVEL} srcSet={urlDoQuadro(pastaFrenteMovel, 0)} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlDoQuadro(pastaFrente, 0)} alt="" decoding="async" />
            </picture>
            <canvas ref={frenteRef} className="seq-canvas seq-canvas--frente" aria-hidden="true" />
          </>
        )}
        {children}
        <div className="seq-batidas">
          {batidas.map((b, i) => {
            // Sem pilha da frente não existe "atrás": toda frase fica por cima.
            const atras = Boolean(pastaFrente) && b.camada === "atras";
            // "atras" vale para o TÍTULO. A frase sai duas vezes no mesmo lugar: na cópia de
            // trás só o título aparece; na da frente o título fica transparente e o sobretítulo
            // e o parágrafo seguem legíveis (regras em `sequencia-de-rolagem.css`). A cópia de
            // trás é `inert` e `aria-hidden`: o leitor de tela ouve a frase uma vez só.
            const casca = (camada: "atras" | "frente" | undefined) => (
              <div
                key={`${i}-${camada ?? "unica"}`}
                className={`seq-batida seq-batida--${b.posicao ?? "esquerda"}`}
                data-camada={camada}
                data-batida
                data-de={b.de}
                data-ate={b.ate}
                aria-hidden={camada === "atras" ? true : undefined}
                inert={camada === "atras" ? true : undefined}
                style={{ opacity: b.de <= 0 ? 1 : 0, visibility: b.de <= 0 ? "visible" : "hidden" }}
              >
                {b.conteudo}
              </div>
            );
            return atras ? [casca("atras"), casca("frente")] : casca(undefined);
          })}
        </div>
      </div>
    </section>
  );
}
