import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { porSegredoDeServico } from "@/lib/guarda-de-servico";
import { rodarEventosVencidos } from "@/lib/game/apostas-servidor";
import { montarRodada } from "@/lib/game/rodada";
import GameEvento from "@/models/GameEvento";
import dbConnect from "@/lib/mongodb";

/**
 * POST /api/game/apostas/rodar — o batimento da mesa.
 *
 * Faz duas coisas, nesta ordem, e a ordem importa:
 *
 *  1. **Roda o que venceu.** Todo evento cujo horário passou é fechado,
 *     revelado, simulado e pago.
 *  2. **Repõe o cardápio.** Se sobraram poucos eventos abertos, monta uma
 *     rodada nova.
 *
 * Liquidar antes de repor é o que impede o saguão de crescer sem fim quando a
 * liquidação falha: se o passo 1 quebrar, o passo 2 não roda e o problema
 * aparece como "o saguão parou", que alguém nota. Na ordem contrária, o
 * saguão continuaria bonito enquanto ninguém receberia prêmio — a falha
 * silenciosa de sempre.
 *
 * ## Quem pode chamar
 *
 * O cron, pelo segredo de serviço (`x-social-secret`), ou um admin logado.
 * Nunca um usuário comum: quem pudesse disparar a liquidação escolheria a
 * hora de fechar a própria aposta.
 */
export const dynamic = "force-dynamic";

/** Abaixo disto, a mesa repõe o cardápio. */
const MINIMO_NO_SAGUAO = 6;

export async function POST(req: Request) {
  const porSegredo = porSegredoDeServico(req, [
    "x-social-secret",
    "x-cron-secret",
    "x-admin-secret",
  ]);

  if (!porSegredo) {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "não autorizado" }, { status: 401 });
    }
  }

  await dbConnect();

  const liquidados = await rodarEventosVencidos(30);

  const abertos = await GameEvento.countDocuments({
    status: "aberto",
    comecaEm: { $gt: new Date() },
  });

  let novos: Array<{ slug: string; confronto: string; comecaEm: Date }> = [];
  if (abertos < MINIMO_NO_SAGUAO) {
    novos = await montarRodada({ quantidade: MINIMO_NO_SAGUAO * 2 - abertos });
  }

  return NextResponse.json({
    ok: true,
    liquidados,
    abertosAntes: abertos,
    novos,
    // O resumo em uma linha é o que vai para o log do cron. Cron que loga
    // objeto grande é cron que ninguém lê.
    resumo: `liquidou ${liquidados.length}, abriu ${novos.length}`,
  });
}
