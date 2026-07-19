"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import {
  CATEGORIES,
  MAGIC_EXAMPLES,
  XP_PER_EXAMPLE,
  XP_BONUS_ACERTO,
  type ExampleCategory,
  type MagicExample,
} from "@/data/landing/examples";
import { FxConfetti } from "@/components/portal/games/GameLearning";

/**
 * Palpite em 30 Segundos — versão do Arcade (Fase 0.1 do MASTERPLAN, 16/07).
 * Mesmo jogo da landing, jogável DENTRO do portal: XP creditado direto na
 * conta via /api/gate/claim-xp (idempotente por exampleId — re-jogar vira
 * modo treino, sem re-farm). Cena-espelho §9 + quiz de palpite.
 */

const catArt = (id: ExampleCategory) => `/landing/cats/${id}-v1.webp`;

export function PalpiteGame() {
  const posthog = usePostHog();
  const [playedIds, setPlayedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState<ExampleCategory | null>(null);
  const [current, setCurrent] = useState<MagicExample | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [treino, setTreino] = useState(false);
  const [creditMsg, setCreditMsg] = useState<string | null>(null);
  const [seenNow, setSeenNow] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/gate/claim-xp", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s?.playedIds) setPlayedIds(s.playedIds); })
      .catch(() => { /* estado indisponível — o POST segue idempotente */ })
      .finally(() => setLoaded(true));
  }, []);

  const novosNaCategoria = useMemo(() => {
    const map = {} as Record<ExampleCategory, number>;
    for (const c of CATEGORIES) {
      map[c.id] = MAGIC_EXAMPLES.filter(
        (e) => e.category === c.id && !playedIds.includes(e.id)
      ).length;
    }
    return map;
  }, [playedIds]);

  const pick = (cat: ExampleCategory) => {
    const fresh = MAGIC_EXAMPLES.filter(
      (e) => e.category === cat && !playedIds.includes(e.id) && !seenNow.includes(e.id)
    );
    const pool = fresh.length
      ? fresh
      : MAGIC_EXAMPLES.filter((e) => e.category === cat && !seenNow.includes(e.id));
    const source = pool.length ? pool : MAGIC_EXAMPLES.filter((e) => e.category === cat);
    const ex = source[Math.floor(Math.random() * source.length)];
    setCategory(cat);
    setCurrent(ex);
    setGuess(null);
    setRevealed(false);
    setCopied(false);
    setTreino(playedIds.includes(ex.id));
    posthog?.capture("minigame_start", { game: "palpite-30s", category: cat, example_id: ex.id });
  };

  const answer = (idx: number) => {
    if (!current || revealed) return;
    const acertou = idx === current.quiz.answer;
    setGuess(idx);
    setRevealed(true);
    setSeenNow((s) => (s.includes(current.id) ? s : [...s, current.id]));
    posthog?.capture("minigame_complete", {
      game: "palpite-30s",
      category: current.category,
      example_id: current.id,
      correct: acertou,
      treino: playedIds.includes(current.id),
    });

    if (playedIds.includes(current.id)) return; // treino: sem re-farm

    fetch("/api/gate/claim-xp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exampleId: current.id, acertou, category: current.category }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.credited || res?.reason === "already-credited") {
          setPlayedIds((ids) => (ids.includes(current.id) ? ids : [...ids, current.id]));
        }
        if (res?.credited) {
          setCreditMsg(`+${res.xp} XP creditados na sua conta ✨`);
          setTimeout(() => setCreditMsg(null), 3000);
        }
      })
      .catch(() => { /* servidor idempotente — próxima jogada tenta de novo */ });
  };

  const acertou = revealed && current !== null && guess === current.quiz.answer;

  /* ── Tela 1: escolher categoria ── */
  if (!current) {
    return (
      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          Escolha um tema, veja a mágica e dê seu palpite — cada exemplo novo vale{" "}
          <span className="font-bold text-amber-400">+{XP_PER_EXAMPLE} XP</span>
          {" "}(+{XP_BONUS_ACERTO} se acertar).
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => pick(cat.id)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-1 hover:border-amber-400/40"
            >
              <span className="block relative overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={catArt(cat.id)}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="flex items-center justify-between gap-2 p-3">
                <span className="text-sm font-bold">{cat.emoji} {cat.label}</span>
                {loaded && (
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {novosNaCategoria[cat.id] > 0 ? `${novosNaCategoria[cat.id]} novos` : "treino"}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Tela 2: exemplo + palpite ── */
  return (
    <div className="relative">
      <FxConfetti active={acertou && !treino} />
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCurrent(null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} /> Temas
        </button>
        {treino && (
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Modo treino — XP já creditado antes
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/25" style={{ aspectRatio: "3 / 2" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- cena-espelho §9 */}
            <img src={`/landing/scenes/${current.id}.webp`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <p className="mt-2 text-center text-sm font-bold">{current.emoji} {current.title}</p>
        </div>

        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">{current.hook}</p>

          <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-amber-300">{current.quiz.question}</p>
          <div className="mt-2 space-y-2">
            {current.quiz.options.map((opt, i) => {
              const isAnswer = i === current.quiz.answer;
              const isGuess = guess === i;
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={revealed}
                  className="w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition"
                  style={{
                    borderColor: revealed ? (isAnswer ? "#a3e635" : isGuess ? "#f47276" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.14)",
                    background: revealed && isAnswer ? "rgba(163,230,53,.1)" : revealed && isGuess ? "rgba(244,114,118,.08)" : "rgba(22,26,54,.42)",
                  }}
                >
                  {revealed && isAnswer && <Check size={14} className="mr-1.5 inline text-lime-400" />}
                  {opt}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {revealed && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: acertou ? "#a3e635" : "#f47276" }}>
                  {acertou ? (treino ? "Acertou! (treino)" : `Acertou! +${XP_PER_EXAMPLE + XP_BONUS_ACERTO} XP`) : treino ? "Quase!" : `Quase! +${XP_PER_EXAMPLE} XP mesmo assim`}
                </p>
                <div className="mt-3 rounded-2xl border border-border bg-secondary/50 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">O prompt que faz a mágica</p>
                  <p className="mt-1.5 font-mono text-xs leading-relaxed text-foreground/90">{current.prompt}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(current.prompt);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch { /* clipboard indisponível */ }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copied ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />} {copied ? "Copiado!" : "Copiar prompt"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-lime-300">O que a IA devolve</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{current.result}</p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground"><Sparkles size={12} className="mr-1 inline text-amber-400" />{current.apply}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => category && pick(category)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]"
                  >
                    Outro exemplo <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setCurrent(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold text-muted-foreground"
                  >
                    Trocar tema
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {creditMsg && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm font-bold text-amber-300">
                {creditMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
