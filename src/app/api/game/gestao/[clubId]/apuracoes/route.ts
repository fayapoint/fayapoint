import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import GameClubePerfil from "@/models/GameClubePerfil";
import { atorGestao, atualizarComVersao, corpoGestao, erroResposta, ErroGestao, filtroClube } from "@/lib/game/gestao-servidor";
import { decidirApuracao, registrarDefesa, type ApuracaoClube } from "@/lib/game/federacao";
import { cobrar } from "@/lib/game/limite";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ clubId: string }> };
const comum = { plataforma: z.enum(["common-gen5", "common-gen4"]), versao: z.number().int().nonnegative() };
const texto = z.string().trim().min(10).max(2000);
const esquema = z.discriminatedUnion("acao", [
  z.object({ ...comum, acao: z.literal("abrir"), motivo: texto, evidencia: texto, cautelar: z.boolean() }).strict(),
  z.object({ ...comum, acao: z.literal("defesa"), id: z.string().uuid(), texto }).strict(),
  z.object({ ...comum, acao: z.literal("decidir"), id: z.string().uuid(), resultado: z.enum(["arquivar", "advertir", "suspender"]), motivo: texto }).strict(),
]);

function paraTela(apuracoes: ApuracaoClube[]) {
  return apuracoes.map(c => ({ id: c.id, estado: c.estado, motivo: c.motivo, evidencia: c.evidencia, cautelar: c.cautelar,
    abertaEm: c.abertaEm.toISOString(), defesa: c.defesa?.texto ? { texto: c.defesa.texto, quando: c.defesa.quando.toISOString() } : null,
    decisao: c.decisao?.resultado ? { resultado: c.decisao.resultado, motivo: c.decisao.motivo, quando: c.decisao.quando.toISOString() } : null,
  }));
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const ator = await atorGestao();
    const limite = await cobrar(req, "campeonato-leitura", "apuracoes"); if (!limite.ok) return limite.resposta!;
    const filtro = filtroClube((await ctx.params).clubId, new URL(req.url).searchParams.get("plataforma") ?? "common-gen5");
    const perfil = await GameClubePerfil.findOne(filtro);
    if (!perfil) throw new ErroGestao(404, "Clube não encontrado.");
    if (!ator.federacao && String(perfil.donoUserId) !== ator.id) throw new ErroGestao(403, "Somente o dono e a federação podem acompanhar a apuração.");
    return NextResponse.json({ casos: paraTela(perfil.apuracoes ?? []), versao: perfil.versao, federacao: ator.federacao, dono: String(perfil.donoUserId) === ator.id }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return erroResposta(e); }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const ator = await atorGestao();
    const limite = await cobrar(req, "campeonato-escrita", "apuracoes"); if (!limite.ok) return limite.resposta!;
    const parsed = esquema.safeParse(await corpoGestao(req));
    if (!parsed.success) throw new ErroGestao(400, "Dados de apuração inválidos. Motivo, evidência e defesa precisam de 10 a 2000 caracteres.");
    const body = parsed.data;
    const filtro = filtroClube((await ctx.params).clubId, body.plataforma);
    const perfil = await GameClubePerfil.findOne(filtro).lean();
    if (!perfil) throw new ErroGestao(404, "Clube não encontrado.");
    if (perfil.versao !== body.versao) throw new ErroGestao(409, "Atualize a apuração antes de agir.");
    const dono = String(perfil.donoUserId) === ator.id;
    if (body.acao === "defesa" ? !dono : !ator.federacao || dono) throw new ErroGestao(403, "Você não pode executar esta ação nesta apuração.");
    let casos = perfil.apuracoes ?? [];
    let estado = perfil.estado;
    if (body.acao === "abrir") {
      if (perfil.estado !== "aprovado" || !perfil.donoUserId) throw new ErroGestao(409, "Abra apurações somente para clubes com gestão aprovada.");
      if (casos.some(c => c.estado !== "decidida")) throw new ErroGestao(409, "Conclua a apuração em andamento primeiro.");
      if (casos.length >= 50) throw new ErroGestao(409, "Limite de apurações atingido. A federação precisa revisar o histórico.");
      casos = [...casos, { id: randomUUID(), estado: "aguardando-defesa", motivo: body.motivo, evidencia: body.evidencia, cautelar: body.cautelar, abertaEm: new Date(), abertaPor: ator.id }];
      if (body.cautelar) estado = "suspenso";
    } else {
      const caso = casos.find(c => c.id === body.id);
      if (!caso) throw new ErroGestao(404, "Apuração não encontrada.");
      let atualizado: ApuracaoClube;
      try { atualizado = body.acao === "defesa" ? registrarDefesa(caso, body.texto, ator.id, new Date()) : decidirApuracao(caso, body.resultado, body.motivo, ator.id, new Date()); }
      catch (e) { throw new ErroGestao(409, e instanceof Error ? e.message : "Transição inválida."); }
      casos = casos.map(c => c.id === body.id ? atualizado : c);
      if (body.acao === "decidir") {
        if (body.resultado === "suspender") estado = "suspenso";
        else if (caso.cautelar) estado = "aprovado";
      }
    }
    const atualizado = await atualizarComVersao(filtro, body.versao, { apuracoes: casos, estado }, ator.id, `apuracao-${body.acao}`,
      body.acao === "defesa" ? "Defesa apresentada pelo responsável do clube." : body.motivo);
    return NextResponse.json({ casos: paraTela(atualizado.apuracoes), versao: atualizado.versao, federacao: ator.federacao, dono });
  } catch (e) { return erroResposta(e); }
}
