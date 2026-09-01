"use client";

import { Trophy, Database, Brain, ArrowRightLeft, Target, ShieldCheck, ArrowDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PRESETS } from "@/lib/game/campeonato";
import type { CopyCampeonato } from "@/lib/game/copy-campeonato";
import type { GameCopy } from "@/lib/game/copy";
import { getCopyMercado } from "@/lib/game/copy-mercado";
import { BuscaClube } from "./BuscaClube";
import { FormInteresse } from "./FormInteresse";
import { CalendarioTemporada } from "./CalendarioTemporada";
import { TabelaClassificacao } from "./TabelaClassificacao";
import { TabelaRanking } from "./TabelaRanking";
import { VideoAmbiente } from "./VideoAmbiente";
import { ComunidadeAoVivo } from "./ComunidadeAoVivo";
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
/**
 * SEIS cores para SEIS pilares. Com cinco, o `i % length` devolvia lima no
 * primeiro e no último — duas linhas da mesma grade com a mesma cor, que é o
 * oposto de "o olho aprende a cor uma vez só". O ouro fecha o ciclo porque o
 * sexto pilar é "Integridade": confiança é a única coisa nesta lista que a §3
 * reconhece como recompensa.
 */
const PILLAR_CORES = [LIMA, CIANO, VIOLETA, ROSA, LARANJA, OURO];

export function GameLanding({
  copy,
  copyCamp,
  locale,
}: {
  copy: GameCopy;
  copyCamp: CopyCampeonato;
  locale: string;
}) {
  const copyMerc = getCopyMercado(locale);
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
        {/* A FOTO do herói, atrás de tudo.
            Ela entra como atmosfera, não como ilustração: escurecida e com o
            fundo dissolvendo para o navy da página, para o letreiro continuar
            legível por cima (barra C2). O `<img>` é simples e com
            `aspect-ratio` inline de propósito — §5 da identidade proíbe
            depender de layout responsivo do Tailwind para arte crítica. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
          <VideoAmbiente
            nome="video-heroi"
            className="h-full w-full object-cover object-right opacity-[0.62]"
          />
          {/* Duas camadas de véu, e nenhuma delas é um "escurecer tudo":
              a vertical protege a linha de base do texto, a horizontal abre a
              esquerda para o letreiro. A 40% de opacidade a cena sumia e a foto
              só custava banda; a 62% ela aparece e o texto continua AA. */}
          <span
            className="absolute inset-0"
            style={{
              background:
                `linear-gradient(180deg, ${FUNDO}99 0%, ${FUNDO}a6 45%, ${FUNDO} 94%),` +
                `linear-gradient(90deg, ${FUNDO}f2 2%, ${FUNDO}59 40%, transparent 70%)`,
            }}
          />
          <span
            className="absolute inset-0 opacity-[0.05]"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 78px, rgba(255,255,255,.9) 78px 79px)",
              maskImage: "linear-gradient(180deg, rgba(0,0,0,.8), transparent 85%)",
              WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,.8), transparent 85%)",
            }}
          />
        </div>

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

      {/* ============================== COMUNIDADE AO VIVO ==============================
          A área principal pedida pelo Ricardo: quem está online AGORA, a nuvem
          de bonequinhos, os números da comunidade e o painel "você está aqui".
          Vem logo abaixo do herói — é a prova viva de que o lugar tem gente,
          antes de qualquer demonstração de dado. */}
      <section className="relative mx-auto mt-14 max-w-5xl">
        <ComunidadeAoVivo copy={copyMerc} />
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

      {/* ============================== CAMPEONATOS ==============================
          Vem logo depois da busca e ANTES do ranking, de propósito: buscar o
          clube é curiosidade, montar campeonato é o que a seção existe para
          fazer. Deixar isso no rodapé seria esconder o produto atrás da
          demonstração. */}
      <section className="relative mx-auto mt-16 max-w-5xl">
        <div
          className="overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={superficie(OURO, "forte")}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl sm:text-3xl" style={bebas}>
                {copyCamp.hub.title.toUpperCase()}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                {copyCamp.hub.subtitle}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/game/campeonatos"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold transition-transform hover:-translate-y-0.5"
                  style={{ background: OURO, color: FUNDO, boxShadow: `0 12px 34px -14px ${OURO}` }}
                >
                  <Trophy size={16} />
                  {copyCamp.hub.create}
                </Link>
              </div>
            </div>

            {/* Os formatos, como fichas. É o que responde "dá para montar o
                MEU torneio?" antes de a pessoa clicar em qualquer coisa. */}
            <ul className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[420px]">
              {PRESETS.map((p, i) => {
                const cor = [LIMA, CIANO, VIOLETA, ROSA, OURO][i % 5];
                const t = copyCamp.presets[p.id];
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2"
                    style={{ borderColor: `${cor}2e`, background: `${cor}0d` }}
                  >
                    <span
                      className="rounded px-1.5 py-px text-[10px] font-black"
                      style={{ background: `${cor}22`, color: cor }}
                    >
                      {p.vagas}
                    </span>
                    <span className="truncate text-[12.5px] font-semibold text-white/80">
                      {t?.nome ?? p.id}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================== MERCADO ==============================
          O quadro de transferências. Vem logo depois de campeonatos porque é a
          outra metade do que a comunidade faz nos grupos — montar torneio e
          achar/oferecer jogador. É a resposta direta ao "quadro de requisições"
          que hoje vive em post-imagem sem filtro. */}
      <section className="relative mx-auto mt-16 max-w-5xl">
        <div
          className="overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={superficie(CIANO, "forte")}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: `${CIANO}14`, color: CIANO, border: `1px solid ${CIANO}33` }}
              >
                <ArrowRightLeft size={12} />
                {copyMerc.hub.badge}
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl" style={bebas}>
                {copyMerc.hub.title.toUpperCase()}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                {copyMerc.hub.subtitle}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/game/mercado"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold transition-transform hover:-translate-y-0.5"
                  style={{ background: CIANO, color: FUNDO, boxShadow: `0 12px 34px -14px ${CIANO}` }}
                >
                  <ArrowRightLeft size={16} />
                  {copyMerc.publicar.abrir}
                </Link>
                <Link
                  href="/game/mercado"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/18 px-6 py-3 font-semibold text-white/90 transition-colors hover:border-white/40 hover:bg-white/[0.04]"
                >
                  {copyMerc.abas.clubes}
                </Link>
              </div>
            </div>

            {/* As duas pontas do mercado, como fichas — clube que recruta e
                jogador que se oferece, do jeito que a vitrine separa. */}
            <ul className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[420px]">
              <li className="rounded-xl border px-4 py-3" style={{ borderColor: `${LIMA}2e`, background: `${LIMA}0d` }}>
                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: LIMA }}>
                  {copyMerc.abas.clubes}
                </span>
                <p className="mt-1 text-[12.5px] leading-snug text-white/70">{copyMerc.card.precisa}: VOL · LAT · ZAG…</p>
              </li>
              <li className="rounded-xl border px-4 py-3" style={{ borderColor: `${CIANO}2e`, background: `${CIANO}0d` }}>
                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: CIANO }}>
                  {copyMerc.abas.jogadores}
                </span>
                <p className="mt-1 text-[12.5px] leading-snug text-white/70">{copyMerc.card.overall} · {copyMerc.card.horarioLivre}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================== RANKING AO VIVO ==============================
          Vem logo depois da busca, e não no fim: quem acabou de procurar o
          próprio clube quer, no mesmo fôlego, ver contra quem ele se compara.
          É também a primeira tabela CHEIA da página — a da liga piloto, mais
          abaixo, só ganha sentido de "prévia" depois que existe uma de verdade. */}
      <section className="relative mx-auto mt-24 max-w-5xl">
        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 320,
            height: 320,
            left: "6%",
            top: -80,
            background: `radial-gradient(circle, ${LIMA}26, transparent 65%)`,
            animation: "fx-drift-a 15s ease-in-out infinite",
          }}
        />
        <div className="relative">
          <TabelaRanking copy={copy} />
        </div>
      </section>

      {/* ============================== COMO FUNCIONA ============================== */}
      <section className="relative mx-auto mt-24 max-w-5xl">
        <h2 className="text-center text-2xl sm:text-3xl" style={bebas}>
          {copy.how.title.toUpperCase()}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.how.steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-2xl border"
              style={superficie(LIMA)}
            >
              {/* A cena que ENCENA o passo (§9, a regra do espelho): "conecte o
                  clube" é a mão com o elenco na telinha, não um ícone. */}
              <span className="block relative overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática, sem otimizador */}
                <img
                  src={`/game/${s.art}.webp`}
                  alt={s.alt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent 45%, ${FUNDO}e6 100%)` }}
                />
                {/* O número, agora sobre a foto */}
                <span
                  aria-hidden
                  className="absolute right-3 top-1 select-none text-6xl leading-none"
                  style={{ ...bebas, color: `${LIMA}3d` }}
                >
                  {i + 1}
                </span>
              </span>
              <div className="p-5">
                <h3 className="text-lg font-bold" style={{ color: LIMA }}>
                  {s.title.replace(/^\d+\s*·\s*/, "")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.text}</p>
              </div>
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
                className="group flex gap-4 border-t border-white/[0.07] py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
              >
                {/* Miniatura em vez de quadrado de ícone. A lista continua
                    densa — não vira cartão, que é o que quebra o ritmo da
                    página — mas cada linha ganha a cena que lhe corresponde.
                    O ícone fica sobreposto no canto, pequeno, como legenda. */}
                <span
                  className="relative mt-0.5 block h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                  style={{ border: `1px solid ${cor}33` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática, sem otimizador */}
                  <img
                    src={`/game/${p.art}.webp`}
                    alt={p.alt}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(160deg, transparent 40%, ${cor}33)` }}
                  />
                  <Icon
                    className="absolute bottom-1 right-1 h-3.5 w-3.5 drop-shadow"
                    style={{ color: cor }}
                  />
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

      {/* ============================== CALENDÁRIO ==============================
          `mt-14` no celular, não `mt-24`: a lista de pilares acima não tem
          moldura que a feche, então os 96px do desktop viravam um bloco de
          preto sem função — lia como carregamento incompleto, não como
          respiro. Em telas largas a lista é de duas colunas e o espaço grande
          continua fazendo sentido. */}
      <div className="relative mx-auto mt-14 max-w-5xl sm:mt-24">
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
