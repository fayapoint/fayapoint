/**
 * VALOR DE MERCADO — quanto vale, em fichas, um jogador ou um clube do FC 27.
 *
 * Função pura, sem banco: entra o dado que a EA publica (lido do espelho), sai
 * um número e uma faixa. É a régua das negociações de compra e venda
 * (`negociacao-servidor.ts`), e existe por dois motivos:
 *
 *  1. **Dar referência a quem nunca negociou.** "Quanto eu ofereço por um ZAG
 *     de divisão 3 com nota 7,4?" sem régua vira chute, e chute vira briga.
 *  2. **Travar lavagem.** A ficha não tem valor econômico (art. 6º do
 *     estatuto), e o jeito mais fácil de alguém tentar dar valor a ela é
 *     "vender" um jogador de 20 fichas por 5.000 e acertar o resto por fora.
 *     Proposta só é aceita DENTRO da faixa (metade a dobro da referência).
 *
 * Tudo é derivado de número que a EA publica — nada de "olhômetro". Quando o
 * dado é pouco (menos de 5 jogos), a confiança cai e a tela diz isso.
 */

export interface DadosJogador {
  jogos: number;
  gols: number;
  assistencias: number;
  /** Nota média da EA (0–10). */
  nota: number | null;
  melhorEmCampo: number;
  /** Overall do Pro (a ficha do avatar). */
  overall: number | null;
  /** Divisão atual do clube (1 = elite, 10 = entrada). */
  divisaoClube: number | null;
}

export interface DadosClube {
  skillRating: number | null;
  divisao: number | null;
  vitorias: number;
  empates: number;
  derrotas: number;
  /** Quantos membros do elenco jogaram ao menos uma partida. */
  elencoAtivo: number;
}

export interface Avaliacao {
  valor: number;
  minimo: number;
  maximo: number;
  confianca: "alta" | "media" | "baixa";
  /** Cada parcela da soma, para a tela explicar o número em vez de impor. */
  parcelas: Array<{ rotulo: string; fichas: number }>;
}

/** A federação fica com 10% de toda venda concluída — a ficha sai de circulação. */
export const TAXA_FEDERACAO = 0.1;
/** Proposta abaixo de metade ou acima do dobro da referência é recusada. */
export const FAIXA_MIN = 0.5;
export const FAIXA_MAX = 2;

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const arred5 = (v: number) => Math.max(5, Math.round(v / 5) * 5);

function fechar(parcelas: Avaliacao["parcelas"], multiplicador: number, confianca: Avaliacao["confianca"]): Avaliacao {
  const soma = parcelas.reduce((a, p) => a + p.fichas, 0);
  const valor = arred5(soma * multiplicador);
  return {
    valor,
    minimo: arred5(valor * FAIXA_MIN),
    maximo: arred5(valor * FAIXA_MAX),
    confianca,
    parcelas: parcelas.map((p) => ({ ...p, fichas: Math.round(p.fichas * multiplicador) })),
  };
}

/** Peso da divisão: a elite (1) vale 54% a mais que a entrada (10). */
export function pesoDivisao(divisao: number | null): number {
  if (divisao == null || divisao < 1 || divisao > 10) return 1;
  return 1 + (10 - divisao) * 0.06;
}

export function avaliarJogador(d: DadosJogador): Avaliacao {
  const jogos = Math.max(0, d.jogos);
  const porJogo = jogos > 0 ? (d.gols + d.assistencias) / jogos : 0;
  const parcelas = [
    { rotulo: "Base", fichas: 50 },
    { rotulo: "Nota média", fichas: d.nota != null ? limitar((d.nota - 6) * 60, 0, 240) : 0 },
    { rotulo: "Gols + assistências por jogo", fichas: limitar(porJogo * 80, 0, 200) },
    { rotulo: "Melhor em campo", fichas: jogos > 0 ? limitar((d.melhorEmCampo / jogos) * 300, 0, 150) : 0 },
    { rotulo: "Experiência", fichas: Math.min(jogos, 100) * 1.5 },
    { rotulo: "Overall do Pro", fichas: d.overall != null ? limitar((d.overall - 60) * 4, 0, 160) : 0 },
  ];
  const confianca = jogos >= 20 ? "alta" : jogos >= 5 ? "media" : "baixa";
  return fechar(parcelas, pesoDivisao(d.divisaoClube), confianca);
}

export function avaliarClube(d: DadosClube): Avaliacao {
  const jogos = d.vitorias + d.empates + d.derrotas;
  const aproveitamento = jogos > 0 ? (d.vitorias * 3 + d.empates) / (jogos * 3) : 0;
  const parcelas = [
    { rotulo: "Base", fichas: 200 },
    { rotulo: "Skill rating", fichas: d.skillRating != null ? limitar((d.skillRating - 1000) * 0.5, 0, 800) : 0 },
    { rotulo: "Divisão", fichas: d.divisao != null ? limitar((11 - d.divisao) * 80, 0, 800) : 0 },
    { rotulo: "Aproveitamento", fichas: aproveitamento * 400 },
    { rotulo: "Elenco ativo", fichas: Math.min(d.elencoAtivo, 11) * 30 },
    { rotulo: "Partidas disputadas", fichas: Math.min(jogos, 200) },
  ];
  const confianca = jogos >= 30 ? "alta" : jogos >= 8 ? "media" : "baixa";
  return fechar(parcelas, 1, confianca);
}

/** A proposta cabe na faixa? Devolve o motivo quando não cabe. */
export function conferirFaixa(proposta: number, avaliacao: Pick<Avaliacao, "minimo" | "maximo">): string | null {
  if (!Number.isInteger(proposta) || proposta <= 0) return "A proposta tem de ser um número inteiro de fichas.";
  if (proposta < avaliacao.minimo) return `Abaixo da faixa: o mínimo é ${avaliacao.minimo} fichas.`;
  if (proposta > avaliacao.maximo) return `Acima da faixa: o máximo é ${avaliacao.maximo} fichas.`;
  return null;
}

/** Quanto chega a quem vende e quanto a federação retira de circulação. */
export function repartir(valor: number): { vendedor: number; taxa: number } {
  const taxa = Math.max(1, Math.round(valor * TAXA_FEDERACAO));
  return { vendedor: valor - taxa, taxa };
}
