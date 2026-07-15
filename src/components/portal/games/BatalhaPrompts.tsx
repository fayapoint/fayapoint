"use client";

import { useState } from "react";
import { ArrowRight, Check, RefreshCw, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { PROMPT_BATTLES } from "@/data/games/batalha-prompts";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";

export function BatalhaPrompts() {
  const { deck, rotate } = useRotatingDeck(PROMPT_BATTLES, 5, "fayai_seen_batalha_prompts");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = deck[index];
  const correct = choice === round.winner;

  const choose = (value: "A" | "B") => {
    if (choice) return;
    setChoice(value);
    if (value === round.winner) setScore((current) => current + 1);
  };

  const next = () => {
    if (index + 1 >= deck.length) return setFinished(true);
    setIndex((current) => current + 1);
    setChoice(null);
  };

  const restart = () => {
    rotate(); setIndex(0); setChoice(null); setScore(0); setFinished(false);
  };

  if (finished) return (
    <div className="relative py-9 text-center">
      <FxConfetti active={score >= 4} />
      <Swords className="relative mx-auto mb-2 text-orange-400" size={38} />
      <p className="relative text-5xl font-extrabold text-amber-400">{score}/{deck.length}</p>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Você treinou um olhar mais importante que decorar fórmulas: reconhecer instruções claras.</p>
      <button onClick={restart} className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]"><RefreshCw size={14} /> Novas batalhas</button>
      <div className="relative mx-auto mt-2 max-w-md text-left">
        <PersonaFisher source="batalha-prompts" />
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Batalha {index + 1} de {deck.length}</span><span className="text-amber-400">{score} vitórias</span>
      </div>
      <div className="rounded-2xl border border-orange-400/30 bg-orange-400/5 p-4 text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-300">Missão</span>
        <p className="mt-1 font-bold">{round.task}</p>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {(["A", "B"] as const).map((letter) => {
          const isWinner = round.winner === letter;
          const selected = choice === letter;
          const promptText = letter === "A" ? round.promptA : round.promptB;
          return (
            <button key={letter} onClick={() => choose(letter)} className="rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5" style={{ borderColor: choice ? (isWinner ? "#a3e635" : selected ? "#f47276" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.14)", background: choice && isWinner ? "rgba(163,230,53,.08)" : choice && selected ? "rgba(244,114,118,.08)" : "rgba(22,26,54,.42)" }}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-black">{choice && isWinner ? <Check size={14} className="text-lime-400" /> : letter}</span>
              <p className="mt-3 text-sm leading-relaxed">{promptText}</p>
            </button>
          );
        })}
      </div>
      {choice && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: correct ? "#a3e635" : "#f47276" }}>{correct ? "Boa escolha!" : `O prompt ${round.winner} vence esta.`}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{round.why}</p>
          <span className="mt-2 inline-flex rounded-full bg-orange-400/10 px-3 py-1 text-[11px] font-bold text-orange-300">Critério: {round.criterion}</span>
          <VocabularyChip term={round.term} />
          <button onClick={next} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]">{index + 1 >= deck.length ? "Ver resultado" : "Próxima batalha"} <ArrowRight size={14} /></button>
        </motion.div>
      )}
    </div>
  );
}

