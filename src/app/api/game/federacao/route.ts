import { NextResponse } from "next/server";
import { z } from "zod";
import GameClubePerfil from "@/models/GameClubePerfil";
import { cobrar } from "@/lib/game/limite";
import { atorGestao, atualizarComVersao, corpoGestao, erroResposta, ErroGestao, filtroClube, perfilParaTela } from "@/lib/game/gestao-servidor";

export const dynamic = "force-dynamic";
const decisao = z.object({ clubId: z.string(), plataforma: z.enum(["common-gen5", "common-gen4"]), versao: z.number().int().nonnegative(),
  acao: z.enum(["aprovar", "recusar", "suspender", "reativar"]), motivo: z.string().trim().min(10).max(2000),
  donoUserId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();

export async function GET(req: Request) {
  try {
    const ator = await atorGestao(); if (!ator.federacao) throw new ErroGestao(403, "Acesso reservado à federação.");
    const limite = await cobrar(req, "campeonato-leitura", "federacao"); if (!limite.ok) return limite.resposta!;
    const url = new URL(req.url);
    const estado = z.enum(["pendente", "aprovado", "recusado", "suspenso"]).safeParse(url.searchParams.get("estado") ?? "pendente");
    if (!estado.success) throw new ErroGestao(400, "Estado inválido.");
    const pagina = Math.max(0, Math.min(10000, Number(url.searchParams.get("pagina")) || 0));
    if (!Number.isInteger(pagina)) throw new ErroGestao(400, "Página inválida.");
    const perfis = await GameClubePerfil.find({ estado: estado.data }).sort({ updatedAt: -1, _id: -1 }).skip(pagina * 30).limit(31);
    return NextResponse.json({ perfis: await Promise.all(perfis.slice(0, 30).map((p) => perfilParaTela(p, ator))), mais: perfis.length > 30 }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return erroResposta(e); }
}

export async function PATCH(req: Request) {
  try {
    const ator = await atorGestao(); if (!ator.federacao) throw new ErroGestao(403, "Acesso reservado à federação.");
    const limite = await cobrar(req, "campeonato-escrita", "federacao"); if (!limite.ok) return limite.resposta!;
    const parsed = decisao.safeParse(await corpoGestao(req));
    if (!parsed.success) throw new ErroGestao(400, "Informe uma decisão e justificativa de 10 a 2000 caracteres.");
    const body = parsed.data;
    const filtro = filtroClube(body.clubId, body.plataforma);
    const perfil = await GameClubePerfil.findOne(filtro);
    if (!perfil) throw new ErroGestao(404, "Clube não encontrado.");
    if (perfil.versao !== body.versao) throw new ErroGestao(409, "Atualize o clube antes de decidir.");
    let alteracoes: Record<string, unknown>;
    if (body.acao === "aprovar") {
      if (!["pendente", "recusado"].includes(perfil.estado) || !body.donoUserId || !perfil.solicitantes.some((s) => String(s.userId) === body.donoUserId)) throw new ErroGestao(409, "Selecione um solicitante de um clube ainda sem gestão aprovada.");
      if (body.donoUserId === ator.id) throw new ErroGestao(403, "Outro administrador deve revisar sua própria solicitação.");
      const prova = perfil.solicitantes.find((s) => String(s.userId) === body.donoUserId)?.desafio;
      if (!prova?.verificadoEm || !prova.expiraEm || prova.expiraEm <= new Date()) throw new ErroGestao(409, "O solicitante precisa verificar um código de acesso ao Pro ainda válido. Isso não substitui sua revisão da responsabilidade pelo clube.");
      alteracoes = { estado: "aprovado", donoUserId: body.donoUserId, membros: [] };
    } else if (body.acao === "recusar") {
      if (perfil.estado !== "pendente") throw new ErroGestao(409, "Somente solicitações pendentes podem ser recusadas.");
      alteracoes = { estado: "recusado" };
    } else if (body.acao === "suspender") {
      throw new ErroGestao(409, "Abra uma apuração com evidência. Suspensão cautelar e decisão após defesa são registradas na apuração.");
    } else {
      if (perfil.estado !== "suspenso" || !perfil.donoUserId) throw new ErroGestao(409, "Somente clubes suspensos com dono podem ser reativados.");
      if (String(perfil.donoUserId) === ator.id) throw new ErroGestao(403, "Outro administrador deve revisar a reativação do seu clube.");
      if ((perfil.apuracoes ?? []).some(c => c.estado !== "decidida" && c.cautelar)) throw new ErroGestao(409, "Conclua a apuração cautelar antes de reativar o clube.");
      alteracoes = { estado: "aprovado" };
    }
    const atualizado = await atualizarComVersao(filtro, body.versao, alteracoes, ator.id, body.acao, body.motivo);
    return NextResponse.json({ perfil: await perfilParaTela(atualizado, ator) });
  } catch (e) { return erroResposta(e); }
}
