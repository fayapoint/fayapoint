import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameVaga, { type IGameVaga } from "@/models/GameVaga";
import GameCandidatura from "@/models/GameCandidatura";
import { cobrar } from "@/lib/game/limite";

/**
 * POST /api/game/mercado/[id]/candidatura — candidatar-se a uma vaga (auth)
 * GET  /api/game/mercado/[id]/candidatura — o DONO lê quem se candidatou
 *
 * A candidatura é o que substitui o fio de comentários "me chama no zap": o
 * interesse fica ligado à vaga e ao usuário, e o contato do anunciante só é
 * DEVOLVIDO depois de registrada — assim a vitrine não vira lista pública de
 * contato. O índice único (vaga + candidato) impede inflar o contador.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const teto = await cobrar(req, "mercado-escrita");
  if (!teto.ok) return teto.resposta!;

  const body = await req.json().catch(() => ({}));

  await dbConnect();
  const vaga = (await GameVaga.findById(id).lean()) as unknown as
    | (IGameVaga & { _id: unknown })
    | null;
  if (!vaga) return NextResponse.json({ error: "vaga não encontrada" }, { status: 404 });
  if (String(vaga.ownerUserId) === String(user.id)) {
    return NextResponse.json({ error: "é a sua própria vaga" }, { status: 400 });
  }
  if (vaga.status !== "ativa") {
    return NextResponse.json({ error: "esta vaga não está mais aberta" }, { status: 409 });
  }

  const mensagem = String(body.mensagem ?? "").trim().slice(0, 500) || undefined;
  const contato = String(body.contato ?? "").trim().slice(0, 200) || undefined;

  try {
    await GameCandidatura.create({
      vagaId: vaga._id,
      deUserId: user.id,
      mensagem,
      contato,
    });
    await GameVaga.updateOne({ _id: vaga._id }, { $inc: { candidaturas: 1 } });
  } catch (e: unknown) {
    // Índice único: já se candidatou. Não é erro — devolve o contato do mesmo jeito.
    if (!(e && typeof e === "object" && "code" in e && (e as { code: number }).code === 11000)) {
      throw e;
    }
  }

  return NextResponse.json({
    ok: true,
    // O prêmio da candidatura: agora vê o contato do anunciante.
    contatoTipo: vaga.contatoTipo,
    contato: vaga.contato ?? null,
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  await dbConnect();
  const vaga = (await GameVaga.findById(id).select("ownerUserId").lean()) as unknown as {
    ownerUserId: unknown;
  } | null;
  if (!vaga) return NextResponse.json({ error: "vaga não encontrada" }, { status: 404 });
  if (String(vaga.ownerUserId) !== String(user.id)) {
    return NextResponse.json({ error: "só o dono vê os candidatos" }, { status: 403 });
  }

  const candidatos = await GameCandidatura.find({ vagaId: id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({
    candidatos: candidatos.map((c) => ({
      _id: String(c._id),
      mensagem: c.mensagem ?? null,
      contato: c.contato ?? null,
      createdAt: (c.createdAt as Date).toISOString(),
    })),
  });
}
