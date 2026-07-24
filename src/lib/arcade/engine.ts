"use client";

/**
 * Arcade Engine — a base compartilhada dos minigames (24/07/2026).
 *
 * Por que existe: até 21/07 os 5 "jogos" do Arcade eram o MESMO quiz com pele
 * diferente (deck → clica opção → explicação → próxima → placar). Nenhum tinha
 * tempo, risco, combo ou gesto. Esta engine dá os ingredientes que faltavam,
 * uma vez só, para que cada jogo possa ter o seu próprio VERBO (deslizar,
 * deduzir, apostar, montar) sem duplicar cronômetro e placar em 5 arquivos.
 *
 * Regras de robustez aprendidas no projeto:
 *  - aba oculta PAUSA o relógio (senão o jogador volta e já perdeu — e o
 *    histórico do repo tem bug de animação congelada em aba oculta);
 *  - o tempo é medido por timestamp real, não por soma de ticks, porque
 *    setInterval atrasa quando a aba perde prioridade;
 *  - respeita prefers-reduced-motion (quem desliga animação recebe o jogo
 *    inteiro, só sem os efeitos).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Preferência de movimento                                            */
/* ------------------------------------------------------------------ */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Relógio de partida                                                  */
/* ------------------------------------------------------------------ */

export interface GameClock {
  /** segundos restantes (float, para animar suave) */
  remaining: number;
  /** 0 → 1 (quanto já correu) */
  progress: number;
  running: boolean;
  expired: boolean;
  start: () => void;
  pause: () => void;
  reset: (seconds?: number) => void;
  /** penalidade (negativo) ou bônus (positivo), em segundos */
  addTime: (delta: number) => void;
}

export function useGameClock(totalSeconds: number, onExpire?: () => void): GameClock {
  const [total, setTotal] = useState(totalSeconds);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [expired, setExpired] = useState(false);

  // Marca de tempo real: setInterval não é confiável como cronômetro (o
  // navegador estrangula timers em aba de segundo plano), então cada tick
  // recalcula a partir de performance.now() em vez de subtrair 100ms.
  const deadlineRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  // Atualizar a ref em efeito, não no corpo do render: mexer em ref.current
  // durante o render é proibido pelas regras de hooks (e quebra em modo
  // concorrente, onde o render pode ser descartado).
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const start = useCallback(() => {
    setRunning((wasRunning) => {
      if (wasRunning) return true;
      setRemaining((secondsLeft) => {
        deadlineRef.current = performance.now() + secondsLeft * 1000;
        return secondsLeft;
      });
      return true;
    });
  }, []);

  const pause = useCallback(() => {
    setRunning(false);
    if (deadlineRef.current !== null) {
      const left = Math.max(0, (deadlineRef.current - performance.now()) / 1000);
      setRemaining(left);
      deadlineRef.current = null;
    }
  }, []);

  const reset = useCallback((seconds?: number) => {
    const next = seconds ?? total;
    setTotal(next);
    setRemaining(next);
    setRunning(false);
    setExpired(false);
    deadlineRef.current = null;
  }, [total]);

  const addTime = useCallback((delta: number) => {
    if (deadlineRef.current !== null) {
      deadlineRef.current += delta * 1000;
      setRemaining(Math.max(0, (deadlineRef.current - performance.now()) / 1000));
    } else {
      setRemaining((secondsLeft) => Math.max(0, secondsLeft + delta));
    }
  }, []);

  // Loop de animação — para quando a aba some (ver comentário do topo).
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      if (deadlineRef.current === null) return;
      const left = (deadlineRef.current - performance.now()) / 1000;
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        setExpired(true);
        deadlineRef.current = null;
        onExpireRef.current?.();
        return;
      }
      setRemaining(left);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  // Aba oculta congela a partida em vez de deixar o tempo correr sozinho.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && deadlineRef.current !== null) {
        pause();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  return {
    remaining,
    progress: total > 0 ? 1 - remaining / total : 1,
    running,
    expired,
    start,
    pause,
    reset,
    addTime,
  };
}

/* ------------------------------------------------------------------ */
/* Combo / sequência                                                   */
/* ------------------------------------------------------------------ */

export interface Combo {
  streak: number;
  best: number;
  /** 1x, 2x, 3x, 4x — cresce a cada 3 acertos seguidos, teto em 4 */
  multiplier: number;
  hit: () => number;
  miss: () => void;
  reset: () => void;
}

export function comboMultiplier(streak: number): number {
  if (streak >= 9) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function useCombo(): Combo {
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const hit = useCallback(() => {
    let next = 0;
    setStreak((current) => {
      next = current + 1;
      setBest((b) => Math.max(b, next));
      return next;
    });
    return comboMultiplier(streak + 1);
  }, [streak]);

  const miss = useCallback(() => setStreak(0), []);
  const reset = useCallback(() => {
    setStreak(0);
    setBest(0);
  }, []);

  return { streak, best, multiplier: comboMultiplier(streak), hit, miss, reset };
}

/* ------------------------------------------------------------------ */
/* Recorde local (sem conta, sem servidor)                             */
/* ------------------------------------------------------------------ */

/**
 * Guarda o recorde no localStorage. O Arcade é público (sem cadastro), então
 * o "melhor de todos os tempos" do visitante mora no navegador dele — é o que
 * dá a alguém motivo para jogar de novo antes de ter conta.
 */
export function useHighScore(key: string): [number, (score: number) => boolean] {
  const [high, setHigh] = useState(0);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`fayai_hs_${key}`);
      if (stored) setHigh(Number(stored) || 0);
    } catch {
      /* localStorage bloqueado (modo privado) — recorde só não persiste */
    }
  }, [key]);

  const submit = useCallback(
    (score: number) => {
      if (score <= high) return false;
      setHigh(score);
      try {
        window.localStorage.setItem(`fayai_hs_${key}`, String(score));
      } catch {
        /* idem */
      }
      return true;
    },
    [high, key]
  );

  return [high, submit];
}

/* ------------------------------------------------------------------ */
/* Pontuação                                                           */
/* ------------------------------------------------------------------ */

export interface ScoreEvent {
  id: number;
  value: number;
  label?: string;
}

/** Placar com fila de "+120" flutuantes para o feedback visual. */
export function useScore() {
  const [score, setScore] = useState(0);
  const [events, setEvents] = useState<ScoreEvent[]>([]);
  const idRef = useRef(0);

  const award = useCallback((value: number, label?: string) => {
    setScore((current) => Math.max(0, current + value));
    const id = ++idRef.current;
    setEvents((current) => [...current, { id, value, label }]);
    window.setTimeout(() => {
      setEvents((current) => current.filter((e) => e.id !== id));
    }, 900);
  }, []);

  const reset = useCallback(() => {
    setScore(0);
    setEvents([]);
  }, []);

  return { score, events, award, reset, setScore };
}

/* ------------------------------------------------------------------ */
/* Vibração (celular)                                                  */
/* ------------------------------------------------------------------ */

export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* navegador sem suporte — silencioso de propósito */
  }
}

export const HAPTIC = {
  hit: 12,
  miss: [8, 40, 8] as number[],
  win: [10, 30, 10, 30, 24] as number[],
} as const;

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  return safe < 10 ? safe.toFixed(1) : String(Math.ceil(safe));
}
