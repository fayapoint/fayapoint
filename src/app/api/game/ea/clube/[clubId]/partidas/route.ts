import { NextResponse } from "next/server";
import { TIPOS_PARTIDA, type EaPlatform, type MatchType } from "@/lib/game/ea-api";
import { partidasComEspelho } from "@/lib/game/espelho";

/**
 * GET /api/game/ea/clube/[clubId]/partidas?tipo=todas|leagueMatch|playoffMatch|friendlyMatch
 *
 * As partidas com a estatística POR JOGADOR de cada uma — é daqui que a ingestão
 * da liga vai casar resultado declarado com resultado observado (Fase 1 do
 * PLANO_GAME), e é o que alimenta o calendário da central do clube.
 *
 * Passa pelo ESPELHO. Aqui ele não é só um plano B para o 403 da EA: **é a
 * única forma de ter histórico**. A EA devolve no máximo 10 partidas por tipo
 * (30 no total), sem paginação e sem consulta por `matchId` — tudo que passa
 * disso a fonte descarta. O espelho guarda por `matchId` e serve até 60.
 *
 * O filtro por tipo é aplicado depois da leitura, porque no espelho as partidas
 * vivem numa coleção só, ordenadas no tempo.
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
  const plataforma: EaPlatform = pedida === "common-gen4" ? "common-gen4" : "common-gen5";

  if (!/^\d{1,12}$/.test(clubId)) {
    return NextResponse.json({ error: "clubId inválido" }, { status: 400 });
  }

  const r = await partidasComEspelho(clubId, plataforma);
  const matches = TIPOS_PARTIDA.includes(tipoParam as MatchType)
    ? r.dados.filter((p) => p.matchType === tipoParam)
    : r.dados;

  return NextResponse.json(
    { matches, fonte: r.fonte, capturedAt: r.capturedAt, sourceGrade: "B" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Netlify-Vary": "query=tipo|plataforma",
      },
    }
  );
}
