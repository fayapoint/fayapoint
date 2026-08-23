import { NextResponse } from "next/server";
import { clubMatches, type EaPlatform, type MatchType } from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/clube/[clubId]/partidas?tipo=leagueMatch&plataforma=common-gen5
 *
 * Últimas partidas do clube (a EA devolve no máximo ~10 por tipo), com a
 * estatística POR JOGADOR de cada uma — é daqui que a ingestão da liga vai
 * casar resultado declarado com resultado observado (Fase 1 do PLANO_GAME).
 */
export const dynamic = "force-dynamic";

const TIPOS: MatchType[] = ["leagueMatch", "playoffMatch", "friendlyMatch"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const url = new URL(req.url);
  const tipoParam = url.searchParams.get("tipo") ?? "leagueMatch";
  const tipo = (TIPOS.includes(tipoParam as MatchType) ? tipoParam : "leagueMatch") as MatchType;
  const plataforma = (url.searchParams.get("plataforma") ?? "common-gen5") as EaPlatform;

  if (!/^\d{1,12}$/.test(clubId)) {
    return NextResponse.json({ error: "clubId inválido" }, { status: 400 });
  }

  const matches = await clubMatches(clubId, tipo, plataforma);
  return NextResponse.json(
    { matches, sourceGrade: "B" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Netlify-Vary": "query=tipo|plataforma",
      },
    }
  );
}
