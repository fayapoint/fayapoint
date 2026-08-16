/**
 * O esqueleto do portal — o que a transição de entrada redesenha.
 *
 * O que se guarda **não é imagem**: é a posição normalizada dos blocos do
 * dashboard mais um punhado de números que o aluno já viu. Cabe em ~1 KB de
 * `localStorage` e sobrevive a qualquer mudança de CSS, porque as medidas
 * saem do DOM real a cada carregamento bem-sucedido.
 *
 * ⚠️ **Mudou a FORMA do esqueleto? Mude a VERSÃO da chave junto.** Um
 * esqueleto v1 lido por um desenhista v2 desenha um layout que não existe
 * mais — e ninguém vai dizer por quê. (Já custou 16 min de dado velho
 * servido em produção quando a mesma regra foi ignorada no Redis.)
 */

export const CHAVE_ESQUELETO = "fayai:esqueleto-portal:v1";

/** Um bloco medido, em fração da área visível (0..1, origem no canto superior esquerdo). */
export interface BlocoEsqueleto {
  chave: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rótulo curto desenhado no topo do bloco. */
  rotulo?: string;
  /** Valor em cache: número conta subindo, texto entra letra a letra. */
  valor?: string | number;
  sufixo?: string;
  /** 0..1 — desenha uma barra de progresso no rodapé do bloco. */
  pct?: number;
}

export interface Esqueleto {
  v: 1;
  /** Últimas 5 durações reais de carregamento, em ms. */
  duracoes: number[];
  blocos: BlocoEsqueleto[];
}

const VAZIO: Esqueleto = { v: 1, duracoes: [], blocos: [] };

export function lerEsqueleto(): Esqueleto | null {
  if (typeof window === "undefined") return null;
  try {
    const cru = localStorage.getItem(CHAVE_ESQUELETO);
    if (!cru) return null;
    const e = JSON.parse(cru) as Esqueleto;
    // Versão diferente ou formato estranho: trata como inexistente. A entrada
    // cai na grade genérica, que ainda é construção — nunca um spinner.
    if (e?.v !== 1 || !Array.isArray(e.blocos)) return null;
    return e;
  } catch {
    return null;
  }
}

export function gravarEsqueleto(e: Esqueleto): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAVE_ESQUELETO, JSON.stringify(e));
  } catch {
    /* cota cheia / modo privado — a transição só perde o cache, não quebra */
  }
}

/**
 * Quanto costuma demorar.
 *
 * Mediana, não média: uma única entrada de 12 s (VPS fria, Mongo lento)
 * envenena a média e faz a animação caminhar devagar demais para sempre.
 */
export function estimativaMs(e: Esqueleto | null): number {
  const d = e?.duracoes;
  if (!d || d.length === 0) return 2200;
  const ord = [...d].sort((a, b) => a - b);
  return ord[ord.length >> 1];
}

/**
 * Mede os blocos marcados com `data-esq` dentro do dashboard renderizado.
 *
 * Só entra o que está na primeira dobra: o resto o aluno não vê durante a
 * espera, e desenhar fora da tela é gastar quadro à toa.
 */
export function medirEsqueleto(raiz: HTMLElement | null): BlocoEsqueleto[] {
  if (!raiz || typeof window === "undefined") return [];
  const area = raiz.getBoundingClientRect();
  const larg = area.width;
  const alt = window.innerHeight;
  if (larg < 1 || alt < 1) return [];

  const blocos: BlocoEsqueleto[] = [];
  raiz.querySelectorAll<HTMLElement>("[data-esq]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;

    const y = (r.top - area.top) / alt;
    if (y > 0.98) return; // abaixo da dobra
    const h = Math.min(r.height / alt, 1 - Math.max(0, y));
    if (h < 0.02) return;

    const valorCru = el.dataset.esqValor;
    const numero = valorCru !== undefined && valorCru !== "" && !Number.isNaN(Number(valorCru));
    const pctCru = el.dataset.esqPct;

    blocos.push({
      chave: el.dataset.esq || "bloco",
      x: (r.left - area.left) / larg,
      y: Math.max(0, y),
      w: r.width / larg,
      h,
      rotulo: el.dataset.esqRotulo || undefined,
      valor: valorCru === undefined ? undefined : numero ? Number(valorCru) : valorCru,
      sufixo: el.dataset.esqSufixo || undefined,
      pct: pctCru ? Number(pctCru) : undefined,
    });
  });

  return blocos;
}

/**
 * Grava a medição desta entrada.
 *
 * `duracaoMs` só entra na conta quando a entrada foi **fria**. Numa volta
 * quente (cache em memória do `useDashboard`) a espera é de milissegundos, e
 * empurrar isso para dentro das durações puxaria a estimativa para baixo até a
 * animação passar a correr mais que o carregamento real. O layout, esse, vale
 * a pena atualizar sempre.
 */
export function registrarEntrada(raiz: HTMLElement | null, duracaoMs: number | null): void {
  const blocos = medirEsqueleto(raiz);
  if (blocos.length === 0) return; // nada medido: não estraga o esqueleto bom

  const atual = lerEsqueleto() ?? VAZIO;
  gravarEsqueleto({
    v: 1,
    duracoes:
      duracaoMs === null || !Number.isFinite(duracaoMs)
        ? atual.duracoes
        : [...atual.duracoes, Math.round(duracaoMs)].slice(-5),
    blocos,
  });
}

/**
 * A grade genérica da primeira visita: sem rótulo, sem número, só a forma de
 * um dashboard. Ainda é construção — o que não pode acontecer é cair num
 * spinner porque o aluno é novo.
 */
export function esqueletoGenerico(): BlocoEsqueleto[] {
  const g = (chave: string, x: number, y: number, w: number, h: number): BlocoEsqueleto => ({
    chave, x, y, w, h,
  });
  return [
    g("g-hero", 0.02, 0.03, 0.96, 0.14),
    g("g-a", 0.02, 0.2, 0.235, 0.11),
    g("g-b", 0.273, 0.2, 0.235, 0.11),
    g("g-c", 0.526, 0.2, 0.235, 0.11),
    g("g-d", 0.779, 0.2, 0.201, 0.11),
    g("g-e", 0.02, 0.34, 0.59, 0.3),
    g("g-f", 0.63, 0.34, 0.35, 0.3),
    g("g-g", 0.02, 0.67, 0.47, 0.24),
    g("g-h", 0.51, 0.67, 0.47, 0.24),
  ];
}
