"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2, Radio, TrendingUp, ChevronDown, ChevronUp, Layers } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import type { DivisaoEA, EaPlatform, LinhaRanking } from "@/lib/game/ea-api";
import { SeloProcedencia, type FonteDado } from "./SeloProcedencia";
import { LIMA, OURO, RUBRO, CINZA, CIANO, bebas, superficie } from "@/lib/game/tema";

/**
 * RANKING GLOBAL + ESCADA DAS DIVISÕES — 25/08/2026.
 *
 * A landing tinha UMA tabela e ela estava vazia: as oito vagas da liga piloto,
 * que só disputa a primeira rodada em outubro. Uma tabela sem número não ensina
 * o formato, ela só parece quebrada — e era a peça mais "painel de dados" da
 * página inteira.
 *
 * Esta aqui é a tabela cheia que faltava: o ranking de todos os tempos do modo
 * Clubs, com número medido em toda célula, lido ao vivo da mesma fonte pública
 * que alimenta a central do clube. Logo abaixo, a escada de divisões da EA —
 * quantos pontos promovem, seguram e dão título em cada uma —, que responde a
 * pergunta que a coluna "Div" levanta.
 *
 * Os 25 primeiros vêm de cara; os 100 ficam atrás de um botão, porque cem
 * linhas empurrariam o resto da página para fora do primeiro rolar.
 */

const PREVIA = 25;

interface Payload {
  ranking: LinhaRanking[];
  divisoes: DivisaoEA[];
  fonte: FonteDado;
  capturedAt: string | null;
}

export function TabelaRanking({ copy }: { copy: GameCopy }) {
  const [piscina, setPiscina] = useState<EaPlatform>("common-gen5");
  const [dado, setDado] = useState<Payload | null | "erro">(null);
  const [tudo, setTudo] = useState(false);

  useEffect(() => {
    let vivo = true;
    setDado(null);
    fetch(`/api/game/ea/ranking?plataforma=${piscina}&limite=100`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!vivo) return;
        const linhas: LinhaRanking[] = Array.isArray(d.ranking) ? d.ranking : [];
        if (linhas.length === 0) return setDado("erro");
        setDado({
          ranking: linhas,
          divisoes: Array.isArray(d.divisoes) ? d.divisoes : [],
          fonte: (d.fonte ?? "vazio") as FonteDado,
          capturedAt: d.capturedAt ?? null,
        });
      })
      .catch(() => vivo && setDado("erro"));
    return () => {
      vivo = false;
    };
  }, [piscina]);

  const r = copy.ranking;
  const linhas = dado && dado !== "erro" ? (tudo ? dado.ranking : dado.ranking.slice(0, PREVIA)) : [];

  return (
    <section id="ranking" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl sm:text-3xl" style={bebas}>
          {r.title.toUpperCase()}
        </h2>
        {/* O selo antes era um "DADO AO VIVO" fixo. Em produção isso era falso:
            a EA recusa leitura de servidor e a tabela vem do nosso acervo. O
            selo agora diz qual das duas fontes serviu esta tela. */}
        {dado && dado !== "erro" ? (
          <SeloProcedencia fonte={dado.fonte} capturedAt={dado.capturedAt} copy={copy} />
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest"
            style={{ borderColor: `${LIMA}55`, color: LIMA, background: `${LIMA}14` }}
          >
            <Radio size={11} /> {r.badge}
          </span>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{r.subtitle}</p>

      {/* Seletor de geração — as duas piscinas têm rankings diferentes. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
          {r.platformLabel}
        </span>
        {(
          [
            ["common-gen5", r.platformGen5],
            ["common-gen4", r.platformGen4],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => {
              setPiscina(valor);
              setTudo(false);
            }}
            aria-pressed={piscina === valor}
            className="rounded-full border px-3 py-1 text-[11px] font-bold transition-colors"
            style={
              piscina === valor
                ? { background: `${LIMA}1f`, color: LIMA, borderColor: `${LIMA}66` }
                : {
                    background: "rgba(255,255,255,.04)",
                    color: "rgba(255,255,255,.6)",
                    borderColor: "rgba(255,255,255,.12)",
                  }
            }
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border" style={superficie(LIMA)}>
        {dado === null && (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
            <Loader2 size={15} className="animate-spin" />
            {r.loading}
          </p>
        )}

        {dado === "erro" && (
          <p className="px-5 py-14 text-center text-sm text-white/55">{r.error}</p>
        )}

        {dado && dado !== "erro" && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-widest text-white/55">
                    <th className="w-12 py-3 pl-4 text-center">{r.cols.rank}</th>
                    <th className="py-3 pl-2 pr-4 text-left">{r.cols.club}</th>
                    <th className="w-12 px-1 py-3 text-center">{r.cols.division}</th>
                    <th className="w-12 px-1 py-3 text-center">{r.cols.played}</th>
                    <th className="w-11 px-1 py-3 text-center">{r.cols.won}</th>
                    <th className="w-11 px-1 py-3 text-center">{r.cols.drawn}</th>
                    <th className="w-11 px-1 py-3 text-center">{r.cols.lost}</th>
                    <th className="w-12 px-1 py-3 text-center">{r.cols.gf}</th>
                    <th className="w-12 px-1 py-3 text-center">{r.cols.ga}</th>
                    <th className="w-12 px-1 py-3 text-center">{r.cols.gd}</th>
                    <th className="w-11 px-1 py-3 text-center">{r.cols.cleanSheets}</th>
                    <th className="w-16 px-1 py-3 pr-4 text-center" style={{ color: OURO }}>
                      {r.cols.skill}
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {linhas.map((l) => {
                    const sg = l.goals - l.goalsAgainst;
                    // Pódio em ouro — é a única recompensa da tabela (§3).
                    const podio = l.rank <= 3;
                    return (
                      <tr
                        key={`${l.platform}-${l.clubId}`}
                        className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="relative py-2.5 pl-4 text-center">
                          {podio && (
                            <span
                              aria-hidden
                              className="absolute inset-y-0 left-0 w-[3px]"
                              style={{ background: OURO }}
                            />
                          )}
                          <span
                            className="text-xs font-black"
                            style={{ color: podio ? OURO : "rgba(255,255,255,.45)" }}
                          >
                            {l.rank}
                          </span>
                        </td>
                        <td className="py-2.5 pl-2 pr-4">
                          <Link
                            href={`/game/clube/${l.clubId}?p=${l.platform}`}
                            className="truncate font-semibold text-white/90 transition-colors hover:text-white"
                            style={podio ? { color: OURO } : undefined}
                          >
                            {l.name}
                          </Link>
                        </td>
                        <td className="px-1 py-2.5 text-center">
                          <span
                            className="inline-block min-w-[22px] rounded px-1 py-px text-[11px] font-bold"
                            style={{ background: `${CIANO}18`, color: CIANO }}
                          >
                            {l.currentDivision ?? "—"}
                          </span>
                        </td>
                        <td className="px-1 py-2.5 text-center text-white/70">{l.gamesPlayed}</td>
                        <td className="px-1 py-2.5 text-center font-semibold" style={{ color: LIMA }}>
                          {l.wins}
                        </td>
                        <td className="px-1 py-2.5 text-center" style={{ color: CINZA }}>
                          {l.ties}
                        </td>
                        <td className="px-1 py-2.5 text-center" style={{ color: RUBRO }}>
                          {l.losses}
                        </td>
                        <td className="px-1 py-2.5 text-center text-white/70">{l.goals}</td>
                        <td className="px-1 py-2.5 text-center text-white/70">{l.goalsAgainst}</td>
                        <td
                          className="px-1 py-2.5 text-center font-semibold"
                          style={{ color: sg >= 0 ? LIMA : RUBRO }}
                        >
                          {sg > 0 ? "+" : ""}
                          {sg}
                        </td>
                        <td className="px-1 py-2.5 text-center text-white/70">{l.cleanSheets}</td>
                        <td
                          className="px-1 py-2.5 pr-4 text-center font-black"
                          style={{ color: OURO }}
                        >
                          {l.skillRating ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 bg-white/[0.02] px-4 py-3">
              <button
                type="button"
                onClick={() => setTudo((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors"
                style={{ borderColor: `${LIMA}44`, color: LIMA }}
              >
                {tudo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {tudo ? r.less : r.more}
              </button>
              <p className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
                <TrendingUp size={12} style={{ color: CIANO }} />
                {r.note}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ---------------- Escada das divisões ---------------- */}
      {dado && dado !== "erro" && dado.divisoes.length > 0 && (
        <EscadaDivisoes divisoes={dado.divisoes} copy={copy} />
      )}
    </section>
  );
}

/**
 * A escada de divisões, direto do endpoint `settings` da EA. Existe aqui, e não
 * numa página de ajuda, porque é a legenda da coluna "Div" da tabela acima:
 * sem ela, "Div 8" é um número sem escala.
 */
function EscadaDivisoes({ divisoes, copy }: { divisoes: DivisaoEA[]; copy: GameCopy }) {
  const d = copy.divisions;
  const maxTitulo = Math.max(...divisoes.map((x) => x.pointsToTitle), 1);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-xl sm:text-2xl" style={bebas}>
          {d.title.toUpperCase()}
        </h3>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: CIANO }}
        >
          <Layers size={12} /> {divisoes.length}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{d.subtitle}</p>

      <div className="mt-5 overflow-hidden rounded-3xl border" style={superficie(CIANO)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-widest text-white/55">
                <th className="py-3 pl-4 pr-2 text-left">{d.cols.division}</th>
                <th className="w-24 px-2 py-3 text-center">{d.cols.promotion}</th>
                <th className="w-24 px-2 py-3 text-center">{d.cols.hold}</th>
                <th className="w-24 px-2 py-3 text-center">{d.cols.title}</th>
                <th className="px-2 py-3 pr-4 text-left" />
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {divisoes.map((x) => (
                <tr key={x.divisionId} className="border-t border-white/[0.06]">
                  <td className="py-2.5 pl-4 pr-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black"
                        style={{
                          background: x.divisionId === 1 ? `${OURO}1f` : `${CIANO}18`,
                          color: x.divisionId === 1 ? OURO : CIANO,
                        }}
                      >
                        {x.divisionId}
                      </span>
                      <span className="text-[12.5px] font-semibold text-white/80">
                        {d.cols.division} {x.divisionId}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center font-semibold" style={{ color: LIMA }}>
                    {x.pointsForPromotion}
                  </td>
                  <td className="px-2 py-2.5 text-center text-white/70">{x.pointsToHoldDivision}</td>
                  <td className="px-2 py-2.5 text-center font-semibold" style={{ color: OURO }}>
                    {x.pointsToTitle}
                  </td>
                  {/* A barra torna comparável o que a coluna só enumera. */}
                  <td className="py-2.5 pl-2 pr-4">
                    <span aria-hidden className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <span
                        style={{
                          width: `${(x.pointsToHoldDivision / maxTitulo) * 100}%`,
                          background: `${CINZA}99`,
                        }}
                      />
                      <span
                        style={{
                          width: `${((x.pointsForPromotion - x.pointsToHoldDivision) / maxTitulo) * 100}%`,
                          background: LIMA,
                        }}
                      />
                      <span
                        style={{
                          width: `${((x.pointsToTitle - x.pointsForPromotion) / maxTitulo) * 100}%`,
                          background: OURO,
                        }}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] text-white/45">
          {d.note}
        </p>
      </div>
    </div>
  );
}
