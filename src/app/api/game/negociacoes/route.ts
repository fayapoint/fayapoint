import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { cobrar } from "@/lib/game/limite";
import { atorGestao, corpoGestao, erroResposta } from "@/lib/game/gestao-servidor";
import { criarProposta, quadro, type PedidoProposta } from "@/lib/game/negociacao-servidor";

/**
 * GET  /api/game/negociacoes — quadro de transferências: concluídas (público),
 *      clubes à venda, e — logado — as minhas negociações e os clubes que eu gero.
 * POST /api/game/negociacoes — nova proposta (clube ou jogador). Prende as
 *      fichas em custódia até a resposta.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const teto = await cobrar(req, "negociacao-leitura");
  if (!teto.ok) return teto.resposta!;
  try {
    const auth = await getAuthUser();
    return NextResponse.json(await quadro(auth?.id ?? null), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return erroResposta(e);
  }
}

export async function POST(req: Request) {
  const teto = await cobrar(req, "negociacao-escrita");
  if (!teto.ok) return teto.resposta!;
  try {
    const ator = await atorGestao();
    const corpo = (await corpoGestao(req)) as PedidoProposta;
    const neg = await criarProposta(ator.id, corpo);
    return NextResponse.json({ ok: true, id: String(neg._id) }, { status: 201 });
  } catch (e) {
    return erroResposta(e);
  }
}
