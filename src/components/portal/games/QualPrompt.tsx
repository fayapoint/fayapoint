"use client";

/**
 * QUAL PROMPT GEROU ISTO? — verbo: DEDUZIR (perceber antes dos outros).
 *
 * Reescrito em 24/07/2026. Antes: imagem nítida + 3 opções + clique + "Próxima".
 * Como a imagem já entregava tudo de cara, não havia decisão — só reconhecimento.
 *
 * Agora a imagem entra COMPLETAMENTE DESFOCADA e vai ganhando foco ao longo de
 * ~14 segundos. Os pontos caem junto com o desfoque: arriscar cedo, quando só
 * dá para ver massas de cor, vale até 240; esperar a imagem limpar vale 40.
 * Isso cria a tensão de "eu já sei o bastante ou espero mais um segundo?" —
 * risco e recompensa em vez de reconhecimento.
 *
 * Pedagogicamente é melhor também: obriga a ler composição, paleta e cena
 * (que é o que um prompt de imagem realmente descreve) em vez de conferir
 * detalhes já óbvios.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Eye, Play, RefreshCw, X } from "lucide-react";
import { PROMPT_ROUNDS } from "@/data/games/qual-prompt";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";
import {
  HAPTIC,
  haptic,
  useGameClock,
  useHighScore,
  useReducedMotion,
} from "@/lib/arcade/engine";

const ROUND_COUNT = 8;
const REVEAL_SECONDS = 14;
const MAX_BLUR = 34;
const MAX_POINTS = 240;
const MIN_POINTS = 40;

type Phase = "idle" | "watching" | "revealed" | "over";

/** Pontos disponíveis agora — decrescem conforme a imagem foca. */
function pointsFor(progress: number): number {
  const value = MAX_POINTS - (MAX_POINTS - MIN_POINTS) * progress;
  return Math.max(MIN_POINTS, Math.round(value / 10) * 10);
}

export function QualPrompt() {
  const { deck, rotate } = useRotatingDeck(PROMPT_ROUNDS, ROUND_COUNT, "fayai_seen_qual_prompt");
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [gained, setGained] = useState(0);
  const [lockedProgress, setLockedProgress] = useState(0);

  const [high, submitHigh] = useHighScore("qual_prompt");
  const [isRecord, setIsRecord] = useState(false);

  const timeUp = useCallback(() => {
    // Acabou o tempo sem palpite: revela sem pontos.
    setAnswer(-1);
    setGained(0);
    setLockedProgress(1);
    setPhase("revealed");
    haptic(HAPTIC.miss);
  }, []);

  const clock = useGameClock(REVEAL_SECONDS, timeUp);
  const round = deck[index];

  useEffect(() => {
    if (phase === "over") setIsRecord(submitHigh(score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Desfoque e pontos acompanham o relógio da rodada.
  const progress = phase === "watching" ? clock.progress : lockedProgress;
  const blur = reduced ? 0 : MAX_BLUR * Math.pow(1 - progress, 1.6);
  const livePoints = pointsFor(progress);

  const startRound = useCallback(
    (roundIndex: number) => {
      if (!deck[roundIndex]) return;
      setAnswer(null);
      setGained(0);
      setLockedProgress(0);
      setPhase("watching");
      clock.reset(REVEAL_SECONDS);
      clock.start();
    },
    [deck, clock]
  );

  const begin = useCallback(() => {
    rotate();
    setIndex(0);
    setScore(0);
    setHits(0);
    setIsRecord(false);
    startRound(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotate]);

  const choose = useCallback(
    (option: number) => {
      if (phase !== "watching" || !round) return;
      const frozen = clock.progress;
      clock.pause();
      setLockedProgress(frozen);
      setAnswer(option);

      const right = option === round.correct;
      const earned = right ? pointsFor(frozen) : 0;
      setGained(earned);
      if (right) {
        setScore((current) => current + earned);
        setHits((h) => h + 1);
      }
      setPhase("revealed");
      haptic(right ? HAPTIC.hit : HAPTIC.miss);
    },
    [phase, round, clock]
  );

  const next = useCallback(() => {
    if (index + 1 >= deck.length) {
      setPhase("over");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    startRound(nextIndex);
  }, [index, deck.length, startRound]);

  /* ------------------------------- telas ------------------------------- */

  if (phase === "idle") {
    return (
      <div className="py-8 text-center">
        <motion.div
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto max-w-sm"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/12 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
            <Eye size={12} /> {ROUND_COUNT} imagens
          </span>
          <h3 className="mt-3 text-2xl font-black">Adivinhe antes de ver</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Cada imagem entra <strong>borrada</strong> e vai focando. Quanto mais cedo você acertar o
            prompt que a criou, mais pontos: <strong className="text-amber-300">{MAX_POINTS}</strong>{" "}
            no escuro, <strong className="text-white/60">{MIN_POINTS}</strong> com tudo nítido.
          </p>
          {high > 0 && <p className="mt-3 text-xs font-bold text-amber-300">Seu recorde: {high}</p>}
          <button
            onClick={begin}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan-400 to-sky-300 px-7 py-3 text-base font-black text-[#04222b] transition-transform hover:scale-[1.04]"
          >
            <Play size={16} strokeWidth={3} /> Começar
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
        className="relative py-8 text-center"
      >
        <FxConfetti active={hits >= deck.length * 0.6} />
        {isRecord && (
          <p className="relative mb-1 text-sm font-black uppercase tracking-widest text-lime-300">
            ★ Novo recorde ★
          </p>
        )}
        <p className="relative text-6xl font-black text-amber-400">{score}</p>
        <p className="relative mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {hits} de {deck.length} imagens decifradas
          {high > 0 && !isRecord && ` · recorde: ${high}`}
        </p>
        <button
          onClick={begin}
          className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-6 py-2.5 text-sm font-black text-[#241a05] transition-transform hover:scale-[1.04]"
        >
          <RefreshCw size={14} /> Jogar de novo
        </button>
        <div className="relative mx-auto mt-3 max-w-md text-left">
          <PersonaFisher source="qual-prompt" />
        </div>
      </motion.div>
    );
  }

  if (!round) return null;
  const revealed = phase === "revealed";
  const right = revealed && answer === round.correct;

  return (
    <div>
      {/* Cabeçalho: rodada, pontos vivos, placar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Imagem {index + 1}/{deck.length}
        </span>
        {!revealed ? (
          <motion.span
            key={livePoints}
            initial={reduced ? false : { scale: 1.18 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-amber-400/12 px-3 py-1 text-xs font-black text-amber-300"
          >
            vale {livePoints} agora
          </motion.span>
        ) : (
          <span className="text-xs font-black text-amber-400">{score} pts</span>
        )}
      </div>

      {/* A imagem que foca */}
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/12 bg-[#0c0e1d]">
        {/* O desfoque é style direto, NÃO animate do framer-motion: como o
            valor muda a cada frame do relógio, uma transição de 0.15s reinicia
            a cada render e o blur trava (visto em teste: parava em ~22px em vez
            de chegar a 0). O clock já roda em requestAnimationFrame, então o
            CSS puro anima suave sozinho.
            eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={round.image}
          alt="Imagem gerada por IA — descubra o prompt"
          className="h-full w-full object-cover"
          draggable={false}
          style={{
            filter: `blur(${blur}px)`,
            transform: `scale(${1 + blur * 0.006})`,
            willChange: "filter",
          }}
        />
        {/* Barra de foco */}
        {!revealed && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
            <motion.span
              className="block h-full"
              style={{
                width: `${progress * 100}%`,
                background: "linear-gradient(90deg,#22d3ee,#f5c04e)",
              }}
            />
          </div>
        )}
        {revealed && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-x-0 bottom-0 p-2 text-center"
            style={{
              background: "linear-gradient(transparent, rgba(12,14,29,.92))",
            }}
          >
            <p
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: right ? "#a3e635" : "#f47276" }}
            >
              {answer === -1 ? "Tempo!" : right ? `Acertou · +${gained}` : "Não era esse"}
            </p>
          </motion.div>
        )}
      </div>

      {/* Opções */}
      <div className="mt-3 space-y-2">
        {round.options.map((option, i) => {
          const isCorrect = i === round.correct;
          const picked = answer === i;
          return (
            <motion.button
              key={i}
              onClick={() => choose(i)}
              disabled={revealed}
              whileHover={revealed || reduced ? undefined : { x: 3 }}
              whileTap={revealed || reduced ? undefined : { scale: 0.99 }}
              animate={
                revealed && picked && !right && !reduced ? { x: [0, -7, 6, -3, 0] } : {}
              }
              className="flex w-full items-start gap-2.5 rounded-xl border-2 p-3 text-left text-[13px] leading-snug transition-colors disabled:cursor-default"
              style={{
                borderColor: revealed
                  ? isCorrect
                    ? "#a3e635"
                    : picked
                      ? "#f47276"
                      : "rgba(255,255,255,.08)"
                  : "rgba(255,255,255,.14)",
                background: revealed
                  ? isCorrect
                    ? "rgba(163,230,53,.08)"
                    : picked
                      ? "rgba(244,114,118,.08)"
                      : "rgba(22,26,54,.3)"
                  : "rgba(22,26,54,.42)",
                opacity: revealed && !isCorrect && !picked ? 0.45 : 1,
              }}
            >
              {revealed && (isCorrect || picked) && (
                <span className="mt-0.5 shrink-0">
                  {isCorrect ? (
                    <Check size={15} strokeWidth={3} className="text-lime-400" />
                  ) : (
                    <X size={15} strokeWidth={3} className="text-rose-400" />
                  )}
                </span>
              )}
              <span>{option}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Lição */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">{round.lesson}</p>
            <div className="mt-1.5">
              <VocabularyChip term={round.term} />
            </div>
            <button
              onClick={next}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-black text-[#241a05]"
            >
              {index + 1 >= deck.length ? "Ver resultado" : "Próxima imagem"}{" "}
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A dica entra só na metade do tempo: quem espera ganha ajuda, mas já
          abriu mão de metade dos pontos. Mostrá-la desde o início entregaria a
          resposta e mataria a decisão de arriscar cedo. */}
      <AnimatePresence>
        {!revealed && progress > 0.5 && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center text-[11px] text-cyan-300/80"
          >
            Dica: {round.hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
