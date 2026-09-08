/**
 * O SIMULADOR DE PARTIDA do Winners 22 — 08/09/2026.
 *
 * Tudo aqui é FUNÇÃO PURA e DETERMINÍSTICA: mesma semente, mesmo jogo, para
 * sempre. Não é preciosismo — é o que torna a aposta auditável. Quem apostou
 * pode reexecutar a partida com a semente revelada e chegar ao mesmo placar,
 * gol a gol. Um simulador que sorteia de `Math.random()` não tem como provar
 * que não foi mexido depois que as apostas entraram.
 *
 * ## Por que NÃO é um Poisson (o erro que quase entrou aqui)
 *
 * A literatura de futebol usa Poisson (e Dixon-Coles). Pro Clubs **não é
 * futebol**. Medido em 08/09/2026 contra as 215 partidas do nosso espelho
 * (`game_ea_partidas`), e depois contra as 138 que são partida inteira:
 *
 * | Grandeza                   | Futebol real | Pro Clubs (medido) |
 * |----------------------------|--------------|--------------------|
 * | gols por clube por partida | ~1,35        | **2,507**          |
 * | índice de dispersão (var/média) | ~1,0    | **1,82**           |
 * | empates                    | ~25%         | **2,2%**           |
 * | os dois marcam (BTTS)      | ~50%         | **61,6%**          |
 *
 * O índice de dispersão é o que condena o Poisson: no Poisson a variância é
 * igual à média (índice 1,0). Aqui ela é quase o DOBRO. Um Poisson calibrado
 * na média certa erraria a cauda inteira — e a cauda é exatamente onde moram
 * os mercados de "mais de 5,5 gols" e "goleada". Por isso o modelo é
 * **Binomial Negativa**, que é um Poisson cuja taxa é ela mesma sorteada
 * (mistura Poisson-Gama) e portanto admite variância maior que a média.
 *
 * ## O achado que limpou os números: o 3–0 não é placar, é ata
 *
 * Na primeira medição, 26,5% de TODAS as partidas terminavam exatamente 3–0 e
 * o "mais de 2,5 gols" aparecia com 89% de acerto — o que faria dele um
 * mercado sem risco nenhum. O motivo: **a EA registra abandono como 3–0**.
 * Metade dessas partidas durou menos de dois minutos de jogo.
 *
 * `winnerByDnf` NÃO basta para pegá-las: das 57 partidas 3–0, só 21 traziam a
 * marca. O que pega é a DURAÇÃO — `secondsPlayed` do jogador que mais ficou em
 * campo. Partida inteira fica em ~5.532s; W.O. fica em 35s, 126s, 337s.
 * Daí `DURACAO_MINIMA_VALIDA` e `ehWalkover()` mais abaixo, e daí o fato de
 * todas as constantes deste arquivo saírem das 138 partidas inteiras, nunca
 * das 215 brutas.
 *
 * Sem essa limpeza, o preço de todo mercado de gols nasceria torto — e o
 * simulador copiaria para dentro do nosso campeonato um pico de 3–0 que é
 * burocracia da EA, não futebol.
 */

/* ------------------------------------------------------------------ */
/* As constantes, e de onde cada uma veio                              */
/* ------------------------------------------------------------------ */

/**
 * Gols por clube por partida, média das 138 partidas INTEIRAS do espelho.
 * (As 215 brutas dariam 2,253 — puxado para baixo pelos 0 dos abandonos.)
 */
export const MEDIA_GOLS_CLUBE = 2.507;

/**
 * Índice de dispersão medido (variância ÷ média) = 4,562 ÷ 2,507.
 * É o número que exige Binomial Negativa no lugar de Poisson. Tem de ser > 1;
 * se uma recalibração devolver ≤ 1, o modelo degenera para Poisson puro e
 * `nbPmf` trata esse caso.
 */
export const DISPERSAO = 1.82;

/**
 * Duração mínima, em segundos, para uma partida da EA contar como futebol.
 * O histograma medido é bimodal: 116 partidas entre 90 e 100 minutos, e um
 * bolsão de abandonos abaixo de 50. O corte em 4.500s (75 min) fica no vale
 * entre os dois — não há partida legítima de 60 minutos no Clubs.
 */
export const DURACAO_MINIMA_VALIDA = 4500;

/**
 * Vantagem de mando, em multiplicador da taxa de gols do mandante.
 * ⚠️ **Não é medido**: no Clubs não existe mando de campo de verdade, e o
 * espelho não distingue casa de fora. Fica em 1,0 (nenhuma vantagem) de
 * propósito — inventar 1,15 aqui seria dar ao mandante um favorecimento que
 * o jogo não tem, e o apostador pagaria por ele.
 */
export const VANTAGEM_MANDO = 1.0;

/**
 * Deflator do empate. A Binomial Negativa independente produz mais empates do
 * que o Clubs entrega (o jogo quase não empata: 2,2% medido). Este fator
 * multiplica a diagonal da matriz de placares antes da renormalização.
 *
 * ⚠️ Calibrado, não medido diretamente: 2,2% vem de 3 empates em 138 partidas,
 * e 3 ocorrências não sustentam três casas decimais. `scripts/game/_teste/
 * simulacao.ts` reporta o empate do modelo contra a faixa medida a cada
 * execução — se a coleta crescer e a faixa mudar, o portão avisa.
 */
export const DEFLATOR_EMPATE = 0.45;

/** Teto de gols por clube na matriz de placares. 12 foi o máximo observado. */
export const MAX_GOLS = 12;

/* ------------------------------------------------------------------ */
/* Sorteio determinístico                                              */
/* ------------------------------------------------------------------ */

/**
 * Gerador determinístico (mulberry32). Escolhido por ser curto o bastante
 * para caber numa página de auditoria: quem quiser conferir o resultado de uma
 * partida reescreve estas seis linhas em qualquer linguagem e chega ao mesmo
 * lugar. Não é criptográfico — não precisa ser; a imprevisibilidade vem da
 * semente comprometida por hash, não do gerador.
 */
export function criarSorteio(semente: number): () => number {
  let a = semente >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente estável a partir de um texto (FNV-1a). Mesma string, mesma semente. */
export function sementeDeTexto(texto: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/* ------------------------------------------------------------------ */
/* Binomial Negativa                                                   */
/* ------------------------------------------------------------------ */

/** log Γ(x) por Lanczos. Precisa ser contínuo: o `r` da NB não é inteiro. */
function lgamma(x: number): number {
  const g = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    // Reflexão: Γ(x)Γ(1−x) = π / sen(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < g.length; i++) a += g[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * P(X = k) para X ~ Binomial Negativa com média `lambda` e índice de dispersão
 * `phi` (variância = phi · lambda).
 *
 * A parametrização por dispersão é de propósito: `phi` é a grandeza que a
 * gente MEDE no espelho (variância ÷ média). Convertê-la para o `r` da
 * literatura é conta interna, não decisão de quem chama.
 *
 * Com `phi` ≤ 1 não há mistura possível e a função devolve o Poisson — que é
 * o limite correto, não um caso de erro.
 */
export function nbPmf(k: number, lambda: number, phi: number = DISPERSAO): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  if (phi <= 1.0001) {
    // Poisson: exp(−λ) λ^k / k!
    return Math.exp(-lambda + k * Math.log(lambda) - lgamma(k + 1));
  }
  const r = lambda / (phi - 1); // var = λ + λ²/r  ⇒  φ = 1 + λ/r
  const p = r / (r + lambda);
  return Math.exp(
    lgamma(k + r) - lgamma(r) - lgamma(k + 1) + r * Math.log(p) + k * Math.log(1 - p)
  );
}

/** Sorteia um inteiro da Binomial Negativa por inversão da acumulada. */
export function sortearGols(
  lambda: number,
  phi: number,
  sorteio: () => number
): number {
  const u = sorteio();
  let acumulado = 0;
  for (let k = 0; k <= MAX_GOLS; k++) {
    acumulado += nbPmf(k, lambda, phi);
    if (u <= acumulado) return k;
  }
  return MAX_GOLS;
}

/**
 * Sorteia o PLACAR direto da matriz de placares, por inversão da acumulada
 * sobre a tabela achatada.
 *
 * ## Por que não se sorteia um lado de cada vez (o defeito que o §5 pegou)
 *
 * A primeira versão sorteava os gols do mandante e do visitante em dois
 * `sortearGols` independentes. Parecia idêntico e não era: a matriz que
 * PRECIFICA aplica o `DEFLATOR_EMPATE` na diagonal, e dois sorteios
 * independentes não aplicam nada. O portão de coerência mediu a diferença —
 * o simulador empatava 10,96% das vezes num confronto cotado a 5,29%.
 *
 * Traduzindo: o apostador comprava "empate" a odd de 5% e o jogo entregava
 * empate 11% das vezes. Um erro desses não aparece em tela, não gera exceção,
 * e drena a casa (ou o apostador, se o sinal fosse o outro) em silêncio.
 *
 * A correção não foi copiar o deflator para dentro do sorteio — foi tirar do
 * simulador o direito de ter distribuição própria. Ele sorteia da MESMA tabela
 * que gerou o preço, então preço e jogo são o mesmo objeto por construção, e
 * não por coincidência que alguém precise manter.
 */
export function sortearPlacar(
  matriz: number[][],
  sorteio: () => number
): [number, number] {
  const u = sorteio();
  let acumulado = 0;
  for (let i = 0; i <= MAX_GOLS; i++) {
    for (let j = 0; j <= MAX_GOLS; j++) {
      acumulado += matriz[i][j];
      if (u <= acumulado) return [i, j];
    }
  }
  return [MAX_GOLS, MAX_GOLS];
}

/* ------------------------------------------------------------------ */
/* Força do time                                                       */
/* ------------------------------------------------------------------ */

/**
 * O que o simulador precisa saber de um time. Os campos vêm do espelho da EA
 * (`GameEaClube`), mas o tipo não menciona a EA — um time cadastrado na mão
 * entra aqui com os mesmos números e o motor não sabe a diferença.
 */
export interface EntradaForca {
  id: string;
  nome: string;
  /** Gols marcados e sofridos na campanha, e quantos jogos ela tem. */
  gols?: number;
  golsSofridos?: number;
  jogos?: number;
  vitorias?: number;
  empates?: number;
  derrotas?: number;
  /** `skillRating` da EA, quando existe. Entra como desempate suave. */
  skillRating?: number;
  /** Divisão atual (1 = a mais alta). */
  divisao?: number;
}

export interface ForcaTime {
  id: string;
  nome: string;
  /** Multiplicador de ataque: 1,0 = exatamente a média da liga. */
  ataque: number;
  /** Multiplicador de defesa: 1,0 = média; ABAIXO de 1 é defesa BOA. */
  defesa: number;
  /** Nota 0–100 só para exibição e para o pareamento. Não entra na conta. */
  nota: number;
  /** Quanta partida sustenta esses números. Pouca amostra = mais encolhimento. */
  amostra: number;
}

/**
 * Encolhimento para a média (James-Stein pobre): um clube com 3 jogos não pode
 * ditar preço como um clube com 300. `PESO_ENCOLHIMENTO` é o número de jogos
 * fictícios "na média" que todo clube carrega — com 10 jogos reais, o clube
 * fica meio a meio entre a campanha dele e a média da liga.
 */
const PESO_ENCOLHIMENTO = 10;

/**
 * A referência contra a qual a força é medida: quanto o CONJUNTO de clubes
 * disputados marca e sofre por jogo.
 *
 * ## Por que a referência não pode ser uma constante (o defeito medido)
 *
 * A primeira versão dividia tudo por `MEDIA_GOLS_CLUBE` (2,507, medido em
 * partidas inteiras do espelho). Parecia certo e produziu, na primeira tela
 * de verdade, **oito clubes com nota 99 e defesa 0,45 em todos**.
 *
 * O motivo: os clubes que temos no espelho são os do RANKING — os 100
 * melhores. Eles marcam 3,70 e sofrem 0,99 por jogo. Contra a média geral,
 * cada um deles é um super-time; e a defesa, dividida por 2,507, batia no
 * piso do limitador e ficava idêntica para quase todo mundo. Uma nota que dá
 * 99 para todos não é nota, e um preço tirado de uma defesa grudada no piso
 * não distingue o confronto.
 *
 * A força de um time é **relativa aos adversários dele**, que é exatamente o
 * que Dixon-Coles faz com "ataque e defesa relativos à liga". Aqui a liga é o
 * conjunto de clubes de onde a rodada é sorteada.
 *
 * ## O brinde: o W.O. sai sozinho da conta
 *
 * O `goals`/`goalsAgainst` da EA é acumulado de carreira e inclui os 3–0 de
 * abandono, que a gente não tem como separar (a EA só dá o total). Sendo a
 * medida RELATIVA, a contaminação é quase toda comum a todos os clubes do
 * conjunto e se cancela na divisão. Contra uma constante externa, ela não
 * se cancelaria — entraria inteira no preço.
 */
export interface ReferenciaDaLiga {
  marcadosPorJogo: number;
  sofridosPorJogo: number;
}

/** A referência-padrão: a média medida do Clubs. Vale quando não há conjunto. */
export const REFERENCIA_GLOBAL: ReferenciaDaLiga = {
  marcadosPorJogo: MEDIA_GOLS_CLUBE,
  sofridosPorJogo: MEDIA_GOLS_CLUBE,
};

/**
 * A referência de um conjunto de clubes — o que `montarRodada` calcula do
 * próprio elenco de candidatos antes de parear ninguém.
 */
export function referenciaDoConjunto(
  clubes: Array<{ gols?: number; golsSofridos?: number; jogos?: number }>
): ReferenciaDaLiga {
  let gols = 0;
  let sofridos = 0;
  let jogos = 0;
  for (const c of clubes) {
    if (!c.jogos || c.jogos <= 0) continue;
    gols += c.gols ?? 0;
    sofridos += c.golsSofridos ?? 0;
    jogos += c.jogos;
  }
  if (jogos === 0) return REFERENCIA_GLOBAL;
  // Ponderado por jogos, não média das médias: um clube de 700 partidas
  // descreve a liga melhor que um de 16, e a média simples daria aos dois o
  // mesmo voto.
  return { marcadosPorJogo: gols / jogos, sofridosPorJogo: sofridos / jogos };
}

/**
 * Converte a campanha de um clube em multiplicadores de ataque e defesa,
 * relativos à `referencia` do conjunto em que ele vai jogar.
 *
 * Os limites de 0,45 a 2,2 não são estética: sem eles, um clube com 2 jogos e
 * 14 gols vira ataque 2,8, o simulador cospe 8×0 toda vez e o mercado de
 * "menos de 5,5" fica sem preço possível. O teto também protege o apostador do
 * clube que goleou dois times abandonados e parece invencível.
 *
 * ⚠️ Com a referência certa, bater no limitador passa a ser exceção. Se muitos
 * times de uma rodada saírem em 0,45 ou 2,2, o sinal não é "ajustar o
 * limitador" — é que a referência não corresponde ao conjunto.
 */
export function calcularForca(
  e: EntradaForca,
  referencia: ReferenciaDaLiga = REFERENCIA_GLOBAL
): ForcaTime {
  const jogos = Math.max(0, e.jogos ?? 0);
  const peso = jogos / (jogos + PESO_ENCOLHIMENTO);

  const marcadosPorJogo = jogos > 0 ? (e.gols ?? 0) / jogos : referencia.marcadosPorJogo;
  const sofridosPorJogo = jogos > 0 ? (e.golsSofridos ?? 0) / jogos : referencia.sofridosPorJogo;

  // Encolhe para 1,0 (a média do conjunto) na proporção da amostra que falta.
  const bruto = (x: number, base: number) => 1 + peso * (x / base - 1);
  const limitar = (x: number) => Math.min(2.2, Math.max(0.45, x));

  let ataque = limitar(bruto(marcadosPorJogo, referencia.marcadosPorJogo));
  let defesa = limitar(bruto(sofridosPorJogo, referencia.sofridosPorJogo));

  // A divisão é o sinal mais barato de nível que a EA dá, e ela sobrevive à
  // troca de temporada — entra como um empurrão de ±8%, nunca como o principal.
  if (e.divisao && e.divisao >= 1 && e.divisao <= 10) {
    const empurrao = 1 + (5.5 - e.divisao) * 0.016;
    ataque = limitar(ataque * empurrao);
    defesa = limitar(defesa / empurrao);
  }

  // A nota é só rótulo: ataque bom sobe, defesa que sofre pouco sobe.
  const nota = Math.round(
    Math.min(99, Math.max(1, 50 + (ataque - 1) * 45 + (1 - defesa) * 45))
  );

  return { id: e.id, nome: e.nome, ataque, defesa, nota, amostra: jogos };
}

/* ------------------------------------------------------------------ */
/* Equilíbrio — o pedido do Ricardo: "partida evenly distributed"      */
/* ------------------------------------------------------------------ */

/**
 * Aproxima as duas forças na proporção `equilibrio` (0 = como são, 1 = os dois
 * exatamente iguais).
 *
 * Existe porque um cardápio de apostas cheio de 92%×8% não é um jogo, é uma
 * lista de resultados. Puxando as forças uma para a outra, quase toda partida
 * fica na faixa em que o palpite vale alguma coisa.
 *
 * ⚠️ O equilíbrio é aplicado ANTES de precificar, e a odd sai da força já
 * equilibrada. Ou seja: a gente aproxima o JOGO, nunca maquia o PREÇO de um
 * jogo desigual. Fazer o contrário — simular desigual e cotar como se fosse
 * parelho — seria vender ao apostador uma chance que ele não tem.
 */
export function equilibrar(
  a: ForcaTime,
  b: ForcaTime,
  equilibrio: number
): [ForcaTime, ForcaTime] {
  const k = Math.min(1, Math.max(0, equilibrio));
  if (k === 0) return [a, b];
  const puxar = (x: number, y: number) => {
    const meio = (x + y) / 2;
    return x + (meio - x) * k;
  };
  return [
    { ...a, ataque: puxar(a.ataque, b.ataque), defesa: puxar(a.defesa, b.defesa) },
    { ...b, ataque: puxar(b.ataque, a.ataque), defesa: puxar(b.defesa, a.defesa) },
  ];
}

/**
 * As taxas de gol esperadas do confronto. É a única porta entre "força" e
 * "probabilidade": tudo — matriz de placares, odds, simulação — nasce daqui,
 * então uma mudança de modelo tem um lugar só para acontecer.
 */
export function taxasDoConfronto(
  mandante: ForcaTime,
  visitante: ForcaTime
): { lambdaMandante: number; lambdaVisitante: number } {
  return {
    lambdaMandante:
      MEDIA_GOLS_CLUBE * mandante.ataque * visitante.defesa * VANTAGEM_MANDO,
    lambdaVisitante: MEDIA_GOLS_CLUBE * visitante.ataque * mandante.defesa,
  };
}

/* ------------------------------------------------------------------ */
/* A matriz de placares                                                */
/* ------------------------------------------------------------------ */

/**
 * `matriz[i][j]` = probabilidade de terminar i × j. É a fonte ÚNICA de toda
 * probabilidade de mercado de resultado e de gols — 1X2, dupla chance, mais/
 * menos, os dois marcam, handicap, placar exato e margem saem todos daqui,
 * por soma de células.
 *
 * Fazer assim não é elegância: é a garantia de que os mercados não se
 * contradizem. Quando cada mercado tem o próprio modelo, "mais de 2,5" e
 * "placar exato" acabam discordando sobre o mesmo jogo, e o apostador acha
 * (com razão) a arbitragem que a casa não viu.
 */
export function matrizPlacares(
  lambdaMandante: number,
  lambdaVisitante: number,
  phi: number = DISPERSAO,
  deflatorEmpate: number = DEFLATOR_EMPATE
): number[][] {
  const pM: number[] = [];
  const pV: number[] = [];
  for (let k = 0; k <= MAX_GOLS; k++) {
    pM.push(nbPmf(k, lambdaMandante, phi));
    pV.push(nbPmf(k, lambdaVisitante, phi));
  }

  const m: number[][] = [];
  let soma = 0;
  for (let i = 0; i <= MAX_GOLS; i++) {
    m[i] = [];
    for (let j = 0; j <= MAX_GOLS; j++) {
      const celula = pM[i] * pV[j] * (i === j ? deflatorEmpate : 1);
      m[i][j] = celula;
      soma += celula;
    }
  }
  // Renormaliza: o deflator e o corte em MAX_GOLS tiram massa da tabela.
  for (let i = 0; i <= MAX_GOLS; i++) {
    for (let j = 0; j <= MAX_GOLS; j++) m[i][j] /= soma;
  }
  return m;
}

/* ------------------------------------------------------------------ */
/* A partida                                                           */
/* ------------------------------------------------------------------ */

/** Um jogador do elenco, como o simulador precisa dele. */
export interface JogadorSimulado {
  gamertag: string;
  posicao: "goalkeeper" | "defender" | "midfielder" | "forward";
  /** Gols por jogo na carreira. Sem isso, cai na média da posição. */
  golsPorJogo?: number;
  assistenciasPorJogo?: number;
  nota?: number;
  /** Conta FayAI do dono da gamertag, quando ela foi reivindicada. */
  userId?: string;
}

export interface LanceSimulado {
  minuto: number;
  tipo: "gol" | "defesa" | "cartao";
  timeId: string;
  gamertag: string;
  assistenteGamertag?: string;
}

export interface EstatisticaJogadorSimulado {
  gamertag: string;
  timeId: string;
  posicao: string;
  gols: number;
  assistencias: number;
  chutes: number;
  passes: number;
  desarmes: number;
  defesas: number;
  nota: number;
  craque: boolean;
}

export interface PartidaSimulada {
  semente: number;
  golsMandante: number;
  golsVisitante: number;
  lances: LanceSimulado[];
  jogadores: EstatisticaJogadorSimulado[];
  craque?: { gamertag: string; timeId: string };
  /** As taxas usadas — vão no laudo para quem quiser refazer a conta. */
  lambdaMandante: number;
  lambdaVisitante: number;
}

/**
 * Peso de cada posição na hora de repartir os gols do time.
 *
 * Medido nas 3.452 linhas de jogador do espelho: dos 3.452, só 563 marcaram
 * ao menos um gol, e a distribuição por posição é a que estes pesos imitam.
 * Um goleiro tem peso 0,02 e não 0 de propósito — gol de goleiro acontece no
 * Clubs, e um mercado que jura que é impossível é um mercado que vai quebrar.
 */
const PESO_GOL_POR_POSICAO: Record<string, number> = {
  forward: 1.0,
  midfielder: 0.45,
  defender: 0.12,
  goalkeeper: 0.02,
};

const PESO_ASSISTENCIA_POR_POSICAO: Record<string, number> = {
  forward: 0.55,
  midfielder: 1.0,
  defender: 0.3,
  goalkeeper: 0.03,
};

/** Sorteia um índice segundo pesos. Pesos zerados devolvem −1. */
function sortearPorPeso(pesos: number[], sorteio: () => number): number {
  const total = pesos.reduce((s, p) => s + p, 0);
  if (total <= 0) return -1;
  let u = sorteio() * total;
  for (let i = 0; i < pesos.length; i++) {
    u -= pesos[i];
    if (u <= 0) return i;
  }
  return pesos.length - 1;
}

/**
 * Joga a partida.
 *
 * A ordem importa e é esta: primeiro o PLACAR sai da mesma distribuição que
 * precificou os mercados, depois os gols são repartidos entre os jogadores.
 * O contrário — simular jogador por jogador e somar — daria um placar com
 * outra distribuição da que foi cotada, e o mercado de gols mentiria.
 */
export function simularPartida(params: {
  semente: number;
  mandante: ForcaTime;
  visitante: ForcaTime;
  elencoMandante: JogadorSimulado[];
  elencoVisitante: JogadorSimulado[];
  phi?: number;
  /**
   * A matriz do confronto, quando quem chama já a tem. É só desempenho: o
   * Monte Carlo do cardápio roda milhares de partidas do MESMO confronto e
   * remontaria a mesma tabela a cada uma. Omitir muda nada no resultado.
   */
  matriz?: number[][];
}): PartidaSimulada {
  const { semente, mandante, visitante, phi = DISPERSAO } = params;
  const sorteio = criarSorteio(semente);
  const { lambdaMandante, lambdaVisitante } = taxasDoConfronto(mandante, visitante);

  const matriz =
    params.matriz ?? matrizPlacares(lambdaMandante, lambdaVisitante, phi);
  const [golsMandante, golsVisitante] = sortearPlacar(matriz, sorteio);

  const estatisticas: EstatisticaJogadorSimulado[] = [];
  const lances: LanceSimulado[] = [];

  const montarLado = (
    time: ForcaTime,
    elenco: JogadorSimulado[],
    golsDoLado: number,
    golsSofridos: number
  ) => {
    const lista = elenco.length > 0 ? elenco : elencoDeEmergencia(time.id);
    const stats: EstatisticaJogadorSimulado[] = lista.map((j) => ({
      gamertag: j.gamertag,
      timeId: time.id,
      posicao: j.posicao,
      gols: 0,
      assistencias: 0,
      chutes: 0,
      passes: 0,
      desarmes: 0,
      defesas: 0,
      nota: 6,
      craque: false,
    }));

    // Pesos: a posição manda, e o histórico do jogador ajusta em cima dela.
    const pesosGol = lista.map(
      (j) =>
        (PESO_GOL_POR_POSICAO[j.posicao] ?? 0.2) *
        (1 + Math.min(2, (j.golsPorJogo ?? 0) * 1.5))
    );
    const pesosAss = lista.map(
      (j) =>
        (PESO_ASSISTENCIA_POR_POSICAO[j.posicao] ?? 0.2) *
        (1 + Math.min(2, (j.assistenciasPorJogo ?? 0) * 1.5))
    );

    for (let g = 0; g < golsDoLado; g++) {
      const iArtilheiro = sortearPorPeso(pesosGol, sorteio);
      if (iArtilheiro < 0) continue;
      stats[iArtilheiro].gols++;
      stats[iArtilheiro].chutes++;

      // Assistência em ~62% dos gols (o resto é jogada individual/rebote), e
      // nunca do próprio autor.
      let assistente: string | undefined;
      if (sorteio() < 0.62) {
        const pesos = pesosAss.map((p, i) => (i === iArtilheiro ? 0 : p));
        const iAss = sortearPorPeso(pesos, sorteio);
        if (iAss >= 0) {
          stats[iAss].assistencias++;
          assistente = lista[iAss].gamertag;
        }
      }

      lances.push({
        minuto: 1 + Math.floor(sorteio() * 90),
        tipo: "gol",
        timeId: time.id,
        gamertag: lista[iArtilheiro].gamertag,
        assistenteGamertag: assistente,
      });
    }

    // Volume: chutes, passes e desarmes saem de faixas medidas no espelho.
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      s.chutes += Math.floor(sorteio() * (s.posicao === "forward" ? 5 : 2));
      s.passes = Math.round(6 + sorteio() * 26 + (s.posicao === "midfielder" ? 8 : 0));
      s.desarmes = Math.round(sorteio() * (s.posicao === "defender" ? 6 : 3));
      if (s.posicao === "goalkeeper") {
        // Defesas do goleiro: cresce com o que o time sofreu, com piso.
        s.defesas = Math.max(0, Math.round(golsSofridos * 1.4 + sorteio() * 4));
      }
      // Nota: base 6,0, sobe com participação em gol, desce com gol sofrido.
      const bruta =
        6.0 +
        s.gols * 1.05 +
        s.assistencias * 0.55 +
        s.desarmes * 0.05 +
        (s.posicao === "goalkeeper" ? s.defesas * 0.12 - golsSofridos * 0.25 : 0) -
        golsSofridos * 0.06 +
        (sorteio() - 0.5) * 0.6;
      s.nota = Math.round(Math.min(10, Math.max(3, bruta)) * 10) / 10;
    }
    return stats;
  };

  estatisticas.push(
    ...montarLado(mandante, params.elencoMandante, golsMandante, golsVisitante)
  );
  estatisticas.push(
    ...montarLado(visitante, params.elencoVisitante, golsVisitante, golsMandante)
  );

  // Craque da partida: a maior nota, com o vencedor levando o desempate.
  let craque: { gamertag: string; timeId: string } | undefined;
  let melhor = -1;
  for (const s of estatisticas) {
    const vencedor =
      (s.timeId === mandante.id && golsMandante > golsVisitante) ||
      (s.timeId === visitante.id && golsVisitante > golsMandante);
    const criterio = s.nota + (vencedor ? 0.3 : 0);
    if (criterio > melhor) {
      melhor = criterio;
      craque = { gamertag: s.gamertag, timeId: s.timeId };
    }
  }
  if (craque) {
    const alvo = estatisticas.find(
      (s) => s.gamertag === craque!.gamertag && s.timeId === craque!.timeId
    );
    if (alvo) alvo.craque = true;
  }

  lances.sort((a, b) => a.minuto - b.minuto);

  return {
    semente,
    golsMandante,
    golsVisitante,
    lances,
    jogadores: estatisticas,
    craque,
    lambdaMandante,
    lambdaVisitante,
  };
}

/**
 * Elenco de emergência: 11 nomes genéricos.
 *
 * Existe porque um clube do espelho pode vir sem elenco (a EA devolve lista
 * vazia para clube inativo) e uma partida sem jogador nenhum quebraria a
 * simulação em silêncio — que é o pior jeito de quebrar.
 *
 * ⚠️ Estes nomes NÃO PODEM chegar a uma tela. Eles servem para a partida
 * rodar, não para virar cartaz: `mercados-aposta.ts` recusa montar mercado de
 * jogador quando algum dos elencos está vazio, exatamente por isto. O rótulo
 * abaixo é neutro ("Jogador 9") em vez de conter o id do time como antes —
 * defesa em profundidade, para o dia em que alguém contornar aquela guarda:
 * um nome feio é constrangedor, um id interno vazado é outra coisa.
 */
function elencoDeEmergencia(timeId: string): JogadorSimulado[] {
  const posicoes: JogadorSimulado["posicao"][] = [
    "goalkeeper",
    "defender",
    "defender",
    "defender",
    "defender",
    "midfielder",
    "midfielder",
    "midfielder",
    "forward",
    "forward",
    "forward",
  ];
  // `timeId` entra só na unicidade interna, nunca no rótulo: dois elencos de
  // emergência na mesma partida não podem compartilhar gamertag, senão a
  // estatística de um cairia no outro.
  const marca = timeId.slice(-2);
  return posicoes.map((posicao, i) => ({
    gamertag: `Jogador ${i + 1}${marca}`,
    posicao,
  }));
}

/* ------------------------------------------------------------------ */
/* Higiene do dado da EA                                               */
/* ------------------------------------------------------------------ */

/**
 * A partida da EA é um W.O. (abandono registrado como resultado)?
 *
 * Ver o cabeçalho: `winnerByDnf` pega menos de metade dos casos; a duração
 * pega todos. Esta função é o portão que impede burocracia da EA de entrar
 * como futebol na calibração, na força dos times e na ficha do jogador.
 */
export function ehWalkover(partida: {
  clubs?: Array<{ goals?: number; winnerByDnf?: boolean; players?: Array<{ secondsPlayed?: number }> }>;
}): boolean {
  const clubes = partida.clubs ?? [];
  const segundos = clubes.flatMap((c) => (c.players ?? []).map((p) => p.secondsPlayed ?? 0));
  const duracao = segundos.length > 0 ? Math.max(...segundos) : 0;
  if (duracao > 0 && duracao < DURACAO_MINIMA_VALIDA) return true;
  // Sem lista de jogadores não há duração para medir; aí a marca da EA é tudo
  // que resta, e um 3–0 sem elenco é quase sempre ata.
  if (segundos.length === 0) {
    if (clubes.some((c) => c.winnerByDnf)) return true;
    const gols = clubes.map((c) => c.goals ?? 0).sort((a, b) => b - a);
    if (gols.length === 2 && gols[0] === 3 && gols[1] === 0) return true;
  }
  return false;
}
