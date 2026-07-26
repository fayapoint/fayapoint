import { NextResponse } from "next/server";
import { getMundo } from "@/lib/radar-mundo";
import { getLugar } from "@/data/landing/radar-lugares";

/**
 * GET /api/radar/mundo?lugar=BR-SP
 *
 * O que está em alta naquele lugar agora — buscas do Google Trends e leituras
 * da Wikipedia, sempre com link para a origem. Público, sem chave, sem custo.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const pedido = new URL(req.url).searchParams.get("lugar") ?? "BR";
  const lugar = getLugar(pedido);

  try {
    const dado = await getMundo(lugar.id);
    return NextResponse.json(dado, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200" },
    });
  } catch (error) {
    console.error("[Radar mundo] falhou:", error);
    return NextResponse.json(
      { lugar: lugar.id, nome: lugar.nome, geradoEm: new Date().toISOString(), origem: "live", itens: [] },
      { status: 200 }
    );
  }
}
