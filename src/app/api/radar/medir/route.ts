import { NextResponse } from "next/server";
import { NICHOS, getNicho, medirNicho } from "@/lib/radar";
import { salvarMedicao, diaBrasilia } from "@/lib/radar-historico";

/**
 * POST /api/radar/medir?nicho=advogados — medição forçada, para o cron da VPS.
 *
 * ## Por que não bastava chamar `/api/radar`
 *
 * Aquela rota passa por `getRadar`, que tem cache de 6h em memória do processo.
 * Se o cron caísse num processo quente, ela devolveria o cache e **retornaria
 * antes de gravar** — o dia ficaria sem ponto na série, de forma silenciosa e
 * intermitente. Aqui chamamos `medirNicho` direto: sempre mede, sempre grava.
 *
 * ## Por que um nicho por chamada
 *
 * São 10 nichos e ~18 consultas de autocomplete cada, escalonadas. Um nicho leva
 * ~2s; os dez em sequência passariam de 20s e esbarrariam no teto de execução da
 * função. O laço mora no script da VPS, que não tem esse teto.
 *
 * Auth: header `x-social-secret`, o mesmo par `SOCIAL_CRON_SECRET`/`AINEWS_SECRET`
 * que o `publish-due` e o cron de notícias já usam.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const secret = process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
  if (!secret || req.headers.get("x-social-secret") !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const pedido = new URL(req.url).searchParams.get("nicho");

  // Sem `?nicho=` a rota só diz quais existem — assim o script da VPS descobre a
  // lista sozinho e não precisa repetir os ids num arquivo que envelhece.
  if (!pedido) {
    return NextResponse.json({ nichos: NICHOS.map((n) => n.id) });
  }

  const nicho = getNicho(pedido);

  try {
    const dado = await medirNicho(nicho);

    if (!dado.termos.length) {
      // Sem termos = o autocomplete não respondeu. Gravar isso criaria um dia
      // "vazio" no histórico, que no gráfico vira queda a pico que nunca houve.
      return NextResponse.json(
        { nicho: nicho.id, gravado: false, motivo: "medição vazia", termos: 0 },
        { status: 200 }
      );
    }

    await salvarMedicao(dado);

    return NextResponse.json({
      nicho: nicho.id,
      gravado: true,
      dia: diaBrasilia(dado.geradoEm),
      consultas: dado.consultas,
      termos: dado.termos.length,
      topo: dado.termos[0]?.termo ?? null,
    });
  } catch (erro) {
    console.error("[radar/medir] falhou:", erro);
    return NextResponse.json(
      { nicho: nicho.id, gravado: false, motivo: String(erro) },
      { status: 500 }
    );
  }
}
