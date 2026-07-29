import { NextResponse } from "next/server";
import { getLeitura } from "@/lib/radar-leitura";

/**
 * GET /api/radar/leitura?dias=30
 *
 * Quantas pessoas leram sobre cada tema de IA na Wikipédia em português, dia a
 * dia. Substitui a série do `/api/radar/historico` no gráfico da `/radar`:
 * aquela mostrava posição em autocomplete, que não se move (ver o cabeçalho de
 * `src/lib/radar-leitura.ts`).
 *
 * A Wikimedia consolida uma vez por dia, então cachear por hora é folgado e
 * poupa a API de origem — que é pública, gratuita e mantida por doação.
 */
export const revalidate = 3600;

export async function GET(req: Request) {
  const pedido = Number(new URL(req.url).searchParams.get("dias") ?? 30);
  const dias = Number.isFinite(pedido) ? Math.min(Math.max(pedido, 7), 90) : 30;

  try {
    const dado = await getLeitura(dias);
    return NextResponse.json(dado, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("[Radar leitura] falhou:", error);
    return NextResponse.json({ dias: [], series: [], medidoEm: new Date().toISOString() }, { status: 200 });
  }
}
