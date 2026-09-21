import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import { atorGestao, corpoGestao, erroResposta } from "@/lib/game/gestao-servidor";
import { responder } from "@/lib/game/negociacao-servidor";

/** POST /api/game/negociacoes/[id] — { acao: "aceitar" | "recusar" | "cancelar" } */
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const teto = await cobrar(req, "negociacao-escrita");
  if (!teto.ok) return teto.resposta!;
  try {
    const { id } = await params;
    const ator = await atorGestao();
    const corpo = (await corpoGestao(req)) as { acao?: unknown };
    const neg = await responder(ator.id, id, corpo?.acao);
    return NextResponse.json({ ok: true, estado: neg?.estado ?? null });
  } catch (e) {
    return erroResposta(e);
  }
}
