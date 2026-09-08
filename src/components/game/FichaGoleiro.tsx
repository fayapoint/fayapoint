"use client";

import { Hand } from "lucide-react";
import type { FichaGoleiroDados, CopyFicha } from "@/lib/game/jogador-servidor";
import { LARANJA, bebas, superficie, corNota } from "@/lib/game/tema";

/**
 * A FICHA DE GOLEIRO — o que nenhum tracker de Pro Clubs mostra.
 *
 * A EA publica `saves` e `goalsConceded` POR PARTIDA, e no elenco da temporada
 * o `cleanSheetsGk`; ninguém os soma. Aqui o goleiro ganha a própria leitura,
 * só com as partidas inteiras em que a gamertag esteve no gol (setor GOL) —
 * partida de abandono e partida na linha ficam fora.
 *
 * A cor é a LARANJA do setor GOL (`corSetor`), não ouro: ser goleiro é
 * classificação, não recompensa.
 */
export function FichaGoleiro({ dados, copy }: { dados: FichaGoleiroDados; copy: CopyFicha["goleiro"] }) {
  const cels: Array<{ rot: string; val: string; cor?: string }> = [
    { rot: copy.jogos, val: String(dados.jogos) },
    { rot: copy.defesas, val: String(dados.defesas), cor: LARANJA },
    { rot: copy.defesasPorJogo, val: dados.defesasPorJogo == null ? "—" : dados.defesasPorJogo.toFixed(1), cor: LARANJA },
    { rot: copy.golsSofridos, val: String(dados.golsSofridos) },
    { rot: copy.golsSofridosPorJogo, val: dados.golsSofridosPorJogo == null ? "—" : dados.golsSofridosPorJogo.toFixed(2) },
    { rot: copy.semSofrer, val: String(dados.semSofrer), cor: LARANJA },
    { rot: copy.nota, val: dados.notaMedia == null ? "—" : dados.notaMedia.toFixed(2), cor: corNota(dados.notaMedia) },
    { rot: copy.aproveitamento, val: dados.aproveitamento == null ? "—" : `${dados.aproveitamento}%` },
  ];
  if (dados.semSofrerTemporada != null) {
    cels.push({ rot: copy.semSofrerTemporada, val: String(dados.semSofrerTemporada) });
  }

  return (
    <section className="rounded-2xl border p-5" style={superficie(LARANJA, "forte")}>
      <h2 className="flex items-center gap-2 text-xl" style={bebas}>
        <Hand size={18} style={{ color: LARANJA }} />
        {copy.titulo.toUpperCase()}
      </h2>
      <p className="mt-1 text-[12.5px] text-white/55">{copy.sub}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cels.map((cel) => (
          <div key={cel.rot} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="leading-none tabular-nums" style={{ ...bebas, fontSize: "1.8rem", color: cel.cor ?? "#fff" }}>
              {cel.val}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">{cel.rot}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
