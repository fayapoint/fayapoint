import { NextResponse } from "next/server";
import { getHistorico } from "@/lib/radar-historico";
import { getNicho, NICHO_PADRAO } from "@/lib/radar";

/**
 * GET /api/radar/historico?nicho=geral&dias=30&series=5
 *
 * A trajetória dos termos de um nicho ao longo dos dias medidos. Público, como o
 * resto do Radar — o dado é medição de fonte aberta, não tem o que proteger.
 *
 * Devolve 200 com série vazia quando ainda não há histórico, em vez de erro: o
 * gráfico sabe desenhar o estado "a série começa hoje", e um 500 aqui apagaria
 * a página inteira do Radar por causa de um painel secundário.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const nicho = getNicho(params.get("nicho") ?? NICHO_PADRAO);

  const dias = Math.min(Math.max(Number(params.get("dias")) || 30, 2), 90);
  const series = Math.min(Math.max(Number(params.get("series")) || 5, 1), 5);

  const historico = await getHistorico(nicho.id, dias, series);

  return NextResponse.json(historico, {
    headers: {
      // O histórico só muda quando entra um dia novo — cache longo é seguro.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
