"use client";

import { CalendarDays, Flag, CircleDot } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import { LIMA, VIOLETA, bebas, superficie } from "@/lib/game/tema";

/**
 * CALENDÁRIO DE TEMPORADA (23/08/2026).
 *
 * Substitui a lista `<ol>` vertical que servia de "roadmap". Um roadmap em
 * lista responde "o que vem depois"; um calendário responde "QUANDO" — que é a
 * pergunta de quem quer entrar na liga. As fases viram barras sobre uma régua
 * de meses, com o lançamento do FC 27 (25/09) marcado como a linha que corta
 * tudo, porque é a data que governa o cronograma inteiro.
 *
 * Em desktop é uma régua horizontal (mês × fase). Em mobile a régua não cabe
 * sem virar rolagem lateral de 900px, então vira uma coluna de cartões com o
 * mês em chip — mesmo conteúdo, mesma ordem, sem estouro (barra C7).
 */

const COR_STATUS: Record<"done" | "now" | "next", string> = {
  done: "rgba(255,255,255,.45)",
  now: LIMA,
  next: VIOLETA,
};

export function CalendarioTemporada({ copy }: { copy: GameCopy }) {
  const { roadmap } = copy;
  const meses = roadmap.months;
  /** O mês do pontapé inicial. A régua inteira se organiza em torno dele. */
  const iKickoff = 1;

  return (
    <section id="calendario" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-2xl sm:text-3xl" style={bebas}>
          {roadmap.title.toUpperCase()}
        </h2>
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: LIMA }}
        >
          <CalendarDays size={13} /> {roadmap.monthsLabel}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{roadmap.subtitle}</p>

      {/* ---------------- Desktop: régua mês × fase ---------------- */}
      {/* Sem moldura, de propósito. Busca, "como funciona", tabela e formulário
          já são cartões de borda arredondada; enfileirar um quinto fazia a
          página inteira virar a mesma caixa repetida — a queixa original do
          Ricardo. Aqui a régua encosta na página, separada só por fios. */}
      <div className="mt-7 hidden md:block">
        <div className="relative pt-1">
          {/* Cabeçalho de meses */}
          <div
            className="grid gap-px text-[11px] font-extrabold uppercase tracking-widest"
            style={{ gridTemplateColumns: `260px repeat(${meses.length}, minmax(0,1fr))` }}
          >
            <div />
            {meses.map((m, i) => (
              <div
                key={m}
                className="px-2 pb-2 text-center"
                style={{ color: i === iKickoff ? "#ffffff" : "rgba(255,255,255,.45)" }}
              >
                {m}
              </div>
            ))}
          </div>

          {/* Corpo da régua */}
          <div className="relative">
            {/* A linha do pontapé inicial atravessa todas as fases. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-10"
              style={{
                left: `calc(260px + (100% - 260px) * ${(iKickoff + 0.5) / meses.length})`,
                width: 2,
                background: "linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,255,255,.12))",
              }}
            />

            {roadmap.phases.map((f) => {
              const cor = COR_STATUS[f.status];
              return (
                <div
                  key={f.period}
                  className="grid items-stretch gap-px border-t border-white/[0.07] py-3 first:border-t-0"
                  style={{ gridTemplateColumns: `260px repeat(${meses.length}, minmax(0,1fr))` }}
                >
                  {/* Rótulo da fase — e a descrição, que antes vivia numa
                      segunda grade de cartões logo abaixo repetindo período e
                      título palavra por palavra. Duas contagens da mesma
                      história, uma embaixo da outra, inflando a rolagem sem
                      acrescentar informação. Agora a régua é o único bloco. */}
                  <div className="pr-5">
                    <p
                      className="text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ color: cor }}
                    >
                      {f.period}
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold leading-tight text-white">
                      {f.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-white/50">{f.text}</p>
                  </div>

                  {/* As colunas de mês. A barra ocupa de `from` a `to`. */}
                  {meses.map((m, i) => {
                    const dentro = i >= f.from && i <= f.to;
                    const inicio = i === f.from;
                    const fim = i === f.to;
                    return (
                      <div key={m} className="relative flex items-center px-px">
                        {dentro && (
                          <div
                            className="relative h-9 w-full"
                            style={{
                              background:
                                f.status === "now"
                                  ? `linear-gradient(90deg, ${cor}3a, ${cor}22)`
                                  : `${cor}1c`,
                              borderTop: `1px solid ${cor}55`,
                              borderBottom: `1px solid ${cor}55`,
                              borderLeft: inicio ? `2px solid ${cor}` : undefined,
                              borderRight: fim ? `1px solid ${cor}55` : undefined,
                              borderTopLeftRadius: inicio ? 8 : 0,
                              borderBottomLeftRadius: inicio ? 8 : 0,
                              borderTopRightRadius: fim ? 8 : 0,
                              borderBottomRightRadius: fim ? 8 : 0,
                            }}
                          >
                            {inicio && f.status === "now" && (
                              <span
                                aria-hidden
                                className="fx-float absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                                style={{ background: cor, boxShadow: `0 0 10px ${cor}` }}
                              />
                            )}
                          </div>
                        )}

                        {/* Marcos: o ponto e a etiqueta da data. */}
                        {f.marks
                          ?.filter(() => i === f.from)
                          .map((mk) => (
                            <span
                              key={mk.label}
                              className="absolute inset-x-0 bottom-full z-20 mb-0.5 truncate px-1 text-center text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: `${cor}` }}
                              title={`${mk.day} · ${mk.label}`}
                            >
                              {mk.label}
                            </span>
                          ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legenda do pontapé inicial */}
          <p
            className="mt-3 inline-flex items-center gap-1.5 border-t border-white/[0.07] pt-3 text-[11px] font-semibold text-white/80"
          >
            <Flag size={12} />
            {roadmap.kickoff.date} · {roadmap.kickoff.note}
          </p>
        </div>
      </div>

      {/* ---------------- Mobile: coluna de cartões ---------------- */}
      <ol className="mt-6 space-y-3 md:hidden">
        {roadmap.phases.map((f) => {
          const cor = COR_STATUS[f.status];
          return (
            <li key={f.period} className="rounded-2xl border p-4" style={superficie(cor)}>
              <div className="flex items-center gap-2">
                <CircleDot size={13} style={{ color: cor }} />
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest"
                  style={{ color: cor }}
                >
                  {f.period}
                </span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  {roadmap.statusLabel[f.status]}
                </span>
              </div>
              <h3 className="mt-1.5 text-base font-bold leading-tight">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{f.text}</p>
              {f.marks && f.marks.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {f.marks.map((mk) => (
                    <span
                      key={mk.label}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${cor}1f`, color: cor, border: `1px solid ${cor}44` }}
                    >
                      {mk.day} · {mk.label}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

    </section>
  );
}
