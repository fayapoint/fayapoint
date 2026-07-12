"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, ArrowRight, GraduationCap, Wrench, Rocket, BookOpen } from "lucide-react";
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

type Stage = "pick" | "reveal";

export function NovaLanding({ news }: { news: AiNewsItem[] }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [category, setCategory] = useState<ExampleCategory | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [current, setCurrent] = useState<MagicExample | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [xpPop, setXpPop] = useState(false);

  const xp = seenIds.length * XP_PER_EXAMPLE;
  const limitReached = seenIds.length >= FREE_EXAMPLES_LIMIT;

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
    if (limitReached) return;
    if (category) pickExample(category);
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
    <div className="min-h-dvh bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* ============================== HEADER ============================== */}
      <header className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 shrink-0">
        <span className="text-3xl sm:text-4xl tracking-wide select-none" style={bebas}>
          FAY<span className="text-primary">AI</span>
        </span>
        <div className="flex items-center gap-3">
          {/* XP chip */}
          <div className="relative flex items-center gap-1.5 rounded-full border-2 border-primary/40 bg-card px-3 py-1 text-sm font-semibold">
            <Sparkles size={15} className="text-primary" />
            <span>{xp} XP</span>
            <AnimatePresence>
              {xpPop && (
                <motion.span
                  initial={{ opacity: 0, y: 4, scale: 0.7 }}
                  animate={{ opacity: 1, y: -22, scale: 1.1 }}
                  exit={{ opacity: 0, y: -34 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute -top-1 right-2 text-primary font-bold pointer-events-none"
                >
                  +{XP_PER_EXAMPLE}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* ============================== MINIGAME ============================== */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4">
        <div className="w-full max-w-3xl">
          {/* Troca de estágio é render condicional puro — animação apenas na
              entrada. Nunca dependa de exit-animation para interação: em abas
              com rAF throttled (background, economia de bateria) ela não roda. */}
          {stage === "pick" && (
              <motion.section
                key="pick"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <h1
                  className="text-4xl sm:text-6xl md:text-7xl leading-[0.95] tracking-wide"
                  style={bebas}
                >
                  O QUE A <span className="text-primary">IA</span> FAZ POR VOCÊ
                  <br />
                  EM <span className="text-primary">30 SEGUNDOS</span>?
                </h1>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                  Escolha um pedaço da sua vida. A gente mostra a mágica — e o passo a passo
                  para você repetir agora, de graça.
                </p>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.3 }}
                      whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? -1 : 1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => pickExample(cat.id)}
                      className="rounded-3xl border-2 border-border bg-card hover:border-primary/60 px-4 py-6 sm:py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="text-4xl sm:text-5xl">{cat.emoji}</span>
                      <span className="font-semibold text-sm sm:text-base">{cat.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}

            {stage === "reveal" && current && (
              <motion.section
                key={current.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-3xl border-2 border-border bg-card p-5 sm:p-8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-4xl">{current.emoji}</span>
                    <h2 className="mt-2 text-2xl sm:text-4xl leading-tight tracking-wide" style={bebas}>
                      {current.title}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground">{current.hook}</p>
                  </div>
                  {/* progresso */}
                  <div className="flex gap-1.5 shrink-0 mt-2">
                    {progressDots.map((done, i) => (
                      <span
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${done ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </div>

                {!revealed ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={revealResult}
                    className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground py-4 text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={20} /> MOSTRAR A MÁGICA
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 space-y-4"
                  >
                    {/* resultado */}
                    <div className="rounded-2xl border-2 border-primary/40 bg-background p-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                        ✨ O resultado
                      </p>
                      <p className="text-sm sm:text-base leading-relaxed">{current.result}</p>
                    </div>

                    {/* prompt copiável */}
                    <div className="rounded-2xl border-2 border-border bg-background p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          🪄 A receita — cole no ChatGPT, Claude ou Gemini
                        </p>
                        <button
                          onClick={copyPrompt}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 cursor-pointer"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? "Copiado!" : "Copiar"}
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {current.prompt}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Na sua vida:</span>{" "}
                      {current.apply}
                    </p>

                    {/* ações */}
                    {!limitReached ? (
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={nextExample}
                          className="flex-1 rounded-2xl bg-primary text-primary-foreground py-3.5 font-bold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Próxima mágica <ArrowRight size={18} />
                        </motion.button>
                        <button
                          onClick={() => setStage("pick")}
                          className="flex-1 rounded-2xl border-2 border-border py-3.5 font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
                        >
                          Trocar categoria
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl border-2 border-primary bg-primary/10 p-5 text-center"
                      >
                        <p className="text-2xl sm:text-3xl tracking-wide" style={bebas}>
                          🏆 VOCÊ GANHOU {xp} XP!
                        </p>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Crie sua conta grátis para continuar — seus XP vão com você, e a
                          próxima mágica é personalizada para a sua vida.
                        </p>
                        <Link
                          href="/registro"
                          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-8 py-3.5 font-bold hover:opacity-90 transition-opacity"
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
              IA <span className="text-primary">HOJE</span>
            </h3>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {news.map((item) => (
              <article
                key={item.slug}
                className="rounded-2xl border-2 border-border bg-card p-3.5 hover:border-primary/40 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {item.tag}
                </span>
                <h4 className="mt-1 text-sm font-semibold leading-snug">{item.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== LINKS ============================== */}
      <footer className="px-4 sm:px-8 pb-4 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/cursos", icon: GraduationCap, label: "Cursos", desc: "18 cursos com certificado" },
              { href: "/ferramentas", icon: Wrench, label: "Ferramentas", desc: "100+ ferramentas de IA" },
              { href: "/servicos", icon: Rocket, label: "Serviços", desc: "Sites, automação e consultoria" },
              { href: "/blog", icon: BookOpen, label: "Blog", desc: "Guias práticos de IA" },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border-2 border-border bg-card px-4 py-3 flex items-center gap-3 hover:border-primary/50 transition-colors"
              >
                <Icon size={20} className="text-primary shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} FayAI — aprenda IA fazendo, não assistindo.
          </p>
        </div>
      </footer>
    </div>
  );
}
