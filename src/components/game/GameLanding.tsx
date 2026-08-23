"use client";

import { Trophy, Database, Brain, ArrowRightLeft, Target, ShieldCheck, ArrowDown } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import { BuscaClube } from "./BuscaClube";
import { FormInteresse } from "./FormInteresse";
import { CalendarioTemporada } from "./CalendarioTemporada";
import { TabelaClassificacao } from "./TabelaClassificacao";
import { LIMA, OURO, CIANO, VIOLETA, ROSA, LARANJA, FUNDO, bebas, superficie, TEXTO } from "@/lib/game/tema";

/**
 * Landing da seção /game (Winners 22 Championship) — 23/08/2026.
 *
 * A v1 era um empilhamento de seis blocos `rounded-2xl border-white/10`
 * idênticos, separados por `mt-24` iguais, num verde `#07120c` que não existe
 * no sistema da casa. Parecia um site diferente colado dentro do fayai.com.br.
 *
 * Esta versão obedece `IDENTIDADE_VISUAL.md`: fundo navy `#0c0e1d`, cor de
 * contexto lima (§2, "Visão de Jogo"), ouro só onde há recompensa, display em
 * Bebas caixa-alta, superfícies `.glass` e a atmosfera de orbes `fx-*`.
 *
 * Ganhou o que o Ricardo cobrou e não existia: CALENDÁRIO de temporada e
 * TABELA de classificação (prévia honesta do formato, sem clube inventado).
 */

const PILLAR_ICONS = [Trophy, Database, Brain, ArrowRightLeft, Target, ShieldCheck];
/**
 * Só cores de CATEGORIA (§2). O ouro ficou de fora de propósito: aqui ele
 * cairia no primeiro pilar por ser o índice zero do array, não por significar
 * recompensa — que é exatamente o uso decorativo que a §8 proíbe.
 */
const PILLAR_CORES = [LIMA, CIANO, VIOLETA, ROSA, LARANJA];

export function GameLanding({ copy, locale }: { copy: GameCopy; locale: string }) {
  return (
    <main
      className="min-h-dvh overflow-x-clip px-4 pb-20 pt-24 sm:px-8 sm:pt-28"
      style={{ background: FUNDO, color: TEXTO }}
    >
      {/* ============================== HERÓI ============================== */}
      <section className="relative">
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 420,
            height: 420,
            left: "12%",
            top: -120,
            background: `radial-gradient(circle, ${LIMA}30, transparent 65%)`,
            animation: "fx-drift-a 13s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 320,
            height: 320,
            right: "10%",
            top: -40,
            background: `radial-gradient(circle, ${VIOLETA}47, transparent 65%)`,
            animation: "fx-drift-b 16s ease-in-out infinite",
          }}
        />
        {/* As linhas do campo: a única "textura" da página, discreta o bastante
            para não competir com o texto (opacidade .05). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.055]"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent 0 78px, rgba(255,255,255,.9) 78px 79px)",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,.8), transparent 85%)",
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,.8), transparent 85%)",
          }}
        />

        <header className="relative mx-auto max-w-3xl text-center">
          <p
            className="text-[11px] font-extrabold uppercase tracking-[0.28em]"
            style={{ color: LIMA }}
          >
            {copy.tagline}
          </p>
          {/* Letreiro em duas linhas. "Winners 22 Championship" numa linha só,
              em Bebas a 7rem, quebra feio e some no celular; separado, a
              primeira linha vira o nome que se grita e a segunda o qualificador
              — que é como todo escudo de campeonato se organiza. */}
          <h1 className="mt-4" style={bebas}>
            <span
              className="block text-[3.6rem] leading-[0.88] sm:text-[6.4rem]"
              style={{
                letterSpacing: "0.02em",
                background: `linear-gradient(180deg, #ffffff 20%, ${LIMA})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {copy.brandShort}
            </span>
            <span
              className="mt-1 block text-[1.35rem] sm:text-[2.3rem]"
              style={{ letterSpacing: "0.42em", color: `${LIMA}d9`, textIndent: "0.42em" }}
            >
              {copy.brandLine2}
            </span>
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-xl font-bold leading-tight text-white/95 sm:text-3xl">
            {copy.heroTitle}
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-base">
            {copy.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#buscar"
              className="rounded-xl px-8 py-4 font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: LIMA, color: FUNDO, boxShadow: `0 12px 34px -14px ${LIMA}` }}
            >
              {copy.heroCtaSearch}
            </a>
            <a
              href="#piloto"
              className="rounded-xl border border-white/18 px-8 py-4 font-semibold text-white/90 transition-colors hover:border-white/40 hover:bg-white/[0.04]"
            >
              {copy.heroCtaJoin}
            </a>
          </div>

          {/* Três fatos, não três promessas — todos verificáveis na própria página. */}
          <dl className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
            {copy.showcase.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border py-3" style={superficie(LIMA)}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-2xl leading-none" style={{ ...bebas, color: LIMA }}>
                    {s.value}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </header>
      </section>

      {/* ============================== BUSCA ============================== */}
      <section className="relative mx-auto mt-20 max-w-3xl">
        <div className="rounded-3xl border p-5 sm:p-7" style={superficie(LIMA, "forte")}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl sm:text-3xl" style={bebas}>
              {copy.search.title.toUpperCase()}
            </h2>
            <ArrowDown size={14} className="text-white/30" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{copy.search.subtitle}</p>
          <div className="mt-5">
            <BuscaClube copy={copy} />
          </div>
        </div>
      </section>

      {/* ============================== COMO FUNCIONA ============================== */}
      <section className="relative mx-auto mt-24 max-w-5xl">
        <h2 className="text-center text-2xl sm:text-3xl" style={bebas}>
          {copy.how.title.toUpperCase()}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.how.steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border p-6" style={superficie(LIMA)}>
              {/* O número é o herói do card, em marca-d'água. */}
              <span
                aria-hidden
                className="absolute right-4 top-1 select-none text-6xl leading-none"
                style={{ ...bebas, color: `${LIMA}1a` }}
              >
                {i + 1}
              </span>
              <h3 className="relative text-lg font-bold" style={{ color: LIMA }}>
                {s.title.replace(/^\d+\s*·\s*/, "")}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/60">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================== PILARES ============================== */}
      <section className="relative mx-auto mt-24 max-w-5xl">
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 300,
            height: 300,
            right: "4%",
            top: -60,
            background: `radial-gradient(circle, ${CIANO}3d, transparent 65%)`,
            animation: "fx-drift-b 15s ease-in-out infinite",
          }}
        />
        <h2 className="relative text-center text-2xl sm:text-3xl" style={bebas}>
          {copy.pillars.title.toUpperCase()}
        </h2>
        {/* Lista densa, NÃO uma segunda grade de cartões.
            "Como funciona" logo acima já é uma fileira de cartões com ícone,
            título e parágrafo; repetir o mesmo objeto seis vezes aqui embaixo
            era exatamente o empilhamento de blocos idênticos que o Ricardo
            chamou de feio. Aqui o peso cai: sem borda, sem sombra, separação
            por régua — o olho lê como índice do que vem, não como seis ofertas. */}
        <div className="relative mt-8 grid gap-x-8 sm:grid-cols-2">
          {copy.pillars.items.map((p, i) => {
            const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
            const cor = PILLAR_CORES[i % PILLAR_CORES.length];
            return (
              <div
                key={p.title}
                className="flex gap-3.5 border-t border-white/[0.07] py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
              >
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${cor}16`, border: `1px solid ${cor}33` }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: cor }} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold leading-tight">{p.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/60">{p.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================== CALENDÁRIO ============================== */}
      <div className="relative mx-auto mt-24 max-w-5xl">
        <CalendarioTemporada copy={copy} />
      </div>

      {/* ============================== TABELA ============================== */}
      <div className="relative mx-auto mt-24 max-w-5xl">
        <TabelaClassificacao copy={copy} />
      </div>

      {/* ============================== FILA DO PILOTO ============================== */}
      <section className="relative mx-auto mt-24 max-w-3xl">
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 340,
            height: 340,
            left: "20%",
            top: -70,
            background: `radial-gradient(circle, ${OURO}26, transparent 65%)`,
            animation: "fx-drift-a 14s ease-in-out infinite",
          }}
        />
        <div className="relative rounded-3xl border p-6 sm:p-9" style={superficie(OURO, "forte")}>
          <h2 className="text-2xl sm:text-3xl" style={bebas}>
            {copy.join.title.toUpperCase()}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{copy.join.subtitle}</p>
          <div className="mt-6">
            <FormInteresse copy={copy} locale={locale} />
          </div>
        </div>
      </section>

      {/* ============================== DISCLAIMER ============================== */}
      <footer className="mx-auto mt-16 max-w-3xl border-t border-white/[0.08] pt-6">
        <p className="text-center text-[11.5px] leading-relaxed text-white/50">{copy.disclaimer}</p>
      </footer>
    </main>
  );
}
