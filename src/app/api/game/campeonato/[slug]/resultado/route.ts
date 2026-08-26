import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import GameCompeticao from "@/models/GameCompeticao";
import GameConfronto from "@/models/GameConfronto";
import { cobrar } from "@/lib/game/limite";
import {
  carregarCompeticao,
  ehOrganizador,
  paraConfrontoMotor,
  paraObjectId,
} from "@/lib/game/competicao-servidor";
import { avancarChaveamento, campeao, vencedorDoPar } from "@/lib/game/campeonato";

/**
 * POST /api/game/campeonato/[slug]/resultado
 * body: { confrontoId, golsMandante, golsVisitante, destaques?, eaMatchId? }
 *
 * Registra o placar de um confronto e faz o campeonato ANDAR: preenche as vagas
 * da fase seguinte do mata-mata e declara o campeão quando a final termina.
 * Fazer isso aqui, e não numa tarefa depois, é o que evita a tela mostrar uma
 * semifinal decidida com a final ainda vazia.
 *
 * **Procedência do placar.** `sourceGrade` sai de `E` (alguém digitou) para `B`
 * quando vem `eaMatchId` — a partida foi casada com o que a EA publicou. A
 * tabela mostra a diferença; ela é o começo do "resultado por consenso" do
 * PLANO_GAME (dois capitães confirmam, divergência vai ao organizador).
 *
 * Por enquanto quem registra é o organizador. O botão do capitão entra quando o
 * vínculo de time↔conta estiver verificado — registrar sem posse provada seria
 * dar a qualquer um o placar de qualquer jogo.
 */
export const dynamic = "force-dynamic";

const limitarGols = (v: unknown): number | null => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 99) return null;
  return Math.floor(n);
};

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
    return NextResponse.json({ error: "só o organizador registra resultado" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const confrontoId = paraObjectId(body.confrontoId);
  if (!confrontoId) return NextResponse.json({ error: "confrontoId inválido" }, { status: 400 });

  const alvo = dados.confrontos.find((c) => String(c._id) === String(confrontoId));
  if (!alvo) return NextResponse.json({ error: "confronto não é deste campeonato" }, { status: 404 });
  if (!alvo.mandanteId || !alvo.visitanteId) {
    return NextResponse.json(
      { error: "este confronto ainda espera os classificados da fase anterior" },
      { status: 409 }
    );
  }

  const gm = limitarGols(body.golsMandante);
  const gv = limitarGols(body.golsVisitante);
  if (gm == null || gv == null) {
    return NextResponse.json({ error: "placar inválido (0 a 99)" }, { status: 400 });
  }

  const eaMatchId = String(body.eaMatchId ?? "").trim() || undefined;
  const destaques = sanearDestaques(body.destaques);

  await GameConfronto.updateOne(
    { _id: confrontoId },
    {
      $set: {
        golsMandante: gm,
        golsVisitante: gv,
        status: "confirmado",
        jogadaEm: body.jogadaEm ? new Date(String(body.jogadaEm)) : new Date(),
        eaMatchId,
        // Casado com a partida publicada pela EA = observação, não declaração.
        sourceGrade: eaMatchId ? "B" : "E",
        ...(destaques ? { destaques } : {}),
      },
    }
  );

  // Recarrega para decidir o avanço com o placar novo já dentro.
  const atualizado = await carregarCompeticao(slug);
  if (!atualizado) return NextResponse.json({ ok: true });

  const confrontos = atualizado.confrontos.map(paraConfrontoMotor);
  const mudancas = avancarChaveamento(confrontos);
  if (mudancas.length > 0) {
    await GameConfronto.bulkWrite(
      mudancas.map((m) => ({
        updateOne: {
          filter: { _id: m.id },
          update: {
            $set: {
              ...(m.mandanteId ? { mandanteId: m.mandanteId } : {}),
              ...(m.visitanteId ? { visitanteId: m.visitanteId } : {}),
            },
          },
        },
      })),
      { ordered: false }
    );
  }

  // Campeão: só quando a final terminou de verdade.
  const vencedor = campeao(confrontos);
  if (vencedor) {
    const final = confrontos.filter((c) => c.fase === "final");
    const perdedor =
      final
        .flatMap((c) => [c.mandanteId, c.visitanteId])
        .find((id) => id && id !== vencedor) ?? undefined;
    await GameCompeticao.updateOne(
      { _id: atualizado.competicao._id },
      {
        $set: {
          status: "encerrada",
          campeaoTimeId: vencedor,
          viceTimeId: perdedor,
          fimEm: new Date(),
        },
      }
    );
  }

  return NextResponse.json({
    ok: true,
    avancou: mudancas.length,
    campeao: vencedor ?? null,
    parDecidido: vencedorDoPar(confrontos.filter((c) => c.chave === alvo.chave && c.fase === alvo.fase)),
  });
}

/**
 * Os destaques vêm da tela e podem vir de qualquer forma. Aqui eles são
 * cortados no tamanho e no tipo antes de encostar no banco — é súmula, não
 * campo livre, e ela alimenta o pôster do campeão.
 */
function sanearDestaques(cru: unknown) {
  if (!cru || typeof cru !== "object") return null;
  const o = cru as Record<string, unknown>;
  const lista = (v: unknown) =>
    (Array.isArray(v) ? v : [])
      .slice(0, 22)
      .map((x) => {
        const i = (x ?? {}) as Record<string, unknown>;
        return {
          gamertag: String(i.gamertag ?? "").trim().slice(0, 40),
          timeId: paraObjectId(i.timeId) ?? undefined,
          quantidade: Math.min(20, Math.max(1, Number(i.quantidade ?? 1) || 1)),
        };
      })
      .filter((i) => i.gamertag.length >= 2);

  const notas = (Array.isArray(o.notas) ? o.notas : [])
    .slice(0, 22)
    .map((x) => {
      const i = (x ?? {}) as Record<string, unknown>;
      const nota = Number(i.nota);
      return {
        gamertag: String(i.gamertag ?? "").trim().slice(0, 40),
        nota: Number.isFinite(nota) ? Math.min(10, Math.max(0, nota)) : 0,
        posicao: i.posicao ? String(i.posicao).slice(0, 20) : undefined,
      };
    })
    .filter((i) => i.gamertag.length >= 2);

  const craqueTag = String((o.craque as Record<string, unknown>)?.gamertag ?? "").trim();

  return {
    gols: lista(o.gols),
    assistencias: lista(o.assistencias),
    notas,
    craque: craqueTag
      ? {
          gamertag: craqueTag.slice(0, 40),
          nota: Number((o.craque as Record<string, unknown>)?.nota) || undefined,
        }
      : undefined,
  };
}
