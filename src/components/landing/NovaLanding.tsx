"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, ArrowRight, ArrowUpRight, X, GraduationCap, Wrench, Rocket, BookOpen } from "lucide-react";
import {
  MAGIC_EXAMPLES,
  CATEGORIES,
  XP_PER_EXAMPLE,
  FREE_EXAMPLES_LIMIT,
  type ExampleCategory,
  type MagicExample,
} from "@/data/landing/examples";
import type { AiNewsItem } from "@/data/landing/seed-news";

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;

// Paleta própria da landing — viva, "cartoon premium", independente do marrom do site
const GOLD = "#f5c04e";
const CATEGORY_STYLE: Record<ExampleCategory, { color: string; art: string }> = {
  "trabalho": { color: "#38bdf8", art: "/landing/cat-trabalho.png" },
  "estudos": { color: "#a78bfa", art: "/landing/cat-estudos.png" },
  "criar": { color: "#f472b6", art: "/landing/cat-criar.png" },
  "dia-a-dia": { color: "#a3e635", art: "/landing/cat-diaadia.png" },
};

type Stage = "pick" | "reveal";

export function NovaLanding({ news }: { news: AiNewsItem[] }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [category, setCategory] = useState<ExampleCategory | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [current, setCurrent] = useState<MagicExample | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [xpPop, setXpPop] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);

  const xp = seenIds.length * XP_PER_EXAMPLE;
  const limitReached = seenIds.length >= FREE_EXAMPLES_LIMIT;
  const accent = current ? CATEGORY_STYLE[current.category].color : GOLD;

  const closeCard = () => {
    setStage("pick");
    setCurrent(null);
    setRevealed(false);
  };

  // Esc fecha o card — sair tem que ser tão fácil quanto entrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pickExample = (cat: ExampleCategory) => {
    const pool = MAGIC_EXAMPLES.filter((e) => e.category === cat && !seenIds.includes(e.id));
    const fallback = MAGIC_EXAMPLES.filter((e) => !seenIds.includes(e.id));
    const source = pool.length > 0 ? pool : fallback;
    if (source.length === 0) return;
    const ex = source[Math.floor(Math.random() * source.length)];
    setCategory(cat);
    setCurrent(ex);
    setRevealed(false);
    setCopied(false);
    setStage("reveal");
  };

  const revealResult = () => {
    if (!current || revealed) return;
    setRevealed(true);
    setSeenIds((ids) => (ids.includes(current.id) ? ids : [...ids, current.id]));
    setXpPop(true);
    setTimeout(() => setXpPop(false), 1600);
  };

  const nextExample = () => {
    if (limitReached || !category) return;
    pickExample(category);
  };

  const copyPrompt = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — sem drama */
    }
  };

  const progressDots = useMemo(
    () => Array.from({ length: FREE_EXAMPLES_LIMIT }, (_, i) => i < seenIds.length),
    [seenIds.length]
  );

  return (
    <div
      className="min-h-dvh flex flex-col overflow-x-hidden text-[#f3f1ff]"
      style={{
        background:
          "radial-gradient(900px 500px at 12% -8%, rgba(167,139,250,.22), transparent 60%)," +
          "radial-gradient(800px 480px at 96% 30%, rgba(56,189,248,.16), transparent 55%)," +
          "radial-gradient(700px 500px at 50% 115%, rgba(244,114,182,.14), transparent 60%)," +
          "#0c0e1d",
      }}
      onClick={(e) => {
        // clique fora do card volta para as categorias (sem sequestrar o usuário)
        if (stage === "reveal" && cardRef.current && !cardRef.current.contains(e.target as Node)) {
          closeCard();
        }
      }}
    >
      {/* ============================== HEADER ============================== */}
      <header className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 shrink-0">
        <span className="text-3xl sm:text-4xl tracking-wide select-none" style={bebas}>
          FAY<span style={{ color: GOLD }}>AI</span>
        </span>
        <div className="flex items-center gap-3">
          <div
            className="relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-[#1a1405]"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #ffdf8e)`, boxShadow: "0 4px 18px rgba(245,192,78,.35)" }}
          >
            <Sparkles size={15} />
            <span>{xp} XP</span>
            <AnimatePresence>
              {xpPop && (
                <motion.span
                  initial={{ opacity: 0, y: 4, scale: 0.7 }}
                  animate={{ opacity: 1, y: -24, scale: 1.15 }}
                  exit={{ opacity: 0, y: -36 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute -top-1 right-2 font-extrabold pointer-events-none"
                  style={{ color: GOLD }}
                >
                  +{XP_PER_EXAMPLE}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <Link href="/login" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      {/* ============================== MINIGAME ============================== */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4">
        <div className="w-full max-w-3xl">
          {stage === "pick" && (
            <motion.section
              key="pick"
              initial={false}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl leading-[0.95] tracking-wide" style={bebas}>
                O QUE A <span style={{ color: GOLD }}>IA</span> FAZ POR VOCÊ
                <br />
                EM{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg,#38bdf8,#a78bfa,#f472b6)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  30 SEGUNDOS
                </span>
                ?
              </h1>
              <p className="mt-4 text-base sm:text-lg text-white/65 max-w-xl mx-auto">
                Escolha um pedaço da sua vida. A gente mostra a mágica — e o passo a passo para
                você repetir agora, de graça.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {CATEGORIES.map((cat, i) => {
                  const st = CATEGORY_STYLE[cat.id];
                  return (
                    <motion.button
                      key={cat.id}
                      whileHover={{ y: -6, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => pickExample(cat.id)}
                      className="group rounded-3xl overflow-hidden cursor-pointer text-left"
                      style={{
                        border: `2.5px solid ${st.color}55`,
                        background: "#141731",
                        boxShadow: `0 10px 30px -8px ${st.color}44`,
                      }}
                    >
                      <span className="block relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática, sem otimizador */}
                        <img
                          src={st.art}
                          alt={cat.label}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </span>
                      <span
                        className="block px-3 py-2.5 font-bold text-center text-sm sm:text-base"
                        style={{ color: st.color }}
                      >
                        {cat.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {stage === "reveal" && current && (
            <motion.section
              key={current.id}
              ref={cardRef}
              initial={false}
              className="relative rounded-3xl p-5 sm:p-8"
              style={{
                border: `2.5px solid ${accent}66`,
                background: "#141731",
                boxShadow: `0 18px 50px -12px ${accent}55`,
              }}
            >
              {/* fechar */}
              <button
                onClick={closeCard}
                aria-label="Fechar e voltar às categorias"
                className="absolute top-4 right-4 rounded-full p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <span
                    className="inline-block text-[11px] font-extrabold uppercase tracking-widest rounded-full px-3 py-1"
                    style={{ color: "#0c0e1d", background: accent }}
                  >
                    {CATEGORIES.find((c) => c.id === current.category)?.label}
                  </span>
                  <h2 className="mt-3 text-2xl sm:text-4xl leading-tight tracking-wide" style={bebas}>
                    {current.title}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-white/65">{current.hook}</p>
                </div>
                <div className="flex gap-1.5 shrink-0 mt-2">
                  {progressDots.map((done, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: done ? GOLD : "rgba(255,255,255,.15)" }}
                    />
                  ))}
                </div>
              </div>

              {!revealed ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={revealResult}
                  className="mt-6 w-full rounded-2xl py-4 text-lg font-extrabold flex items-center justify-center gap-2 cursor-pointer text-[#1a1405]"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, boxShadow: "0 10px 30px rgba(245,192,78,.35)" }}
                >
                  <Sparkles size={20} /> MOSTRAR A MÁGICA
                </motion.button>
              ) : (
                <motion.div
                  initial={false}
                  className="mt-6 space-y-4"
                >
                  <div className="rounded-2xl p-4" style={{ border: `2px solid ${accent}77`, background: "#0c0e1d" }}>
                    <p className="text-xs font-extrabold uppercase tracking-wider mb-1.5" style={{ color: accent }}>
                      ✨ O resultado
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed">{current.result}</p>
                  </div>

                  <div className="rounded-2xl p-4 border-2 border-white/10" style={{ background: "#0c0e1d" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-extrabold text-white/45 uppercase tracking-wider">
                        🪄 A receita — cole no ChatGPT, Claude ou Gemini
                      </p>
                      <button
                        onClick={copyPrompt}
                        className="flex items-center gap-1 text-xs font-bold hover:opacity-80 cursor-pointer"
                        style={{ color: GOLD }}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{current.prompt}</p>
                  </div>

                  <p className="text-xs sm:text-sm text-white/60">
                    <span className="font-bold text-white">Na sua vida:</span> {current.apply}
                  </p>

                  {!limitReached ? (
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={nextExample}
                        className="flex-1 rounded-2xl py-3.5 font-extrabold flex items-center justify-center gap-2 cursor-pointer text-[#1a1405]"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, boxShadow: "0 10px 30px rgba(245,192,78,.3)" }}
                      >
                        Próxima mágica <ArrowRight size={18} />
                      </motion.button>
                      <button
                        onClick={closeCard}
                        className="flex-1 rounded-2xl border-2 border-white/15 py-3.5 font-semibold text-white/60 hover:text-white hover:border-white/35 transition-colors cursor-pointer"
                      >
                        Trocar categoria
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={false}
                      className="rounded-2xl p-5 text-center"
                      style={{ border: `2.5px solid ${GOLD}`, background: "rgba(245,192,78,.08)" }}
                    >
                      <p className="text-2xl sm:text-3xl tracking-wide" style={bebas}>
                        🏆 VOCÊ GANHOU <span style={{ color: GOLD }}>{xp} XP</span>!
                      </p>
                      <p className="mt-1.5 text-sm text-white/65">
                        Crie sua conta grátis para continuar — seus XP vão com você, e a próxima
                        mágica é personalizada para a sua vida.
                      </p>
                      <Link
                        href="/registro"
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-extrabold text-[#1a1405] hover:opacity-90 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, boxShadow: "0 10px 30px rgba(245,192,78,.35)" }}
                      >
                        Continuar grátis <ArrowRight size={18} />
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.section>
          )}
        </div>
      </main>

      {/* ============================== IA HOJE ============================== */}
      <section className="px-4 sm:px-8 pb-3 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline gap-3 mb-2.5">
            <h3 className="text-xl sm:text-2xl tracking-wide" style={bebas}>
              IA <span style={{ color: GOLD }}>HOJE</span>
            </h3>
            <span className="text-[11px] uppercase tracking-wider text-white/40">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {news.map((item) => {
              const external = item.url?.startsWith("http");
              return (
                <a
                  key={item.slug}
                  href={item.url || "/blog"}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group rounded-2xl overflow-hidden border-2 border-white/10 hover:border-white/30 transition-colors"
                  style={{ background: "#141731" }}
                >
                  {item.image && (
                    <span className="block relative overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática, sem otimizador */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                  )}
                  <span className="block p-3.5">
                    <span className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: GOLD }}>
                        {item.tag}
                      </span>
                      <ArrowUpRight size={14} className="text-white/30 group-hover:text-white/70 transition-colors" />
                    </span>
                    <span className="block mt-1 text-sm font-bold leading-snug">{item.title}</span>
                    <span className="block mt-1 text-xs text-white/55 leading-relaxed line-clamp-2">
                      {item.summary}
                    </span>
                    {item.source && (
                      <span className="block mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                        {item.source}
                        {item.date ? ` · ${new Date(item.date).toLocaleDateString("pt-BR")}` : ""}
                      </span>
                    )}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== LINKS ============================== */}
      <footer className="px-4 sm:px-8 pb-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/cursos", icon: GraduationCap, label: "Cursos", desc: "18 cursos com certificado", color: "#38bdf8" },
              { href: "/ferramentas", icon: Wrench, label: "Ferramentas", desc: "100+ ferramentas de IA", color: "#a78bfa" },
              { href: "/servicos", icon: Rocket, label: "Serviços", desc: "Sites, automação e consultoria", color: "#f472b6" },
              { href: "/blog", icon: BookOpen, label: "Blog", desc: "Guias práticos de IA", color: "#a3e635" },
            ].map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl px-4 py-3 flex items-center gap-3 border-2 border-white/10 hover:border-white/25 transition-colors"
                style={{ background: "#141731" }}
              >
                <span
                  className="flex items-center justify-center rounded-xl p-2 shrink-0"
                  style={{ background: `${color}22`, color }}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{label}</span>
                  <span className="block text-[11px] text-white/45 truncate">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-white/35">
            © {new Date().getFullYear()} FayAI — aprenda IA fazendo, não assistindo.
          </p>
        </div>
      </footer>
    </div>
  );
}
