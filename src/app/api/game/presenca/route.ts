import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GamePresenca from "@/models/GamePresenca";
import GamePlayer from "@/models/GamePlayer";
import { cobrar } from "@/lib/game/limite";
import { snapshotOnline } from "@/lib/game/comunidade-servidor";
import { normalizarPosicoes } from "@/lib/game/posicoes";

/**
 * POST /api/game/presenca — o PULSO de presença.
 *
 * O cliente pinga a cada ~20s enquanto a aba está visível. Logado, vira um
 * bonequinho na comunidade (com gamertag, posição e status); deslogado, só faz
 * o contador de "pessoas usando" subir, chaveado por um `clientId` do navegador.
 *
 * Devolve o retrato de quem está online AGORA — assim o mesmo pulso que anuncia
 * a sua presença já traz a dos outros, sem uma segunda ida.
 */
export const dynamic = "force-dynamic";

const STATUS = ["online", "procurando", "jogando"];

export async function POST(req: Request) {
  const teto = await cobrar(req, "presenca");
  if (!teto.ok) return teto.resposta!;

  const body = await req.json().catch(() => ({}));
  const status = STATUS.includes(String(body.status)) ? String(body.status) : "online";
  const posicaoPedida = normalizarPosicoes([body.posicao])[0] ?? undefined;

  const user = await getAuthUser().catch(() => null);
  await dbConnect();

  if (user) {
    // A gamertag e o overall saem do jogador reivindicado, quando houver.
    const player = (await GamePlayer.findOne({ ownerUserId: user.id, isActive: true })
      .select("gamertag proOverall favoritePosition")
      .lean()) as unknown as {
      gamertag?: string;
      proOverall?: number;
      favoritePosition?: string;
    } | null;

    await GamePresenca.updateOne(
      { chave: String(user.id) },
      {
        $set: {
          tipo: "jogador",
          userId: user.id,
          gamertag: player?.gamertag,
          avatarSeed: String(user.id),
          posicao: posicaoPedida ?? undefined,
          overall: player?.proOverall,
          status,
          lastSeen: new Date(),
        },
      },
      { upsert: true }
    );
  } else {
    const clientId = String(body.clientId ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (clientId.length >= 8) {
      await GamePresenca.updateOne(
        { chave: `anon:${clientId}` },
        { $set: { tipo: "visitante", status: "online", lastSeen: new Date() } },
        { upsert: true }
      );
    }
  }

  const online = await snapshotOnline();
  return NextResponse.json(
    { ok: true, logado: !!user, online },
    { headers: { "Cache-Control": "no-store" } }
  );
}
