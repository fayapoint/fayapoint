import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { cobrar } from "@/lib/game/limite";
import {
  carregarCompeticao,
  ehOrganizador,
  montarClassificacao,
  montarArtilharia,
} from "@/lib/game/competicao-servidor";

/**
 * GET /api/game/campeonato/[slug]
 *
 * Tudo que a página do campeonato precisa, numa resposta só: a competição, os
 * times, os confrontos, a classificação já calculada e a artilharia.
 *
 * A classificação é calculada AQUI, no servidor, e não no navegador. Duas
 * razões: os critérios de desempate são regra de negócio (e regra de negócio no
 * cliente é regra que qualquer um edita), e a mesma tabela é usada pelo pôster
 * do campeão, que roda no servidor e não tem React.
 *
 * `souOrganizador` vem junto para a tela saber o que mostrar — mas quem decide
 * de verdade é sempre a rota de escrita, nunca este campo.
 */
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const teto = await cobrar(req, "campeonato-leitura", slug);
  if (!teto.ok) return teto.resposta!;

  const dados = await carregarCompeticao(slug);
  if (!dados) return NextResponse.json({ error: "campeonato não encontrado" }, { status: 404 });

  const user = await getAuthUser();
  const { geral, porGrupo } = montarClassificacao(dados);

  return NextResponse.json(
    {
      competicao: {
        ...dados.competicao.toObject(),
        _id: String(dados.competicao._id),
        organizadorUserId: undefined,
      },
      souOrganizador: user ? ehOrganizador(dados.competicao, user.id) : false,
      times: dados.times.map((t) => ({
        ...t.toObject(),
        _id: String(t._id),
        competicaoId: undefined,
      })),
      confrontos: dados.confrontos.map((c) => ({
        ...c.toObject(),
        _id: String(c._id),
        competicaoId: undefined,
        mandanteId: c.mandanteId ? String(c.mandanteId) : null,
        visitanteId: c.visitanteId ? String(c.visitanteId) : null,
      })),
      classificacao: geral,
      grupos: porGrupo,
      artilharia: montarArtilharia(dados),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
