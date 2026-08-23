"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Crown, Star } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import type { ClubMemberStats } from "@/lib/game/ea-api";
import { LIMA, OURO, CIANO, VIOLETA, bebas, corNota, corSetor, setorDaPosicao, superficie, FUNDO } from "@/lib/game/tema";

/**
 * TABELA DE ELENCO (23/08/2026) — substitui o `<table>` cru da v1.
 *
 * O que a v1 fazia de errado: sete colunas de número solto, `min-w-640px` que
 * virava rolagem lateral no celular, e nenhuma comparação — 12 gols é muito ou
 * pouco? A tabela não respondia, e é a única pergunta que o olho faz.
 *
 * O que mudou:
 *  - Cada célula numérica ganha uma BARRA proporcional ao melhor do elenco,
 *    então a comparação é pré-atenta: você vê quem carrega o time antes de ler.
 *  - Ordenação por qualquer coluna (o padrão continua sendo jogos disputados).
 *  - Setor (GOL/DEF/MEI/ATA) com cor, porque "posição" na EA vem em formatos
 *    inconsistentes e ninguém decora `cdm`.
 *  - Coroa no artilheiro e estrela na melhor nota — o OURO da §3, que só entra
 *    onde existe recompensa de verdade.
 *  - Em mobile a tabela vira cartão por jogador: mesma informação, zero
 *    rolagem horizontal.
 */

type Coluna = "name" | "gamesPlayed" | "goals" | "assists" | "contribution" | "ratingAve" | "manOfTheMatch" | "passSuccessRate" | "shotSuccessRate" | "tackleSuccessRate";

const contribuicao = (m: ClubMemberStats) => m.goals + m.assists;

function valor(m: ClubMemberStats, c: Coluna): number {
  if (c === "contribution") return contribuicao(m);
  if (c === "name") return 0;
  return (m[c] as number | null) ?? -1;
}

/** Barra de fundo proporcional ao melhor valor da coluna. */
function Barra({ v, max, cor }: { v: number; max: number; cor: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  return (
    <span
      aria-hidden
      className="absolute inset-y-1 left-1 rounded-[3px] transition-[width] duration-500"
      style={{ width: `calc(${pct}% - 8px)`, background: `${cor}1f` }}
    />
  );
}

export function TabelaElenco({ membros, copy }: { membros: ClubMemberStats[]; copy: GameCopy }) {
  const [ordem, setOrdem] = useState<Coluna>("gamesPlayed");
  const [desc, setDesc] = useState(true);
  const c = copy.club;

  const ordenado = useMemo(() => {
    const arr = membros.slice();
    arr.sort((a, b) => {
      if (ordem === "name") return desc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      const d = valor(b, ordem) - valor(a, ordem);
      return desc ? d : -d;
    });
    return arr;
  }, [membros, ordem, desc]);

  /** Máximos da coluna — a régua das barras. */
  const max = useMemo(
    () => ({
      gamesPlayed: Math.max(1, ...membros.map((m) => m.gamesPlayed)),
      goals: Math.max(1, ...membros.map((m) => m.goals)),
      assists: Math.max(1, ...membros.map((m) => m.assists)),
      contribution: Math.max(1, ...membros.map(contribuicao)),
      manOfTheMatch: Math.max(1, ...membros.map((m) => m.manOfTheMatch)),
    }),
    [membros]
  );

  /** Os dois destaques que ganham símbolo de recompensa. */
  const artilheiro = useMemo(
    () => membros.reduce<ClubMemberStats | null>((a, m) => (m.goals > 0 && (!a || m.goals > a.goals) ? m : a), null),
    [membros]
  );
  const melhorNota = useMemo(
    () =>
      membros.reduce<ClubMemberStats | null>(
        (a, m) => (m.ratingAve != null && m.gamesPlayed >= 3 && (!a || m.ratingAve > (a.ratingAve ?? 0)) ? m : a),
        null
      ),
    [membros]
  );

  if (membros.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center text-sm text-white/50">
        {c.squadEmpty}
      </div>
    );
  }

  function clicar(col: Coluna) {
    if (col === ordem) setDesc((d) => !d);
    else {
      setOrdem(col);
      setDesc(true);
    }
  }

  /** Cabeçalho clicável com a seta do sentido corrente. */
  function Th({ col, label, largura, oculta }: { col: Coluna; label: string; largura: string; oculta?: string }) {
    const ativa = ordem === col;
    return (
      <th className={`${largura} ${oculta ?? ""} px-1 py-0`}>
        <button
          type="button"
          onClick={() => clicar(col)}
          aria-sort={ativa ? (desc ? "descending" : "ascending") : "none"}
          className="flex w-full items-center justify-center gap-1 px-1 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-colors hover:text-white"
          style={{ color: ativa ? LIMA : "rgba(255,255,255,.55)" }}
        >
          {label}
          {ativa && (desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
        </button>
      </th>
    );
  }

  return (
    <div>
      {/* ---------------- Desktop ---------------- */}
      <div className="hidden overflow-hidden rounded-3xl border sm:block" style={superficie(LIMA)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04]">
              <tr>
                <th className="w-8 py-3 pl-4 text-center text-[10px] font-extrabold uppercase tracking-widest text-white/40">
                  #
                </th>
                <th className="py-0 pl-2 pr-3 text-left">
                  <button
                    type="button"
                    onClick={() => clicar("name")}
                    className="flex items-center gap-1 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-colors hover:text-white"
                    style={{ color: ordem === "name" ? LIMA : "rgba(255,255,255,.55)" }}
                  >
                    {c.squadCols.player}
                    {ordem === "name" && (desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                  </button>
                </th>
                <Th col="gamesPlayed" label={c.squadCols.games} largura="w-16" />
                <Th col="goals" label={c.squadCols.goals} largura="w-16" />
                <Th col="assists" label={c.squadCols.assists} largura="w-16" />
                <Th col="contribution" label={c.squadCols.contribution} largura="w-16" oculta="hidden lg:table-cell" />
                <Th col="passSuccessRate" label={c.squadCols.passes} largura="w-[68px]" oculta="hidden lg:table-cell" />
                <Th col="shotSuccessRate" label={c.squadCols.shots} largura="w-[68px]" oculta="hidden xl:table-cell" />
                <Th col="manOfTheMatch" label={c.squadCols.motm} largura="w-16" />
                <Th col="ratingAve" label={c.squadCols.rating} largura="w-[76px]" />
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {ordenado.map((m, i) => {
                const setor = setorDaPosicao(m.favoritePosition);
                const corS = corSetor(setor);
                const ehArtilheiro = artilheiro?.name === m.name;
                const ehCraque = melhorNota?.name === m.name;
                return (
                  <tr key={m.name} className="group border-t border-white/[0.06] transition-colors hover:bg-white/[0.035]">
                    <td className="py-2.5 pl-4 text-center text-[11px] font-bold text-white/30">{i + 1}</td>
                    <td className="py-2.5 pl-2 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-9 shrink-0 rounded-md py-0.5 text-center text-[9px] font-extrabold tracking-wider"
                          style={{ background: `${corS}1f`, color: corS, border: `1px solid ${corS}3a` }}
                          title={setor === "—" ? undefined : c.sectors[setor]}
                        >
                          {setor}
                        </span>
                        <span className="truncate font-semibold text-white/90">{m.name}</span>
                        {ehArtilheiro && (
                          <Crown size={13} className="shrink-0" style={{ color: OURO }} aria-label={c.topScorer} />
                        )}
                        {ehCraque && !ehArtilheiro && (
                          <Star size={12} className="shrink-0" style={{ color: OURO }} aria-label={c.squadCols.rating} />
                        )}
                      </div>
                    </td>

                    {(
                      [
                        ["gamesPlayed", m.gamesPlayed, max.gamesPlayed, "rgba(255,255,255,.5)", ""],
                        ["goals", m.goals, max.goals, LIMA, ""],
                        ["assists", m.assists, max.assists, VIOLETA, ""],
                        ["contribution", contribuicao(m), max.contribution, CIANO, "hidden lg:table-cell"],
                      ] as const
                    ).map(([chave, v, mx, cor, oculta]) => (
                      <td key={chave} className={`relative px-1 py-2.5 text-center ${oculta}`}>
                        <Barra v={v} max={mx} cor={cor} />
                        <span className="relative font-semibold" style={{ color: v > 0 ? "#e8e6f5" : "rgba(255,255,255,.28)" }}>
                          {v}
                        </span>
                      </td>
                    ))}

                    <td className="hidden px-1 py-2.5 text-center lg:table-cell">
                      <Percentual v={m.passSuccessRate} />
                    </td>
                    <td className="hidden px-1 py-2.5 text-center xl:table-cell">
                      <Percentual v={m.shotSuccessRate} />
                    </td>
                    <td className="relative px-1 py-2.5 text-center">
                      <Barra v={m.manOfTheMatch} max={max.manOfTheMatch} cor={OURO} />
                      <span
                        className="relative font-semibold"
                        style={{ color: m.manOfTheMatch > 0 ? OURO : "rgba(255,255,255,.28)" }}
                      >
                        {m.manOfTheMatch}
                      </span>
                    </td>
                    <td className="px-1 py-2.5 text-center">
                      <span
                        className="inline-block min-w-[46px] rounded-md py-1 text-[13px] font-black tabular-nums"
                        style={{
                          color: corNota(m.ratingAve),
                          background: m.ratingAve != null ? `${corNota(m.ratingAve)}14` : "transparent",
                        }}
                      >
                        {m.ratingAve != null ? m.ratingAve.toFixed(2) : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-[11px] text-white/45">
          {c.squadNote}
        </p>
      </div>

      {/* ---------------- Mobile: cartão por jogador ---------------- */}
      <div className="sm:hidden">
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest text-white/40">
            {c.sortHint}
          </span>
          {(
            [
              ["gamesPlayed", c.squadCols.games],
              ["goals", c.squadCols.goals],
              ["assists", c.squadCols.assists],
              ["ratingAve", c.squadCols.rating],
            ] as const
          ).map(([col, label]) => (
            <button
              key={col}
              type="button"
              onClick={() => clicar(col)}
              className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors"
              style={
                ordem === col
                  ? { background: LIMA, color: FUNDO, borderColor: LIMA }
                  : { background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.7)", borderColor: "rgba(255,255,255,.12)" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {ordenado.map((m, i) => {
            const setor = setorDaPosicao(m.favoritePosition);
            const corS = corSetor(setor);
            return (
              <li key={m.name} className="rounded-2xl border p-3" style={superficie(LIMA)}>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 shrink-0 text-[11px] font-bold text-white/30">{i + 1}</span>
                  <span
                    className="w-9 shrink-0 rounded-md py-0.5 text-center text-[9px] font-extrabold tracking-wider"
                    style={{ background: `${corS}1f`, color: corS, border: `1px solid ${corS}3a` }}
                  >
                    {setor}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{m.name}</span>
                  {artilheiro?.name === m.name && <Crown size={13} style={{ color: OURO }} />}
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[13px] font-black tabular-nums"
                    style={{
                      color: corNota(m.ratingAve),
                      background: m.ratingAve != null ? `${corNota(m.ratingAve)}14` : "transparent",
                    }}
                  >
                    {m.ratingAve != null ? m.ratingAve.toFixed(2) : "—"}
                  </span>
                </div>
                <dl className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
                  {(
                    [
                      [c.squadCols.games, m.gamesPlayed, "rgba(255,255,255,.75)"],
                      [c.squadCols.goals, m.goals, LIMA],
                      [c.squadCols.assists, m.assists, VIOLETA],
                      [c.squadCols.motm, m.manOfTheMatch, OURO],
                    ] as const
                  ).map(([label, v, cor]) => (
                    <div key={label} className="rounded-lg bg-white/[0.04] py-1.5">
                      <dt className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">
                        {label}
                      </dt>
                      <dd
                        className="text-sm font-bold tabular-nums"
                        style={{ color: v > 0 ? cor : "rgba(255,255,255,.3)" }}
                      >
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Percentual da EA: vem 0–100, e ausente vira traço, nunca zero. */
function Percentual({ v }: { v: number | null }) {
  if (v == null) return <span className="text-white/25">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="h-1 w-8 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: LIMA }}
        />
      </span>
      <span className="text-[11px] font-semibold text-white/70">{Math.round(v)}</span>
    </span>
  );
}
