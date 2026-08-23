/**
 * Tokens visuais da seção /game — a ponte entre a identidade da casa
 * (`IDENTIDADE_VISUAL.md` v1.2) e as telas de estatística desta seção.
 *
 * Por que existe: a v1 da seção nasceu num verde `#07120c` + `emerald-*` que
 * não está em lugar nenhum do sistema da FayAI — parecia outro site colado
 * dentro deste. A cor de contexto correta é a **lima `#a3e635`**, que a §2 da
 * identidade já atribui a "Dia a dia / Visão de Jogo" e que, por acidente
 * feliz, é a cor da grama.
 *
 * Regra herdada da §3: o OURO não é decoração. Ele marca recompensa — pódio,
 * artilheiro, craque do jogo, CTA de prêmio. Em mais nada.
 */

/** Cor de contexto da seção. Bordas, chips, títulos, sombras. */
export const LIMA = "#a3e635";
/** Recompensa apenas: líder, artilheiro, craque, CTA de prêmio. */
export const OURO = "#f5c04e";
/** Derrota / risco. Vermelho da casa, não `red-500` cru. */
export const RUBRO = "#fb7185";
/** Empate / neutro forte. */
export const CINZA = "#94a3b8";

/**
 * As cores de categoria da casa (§2), aqui como token em vez de hexadecimal
 * solto. Elas apareciam escritas à mão em quatro arquivos desta seção — e cor
 * duplicada é cor que sai do lugar quando um dos quatro é editado.
 */
export const CIANO = "#38bdf8";
export const VIOLETA = "#a78bfa";
export const ROSA = "#f472b6";
export const LARANJA = "#fb923c";

/** Fundo profundo da casa. Toda página nova nasce aqui. */
export const FUNDO = "#0c0e1d";
/** Texto principal (§2). */
export const TEXTO = "#f3f1ff";
/** Nota mediana: mais claro que CINZA para não sumir sobre o navy. */
export const NEUTRO_NOTA = "#e2e8f0";

/** Fonte display da casa — sempre CAIXA ALTA, sempre com tracking. */
export const bebas = {
  fontFamily: "var(--font-bebas), sans-serif",
  letterSpacing: "0.03em",
} as const;

/** Borda/sombra/fundo de um card na cor de contexto pedida. */
export function superficie(cor: string = LIMA, forca: "sutil" | "forte" = "sutil") {
  return {
    borderColor: `${cor}${forca === "forte" ? "55" : "2e"}`,
    background: "rgba(22,26,54,.45)",
    boxShadow: `0 10px 30px -14px ${cor}${forca === "forte" ? "77" : "44"}`,
  };
}

/**
 * Cor de um resultado. Usada no strip de forma, na borda do card de partida e
 * na linha da classificação — sempre a mesma, para o olho aprender uma vez só.
 */
export function corResultado(r: "win" | "draw" | "loss"): string {
  return r === "win" ? LIMA : r === "loss" ? RUBRO : CINZA;
}

/**
 * Nota de jogador → cor. As faixas saem da própria escala do jogo (a nota da EA
 * vai de ~4 a 10): abaixo de 6 é jogo ruim, 7,5 é bom, 8,5+ é atuação de craque.
 */
export function corNota(nota: number | null | undefined): string {
  if (nota == null) return "rgba(255,255,255,.35)";
  if (nota >= 8.5) return OURO;
  if (nota >= 7.5) return LIMA;
  if (nota >= 6) return NEUTRO_NOTA;
  return RUBRO;
}

/** Grupo de posição do jogador — para colorir e agrupar o elenco. */
export type Setor = "GOL" | "DEF" | "MEI" | "ATA" | "—";

const POR_SETOR: Record<string, Setor> = {
  goalkeeper: "GOL", gk: "GOL",
  defender: "DEF", defensiveMid: "DEF", cb: "DEF", lb: "DEF", rb: "DEF", lwb: "DEF", rwb: "DEF", cdm: "DEF",
  midfielder: "MEI", cm: "MEI", cam: "MEI", lm: "MEI", rm: "MEI",
  forward: "ATA", striker: "ATA", st: "ATA", cf: "ATA", lw: "ATA", rw: "ATA",
};

/** A EA manda a posição em formatos inconsistentes; aqui vira um dos 4 setores. */
export function setorDaPosicao(pos: string | null | undefined): Setor {
  if (!pos) return "—";
  return POR_SETOR[pos.trim()] ?? POR_SETOR[pos.trim().toLowerCase()] ?? "—";
}

/**
 * Cor do setor. Quatro cores de CATEGORIA (§2 da identidade), nenhuma delas
 * ouro: o setor de um jogador é classificação, não recompensa, e um goleiro
 * dourado em toda linha da tabela gastaria o único acento que a casa reserva
 * para artilheiro, craque e prêmio.
 */
export function corSetor(s: Setor): string {
  return s === "GOL" ? LARANJA : s === "DEF" ? CIANO : s === "MEI" ? VIOLETA : LIMA;
}
