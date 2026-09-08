import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { cobrar } from "@/lib/game/limite";
import GameCarteira from "@/models/GameCarteira";
import dbConnect from "@/lib/mongodb";
import {
  resumoDaCarteira,
  recarregarSeQuebrado,
  APOSTA_MAXIMA,
  APOSTA_MINIMA,
  BONUS_BOAS_VINDAS,
  RETORNO_MAXIMO,
} from "@/lib/game/carteira";

/**
 * GET   /api/game/carteira  — saldo, extrato e as regras do dinheiro de jogo
 * PATCH /api/game/carteira  — limite diário e pausa (jogo responsável)
 *
 * O GET é quem CONCEDE o bônus de boas-vindas, na primeira visita. Ver o
 * cabeçalho de `lib/game/carteira.ts`: pendurar a concessão no cadastro
 * deixaria de fora todo mundo que já tem conta.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "carteira");
  if (!teto.ok) return teto.resposta!;

  const recarga = await recarregarSeQuebrado(user.id).catch(() => 0);
  const resumo = await resumoDaCarteira(user.id);

  return NextResponse.json(
    {
      ...resumo,
      recarregouAgora: recarga,
      regras: {
        bonusBoasVindas: BONUS_BOAS_VINDAS,
        apostaMinima: APOSTA_MINIMA,
        apostaMaxima: APOSTA_MAXIMA,
        retornoMaximo: RETORNO_MAXIMO,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });

  const teto = await cobrar(req, "carteira");
  if (!teto.ok) return teto.resposta!;

  let body: { limiteDiario?: number | null; pausarDias?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  await dbConnect();
  const mudanca: Record<string, unknown> = {};

  if ("limiteDiario" in body) {
    const l = body.limiteDiario;
    if (l === null || l === 0) mudanca.limiteDiario = null;
    else if (typeof l === "number" && l >= 1 && l <= 5000) mudanca.limiteDiario = Math.floor(l);
    else return NextResponse.json({ error: "limite entre 1 e 5000 fichas, ou nulo" }, { status: 400 });
  }

  if (body.pausarDias) {
    const dias = Math.floor(body.pausarDias);
    if (dias < 1 || dias > 180) {
      return NextResponse.json({ error: "a pausa vai de 1 a 180 dias" }, { status: 400 });
    }
    // ⚠️ A pausa é de mão única: uma vez marcada, ela não é encurtada por esta
    // rota. Autoexclusão que a própria pessoa desfaz no impulso seguinte não
    // é autoexclusão — é um botão. Encurtar exige falar com a gente.
    mudanca.pausadoAte = new Date(Date.now() + dias * 86_400_000);
  }

  if (Object.keys(mudanca).length === 0) {
    return NextResponse.json({ error: "nada para mudar" }, { status: 400 });
  }

  await GameCarteira.updateOne({ userId: user.id, moeda: "ficha" }, { $set: mudanca });
  return NextResponse.json({ ok: true, ...mudanca });
}
