import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameClub from "@/models/GameClub";
import { clubInfo, clubOverallStats, clubMembersStats, type EaPlatform } from "@/lib/game/ea-api";

/**
 * POST /api/game/clube/vincular  { eaClubId, plataforma? }
 *
 * Vincula um clube de Clubs ao usuário logado. O vínculo é uma REIVINDICAÇÃO
 * (o usuário diz "esse clube é meu"); a prova de posse — estar no elenco que a
 * própria EA lista — vem na Fase 1, quando o perfil de jogador ganhar o
 * PSN/gamertag verificado. Nenhuma credencial da EA passa por aqui.
 */
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "login necessário" }, { status: 401 });
  }

  let body: { eaClubId?: string; plataforma?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const eaClubId = String(body.eaClubId ?? "").trim();
  const plataforma = (body.plataforma ?? "common-gen5") as EaPlatform;
  if (!/^\d{1,12}$/.test(eaClubId)) {
    return NextResponse.json({ error: "eaClubId inválido" }, { status: 400 });
  }

  // Confirma que o clube existe na EA antes de gravar qualquer coisa.
  const [info, stats, members] = await Promise.all([
    clubInfo(eaClubId, plataforma),
    clubOverallStats(eaClubId, plataforma),
    clubMembersStats(eaClubId, plataforma),
  ]);
  if (!info) {
    return NextResponse.json({ error: "clube não encontrado na EA" }, { status: 404 });
  }

  await dbConnect();
  const club = await GameClub.findOneAndUpdate(
    { eaClubId, platform: plataforma, ownerUserId: user.id },
    {
      $set: {
        name: info.name,
        crestAssetId: info.crestAssetId ?? undefined,
        regionId: info.regionId ?? undefined,
        snapshot: {
          wins: stats?.wins ?? 0,
          losses: stats?.losses ?? 0,
          ties: stats?.ties ?? 0,
          gamesPlayed: stats?.gamesPlayed ?? 0,
          goals: stats?.goals ?? 0,
          goalsAgainst: stats?.goalsAgainst ?? 0,
          skillRating: stats?.skillRating ?? undefined,
          memberCount: members.length || undefined,
          capturedAt: new Date(),
        },
        sourceGrade: "B",
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json({ ok: true, clubId: club.eaClubId, name: club.name });
}

/** GET /api/game/clube/vincular — clubes já vinculados pelo usuário logado. */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ clubs: [] }, { status: 200 });
  }
  await dbConnect();
  const clubs = await GameClub.find({ ownerUserId: user.id, isActive: true })
    .select("eaClubId platform name snapshot")
    .lean();
  return NextResponse.json({ clubs });
}
