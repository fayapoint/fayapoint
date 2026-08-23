"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Shield, BadgeCheck, ArrowLeft, Loader2, AlertTriangle, Crown, Award } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import type { ClubMatch, ClubMemberStats, ClubOverallStats, MatchType } from "@/lib/game/ea-api";
import { TabelaElenco } from "./TabelaElenco";
import { LIMA, OURO, RUBRO, CINZA, CIANO, VIOLETA, bebas, corNota, corResultado, superficie, FUNDO } from "@/lib/game/tema";

interface ClubePayload {
  info: { clubId: string; name: string } | null;
  stats: ClubOverallStats | null;
  members: ClubMemberStats[];
  capturedAt: string;
}

/**
 * CENTRAL DO CLUBE — reconstruída em 23/08/2026.
 *
 * É a página que prova a tese da seção: o dado do time do usuário entra na
 * plataforma sem senha e sem instalação. Por isso ela precisa PARECER um painel
 * de estatística de e-sports (a referência é PROCLUBS.IO/FUTBIN), não um
 * formulário com números soltos — que era o defeito da v1.
 *
 * O que mudou: cabeçalho com escudo e aproveitamento, faixa de campanha com
 * barra V/E/D proporcional, strip de forma das últimas partidas, elenco na
 * `TabelaElenco` (ordenável, com barras e mobile em cartão), e placar de
 * partida com destaque de craque em vez de uma linha de texto com emojis.
 */
export function ClubeHub({ clubId, copy }: { clubId: string; copy: GameCopy }) {
  const [dado, setDado] = useState<ClubePayload | null | "erro">(null);
  const [partidas, setPartidas] = useState<ClubMatch[] | null>(null);
  const [tipo, setTipo] = useState<MatchType>("leagueMatch");
  const [vinculo, setVinculo] = useState<"idle" | "enviando" | "ok" | "login">("idle");

  useEffect(() => {
    fetch(`/api/game/ea/clube/${clubId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setDado)
      .catch(() => setDado("erro"));
  }, [clubId]);

  useEffect(() => {
    setPartidas(null);
    fetch(`/api/game/ea/clube/${clubId}/partidas?tipo=${tipo}`)
      .then((r) => r.json())
      .then((d) => setPartidas(Array.isArray(d.matches) ? d.matches : []))
      .catch(() => setPartidas([]));
  }, [clubId, tipo]);

  /** A forma recente sai das partidas carregadas, da mais nova para a mais velha. */
  const forma = useMemo(() => {
    if (!partidas) return [];
    return partidas
      .slice(0, 6)
      .map((p) => p.clubs.find((c) => c.clubId === clubId)?.result)
      .filter((r): r is "win" | "draw" | "loss" => Boolean(r));
  }, [partidas, clubId]);

  async function vincular() {
    if (vinculo === "enviando") return;
    setVinculo("enviando");
    const res = await fetch("/api/game/clube/vincular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eaClubId: clubId }),
    }).catch(() => null);
    if (res?.ok) setVinculo("ok");
    else if (res?.status === 401) setVinculo("login");
    else setVinculo("idle");
  }

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
      <header className="relative mt-4 overflow-hidden rounded-3xl border p-5 sm:p-7" style={superficie(LIMA, "forte")}>
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
              {forma.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
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
                </span>
              )}
            </div>
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
              [
                c.squadCols.games,
                String(s.gamesPlayed),
                "rgba(255,255,255,.75)",
              ],
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

      {/* ============================== ELENCO ============================== */}
      <section className="mt-12">
        <h2 className="text-2xl sm:text-3xl" style={bebas}>
          {c.squad.toUpperCase()}
        </h2>
        <div className="mt-4">
          <TabelaElenco membros={dado.members} copy={copy} />
        </div>
      </section>

      {/* ============================== PARTIDAS ============================== */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex-1 text-2xl sm:text-3xl" style={bebas}>
            {c.matches.toUpperCase()}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(c.matchTypes) as MatchType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
                style={
                  tipo === t
                    ? { background: LIMA, color: FUNDO, borderColor: LIMA }
                    : {
                        background: "rgba(255,255,255,.05)",
                        color: "rgba(255,255,255,.7)",
                        borderColor: "rgba(255,255,255,.12)",
                      }
                }
              >
                {c.matchTypes[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {partidas === null && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] py-10 text-sm text-white/50">
              <Loader2 size={15} className="animate-spin" />
              {c.loading}
            </div>
          )}
          {partidas?.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center text-sm text-white/55">
              {c.matchesEmpty}
            </p>
          )}
          {partidas?.map((p) => (
            <CartaoPartida key={p.matchId} partida={p} clubId={clubId} copy={copy} />
          ))}
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-white/45">{c.sourceNote}</p>
      </section>
    </div>
  );
}

/** Placar de uma partida: resultado, escaladores e o craque do jogo. */
function CartaoPartida({
  partida,
  clubId,
  copy,
}: {
  partida: ClubMatch;
  clubId: string;
  copy: GameCopy;
}) {
  const nos = partida.clubs.find((x) => x.clubId === clubId);
  const eles = partida.clubs.find((x) => x.clubId !== clubId);
  if (!nos || !eles) return null;

  const cor = corResultado(nos.result);
  const c = copy.club;
  /** O craque: o MOM declarado pela EA, ou a maior nota como suplente. */
  const craque =
    nos.players.find((j) => j.mom) ??
    nos.players.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
  const artilheiros = nos.players.filter((j) => j.goals > 0).sort((a, b) => b.goals - a.goals);

  return (
    <article className="overflow-hidden rounded-2xl border" style={superficie(cor)}>
      {/* Faixa de resultado à esquerda + placar */}
      <div className="flex items-stretch">
        <span aria-hidden className="w-1 shrink-0" style={{ background: cor }} />
        <div className="flex flex-1 items-center gap-3 px-4 py-3.5 sm:gap-5">
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

      {/* Quem fez o jogo acontecer */}
      {(artilheiros.length > 0 || craque) && (
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
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px]">
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
        </div>
      )}
    </article>
  );
}
