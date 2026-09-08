import { NextResponse } from "next/server";
import { atorGestao, erroResposta, ErroGestao } from "@/lib/game/gestao-servidor";
import { cobrar } from "@/lib/game/limite";
import { agruparEmSeries, classificacaoPelaEA, conferir, partidasDaCopa, timePorClube, JANELA_DA_SERIE_MS } from "@/lib/game/copa";

export const dynamic = "force-dynamic";
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const ator = await atorGestao(); if (!ator.federacao) throw new ErroGestao(403, "Acesso reservado à federação.");
    const limite = await cobrar(req, "campeonato-leitura", "auditoria-copa"); if (!limite.ok) return limite.resposta!;
    const { slug } = await ctx.params;
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) throw new ErroGestao(400, "Copa inválida.");
    const { copa, partidas } = await partidasDaCopa(slug);
    if (!copa) throw new ErroGestao(404, "Copa não encontrada.");
    const series = agruparEmSeries(partidas, timePorClube(copa.times));
    const calculada = classificacaoPelaEA(series, nome => copa.times.find(t => t.nome === nome)?.grupo);
    return NextResponse.json({ nome: copa.nome, slug: copa.slug,
      conferencia: conferir(copa.classificacaoOficial ?? [], calculada),
      oficialCapturadaEm: copa.oficialCapturadaEm?.toISOString() ?? null,
      consultadoEm: new Date().toISOString(),
      fontesOficiais: (copa.organizacao?.sites ?? []).filter(site => /^https?:\/\//i.test(site)),
      /* A PROCEDÊNCIA COMPLETA VIVE AQUI, e só aqui.
         A rota pública passou a mostrar apenas o grau do vínculo e a data
         (Estatuto, art. 20). Quem decide precisa do resto — evidência do
         vínculo e o que a auditoria descartou —, porque auditoria sem trilha é
         palavra vazia (art. 22). Esta rota é fechada à federação. */
      times: copa.times.map(t => ({
        nome: t.nome, vinculo: t.vinculo, evidencia: t.evidencia,
        buscadoEm: t.buscadoEm?.toISOString() ?? null, buscaNota: t.buscaNota ?? null,
      })),
      declaracoes: (copa.declaracoes ?? []).map(d => ({ fonte: d.fonte, url: d.url ?? null, afirma: d.afirma, lidoEm: d.lidoEm })),
      cobertura: { partidas: partidas.length, series: series.length, janelaHoras: JANELA_DA_SERIE_MS / 3600_000 },
      aviso: "A EA não distingue treino de jogo oficial entre estes clubes. Séries são agrupamentos por horário, não confirmação do chaveamento. Uma divergência pede revisão do vínculo, da cobertura e do agrupamento.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return erroResposta(e); }
}
