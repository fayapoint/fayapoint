import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import GameEaClube from "@/models/GameEaClube";
import GamePlayer from "@/models/GamePlayer";
import GameClubePerfil from "@/models/GameClubePerfil";
import GameNegociacao, { type IGameNegociacao, type PlataformaNegociacao } from "@/models/GameNegociacao";
import { aplicarLancamento, garantirCarteira, ErroCarteira } from "./carteira";
import { ErroGestao, autorizado } from "./gestao-servidor";
import { avaliarClube, avaliarJogador, conferirFaixa, repartir, type Avaliacao } from "./valor-mercado";

/**
 * COMPRA E VENDA — a regra de negócio. Plano: `PLANO_COMPRA_VENDA_2026-09-21.md`.
 *
 * Toda transição de estado é um `findOneAndUpdate` condicionado a
 * `estado: "aberta"`: dois cliques de "aceitar" ou um aceite cruzando com um
 * cancelamento resolvem para UM desfecho só, e o dinheiro segue o desfecho.
 */

const DIAS_VALIDADE = 7;
const MAX_ABERTAS_POR_COMPRADOR = 5;

type Doc = IGameNegociacao & { _id: mongoose.Types.ObjectId };

const oid = (s: string) => new mongoose.Types.ObjectId(s);
const plataformaOk = (p: unknown): p is PlataformaNegociacao => p === "common-gen5" || p === "nx";

/* ------------------------------------------------------------------ */
/* Avaliação — sempre do espelho, nunca da EA direto (403 em produção) */
/* ------------------------------------------------------------------ */

interface MembroEspelho { name?: string; gamesPlayed?: number | string; goals?: number | string; assists?: number | string; ratingAve?: number | string; manOfTheMatch?: number | string; proOverall?: number | string; proName?: string }
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const nOuNull = (v: unknown) => { const x = Number(v); return v != null && v !== "" && Number.isFinite(x) ? x : null; };

export async function avaliacaoDoClube(eaClubId: string, plataforma: PlataformaNegociacao) {
  await dbConnect();
  const d = (await GameEaClube.findOne({ clubId: eaClubId, platform: plataforma })
    .select("clubId name currentDivision skillRating wins ties losses members capturedAt").lean()) as unknown as
    | { name: string; currentDivision?: number; skillRating?: number; wins: number; ties: number; losses: number; members?: MembroEspelho[]; capturedAt?: Date }
    | null;
  if (!d) return null;
  const avaliacao = avaliarClube({
    skillRating: d.skillRating ?? null,
    divisao: d.currentDivision ?? null,
    vitorias: d.wins ?? 0,
    empates: d.ties ?? 0,
    derrotas: d.losses ?? 0,
    elencoAtivo: (d.members ?? []).filter((m) => n(m.gamesPlayed) > 0).length,
  });
  return { nome: d.name, divisao: d.currentDivision ?? null, capturadoEm: d.capturedAt?.toISOString() ?? null, avaliacao };
}

/** Acha a gamertag no elenco espelhado mais recente em que ela aparece. */
export async function avaliacaoDoJogador(gamertag: string, plataforma: PlataformaNegociacao) {
  await dbConnect();
  const d = (await GameEaClube.findOne({ platform: plataforma, "members.name": gamertag })
    .sort({ capturedAt: -1 })
    .select("clubId name currentDivision members capturedAt").lean()) as unknown as
    | { clubId: string; name: string; currentDivision?: number; members: MembroEspelho[]; capturedAt?: Date }
    | null;
  const m = d?.members.find((x) => x.name === gamertag);
  if (!d || !m) return null;
  const avaliacao = avaliarJogador({
    jogos: n(m.gamesPlayed),
    gols: n(m.goals),
    assistencias: n(m.assists),
    nota: nOuNull(m.ratingAve),
    melhorEmCampo: n(m.manOfTheMatch),
    overall: nOuNull(m.proOverall),
    divisaoClube: d.currentDivision ?? null,
  });
  return {
    gamertag,
    proName: m.proName ?? null,
    clube: { eaClubId: d.clubId, nome: d.name, divisao: d.currentDivision ?? null },
    jogos: n(m.gamesPlayed),
    capturadoEm: d.capturedAt?.toISOString() ?? null,
    avaliacao,
  };
}

/* ------------------------------------------------------------------ */
/* Anúncio de venda de clube                                           */
/* ------------------------------------------------------------------ */

export async function anunciarClube(ator: string, eaClubId: string, plataforma: unknown, preco: number | null, nota: string) {
  if (!plataformaOk(plataforma)) throw new ErroGestao(400, "Plataforma inválida.");
  await dbConnect();
  const perfil = await GameClubePerfil.findOne({ eaClubId, plataforma });
  if (!perfil || perfil.estado !== "aprovado" || String(perfil.donoUserId) !== ator) {
    throw new ErroGestao(403, "Só o dono aprovado anuncia a venda do clube.");
  }
  if (preco == null) {
    perfil.aVenda = null;
  } else {
    const av = await avaliacaoDoClube(eaClubId, plataforma);
    if (!av) throw new ErroGestao(409, "O clube ainda não está no espelho da EA — sem dado, sem avaliação.");
    const fora = conferirFaixa(preco, av.avaliacao);
    if (fora) throw new ErroGestao(400, fora);
    perfil.aVenda = { preco, anunciadoEm: new Date(), nota: nota.slice(0, 300) };
  }
  perfil.historico.push({ autorUserId: oid(ator), acao: preco == null ? "venda-retirada" : "venda-anunciada", motivo: preco == null ? "Anúncio retirado" : `À venda por ${preco} fichas`, quando: new Date() });
  await perfil.save();
  return { aVenda: perfil.aVenda };
}

export async function clubesAVenda() {
  await dbConnect();
  const perfis = await GameClubePerfil.find({ estado: "aprovado", "aVenda.preco": { $gt: 0 } })
    .sort({ "aVenda.anunciadoEm": -1 }).limit(30)
    .select("eaClubId plataforma nome aVenda").lean();
  return Promise.all(perfis.map(async (p) => {
    const av = await avaliacaoDoClube(p.eaClubId, p.plataforma as PlataformaNegociacao);
    return { eaClubId: p.eaClubId, plataforma: p.plataforma, nome: p.nome, preco: p.aVenda!.preco, nota: p.aVenda!.nota, anunciadoEm: p.aVenda!.anunciadoEm, divisao: av?.divisao ?? null, referencia: av?.avaliacao.valor ?? null };
  }));
}

/* ------------------------------------------------------------------ */
/* Proposta                                                            */
/* ------------------------------------------------------------------ */

export interface PedidoProposta {
  tipo: "clube" | "jogador";
  plataforma: unknown;
  eaClubId?: string;          // clube à venda
  gamertag?: string;          // jogador
  destinoClubId?: string;     // clube que contrata o jogador
  valor: number;              // total oferecido (luvas + compensação, ou preço do clube)
  compensacao?: number;       // parte que vai ao clube de origem
  mensagem?: string;
}

export async function criarProposta(ator: string, p: PedidoProposta) {
  if (!plataformaOk(p.plataforma)) throw new ErroGestao(400, "Plataforma inválida.");
  const plataforma = p.plataforma;
  const valor = Number(p.valor);
  const compensacao = Math.max(0, Math.trunc(Number(p.compensacao ?? 0)));
  await dbConnect();

  const abertas = await GameNegociacao.countDocuments({ compradorUserId: oid(ator), estado: "aberta" });
  if (abertas >= MAX_ABERTAS_POR_COMPRADOR) throw new ErroGestao(429, `Você já tem ${abertas} propostas abertas. Espere uma resposta ou cancele alguma.`);

  let base: Partial<IGameNegociacao>;
  let avaliacao: Avaliacao;

  if (p.tipo === "clube") {
    const eaClubId = String(p.eaClubId ?? "");
    if (!/^\d{1,12}$/.test(eaClubId)) throw new ErroGestao(400, "Clube inválido.");
    const perfil = await GameClubePerfil.findOne({ eaClubId, plataforma, estado: "aprovado" }).lean();
    if (!perfil?.donoUserId) throw new ErroGestao(404, "Este clube não tem dono aprovado no Winners 22 — não há de quem comprar.");
    if (String(perfil.donoUserId) === ator) throw new ErroGestao(400, "O clube já é seu.");
    const av = await avaliacaoDoClube(eaClubId, plataforma);
    if (!av) throw new ErroGestao(409, "O clube ainda não está no espelho da EA — sem dado, sem avaliação.");
    avaliacao = av.avaliacao;
    const repetida = await GameNegociacao.exists({ tipo: "clube", estado: "aberta", compradorUserId: oid(ator), "clube.eaClubId": eaClubId, "clube.plataforma": plataforma });
    if (repetida) throw new ErroGestao(409, "Você já tem uma proposta aberta por este clube.");
    base = { tipo: "clube", clube: { eaClubId, plataforma, nome: perfil.nome }, vendedorUserId: perfil.donoUserId, compensacao: 0 };
  } else if (p.tipo === "jogador") {
    const gamertag = String(p.gamertag ?? "").trim();
    const destinoClubId = String(p.destinoClubId ?? "");
    if (gamertag.length < 2 || gamertag.length > 40) throw new ErroGestao(400, "Gamertag inválida.");
    if (!/^\d{1,12}$/.test(destinoClubId)) throw new ErroGestao(400, "Escolha o clube que vai contratar.");
    const destino = await GameClubePerfil.findOne({ eaClubId: destinoClubId, plataforma });
    if (!destino || !autorizado(destino, ator, "elenco")) throw new ErroGestao(403, "Você precisa gerir o elenco do clube que contrata (dono, capitão ou vice).");
    const jogador = await GamePlayer.findOne({ gamertag, platform: plataforma, isActive: true }).lean();
    if (!jogador) throw new ErroGestao(404, "Esta gamertag ainda não foi reivindicada no Winners 22. O jogador precisa vincular o próprio perfil para poder aceitar.");
    if (String(jogador.ownerUserId) === ator) throw new ErroGestao(400, "Você não pode contratar a si mesmo.");
    if (jogador.eaClubId === destinoClubId) throw new ErroGestao(400, "O jogador já está neste clube.");
    const av = await avaliacaoDoJogador(gamertag, plataforma);
    if (!av) throw new ErroGestao(409, "A gamertag não aparece em nenhum elenco do espelho — sem dado, sem avaliação.");
    avaliacao = av.avaliacao;

    let origemUserId: mongoose.Types.ObjectId | null = null;
    let origemRef: IGameNegociacao["clube"] | undefined;
    if (jogador.eaClubId) {
      const origem = await GameClubePerfil.findOne({ eaClubId: jogador.eaClubId, plataforma, estado: "aprovado" }).lean();
      origemRef = { eaClubId: jogador.eaClubId, plataforma, nome: origem?.nome ?? jogador.clubName ?? "Clube de origem" };
      if (compensacao > 0) {
        if (!origem?.donoUserId) throw new ErroGestao(400, "O clube de origem não tem dono aprovado: não há a quem pagar compensação. Ofereça só as luvas.");
        origemUserId = origem.donoUserId;
      }
    } else if (compensacao > 0) {
      throw new ErroGestao(400, "Jogador livre não tem clube de origem para compensar.");
    }
    if (compensacao >= valor) throw new ErroGestao(400, "A compensação tem de ser menor que o total — o jogador precisa receber luvas.");
    const repetida = await GameNegociacao.exists({ tipo: "jogador", estado: "aberta", compradorUserId: oid(ator), gamertag, "destino.plataforma": plataforma });
    if (repetida) throw new ErroGestao(409, "Você já tem uma proposta aberta por este jogador.");
    base = { tipo: "jogador", gamertag, clube: origemRef, destino: { eaClubId: destinoClubId, plataforma, nome: destino.nome }, vendedorUserId: jogador.ownerUserId, origemUserId, compensacao };
  } else {
    throw new ErroGestao(400, "Tipo de negociação inválido.");
  }

  const fora = conferirFaixa(valor, avaliacao);
  if (fora) throw new ErroGestao(400, fora);

  await garantirCarteira(ator);
  const id = new mongoose.Types.ObjectId();
  const alvo = base.tipo === "clube" ? `o clube ${base.clube!.nome}` : `o jogador ${base.gamertag}`;
  try {
    await aplicarLancamento({ userId: ator, tipo: "negociacao-reserva", valor: -valor, descricao: `Proposta por ${alvo}: ${valor} fichas em custódia`, chaveUnica: `neg-reserva:${id}` });
  } catch (e) {
    if (e instanceof ErroCarteira && e.codigo === "saldo-insuficiente") throw new ErroGestao(402, `Fichas insuficientes: a proposta prende ${valor} fichas até a resposta.`);
    throw e;
  }
  try {
    const doc = await GameNegociacao.create({
      _id: id, ...base, estado: "aberta", compradorUserId: oid(ator), valor,
      referencia: { valor: avaliacao.valor, minimo: avaliacao.minimo, maximo: avaliacao.maximo, confianca: avaliacao.confianca },
      mensagem: String(p.mensagem ?? "").trim().slice(0, 500),
      aceites: { vendedor: null, origem: null },
      expiraEm: new Date(Date.now() + DIAS_VALIDADE * 86_400_000),
      historico: [{ quando: new Date(), autorUserId: oid(ator), acao: "proposta", detalhe: `${valor} fichas${compensacao ? ` (${compensacao} de compensação ao clube de origem)` : ""}` }],
    });
    return doc.toObject();
  } catch (e) {
    // Sem documento, a custódia não tem dono: devolve na hora.
    await aplicarLancamento({ userId: ator, tipo: "negociacao-devolucao", valor, descricao: `Proposta por ${alvo} não registrada: custódia devolvida`, chaveUnica: `neg-devolucao:${id}` }).catch(() => {});
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Resposta: aceitar, recusar, cancelar                                */
/* ------------------------------------------------------------------ */

async function encerrarComDevolucao(neg: Doc, estado: "recusada" | "cancelada" | "expirada", autor: string, detalhe: string) {
  const fechada = (await GameNegociacao.findOneAndUpdate(
    { _id: neg._id, estado: "aberta" },
    { $set: { estado }, $push: { historico: { quando: new Date(), autorUserId: oid(autor), acao: estado, detalhe } } },
    { new: true }
  ).lean()) as Doc | null;
  if (!fechada) return null;
  await aplicarLancamento({
    userId: String(neg.compradorUserId), tipo: "negociacao-devolucao", valor: neg.valor,
    descricao: `Negociação ${estado}: ${neg.valor} fichas de volta da custódia`, chaveUnica: `neg-devolucao:${neg._id}`,
  }).catch((e) => { if (!(e instanceof ErroCarteira && e.codigo === "duplicado")) throw e; });
  return fechada;
}

async function concluir(neg: Doc, autor: string) {
  // 1º trava o desfecho: daqui em diante nenhum cancelamento concorrente devolve a custódia.
  const fechada = (await GameNegociacao.findOneAndUpdate(
    { _id: neg._id, estado: "aberta" },
    { $set: { estado: "concluida", concluidaEm: new Date() }, $push: { historico: { quando: new Date(), autorUserId: oid(autor), acao: "concluida", detalhe: "Todos os lados aceitaram" } } },
    { new: true }
  ).lean()) as Doc | null;
  if (!fechada) return null;

  // 2º, clube: a gestão tem de continuar com quem vendeu. Se mudou no meio do caminho, a venda cai.
  if (neg.tipo === "clube") {
    const troca = await GameClubePerfil.updateOne(
      { eaClubId: neg.clube!.eaClubId, plataforma: neg.clube!.plataforma, estado: "aprovado", donoUserId: neg.vendedorUserId },
      {
        $set: { donoUserId: neg.compradorUserId, membros: [], aVenda: null },
        $inc: { versao: 1 },
        $push: { historico: { autorUserId: oid(autor), acao: "gestao-vendida", motivo: `Vendido por ${neg.valor} fichas (negociação ${neg._id}). Delegações anteriores encerradas.`, quando: new Date() } },
      }
    );
    if (troca.modifiedCount !== 1) {
      await GameNegociacao.updateOne({ _id: neg._id, estado: "concluida" }, { $set: { estado: "cancelada" }, $unset: { concluidaEm: 1 },
        $push: { historico: { quando: new Date(), autorUserId: oid(autor), acao: "cancelada", detalhe: "A gestão do clube mudou antes do aceite; a venda não pôde ser concluída." } } });
      await aplicarLancamento({ userId: String(neg.compradorUserId), tipo: "negociacao-devolucao", valor: neg.valor,
        descricao: `Venda do clube ${neg.clube!.nome} não concluída: custódia devolvida`, chaveUnica: `neg-devolucao:${neg._id}` })
        .catch((e) => { if (!(e instanceof ErroCarteira && e.codigo === "duplicado")) throw e; });
      throw new ErroGestao(409, "A gestão do clube mudou antes do aceite. A proposta foi cancelada e as fichas voltaram ao comprador.");
    }
  }

  const alvo = neg.tipo === "clube" ? `clube ${neg.clube!.nome}` : `jogador ${neg.gamertag}`;
  const principal = repartir(neg.valor - neg.compensacao);
  await aplicarLancamento({ userId: String(neg.vendedorUserId), tipo: "negociacao-recebimento", valor: principal.vendedor,
    descricao: `Venda do ${alvo}: ${neg.valor - neg.compensacao} fichas menos ${principal.taxa} de taxa da federação`, chaveUnica: `neg-receb:${neg._id}:vendedor` });
  if (neg.compensacao > 0 && neg.origemUserId) {
    const comp = repartir(neg.compensacao);
    await aplicarLancamento({ userId: String(neg.origemUserId), tipo: "negociacao-recebimento", valor: comp.vendedor,
      descricao: `Compensação pela saída do ${alvo}: ${neg.compensacao} fichas menos ${comp.taxa} de taxa`, chaveUnica: `neg-receb:${neg._id}:origem` });
  }
  if (neg.tipo === "jogador") {
    await GamePlayer.updateOne({ gamertag: neg.gamertag, platform: neg.destino!.plataforma }, { $set: { eaClubId: neg.destino!.eaClubId, clubName: neg.destino!.nome } });
  }
  return fechada;
}

export async function responder(ator: string, id: string, acao: unknown) {
  if (!mongoose.isValidObjectId(id)) throw new ErroGestao(400, "Negociação inválida.");
  await dbConnect();
  const neg = (await GameNegociacao.findById(id).lean()) as Doc | null;
  if (!neg) throw new ErroGestao(404, "Negociação não encontrada.");
  if (neg.estado !== "aberta") throw new ErroGestao(409, `Esta negociação já está ${neg.estado}.`);
  if (neg.expiraEm < new Date()) {
    await encerrarComDevolucao(neg, "expirada", ator, "Prazo de 7 dias vencido");
    throw new ErroGestao(409, "A proposta venceu. As fichas voltaram a quem ofereceu.");
  }
  const souComprador = String(neg.compradorUserId) === ator;
  const souVendedor = String(neg.vendedorUserId) === ator;
  const souOrigem = neg.origemUserId != null && String(neg.origemUserId) === ator;

  if (acao === "cancelar") {
    if (!souComprador) throw new ErroGestao(403, "Só quem fez a proposta pode cancelar.");
    return encerrarComDevolucao(neg, "cancelada", ator, "Cancelada por quem ofereceu");
  }
  if (acao === "recusar") {
    if (!souVendedor && !souOrigem) throw new ErroGestao(403, "Só quem recebe a proposta pode recusar.");
    return encerrarComDevolucao(neg, "recusada", ator, souVendedor ? "Recusada por quem vende" : "Recusada pelo clube de origem");
  }
  if (acao === "aceitar") {
    if (!souVendedor && !souOrigem) throw new ErroGestao(403, "Só quem recebe a proposta pode aceitar.");
    const campo = souVendedor ? "aceites.vendedor" : "aceites.origem";
    const atual = (await GameNegociacao.findOneAndUpdate(
      { _id: neg._id, estado: "aberta" },
      { $set: { [campo]: new Date() }, $push: { historico: { quando: new Date(), autorUserId: oid(ator), acao: "aceite", detalhe: souVendedor ? (neg.tipo === "clube" ? "Dono aceitou" : "Jogador aceitou") : "Clube de origem aceitou" } } },
      { new: true }
    ).lean()) as Doc | null;
    if (!atual) throw new ErroGestao(409, "A negociação mudou de estado. Recarregue.");
    const faltaOrigem = atual.compensacao > 0 && !atual.aceites.origem;
    if (atual.aceites.vendedor && !faltaOrigem) return (await concluir(atual, ator)) ?? atual;
    return atual;
  }
  throw new ErroGestao(400, "Ação inválida.");
}

/* ------------------------------------------------------------------ */
/* Leitura                                                             */
/* ------------------------------------------------------------------ */

/** Vence as propostas paradas há mais de 7 dias. Preguiçoso: roda em toda leitura. */
async function vencerAtrasadas() {
  const atrasadas = (await GameNegociacao.find({ estado: "aberta", expiraEm: { $lt: new Date() } }).limit(20).lean()) as Doc[];
  for (const neg of atrasadas) await encerrarComDevolucao(neg, "expirada", String(neg.compradorUserId), "Prazo de 7 dias vencido").catch(() => {});
}

function paraTela(neg: Doc, nomes: Map<string, string>, ator: string | null) {
  const papel = !ator ? null : String(neg.compradorUserId) === ator ? "comprador" : String(neg.vendedorUserId) === ator ? "vendedor" : neg.origemUserId && String(neg.origemUserId) === ator ? "origem" : null;
  return {
    id: String(neg._id), tipo: neg.tipo, estado: neg.estado, clube: neg.clube ?? null, gamertag: neg.gamertag ?? null, destino: neg.destino ?? null,
    valor: neg.valor, compensacao: neg.compensacao, referencia: neg.referencia, mensagem: papel ? neg.mensagem : "",
    comprador: nomes.get(String(neg.compradorUserId)) ?? "—", vendedor: nomes.get(String(neg.vendedorUserId)) ?? "—",
    aceites: { vendedor: neg.aceites.vendedor ? new Date(neg.aceites.vendedor).toISOString() : null, origem: neg.aceites.origem ? new Date(neg.aceites.origem).toISOString() : null },
    expiraEm: new Date(neg.expiraEm).toISOString(), concluidaEm: neg.concluidaEm ? new Date(neg.concluidaEm).toISOString() : null,
    criadaEm: new Date(neg.createdAt).toISOString(), papel,
    historico: papel ? neg.historico.map((h) => ({ quando: new Date(h.quando).toISOString(), acao: h.acao, detalhe: h.detalhe })) : [],
  };
}

async function nomesDe(negs: Doc[]) {
  const ids = [...new Set(negs.flatMap((x) => [x.compradorUserId, x.vendedorUserId].map(String)))];
  const contas = ids.length ? await User.find({ _id: { $in: ids } }).select("name").lean() : [];
  return new Map(contas.map((c) => [String(c._id), String(c.name ?? "Conta")]));
}

export async function quadro(ator: string | null) {
  await dbConnect();
  await vencerAtrasadas();
  const recentes = (await GameNegociacao.find({ estado: "concluida" }).sort({ concluidaEm: -1 }).limit(20).lean()) as Doc[];
  const minhas = ator
    ? ((await GameNegociacao.find({ $or: [{ compradorUserId: oid(ator) }, { vendedorUserId: oid(ator) }, { origemUserId: oid(ator) }] })
        .sort({ updatedAt: -1 }).limit(40).lean()) as Doc[])
    : [];
  const nomes = await nomesDe([...recentes, ...minhas]);
  const [aVenda, movimentado] = await Promise.all([
    clubesAVenda(),
    GameNegociacao.aggregate<{ total: number; n: number }>([{ $match: { estado: "concluida" } }, { $group: { _id: null, total: { $sum: "$valor" }, n: { $sum: 1 } } }]),
  ]);
  // Clubes que a pessoa gere (para escolher o destino de uma contratação e anunciar venda).
  const meusClubes = ator
    ? (await GameClubePerfil.find({ estado: "aprovado", $or: [{ donoUserId: oid(ator) }, { membros: { $elemMatch: { userId: oid(ator), funcao: { $in: ["capitao", "vice"] } } } }] })
        .select("eaClubId plataforma nome donoUserId aVenda").lean()).map((p) => ({ eaClubId: p.eaClubId, plataforma: p.plataforma, nome: p.nome, souDono: String(p.donoUserId) === ator, aVenda: p.aVenda ?? null }))
    : [];
  return {
    recentes: recentes.map((x) => paraTela(x, nomes, null)),
    minhas: minhas.map((x) => paraTela(x, nomes, ator)),
    aVenda,
    meusClubes,
    totais: { transferencias: movimentado[0]?.n ?? 0, fichas: movimentado[0]?.total ?? 0 },
  };
}
