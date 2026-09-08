import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import { numerosComunidade, amostraComunidade } from "@/lib/game/comunidade-servidor";

/**
 * GET /api/game/comunidade — o retrato da área principal do Winners 22.
 *
 * Os números (online agora, campeonatos, vagas, jogadores no banco, avaliações)
 * e uma amostra de rostos da comunidade para a nuvem de avatares encher mesmo
 * quando há pouca gente conectada. O `snapshotOnline` embutido dá o primeiro
 * quadro antes de o pulso do cliente começar.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const teto = await cobrar(req, "comunidade");
  if (!teto.ok) return teto.resposta!;

  const [numeros, comunidade] = await Promise.all([numerosComunidade(), amostraComunidade()]);

  return NextResponse.json(
    { ...numeros, comunidade },
    {
      headers: {
        // `Cache-Control` sozinho não chega à borda: `force-dynamic` faz o Next
        // reescrevê-lo como `no-store`. Ver o comentário longo em
        // api/game/copa/[slug]/route.ts. Esta rota é pública e igual para todo
        // mundo — não lê usuário nenhum.
        "Netlify-CDN-Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
      },
    }
  );
}
