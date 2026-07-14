"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ARCADE_GAME_IDS = [
  "monte-o-prompt",
  "verdade-ou-mito",
  "qual-prompt",
  "palpite-30s",
  "batalha-prompts",
  "caca-prompt",
] as const;

export type ArcadeGameId = (typeof ARCADE_GAME_IDS)[number];

const VARIANT_COUNT = 8;

function pickDifferent(previous: number, count: number) {
  if (count < 2) return 1;
  const offset = Math.floor(Math.random() * (count - 1)) + 1;
  return ((Math.max(previous, 1) - 1 + offset) % count) + 1;
}

function variantPath(gameId: ArcadeGameId, variant: number) {
  return `/portal/arcade/variants/${gameId}/variant-${String(variant).padStart(2, "0")}.webp`;
}

interface ArcadeVisualProps {
  gameId: ArcadeGameId;
  alt: string;
  className?: string;
  imageClassName?: string;
  active?: boolean;
  video?: boolean;
  eager?: boolean;
}

/**
 * Selects one of eight ComfyUI scenes without repeating the last scene seen for
 * that game. Hovering advances the still and reveals the lightweight motion loop.
 */
export function ArcadeVisual({
  gameId,
  alt,
  className,
  imageClassName,
  active = false,
  video = true,
  eager = false,
}: ArcadeVisualProps) {
  const reduceMotion = useReducedMotion();
  const [variant, setVariant] = useState(1);
  const [hovered, setHovered] = useState(false);

  const advance = useCallback(() => {
    setVariant((current) => {
      const next = pickDifferent(current, VARIANT_COUNT);
      try {
        localStorage.setItem(`fayai:arcade-visual:${gameId}`, String(next));
      } catch {
        // Storage can be disabled; visual rotation still works in memory.
      }
      return next;
    });
  }, [gameId]);

  useEffect(() => {
    let previous = 1;
    try {
      previous = Number(localStorage.getItem(`fayai:arcade-visual:${gameId}`)) || 1;
    } catch {
      // Keep the deterministic server fallback when storage is unavailable.
    }
    const next = pickDifferent(previous, VARIANT_COUNT);
    setVariant(next);
    try {
      localStorage.setItem(`fayai:arcade-visual:${gameId}`, String(next));
    } catch {
      // Non-critical enhancement.
    }
  }, [gameId]);

  const showVideo = video && !reduceMotion && (active || hovered);

  return (
    <span
      className={cn("relative block overflow-hidden bg-[#0c0e1d]", className)}
      onPointerEnter={() => {
        setHovered(true);
        advance();
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={`${gameId}-${variant}`}
          src={variantPath(gameId, variant)}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.35 }}
          className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
        />
      </AnimatePresence>
      <AnimatePresence>
        {showVideo && (
          <motion.video
            key={`${gameId}-loop`}
            src={`/portal/arcade/loops/${gameId}.webm`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

export function RandomArcadeVisual(props: Omit<ArcadeVisualProps, "gameId">) {
  const [gameId, setGameId] = useState<ArcadeGameId>(ARCADE_GAME_IDS[0]);

  useEffect(() => {
    let previous = -1;
    try {
      previous = Number(sessionStorage.getItem("fayai:arcade-hero-game"));
    } catch {
      // Session storage is an optional no-repeat enhancement.
    }
    const next = pickDifferent(previous + 1, ARCADE_GAME_IDS.length) - 1;
    setGameId(ARCADE_GAME_IDS[next]);
    try {
      sessionStorage.setItem("fayai:arcade-hero-game", String(next));
    } catch {
      // Non-critical enhancement.
    }
  }, []);

  return <ArcadeVisual {...props} gameId={gameId} />;
}

