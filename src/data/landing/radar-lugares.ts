/**
 * Os lugares do Radar FayAI e a câmera de cada um.
 *
 * A navegação tem três degraus, e o degrau define o que aparece no globo:
 *   mundo   → países           (altitude alta)
 *   pais    → regiões do Brasil (as 5 do IBGE)
 *   regiao  → estados daquela região
 *
 * Cada lugar carrega o `geo` do Google Trends — `BR`, `BR-SP`, `US`... — que é
 * o que transforma "cliquei no Sudeste" em "isto está em alta no Sudeste".
 * Verificado em 26/07/2026: os 27 estados e todos os países testados respondem.
 *
 * As coordenadas são o centro visual de cada área (não o centroide geométrico,
 * que em estados côncavos cai fora da terra) e a altitude é o enquadramento.
 */

export type Degrau = "mundo" | "pais" | "regiao" | "estado";

export interface Lugar {
  id: string;
  nome: string;
  /** Código de região do Google Trends. null = só serve de moldura no mapa. */
  geo: string | null;
  /** Idioma da Wikipedia para o cruzamento de leitura. null = sem cruzamento. */
  wiki: string | null;
  lat: number;
  lng: number;
  /** Altitude da câmera ao focar aqui (raios do globo acima da superfície). */
  alt: number;
  degrau: Degrau;
  /** Onde este lugar está contido — dá o caminho de volta (a trilha). */
  pai: string | null;
  cor: string;
}

// Paleta funcional do IDENTIDADE_VISUAL.md §2 — cada região do Brasil ganha uma
// cor de categoria, que é o que faz o mapa parecer político e não decorativo.
export const COR_REGIAO: Record<string, string> = {
  N: "#a3e635",
  NE: "#f5c04e",
  SE: "#38bdf8",
  S: "#a78bfa",
  CO: "#f472b6",
};

const UF: Array<[string, string, string, number, number]> = [
  // sigla, nome, região, lat, lng
  ["AC", "Acre", "N", -9.0, -70.5],
  ["AL", "Alagoas", "NE", -9.6, -36.6],
  ["AM", "Amazonas", "N", -4.2, -64.0],
  ["AP", "Amapá", "N", 1.4, -51.8],
  ["BA", "Bahia", "NE", -12.5, -41.7],
  ["CE", "Ceará", "NE", -5.2, -39.5],
  ["DF", "Distrito Federal", "CO", -15.8, -47.8],
  ["ES", "Espírito Santo", "SE", -19.6, -40.3],
  ["GO", "Goiás", "CO", -15.9, -49.6],
  ["MA", "Maranhão", "NE", -5.0, -45.3],
  ["MG", "Minas Gerais", "SE", -18.6, -44.6],
  ["MS", "Mato Grosso do Sul", "CO", -20.5, -54.6],
  ["MT", "Mato Grosso", "CO", -13.0, -55.9],
  ["PA", "Pará", "N", -4.3, -52.8],
  ["PB", "Paraíba", "NE", -7.2, -36.6],
  ["PE", "Pernambuco", "NE", -8.4, -37.9],
  ["PI", "Piauí", "NE", -7.4, -42.8],
  ["PR", "Paraná", "S", -24.6, -51.6],
  ["RJ", "Rio de Janeiro", "SE", -22.2, -42.6],
  ["RN", "Rio Grande do Norte", "NE", -5.8, -36.6],
  ["RO", "Rondônia", "N", -10.9, -63.0],
  ["RR", "Roraima", "N", 2.1, -61.4],
  ["RS", "Rio Grande do Sul", "S", -29.7, -53.3],
  ["SC", "Santa Catarina", "S", -27.2, -50.4],
  ["SE", "Sergipe", "NE", -10.6, -37.4],
  ["SP", "São Paulo", "SE", -22.2, -48.7],
  ["TO", "Tocantins", "N", -10.2, -48.3],
];

const REGIOES: Array<[string, string, number, number, number]> = [
  // sigla, nome, lat, lng, altitude
  ["N", "Norte", -5.0, -58.5, 0.72],
  ["NE", "Nordeste", -9.0, -41.5, 0.62],
  ["SE", "Sudeste", -20.0, -45.5, 0.46],
  ["S", "Sul", -27.5, -51.5, 0.42],
  ["CO", "Centro-Oeste", -15.0, -53.5, 0.62],
];

// Países com trending confirmado. A lista é curta de propósito: cada um vira um
// pedido HTTP, e um globo com 200 países acesos não diz mais do que um com 16.
const PAISES: Array<[string, string, string, number, number]> = [
  ["BR", "Brasil", "pt", -12, -52],
  ["US", "Estados Unidos", "en", 39, -98],
  ["PT", "Portugal", "pt", 39.5, -8],
  ["GB", "Reino Unido", "en", 54, -2],
  ["ES", "Espanha", "es", 40, -3.5],
  ["FR", "França", "fr", 46.5, 2.5],
  ["DE", "Alemanha", "de", 51, 10],
  ["IT", "Itália", "it", 42.8, 12.5],
  ["AR", "Argentina", "es", -35, -65],
  ["MX", "México", "es", 23.5, -102],
  ["CA", "Canadá", "en", 56, -106],
  ["IN", "Índia", "en", 22, 79],
  ["JP", "Japão", "ja", 36.5, 138],
  ["KR", "Coreia do Sul", "ko", 36.5, 127.8],
  ["AU", "Austrália", "en", -25, 134],
  ["ZA", "África do Sul", "en", -29, 24],
  ["NG", "Nigéria", "en", 9, 8],
];

export const LUGARES: Lugar[] = [
  {
    id: "mundo",
    nome: "Mundo",
    geo: null,
    wiki: null,
    lat: -12,
    lng: -52,
    alt: 2.15,
    degrau: "mundo",
    pai: null,
    cor: "#f5c04e",
  },
  ...PAISES.map(([iso, nome, wiki, lat, lng]) => ({
    id: iso,
    nome,
    geo: iso,
    wiki,
    lat,
    lng,
    alt: iso === "BR" ? 1.35 : 1.5,
    degrau: "pais" as Degrau,
    pai: "mundo",
    cor: iso === "BR" ? "#f5c04e" : "#38bdf8",
  })),
  ...REGIOES.map(([sigla, nome, lat, lng, alt]) => ({
    id: `BR-r-${sigla}`,
    nome,
    // Uma região não é uma geo do Trends: ela é medida pelos estados que a
    // compõem, agregados no servidor.
    geo: null,
    wiki: null,
    lat,
    lng,
    alt,
    degrau: "regiao" as Degrau,
    pai: "BR",
    cor: COR_REGIAO[sigla],
  })),
  ...UF.map(([sigla, nome, regiao, lat, lng]) => ({
    id: `BR-${sigla}`,
    nome,
    geo: `BR-${sigla}`,
    wiki: null,
    lat,
    lng,
    alt: 0.3,
    degrau: "estado" as Degrau,
    pai: `BR-r-${regiao}`,
    cor: COR_REGIAO[regiao],
  })),
];

const PORID = new Map(LUGARES.map((l) => [l.id, l]));

export function getLugar(id: string | null | undefined): Lugar {
  return (id && PORID.get(id)) || PORID.get("mundo")!;
}

/** Os estados de uma região — é o que o servidor agrega para medir a região. */
export function estadosDaRegiao(sigla: string): string[] {
  return UF.filter(([, , r]) => r === sigla).map(([s]) => `BR-${s}`);
}

/** Filhos diretos de um lugar — o que o globo desenha no degrau seguinte. */
export function filhosDe(id: string): Lugar[] {
  return LUGARES.filter((l) => l.pai === id);
}

/** Caminho da raiz até o lugar — vira a trilha de navegação. */
export function trilhaDe(id: string): Lugar[] {
  const out: Lugar[] = [];
  let atual: Lugar | undefined = PORID.get(id);
  while (atual) {
    out.unshift(atual);
    atual = atual.pai ? PORID.get(atual.pai) : undefined;
  }
  return out;
}

export const PAISES_COM_DADO = new Set(PAISES.map(([iso]) => iso));

/**
 * A preposição de lugar em português não tem regra — "no Acre" e "em Alagoas"
 * são os dois estados, "na Bahia" e "em Goiás" idem. Por isso é tabela e não
 * heurística: um "em Brasil" na tela faz a página inteira parecer traduzida
 * por máquina, e essa desconfiança contamina o número que está ao lado.
 * O padrão é "em" (o caso dos nomes sem artigo), e a tabela lista as exceções.
 */
const PREPOSICAO: Record<string, string> = {
  mundo: "no",
  // Países
  BR: "no", US: "nos", GB: "no", ES: "na", FR: "na", DE: "na", IT: "na",
  AR: "na", MX: "no", CA: "no", IN: "na", JP: "no", KR: "na", AU: "na",
  ZA: "na", NG: "na",
  // Regiões do Brasil
  "BR-r-N": "no", "BR-r-NE": "no", "BR-r-SE": "no", "BR-r-S": "no", "BR-r-CO": "no",
  // Estados — só os que levam artigo
  "BR-AC": "no", "BR-AM": "no", "BR-AP": "no", "BR-BA": "na", "BR-CE": "no",
  "BR-DF": "no", "BR-ES": "no", "BR-MA": "no", "BR-MS": "no", "BR-MT": "no",
  "BR-PA": "no", "BR-PB": "na", "BR-PI": "no", "BR-PR": "no", "BR-RJ": "no",
  "BR-RN": "no", "BR-RS": "no", "BR-TO": "no",
};

/** "no Brasil", "na Bahia", "em Goiás" — o nome já com a preposição certa. */
export function noLugar(lugar: Lugar): string {
  return `${PREPOSICAO[lugar.id] ?? "em"} ${lugar.nome}`;
}
