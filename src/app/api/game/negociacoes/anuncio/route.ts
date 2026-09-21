import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import { atorGestao, corpoGestao, erroResposta } from "@/lib/game/gestao-servidor";
import { anunciarClube } from "@/lib/game/negociacao-servidor";

/**
 * POST /api/game/negociacoes/anuncio — o dono põe (ou tira) o clube à venda.
 * { clubId, plataforma, preco: number | null, nota? }
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const teto = await cobrar(req, "negociacao-escrita");
  if (!teto.ok) return teto.resposta!;
  try {
    const ator = await atorGestao();
    const c = (await corpoGestao(req)) as { clubId?: unknown; plataforma?: unknown; preco?: unknown; nota?: unknown };
    const clubId = String(c.clubId ?? "");
    if (!/^\d{1,12}$/.test(clubId)) return NextResponse.json({ error: "Clube inválido." }, { status: 400 });
    const preco = c.preco == null ? null : Number(c.preco);
    const r = await anunciarClube(ator.id, clubId, c.plataforma, preco, String(c.nota ?? ""));
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return erroResposta(e);
  }
}
