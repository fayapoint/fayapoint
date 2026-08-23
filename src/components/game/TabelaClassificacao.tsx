"use client";

import { Trophy, Lock } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import { LIMA, OURO, RUBRO, bebas, superficie } from "@/lib/game/tema";

/**
 * TABELA DE CLASSIFICAÇÃO — prévia honesta do formato (23/08/2026).
 *
 * A liga piloto só começa em outubro, então NÃO existe classificação. A
 * tentação seria preencher com clubes de exemplo; a §8 da identidade proíbe
 * ("contadores falsos") e com razão — um visitante que reconhece um clube
 * inventado nunca mais confia num número do site.
 *
 * A saída: a tabela existe de verdade, com cabeçalho, zonas e as 8 posições da
 * piloto — e as células estão VAZIAS, marcadas como aguardando a primeira
 * rodada. Mostra o formato sem afirmar um fato.
 */

const VAGAS = 8;

/** Faixa da posição: acesso (1–2), playoff (3–4), rebaixamento (últimas 2). */
function zona(pos: number): { cor: string; rotulo: keyof GameCopy["standings"]["legend"] } | null {
  if (pos <= 2) return { cor: OURO, rotulo: "promotion" };
  if (pos <= 4) return { cor: LIMA, rotulo: "playoff" };
  if (pos > VAGAS - 2) return { cor: RUBRO, rotulo: "relegation" };
  return null;
}

export function TabelaClassificacao({ copy }: { copy: GameCopy }) {
  const { standings: s } = copy;
  const cols = s.cols;

  return (
    <section id="tabela" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl sm:text-3xl" style={bebas}>
          {s.title.toUpperCase()}
        </h2>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest"
          style={{ borderColor: `${LIMA}55`, color: LIMA, background: `${LIMA}14` }}
        >
          <Lock size={11} /> {s.previewBadge}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{s.subtitle}</p>

      <div className="mt-6 overflow-hidden rounded-3xl border" style={superficie(LIMA)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-widest text-white/55">
                <th className="w-10 py-3 pl-4 text-center">{cols.pos}</th>
                <th className="py-3 pl-2 pr-4 text-left">{cols.club}</th>
                <th className="w-10 px-1 py-3 text-center">{cols.played}</th>
                <th className="w-10 px-1 py-3 text-center">{cols.won}</th>
                <th className="w-10 px-1 py-3 text-center">{cols.drawn}</th>
                <th className="w-10 px-1 py-3 text-center">{cols.lost}</th>
                <th className="w-11 px-1 py-3 text-center">{cols.gf}</th>
                <th className="w-11 px-1 py-3 text-center">{cols.ga}</th>
                <th className="w-11 px-1 py-3 text-center">{cols.gd}</th>
                <th className="w-12 px-1 py-3 text-center" style={{ color: OURO }}>
                  {cols.points}
                </th>
                {/* A coluna da forma NÃO se esconde em telas estreitas: a
                    tabela já tem `min-w` e rola na horizontal, então esconder
                    a coluna não economizava largura nenhuma — só desalinhava a
                    contagem com o `colSpan` da faixa do corpo. */}
                <th className="w-28 py-3 pl-2 pr-4 text-left">{cols.form}</th>
              </tr>
            </thead>
            {/*
              As oito posições da piloto, com as vagas nomeadas pelo que
              SIGNIFICAM. A primeira versão desenhava 8 linhas de barras cinzas
              no lugar dos clubes; renderizado, aquilo não lia como "ainda não
              começou", lia como skeleton que travou — a peça mais "painel de
              dados" da página parecendo quebrada. Agora cada linha diz a que
              ela dá direito, e o traço aparece só onde de fato falta número.
            */}
            <tbody className="tabular-nums">
              {Array.from({ length: VAGAS }, (_, i) => {
                const pos = i + 1;
                const z = zona(pos);
                return (
                  <tr key={pos} className="border-t border-white/[0.06]">
                    <td className="relative py-3 pl-4 text-center">
                      {z && (
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 w-[3px]"
                          style={{ background: z.cor }}
                        />
                      )}
                      <span
                        className="text-xs font-bold"
                        style={{ color: z ? z.cor : "rgba(255,255,255,.35)" }}
                      >
                        {pos}
                      </span>
                    </td>
                    <td className="py-3 pl-2 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed"
                          style={{ borderColor: z ? `${z.cor}55` : "rgba(255,255,255,.14)" }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: z ? `${z.cor}88` : "rgba(255,255,255,.18)" }}
                          />
                        </span>
                        <span className="text-[12.5px] font-semibold text-white/45">
                          {s.slotLabel.replace("{n}", String(pos))}
                        </span>
                        {z && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                            style={{ background: `${z.cor}18`, color: z.cor }}
                          >
                            {s.legend[z.rotulo]}
                          </span>
                        )}
                      </span>
                    </td>
                    {/*
                      A área numérica é uma FAIXA HACHURADA, não células.
                      Quatro rodadas de crítica leram esta tabela como
                      "quebrada", e cada tentativa trocou um defeito por outro:
                      barras cinzas no lugar dos clubes pareciam skeleton
                      travado; um "—" repetido em nove colunas × oito linhas
                      parecia dado que falhou ao carregar; célula em branco
                      parecia a mesma coisa. O que nenhuma delas tinha era uma
                      AFIRMAÇÃO. A hachura diz "este espaço está reservado e
                      ainda não foi preenchido" de um jeito que nenhum
                      carregamento quebrado produziria por acidente.
                    */}
                    <td className="p-0" colSpan={9}>
                      <span
                        aria-hidden
                        className="block h-7"
                        style={{
                          background:
                            "repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 6px, transparent 6px 12px)",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Estado vazio: o que o traço quer dizer. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 bg-white/[0.02] px-4 py-3.5">
          <p className="inline-flex items-center gap-2 text-xs text-white/55">
            <Trophy size={13} style={{ color: OURO }} />
            {s.empty}
          </p>
          <span className="ml-auto flex flex-wrap gap-x-4 gap-y-1.5">
            {(
              [
                ["promotion", OURO],
                ["playoff", LIMA],
                ["relegation", RUBRO],
              ] as const
            ).map(([chave, cor]) => (
              <span
                key={chave}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50"
              >
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: cor }} />
                {s.legend[chave]}
              </span>
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}
