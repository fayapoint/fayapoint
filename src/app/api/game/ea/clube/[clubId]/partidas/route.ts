import { NextResponse } from "next/server";
import {
  clubMatches,
  clubMatchesTodas,
  TIPOS_PARTIDA,
  type EaPlatform,
  type MatchType,
} from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/clube/[clubId]/partidas?tipo=todas|leagueMatch|playoffMatch|friendlyMatch
 *
 * As partidas recentes com a estatística POR JOGADOR de cada uma — é daqui que
 * a ingestão da liga vai casar resultado declarado com resultado observado
 * (Fase 1 do PLANO_GAME), e é o que alimenta o calendário da central do clube.
 *
 * `tipo=todas` (o novo padrão do calendário) junta os três tipos numa linha do
 * tempo única e ordenada. A EA limita a 10 por tipo — `maxResultCount` acima
 * disso é ignorado —, então o teto real é 30 partidas.
 */
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const url = new URL(req.url);
  const tipoParam = url.searchParams.get("tipo") ?? "todas";
  const pedida = url.searchParams.get("plataforma");
  const plataforma: EaPlatform =
    pedida === "common-gen4" ? "common-gen4" : "common-gen5";

  if (!/^\d{1,12}$/.test(clubId)) {
    return NextResponse.json({ error: "clubId inválido" }, { status: 400 });
  }

  const matches = TIPOS_PARTIDA.includes(tipoParam as MatchType)
    ? await clubMatches(clubId, tipoParam as MatchType, plataforma)
    : await clubMatchesTodas(clubId, plataforma);

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
