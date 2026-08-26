import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import GameCompeticao from "@/models/GameCompeticao";
import GameTime from "@/models/GameTime";
import GameConfronto from "@/models/GameConfronto";
import { cobrar } from "@/lib/game/limite";
import {
  carregarCompeticao,
  ehOrganizador,
  paraRegras,
  paraTimeMotor,
} from "@/lib/game/competicao-servidor";
import {
  gerarPontosCorridos,
  gerarMataMata,
  gerarGruposMataMata,
  type ConfrontoNovo,
} from "@/lib/game/campeonato";

/**
 * POST   /api/game/campeonato/[slug]/gerar — gera a tabela/chaveamento
 * DELETE /api/game/campeonato/[slug]/gerar — apaga a tabela e volta às inscrições
 *
 * Gerar é o momento em que o campeonato deixa de ser uma lista de nomes e vira
 * um calendário. Por isso ele é **irreversível enquanto houver resultado**: a
 * rota se recusa a regerar por cima de confrontos já disputados, porque isso
 * apagaria placar de jogo que aconteceu de verdade. Para regerar, o organizador
 * apaga a tabela explicitamente — e a rota de apagar também se recusa se algum
 * confronto já estiver confirmado.
 */
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "campeonato-escrita", slug);
  if (!teto.ok) return teto.resposta!;

  const dados = await carregarCompeticao(slug);
  if (!dados) return NextResponse.json({ error: "campeonato não encontrado" }, { status: 404 });
  if (!ehOrganizador(dados.competicao, user.id)) {
    return NextResponse.json({ error: "só o organizador gera a tabela" }, { status: 403 });
  }
  if (dados.confrontos.length > 0) {
    return NextResponse.json(
      { error: "a tabela já existe — apague antes de gerar de novo" },
      { status: 409 }
    );
  }

  const times = dados.times.map(paraTimeMotor);
  if (times.length < 2) {
    return NextResponse.json({ error: "inscreva pelo menos 2 times" }, { status: 400 });
  }

  const regras = paraRegras(dados.competicao);
  let novos: ConfrontoNovo[] = [];
  let gruposAtribuidos: Map<string, ReturnType<typeof paraTimeMotor>[]> | null = null;

  switch (dados.competicao.formato) {
    case "mata-mata":
      novos = gerarMataMata(times, regras.idaEVoltaMataMata);
      break;
    case "grupos-mata-mata": {
      const r = gerarGruposMataMata(times, regras);
      novos = r.confrontos;
      gruposAtribuidos = r.grupos;
      break;
    }
    default:
      novos = gerarPontosCorridos(times, regras.turnos);
  }

  if (novos.length === 0) {
    return NextResponse.json({ error: "não foi possível montar a tabela" }, { status: 400 });
  }

  // A serpentina dos grupos só existe na memória do motor; grava-se aqui, senão
  // a classificação por grupo não teria como saber quem é de qual.
  if (gruposAtribuidos) {
    const ops = [];
    for (const [letra, integrantes] of gruposAtribuidos) {
      for (const t of integrantes) {
        ops.push({
          updateOne: { filter: { _id: t.id }, update: { $set: { grupo: letra } } },
        });
      }
    }
    if (ops.length > 0) await GameTime.bulkWrite(ops, { ordered: false });
  }

  await GameConfronto.insertMany(
    novos.map((c) => ({
      competicaoId: dados.competicao._id,
      fase: c.fase,
      rodada: c.rodada,
      grupo: c.grupo ?? undefined,
      chave: c.chave ?? undefined,
      perna: c.perna,
      // As vagas do mata-mata que ainda esperam vencedor ficam vazias.
      mandanteId: c.mandanteId && !c.mandanteId.startsWith("__") ? c.mandanteId : undefined,
      visitanteId: c.visitanteId && !c.visitanteId.startsWith("__") ? c.visitanteId : undefined,
      status: c.status,
      sourceGrade: "E",
    }))
  );

  await GameCompeticao.updateOne(
    { _id: dados.competicao._id },
    { $set: { status: "em-andamento" } }
  );

  return NextResponse.json({ ok: true, confrontos: novos.length });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "campeonato-escrita", slug);
  if (!teto.ok) return teto.resposta!;

  const dados = await carregarCompeticao(slug);
  if (!dados) return NextResponse.json({ error: "campeonato não encontrado" }, { status: 404 });
  if (!ehOrganizador(dados.competicao, user.id)) {
    return NextResponse.json({ error: "só o organizador apaga a tabela" }, { status: 403 });
  }

  const jogados = dados.confrontos.filter((c) => c.status === "confirmado" || c.status === "wo");
  // O `wo` de bye não é jogo disputado; só barra o que teve placar de verdade.
  const comPlacar = jogados.filter((c) => c.golsMandante != null || c.golsVisitante != null);
  if (comPlacar.length > 0) {
    return NextResponse.json(
      {
        error: `já existem ${comPlacar.length} resultado(s) registrado(s) — apagar a tabela jogaria fora jogo que aconteceu`,
      },
      { status: 409 }
    );
  }

  await GameConfronto.deleteMany({ competicaoId: dados.competicao._id });
  await GameTime.updateMany({ competicaoId: dados.competicao._id }, { $unset: { grupo: "" } });
  await GameCompeticao.updateOne(
    { _id: dados.competicao._id },
    { $set: { status: "inscricoes" }, $unset: { campeaoTimeId: "", viceTimeId: "" } }
  );

  return NextResponse.json({ ok: true });
}
