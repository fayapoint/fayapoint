"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  Crown,
  Award,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Flag,
  ShieldOff,
} from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import type { ClubMatch, MatchPlayer, MatchType } from "@/lib/game/ea-api";
import {
  LIMA,
  OURO,
  RUBRO,
  CINZA,
  CIANO,
  bebas,
  corNota,
  corResultado,
  superficie,
  setorDaPosicao,
  corSetor,
} from "@/lib/game/tema";

/**
 * CALENDÁRIO DE PARTIDAS — 25/08/2026.
 *
 * A seção tinha um "calendário" que era o cronograma do PROJETO (fases, meses,
 * lançamento do FC 27). Útil, mas não é o que se pede a um calendário de liga:
 * "quando jogamos, contra quem, e o que aconteceu".
 *
 * Este é o calendário de JOGOS. Liga, playoff e amistoso numa linha do tempo
 * só, agrupada por dia, com o placar legível antes de qualquer leitura — e a
 * súmula completa dos dois times a um clique, que é o dado que a EA publica e
 * a v1 jogava fora (ela mostrava só artilheiro e craque do nosso lado).
 *
 * Sobre o horário: o timestamp da EA tem fuso inconsistente (+1h/+2h conforme o
 * título). Por isso a DATA aparece e a hora aparece discreta ao lado — nunca
 * como âncora de nada. Casar partida por hora exata é o erro que a ingestão da
 * Fase 1 não pode cometer.
 */

const TIPO_COR: Record<MatchType, string> = {
  leagueMatch: LIMA,
  playoffMatch: OURO,
  friendlyMatch: CIANO,
};

export function CalendarioPartidas({
  partidas,
  clubId,
  copy,
  locale,
}: {
  partidas: ClubMatch[] | null;
  clubId: string;
  copy: GameCopy;
  locale: string;
}) {
  const [filtro, setFiltro] = useState<MatchType | "todas">("todas");
  const [aberta, setAberta] = useState<string | null>(null);
  const c = copy.club;

  const visiveis = useMemo(
    () => (partidas ?? []).filter((p) => filtro === "todas" || p.matchType === filtro),
    [partidas, filtro]
  );

  /** Agrupa por dia — o calendário lê por data, não por lista corrida. */
  const dias = useMemo(() => {
    const mapa = new Map<string, ClubMatch[]>();
    for (const p of visiveis) {
      const d = new Date(p.timestamp * 1000);
      const chave = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const lista = mapa.get(chave);
      if (lista) lista.push(p);
      else mapa.set(chave, [p]);
    }
    return [...mapa.entries()];
  }, [visiveis]);

  const contagem = useMemo(() => {
    const n: Record<string, number> = { todas: partidas?.length ?? 0 };
    for (const p of partidas ?? []) n[p.matchType] = (n[p.matchType] ?? 0) + 1;
    return n;
  }, [partidas]);

  return (
    <section id="calendario-jogos" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl sm:text-3xl" style={bebas}>
          {c.calendarTitle.toUpperCase()}
        </h2>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: LIMA }}
        >
          <CalendarDays size={13} /> {partidas?.length ?? 0}
        </span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">{c.calendarSubtitle}</p>

      {/* Filtros por tipo, com a contagem real de cada um. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["todas", c.calendarAll],
            ["leagueMatch", c.matchTypes.leagueMatch],
            ["playoffMatch", c.matchTypes.playoffMatch],
            ["friendlyMatch", c.matchTypes.friendlyMatch],
          ] as const
        ).map(([valor, rotulo]) => {
          const ativo = filtro === valor;
          const cor = valor === "todas" ? LIMA : TIPO_COR[valor];
          const n = contagem[valor] ?? 0;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              disabled={n === 0 && valor !== "todas"}
              aria-pressed={ativo}
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30"
              style={
                ativo
                  ? { background: `${cor}1f`, color: cor, borderColor: `${cor}66` }
                  : {
                      background: "rgba(255,255,255,.04)",
                      color: "rgba(255,255,255,.65)",
                      borderColor: "rgba(255,255,255,.12)",
                    }
              }
            >
              {rotulo}
              <span className="tabular-nums opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-6">
        {partidas === null && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] py-14 text-sm text-white/50">
            <Loader2 size={15} className="animate-spin" />
            {c.loading}
          </div>
        )}

        {partidas !== null && visiveis.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/12 px-5 py-12 text-center text-sm text-white/55">
            {c.matchesEmpty}
          </p>
        )}

        {dias.map(([chave, lista]) => (
          <div key={chave}>
            <p className="mb-2 flex items-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">
                {rotuloDoDia(lista[0].timestamp, locale, copy)}
              </span>
              <span aria-hidden className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[11px] font-semibold tabular-nums text-white/30">
                {lista.length}
              </span>
            </p>
            <div className="space-y-2">
              {lista.map((p) => (
                <LinhaPartida
                  key={p.matchId}
                  partida={p}
                  clubId={clubId}
                  copy={copy}
                  locale={locale}
                  aberta={aberta === p.matchId}
                  alternar={() => setAberta((a) => (a === p.matchId ? null : p.matchId))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-white/45">{c.sourceNote}</p>
    </section>
  );
}

/** "Hoje", "Ontem", ou a data por extenso. O dia é a âncora; a hora, não. */
function rotuloDoDia(timestamp: number, locale: string, copy: GameCopy): string {
  const d = new Date(timestamp * 1000);
  const hoje = new Date();
  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (mesmoDia(d, hoje)) return copy.club.todayLabel;
  const ontem = new Date(hoje.getTime() - 86400000);
  if (mesmoDia(d, ontem)) return copy.club.yesterdayLabel;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

/** Uma partida no calendário: placar, quem decidiu, e a súmula sob demanda. */
function LinhaPartida({
  partida,
  clubId,
  copy,
  locale,
  aberta,
  alternar,
}: {
  partida: ClubMatch;
  clubId: string;
  copy: GameCopy;
  locale: string;
  aberta: boolean;
  alternar: () => void;
}) {
  const nos = partida.clubs.find((x) => x.clubId === clubId);
  const eles = partida.clubs.find((x) => x.clubId !== clubId);
  if (!nos || !eles) return null;

  const c = copy.club;
  const cor = corResultado(nos.result);
  const corTipo = TIPO_COR[partida.matchType];
  const craque =
    nos.players.find((j) => j.mom) ??
    nos.players.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  const artilheiros = nos.players.filter((j) => j.goals > 0).sort((a, b) => b.goals - a.goals);
  const hora = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(partida.timestamp * 1000));

  return (
    <article className="overflow-hidden rounded-2xl border" style={superficie(cor)}>
      <div className="flex items-stretch">
        <span aria-hidden className="w-1 shrink-0" style={{ background: cor }} />
        <div className="min-w-0 flex-1">
          {/* Cabeçalho: tipo, hora, abandono */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 pt-2.5">
            <span
              className="rounded px-1.5 py-px text-[9.5px] font-black uppercase tracking-wider"
              style={{ background: `${corTipo}1c`, color: corTipo }}
            >
              {c.matchTypes[partida.matchType]}
            </span>
            <span className="text-[10.5px] font-semibold tabular-nums text-white/35">{hora}</span>
            {/*
              `winnerByDnf` vem marcado no clube que VENCEU por abandono — ou
              seja, quem largou a partida é o OUTRO. Medido em 25/08/2026 no
              clube 5053340: quatro derrotas (0×3, 2×6, 0×3, 1×5) traziam a
              marca no adversário. Ler o campo como "o adversário abandonou"
              inverteria a acusação em toda partida perdida — por isso a etiqueta
              NOMEIA quem abandonou, em vez de dizer "eles".
            */}
            {(nos.winnerByDnf || eles.winnerByDnf) && (
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider"
                style={{ background: `${OURO}18`, color: OURO }}
              >
                <ShieldOff size={9} />
                {c.dnfBy.replace("{club}", nos.winnerByDnf ? eles.name : nos.name)}
              </span>
            )}
          </div>

          {/* Placar */}
          <div className="flex items-center gap-3 px-4 py-2 sm:gap-5">
            <p className="min-w-0 flex-1 truncate text-right text-sm font-bold sm:text-base">
              {nos.name}
            </p>
            <p className="shrink-0 text-3xl leading-none tabular-nums" style={bebas}>
              <span style={{ color: cor }}>{nos.goals}</span>
              <span className="mx-1.5 text-white/25">×</span>
              <span className="text-white/85">{eles.goals}</span>
            </p>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-white/75 sm:text-base">
              {eles.name}
            </p>
          </div>
        </div>
      </div>

      {/* Quem decidiu + o botão da súmula */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
        {artilheiros.length > 0 && (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
            <Crown size={12} style={{ color: OURO }} />
            {artilheiros.map((j) => (
              <span key={j.name} className="font-semibold text-white/75">
                {j.name}
                {j.goals > 1 && <span style={{ color: OURO }}> ×{j.goals}</span>}
              </span>
            ))}
          </span>
        )}
        {craque && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px]">
            <Award size={12} style={{ color: OURO }} />
            <span className="text-white/45">{c.momBadge}</span>
            <span className="font-bold text-white/85">{craque.name}</span>
            {craque.rating != null && (
              <span
                className="rounded px-1.5 py-0.5 text-[11px] font-black tabular-nums"
                style={{ color: corNota(craque.rating), background: `${corNota(craque.rating)}18` }}
              >
                {craque.rating.toFixed(1)}
              </span>
            )}
          </span>
        )}
        <button
          type="button"
          onClick={alternar}
          aria-expanded={aberta}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold transition-colors hover:text-white"
          style={{ color: aberta ? LIMA : "rgba(255,255,255,.5)" }}
        >
          {aberta ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {aberta ? c.hideDetail : c.detail}
        </button>
      </div>

      {/* Súmula: os dois times, jogador por jogador. */}
      {aberta && (
        <div className="border-t border-white/[0.07] bg-black/20 px-3 py-3 sm:px-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white/40">
            <Flag size={11} />
            {c.matchPlayers}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {[nos, eles].map((lado) => (
              <TabelaSumula
                key={lado.clubId}
                nome={lado.name}
                jogadores={lado.players}
                nosso={lado.clubId === clubId}
                copy={copy}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

/** A súmula de um lado: a estatística por jogador que a EA publica e ninguém lê. */
function TabelaSumula({
  nome,
  jogadores,
  nosso,
  copy,
}: {
  nome: string;
  jogadores: MatchPlayer[];
  nosso: boolean;
  copy: GameCopy;
}) {
  const c = copy.club;
  const ordenados = jogadores
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.goals - a.goals);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08]">
      <p
        className="truncate px-3 py-2 text-[11.5px] font-bold"
        style={{
          background: nosso ? `${LIMA}12` : "rgba(255,255,255,.03)",
          color: nosso ? LIMA : "rgba(255,255,255,.7)",
        }}
      >
        {nome}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] text-[11.5px]">
          <thead>
            <tr className="border-b border-white/[0.08] text-[9px] font-extrabold uppercase tracking-wider text-white/40">
              <th className="py-1.5 pl-3 pr-2 text-left">{c.squadCols.player}</th>
              <th className="w-9 px-1 py-1.5 text-center">{c.squadCols.goals}</th>
              <th className="w-9 px-1 py-1.5 text-center">{c.squadCols.assists}</th>
              <th className="w-14 px-1 py-1.5 text-center">{c.squadCols.passes}</th>
              <th className="w-12 px-1 py-1.5 text-center">{c.colSaves}</th>
              <th className="w-12 px-1 py-1.5 text-center">{c.minutesLabel}</th>
              <th className="w-11 px-1 py-1.5 pr-3 text-center">{c.squadCols.rating}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {ordenados.map((j, i) => {
              const setor = setorDaPosicao(j.position);
              const min = j.secondsPlayed != null ? Math.round(j.secondsPlayed / 60) : null;
              // A EA publica o tempo PARADO. Quem passou mais de um terço do
              // jogo sem tocar na bola largou a partida — e isso é dado de
              // integridade, não fofoca: é o que a liga precisa para arbitrar.
              const largou =
                j.secondsIdle != null &&
                j.secondsPlayed != null &&
                j.secondsPlayed > 0 &&
                j.secondsIdle / j.secondsPlayed > 0.34;
              return (
                <tr key={`${j.name}-${i}`} className="border-t border-white/[0.05]">
                  <td className="py-1.5 pl-3 pr-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-7 shrink-0 rounded px-1 text-center text-[8.5px] font-black"
                        style={{ background: `${corSetor(setor)}1c`, color: corSetor(setor) }}
                      >
                        {setor}
                      </span>
                      <span className="truncate font-semibold text-white/85">{j.name}</span>
                      {j.mom && <Award size={10} className="shrink-0" style={{ color: OURO }} />}
                      {j.redCards > 0 && (
                        <span
                          aria-label={c.colRed}
                          className="inline-block h-3 w-2 shrink-0 rounded-[2px]"
                          style={{ background: RUBRO }}
                        />
                      )}
                    </span>
                  </td>
                  <td
                    className="px-1 py-1.5 text-center font-bold"
                    style={{ color: j.goals > 0 ? OURO : "rgba(255,255,255,.3)" }}
                  >
                    {j.goals || "—"}
                  </td>
                  <td
                    className="px-1 py-1.5 text-center"
                    style={{ color: j.assists > 0 ? LIMA : "rgba(255,255,255,.3)" }}
                  >
                    {j.assists || "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center text-white/55">
                    {j.passesMade != null && j.passAttempts != null && j.passAttempts > 0
                      ? `${j.passesMade}/${j.passAttempts}`
                      : "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center text-white/55">
                    {j.saves != null && j.saves > 0 ? j.saves : "—"}
                  </td>
                  <td
                    className="px-1 py-1.5 text-center"
                    style={{ color: largou ? RUBRO : "rgba(255,255,255,.45)" }}
                    title={
                      j.secondsIdle != null
                        ? `${Math.round(j.secondsIdle / 60)} ${c.minutesLabel} ${c.idleLabel}`
                        : undefined
                    }
                  >
                    {min != null ? min : "—"}
                  </td>
                  <td className="px-1 py-1.5 pr-3 text-center">
                    <span
                      className="inline-block rounded px-1 py-px font-black"
                      style={{
                        color: corNota(j.rating),
                        background: `${corNota(j.rating)}16`,
                      }}
                    >
                      {j.rating != null ? j.rating.toFixed(1) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ordenados.length === 0 && (
        <p className="px-3 py-4 text-center text-[11px] text-white/40">{c.squadEmpty}</p>
      )}
      {/* A legenda diz o que a cor da coluna de minutos significa — sem ela, o
          número vermelho de quem largou o jogo lia como erro de leitura. */}
      <p className="flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-1.5 text-[9.5px] leading-snug text-white/30">
        <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: RUBRO }} />
        <span>{c.idleLegend}</span>
      </p>
    </div>
  );
}
