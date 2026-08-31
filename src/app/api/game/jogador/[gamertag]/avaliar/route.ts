import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import GameAvaliacao from "@/models/GameAvaliacao";
import GamePlayer from "@/models/GamePlayer";
import { cobrar } from "@/lib/game/limite";
import { CATEGORIAS, reputacaoDe, chaveGamertag } from "@/lib/game/reputacao";

/**
 * POST /api/game/jogador/[gamertag]/avaliar — vota num jogador.
 *
 * O tijolo do banco dos bons jogadores. Cinco categorias, nota de 1 a 5. Um
 * voto PERMANENTE por par (avaliador → alvo), atualizável — reavaliar depois de
 * jogar de novo corrige o próprio voto, não empilha. Ninguém vota em si mesmo.
 *
 * O alvo é por gamertag (a maioria ainda não tem conta); se a gamertag já foi
 * reivindicada, o voto também aponta o `userId`, e a reputação segue a pessoa.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ gamertag: string }> }) {
  const { gamertag: bruta } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "avaliar");
  if (!teto.ok) return teto.resposta!;

  const display = decodeURIComponent(bruta).trim().slice(0, 40);
  const chave = chaveGamertag(display);
  if (chave.length < 2) return NextResponse.json({ error: "gamertag inválida" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const cats = body.categorias ?? {};
  const categorias: Record<string, number> = {};
  for (const c of CATEGORIAS) {
    const n = Number(cats[c.key]);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return NextResponse.json({ error: `nota inválida em ${c.nome}` }, { status: 400 });
    }
    categorias[c.key] = n;
  }
  const media = Math.round((CATEGORIAS.reduce((s, c) => s + categorias[c.key], 0) / CATEGORIAS.length) * 10) / 10;

  await dbConnect();

  // Não votar em si mesmo: bate a gamertag do próprio jogador reivindicado.
  const meu = (await GamePlayer.findOne({ ownerUserId: user.id, isActive: true })
    .select("gamertag")
    .lean()) as unknown as { gamertag?: string } | null;
  if (meu?.gamertag && chaveGamertag(meu.gamertag) === chave) {
    return NextResponse.json({ error: "não dá para avaliar você mesmo" }, { status: 400 });
  }

  // Se a gamertag já foi reivindicada por alguém, liga o voto àquela conta.
  const alvo = (await GamePlayer.findOne({ gamertag: new RegExp(`^${escapar(display)}$`, "i") })
    .select("ownerUserId platform")
    .lean()) as unknown as { ownerUserId?: unknown; platform?: string } | null;

  await GameAvaliacao.updateOne(
    { avaliadorUserId: user.id, alvoGamertag: chave },
    {
      $set: {
        alvoGamertagDisplay: display,
        plataforma: body.plataforma || alvo?.platform || undefined,
        alvoUserId: alvo?.ownerUserId ?? undefined,
        categorias,
        media,
        comentario: String(body.comentario ?? "").trim().slice(0, 300) || undefined,
      },
    },
    { upsert: true }
  );

  const rep = (await reputacaoDe([display])).get(chave) ?? null;
  return NextResponse.json({ ok: true, reputacao: rep });
}

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
