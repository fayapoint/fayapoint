"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, ArrowUpRight, Star, X } from "lucide-react";
import type { FerramentaCatalogo, Verbo } from "@/data/ferramentaria";

/**
 * `/ferramentaria` — a vitrine das ferramentas.
 *
 * O diagnóstico que originou esta página (MASTERPLAN §"A dívida visual das
 * ferramentas"): o `/ferramentas` é uma grade de 56 cartões de texto com três
 * `<select>` no topo, sem uma única imagem. Nada distingue o ChatGPT do
 * Bolt.new além do texto dentro do cartão.
 *
 * As três decisões que respondem a isso:
 *
 * 1. **Verbo no lugar de categoria.** 22 categorias viram 10 verbos. O filtro
 *    deixa de ser um `<select>` e vira ladrilho grande e clicável.
 * 2. **Cor da própria marca.** Cada cartão é pintado com a cor extraída do
 *    logo da ferramenta (`scripts/extract-tool-colors.mjs`), então a grade
 *    fica colorida e reconhecível sem virar colcha de retalho — a forma é a
 *    mesma, a cor é de cada uma.
 * 3. **Imagem em dois níveis.** O logo aparece sempre; a capa da empresa entra
 *    no hover, atrás. Assim a grade fica limpa em repouso e rica ao explorar —
 *    a regra do Ricardo, "2D primeiro, 3D no hover".
 */

type Props = {
  ferramentas: FerramentaCatalogo[];
  verbos: Verbo[];
  locale: string;
};

/** 42 = o dourado da casa, usado quando a marca é preto-e-branco. */
const MATIZ_PADRAO = 42;

function matizDe(hsl: [number, number, number] | null) {
  return hsl ? hsl[0] : MATIZ_PADRAO;
}

/**
 * `hsl(...)` para FUNDO, borda e brilho — onde a luminosidade é fixa de
 * propósito, porque são camadas translúcidas sobre o cartão.
 *
 * Para TEXTO não use esta função: cor de texto precisa mudar de luminosidade
 * conforme o tema, e isso vive na classe `.tinta-marca` (globals.css).
 */
function tinta(hsl: [number, number, number] | null, s: number, l: number, a = 1) {
  const h = matizDe(hsl);
  const sat = hsl ? Math.min(hsl[1], 85) : 70;
  return `hsl(${h} ${Math.round(sat * (s / 100))}% ${l}% / ${a})`;
}

/** Variável de matiz para os elementos que usam `.tinta-marca`. */
function varMatiz(h: number): React.CSSProperties {
  return { ["--marca-h" as string]: String(h) };
}

/**
 * Quantas ferramentas por página.
 *
 * 56 cartões numa tela só é o que tornava o `/ferramentas` antigo cansativo de
 * percorrer — a pessoa rola, rola, e desiste antes do fim. 12 cabem numa tela
 * de desktop com sobra e deixam a paginação fazer o trabalho de ritmo.
 */
const POR_PAGINA = 12;

export function FerramentariaClient({ ferramentas, verbos, locale }: Props) {
  const [verboAtivo, setVerboAtivo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const semMovimento = useReducedMotion();

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ferramentas.filter((f) => {
      if (verboAtivo && f.verbo.slug !== verboAtivo) return false;
      if (!termo) return true;
      return (
        f.nome.toLowerCase().includes(termo) ||
        f.fabricante.toLowerCase().includes(termo) ||
        f.categoria.toLowerCase().includes(termo) ||
        f.descricao.toLowerCase().includes(termo)
      );
    });
  }, [ferramentas, verboAtivo, busca]);

  const verboSelecionado = verbos.find((v) => v.slug === verboAtivo) ?? null;

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  // Filtrar de uma página alta pode deixar menos páginas do que a atual; sem
  // este limite a grade ficaria vazia sem explicação nenhuma.
  const paginaAtual = Math.min(pagina, totalPaginas);
  const daPagina = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  /** Trocar filtro ou busca sempre volta para a primeira página. */
  const filtrarPor = (slug: string | null) => {
    setVerboAtivo(slug);
    setPagina(1);
  };
  const buscarPor = (termo: string) => {
    setBusca(termo);
    setPagina(1);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Hero
        verbos={verbos}
        total={ferramentas.length}
        semMovimento={Boolean(semMovimento)}
      />

      {/* ── Os verbos ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="verbos-titulo">
        <h2 id="verbos-titulo" className="sr-only">
          O que você quer inventar
        </h2>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {verbos.map((v) => {
            const ativo = verboAtivo === v.slug;
            const quantas = ferramentas.filter((f) => f.verbo.slug === v.slug).length;

            return (
              <button
                key={v.slug}
                type="button"
                onClick={() => filtrarPor(ativo ? null : v.slug)}
                aria-pressed={ativo}
                className="group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  borderColor: ativo
                    ? `hsl(${v.matiz} 70% 55% / .55)`
                    : "color-mix(in oklab, var(--border) 100%, transparent)",
                  background: ativo
                    ? `linear-gradient(150deg, hsl(${v.matiz} 70% 55% / .18), hsl(${v.matiz} 70% 55% / .04))`
                    : "color-mix(in oklab, var(--card) 60%, transparent)",
                  transform: ativo ? "translateY(-2px)" : undefined,
                }}
              >
                {/* Brilho que sobe no hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-0 opacity-0 transition-all duration-300 group-hover:h-full group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(to top, hsl(${v.matiz} 70% 55% / .14), transparent)`,
                  }}
                />
                <span className="relative block">
                  <span
                    className={`block text-[15px] font-semibold tracking-tight transition-colors ${ativo ? "tinta-marca" : ""}`}
                    style={ativo ? varMatiz(v.matiz) : undefined}
                  >
                    {v.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {quantas} ferramenta{quantas === 1 ? "" : "s"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Explicação do verbo escolhido */}
        <AnimatePresence mode="wait">
          {verboSelecionado && (
            <motion.div
              key={verboSelecionado.slug}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: semMovimento ? 0 : 0.25 }}
              className="overflow-hidden"
            >
              <p className="flex items-center gap-3 pt-5 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className="h-px w-8 shrink-0"
                  style={{ background: `hsl(${verboSelecionado.matiz} 70% 55%)` }}
                />
                {verboSelecionado.descricao}
                <button
                  type="button"
                  onClick={() => filtrarPor(null)}
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <X className="h-3 w-3" aria-hidden />
                  limpar
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Busca ────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">Buscar ferramenta</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => buscarPor(e.target.value)}
              placeholder="ChatGPT, Runway, automação…"
              className="w-full rounded-xl border border-border bg-card/60 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
            />
          </label>

          <p aria-live="polite" className="text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">{filtradas.length}</strong>{" "}
            {filtradas.length === 1 ? "ferramenta" : "ferramentas"}
            {verboSelecionado && ` para ${verboSelecionado.label.toLowerCase()}`}
          </p>
        </div>
      </section>

      {/* ── A grade ──────────────────────────────────────────────────── */}
      <section className="mx-auto mt-6 max-w-6xl px-4 pb-24 sm:px-6">
        {filtradas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">
              Nada com esse nome por aqui.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setVerboAtivo(null);
              }}
              className="mt-3 text-sm text-primary underline underline-offset-4"
            >
              Ver as {ferramentas.length} ferramentas
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daPagina.map((f, i) => (
              <Cartao
                key={f.slug}
                ferramenta={f}
                locale={locale}
                indice={i}
                semMovimento={Boolean(semMovimento)}
              />
            ))}
          </ul>
        )}

        {/* ── Paginação ──────────────────────────────────────────────── */}
        {totalPaginas > 1 && (
          <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((n) => Math.max(1, n - 1))}
              disabled={paginaAtual === 1}
              className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPagina(n)}
                aria-current={n === paginaAtual ? "page" : undefined}
                className={[
                  "min-w-10 rounded-lg border px-3.5 py-2 text-sm transition-colors",
                  n === paginaAtual
                    ? "border-foreground/35 bg-foreground/10 font-semibold"
                    : "border-border text-muted-foreground hover:border-foreground/25",
                ].join(" ")}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
              disabled={paginaAtual === totalPaginas}
              className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function Hero({
  verbos,
  total,
  semMovimento,
}: {
  verbos: Verbo[];
  total: number;
  semMovimento: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  // Palavra que gira depois de "Ferramentaria".
  useEffect(() => {
    if (semMovimento) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % verbos.length), 2600);
    return () => clearInterval(t);
  }, [verbos.length, semMovimento]);

  /**
   * Brilho que segue o cursor.
   *
   * Escrito direto em CSS custom property em vez de estado do React: mover o
   * mouse dispara dezenas de eventos por segundo, e um `setState` a cada um
   * re-renderiza a árvore inteira do herói a 60 Hz sem necessidade nenhuma.
   */
  const seguirCursor = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = areaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  const atual = verbos[indice];

  return (
    <header
      ref={areaRef}
      onMouseMove={semMovimento ? undefined : seguirCursor}
      className="relative overflow-hidden border-b border-border"
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
    >
      {/* Brilho do cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at var(--mx) var(--my), hsl(${atual.matiz} 75% 55% / .16), transparent 70%)`,
        }}
      />
      {/* Malha de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)," +
            "linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {total} ferramentas de IA · escolhidas e explicadas
        </p>

        <h1 className="mt-5 text-[clamp(2.75rem,9vw,6rem)] font-bold leading-[0.95] tracking-tighter">
          Ferramentaria
        </h1>

        {/* A frase que gira */}
        <div className="mt-2 h-[clamp(2rem,5vw,3.25rem)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={atual.slug}
              initial={semMovimento ? false : { y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={semMovimento ? undefined : { y: "-100%", opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="tinta-marca text-[clamp(1.25rem,3.5vw,2.25rem)] font-light tracking-tight"
              style={varMatiz(atual.matiz)}
            >
              {atual.complemento}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Diretório de ferramenta é lista morta. Aqui elas estão organizadas
          pelo que você quer <em className="not-italic text-foreground">fazer</em> —
          e cada uma tem ficha, curso e o caminho para começar.
        </p>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function Cartao({
  ferramenta: f,
  locale,
  indice,
  semMovimento,
}: {
  ferramenta: FerramentaCatalogo;
  locale: string;
  indice: number;
  semMovimento: boolean;
}) {
  return (
    <motion.li
      initial={semMovimento ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        // Escada curta: acima de ~12 cartões o atraso viraria espera.
        delay: semMovimento ? 0 : Math.min(indice, 11) * 0.03,
      }}
    >
      <Link
        href={`/${locale}/ferramentas/${f.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/50 p-5 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ ["--tinta" as string]: tinta(f.hsl, 100, 55) }}
      >
        {/* Capa da empresa, revelada no hover, bem atrás */}
        {f.capa && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <Image
              src={f.capa}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="scale-110 object-cover opacity-0 blur-[2px] transition-all duration-500 group-hover:scale-100 group-hover:opacity-[0.14]"
            />
          </span>
        )}

        {/* Lavagem na cor da marca */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(120% 90% at 0% 0%, ${tinta(f.hsl, 100, 55, 0.14)}, transparent 62%)`,
          }}
        />
        {/* Fio de luz no topo, na cor da marca */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(to right, transparent, ${tinta(f.hsl, 100, 62)}, transparent)`,
          }}
        />

        <div className="relative flex items-start gap-3.5">
          {/* Logo */}
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-transform duration-300 group-hover:scale-105"
            style={{
              borderColor: tinta(f.hsl, 100, 55, 0.3),
              background: tinta(f.hsl, 100, 55, 0.1),
            }}
          >
            {f.logo ? (
              <Image
                src={f.logo}
                alt=""
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
              />
            ) : (
              // Reserva tipográfica: a inicial da ferramenta na cor da marca.
              <span aria-hidden className="tinta-marca text-lg font-bold" style={varMatiz(matizDe(f.hsl))}>
                {f.nome.charAt(0)}
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="truncate text-[17px] font-semibold tracking-tight">
                {f.nome}
              </span>
              <ArrowUpRight
                aria-hidden
                className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
              />
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{f.fabricante}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                <Star aria-hidden className="h-3 w-3 fill-current text-primary" />
                {f.nota.toFixed(1)}
              </span>
            </span>
          </span>
        </div>

        <p className="relative mt-3.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {f.descricao}
        </p>

        <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
          <span
            className="tinta-marca rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              ...varMatiz(matizDe(f.hsl)),
              background: tinta(f.hsl, 100, 55, 0.16),
            }}
          >
            {f.verbo.label}
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {f.preco}
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
