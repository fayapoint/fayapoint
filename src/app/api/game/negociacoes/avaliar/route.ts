import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import { erroResposta } from "@/lib/game/gestao-servidor";
import { avaliacaoDoClube, avaliacaoDoJogador } from "@/lib/game/negociacao-servidor";
import { plataformaDe } from "@/lib/game/ea-api";

/**
 * GET /api/game/negociacoes/avaliar?tipo=clube&clubId=123&plataforma=common-gen5
 * GET /api/game/negociacoes/avaliar?tipo=jogador&gamertag=Fulano&plataforma=nx
 *
 * Valor de mercado em fichas, com a faixa aceita e as parcelas da conta. Lê o
 * espelho (nunca a EA direto — 403 em produção).
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const teto = await cobrar(req, "negociacao-leitura");
  if (!teto.ok) return teto.resposta!;
  try {
    const url = new URL(req.url);
    const plataforma = plataformaDe(url.searchParams.get("plataforma"));
    if (url.searchParams.get("tipo") === "jogador") {
      const gamertag = (url.searchParams.get("gamertag") ?? "").trim();
      if (gamertag.length < 2 || gamertag.length > 40) return NextResponse.json({ error: "Gamertag inválida." }, { status: 400 });
      const r = await avaliacaoDoJogador(gamertag, plataforma);
      if (!r) return NextResponse.json({ error: "Gamertag não encontrada em nenhum elenco do espelho do FC 27." }, { status: 404 });
      return NextResponse.json(r);
    }
    const clubId = url.searchParams.get("clubId") ?? "";
    if (!/^\d{1,12}$/.test(clubId)) return NextResponse.json({ error: "Clube inválido." }, { status: 400 });
    const r = await avaliacaoDoClube(clubId, plataforma);
    if (!r) return NextResponse.json({ error: "Clube ainda não está no espelho do FC 27." }, { status: 404 });
    return NextResponse.json(r);
  } catch (e) {
    return erroResposta(e);
  }
}
