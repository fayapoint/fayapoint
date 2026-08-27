import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ForjaTrabalho from "@/models/ForjaTrabalho";
import { getAuthUser } from "@/lib/auth";
import { contextoDoUsuario, filaDoUsuario, usoDoDia } from "@/lib/forja/servidor";
import { esperaEmTexto, textoDoGratis, PESO_NA_FILA } from "@/lib/forja/engine";

export const dynamic = "force-dynamic";

/**
 * A FILA, do lado de quem espera.
 *
 * ## O que esta rota existe para impedir
 *
 * Uma fila sem visor é indistinguível de um sistema quebrado. A pessoa clica,
 * não acontece nada, e em trinta segundos ela clica de novo — e aí são dois
 * trabalhos na frente dela mesma. Por isso a resposta traz a previsão em
 * SEGUNDOS e em TEXTO, e o texto nunca diz "alguns instantes": a GPU atende um
 * por vez, e um vídeo à frente significa doze minutos.
 *
 * ## O sinal de vida do trabalhador
 *
 * `trabalhadorVivo` sai de um fato, não de uma configuração: houve algum
 * trabalho reservado ou concluído nos últimos três minutos? Se não houve e há
 * gente esperando, a tela precisa dizer que a máquina está desligada — e é a
 * coisa mais importante que ela pode dizer, porque a alternativa é a pessoa
 * achar que o produto não funciona.
 */

const JANELA_DE_VIDA_MS = 3 * 60 * 1000;

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await dbConnect();
  const ctx = await contextoDoUsuario(authUser.id);
  const [{ trabalhos, totalNaFila }, uso] = await Promise.all([
    filaDoUsuario(authUser.id),
    usoDoDia(authUser.id, ctx.plano),
  ]);

  const desde = new Date(Date.now() - JANELA_DE_VIDA_MS);
  const sinal = await ForjaTrabalho.countDocuments({
    $or: [
      { estado: { $in: ["reservado", "rodando"] }, atualizadoEm: { $gte: desde } },
      { terminouEm: { $gte: desde } },
    ],
  });

  const trabalhadorVivo = sinal > 0;

  return NextResponse.json({
    trabalhos: trabalhos.map((t) => ({
      ...t,
      espera: esperaEmTexto(Number(t.esperaSegundos) || 0),
    })),
    totalNaFila,
    trabalhadorVivo,
    /**
     * ⚠️ A mensagem de máquina desligada só aparece quando há trabalho ESPERANDO.
     * Dizer "a GPU está offline" numa tela sem fila nenhuma seria alarmar por
     * um fato irrelevante — e treinar a pessoa a ignorar o aviso quando ele
     * importar.
     */
    aviso:
      !trabalhadorVivo && trabalhos.some((t) => ["esperando", "reservado"].includes(String(t.estado)))
        ? "A GPU da FayAI está fora do ar agora. Seus pedidos ficam guardados e saem assim que ela voltar — nada se perde, e nada é cobrado enquanto isso."
        : "",
    uso: {
      gasto: uso.gasto,
      teto: uso.teto,
      restante: uso.restante,
      cabemImagens: uso.cabemAinda("imagem"),
      cabemVideos: uso.cabemAinda("video"),
      pesos: PESO_NA_FILA,
    },
    textoDoGratis: textoDoGratis(0, uso.cabemAinda("imagem")),
  });
}

/**
 * Cancelar.
 *
 * Só trabalho que ainda não começou. Um que já está na GPU não pode ser
 * cancelado daqui — o site não fala com o ComfyUI, e fingir que cancelou
 * deixaria a pessoa achando que a fila esvaziou enquanto a placa continua
 * ocupada.
 */
export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

  await dbConnect();
  const r = await ForjaTrabalho.updateOne(
    { _id: id, userId: authUser.id, estado: "esperando" },
    { $set: { estado: "cancelado", terminouEm: new Date() } },
  );

  if (!r.modifiedCount) {
    return NextResponse.json(
      { error: "Esse já saiu da fila — ou já está rodando na GPU, e aí não dá para parar no meio." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
