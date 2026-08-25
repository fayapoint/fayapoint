import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GamePlayer from "@/models/GamePlayer";
import { clubInfo, clubMembersStats, type EaPlatform } from "@/lib/game/ea-api";

/**
 * POST /api/game/jogador/vincular  { eaClubId, gamertag, plataforma? }
 *
 * Liga uma GAMERTAG do elenco publicado pela EA à conta FayAI do usuário.
 * É o passo que o Ricardo pediu — "conectar a conta dele, e então termos seu
 * player": sem ele, a plataforma conhece clubes e não conhece pessoas, e a
 * estatística individual evapora quando alguém troca de time.
 *
 * A reivindicação só é aceita se a gamertag REALMENTE aparecer no elenco que a
 * EA publica para aquele clube. Não é prova de posse (qualquer um poderia
 * apontar um colega), mas elimina o campo de texto livre — que aceitaria
 * qualquer nome inventado. A prova de posse vem na Fase 1.
 *
 * Nenhuma credencial da EA/PSN passa por aqui.
 */
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "login necessário" }, { status: 401 });
  }

  let body: { eaClubId?: string; gamertag?: string; plataforma?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const eaClubId = String(body.eaClubId ?? "").trim();
  const gamertag = String(body.gamertag ?? "").trim();
  const plataforma = (body.plataforma === "common-gen4" ? "common-gen4" : "common-gen5") as EaPlatform;

  if (!/^\d{1,12}$/.test(eaClubId) || gamertag.length < 2 || gamertag.length > 40) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }

  const [info, members] = await Promise.all([
    clubInfo(eaClubId, plataforma),
    clubMembersStats(eaClubId, plataforma),
  ]);

  const membro = members.find((m) => m.name === gamertag);
  if (!membro) {
    return NextResponse.json(
      { error: "essa gamertag não está no elenco que a EA publica para este clube" },
      { status: 404 }
    );
  }

  await dbConnect();

  // Uma gamertag pertence a uma conta só. Se já é de outra, o pedido para aqui.
  const jaExiste = await GamePlayer.findOne({ gamertag, platform: plataforma })
    .select("ownerUserId")
    .lean();
  if (jaExiste && String(jaExiste.ownerUserId) !== String(user.id)) {
    return NextResponse.json({ error: "gamertag já reivindicada" }, { status: 409 });
  }

  const jogador = await GamePlayer.findOneAndUpdate(
    { gamertag, platform: plataforma },
    {
      $set: {
        eaClubId,
        clubName: info?.name,
        proName: membro.proName ?? undefined,
        proOverall: membro.proOverall ?? undefined,
        favoritePosition: membro.favoritePosition ?? undefined,
        ownerUserId: user.id,
        snapshot: {
          gamesPlayed: membro.gamesPlayed,
          goals: membro.goals,
          assists: membro.assists,
          ratingAve: membro.ratingAve ?? undefined,
          manOfTheMatch: membro.manOfTheMatch,
          winRate: membro.winRate ?? undefined,
          capturedAt: new Date(),
        },
        sourceGrade: "B",
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json({
    ok: true,
    gamertag: jogador.gamertag,
    proName: jogador.proName ?? null,
    clubId: jogador.eaClubId,
  });
}

/** GET /api/game/jogador/vincular — jogadores já reivindicados pelo usuário. */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ players: [] });
  await dbConnect();
  const players = await GamePlayer.find({ ownerUserId: user.id, isActive: true })
    .select("gamertag platform eaClubId clubName proName proOverall snapshot verified")
    .lean();
  return NextResponse.json({ players });
}
