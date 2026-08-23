import { NextResponse } from "next/server";
import { searchClubs, type EaPlatform } from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/busca?nome=<clube>&plataforma=common-gen5
 *
 * Busca clubes na API pública de Clubs da EA. Público, sem auth — é a mesma
 * consulta que o site oficial da EA faz aberto.
 *
 * Cache de 10 min na borda: a lista de clubes com um dado nome quase não muda,
 * e cada acerto de cache é uma requisição a menos batendo na Akamai da EA.
 * `Netlify-Vary` é obrigatório: sem ele a borda da Netlify ignora a query e
 * serviria a busca de um nome para todos os outros.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nome = (url.searchParams.get("nome") ?? "").trim();
  const plataforma = (url.searchParams.get("plataforma") ?? "common-gen5") as EaPlatform;

  if (nome.length < 2) {
    return NextResponse.json({ clubs: [] }, { status: 200 });
  }

  const clubs = await searchClubs(nome, plataforma);
  return NextResponse.json(
    { clubs: clubs.slice(0, 20) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        "Netlify-Vary": "query=nome|plataforma",
      },
    }
  );
}
