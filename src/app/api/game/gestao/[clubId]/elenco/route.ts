import { NextResponse } from "next/server";
import GameClubePerfil from "@/models/GameClubePerfil";
import { atorGestao, autorizado, erroResposta, ErroGestao, filtroClube } from "@/lib/game/gestao-servidor";
import { painelElenco } from "@/lib/game/integridade-servidor";
import { cobrar } from "@/lib/game/limite";

export const dynamic = "force-dynamic";
export async function GET(req: Request, ctx: { params: Promise<{ clubId: string }> }) {
  try {
    const ator = await atorGestao();
    const limite = await cobrar(req, "campeonato-leitura", "gestao-elenco"); if (!limite.ok) return limite.resposta!;
    const filtro = filtroClube((await ctx.params).clubId, new URL(req.url).searchParams.get("plataforma") ?? "common-gen5");
    const perfil = await GameClubePerfil.findOne(filtro);
    if (!ator.federacao && (!perfil || !autorizado(perfil, ator.id, "elenco"))) throw new ErroGestao(403, "Acesso reservado aos responsáveis pelo elenco.");
    return NextResponse.json(await painelElenco(filtro.eaClubId, filtro.plataforma), { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return erroResposta(e); }
}
