import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GamePlayer from "@/models/GamePlayer";
import { type EaPlatform } from "@/lib/game/ea-api";
import { clubeComEspelho } from "@/lib/game/espelho";

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
 *
 * ⚠️ LÊ PELO ESPELHO, não pela EA direto. A EA responde 403 para IP de
 * datacenter (ver `lib/game/espelho.ts`), então em produção `clubMembersStats`
 * vinha VAZIO e TODA reivindicação falhava com 404 — que é exatamente o erro
 * que o Ricardo viu. O elenco tem de vir da mesma fonte que a página do clube
 * usa (`clubeComEspelho`), senão o botão "Sou eu" nunca funciona na Netlify.
 */

/** A EA manda os membros como objetos Mixed no espelho — coerções seguras. */
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function txt(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
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

  // Fonte viva primeiro, espelho depois — a MESMA que a página do clube usa.
  const ficha = await clubeComEspelho(eaClubId, plataforma);
  const info = ficha.dados?.info ?? null;
  const members = (ficha.dados?.members ?? []) as Array<Record<string, unknown>>;

  if (members.length === 0) {
    // Sem elenco no acervo: o clube ainda não foi capturado por inteiro. Isso é
    // diferente de "gamertag não encontrada" — e a mensagem tem de dizer qual.
    return NextResponse.json(
      { error: "ainda não temos o elenco deste clube no acervo. Abra a página do clube uma vez e tente de novo." },
      { status: 409 }
    );
  }

  const membro = members.find((m) => txt(m.name) === gamertag);
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
        proName: txt(membro.proName),
        proOverall: num(membro.proOverall),
        favoritePosition: txt(membro.favoritePosition),
        ownerUserId: user.id,
        snapshot: {
          gamesPlayed: num(membro.gamesPlayed) ?? 0,
          goals: num(membro.goals) ?? 0,
          assists: num(membro.assists) ?? 0,
          ratingAve: num(membro.ratingAve),
          manOfTheMatch: num(membro.manOfTheMatch) ?? 0,
          winRate: num(membro.winRate),
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
