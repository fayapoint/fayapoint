/**
 * A POULE — aposta mútua (pari-mutuel), o modelo em que a casa deixa de ser a
 * casa. 09/09/2026.
 *
 * ## O que muda em relação à quota fixa
 *
 * Na quota fixa (o que a mesa faz hoje) a casa é a CONTRAPARTE: ela oferece um
 * preço, e se errar o preço, paga do próprio bolso. O interesse dela é o
 * contrário do interesse de quem aposta — daí "a casa sempre ganha".
 *
 * Na poule a casa não tem posição nenhuma. Todo mundo aposta num bolo comum, a
 * casa retira uma comissão declarada, e **o que sobra é dividido entre quem
 * acertou, em proporção ao que cada um pôs**. Quem ganha, ganha dos outros
 * apostadores, não da casa. A casa fatura igual se o favorito vencer ou se der
 * zebra — e por isso quer volume, não quer que ninguém perca.
 *
 * É o modelo do totalizador do turfe, e da Loteca. Não é invenção nossa.
 *
 * ## Onde o preço nasce
 *
 * Não existe odd fixada por nós. A cotação é uma CONSEQUÊNCIA da distribuição
 * do dinheiro: se todo mundo põe no favorito, o favorito paga pouco. O número
 * que a tela mostra é uma PROJEÇÃO — "se fechasse agora, pagaria X" — e ela se
 * move até o fechamento. Chamar isso de "odd" sem dizer que é projeção seria
 * prometer um pagamento que ninguém garantiu.
 *
 * ## O fundo de devolução, e a conta que ele obriga
 *
 * A ideia é boa e tem um custo que precisa estar escrito: **devolver para quem
 * perdeu só é possível tirando de quem ganhou, ou da comissão.** Não existe
 * terceira fonte. Aqui a devolução sai da COMISSÃO — nunca do bolo dos
 * vencedores. Ver `MAX_DEVOLUCAO` e o comentário lá.
 *
 * ## As três degenerações que uma poule pequena produz
 *
 * Uma poule com pouca gente não é uma poule ruim: é uma poule que dá resultado
 * absurdo. As três situações e o que fazemos:
 *
 * 1. **Ninguém acertou.** Não há entre quem dividir. Devolvemos tudo, inclusive
 *    a comissão. Ficar com a comissão de uma poule que não pagou ninguém seria
 *    a casa ganhando exatamente onde ela jurou não ganhar.
 * 2. **Um apostador sozinho no vencedor.** Ele leva o bolo inteiro. É o
 *    resultado correto, e a tela precisa avisar antes que a poule está rasa.
 * 3. **Todo mundo no mesmo lado.** O pagamento fica abaixo de 1,00 — cada um
 *    receberia menos do que pôs. Isso é confisco disfarçado de aposta, então o
 *    piso é 1,00: ninguém sai de uma poule com menos do que entrou por causa
 *    da comissão. O custo do piso sai da comissão.
 */

/** Comissão da casa sobre o bolo. O Ricardo propôs 10%. */
export const COMISSAO_PADRAO = 0.1;

/**
 * Teto do que a comissão pode devolver a quem perdeu.
 *
 * ⚠️ A devolução NUNCA sai do bolo dos vencedores. Se saísse, o modelo pagaria
 * ao acertador menos do que a quota fixa de uma casa comum — medido: com
 * comissão de 10% e devolução de 20% sobre as perdas, um vencedor que hoje
 * receberia 2,25× receberia 1,95×. Seria uma casa "honesta" que paga pior a
 * quem acerta, para ser gentil com quem erra. Sai da comissão, e por isso tem
 * teto: a comissão precisa sobrar para existir a casa.
 */
export const MAX_DEVOLUCAO = 0.5;

export interface Selecao {
  chave: string;
  rotulo: string;
  /** Quanto já foi apostado nesta seleção, em fichas. */
  bolo: number;
}

export interface ProjecaoSelecao extends Selecao {
  /** Quanto o bolo desta seleção representa do bolo total. 0 a 1. */
  fatia: number;
  /**
   * Quanto pagaria por ficha SE A POULE FECHASSE AGORA. Move até o fechamento —
   * nunca chame isto de odd sem dizer que é projeção.
   */
  pagaria: number;
  /** `true` quando esta seleção tem tão pouco dinheiro que o número é ruído. */
  rasa: boolean;
}

/** Abaixo disto, a projeção de uma seleção é ruído e a tela precisa dizer. */
export const BOLO_MINIMO_CONFIAVEL = 50;

const arred = (n: number, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas;

/**
 * A projeção de pagamento de cada seleção, dado o estado atual dos bolos.
 *
 * O piso de 1,00 não é enfeite: sem ele, uma seleção que concentrou quase todo
 * o dinheiro pagaria menos de 1,00 por causa da comissão, e o apostador sairia
 * com menos do que pôs tendo ACERTADO. O custo do piso sai da comissão.
 */
export function projetar(selecoes: Selecao[], comissao = COMISSAO_PADRAO): ProjecaoSelecao[] {
  const total = selecoes.reduce((s, x) => s + x.bolo, 0);
  const distribuivel = total * (1 - comissao);

  return selecoes.map((s) => {
    const fatia = total > 0 ? s.bolo / total : 0;
    const bruto = s.bolo > 0 ? distribuivel / s.bolo : 0;
    return {
      ...s,
      fatia: arred(fatia, 4),
      // Sem dinheiro na seleção não há projeção — e 0 é mais honesto do que
      // um número gigante que ninguém vai receber.
      pagaria: s.bolo > 0 ? arred(Math.max(1, bruto)) : 0,
      rasa: s.bolo < BOLO_MINIMO_CONFIAVEL,
    };
  });
}

export interface Cupom {
  id: string;
  selecao: string;
  valor: number;
}

export interface Pagamento {
  cupom: string;
  /** O que a pessoa recebe de volta, em fichas. Inclui o que ela apostou. */
  retorno: number;
  /** Parte do retorno que é devolução por ter perdido, não prêmio. */
  devolucao: number;
  acertou: boolean;
}

export interface ResultadoDaPoule {
  pagamentos: Pagamento[];
  /** Bolo total apostado. */
  total: number;
  /** O que a casa efetivamente ficou, depois de piso e devolução. */
  comissaoLiquida: number;
  /** Quanto da comissão virou devolução para quem perdeu. */
  devolvido: number;
  /** Quanto o piso de 1,00 custou à comissão. */
  custoDoPiso: number;
  /** Quando ninguém acerta, devolvemos tudo — inclusive a comissão. */
  anulada: boolean;
  /** O que efetivamente pagou por ficha a quem acertou. */
  pagouPorFicha: number;
}

/**
 * Liquida a poule: divide o bolo entre quem acertou e devolve parte da comissão
 * a quem errou.
 *
 * A ordem importa e não é arbitrária:
 *
 * 1. Ninguém acertou → devolve TUDO, comissão inclusive, e acabou.
 * 2. Separa a comissão.
 * 3. Paga os vencedores com o resto, respeitando o piso de 1,00 por ficha —
 *    o que faltar sai da comissão.
 * 4. Devolve aos perdedores o que ainda sobrar da comissão, até o teto, em
 *    proporção ao que cada um perdeu.
 *
 * Quem perde na conta é sempre a casa, nunca o apostador. É isso que "a casa
 * deixou de ser a casa" quer dizer em aritmética.
 */
export function liquidarPoule(
  cupons: Cupom[],
  vencedora: string,
  comissao = COMISSAO_PADRAO,
  devolucao = 0
): ResultadoDaPoule {
  const total = cupons.reduce((s, c) => s + c.valor, 0);
  const vencedores = cupons.filter((c) => c.selecao === vencedora);
  const perdedores = cupons.filter((c) => c.selecao !== vencedora);
  const boloVencedor = vencedores.reduce((s, c) => s + c.valor, 0);

  // 1. Ninguém acertou: devolve tudo, comissão inclusive.
  if (boloVencedor === 0) {
    return {
      pagamentos: cupons.map((c) => ({ cupom: c.id, retorno: c.valor, devolucao: 0, acertou: false })),
      total,
      comissaoLiquida: 0,
      devolvido: 0,
      custoDoPiso: 0,
      anulada: true,
      pagouPorFicha: 0,
    };
  }

  // 2 e 3. Comissão, depois o piso de 1,00 — que sai da comissão.
  const comissaoBruta = total * comissao;
  const semPiso = (total - comissaoBruta) / boloVencedor;
  const porFicha = Math.max(1, semPiso);
  const custoDoPiso = Math.max(0, (porFicha - semPiso) * boloVencedor);
  const sobraDaComissao = comissaoBruta - custoDoPiso;

  // 4. O que ainda sobrar da comissão vira devolução a quem perdeu.
  const boloPerdedor = total - boloVencedor;
  const taxa = Math.min(Math.max(devolucao, 0), MAX_DEVOLUCAO);
  const querDevolver = boloPerdedor * taxa;
  const devolvido = Math.max(0, Math.min(querDevolver, sobraDaComissao));
  const porFichaPerdida = boloPerdedor > 0 ? devolvido / boloPerdedor : 0;

  const pagamentos: Pagamento[] = [
    ...vencedores.map((c) => ({
      cupom: c.id,
      retorno: arred(c.valor * porFicha),
      devolucao: 0,
      acertou: true,
    })),
    ...perdedores.map((c) => ({
      cupom: c.id,
      retorno: arred(c.valor * porFichaPerdida),
      devolucao: arred(c.valor * porFichaPerdida),
      acertou: false,
    })),
  ];

  return {
    pagamentos,
    total,
    comissaoLiquida: arred(sobraDaComissao - devolvido),
    devolvido: arred(devolvido),
    custoDoPiso: arred(custoDoPiso),
    anulada: false,
    pagouPorFicha: arred(porFicha),
  };
}

/**
 * A CONTA DO MODELO COM DINHEIRO DE VERDADE — para o parecer, não para a mesa.
 *
 * Existe aqui porque número de viabilidade que mora em documento envelhece
 * calado; morando em código, ele é executável e conferível. Nada nesta função
 * roda em produção.
 */
export function contaComDinheiroReal(params: {
  /** Total apostado no período, em reais. */
  movimento: number;
  comissao: number;
  /** Alíquota sobre a receita bruta de jogo (Lei 14.790: 12%). */
  impostoGGR: number;
  /** Outorga a amortizar (Lei 14.790: R$ 30 milhões por 5 anos). */
  outorga: number;
  /** Custo operacional do período (plataforma, KYC, atendimento, auditoria). */
  custoOperacional: number;
  /** Fração das perdas que se quer devolver. */
  devolucao: number;
  /** Fração do movimento que ficou com quem perdeu. */
  fatiaPerdedora: number;
}) {
  const receitaBruta = params.movimento * params.comissao;
  const imposto = receitaBruta * params.impostoGGR;
  const depoisDoImposto = receitaBruta - imposto;
  const custoDaDevolucao = params.movimento * params.fatiaPerdedora * params.devolucao;
  const sobra = depoisDoImposto - params.custoOperacional - custoDaDevolucao - params.outorga;

  return {
    receitaBruta: arred(receitaBruta),
    imposto: arred(imposto),
    depoisDoImposto: arred(depoisDoImposto),
    custoDaDevolucao: arred(custoDaDevolucao),
    sobra: arred(sobra),
    /** Movimento necessário só para pagar a outorga, sem nenhum outro custo. */
    movimentoParaPagarOutorga: arred(params.outorga / (params.comissao * (1 - params.impostoGGR))),
  };
}
