import { NextResponse } from "next/server";
import { type EaPlatform } from "@/lib/game/ea-api";
import { clubeComEspelho, divisoesComEspelho } from "@/lib/game/espelho";
import { cobrar } from "@/lib/game/limite";

/**
 * GET /api/game/ea/clube/[clubId]?plataforma=common-gen5
 *
 * Ficha completa do clube: identidade, campanha, elenco da temporada, carreira
 * de cada membro e a tabela de divisões do modo Clubs.
 *
 * Passa pelo ESPELHO (`lib/game/espelho.ts`), que tenta a fonte viva e cai no
 * nosso Mongo quando a EA recusa — o que, para IP de datacenter, é sempre.
 * A resposta declara `fonte` e `capturedAt`.
 *
 * **Descoberta de plataforma**: a v1 assumia `common-gen5` e um clube de PS4
 * devolvia página vazia sem dizer por quê. Quando o cliente não manda a piscina,
 * o espelho tenta as duas.
 *
 * `divisoes()` (o endpoint `settings`) é o único que continua indo direto na EA:
 * é estático por título, não vale um espelho próprio, e quando falhar a régua de
 * divisão simplesmente não aparece.
 */
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const url = new URL(req.url);
  const pedida = url.searchParams.get("plataforma");
  const plataforma: EaPlatform | undefined =
    pedida === "common-gen5" || pedida === "common-gen4" ? pedida : undefined;

  if (!/^\d{1,12}$/.test(clubId)) {
    return NextResponse.json({ error: "clubId inválido" }, { status: 400 });
  }

  // O sufixo separa o orçamento por clube: um clube movimentado não gasta o
  // teto de quem está olhando outro.
  const teto = await cobrar(req, "clube", clubId);
  if (!teto.ok) return teto.resposta!;

  const [r, divs] = await Promise.all([clubeComEspelho(clubId, plataforma), divisoesComEspelho()]);

  if (!r.dados) {
    return NextResponse.json({ error: "clube não encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    {
      info: r.dados.info,
      stats: r.dados.stats,
      members: r.dados.members,
      career: r.dados.career,
      tabela: r.dados.tabela,
      divisoes: divs.dados,
      plataforma: r.dados.plataforma,
      fonte: r.fonte,
      capturedAt: r.capturedAt,
      sourceGrade: "B",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Netlify-Vary": "query=plataforma",
      },
    }
  );
}
