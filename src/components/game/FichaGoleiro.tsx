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

      {dados.porTipo && <PorTipo t={dados.porTipo} copy={copy} totalDefesas={dados.defesas} jogos={dados.jogos} />}
    </section>
  );
}

/**
 * COMO FORAM AS DEFESAS — e por que a barra não fecha em 100%.
 *
 * A EA classifica parte das defesas em seis tipos e deixa o resto sem tipo. Se
 * a barra fosse desenhada só com os seis, ela encheria a largura toda e diria,
 * visualmente, "esta é a defesa inteira" — o que é falso. Então a faixa é
 * desenhada sobre o TOTAL de defesas, e a sobra fica ali, hachurada, dizendo o
 * que ela é: defesa que a EA contou e não disse de que tipo.
 *
 * A sobra não é pequena: medida no espelho inteiro, é 36,3% das defesas. E
 * `rebote` vem zerado em todas as 3.572 linhas — a EA tem o campo e não o
 * preenche —, então categoria com zero não entra na legenda: "Rebote 0" leria
 * como "este goleiro não segura rebote", que é afirmação nossa, não dela.
 *
 * O mesmo motivo faz aparecer "em N de M jogos": o espelho tem partidas
 * capturadas antes de 08/09/2026, quando o normalizador ainda jogava esses
 * campos fora. Sem essa linha, um goleiro veterano pareceria ter feito só as
 * defesas das últimas partidas.
 */
function PorTipo({
  t,
  copy,
  totalDefesas,
  jogos,
}: {
  t: NonNullable<FichaGoleiroDados["porTipo"]>;
  copy: CopyFicha["goleiro"];
  totalDefesas: number;
  jogos: number;
}) {
  const fatias: Array<{ rot: string; val: number; cor: string }> = [
    { rot: copy.mergulho, val: t.mergulho, cor: "#f97316" },
    { rot: copy.cruzamento, val: t.cruzamento, cor: "#fb923c" },
    { rot: copy.reflexo, val: t.reflexo, cor: "#fbbf24" },
    { rot: copy.direcao, val: t.direcao, cor: "#facc15" },
    { rot: copy.rebote, val: t.rebote, cor: "#fdba74" },
    { rot: copy.soco, val: t.soco, cor: "#fed7aa" },
  ].filter((f) => f.val > 0);

  // A barra mede sobre o total, não sobre a soma dos tipos: é o que impede a
  // peça de afirmar que os seis explicam a defesa inteira.
  const base = Math.max(totalDefesas, t.classificadas);
  const semTipo = Math.max(0, totalDefesas - t.classificadas);

  return (
    <div className="mt-5 rounded-xl bg-white/[0.03] p-4">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/60">{copy.porTipoTitulo}</h3>

      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {fatias.map((f) => (
          <div key={f.rot} title={`${f.rot}: ${f.val}`} style={{ width: `${(f.val / base) * 100}%`, background: f.cor }} />
        ))}
        {semTipo > 0 && (
          <div
            title={`${semTipo}`}
            style={{
              width: `${(semTipo / base) * 100}%`,
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,.16) 0 3px, transparent 3px 6px)",
            }}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {fatias.map((f) => (
          <span key={f.rot} className="flex items-center gap-1.5 text-[11px] text-white/60">
            <i className="h-2 w-2 shrink-0 rounded-sm" style={{ background: f.cor }} />
            {f.rot} <strong className="tabular-nums text-white/85">{f.val}</strong>
          </span>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-white/40">
        {copy.porTipoNota}{" "}
        {t.jogosComClassificacao < jogos && (
          <span className="text-white/55">
            ({t.jogosComClassificacao}/{jogos})
          </span>
        )}
      </p>
    </div>
  );
}
