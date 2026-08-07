"use client";
import { useT } from "@/i18n/dicionario";

/**
 * VERDADE OU MITO — verbo: DESLIZAR (reagir rápido sob pressão).
 *
 * Reescrito em 24/07/2026. Antes era o mesmo quiz dos outros 4 jogos: carta →
 * clica um de dois botões → lê explicação → "Próxima" → placar 10/10. Sem
 * tempo, sem risco, sem gesto.
 *
 * Agora: pilha de cartas, 60 segundos no relógio, arrasta para a direita
 * (VERDADE) ou esquerda (MITO). Acerto dá pontos multiplicados pelo combo e
 * devolve 1s; erro custa 3s e zera o combo. A partida acaba no tempo, não numa
 * contagem fixa — então "quantas dá pra fazer" vira a pergunta, e o recorde
 * local dá motivo pra jogar de novo.
 *
 * Pedagogia: explicar cada carta no meio da corrida mataria o ritmo, então as
 * explicações das cartas ERRADAS são reunidas na tela final — revisar o erro
 * ensina mais do que ler o acerto, e não atrapalha o jogo.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, Play, RefreshCw, X, Zap } from "lucide-react";
import { TRUTH_CARDS } from "@/data/games/verdade-mito";
import { useRotatingDeck } from "@/lib/game-rotation";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";
import { VocabularyChip } from "@/components/portal/games/GameLearning";
import {
  HAPTIC,
  haptic,
  useCombo,
  useGameClock,
  useHighScore,
  useReducedMotion,
  useScore,
} from "@/lib/arcade/engine";
import { GameHud, ScorePops, StartCountdown } from "@/components/portal/games/fx/ArcadeHud";

const MATCH_SECONDS = 60;
const DECK_SIZE = 24;
const BASE_POINTS = 100;
const TIME_BONUS = 1;
const TIME_PENALTY = 3;
const SWIPE_THRESHOLD = 90;

type Phase = "idle" | "countdown" | "playing" | "over";
type CardResult = { statement: string; explanation: string; wasTrue: boolean };

export function VerdadeOuMito() {
  const T = useT();
  const { deck, rotate } = useRotatingDeck(TRUTH_CARDS, DECK_SIZE, "fayai_seen_verdade_mito");
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState<CardResult[]>([]);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const { score, events, award, reset: resetScore } = useScore();
  const combo = useCombo();
  const [high, submitHigh] = useHighScore("verdade_mito");
  const [isRecord, setIsRecord] = useState(false);

  const finish = useCallback(() => {
    setPhase("over");
    haptic(HAPTIC.win);
  }, []);

  const clock = useGameClock(MATCH_SECONDS, finish);
  const card = deck[index];

  // Fecha a partida quando o placar final é conhecido (tempo ou fim do baralho).
  useEffect(() => {
    if (phase === "over") setIsRecord(submitHigh(score));
    // submitHigh muda a cada recorde novo; só queremos rodar na virada de fase
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const begin = useCallback(() => {
    rotate();
    setIndex(0);
    setHits(0);
    setMisses([]);
    resetScore();
    combo.reset();
    setIsRecord(false);
    clock.reset(MATCH_SECONDS);
    setPhase("countdown");

    let n = 3;
    setCountdown(n);
    const id = window.setInterval(() => {
      n -= 1;
      if (n < 0) {
        window.clearInterval(id);
        setCountdown(null);
        setPhase("playing");
        clock.start();
        return;
      }
      setCountdown(n);
    }, 620);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotate, resetScore]);

  const answer = useCallback(
    (saidTrue: boolean) => {
      if (phase !== "playing" || !card) return;
      const right = saidTrue === card.isTrue;

      if (right) {
        const multiplier = combo.hit();
        award(BASE_POINTS * multiplier, multiplier > 1 ? `×${multiplier}` : undefined);
        clock.addTime(TIME_BONUS);
        setHits((h) => h + 1);
        setFlash("hit");
        haptic(HAPTIC.hit);
      } else {
        combo.miss();
        clock.addTime(-TIME_PENALTY);
        setMisses((m) => [
          ...m,
          { statement: card.statement, explanation: card.explanation, wasTrue: card.isTrue },
        ]);
        setFlash("miss");
        haptic(HAPTIC.miss);
      }

      window.setTimeout(() => setFlash(null), 260);

      if (index + 1 >= deck.length) {
        clock.pause();
        finish();
      } else {
        setIndex((i) => i + 1);
      }
    },
    [phase, card, combo, award, clock, index, deck.length, finish]
  );

  /* ----------------------------- telas ----------------------------- */

  if (phase === "idle") {
    return (
      <div className="py-8 text-center">
        <motion.div
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto max-w-sm"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/12 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
            <Zap size={12} /> 60 segundos
          </span>
          <h3 className="mt-3 text-2xl font-black">{T("Deslize rápido")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            
            {T("Arraste para a")} <strong className="text-lime-300">direita</strong>  {T("se for verdade, para a")}{" "}
            <strong className="text-rose-300">esquerda</strong>  {T("se for mito. Acerto seguido vale mais,\r\n            erro custa")} {TIME_PENALTY} segundos.
          </p>
          {high > 0 && (
            <p className="mt-3 text-xs font-bold text-amber-300">{T("Seu recorde:")} {high}  {T("pontos")}</p>
          )}
          <button
            onClick={begin}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-7 py-3 text-base font-black text-[#241a05] transition-transform hover:scale-[1.04]"
          >
            <Play size={16} strokeWidth={3} />  {T("Começar")}
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === "over") {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-7 text-center"
      >
        {isRecord && (
          <motion.p
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-1 text-sm font-black uppercase tracking-widest text-lime-300"
          >
            
            {T("★ Novo recorde ★")}
          </motion.p>
        )}
        <p className="text-6xl font-black text-amber-400">{score}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {hits} acerto{hits === 1 ? "" : "s"}  {T("· melhor sequência:")} {combo.best}
          {high > 0 && !isRecord && ` · recorde: ${high}`}
        </p>

        {misses.length > 0 && (
          <div className="mx-auto mt-5 max-w-md space-y-2 text-left">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Revise o que escapou
            </p>
            {misses.slice(0, 4).map((miss, i) => (
              <div
                key={i}
                className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm"
              >
                <p className="font-bold leading-snug">{T(miss.statement)}</p>
                <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-rose-300">
                  Era {miss.wasTrue ? "verdade" : "mito"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {T(miss.explanation)}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={begin}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-6 py-2.5 text-sm font-black text-[#241a05] transition-transform hover:scale-[1.04]"
        >
          <RefreshCw size={14} />  {T("Jogar de novo")}
        </button>

        <div className="mx-auto mt-3 max-w-md text-left">
          <PersonaFisher source="verdade-mito" />
        </div>
      </motion.div>
    );
  }

  /* --------------------------- em partida --------------------------- */

  return (
    <div className="relative">
      <GameHud
        remaining={clock.remaining}
        progress={clock.progress}
        score={score}
        high={high}
        streak={combo.streak}
        multiplier={combo.multiplier}
      />

      <div className="relative h-[330px] select-none">
        <ScorePops events={events} />
        <StartCountdown value={countdown} />

        {/* Cartas de trás — dão sensação de pilha e de progresso */}
        {[2, 1].map((depth) => {
          const behind = deck[index + depth];
          if (!behind) return null;
          return (
            <div
              key={behind.id}
              className="absolute inset-x-0 top-0 mx-auto rounded-2xl border border-white/10 bg-[#161a36]/40"
              style={{
                height: 300,
                transform: `translateY(${depth * 9}px) scale(${1 - depth * 0.04})`,
                opacity: 0.5 - depth * 0.16,
              }}
            />
          );
        })}

        <AnimatePresence mode="popLayout">
          {card && phase === "playing" && (
            <SwipeCard
              key={card.id}
              card={card}
              onAnswer={answer}
              reduced={reduced}
              flash={flash}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={() => answer(false)}
          aria-label="Responder mito"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 px-6 py-3 font-black text-white transition-transform hover:scale-[1.05] active:scale-95"
        >
          <X size={17} strokeWidth={3} /> Mito
        </button>
        <button
          onClick={() => answer(true)}
          aria-label="Responder verdade"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-200 px-6 py-3 font-black text-[#0c2a12] transition-transform hover:scale-[1.05] active:scale-95"
        >
          <Check size={17} strokeWidth={3} /> Verdade
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        
        {T("ou arraste a carta para o lado")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carta arrastável                                                    */
/* ------------------------------------------------------------------ */

function SwipeCard({
  card,
  onAnswer,
  reduced,
  flash,
}: {
  card: (typeof TRUTH_CARDS)[number];
  onAnswer: (saidTrue: boolean) => void;
  reduced: boolean;
  flash: "hit" | "miss" | null;
}) {
  const T = useT();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);
  const trueOpacity = useTransform(x, [30, 130], [0, 1]);
  const mythOpacity = useTransform(x, [-130, -30], [1, 0]);
  const borderColor = useTransform(
    x,
    [-130, 0, 130],
    ["rgba(244,114,118,.75)", "rgba(255,255,255,.14)", "rgba(163,230,53,.75)"]
  );

  const [exitX, setExitX] = useState(0);

  return (
    <motion.div
      style={{ x, rotate, borderColor }}
      drag={reduced ? false : "x"}
      dragElastic={0.55}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) {
          setExitX(420);
          onAnswer(true);
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          setExitX(-420);
          onAnswer(false);
        }
      }}
      initial={reduced ? false : { scale: 0.92, opacity: 0, y: 12 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow:
          flash === "hit"
            ? "0 0 0 3px rgba(163,230,53,.55)"
            : flash === "miss"
              ? "0 0 0 3px rgba(244,114,118,.55)"
              : "0 18px 40px rgba(0,0,0,.35)",
      }}
      exit={reduced ? { opacity: 0 } : { x: exitX, opacity: 0, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="absolute inset-x-0 top-0 mx-auto h-[300px] cursor-grab overflow-hidden rounded-2xl border-2 bg-[#161a36]/85 active:cursor-grabbing"
    >
      {/* Selos que aparecem conforme você arrasta */}
      <motion.span
        style={{ opacity: trueOpacity }}
        className="pointer-events-none absolute left-4 top-4 z-20 rotate-[-14deg] rounded-lg border-[3px] border-lime-400 px-3 py-1 text-lg font-black uppercase tracking-wider text-lime-400"
      >
        Verdade
      </motion.span>
      <motion.span
        style={{ opacity: mythOpacity }}
        className="pointer-events-none absolute right-4 top-4 z-20 rotate-[14deg] rounded-lg border-[3px] border-rose-400 px-3 py-1 text-lg font-black uppercase tracking-wider text-rose-400"
      >
        Mito
      </motion.span>

      {card.art && (
        <div className="relative h-[150px] overflow-hidden bg-[#0c0e1d]">
          <img src={card.art} alt="" className="h-full w-full object-cover" draggable={false} />
          <span className="absolute inset-0 bg-gradient-to-t from-[#161a36] via-transparent to-transparent" />
        </div>
      )}

      <div className="flex h-[150px] flex-col justify-center px-5 text-center">
        <p className="text-base font-bold leading-snug sm:text-lg">{T(card.statement)}</p>
        <div className="mt-2">
          <VocabularyChip term={card.term} />
        </div>
      </div>
    </motion.div>
  );
}
