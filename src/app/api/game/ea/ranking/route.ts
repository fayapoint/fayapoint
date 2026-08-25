import { NextResponse } from "next/server";
import { rankingGlobal, divisoes, type EaPlatform } from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/ranking?plataforma=common-gen5
 *
 * O ranking global de todos os tempos do modo Clubs (os 100 melhores da
 * piscina) + a tabela de regras de divisão.
 *
 * Por que existe: a landing tinha uma tabela de classificação VAZIA, esperando
 * uma liga que só começa em outubro. Uma tabela vazia não ensina nada e lê como
 * carregamento quebrado. Esta rota traz uma tabela real, cheia e verificável —
 * a mesma que a EA publica — para a página ter classificação de verdade hoje.
 *
 * A EA não pagina este endpoint: sempre os mesmos 100, `offset`/`page` são
 * ignorados. Cache de 1h porque o topo de um ranking de todos os tempos não se
 * mexe em minutos.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pedida = url.searchParams.get("plataforma");
  const plataforma: EaPlatform = pedida === "common-gen4" ? "common-gen4" : "common-gen5";
  const limite = Math.min(100, Math.max(5, Number(url.searchParams.get("limite") ?? 25)));

  const [linhas, divs] = await Promise.all([rankingGlobal(plataforma), divisoes()]);

  return NextResponse.json(
    {
      ranking: linhas.slice(0, limite),
      total: linhas.length,
      divisoes: divs,
      plataforma,
      sourceGrade: "B",
      capturedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
        "Netlify-Vary": "query=plataforma|limite",
      },
    }
  );
}
