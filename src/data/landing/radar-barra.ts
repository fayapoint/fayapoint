/**
 * Largura da barra de volume na lista do Radar.
 *
 * Duas coisas que a versão anterior errava, e que a barra existe para não errar:
 *
 * 1. **O primeiro item não é o de maior volume.** No degrau "mundo" a lista é
 *    ordenada por em quantos países o assunto aparece, não por volume. Dividir
 *    pelo `itens[0]` dava razões acima de 1 — medido em produção: barras de
 *    1000%, 500%, elementos de 85.226 px. Como o pai tem `overflow:hidden`,
 *    ninguém via o estouro: via todas as barras cheias, que é o mesmo que não
 *    ter barra nenhuma.
 *
 * 2. **Busca e leitura não são a mesma régua.** "2.000+ buscas" e "410.000
 *    visitas na Wikipédia" convivem na mesma lista. Normalizar as duas juntas
 *    faria qualquer assunto de busca virar um fio ao lado de um artigo lido —
 *    e ainda seria comparar procura com leitura, que não se comparam. Por isso
 *    cada fonte tem seu próprio topo: a barra diz "quanto isto pesa entre os
 *    seus pares", que é a única leitura honesta aqui.
 */
import type { ItemTrend } from "@/lib/radar-mundo";

export type ToposPorFonte = Record<string, number>;

/** O maior volume de cada fonte presente na lista. */
export function toposPorFonte(itens: ItemTrend[]): ToposPorFonte {
  const topos: ToposPorFonte = {};
  for (const it of itens) {
    const v = Number.isFinite(it.volume) ? it.volume : 0;
    if (v > (topos[it.fonte] ?? 0)) topos[it.fonte] = v;
  }
  return topos;
}

/** Percentual de largura, com um mínimo para a barra não sumir. */
export function larguraBarra(it: ItemTrend, topos: ToposPorFonte, minimo = 5): number {
  const topo = topos[it.fonte] ?? 0;
  if (topo <= 0) return minimo;
  const v = Number.isFinite(it.volume) ? it.volume : 0;
  return Math.min(100, Math.max(minimo, Math.round((v / topo) * 100)));
}
