import { NextResponse } from "next/server";
import { cobrar } from "@/lib/game/limite";
import { historicoDe, movimento } from "@/lib/game/acervo";
import type { EscopoAcervo } from "@/models/GameAcervo";

/**
 * GET /api/game/acervo/[escopo]/[refId] — a linha do tempo de um campeonato.
 *
 * `escopo` é `copa` (competição de terceiro que a gente cobre) ou `competicao`
 * (campeonato criado por um usuário aqui). **A rota é a mesma para os dois** —
 * é o que o acervo existe para permitir, e o que faz uma tela só servir a copa
 * do Coringa e o campeonato entre amigos.
 *
 * `?chave=` devolve a série de um time ou jogador. Sem ela, devolve o
 * MOVIMENTO: quem subiu e quem caiu no período.
 *
 * O movimento é a pergunta que a tabela sozinha não responde — "quem está em
 * alta?" — e ela só existe porque há fotografia diária. Sem acervo, toda tela
 * de campeonato só sabe falar do presente.
 */
export const dynamic = "force-dynamic";

const ESCOPOS: EscopoAcervo[] = ["copa", "competicao"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ escopo: string; refId: string }> }
) {
  const { escopo, refId } = await params;

  if (!ESCOPOS.includes(escopo as EscopoAcervo)) {
    return NextResponse.json(
      { error: "escopo deve ser 'copa' ou 'competicao'" },
      { status: 400 }
    );
  }

  const teto = await cobrar(req, "aposta-leitura", `acervo:${refId}`);
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const chave = url.searchParams.get("chave");
  const tipo = url.searchParams.get("tipo") === "jogador" ? "jogador" : "time";
  const dias = Math.min(90, Math.max(1, Number(url.searchParams.get("dias") ?? 7)));

  if (chave) {
    const serie = await historicoDe(escopo as EscopoAcervo, refId, tipo, chave);
    return NextResponse.json(
      {
        escopo,
        refId,
        tipo,
        chave,
        pontos: serie,
        // Uma fotografia só não é linha do tempo. A tela precisa saber disso
        // para desenhar "primeiro dia de acervo" em vez de um gráfico de um
        // ponto, que parece dado faltando.
        aviso:
          serie.length < 2
            ? "ainda só há uma fotografia deste campeonato — a linha do tempo começa a partir da segunda"
            : null,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  }

  const campo = url.searchParams.get("campo") ?? "pontos";
  const { linhas, diasComFotografia } = await movimento(escopo as EscopoAcervo, refId, campo, dias);

  /**
   * Com menos de dois dias de acervo NÃO HÁ movimento para reportar, e a
   * resposta precisa dizer isso em vez de devolver uma lista de deltas zero.
   *
   * Com uma fotografia só, `primeiro` e `ultimo` são a mesma linha e todo
   * delta dá zero — a tela mostraria "onze times parados", que lê como
   * observação ("ninguém pontuou") quando é ausência de medida. Zero
   * calculado nunca vira fato medido; é a regra da casa e ela vale aqui.
   */
  const semComparacao = diasComFotografia < 2;

  return NextResponse.json(
    {
      escopo,
      refId,
      campo,
      dias,
      diasComFotografia,
      subiram: semComparacao ? [] : linhas.filter((m) => m.delta > 0).slice(0, 10),
      cairam: semComparacao ? [] : linhas.filter((m) => m.delta < 0).slice(-10).reverse(),
      parados: semComparacao ? null : linhas.filter((m) => m.delta === 0).length,
      aviso: semComparacao
        ? `o acervo tem ${diasComFotografia} dia(s) de fotografia neste período — comparar exige ao menos dois. Não há movimento a declarar, e isso não quer dizer que ninguém se mexeu.`
        : null,
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
  );
}
