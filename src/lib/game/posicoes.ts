/**
 * TAXONOMIA DE POSIÇÕES do Mercado — a linguagem que a comunidade já usa.
 *
 * Por que este arquivo existe, e por que a lista é CURTA:
 *
 * Os grupos de Pro Clubs no Facebook recrutam numa gíria grossa e estável.
 * O cartaz típico diz "VAGAS SOMENTE PARA VOL, LT E ZG" — não "CDM, LWB, CB".
 * Se o Mercado oferecesse as dezessete posições que a EA distingue (GK, RWB,
 * CDM, CAM, LF…), o filtro ficaria intransitável e ninguém marcaria a própria
 * vaga com a etiqueta certa. Então a lista aqui são os SETE papéis que a
 * comunidade de fato pede, mais "qualquer posição" — o que casa com o print do
 * grupo (Goleiro, Zagueiro, Lateral, Meio-campo, Ponta, Atacante) e com a
 * gíria dos cartazes (GOL/ZAG/LAT/VOL/MEI/PON/ATA).
 *
 * Cada posição carrega o SETOR (`Setor` de `tema.ts`) para herdar a cor da
 * casa — o goleiro é laranja, a defesa é ciano, o meio é violeta, o ataque é
 * lima, em toda a seção, sem uma cor nova por tela.
 */

import type { Setor } from "./tema";

export interface Posicao {
  /** Código canônico, gravado no banco. Nunca muda. */
  code: string;
  /** Sigla curta, do jeito que o cartaz do grupo escreve. */
  sigla: string;
  /** Nome cheio em pt-BR. */
  nome: string;
  /** Nome cheio em inglês. */
  nomeEn: string;
  /** Setor, para herdar a cor da casa (`corSetor`). */
  setor: Setor;
}

/**
 * As sete posições da gíria + "qualquer". A ordem é a do campo, de trás para
 * frente — é como a pessoa lê um time, e como o filtro fica intuitivo.
 */
export const POSICOES: Posicao[] = [
  { code: "GOL", sigla: "GOL", nome: "Goleiro", nomeEn: "Goalkeeper", setor: "GOL" },
  { code: "ZAG", sigla: "ZAG", nome: "Zagueiro", nomeEn: "Centre-back", setor: "DEF" },
  { code: "LAT", sigla: "LAT", nome: "Lateral", nomeEn: "Full-back", setor: "DEF" },
  { code: "VOL", sigla: "VOL", nome: "Volante", nomeEn: "Defensive mid", setor: "MEI" },
  { code: "MEI", sigla: "MEI", nome: "Meia", nomeEn: "Midfielder", setor: "MEI" },
  { code: "PON", sigla: "PON", nome: "Ponta", nomeEn: "Winger", setor: "ATA" },
  { code: "ATA", sigla: "ATA", nome: "Atacante", nomeEn: "Striker", setor: "ATA" },
  { code: "TODAS", sigla: "TODAS", nome: "Todas as posições", nomeEn: "All positions", setor: "—" },
];

const POR_CODE = new Map(POSICOES.map((p) => [p.code, p]));

/** Só os códigos válidos — para validar o que chega da API. */
export const CODIGOS_POSICAO = POSICOES.map((p) => p.code);

/** Devolve a posição pelo código, ou `undefined`. */
export function posicaoPorCode(code: string): Posicao | undefined {
  return POR_CODE.get(code);
}

/** Filtra e normaliza uma lista de códigos vinda do cliente. */
export function normalizarPosicoes(entrada: unknown): string[] {
  if (!Array.isArray(entrada)) return [];
  const limpas = entrada
    .map((c) => String(c).trim().toUpperCase())
    .filter((c) => POR_CODE.has(c));
  // "TODAS" sozinha vale; combinada com outras, as outras é que importam.
  const semTodas = limpas.filter((c) => c !== "TODAS");
  const unicas = [...new Set(semTodas.length ? semTodas : limpas)];
  return unicas.slice(0, 6);
}

/**
 * A EA manda a posição favorita do jogador num formato próprio ("midfielder",
 * "5", "cb"…). Aqui ela vira um dos nossos sete códigos, para pré-preencher a
 * vaga de quem reivindicou o jogador. O mapa reaproveita `setorDaPosicao` de
 * `tema.ts` no que dá, e resolve os casos que o setor não separa (lateral x
 * zagueiro, volante x meia, ponta x atacante).
 */
const EA_PARA_CODE: Record<string, string> = {
  goalkeeper: "GOL", gk: "GOL", "0": "GOL",
  defender: "ZAG", cb: "ZAG",
  lb: "LAT", rb: "LAT", lwb: "LAT", rwb: "LAT",
  cdm: "VOL", defensivemid: "VOL",
  cm: "MEI", cam: "MEI", lm: "MEI", rm: "MEI", midfielder: "MEI", attackingmid: "MEI",
  lw: "PON", rw: "PON", lf: "PON", rf: "PON", winger: "PON",
  st: "ATA", cf: "ATA", striker: "ATA", forward: "ATA",
};

export function codeDaPosicaoEA(pos: string | null | undefined): string | null {
  if (!pos) return null;
  const k = String(pos).trim().toLowerCase();
  return EA_PARA_CODE[k] ?? null;
}

/** Rótulo curto de uma lista de posições, para card e cartaz. Ex.: "VOL · LAT · ZAG". */
export function rotuloPosicoes(codes: string[]): string {
  if (codes.length === 0) return "TODAS";
  return codes.map((c) => POR_CODE.get(c)?.sigla ?? c).join(" · ");
}
