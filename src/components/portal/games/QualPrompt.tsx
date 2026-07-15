"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ArrowRight, Check, X } from "lucide-react";
import { PROMPT_ROUNDS } from "@/data/games/qual-prompt";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";

const ROUND_COUNT = 10;

export function QualPrompt() {
  const { deck, rotate } = useRotatingDeck(PROMPT_ROUNDS, ROUND_COUNT, "fayai_seen_qual_prompt");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = deck[index];
  const correct = answer !== null && answer === round.correct;

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
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative py-9 text-center">
        <FxConfetti active={score >= 6} />
        <p className="relative text-5xl font-extrabold text-amber-400">{score}/{deck.length}</p>
        <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {score === deck.length ? "Olho calibrado: você já lê imagens como prompts!" : "Seu olhar está aprendendo a receita por trás de cada imagem."}
        </p>
        <button onClick={restart} className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]">
          <RefreshCw size={14} /> Jogar novas rodadas
        </button>
        <div className="relative mx-auto mt-2 max-w-md text-left">
          <PersonaFisher source="qual-prompt" />
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Rodada {index + 1} de {deck.length}</span>
        <span className="text-amber-400">{score} acertos</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={round.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
          <div className="relative mx-auto aspect-[3/2] max-w-[460px] overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={round.image} alt="Cena para descobrir o prompt" className="absolute inset-0 h-full w-full object-cover" />
          </div>

          <p className="mt-4 text-center text-sm font-bold">Qual prompt gerou esta imagem?</p>
          <div className="mx-auto mt-3 max-w-lg space-y-2">
            {round.options.map((option, optionIndex) => {
              const selected = answer === optionIndex;
              const revealed = answer !== null;
              const isCorrect = optionIndex === round.correct;
              return (
                <button
                  key={option}
                  onClick={() => {
                    if (answer !== null) return;
                    setAnswer(optionIndex);
                    if (isCorrect) setScore((current) => current + 1);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all"
                  style={{
                    borderColor: revealed ? (isCorrect ? "#a3e635" : selected ? "#f47276" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.14)",
                    background: revealed && isCorrect ? "rgba(163,230,53,.1)" : revealed && selected ? "rgba(244,114,118,.1)" : "rgba(22,26,54,.42)",
                    opacity: revealed && !isCorrect && !selected ? 0.55 : 1,
                  }}
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-extrabold">
                    {revealed && isCorrect ? <Check size={13} className="text-lime-400" /> : revealed && selected ? <X size={13} className="text-rose-400" /> : String.fromCharCode(65 + optionIndex)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {answer !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-lg text-center">
              <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: correct ? "#a3e635" : "#f47276" }}>{correct ? "Acertou!" : "Quase!"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{round.hint}</p>
              <p className="mt-2 rounded-xl bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-200">💡 {round.lesson}</p>
              <VocabularyChip term={round.term} />
              <button onClick={next} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]">
                {index + 1 >= deck.length ? "Ver resultado" : "Próxima"} <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
