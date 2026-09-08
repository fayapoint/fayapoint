import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { porSegredoDeServico } from "@/lib/guarda-de-servico";
import { cobrar } from "@/lib/game/limite";
import GameDescoberta, { type EstadoDescoberta } from "@/models/GameDescoberta";
import { validarDecisao } from "@/lib/game/descoberta";
import GameCopa from "@/models/GameCopa";

/**
 * GET   /api/game/descobertas — a fila de candidatos a campeonato
 * PATCH /api/game/descobertas — decide sobre um candidato
 *
 * ## Por que é fechada a admin
 *
 * Um candidato é um grupo de clubes reais que a gente suspeita formarem um
 * torneio. É suspeita nossa, não fato — e publicá-la seria dizer ao mundo
 * "achamos que estes 14 clubes estão num campeonato" sem ter perguntado a
 * ninguém. A fila existe para alguém da casa olhar e decidir; ela vira pública
 * só quando virar cobertura, com nome e evidência.
 *
 * ## A decisão é humana, e fica registrada com motivo
 *
 * Mesmo padrão do quadro de integridade: o automático levanta evidência, o
 * humano decide, e a decisão carrega quem decidiu e por quê. Descartar sem
 * motivo é a forma mais rápida de ninguém entender, seis meses depois, por que
 * aquele torneio nunca foi coberto.
 */
export const dynamic = "force-dynamic";

const ESTADOS: EstadoDescoberta[] = ["novo", "investigando", "descartado", "promovido"];

/**
 * LER pode ser de serviço; DECIDIR, não.
 *
 * O segredo de serviço existe para o coletor conferir a fila sem sessão. Mas o
 * cabeçalho desta rota promete que a decisão é humana e fica registrada com
 * quem decidiu — e a primeira versão aceitava o mesmo segredo no PATCH, o que
 * gravava uma decisão com `decididoPor` vazio. O código contradizia a regra que
 * ele mesmo escreve três parágrafos acima. (Achado pelo Codex, 08/09.)
 *
 * Então a porta é uma só, com uma chave a mais: `exigeHumano`.
 */
async function autorizado(
  req: Request,
  exigeHumano: boolean
): Promise<{ ok: boolean; userId?: string }> {
  if (!exigeHumano && porSegredoDeServico(req, ["x-social-secret", "x-cron-secret", "x-admin-secret"])) {
    return { ok: true };
  }
  const user = await getAuthUser();
  if (user?.role === "admin") return { ok: true, userId: user.id };
  return { ok: false };
}

export async function GET(req: Request) {
  const auth = await autorizado(req, false);
  if (!auth.ok) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const teto = await cobrar(req, "aposta-leitura", "descobertas");
  if (!teto.ok) return teto.resposta!;

  const url = new URL(req.url);
  const estado = url.searchParams.get("estado");

  await dbConnect();
  const filtro: Record<string, unknown> = {};
  if (estado && ESTADOS.includes(estado as EstadoDescoberta)) filtro.estado = estado;

  const lista = await GameDescoberta.find(filtro)
    .sort({ estado: 1, forca: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(
    {
      candidatos: lista.map((d) => ({
        chave: d.chave,
        apelido: d.apelido,
        plataforma: d.plataforma,
        estado: d.estado,
        forca: d.forca,
        densidade: d.densidade,
        confrontos: d.confrontos,
        series: d.series,
        partidas: d.partidas,
        vezesVisto: d.vezesVisto,
        clubes: d.clubes.slice(0, 24),
        primeiraEm: d.primeiraEm ?? null,
        ultimaEm: d.ultimaEm ?? null,
        motivo: d.motivo ?? null,
        copaSlug: d.copaSlug ?? null,
      })),
      // O que a tela precisa dizer junto: o apelido é palpite, não nome.
      aviso:
        "O apelido de cada candidato é gerado do que os nomes dos clubes têm em comum. É palpite para reconhecer a linha numa lista — nunca o nome do campeonato.",
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function PATCH(req: Request) {
  const auth = await autorizado(req, true);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "decidir sobre um candidato exige uma sessão de administrador" },
      { status: 401 }
    );
  }

  const teto = await cobrar(req, "aposta-escrita", "descobertas");
  if (!teto.ok) return teto.resposta!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // As regras da decisão (motivo obrigatório no descarte, copa obrigatória na
  // promoção) moram em `validarDecisao`, fora daqui — ver o comentário lá.
  const d = validarDecisao(body);
  if (!d.ok) return NextResponse.json({ error: d.erro }, { status: 400 });
  const { chave, plataforma, estado, motivo, copaSlug } = d;

  await dbConnect();

  // Promover diz "este grupo virou AQUELA cobertura". Se a copa não existe, a
  // fila passa a afirmar uma cobertura que ninguém pode abrir, e o candidato
  // sai da fila sem que nada tenha sido coberto — o pior dos dois mundos.
  // (Achado pelo Codex, 08/09.)
  if (estado === "promovido") {
    const copa = await GameCopa.exists({ slug: copaSlug });
    if (!copa) {
      return NextResponse.json(
        { error: `não existe copa com o slug "${copaSlug}" — cadastre-a antes de promover` },
        { status: 400 }
      );
    }
  }

  // ⛔ `chave` sozinha NÃO identifica um candidato: o índice único é
  // `chave + plataforma`, porque o mesmo torneio pode existir nas duas gerações
  // de console. Filtrar só pela chave decidiria sobre o primeiro que o Mongo
  // devolvesse — e ninguém veria o erro, porque o outro simplesmente continuaria
  // na fila. (Achado pelo Codex, 08/09.)
  const filtro: Record<string, unknown> = { chave };
  if (plataforma) filtro.plataforma = plataforma;
  else {
    const quantos = await GameDescoberta.countDocuments({ chave });
    if (quantos > 1) {
      return NextResponse.json(
        { error: "este candidato existe em mais de uma plataforma; informe qual" },
        { status: 400 }
      );
    }
  }

  const doc = await GameDescoberta.findOneAndUpdate(
    filtro,
    {
      $set: {
        estado,
        motivo: motivo || undefined,
        copaSlug: copaSlug || undefined,
        decididoEm: new Date(),
        decididoPor: auth.userId ? new mongoose.Types.ObjectId(auth.userId) : undefined,
      },
    },
    { new: true }
  );

  if (!doc) return NextResponse.json({ error: "candidato não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, chave: doc.chave, plataforma: doc.plataforma, estado: doc.estado });
}
