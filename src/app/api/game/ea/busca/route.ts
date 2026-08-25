import { NextResponse } from "next/server";
import {
  buscarClubes,
  clubePorId,
  PLATAFORMAS,
  type EaPlatform,
} from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/busca?nome=<clube|id>&plataforma=todas|common-gen5|common-gen4
 *
 * Busca de clube na fonte pública da EA. Pública, sem auth — é a mesma consulta
 * que o site oficial faz aberto.
 *
 * A v1 fazia UMA consulta, numa piscina só, sem `maxResultCount` — e a EA, sem
 * esse parâmetro, devolve ~14 linhas de um casamento que é só PREFIXO literal.
 * Resultado: clube existente aparecia como inexistente, inclusive o do Ricardo.
 * Agora o trabalho pesado está em `buscarClubes` (leque de prefixos nas duas
 * piscinas + filtro por palavras contidas) e esta rota só decide o modo:
 *
 *  - termo só de dígitos com 4–12 casas → é ID de clube, vai direto no `clubs/info`;
 *  - qualquer outra coisa → busca em leque.
 *
 * Cache de 10 min na borda: a lista de clubes com um dado nome quase não muda,
 * e cada acerto de cache é uma requisição a menos batendo na Akamai da EA.
 * `Netlify-Vary` é obrigatório: sem ele a borda da Netlify ignora a query e
 * serviria a busca de um nome para todos os outros.
 */
export const dynamic = "force-dynamic";

const CACHE = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
  "Netlify-Vary": "query=nome|plataforma",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nome = (url.searchParams.get("nome") ?? "").trim();
  const pedida = url.searchParams.get("plataforma") ?? "todas";
  const plataformas: EaPlatform[] =
    pedida === "common-gen5" || pedida === "common-gen4" ? [pedida] : PLATAFORMAS;

  if (nome.length < 2) {
    return NextResponse.json({ clubs: [], varridos: 0, trilha: [], aproximado: false });
  }

  // Caminho do ID: quem já sabe o número do clube não deve depender do nome.
  if (/^\d{4,12}$/.test(nome)) {
    const clube = await clubePorId(nome);
    return NextResponse.json(
      {
        clubs: clube ? [clube] : [],
        varridos: clube ? 1 : 0,
        trilha: [],
        aproximado: false,
        porId: true,
      },
      { headers: CACHE }
    );
  }

  const { clubes, varridos, trilha, aproximado } = await buscarClubes(nome, { plataformas });

  return NextResponse.json(
    { clubs: clubes, varridos, trilha, aproximado, porId: false },
    { headers: CACHE }
  );
}
