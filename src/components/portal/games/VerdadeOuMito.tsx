"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, ArrowRight } from "lucide-react";
import { TRUTH_CARDS } from "@/data/games/verdade-mito";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";

const ROUND_COUNT = 10;

export function VerdadeOuMito() {
  const { deck, rotate } = useRotatingDeck(TRUTH_CARDS, ROUND_COUNT, "fayai_seen_verdade_mito");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const card = deck[index];
  const correct = answer !== null && answer === card.isTrue;

  const respond = (value: boolean) => {
    if (answer !== null) return;
    setAnswer(value);
    if (value === card.isTrue) setScore((current) => current + 1);
  };

  const next = () => {
    if (index + 1 >= deck.length) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setAnswer(null);
  };

  const restart = () => {
    rotate();
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const message = score >= 9
      ? "Você separa hype de realidade como gente grande!"
      : score >= 6
        ? "Mandou bem — cada explicação deixou seu radar mais forte."
        : "Ótimo começo: descobrir o que ainda não sabemos também é aprender.";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative py-9 text-center">
        <FxConfetti active={score >= 6} />
        <p className="relative text-5xl font-extrabold text-amber-400">{score}/{deck.length}</p>
        <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
        <button onClick={restart} className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]">
          <RefreshCw size={14} /> Jogar com novas cartas
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Carta {index + 1} de {deck.length}</span>
        <span className="text-amber-400">{score} acertos</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: 30, rotate: 1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-2xl border text-center"
          style={{
            borderColor: answer === null ? "rgba(255,255,255,.14)" : correct ? "#a3e63588" : "#f4727688",
            background: answer === null ? "rgba(22,26,54,.42)" : correct ? "rgba(163,230,53,.08)" : "rgba(244,114,118,.08)",
          }}
        >
          {card.art && (
            <div className="relative mx-auto aspect-[3/2] max-h-52 overflow-hidden bg-[#0c0e1d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.art} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0c0e1d] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-5">
            <p className="text-base font-bold leading-snug sm:text-lg">{card.statement}</p>

            {answer === null ? (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button onClick={() => respond(true)} className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-200 px-6 py-3 font-extrabold text-[#0c2a12] transition-transform hover:scale-[1.04]">
                  <Check size={17} strokeWidth={3} /> Verdade
                </button>
                <button onClick={() => respond(false)} className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 px-6 py-3 font-extrabold text-white transition-transform hover:scale-[1.04]">
                  <X size={17} strokeWidth={3} /> Mito
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: correct ? "#a3e635" : "#f47276" }}>
                  {correct ? "Acertou!" : card.isTrue ? "Era verdade!" : "Era mito!"}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.explanation}</p>
                <VocabularyChip term={card.term} />
                <button onClick={next} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]">
                  {index + 1 >= deck.length ? "Ver resultado" : "Próxima"} <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
