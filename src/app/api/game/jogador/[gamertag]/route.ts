import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { cobrar } from "@/lib/game/limite";
import { montarFicha } from "@/lib/game/jogador-servidor";

/**
 * GET /api/game/jogador/[gamertag] — a ficha do jogador, em JSON.
 *
 * O mesmo objeto que a página `/game/jogador/[gamertag]` renderiza, para quem
 * precisar da ficha fora dela (a mesa de fichas, a carta compartilhável, um
 * bot da comunidade). Lê só o espelho — nunca a EA, que responde 403 para IP
 * de datacenter. A resposta carrega `partidasCapturedAt` e `perfil.capturedAt`
 * para que ninguém mostre número sem dizer a idade dele.
 *
 * `visao` depende de quem chama (dono × visitante), por isso a rota lê a sessão
 * e não é cacheável.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ gamertag: string }> }) {
  // Orçamento "partidas": a ficha lê o mesmo tipo de documento (as partidas do
  // espelho), e `limite.ts` não é deste território para ganhar uma chave própria.
  const teto = await cobrar(req, "partidas");
  if (!teto.ok) return teto.resposta!;

  const { gamertag: bruta } = await params;
  const gamertag = decodeURIComponent(bruta).trim().slice(0, 40);
  if (gamertag.length < 2) {
    return NextResponse.json({ error: "gamertag inválida" }, { status: 400 });
  }

  const user = await getAuthUser();
  const ficha = await montarFicha(gamertag, user?.id ?? null);
  if (!ficha) {
    return NextResponse.json({ error: "jogador não encontrado" }, { status: 404 });
  }
  return NextResponse.json(ficha);
}
