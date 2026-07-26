import { NextResponse } from "next/server";
import { getRadar, getNicho, NICHO_PADRAO } from "@/lib/radar";

/**
 * GET /api/radar?nicho=advogados
 *
 * Mede a demanda de busca de um nicho no autocomplete do Google e do YouTube.
 * Público, sem auth, sem chave de API — a fonte é gratuita por natureza.
 *
 * A home já pinta com o snapshot de `src/data/landing/radar-seed.json`; esta
 * rota é a medição ao vivo que entra por cima. Se ela falhar, o visitante
 * continua vendo dado real, só mais velho.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const pedido = new URL(req.url).searchParams.get("nicho") ?? NICHO_PADRAO;
  const nicho = getNicho(pedido);

  try {
    const dado = await getRadar(nicho.id);
    return NextResponse.json(dado, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[Radar API] falhou:", error);
    // 200 com lista vazia: o cliente mantém o snapshot que já está na tela.
    return NextResponse.json(
      { nicho: nicho.id, geradoEm: new Date().toISOString(), origem: "seed", consultas: 0, termos: [] },
      { status: 200 }
    );
  }
}
