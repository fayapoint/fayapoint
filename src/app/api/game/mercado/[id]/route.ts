import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameVaga, { type IGameVaga } from "@/models/GameVaga";
import { cobrar } from "@/lib/game/limite";
import {
  serializarVaga,
  enriquecerComEspelho,
  enriquecerReputacao,
  type VagaSerializada,
} from "@/lib/game/mercado-servidor";

/**
 * GET    /api/game/mercado/[id]  — uma vaga (para o cartaz e o detalhe)
 * PATCH  /api/game/mercado/[id]  — o dono marca preenchida / reabre
 * DELETE /api/game/mercado/[id]  — o dono remove a vaga
 *
 * A dona de casa é a checagem do servidor: `ehDono` decide o que a tela
 * MOSTRA, mas quem PERMITE alterar é o filtro `ownerUserId` aqui — nunca a
 * flag que veio do cliente.
 */
export const dynamic = "force-dynamic";

async function achar(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  return (await GameVaga.findById(id).lean()) as unknown as (IGameVaga & { _id: unknown }) | null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await achar(id);
  if (!doc) return NextResponse.json({ error: "vaga não encontrada" }, { status: 404 });

  const user = await getAuthUser().catch(() => null);
  const vaga: VagaSerializada = serializarVaga(doc, { userId: user?.id });
  await Promise.all([enriquecerComEspelho([vaga]), enriquecerReputacao([vaga])]);
  return NextResponse.json({ vaga });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const teto = await cobrar(req, "mercado-escrita");
  if (!teto.ok) return teto.resposta!;

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!["ativa", "preenchida", "expirada"].includes(String(status))) {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  await dbConnect();
  const r = await GameVaga.updateOne(
    { _id: id, ownerUserId: user.id },
    { $set: { status } }
  );
  if (r.matchedCount === 0) {
    return NextResponse.json({ error: "vaga não é sua ou não existe" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const teto = await cobrar(req, "mercado-escrita");
  if (!teto.ok) return teto.resposta!;

  await dbConnect();
  const r = await GameVaga.deleteOne({ _id: id, ownerUserId: user.id });
  if (r.deletedCount === 0) {
    return NextResponse.json({ error: "vaga não é sua ou não existe" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
