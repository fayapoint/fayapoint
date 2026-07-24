"use client";

/**
 * HUD compartilhado do Arcade (24/07/2026) — cronômetro, combo, placar e os
 * efeitos que dão "peso" à ação. Os 5 jogos usam estas peças, então o feedback
 * é consistente entre eles mesmo tendo mecânicas (verbos) diferentes.
 *
 * Tudo aqui respeita prefers-reduced-motion: quem desliga animação continua
 * vendo número, barra e cor — só não vê o movimento.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { formatClock, useReducedMotion, type ScoreEvent } from "@/lib/arcade/engine";

const GOLD = "#f5c04e";
const LIME = "#a3e635";
const ROSE = "#f47276";

/* ------------------------------------------------------------------ */
/* Barra de tempo                                                      */
/* ------------------------------------------------------------------ */

export function TimerBar({ remaining, progress }: { remaining: number; progress: number }) {
  const reduced = useReducedMotion();
  const urgent = remaining <= 10;
  const critical = remaining <= 5;

  return (
    <div className="flex items-center gap-2">
      <Timer size={14} className={urgent ? "text-rose-400" : "text-white/45"} />
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${Math.max(0, (1 - progress) * 100)}%`,
            background: urgent
              ? `linear-gradient(90deg, ${ROSE}, #fb923c)`
              : `linear-gradient(90deg, ${LIME}, ${GOLD})`,
          }}
          animate={critical && !reduced ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={critical && !reduced ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
        />
      </div>
      <span
        className="min-w-[3ch] text-right text-sm font-extrabold tabular-nums"
        style={{ color: urgent ? ROSE : "rgba(255,255,255,.75)" }}
      >
        {formatClock(remaining)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Medidor de combo                                                    */
/* ------------------------------------------------------------------ */

export function ComboMeter({ streak, multiplier }: { streak: number; multiplier: number }) {
  const reduced = useReducedMotion();
  const active = multiplier > 1;

  return (
    <AnimatePresence>
      {streak > 0 && (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 0.8 }}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{
            background: active ? "rgba(245,192,78,.16)" : "rgba(255,255,255,.07)",
            color: active ? GOLD : "rgba(255,255,255,.6)",
            border: `1px solid ${active ? "rgba(245,192,78,.4)" : "rgba(255,255,255,.12)"}`,
          }}
        >
          <motion.span
            animate={active && !reduced ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.5, repeat: active && !reduced ? Infinity : 0, repeatDelay: 0.8 }}
            className="inline-flex"
          >
            <Flame size={12} />
          </motion.span>
          {streak} seguidos
          {active && <span className="ml-0.5 rounded bg-amber-400/25 px-1">×{multiplier}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Pontos flutuantes ("+120")                                          */
/* ------------------------------------------------------------------ */

export function ScorePops({ events }: { events: ScoreEvent[] }) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center">
      <AnimatePresence>
        {events.map((event) => (
          <motion.span
            key={event.id}
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: -34, scale: 1 }}
            exit={{ opacity: 0, y: -52 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="absolute whitespace-nowrap text-2xl font-black drop-shadow-lg"
            style={{ color: event.value >= 0 ? GOLD : ROSE }}
          >
            {event.value >= 0 ? `+${event.value}` : event.value}
            {event.label && <span className="ml-1 text-xs font-bold opacity-80">{event.label}</span>}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Placar                                                              */
/* ------------------------------------------------------------------ */

export function ScoreBadge({ score, high }: { score: number; high?: number }) {
  const reduced = useReducedMotion();
  const beating = high !== undefined && high > 0 && score > high;

  return (
    <div className="flex items-center gap-2">
      <motion.span
        key={score}
        initial={reduced ? false : { scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className="text-xl font-black tabular-nums"
        style={{ color: GOLD }}
      >
        {score}
      </motion.span>
      {high !== undefined && high > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: beating ? LIME : "rgba(255,255,255,.4)" }}
        >
          <Trophy size={10} /> {beating ? "recorde!" : high}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Caixa que treme no erro                                             */
/* ------------------------------------------------------------------ */

export function ShakeBox({
  shake,
  children,
  className,
}: {
  shake: unknown;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={String(shake)}
      animate={shake && !reduced ? { x: [0, -9, 8, -5, 0] } : {}}
      transition={{ duration: 0.32 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Contagem regressiva de largada                                      */
/* ------------------------------------------------------------------ */

export function StartCountdown({ value }: { value: number | null }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {value !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-[#0c0e1d]/85 backdrop-blur-sm"
        >
          <motion.span
            key={value}
            initial={reduced ? false : { scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.34 }}
            className="text-7xl font-black"
            style={{ color: value === 0 ? LIME : GOLD }}
          >
            {value === 0 ? "JÁ!" : value}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Cabeçalho de partida (junta tudo)                                   */
/* ------------------------------------------------------------------ */

export function GameHud({
  remaining,
  progress,
  score,
  high,
  streak,
  multiplier,
}: {
  remaining: number;
  progress: number;
  score: number;
  high?: number;
  streak: number;
  multiplier: number;
}) {
  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <ScoreBadge score={score} high={high} />
        <ComboMeter streak={streak} multiplier={multiplier} />
      </div>
      <TimerBar remaining={remaining} progress={progress} />
    </div>
  );
}
