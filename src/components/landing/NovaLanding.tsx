"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, ArrowRight, ArrowUpRight, X, GraduationCap, Wrench, Rocket, BookOpen } from "lucide-react";
import {
  MAGIC_EXAMPLES,
  CATEGORIES,
  XP_PER_EXAMPLE,
  XP_BONUS_ACERTO,
  FREE_EXAMPLES_LIMIT,
  MAX_LANDING_XP,
  type ExampleCategory,
  type MagicExample,
} from "@/data/landing/examples";
import type { AiNewsItem } from "@/data/landing/seed-news";
import { useUser } from "@/contexts/UserContext";

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;

// Paleta própria da landing — viva, "cartoon premium", independente do marrom do site
const GOLD = "#f5c04e";
// Cada categoria tem 5 artes monocromáticas na SUA cor — a cor é a navegação.
// A variação é sorteada a cada visita (pós-montagem, para não divergir do SSR).
const CAT_VARIANTS = 5;
const CATEGORY_STYLE: Record<ExampleCategory, { color: string }> = {
  "trabalho": { color: "#38bdf8" },
  "estudos": { color: "#a78bfa" },
  "criar": { color: "#f472b6" },
  "dia-a-dia": { color: "#a3e635" },
};
const catArt = (id: ExampleCategory, v: number) => `/landing/cats/${id}-v${v}.webp`;

type Stage = "pick" | "reveal";

/** Estado real da conta do aluno logado (fonte: GET /api/gate/claim-xp) */
interface AccountState {
  totalXp: number;
  level: number;
  playedIds: string[];
  trail?: { done: number; total: number };
}

export function NovaLanding({ news }: { news: AiNewsItem[] }) {
  const { user, setUser, isLoggedIn, mounted } = useUser();
  const [stage, setStage] = useState<Stage>("pick");
  const [category, setCategory] = useState<ExampleCategory | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [current, setCurrent] = useState<MagicExample | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [xpPop, setXpPop] = useState(false);
  const [xp, setXp] = useState(0);
  const [lastGain, setLastGain] = useState(XP_PER_EXAMPLE);
  const [guess, setGuess] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [burst, setBurst] = useState(0); // chave do confete
  const cardRef = useRef<HTMLElement | null>(null);
  const [artVariants, setArtVariants] = useState<Record<ExampleCategory, number>>({
    "trabalho": 1, "estudos": 1, "criar": 1, "dia-a-dia": 1,
  });

  // ===== P0: home do aluno — o XP do logado NUNCA é jogado fora =====
  const logged = mounted && isLoggedIn && !!user;
  const [account, setAccount] = useState<AccountState | null>(null);
  const [treino, setTreino] = useState(false); // exemplo já creditado antes
  const [creditMsg, setCreditMsg] = useState<string | null>(null);
  const playedIds = useMemo(() => account?.playedIds ?? [], [account]);

  // Logado: resgata jornada anônima pendente (se houver) e carrega o estado
  // real da conta — pill, exemplos já jogados e progresso da trilha.
  useEffect(() => {
    if (!logged) {
      setAccount(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const raw = localStorage.getItem("fayai_landing");
        const data = raw ? JSON.parse(raw) : null;
        if (data && !data.claimed && Number(data.xp) > 0) {
          const r = await fetch("/api/gate/claim-xp", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ xp: data.xp, categories: data.cats || [], seenIds: data.seenIds || [] }),
          });
          const res = await r.json().catch(() => null);
          localStorage.setItem("fayai_landing", JSON.stringify({ ...data, claimed: true }));
          if (res?.claimed && !cancelled) {
            setCreditMsg(`+${res.xp} XP da sua jornada anterior creditados na sua conta ✨`);
            setTimeout(() => setCreditMsg(null), 4200);
          }
        }
      } catch { /* storage indisponível — sem drama */ }
      try {
        const r = await fetch("/api/gate/claim-xp", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const d = await r.json();
          if (!cancelled && d && Array.isArray(d.playedIds)) {
            setAccount({ totalXp: d.totalXp || 0, level: d.level || 1, playedIds: d.playedIds, trail: d.trail });
          }
        }
      } catch { /* rede indisponível — a pill usa o contexto como fallback */ }
    };
    load();
    return () => { cancelled = true; };
  }, [logged]);

  // Sorteia a arte de cada categoria a cada visita
  useEffect(() => {
    setArtVariants({
      "trabalho": 1 + Math.floor(Math.random() * CAT_VARIANTS),
      "estudos": 1 + Math.floor(Math.random() * CAT_VARIANTS),
      "criar": 1 + Math.floor(Math.random() * CAT_VARIANTS),
      "dia-a-dia": 1 + Math.floor(Math.random() * CAT_VARIANTS),
    });
  }, []);

  // Anônimo: gate de 3 exemplos → cadastro. Logado: joga até esgotar o banco.
  const limitReached = logged
    ? seenIds.length >= MAGIC_EXAMPLES.length
    : seenIds.length >= FREE_EXAMPLES_LIMIT;
  const accent = current ? CATEGORY_STYLE[current.category].color : GOLD;
  // Pill do logado mostra o XP REAL da conta (nunca o contador local do gate)
  const pillXp = logged ? (account?.totalXp ?? user?.progress?.xp ?? 0) : xp;

  const closeCard = () => {
    setStage("pick");
    setCurrent(null);
    setRevealed(false);
  };

  // Persiste a jornada ANÔNIMA — o XP é resgatado na conta após o cadastro.
  // Logado não passa por aqui: o crédito é imediato via API (P0).
  useEffect(() => {
    if (logged || seenIds.length === 0) return;
    try {
      const prev = JSON.parse(localStorage.getItem("fayai_landing") || "{}");
      const cats = new Set<string>(Array.isArray(prev.cats) ? prev.cats : []);
      if (category) cats.add(category);
      localStorage.setItem(
        "fayai_landing",
        JSON.stringify({ xp, seenIds, cats: [...cats], claimed: !!prev.claimed })
      );
    } catch { /* storage indisponível — sem drama */ }
  }, [logged, seenIds, category, xp]);

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
    setGuess(null);
    setTreino(logged && playedIds.includes(ex.id));
    setStage("reveal");
  };

  const answerQuiz = (idx: number) => {
    if (!current || revealed) return;
    const acertou = idx === current.quiz.answer;
    const gain = XP_PER_EXAMPLE + (acertou ? XP_BONUS_ACERTO : 0);
    setGuess(idx);
    setRevealed(true);
    setSeenIds((ids) => (ids.includes(current.id) ? ids : [...ids, current.id]));
    setCombo((c) => (acertou ? c + 1 : 0));
    setBurst((b) => b + 1);

    if (logged) {
      // Já creditado antes → modo treino: joga de novo, sem re-farm de XP
      if (playedIds.includes(current.id)) return;

      setLastGain(gain);
      setXpPop(true);
      setTimeout(() => setXpPop(false), 1600);

      // Crédito IMEDIATO na conta — idempotente por exampleId no servidor
      fetch("/api/gate/claim-xp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exampleId: current.id, acertou, category: current.category }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res?.credited) {
            setAccount((a) => ({
              totalXp: res.totalXp,
              level: res.level,
              playedIds: [...(a?.playedIds ?? []), current.id],
              trail: a?.trail,
            }));
            setCreditMsg(`+${res.xp} XP creditados na sua conta ✨`);
            setTimeout(() => setCreditMsg(null), 3200);
            // Portal reflete sem F5: atualiza contexto + localStorage
            if (user) {
              setUser({
                ...user,
                progress: {
                  level: res.level,
                  points: user.progress?.points ?? 0,
                  currentStreak: user.progress?.currentStreak ?? 0,
                  coursesCompleted: user.progress?.coursesCompleted ?? 0,
                  coursesInProgress: user.progress?.coursesInProgress ?? 0,
                  totalHours: user.progress?.totalHours ?? 0,
                  certificates: user.progress?.certificates,
                  xp: res.totalXp,
                },
              });
            }
          } else if (res?.reason === "already-credited") {
            setAccount((a) =>
              a ? { ...a, totalXp: res.totalXp, level: res.level, playedIds: [...a.playedIds, current.id] } : a
            );
          }
        })
        .catch(() => { /* rede indisponível — o servidor é idempotente, tenta na próxima */ });
      return;
    }

    // Anônimo: contador local do gate (resgatado na conta após o cadastro)
    setXp((v) => v + gain);
    setLastGain(gain);
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

  // Cena-espelho do exemplo (IDENTIDADE_VISUAL §9): uma ilustração que ENCENA
  // exatamente a ação descrita — substituiu a colagem genérica de pool em
  // 13/07/2026 ("humanizar": a imagem conta a mesma história que o texto).
  // As pools /landing/magic/ continuam no repo para usos futuros.

  const confetti = useMemo(() => {
    if (burst === 0) return [] as { dx: string; dy: string; left: string; color: string; delay: string }[];
    const cores = ["#f5c04e", "#38bdf8", "#a78bfa", "#f472b6", "#a3e635", "#fff"];
    return Array.from({ length: 26 }, (_, i) => ({
      dx: `${(Math.random() - 0.5) * 320}px`,
      dy: `${-40 - Math.random() * 240}px`,
      left: `${8 + Math.random() * 84}%`,
      color: cores[i % cores.length],
      delay: `${Math.random() * 0.15}s`,
    }));
  }, [burst]);

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
      <style dangerouslySetInnerHTML={{ __html: `
        @property --fx-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes fx-rotate { to { --fx-angle: 360deg; } }
        @keyframes fx-sweep { 0% { left: -60%; } 55% { left: 130%; } 100% { left: 130%; } }
        .glass {
          position: relative;
          background: linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,0) 38%), rgba(22, 26, 54, 0.42);
          backdrop-filter: blur(18px) saturate(1.7);
          -webkit-backdrop-filter: blur(18px) saturate(1.7);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 1px 0 0 rgba(255,255,255,.08), 0 12px 40px -14px rgba(0,0,0,.55);
        }
        .glass::before {
          content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none;
          border-radius: inherit;
          background: radial-gradient(420px 140px at 18% -8%, rgba(255,255,255,.16), transparent 60%);
        }
        .glass-hover { transition: border-color .3s ease, background .3s ease, transform .3s ease, box-shadow .3s ease; transform-style: preserve-3d; }
        .glass-hover:hover {
          border-color: rgba(255,255,255,.32);
          background: linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,0) 40%), rgba(30, 35, 72, 0.55);
          transform: perspective(900px) rotateX(2.2deg) translateY(-4px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 22px 50px -16px rgba(0,0,0,.6);
        }
        @keyframes fx-drift-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(34px,-22px) scale(1.12); } }
        @keyframes fx-drift-b { 0%,100% { transform: translate(0,0) scale(1.05); } 50% { transform: translate(-28px,18px) scale(.94); } }
        @keyframes fx-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .fx-float { animation: fx-float 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fx-orb, .fx-shine::after, .fx-magic::before, .fx-float { animation: none !important; }
        }
        .fx-magic { position: relative; z-index: 0; }
        .fx-magic::before {
          content: ""; position: absolute; inset: -3px; border-radius: 1.15rem; z-index: -1;
          background: conic-gradient(from var(--fx-angle), #38bdf8, #a78bfa, #f472b6, #f5c04e, #38bdf8);
          animation: fx-rotate 4s linear infinite;
          filter: blur(7px); opacity: .75;
        }
        .fx-shine { position: relative; overflow: hidden; }
        .fx-shine::after {
          content: ""; position: absolute; top: 0; left: -60%; width: 45%; height: 100%;
          transform: skewX(-20deg); pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
          animation: fx-sweep 5.2s ease-in-out infinite;
        }
        .fx-orb { position: absolute; border-radius: 9999px; filter: blur(46px); pointer-events: none; }
        @keyframes fx-conf {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(720deg) scale(.6); opacity: 0; }
        }
        .fx-conf { position: absolute; width: 9px; height: 13px; border-radius: 2px;
                   animation: fx-conf .9s ease-out forwards; pointer-events: none; z-index: 30; }
        @keyframes fx-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .fx-quiz { transition: border-color .2s ease, background .2s ease, transform .15s ease; }
        .fx-quiz:hover { transform: translateX(4px); }
      ` }} />
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
            <span>
              {logged && account ? `Nv ${account.level} · ` : ""}
              {pillXp.toLocaleString("pt-BR")} XP
            </span>
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
                  +{lastGain}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {mounted && isLoggedIn && user ? (
            <Link
              href="/portal"
              className="fx-shine flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-extrabold text-[#1a1405] hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #ffdf8e)`, boxShadow: "0 4px 18px rgba(245,192,78,.35)" }}
            >
              <span className="hidden sm:inline">Oi, {(user.name || "aluno").split(" ")[0]}!</span>
              <span>Meu Portal</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Entrar
            </Link>
          )}
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
              {logged && account?.trail && (
                <Link
                  href="/portal"
                  className="glass fx-shine group inline-flex items-center gap-3 rounded-full pl-4 pr-5 py-2 mb-6 hover:opacity-95 transition-opacity"
                  style={{ borderColor: `${GOLD}55` }}
                >
                  <span className="flex gap-1" aria-hidden>
                    {Array.from({ length: account.trail.total }, (_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-3 rounded-full"
                        style={{ background: i < account.trail!.done ? GOLD : "rgba(255,255,255,.18)" }}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-bold">
                    Continuar minha trilha{" "}
                    <span style={{ color: GOLD }}>
                      ({account.trail.done} de {account.trail.total})
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-white/50 group-hover:text-white transition-colors" />
                </Link>
              )}
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
                          src={catArt(cat.id, artVariants[cat.id])}
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
              className="glass relative rounded-3xl p-5 sm:p-8"
              style={{
                borderColor: `${accent}66`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,.10), 0 18px 50px -12px ${accent}55`,
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
                {logged ? (
                  <span className="shrink-0 mt-2 text-[11px] font-bold text-white/45 whitespace-nowrap">
                    {playedIds.length}/{MAGIC_EXAMPLES.length} jogados
                  </span>
                ) : (
                  <div className="flex gap-1.5 shrink-0 mt-2">
                    {progressDots.map((done, i) => (
                      <span
                        key={i}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: done ? GOLD : "rgba(255,255,255,.15)" }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {current && (
                <div
                  className="fx-float mt-5 relative overflow-hidden rounded-2xl"
                  style={{
                    aspectRatio: "3 / 2",
                    border: `1.5px solid ${accent}55`,
                    boxShadow: `0 16px 40px -14px ${accent}44, 0 10px 26px -10px rgba(0,0,0,.65)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/landing/scenes/${current.id}.webp`}
                    alt={current.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}

              {revealed && confetti.length > 0 && (
                <span key={burst} aria-hidden className="absolute inset-x-0 top-1/3 block">
                  {confetti.map((c, i) => (
                    <span
                      key={i}
                      className="fx-conf"
                      style={{ left: c.left, background: c.color, animationDelay: c.delay,
                               ["--dx" as string]: c.dx, ["--dy" as string]: c.dy } as import("react").CSSProperties}
                    />
                  ))}
                </span>
              )}

              {!revealed ? (
                <div className="mt-6">
                  <p className="text-sm font-extrabold uppercase tracking-wider" style={{ color: accent }}>
                    {treino
                      ? "🎓 Modo treino — este exemplo já rendeu XP na sua conta"
                      : `🎯 Seu palpite vale +${XP_BONUS_ACERTO} XP`}
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold">{current.quiz.question}</p>
                  <div className="mt-3 space-y-2">
                    {current.quiz.options.map((op, idx) => (
                      <button
                        key={idx}
                        onClick={() => answerQuiz(idx)}
                        className="fx-quiz w-full text-left rounded-2xl border-2 border-white/15 bg-white/5 px-4 py-3 text-sm sm:text-base font-semibold hover:border-white/40 cursor-pointer"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-[12px] font-extrabold"
                              style={{ background: `${accent}22`, color: accent }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={false}
                  className="mt-6 space-y-4"
                >
                  {guess !== null && (
                    <div
                      className="rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2"
                      style={
                        guess === current.quiz.answer
                          ? { background: "rgba(163,230,53,.14)", color: "#a3e635", border: "2px solid rgba(163,230,53,.4)" }
                          : { background: "rgba(245,192,78,.12)", color: GOLD, border: "2px solid rgba(245,192,78,.35)" }
                      }
                    >
                      {guess === current.quiz.answer
                        ? treino
                          ? `🎯 ACERTOU! Modo treino — XP já creditado antes${combo > 1 ? ` · combo x${combo}` : ""}`
                          : `🎯 ACERTOU! +${XP_PER_EXAMPLE + XP_BONUS_ACERTO} XP${logged ? " na sua conta" : ""}${combo > 1 ? ` · combo x${combo}` : ""}`
                        : treino
                          ? `✨ Quase! A resposta era: ${current.quiz.options[current.quiz.answer]} · modo treino`
                          : `✨ Quase! A resposta era: ${current.quiz.options[current.quiz.answer]} · +${XP_PER_EXAMPLE} XP${logged ? " na sua conta" : ""}`}
                    </div>
                  )}
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
                        className="fx-shine flex-1 rounded-2xl py-3.5 font-extrabold flex items-center justify-center gap-2 cursor-pointer text-[#1a1405]"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, boxShadow: "0 10px 30px rgba(245,192,78,.3)", color: "#241a05" }}
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
                  ) : logged ? (
                    <motion.div
                      initial={false}
                      className="rounded-2xl p-5 text-center"
                      style={{ border: `2.5px solid ${GOLD}`, background: "rgba(245,192,78,.08)" }}
                    >
                      <p className="text-2xl sm:text-3xl tracking-wide" style={bebas}>
                        🏆 VOCÊ EXPLOROU TODAS AS MÁGICAS!
                      </p>
                      <p className="mt-1.5 text-sm text-white/65">
                        Cada XP está guardado na sua conta. A trilha continua no seu portal —
                        cursos, desafios e o Arcade da IA esperam por você.
                      </p>
                      <Link
                        href="/portal"
                        className="fx-magic fx-shine mt-4 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-extrabold text-[#1a1405] hover:opacity-90 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, boxShadow: "0 10px 30px rgba(245,192,78,.35)", color: "#241a05" }}
                      >
                        Continuar no meu Portal <ArrowRight size={18} />
                      </Link>
                    </motion.div>
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
                        className="fx-magic fx-shine mt-4 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-extrabold text-[#1a1405] hover:opacity-90 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #ffd97a)`, boxShadow: "0 10px 30px rgba(245,192,78,.35)", color: "#241a05" }}
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
      <section className="relative px-4 sm:px-8 pb-3 shrink-0">
        <div aria-hidden className="fx-orb" style={{ width: 300, height: 300, left: "6%", top: -60, background: "radial-gradient(circle, rgba(56,189,248,.4), transparent 65%)", animation: "fx-drift-a 11s ease-in-out infinite" }} />
        <div aria-hidden className="fx-orb" style={{ width: 260, height: 260, right: "10%", top: 30, background: "radial-gradient(circle, rgba(244,114,182,.35), transparent 65%)", animation: "fx-drift-b 13s ease-in-out infinite" }} />
        <div aria-hidden className="fx-orb" style={{ width: 240, height: 240, left: "44%", top: 60, background: "radial-gradient(circle, rgba(167,139,250,.35), transparent 65%)", animation: "fx-drift-a 15s ease-in-out infinite reverse" }} />
        <div className="relative max-w-5xl mx-auto">
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
                  className="glass glass-hover group rounded-2xl overflow-hidden"
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
              { href: "/projetos", icon: Rocket, label: "Projetos", desc: "O ecossistema FayAI e a história por trás", color: "#f472b6" },
              { href: "/noticias", icon: BookOpen, label: "IA Hoje", desc: "Notícias de IA explicadas todo dia", color: "#a3e635" },
            ].map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className="glass glass-hover group rounded-2xl px-4 py-3 flex items-center gap-3"
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

      {/* Toast de crédito — prova visível de que o esforço foi guardado (P0) */}
      <AnimatePresence>
        {creditMsg && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #f5c04e, #ffd97a)",
              color: "#241a05",
              boxShadow: "0 14px 40px rgba(245,192,78,.45)",
              maxWidth: "min(92vw, 440px)",
            }}
            role="status"
          >
            <Sparkles size={18} className="shrink-0" />
            <p className="text-sm font-bold leading-snug">{creditMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
