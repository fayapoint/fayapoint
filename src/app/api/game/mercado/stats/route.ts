import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import { estatisticasMercado } from "@/lib/game/mercado-servidor";

/**
 * GET /api/game/mercado/stats — os dados do mercado.
 *
 * Quantos clubes recrutam, quantos jogadores estão livres, o que apareceu na
 * semana e qual posição os clubes mais procuram. Cache curto de borda: o
 * número muda com a publicação, não a cada carga.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const teto = await cobrar(req, "mercado-leitura");
  if (!teto.ok) return teto.resposta!;

  const stats = await estatisticasMercado();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
