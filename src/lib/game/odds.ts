/**
 * A COTAÇÃO — de probabilidade a odd, com a margem da casa. 08/09/2026.
 *
 * Função pura, sem banco e sem rede, pelo mesmo motivo do motor de campeonato:
 * preço é a coisa que o apostador confere linha por linha, e uma margem
 * escondida dentro de um componente é impossível de provar.
 *
 * ## O vocabulário, uma vez só
 *
 * - **Probabilidade justa (p)**: o que o modelo acha que vai acontecer.
 * - **Odd justa**: 1 ÷ p. Pagaria exatamente o esperado — casa não ganha nada.
 * - **Margem (overround, "vig", "suco")**: quanto a soma das probabilidades
 *   cotadas passa de 100%. Um 1X2 com margem de 6% soma 106%.
 * - **Odd decimal**: quanto volta por ficha apostada, aposta inclusa. Odd 2,50
 *   com 10 fichas devolve 25 (lucro de 15).
 *
 * ## Por que o método da POTÊNCIA, e não o proporcional
 *
 * Há quatro jeitos consagrados de espalhar a margem entre as opções:
 * proporcional (multiplicativo), aditivo, potência e Shin. O proporcional é o
 * mais fácil e o pior: ele cobra a mesma porcentagem do favorito e do azarão.
 *
 * Na prática toda casa cobra MAIS do azarão — é o *favourite-longshot bias*, e
 * existe porque o erro do modelo é proporcionalmente maior nas pontas: errar
 * 2 pontos numa estimativa de 5% custa muito mais caro do que errar 2 pontos
 * numa de 60%. O método da potência (p elevado a k, com k < 1) faz exatamente
 * isso sozinho, nunca produz probabilidade fora de 0–1 (o aditivo produz
 * negativa em azarão), e a literatura mede que ele e o Shin preveem melhor que
 * os outros dois, com vantagem crescente acima de odd 5,3.
 *
 * O Shin seria ainda um pouco melhor, e foi descartado de propósito: ele
 * modela a proteção da casa contra apostador com informação privilegiada.
 * Aqui não existe informação privilegiada — a partida é simulada por semente
 * comprometida e a probabilidade é publicada. Cobrar por um risco que não
 * corremos seria cobrar sem motivo.
 *
 * ## As margens, e por que elas são pequenas
 *
 * Casa de verdade cobra 5–8% no 1X2 e chega a 15%+ em mercado de jogador.
 * Aqui a ficha não vale dinheiro e a casa não precisa de lucro: a margem
 * existe só para (1) o saldo não inflacionar até a ficha não valer nada e
 * (2) o jogo ensinar como a coisa funciona de verdade. Por isso ela fica na
 * ponta de baixo do que o mercado real pratica, e vai declarada em tela.
 */

/** Odd mínima que pode ir a mercado. Abaixo disso não há aposta, há taxa. */
export const ODD_MINIMA = 1.01;
/** Teto de odd. Acima disso o retorno vira ruído e o risco da casa, ilimitado. */
export const ODD_MAXIMA = 501;

/**
 * Margem por família de mercado. Quanto mais o resultado depende de uma pessoa
 * (e não do time), mais o modelo erra — e mais a margem precisa cobrir.
 */
export const MARGEM: Record<FamiliaMercado, number> = {
  resultado: 0.04,
  gols: 0.05,
  handicap: 0.045,
  placar: 0.09,
  jogador: 0.08,
  campeonato: 0.07,
};

export type FamiliaMercado =
  | "resultado"
  | "gols"
  | "handicap"
  | "placar"
  | "jogador"
  | "campeonato";

/* ------------------------------------------------------------------ */

/** Odd justa (sem margem). É 1 ÷ p, com os limites da casa aplicados. */
export function oddJusta(p: number): number {
  if (p <= 0) return ODD_MAXIMA;
  if (p >= 1) return ODD_MINIMA;
  return Math.min(ODD_MAXIMA, Math.max(ODD_MINIMA, 1 / p));
}

/** Probabilidade implícita de uma odd decimal. */
export function probabilidadeImplicita(odd: number): number {
  return odd > 0 ? 1 / odd : 0;
}

/**
 * A margem embutida num conjunto de odds: quanto a soma das probabilidades
 * implícitas passa de 1. Serve para o portão de teste e para a tela — o
 * apostador tem direito de ver quanto está pagando.
 */
export function margemEmbutida(odds: number[]): number {
  return odds.reduce((s, o) => s + probabilidadeImplicita(o), 0) - 1;
}

/**
 * Aplica a margem pelo método da potência: acha k tal que Σ pᵢ^k = 1 + margem.
 *
 * A função Σ pᵢ^k é monótona decrescente em k (cada pᵢ < 1), então a bissecção
 * acha a raiz sem risco de divergir. 60 iterações levam a precisão muito além
 * da casa decimal que a odd mostra — é barato e acaba com o "às vezes fecha".
 */
export function aplicarMargem(probabilidades: number[], margem: number): number[] {
  const soma = probabilidades.reduce((s, p) => s + p, 0);
  if (soma <= 0) return probabilidades.map(() => 0);

  // Normaliza antes: o modelo pode entregar 0,999 por corte de cauda, e a
  // margem tem de ser a que a casa declarou, não a que sobrou do truncamento.
  const p = probabilidades.map((x) => x / soma);
  const alvo = 1 + margem;

  // Um mercado com uma opção só (ex.: "acontece?") não tem como distribuir
  // margem entre pares — encolhe a odd direto.
  if (p.length < 2) return p.map((x) => Math.min(1, x * alvo));

  let baixo = 0.5;
  let alto = 1.0;
  // Garante que o intervalo contém a raiz: k menor infla mais a soma.
  for (let i = 0; i < 40 && somaPotencia(p, baixo) < alvo; i++) baixo /= 1.5;

  let k = 1;
  for (let i = 0; i < 60; i++) {
    k = (baixo + alto) / 2;
    if (somaPotencia(p, k) > alvo) baixo = k;
    else alto = k;
  }
  return p.map((x) => Math.pow(x, k));
}

function somaPotencia(p: number[], k: number): number {
  return p.reduce((s, x) => s + Math.pow(x, k), 0);
}

/**
 * A escada de arredondamento. Casas de verdade não cotam 2,4713 — elas cotam
 * numa escada, mais fina embaixo e mais grossa em cima, porque um centavo de
 * odd em 1,50 muda o preço em 0,7% e em 50,0 não muda nada.
 *
 * Arredonda sempre PARA BAIXO (`floor`). Para cima, o arredondamento comeria
 * a margem e faria a casa pagar mais do que cobrou; para baixo, o apostador
 * perde no máximo um degrau — e o degrau é declarado.
 */
export function arredondarOdd(odd: number): number {
  const passo = odd < 2 ? 0.01 : odd < 3 ? 0.02 : odd < 6 ? 0.05 : odd < 10 ? 0.1 : odd < 30 ? 0.5 : 1;
  const r = Math.floor(odd / passo) * passo;
  return Math.max(ODD_MINIMA, Math.min(ODD_MAXIMA, Math.round(r * 100) / 100));
}

/** Uma opção cotada: o que vai para a tela e para o cupom. */
export interface SelecaoCotada {
  /** Chave estável da opção. É por ela que a liquidação encontra o resultado. */
  chave: string;
  rotulo: string;
  /** A probabilidade do MODELO, sem margem. Vai a tela: a casa não esconde. */
  probabilidade: number;
  odd: number;
}

/**
 * Cota um mercado inteiro de uma vez.
 *
 * De uma vez, e não opção por opção, porque a margem é uma propriedade do
 * MERCADO: ela só faz sentido dividida entre opções que se excluem e somam 1.
 * Cotar isolado deixaria o "sim" e o "não" com margens diferentes sem ninguém
 * notar — o defeito clássico de casa amadora.
 */
export function cotarMercado(
  opcoes: Array<{ chave: string; rotulo: string; probabilidade: number }>,
  familia: FamiliaMercado,
  margemPersonalizada?: number
): SelecaoCotada[] {
  const margem = margemPersonalizada ?? MARGEM[familia];
  const comMargem = aplicarMargem(
    opcoes.map((o) => o.probabilidade),
    margem
  );
  const soma = opcoes.reduce((s, o) => s + o.probabilidade, 0) || 1;
  return opcoes.map((o, i) => ({
    chave: o.chave,
    rotulo: o.rotulo,
    probabilidade: Math.round((o.probabilidade / soma) * 10000) / 10000,
    odd: arredondarOdd(oddJusta(comMargem[i])),
  }));
}

/* ------------------------------------------------------------------ */
/* Retorno do cupom                                                    */
/* ------------------------------------------------------------------ */

/**
 * O que uma perna do cupom rendeu, como fator sobre a aposta dela.
 *
 * `meio-ganha` e `meio-perdida` não são exotismo: são o que o handicap de
 * linha quebrada (−0,25, −0,75) produz por construção. Uma linha de −0,25 é
 * metade da aposta em 0 e metade em −0,5; se o time ganha por zero (empate),
 * a metade em 0 devolve e a metade em −0,5 perde — meia perda, nunca perda
 * inteira. Uma casa que liquidasse isso como perda cheia estaria roubando, e
 * é o erro mais comum de quem implementa handicap sem saber de onde ele vem.
 */
export type ResultadoSelecao =
  | "ganha"
  | "perdida"
  | "meio-ganha"
  | "meio-perdida"
  | "devolvida"
  | "anulada";

/** Fator de retorno sobre a aposta, incluindo a devolução dela. */
export function fatorRetorno(resultado: ResultadoSelecao, odd: number): number {
  switch (resultado) {
    case "ganha":
      return odd;
    case "meio-ganha":
      // Metade em aposta vencedora, metade devolvida.
      return odd / 2 + 0.5;
    case "meio-perdida":
      // Metade perdida, metade devolvida.
      return 0.5;
    case "perdida":
      return 0;
    case "devolvida":
    case "anulada":
      // Anulada volta como odd 1,00 — é o que faz a múltipla sobreviver ao
      // evento cancelado em vez de morrer inteira por culpa da casa.
      return 1;
  }
}

/**
 * Liquida um cupom inteiro.
 *
 * A múltipla é o produto dos fatores. É a regra certa e a que surpreende:
 * uma múltipla de 5 pernas em que uma foi anulada não vira perda — vira uma
 * múltipla de 4, porque o fator da anulada é 1,00.
 */
export function liquidarCupom(
  pernas: Array<{ odd: number; resultado: ResultadoSelecao }>,
  aposta: number
): { retorno: number; lucro: number; oddEfetiva: number } {
  if (pernas.length === 0) return { retorno: 0, lucro: -aposta, oddEfetiva: 0 };
  const fator = pernas.reduce((f, p) => f * fatorRetorno(p.resultado, p.odd), 1);
  // Fichas são inteiras: arredonda para baixo, e o resto fica com a casa —
  // declarado, e sempre a favor do saldo total do jogo, nunca de uma conta.
  const retorno = Math.floor(aposta * fator);
  return {
    retorno,
    lucro: retorno - aposta,
    oddEfetiva: Math.round(fator * 100) / 100,
  };
}
