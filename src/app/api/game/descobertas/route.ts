import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { porSegredoDeServico } from "@/lib/guarda-de-servico";
import { cobrar } from "@/lib/game/limite";
import GameDescoberta, { type EstadoDescoberta } from "@/models/GameDescoberta";

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

async function autorizado(req: Request): Promise<{ ok: boolean; userId?: string }> {
  if (porSegredoDeServico(req, ["x-social-secret", "x-cron-secret", "x-admin-secret"])) {
    return { ok: true };
  }
  const user = await getAuthUser();
  if (user?.role === "admin") return { ok: true, userId: user.id };
  return { ok: false };
}

export async function GET(req: Request) {
  const auth = await autorizado(req);
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
  const auth = await autorizado(req);
  if (!auth.ok) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  const teto = await cobrar(req, "aposta-escrita", "descobertas");
  if (!teto.ok) return teto.resposta!;

  let body: { chave?: string; estado?: string; motivo?: string; copaSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const chave = String(body.chave ?? "").trim();
  const estado = String(body.estado ?? "").trim() as EstadoDescoberta;
  if (!chave || !ESTADOS.includes(estado)) {
    return NextResponse.json({ error: "informe chave e um estado válido" }, { status: 400 });
  }

  // Descartar sem motivo deixa a decisão sem rastro — e a fila existe
  // justamente para que ninguém tenha de adivinhar depois por que um torneio
  // ficou de fora.
  const motivo = String(body.motivo ?? "").trim();
  if (estado === "descartado" && motivo.length < 3) {
    return NextResponse.json(
      { error: "descartar exige motivo escrito" },
      { status: 400 }
    );
  }
  if (estado === "promovido" && !String(body.copaSlug ?? "").trim()) {
    return NextResponse.json(
      { error: "promover exige o slug da copa que passou a cobri-lo" },
      { status: 400 }
    );
  }

  await dbConnect();
  const doc = await GameDescoberta.findOneAndUpdate(
    { chave },
    {
      $set: {
        estado,
        motivo: motivo || undefined,
        copaSlug: body.copaSlug?.trim() || undefined,
        decididoEm: new Date(),
        decididoPor: auth.userId ? new mongoose.Types.ObjectId(auth.userId) : undefined,
      },
    },
    { new: true }
  );

  if (!doc) return NextResponse.json({ error: "candidato não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, chave: doc.chave, estado: doc.estado });
}
