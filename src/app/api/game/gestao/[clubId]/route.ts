import { NextResponse } from "next/server";
import { z } from "zod";
import User from "@/models/User";
import GameClubePerfil from "@/models/GameClubePerfil";
import { cobrar } from "@/lib/game/limite";
import { atorGestao, autorizado, atualizarComVersao, corpoGestao, desafioGestao, erroResposta, ErroGestao, filtroClube, perfilParaTela, solicitarGestao } from "@/lib/game/gestao-servidor";

export const dynamic = "force-dynamic";
type Contexto = { params: Promise<{ clubId: string }> };
const plataforma = z.enum(["common-gen5", "common-gen4"]);
const solicitar = z.object({ plataforma, justificativa: z.string().trim().min(10).max(2000) }).strict();
const editar = z.discriminatedUnion("acao", [
  z.object({ plataforma, versao: z.number().int().nonnegative(), acao: z.literal("adicionar-responsavel"), email: z.string().trim().email().max(254), funcao: z.enum(["capitao", "vice", "recrutador"]) }).strict(),
  z.object({ plataforma, acao: z.literal("gerar-prova"), gamertag: z.string().trim().min(2).max(40) }).strict(),
  z.object({ plataforma, acao: z.literal("verificar-prova") }).strict(),
  z.object({ plataforma, versao: z.number().int().nonnegative(), acao: z.literal("identidade"), descricao: z.string().trim().max(1000) }).strict(),
  z.object({ plataforma, versao: z.number().int().nonnegative(), acao: z.literal("delegar"), membros: z.array(z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i), funcao: z.enum(["capitao", "vice", "recrutador"]) }).strict()).max(30) }).strict(),
]);

export async function GET(req: Request, ctx: Contexto) {
  try {
    const ator = await atorGestao();
    const limite = await cobrar(req, "campeonato-leitura", "gestao"); if (!limite.ok) return limite.resposta!;
    const filtro = filtroClube((await ctx.params).clubId, new URL(req.url).searchParams.get("plataforma") ?? "common-gen5");
    const perfil = await GameClubePerfil.findOne(filtro);
    return NextResponse.json({ perfil: perfil ? await perfilParaTela(perfil, ator) : null, federacao: ator.federacao }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return erroResposta(e); }
}

export async function POST(req: Request, ctx: Contexto) {
  try {
    const ator = await atorGestao();
    const limite = await cobrar(req, "vincular", "gestao"); if (!limite.ok) return limite.resposta!;
    const body = solicitar.safeParse(await corpoGestao(req));
    if (!body.success) throw new ErroGestao(400, "Informe plataforma e justificativa de 10 a 2000 caracteres.");
    const filtro = filtroClube((await ctx.params).clubId, body.data.plataforma);
    const perfil = await solicitarGestao(filtro, ator.id, body.data.justificativa);
    return NextResponse.json({ perfil: await perfilParaTela(perfil, ator) }, { status: 201 });
  } catch (e) { return erroResposta(e); }
}

export async function PATCH(req: Request, ctx: Contexto) {
  try {
    const ator = await atorGestao();
    const limite = await cobrar(req, "campeonato-escrita", "gestao"); if (!limite.ok) return limite.resposta!;
    const parsed = editar.safeParse(await corpoGestao(req));
    if (!parsed.success) throw new ErroGestao(400, "Dados de gestão inválidos.");
    const body = parsed.data;
    const filtro = filtroClube((await ctx.params).clubId, body.plataforma);
    if (body.acao === "gerar-prova" || body.acao === "verificar-prova") {
      const perfil = await desafioGestao(filtro, ator.id, body.acao === "gerar-prova" ? body.gamertag : null);
      return NextResponse.json({ perfil: await perfilParaTela(perfil, ator) });
    }
    const perfil = await GameClubePerfil.findOne(filtro);
    if (!perfil) throw new ErroGestao(404, "Gestão não encontrada.");
    if (!autorizado(perfil, ator.id, body.acao === "adicionar-responsavel" ? "delegar" : body.acao)) throw new ErroGestao(403, "Você não tem permissão para esta alteração.");
    if (body.versao !== perfil.versao) throw new ErroGestao(409, "Atualize o clube antes de editar.");
    if (body.acao === "adicionar-responsavel") {
      const conta = await User.findOne({ email: body.email.toLowerCase() }).select("_id").lean();
      if (!conta) throw new ErroGestao(400, "Não foi possível adicionar essa conta. Confira o e-mail cadastrado.");
      if (String(conta._id) === String(perfil.donoUserId) || perfil.membros.some((m) => String(m.userId) === String(conta._id))) throw new ErroGestao(409, "Essa conta já é responsável pelo clube.");
      if (perfil.membros.length >= 30) throw new ErroGestao(409, "O clube já tem 30 responsáveis.");
      const atualizado = await atualizarComVersao(filtro, body.versao, { membros: [...perfil.membros.map((m) => ({ userId: m.userId, funcao: m.funcao })), { userId: conta._id, funcao: body.funcao }] }, ator.id, "delegar", "Responsável adicionado pelo dono do clube.");
      return NextResponse.json({ perfil: await perfilParaTela(atualizado, ator) });
    }
    if (body.acao === "delegar") {
      const ids = body.membros.map((m) => m.userId.toLowerCase());
      if (new Set(ids).size !== ids.length || ids.includes(String(perfil.donoUserId))) throw new ErroGestao(400, "Não repita membros nem inclua o dono como delegado.");
      if (await User.countDocuments({ _id: { $in: ids } }) !== ids.length) throw new ErroGestao(400, "Um dos membros não tem conta no site.");
    }
    const atualizado = await atualizarComVersao(filtro, body.versao,
      body.acao === "identidade" ? { descricao: body.descricao } : { membros: body.membros }, ator.id, body.acao,
      body.acao === "identidade" ? "Descrição do clube atualizada pelo responsável." : "Funções de gestão atualizadas pelo dono.");
    return NextResponse.json({ perfil: await perfilParaTela(atualizado, ator) });
  } catch (e) { return erroResposta(e); }
}
