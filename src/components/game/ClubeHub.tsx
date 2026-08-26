"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Shield,
  BadgeCheck,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  Flame,
  UserCheck,
  Users,
} from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import type {
  ClubMatch,
  ClubMemberCareer,
  ClubMemberStats,
  ClubOverallStats,
  ClubSearchResult,
  DivisaoEA,
  EaPlatform,
} from "@/lib/game/ea-api";
import { TabelaElenco } from "./TabelaElenco";
import { CalendarioPartidas } from "./CalendarioPartidas";
import { SeloProcedencia, type FonteDado } from "./SeloProcedencia";
import {
  LIMA,
  OURO,
  RUBRO,
  CINZA,
  CIANO,
  VIOLETA,
  bebas,
  corResultado,
  superficie,
  FUNDO,
  corSetor,
  setorDaPosicao,
  corNota,
} from "@/lib/game/tema";

interface ClubePayload {
  info: ClubSearchResult | null;
  stats: ClubOverallStats | null;
  members: ClubMemberStats[];
  career: ClubMemberCareer[];
  divisoes: DivisaoEA[];
  /** A linha do clube no índice da EA — a única fonte de divisão ATUAL. */
  tabela: ClubSearchResult | null;
  plataforma: EaPlatform;
  /** Fonte viva da EA ou o nosso acervo — a tela precisa dizer qual. */
  fonte: FonteDado;
  capturedAt: string | null;
}

/**
 * CENTRAL DO CLUBE — ampliada em 25/08/2026.
 *
 * A v1 (23/08) provava a tese: o dado do time entra sem senha. Ela mostrava
 * campanha, elenco e as últimas 10 partidas de um tipo.
 *
 * Faltavam quatro coisas que a EA publica e a página não lia:
 *  1. **Divisão atual e pontos da temporada** — os dois números que um time de
 *     Clubs olha primeiro. Não estão em `overallStats`; só no índice de busca.
 *  2. **A forma real das 10 últimas** (`lastMatch0..9`), que atravessa os tipos
 *     de partida — a v1 derivava forma de 6 jogos de um tipo só.
 *  3. **Carreira** de cada jogador, ao lado da temporada.
 *  4. **O jogador**: qual daquelas gamertags é a pessoa que está olhando a tela.
 *
 * E o calendário de jogos, que virou componente próprio (`CalendarioPartidas`),
 * com a súmula dos DOIS times por partida.
 */
export function ClubeHub({
  clubId,
  copy,
  locale,
  plataforma: plataformaPedida,
}: {
  clubId: string;
  copy: GameCopy;
  locale: string;
  plataforma?: EaPlatform;
}) {
  const [dado, setDado] = useState<ClubePayload | null | "erro">(null);
  const [partidas, setPartidas] = useState<ClubMatch[] | null>(null);
  const [vinculo, setVinculo] = useState<"idle" | "enviando" | "ok" | "login">("idle");
  const [aba, setAba] = useState<"temporada" | "carreira">("temporada");

  const qs = plataformaPedida ? `?plataforma=${plataformaPedida}` : "";

  useEffect(() => {
    let vivo = true;
    fetch(`/api/game/ea/clube/${clubId}${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => vivo && setDado(d))
      .catch(() => vivo && setDado("erro"));
    return () => {
      vivo = false;
    };
  }, [clubId, qs]);

  // As partidas só podem ser pedidas depois que a plataforma real é conhecida:
  // pedir na piscina errada devolve lista vazia sem erro nenhum.
  const plataformaReal = dado && dado !== "erro" ? dado.plataforma : null;
  useEffect(() => {
    if (!plataformaReal) return;
    let vivo = true;
    setPartidas(null);
    fetch(`/api/game/ea/clube/${clubId}/partidas?tipo=todas&plataforma=${plataformaReal}`)
      .then((r) => r.json())
      .then((d) => vivo && setPartidas(Array.isArray(d.matches) ? d.matches : []))
      .catch(() => vivo && setPartidas([]));
    return () => {
      vivo = false;
    };
  }, [clubId, plataformaReal]);

  const vincular = useCallback(async () => {
    if (vinculo === "enviando") return;
    setVinculo("enviando");
    const res = await fetch("/api/game/clube/vincular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eaClubId: clubId, plataforma: plataformaReal ?? "common-gen5" }),
    }).catch(() => null);
    if (res?.ok) setVinculo("ok");
    else if (res?.status === 401) setVinculo("login");
    else setVinculo("idle");
  }, [clubId, plataformaReal, vinculo]);

  const c = copy.club;

  if (dado === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-white/55">
        <Loader2 size={26} className="animate-spin" style={{ color: LIMA }} />
        <p className="text-sm">{c.loading}</p>
      </div>
    );
  }

  if (dado === "erro" || (!dado.info && !dado.stats)) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto" style={{ color: OURO }} />
        <p className="mt-4 text-sm leading-relaxed text-white/65">{c.notFound}</p>
        <Link
          href="/game"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold"
          style={{ background: LIMA, color: FUNDO }}
        >
          <ArrowLeft size={14} />
          {c.backToSearch.replace(/^←\s*/, "")}
        </Link>
      </div>
    );
  }

  const s = dado.stats;
  const nome = dado.info?.name ?? `Club ${clubId}`;
  const total = s ? Math.max(1, s.wins + s.ties + s.losses) : 1;
  /** Aproveitamento no critério brasileiro: pontos ganhos sobre pontos disputados. */
  const aproveitamento = s ? Math.round(((s.wins * 3 + s.ties) / (total * 3)) * 100) : 0;
  const saldo = s ? s.goals - s.goalsAgainst : 0;
  const forma = s?.form ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/game"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} />
        {c.backToSearch.replace(/^←\s*/, "")}
      </Link>

      {/* ============================== CABEÇALHO ============================== */}
      <header
        className="relative mt-4 overflow-hidden rounded-3xl border p-5 sm:p-7"
        style={superficie(LIMA, "forte")}
      >
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 300,
            height: 300,
            right: -40,
            top: -120,
            background: `radial-gradient(circle, ${LIMA}2e, transparent 65%)`,
            animation: "fx-drift-b 15s ease-in-out infinite",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl sm:h-20 sm:w-20"
            style={{ background: `${LIMA}14`, border: `1px solid ${LIMA}44` }}
          >
            <Shield className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: LIMA }} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl leading-none sm:text-5xl" style={bebas}>
              {nome.toUpperCase()}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest"
                style={{ borderColor: `${LIMA}55`, color: LIMA, background: `${LIMA}12` }}
              >
                <BadgeCheck size={11} />
                {c.sourceBadge}
              </span>
              <SeloProcedencia fonte={dado.fonte} capturedAt={dado.capturedAt} copy={copy} />
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60"
                style={{ borderColor: "rgba(255,255,255,.14)" }}
              >
                <Gamepad2 size={11} />
                {dado.plataforma === "common-gen4"
                  ? copy.search.platformGen4
                  : copy.search.platformGen5}
              </span>
              {dado.info?.stadName && (
                <span className="text-[11px] font-semibold text-white/45">
                  {dado.info.stadName}
                </span>
              )}
            </div>

            {/* A forma REAL das 10 últimas, direto de `lastMatch0..9`. */}
            {forma.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
                  {c.form}
                </span>
                <span className="flex gap-1">
                  {forma.map((r, i) => (
                    <span
                      key={i}
                      className="flex h-5 w-5 items-center justify-center rounded-[5px] text-[10px] font-black"
                      style={{ background: `${corResultado(r)}26`, color: corResultado(r) }}
                      title={r}
                    >
                      {r === "win" ? c.wins : r === "loss" ? c.losses : c.draws}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {vinculo === "ok" ? (
              <p
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold"
                style={{ borderColor: `${LIMA}55`, color: LIMA, background: `${LIMA}12` }}
              >
                <BadgeCheck size={15} />
                {c.linked.replace(/\s*✓$/, "")}
              </p>
            ) : vinculo === "login" ? (
              <Link
                href="/login"
                className="inline-block rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors"
                style={{ borderColor: `${OURO}66`, color: OURO }}
              >
                {c.loginToLink}
              </Link>
            ) : (
              <button
                onClick={vincular}
                disabled={vinculo === "enviando"}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform disabled:opacity-40 enabled:hover:-translate-y-0.5"
                style={{ background: LIMA, color: FUNDO }}
              >
                {vinculo === "enviando" && <Loader2 size={14} className="animate-spin" />}
                {vinculo === "enviando" ? c.linking : c.link}
              </button>
            )}
          </div>
        </div>

        {/* Barra de campanha: V/E/D em proporção real, legível antes de ler número. */}
        {s && (
          <div className="relative mt-6">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              {(
                [
                  [s.wins, LIMA],
                  [s.ties, CINZA],
                  [s.losses, RUBRO],
                ] as const
              ).map(([v, cor], i) => (
                <span key={i} style={{ width: `${(v / total) * 100}%`, background: cor }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider">
              {(
                [
                  [c.wins, s.wins, LIMA],
                  [c.draws, s.ties, CINZA],
                  [c.losses, s.losses, RUBRO],
                ] as const
              ).map(([label, v, cor]) => (
                <span key={label} className="inline-flex items-center gap-1.5" style={{ color: cor }}>
                  <span className="h-2 w-2 rounded-sm" style={{ background: cor }} />
                  {v} {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ============================== CAMPANHA ============================== */}
      {s && (
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              [c.goals, String(s.goals), LIMA],
              [c.goalsAgainst, String(s.goalsAgainst), RUBRO],
              ["SG", (saldo > 0 ? "+" : "") + saldo, saldo >= 0 ? LIMA : RUBRO],
              [c.skillRating, s.skillRating != null ? String(s.skillRating) : "—", CIANO],
              [c.record, `${aproveitamento}%`, VIOLETA],
              [c.squadCols.games, String(s.gamesPlayed), "rgba(255,255,255,.75)"],
            ] as const
          ).map(([label, valor, cor]) => (
            <div key={label} className="rounded-2xl border p-4" style={superficie(LIMA)}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {label}
              </p>
              <p className="mt-1 text-2xl leading-none tabular-nums" style={{ ...bebas, color: cor }}>
                {valor}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* ============================== DIVISÃO ============================== */}
      {s && <PainelDivisao stats={s} tabela={dado.tabela} divisoes={dado.divisoes} copy={copy} />}

      {/* ============================== ELENCO ============================== */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex-1 text-2xl sm:text-3xl" style={bebas}>
            {c.squad.toUpperCase()}
          </h2>
          <div className="flex gap-2">
            {(
              [
                ["temporada", c.tabSeason],
                ["carreira", c.tabCareer],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setAba(valor)}
                aria-pressed={aba === valor}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
                style={
                  aba === valor
                    ? { background: LIMA, color: FUNDO, borderColor: LIMA }
                    : {
                        background: "rgba(255,255,255,.05)",
                        color: "rgba(255,255,255,.7)",
                        borderColor: "rgba(255,255,255,.12)",
                      }
                }
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {/*
            Elenco vazio tem DUAS causas diferentes, e dizer a errada é pior que
            não dizer nada: ou a EA não publicou elenco para o clube, ou o nosso
            acervo ainda só tem a linha de índice dele (identidade e campanha,
            sem captura funda). O segundo caso é temporário e tem conserto —
            então ele merece a própria frase.
          */}
          {dado.fonte === "espelho" && dado.members.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center text-sm leading-relaxed text-white/55">
              {c.mirrorShallow}
            </p>
          ) : aba === "temporada" ? (
            <TabelaElenco membros={dado.members} copy={copy} />
          ) : (
            <TabelaCarreira carreira={dado.career} copy={copy} />
          )}
        </div>

        {/* Reivindicação do jogador — o "então termos seu player". */}
        <ReivindicarJogador
          clubId={clubId}
          plataforma={dado.plataforma}
          membros={dado.members}
          copy={copy}
        />
      </section>

      {/* ============================== CALENDÁRIO ============================== */}
      <div className="mt-12">
        <CalendarioPartidas partidas={partidas} clubId={clubId} copy={copy} locale={locale} />
      </div>
    </div>
  );
}

/**
 * PAINEL DE DIVISÃO — o que um time de Clubs pergunta primeiro.
 *
 * Junta três fontes: a divisão atual e os pontos da temporada (índice de busca),
 * a campanha histórica (`overallStats`) e as regras da divisão (`settings`).
 * Com as três, a barra responde "faltam quantos pontos para subir" — que
 * nenhuma delas responde sozinha.
 */
function PainelDivisao({
  stats,
  tabela,
  divisoes,
  copy,
}: {
  stats: ClubOverallStats;
  tabela: ClubSearchResult | null;
  divisoes: DivisaoEA[];
  copy: GameCopy;
}) {
  const c = copy.club;
  const divAtual = tabela?.currentDivision ?? null;
  const regra = divAtual ? divisoes.find((d) => d.divisionId === divAtual) ?? null : null;

  return (
    <section className="mt-10">
      <h2 className="text-2xl sm:text-3xl" style={bebas}>
        {c.divisionTitle.toUpperCase()}
      </h2>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border p-5" style={superficie(CIANO)}>
          {/* `shrink-0` + `whitespace-nowrap` nos rótulos: sem eles, "MELHOR
              DIVISÃO" em caixa alta com tracking largo transbordava por cima da
              coluna vizinha e as duas legendas se fundiam numa só palavra. */}
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div className="shrink-0">
              <p className="whitespace-nowrap text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {c.divisionNow}
              </p>
              <p className="mt-0.5 text-4xl leading-none" style={{ ...bebas, color: CIANO }}>
                {divAtual ?? "—"}
              </p>
            </div>
            <div className="shrink-0">
              <p className="whitespace-nowrap text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {c.divisionBest}
              </p>
              <p className="mt-0.5 text-2xl leading-none" style={{ ...bebas, color: OURO }}>
                {stats.bestDivision ?? "—"}
              </p>
            </div>
          </div>

          {/*
            O que a divisão EXIGE — não onde o clube está nela.
            A EA publica um campo `points` no índice, e ele é tentador: daria a
            barra "faltam X para subir". Mas o número não fecha com nada
            (106 pontos para 73V/15E, numa divisão que titula com 15), e não há
            fonte que diga o que ele conta. Afirmar posição com ele seria
            inventar. Então a régua mostra os três limiares da divisão atual, que
            são fato publicado, e para aí.
          */}
          {regra ? (
            /*
              A régua das ZONAS da divisão — não um progresso. Cada faixa é uma
              consequência real da temporada de divisão: abaixo de `fica com` o
              clube cai, entre `fica` e `sobe` ele permanece, de `sobe` em diante
              ele é promovido, e no topo está o título. Uma barra só de limiares,
              sem essa leitura, seria enfeite; com ela, responde "o que cada
              número significa para mim".
            */
            <div className="mt-6">
              <div className="flex h-8 w-full overflow-hidden rounded-lg text-[9px] font-black uppercase tracking-wider">
                {(
                  [
                    [c.divisionZoneDrop, regra.pointsToHoldDivision, RUBRO],
                    [
                      c.divisionZoneHold,
                      regra.pointsForPromotion - regra.pointsToHoldDivision,
                      CINZA,
                    ],
                    [c.divisionZoneUp, regra.pointsToTitle - regra.pointsForPromotion, LIMA],
                  ] as const
                ).map(([rotulo, largura, cor]) => (
                  <span
                    key={rotulo}
                    className="flex items-center justify-center overflow-hidden whitespace-nowrap px-1"
                    style={{
                      width: `${(largura / regra.pointsToTitle) * 100}%`,
                      background: `${cor}24`,
                      color: cor,
                      borderRight: `1px solid ${cor}66`,
                    }}
                  >
                    {rotulo}
                  </span>
                ))}
              </div>
              {/* Os números que separam as faixas, alinhados às divisas. */}
              <div className="relative mt-1 h-4">
                {(
                  [
                    [regra.pointsToHoldDivision, CINZA, c.pointsToHold],
                    [regra.pointsForPromotion, LIMA, c.pointsToPromote],
                    [regra.pointsToTitle, OURO, c.pointsToTitle],
                  ] as const
                ).map(([v, cor, titulo]) => (
                  <span
                    key={titulo}
                    className="absolute -translate-x-1/2 text-[11px] font-black tabular-nums"
                    style={{ left: `${(v / regra.pointsToTitle) * 100}%`, color: cor }}
                    title={`${titulo}: ${v}`}
                  >
                    {v}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-bold">
                {(
                  [
                    [c.pointsToHold, regra.pointsToHoldDivision, CINZA],
                    [c.pointsToPromote, regra.pointsForPromotion, LIMA],
                    [c.pointsToTitle, regra.pointsToTitle, OURO],
                  ] as const
                ).map(([rotulo, v, cor]) => (
                  <span key={rotulo} className="inline-flex items-center gap-1.5" style={{ color: cor }}>
                    <span className="h-2 w-2 rounded-sm" style={{ background: cor }} />
                    {rotulo} <span className="tabular-nums">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[12px] leading-relaxed text-white/45">{c.divisionUnknown}</p>
          )}
        </div>

        {/* Os números de temporada que a campanha não mostra. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {(
            [
              [c.promotions, stats.promotions, LIMA, TrendingUp],
              [c.relegations, stats.relegations, RUBRO, TrendingDown],
              [c.winStreak, stats.winStreak, OURO, Flame],
              [c.unbeaten, stats.unbeatenStreak, CIANO, Flame],
              [c.playoffGames, stats.gamesPlayedPlayoff, VIOLETA, Users],
              [c.reputation, stats.reputationTier, "rgba(255,255,255,.75)", BadgeCheck],
            ] as const
          ).map(([label, v, cor, Icon]) => (
            <div key={label} className="rounded-2xl border p-3.5" style={superficie(CIANO)}>
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                <Icon size={11} style={{ color: cor }} />
                {label}
              </p>
              <p className="mt-1 text-xl leading-none tabular-nums" style={{ ...bebas, color: cor }}>
                {v ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Carreira: o acumulado que atravessa temporadas, ao lado da temporada atual. */
function TabelaCarreira({ carreira, copy }: { carreira: ClubMemberCareer[]; copy: GameCopy }) {
  const c = copy.club;
  if (carreira.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center text-sm text-white/55">
        {c.squadEmpty}
      </p>
    );
  }
  const ordenado = carreira
    .slice()
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || b.gamesPlayed - a.gamesPlayed);
  const max = Math.max(1, ...ordenado.map((m) => m.goals + m.assists));

  return (
    <div className="overflow-hidden rounded-3xl border" style={superficie(VIOLETA)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-widest text-white/55">
              <th className="py-3 pl-4 pr-2 text-left">{c.squadCols.player}</th>
              <th className="w-14 px-1 py-3 text-center">{c.squadCols.games}</th>
              <th className="w-12 px-1 py-3 text-center">{c.squadCols.goals}</th>
              <th className="w-12 px-1 py-3 text-center">{c.squadCols.assists}</th>
              <th className="w-14 px-1 py-3 text-center">{c.squadCols.motm}</th>
              <th className="w-14 px-1 py-3 text-center">{c.squadCols.rating}</th>
              <th className="px-2 py-3 pr-4 text-left">{c.squadCols.contribution}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {ordenado.map((m) => {
              const setor = setorDaPosicao(m.favoritePosition);
              const ga = m.goals + m.assists;
              return (
                <tr key={m.name} className="border-t border-white/[0.06]">
                  <td className="py-2.5 pl-4 pr-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-8 shrink-0 rounded px-1 text-center text-[9px] font-black"
                        style={{ background: `${corSetor(setor)}1c`, color: corSetor(setor) }}
                      >
                        {setor}
                      </span>
                      <span className="truncate font-semibold text-white/90">{m.name}</span>
                    </span>
                  </td>
                  <td className="px-1 py-2.5 text-center text-white/70">{m.gamesPlayed}</td>
                  <td className="px-1 py-2.5 text-center font-bold" style={{ color: OURO }}>
                    {m.goals}
                  </td>
                  <td className="px-1 py-2.5 text-center" style={{ color: LIMA }}>
                    {m.assists}
                  </td>
                  <td className="px-1 py-2.5 text-center text-white/70">{m.manOfTheMatch}</td>
                  <td className="px-1 py-2.5 text-center">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-[12px] font-black"
                      style={{ color: corNota(m.ratingAve), background: `${corNota(m.ratingAve)}16` }}
                    >
                      {m.ratingAve != null ? m.ratingAve.toFixed(1) : "—"}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 pr-4">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${(ga / max) * 100}%`, background: VIOLETA }}
                        />
                      </span>
                      <span className="w-8 text-right text-[12px] font-bold text-white/75">{ga}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] text-white/45">
        {c.careerNote}
      </p>
    </div>
  );
}

/**
 * "Qual desses é você?" — liga a gamertag do elenco à conta FayAI.
 *
 * A lista vem do elenco que a EA publica, então não existe campo de texto livre
 * onde alguém digite um nome inventado. Não é prova de posse (a Fase 1 traz o
 * código de verificação), mas já é o suficiente para a estatística individual
 * começar a seguir a pessoa — que é o que faltava para a plataforma conhecer
 * JOGADORES, e não só clubes.
 */
function ReivindicarJogador({
  clubId,
  plataforma,
  membros,
  copy,
}: {
  clubId: string;
  plataforma: EaPlatform;
  membros: ClubMemberStats[];
  copy: GameCopy;
}) {
  const c = copy.club;
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "login" | "erro">("idle");

  if (membros.length === 0) return null;

  async function reivindicar() {
    if (!escolhido || estado === "enviando") return;
    setEstado("enviando");
    const res = await fetch("/api/game/jogador/vincular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eaClubId: clubId, gamertag: escolhido, plataforma }),
    }).catch(() => null);
    if (res?.ok) setEstado("ok");
    else if (res?.status === 401) setEstado("login");
    else setEstado("erro");
  }

  return (
    <div className="mt-6 rounded-3xl border p-5 sm:p-6" style={superficie(OURO)}>
      <h3 className="flex items-center gap-2 text-xl sm:text-2xl" style={bebas}>
        <UserCheck size={18} style={{ color: OURO }} />
        {c.claimTitle.toUpperCase()}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{c.claimSubtitle}</p>

      {estado === "ok" ? (
        <p
          className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold"
          style={{ borderColor: `${LIMA}55`, color: LIMA, background: `${LIMA}12` }}
        >
          <BadgeCheck size={15} />
          {c.claimed} — {escolhido}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {membros.map((m) => {
              const ativo = escolhido === m.name;
              const setor = setorDaPosicao(m.favoritePosition);
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setEscolhido(m.name)}
                  aria-pressed={ativo}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-transform hover:-translate-y-0.5"
                  style={
                    ativo
                      ? { borderColor: OURO, background: `${OURO}18` }
                      : { borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)" }
                  }
                >
                  <span
                    className="inline-block w-8 shrink-0 rounded px-1 text-center text-[9px] font-black"
                    style={{ background: `${corSetor(setor)}1c`, color: corSetor(setor) }}
                  >
                    {setor}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-white/90">
                      {m.name}
                    </span>
                    <span className="block text-[10px] font-semibold text-white/45">
                      {m.proName ?? "—"}
                      {m.proOverall != null && (
                        <span style={{ color: OURO }}> · {c.colOverall} {m.proOverall}</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reivindicar}
              disabled={!escolhido || estado === "enviando"}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
              style={{ background: OURO, color: FUNDO }}
            >
              {estado === "enviando" && <Loader2 size={14} className="animate-spin" />}
              {estado === "enviando" ? c.claiming : c.claimButton}
            </button>
            {!escolhido && <span className="text-[12px] text-white/45">{c.claimPick}</span>}
            {estado === "login" && (
              <Link href="/login" className="text-[12px] font-bold" style={{ color: OURO }}>
                {c.claimLogin}
              </Link>
            )}
            {estado === "erro" && (
              <span className="text-[12px] font-semibold" style={{ color: RUBRO }}>
                {copy.join.error}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
