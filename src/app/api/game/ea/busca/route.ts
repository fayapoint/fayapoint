import { NextResponse } from "next/server";
import { PLATAFORMAS, type EaPlatform } from "@/lib/game/ea-api";
import { buscarComEspelho, clubeComEspelho } from "@/lib/game/espelho";
import { cobrar } from "@/lib/game/limite";

/**
 * GET /api/game/ea/busca?nome=<clube|id>&plataforma=todas|common-gen5|common-gen4
 *
 * Busca de clube. Pública, sem auth.
 *
 * Duas correções moram aqui, ambas de 25/08/2026:
 *
 * 1. **A busca da EA é fraca de um jeito que escondia clubes**: casa só PREFIXO
 *    da string inteira, com espaço literal (e o jogo guarda nomes com espaço
 *    duplo), e sem `maxResultCount` devolve ~14 linhas. O motor em leque de
 *    `buscarClubes` conserta isso.
 * 2. **A EA responde 403 para IP de datacenter** — ou seja, nunca funcionou em
 *    produção. Por isso a rota não fala com a EA direto: fala com o ESPELHO,
 *    que tenta a fonte viva e cai no nosso Mongo quando ela recusa. A resposta
 *    declara `fonte` e `capturedAt` para a tela poder dizer a idade do dado.
 *
 * Cache curto e por query. `Netlify-Vary` é obrigatório: sem ele a borda ignora
 * a query e serviria a busca de um nome para todos os outros.
 */
export const dynamic = "force-dynamic";

const CACHE = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
  "Netlify-Vary": "query=nome|plataforma",
};

export async function GET(req: Request) {
  // A rota mais cara da seção: uma busca em leque chega a 8 idas à EA.
  const teto = await cobrar(req, "busca");
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const nome = (url.searchParams.get("nome") ?? "").trim();
  const pedida = url.searchParams.get("plataforma") ?? "todas";
  const plataformas: EaPlatform[] =
    pedida === "common-gen5" || pedida === "common-gen4" ? [pedida] : PLATAFORMAS;

  if (nome.length < 2) {
    return NextResponse.json({
      clubs: [],
      varridos: 0,
      trilha: [],
      aproximado: false,
      fonte: "vazio",
      capturedAt: null,
    });
  }

  // Caminho do ID: quem já sabe o número do clube não deve depender do nome.
  if (/^\d{4,12}$/.test(nome)) {
    const r = await clubeComEspelho(nome);
    const clube = r.dados?.info ?? null;
    return NextResponse.json(
      {
        clubs: clube ? [clube] : [],
        varridos: clube ? 1 : 0,
        trilha: [],
        aproximado: false,
        porId: true,
        fonte: r.fonte,
        capturedAt: r.capturedAt,
      },
      { headers: CACHE }
    );
  }

  const r = await buscarComEspelho(nome, plataformas);

  return NextResponse.json(
    {
      clubs: r.dados,
      varridos: r.varridos,
      trilha: [],
      aproximado: r.aproximado,
      porId: false,
      fonte: r.fonte,
      capturedAt: r.capturedAt,
    },
    { headers: CACHE }
  );
}
