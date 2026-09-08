import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import GameCarteira, { type IGameCarteira } from "@/models/GameCarteira";
import GameLancamento, { type TipoLancamento } from "@/models/GameLancamento";

/**
 * A CARTEIRA — a única porta por onde ficha entra ou sai. 08/09/2026.
 *
 * ## A regra desta camada
 *
 * Nenhum outro arquivo escreve em `game_carteiras`. Nem a rota de aposta, nem
 * a liquidação, nem o painel de administração. Todos passam por
 * `aplicarLancamento`, e o motivo é que saldo é a única coisa aqui que não
 * pode ser reconstruída: um curso mal gerado se regenera, um preço errado se
 * corrige, um saldo perdido não volta. Uma porta só significa um lugar só para
 * errar, e um lugar só para consertar.
 *
 * ## Os três perigos, e como cada um morre
 *
 * 1. **Saldo negativo.** O débito é um `findOneAndUpdate` com a condição
 *    `saldo >= valor` DENTRO da consulta. O Mongo garante atomicidade de
 *    documento único, então dois cliques simultâneos não passam os dois: o
 *    segundo não encontra documento que satisfaça a condição e falha limpo.
 *    Ler o saldo, conferir em JavaScript e só então gravar é a versão que
 *    parece igual e deixa a conta furada em toda corrida.
 *
 * 2. **Pagar duas vezes.** Toda liquidação carrega `chaveUnica`, e o índice
 *    único de `game_lancamentos` recusa a segunda. Retentativa de cron, clique
 *    duplo e reprocessamento manual convergem para a mesma chave e param aí.
 *
 * 3. **Extrato divergir do saldo.** O lançamento grava `saldoDepois` colhido
 *    da MESMA operação que mexeu no saldo — não de uma leitura posterior, que
 *    já poderia ter outro valor.
 *
 * ## Sobre transações
 *
 * O caminho é: mexe no saldo, depois grava o extrato. Se o extrato falhar por
 * chave duplicada, o saldo é DESFEITO — e desfazer é correto justamente
 * porque a chave duplicada prova que uma tentativa anterior já pagou. Não se
 * usa transação de propósito: o `dbConnect` do site é um cliente compartilhado
 * (ver `reference_mongo_um_cliente_por_instancia`) e sessão de transação em
 * pool compartilhado custa conexão por operação. A idempotência resolve o
 * mesmo problema por menos.
 */

/** O bônus de boas-vindas do Winners 22, em fichas. */
export const BONUS_BOAS_VINDAS = 100;

/** Aposta mínima e máxima por cupom, em fichas. */
export const APOSTA_MINIMA = 1;
export const APOSTA_MAXIMA = 500;

/**
 * Teto de retorno por cupom. Existe porque múltipla de 12 pernas a odd 3 paga
 * 500 mil fichas — um número que destrói o placar do jogo inteiro e não
 * ensina nada sobre aposta. Casas de verdade têm o mesmo teto, pelo mesmo
 * motivo, e o declaram no regulamento.
 */
export const RETORNO_MAXIMO = 100_000;

/** Recarga de cortesia quando a pessoa quebra. Ver `recarregarSeQuebrado`. */
export const RECARGA_DIARIA = 50;
/** Só recarrega quem está com menos que isto. */
export const LIMIAR_RECARGA = 10;

export class ErroCarteira extends Error {
  constructor(
    message: string,
    public codigo:
      | "saldo-insuficiente"
      | "pausado"
      | "limite-diario"
      | "moeda-nao-suportada"
      | "duplicado"
  ) {
    super(message);
  }
}

/**
 * Pega (ou cria) a carteira de fichas da pessoa, já com o bônus de boas-vindas.
 *
 * ## Por que o bônus mora aqui e não no cadastro
 *
 * Mesma razão do `garantirBoasVindas` dos créditos do site: mexer no
 * `POST /api/auth/register` daria bônus só a quem se cadastrar de amanhã em
 * diante, e deixaria de fora exatamente as 23 contas que já existem. Concedido
 * na primeira vez que a pessoa TOCA no Winners 22, os antigos entram pelo
 * mesmo caminho dos novos, sem script de migração e sem data de corte.
 *
 * O "uma vez só" é garantido pelo extrato, não por uma flag: existe um
 * lançamento `bonus-boas-vindas` com `chaveUnica` derivada do id da pessoa, e
 * o índice único recusa o segundo. A regra e a prova são o mesmo dado.
 */
export async function garantirCarteira(userId: string): Promise<IGameCarteira> {
  await dbConnect();
  const id = new mongoose.Types.ObjectId(userId);

  const carteira = await GameCarteira.findOneAndUpdate(
    { userId: id, moeda: "ficha" },
    { $setOnInsert: { userId: id, moeda: "ficha", saldo: 0 } },
    { upsert: true, new: true }
  );

  const jaRecebeu = await GameLancamento.exists({
    userId: id,
    tipo: "bonus-boas-vindas",
  });
  if (jaRecebeu) return carteira;

  try {
    await aplicarLancamento({
      userId,
      tipo: "bonus-boas-vindas",
      valor: BONUS_BOAS_VINDAS,
      descricao: `Bônus de entrada: ${BONUS_BOAS_VINDAS} fichas para começar no Winners 22`,
      chaveUnica: `boas-vindas:${userId}`,
    });
  } catch (e) {
    // Corrida entre duas abas: a outra já concedeu. Não é erro.
    if (!(e instanceof ErroCarteira && e.codigo === "duplicado")) throw e;
  }

  return (await GameCarteira.findById(carteira._id))!;
}

/**
 * Move fichas. Positivo entra, negativo sai. É a porta única.
 *
 * Devolve o saldo depois do movimento — o mesmo número que foi gravado no
 * extrato, e não uma releitura.
 */
export async function aplicarLancamento(params: {
  userId: string;
  tipo: TipoLancamento;
  valor: number;
  descricao: string;
  chaveUnica?: string;
  apostaId?: mongoose.Types.ObjectId;
  eventoId?: mongoose.Types.ObjectId;
}): Promise<{ saldo: number; lancamentoId: mongoose.Types.ObjectId }> {
  const { userId, tipo, valor, descricao, chaveUnica } = params;
  if (valor === 0) throw new Error("lançamento de valor zero não existe");

  await dbConnect();
  const id = new mongoose.Types.ObjectId(userId);

  // O débito exige saldo; o crédito não tem condição nenhuma.
  const filtro: Record<string, unknown> = { userId: id, moeda: "ficha" };
  if (valor < 0) filtro.saldo = { $gte: -valor };

  const incremento: Record<string, number> = { saldo: valor };
  if (valor < 0) incremento.totalApostado = -valor;
  else if (tipo === "premio" || tipo === "premiacao-campeonato") incremento.totalGanho = valor;
  else if (tipo === "bonus-boas-vindas" || tipo === "recarga-diaria") incremento.totalRecebido = valor;

  const carteira = await GameCarteira.findOneAndUpdate(
    filtro,
    { $inc: incremento },
    { new: true }
  );

  if (!carteira) {
    // Ou a carteira não existe, ou o saldo não cobre. Distinguir importa: a
    // mensagem de "crie sua carteira" e a de "faltam fichas" são conversas
    // diferentes com a pessoa.
    const existe = await GameCarteira.exists({ userId: id, moeda: "ficha" });
    throw new ErroCarteira(
      existe ? "fichas insuficientes" : "carteira não encontrada",
      "saldo-insuficiente"
    );
  }

  try {
    const lancamento = await GameLancamento.create({
      userId: id,
      carteiraId: carteira._id,
      tipo,
      valor,
      saldoDepois: carteira.saldo,
      descricao,
      chaveUnica,
      apostaId: params.apostaId,
      eventoId: params.eventoId,
    });
    return { saldo: carteira.saldo, lancamentoId: lancamento._id as mongoose.Types.ObjectId };
  } catch (e: unknown) {
    const erro = e as { code?: number };
    if (erro?.code === 11000) {
      // Chave duplicada: alguém já fez este lançamento. Desfaz o saldo — é
      // seguro exatamente porque a duplicata PROVA que o movimento já ocorreu.
      await GameCarteira.updateOne({ _id: carteira._id }, { $inc: invertido(incremento) });
      throw new ErroCarteira("lançamento já aplicado", "duplicado");
    }
    // Qualquer outra falha também desfaz: saldo sem extrato é pior que erro.
    await GameCarteira.updateOne({ _id: carteira._id }, { $inc: invertido(incremento) });
    throw e;
  }
}

function invertido(inc: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(inc)) out[k] = -v;
  return out;
}

/**
 * Recarrega quem quebrou.
 *
 * A ficha não vale dinheiro, então deixar alguém zerado só faz a pessoa parar
 * de jogar — não há lição nisso nem receita. A recarga é diária e pequena de
 * propósito: repõe o suficiente para continuar aprendendo, e não o suficiente
 * para o saldo perder sentido. Quem administra bem as fichas continua à
 * frente de quem torra tudo todo dia, que é a única coisa que o placar
 * precisa medir.
 *
 * Idempotente pelo dia: a chave carrega a data, então duas chamadas no mesmo
 * dia produzem uma recarga só.
 */
export async function recarregarSeQuebrado(userId: string): Promise<number> {
  await dbConnect();
  const carteira = await GameCarteira.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    moeda: "ficha",
  });
  if (!carteira || carteira.saldo >= LIMIAR_RECARGA) return 0;

  const hoje = new Date().toISOString().slice(0, 10);
  try {
    await aplicarLancamento({
      userId,
      tipo: "recarga-diaria",
      valor: RECARGA_DIARIA,
      descricao: `Recarga do dia: ${RECARGA_DIARIA} fichas`,
      chaveUnica: `recarga:${userId}:${hoje}`,
    });
    return RECARGA_DIARIA;
  } catch (e) {
    if (e instanceof ErroCarteira && e.codigo === "duplicado") return 0;
    throw e;
  }
}

/**
 * O portão de jogo responsável. Roda antes de toda aposta.
 *
 * Vale a pena mesmo com ficha de brinquedo: quem treina aqui a apostar sem
 * limite treina um hábito que, numa casa de verdade, custa o dinheiro da
 * pessoa. O limite é escolhido por quem joga e o freio é dela.
 */
export async function podeApostar(
  userId: string,
  valor: number
): Promise<{ ok: true } | { ok: false; motivo: string; codigo: string }> {
  await dbConnect();
  const id = new mongoose.Types.ObjectId(userId);
  const carteira = await GameCarteira.findOne({ userId: id, moeda: "ficha" });
  if (!carteira) return { ok: false, motivo: "carteira não encontrada", codigo: "sem-carteira" };

  if (carteira.pausadoAte && carteira.pausadoAte > new Date()) {
    return {
      ok: false,
      codigo: "pausado",
      motivo: `conta em pausa até ${carteira.pausadoAte.toLocaleDateString("pt-BR")}`,
    };
  }

  if (valor < APOSTA_MINIMA || valor > APOSTA_MAXIMA || !Number.isInteger(valor)) {
    return {
      ok: false,
      codigo: "valor-invalido",
      motivo: `a aposta vai de ${APOSTA_MINIMA} a ${APOSTA_MAXIMA} fichas inteiras`,
    };
  }

  if (carteira.limiteDiario && carteira.limiteDiario > 0) {
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    const [agregado] = await GameLancamento.aggregate<{ total: number }>([
      { $match: { userId: id, tipo: "aposta", createdAt: { $gte: inicioDoDia } } },
      { $group: { _id: null, total: { $sum: "$valor" } } },
    ]);
    // `valor` de aposta é negativo no extrato; o gasto do dia é o módulo.
    const gastoHoje = Math.abs(agregado?.total ?? 0);
    if (gastoHoje + valor > carteira.limiteDiario) {
      return {
        ok: false,
        codigo: "limite-diario",
        motivo: `seu limite diário é de ${carteira.limiteDiario} fichas e você já apostou ${gastoHoje}`,
      };
    }
  }

  if (carteira.saldo < valor) {
    return { ok: false, codigo: "saldo-insuficiente", motivo: "fichas insuficientes" };
  }

  return { ok: true };
}

/** O resumo que a tela mostra. */
export async function resumoDaCarteira(userId: string) {
  await dbConnect();
  const id = new mongoose.Types.ObjectId(userId);
  const carteira = await garantirCarteira(userId);
  const extrato = await GameLancamento.find({ userId: id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  return {
    saldo: carteira.saldo,
    emJogo: carteira.emJogo,
    totalApostado: carteira.totalApostado,
    totalGanho: carteira.totalGanho,
    totalRecebido: carteira.totalRecebido,
    limiteDiario: carteira.limiteDiario ?? null,
    pausadoAte: carteira.pausadoAte ?? null,
    extrato: extrato.map((l) => ({
      tipo: l.tipo,
      valor: l.valor,
      saldoDepois: l.saldoDepois,
      descricao: l.descricao,
      em: l.createdAt,
    })),
  };
}
