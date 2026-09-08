import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import GameEaClube from "@/models/GameEaClube";
import GameClubePerfil, { type IGameClubePerfil } from "@/models/GameClubePerfil";
import { chaveClube, conferirDesafio, ehFederacao, podeGerir, type AcaoGestao } from "./gestao";

export class ErroGestao extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem); }
}

export async function atorGestao() {
  const auth = await getAuthUser();
  if (!auth || !mongoose.isObjectIdOrHexString(auth.id)) throw new ErroGestao(401, "Entre na sua conta.");
  await dbConnect();
  const conta = await User.findById(auth.id).select("role").lean();
  if (!conta) throw new ErroGestao(401, "Conta não encontrada.");
  return { id: String(conta._id), federacao: ehFederacao(conta.role) };
}

export function filtroClube(clubId: unknown, plataforma: unknown) {
  try { return chaveClube(clubId, plataforma); }
  catch { throw new ErroGestao(400, "Clube ou plataforma inválidos."); }
}

export function autorizado(perfil: IGameClubePerfil, userId: string, acao: AcaoGestao) {
  return podeGerir({ estado: perfil.estado, donoUserId: perfil.donoUserId ? String(perfil.donoUserId) : null,
    membros: perfil.membros.map((m) => ({ userId: String(m.userId), funcao: m.funcao })) }, userId, acao);
}

export async function perfilParaTela(perfil: IGameClubePerfil, ator: { id: string; federacao: boolean }) {
  const dono = String(perfil.donoUserId) === ator.id;
  const delegado = perfil.membros.some((m) => String(m.userId) === ator.id);
  const privado = ator.federacao || dono;
  const ids = [...(privado || delegado ? perfil.membros.map((m) => m.userId) : []),
    ...perfil.solicitantes.filter((s) => ator.federacao || String(s.userId) === ator.id).map((s) => s.userId)];
  const contas = ids.length ? await User.find({ _id: { $in: ids } }).select("name").lean() : [];
  const nomes = new Map(contas.map((c) => [String(c._id), c.name]));
  return {
    eaClubId: perfil.eaClubId, plataforma: perfil.plataforma, nome: perfil.nome,
    estado: perfil.estado, descricao: perfil.descricao, versao: perfil.versao,
    souDono: dono,
    donoUserId: privado ? String(perfil.donoUserId ?? "") : null,
    membros: privado || delegado ? perfil.membros.map((m) => ({ userId: String(m.userId), nome: nomes.get(String(m.userId)) ?? "Conta indisponível", funcao: m.funcao })) : [],
    solicitantes: perfil.solicitantes.filter((s) => ator.federacao || String(s.userId) === ator.id)
      .map((s) => ({ userId: String(s.userId), minha: String(s.userId) === ator.id, nome: nomes.get(String(s.userId)) ?? "Conta indisponível", justificativa: s.justificativa, quando: s.quando.toISOString(), desafio: s.desafio?.codigo ? {
        gamertag: s.desafio.gamertag, codigo: s.desafio.codigo, expiraEm: s.desafio.expiraEm.toISOString(), verificadoEm: s.desafio.verificadoEm?.toISOString() ?? null,
      } : null })),
    historico: privado ? perfil.historico.map((h) => ({ acao: h.acao, motivo: h.motivo, quando: h.quando.toISOString() })) : [],
    permissoes: Object.fromEntries((["identidade", "elenco", "vaga", "inscricao", "partida", "delegar"] as AcaoGestao[])
      .map((acao) => [acao, autorizado(perfil, ator.id, acao)])),
  };
}

export async function solicitarGestao(filtro: ReturnType<typeof filtroClube>, userId: string, justificativa: string) {
  // Só lê o espelho: a existência do clube não comprova quem é seu dono.
  const clube = await GameEaClube.findOne({ clubId: filtro.eaClubId, platform: filtro.plataforma }).select("name").lean();
  if (!clube) throw new ErroGestao(404, "Clube ainda não encontrado no espelho. Procure o clube antes de solicitar gestão.");
  await GameClubePerfil.init();
  try {
    await GameClubePerfil.updateOne(filtro, { $setOnInsert: { ...filtro, nome: clube.name, estado: "pendente" } }, { upsert: true, runValidators: true });
  } catch (e) {
    if (!(e instanceof mongoose.mongo.MongoServerError) || e.code !== 11000) throw e;
  }
  const atualizado = await GameClubePerfil.findOneAndUpdate({ ...filtro,
    estado: { $in: ["pendente", "recusado"] }, "solicitantes.userId": { $ne: userId }, "solicitantes.19": { $exists: false },
  }, { $set: { estado: "pendente" }, $push: { solicitantes: { userId, justificativa, quando: new Date() } }, $inc: { versao: 1 } }, { new: true, runValidators: true });
  if (!atualizado) throw new ErroGestao(409, "Já existe uma solicitação sua, uma gestão aprovada ou o limite de solicitações foi atingido. Procure a federação.");
  return atualizado;
}

export async function desafioGestao(filtro: ReturnType<typeof filtroClube>, userId: string, gamertag: string | null) {
  const perfil = await GameClubePerfil.findOne(filtro);
  const solicitante = perfil?.solicitantes.find((s) => String(s.userId) === userId);
  if (!perfil || !solicitante || !["pendente", "recusado"].includes(perfil.estado)) throw new ErroGestao(403, "Envie uma solicitação pendente antes de verificar seu Pro.");
  const agora = new Date();
  if (gamertag !== null) {
    const desafio = { gamertag, codigo: `W22${randomBytes(5).toString("hex").toUpperCase()}`, criadoEm: agora, expiraEm: new Date(agora.getTime() + 48 * 3600_000) };
    const atualizado = await GameClubePerfil.findOneAndUpdate({ ...filtro, versao: perfil.versao, "solicitantes.userId": userId },
      { $set: { "solicitantes.$.desafio": desafio }, $inc: { versao: 1 } }, { new: true, runValidators: true });
    if (!atualizado) throw new ErroGestao(409, "O clube mudou. Atualize e tente novamente.");
    return atualizado;
  }
  const desafio = solicitante.desafio;
  if (!desafio?.codigo) throw new ErroGestao(400, "Gere um código primeiro.");
  const espelho = await GameEaClube.findOne({ clubId: filtro.eaClubId, platform: filtro.plataforma }).select("members capturedAt").lean();
  if (!conferirDesafio(desafio, espelho?.members ?? [], espelho?.capturedAt ?? null, agora)) throw new ErroGestao(409, "O espelho ainda não confirma o código no nome desse Pro, ou o código expirou. Aguarde a próxima coleta ou gere outro código.");
  const atualizado = await GameClubePerfil.findOneAndUpdate({ ...filtro, versao: perfil.versao, "solicitantes.userId": userId },
    { $set: { "solicitantes.$.desafio.verificadoEm": agora }, $inc: { versao: 1 } }, { new: true, runValidators: true });
  if (!atualizado) throw new ErroGestao(409, "O clube mudou. Atualize e tente novamente.");
  return atualizado;
}

/** Alteração e trilha de auditoria ficam no mesmo documento e na mesma operação. */
export async function atualizarComVersao(filtro: ReturnType<typeof filtroClube>, versao: number,
  alteracoes: Record<string, unknown>, autorUserId: string, acao: string, motivo: string) {
  const perfil = await GameClubePerfil.findOneAndUpdate({ ...filtro, versao }, {
    $set: alteracoes, $inc: { versao: 1 }, $push: { historico: { autorUserId, acao, motivo, quando: new Date() } },
  }, { new: true, runValidators: true });
  if (!perfil) throw new ErroGestao(409, "O clube mudou enquanto você editava. Atualize e revise antes de tentar novamente.");
  return perfil;
}

export function erroResposta(e: unknown) {
  if (e instanceof ErroGestao) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error("[gestao] falha interna", e instanceof Error ? e.name : "erro");
  return NextResponse.json({ error: "Não foi possível concluir. Tente novamente." }, { status: 500 });
}

export async function corpoGestao(req: Request): Promise<unknown> {
  // Limite real também cobre requisições sem Content-Length.
  const reader = req.body?.getReader();
  if (!reader) throw new ErroGestao(400, "Envie um JSON válido.");
  const chunks: Uint8Array[] = []; let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 16_384) { await reader.cancel(); throw new ErroGestao(413, "Solicitação muito grande."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ErroGestao(400, "Envie um JSON válido."); }
}
