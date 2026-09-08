import { NextResponse } from "next/server";
import { atorGestao, erroResposta, ErroGestao } from "@/lib/game/gestao-servidor";
import { quadroIntegridade } from "@/lib/game/integridade-servidor";
import { cobrar } from "@/lib/game/limite";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const ator = await atorGestao(); if (!ator.federacao) throw new ErroGestao(403, "Acesso reservado à federação.");
    const limite = await cobrar(req, "campeonato-leitura", "federacao-integridade"); if (!limite.ok) return limite.resposta!;
    const url = new URL(req.url); const plataforma = url.searchParams.get("plataforma") ?? "common-gen5";
    const pagina = Number(url.searchParams.get("pagina") ?? "0");
    if (!["common-gen5", "common-gen4"].includes(plataforma) || !Number.isInteger(pagina) || pagina < 0 || pagina > 10000) throw new ErroGestao(400, "Plataforma ou página inválida.");
    return NextResponse.json(await quadroIntegridade(plataforma, pagina), { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return erroResposta(e); }
}
