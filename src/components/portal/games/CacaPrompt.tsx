"use client";

import { useMemo, useState } from "react";
import { Reorder, motion } from "framer-motion";
import { ArrowRight, Check, GripVertical, RefreshCw, RotateCcw } from "lucide-react";
import { PROMPT_HUNTS } from "@/data/games/caca-prompt";
import { useRotatingDeck } from "@/lib/game-rotation";
import { FxConfetti, VocabularyChip } from "@/components/portal/games/GameLearning";

export function CacaPrompt() {
  const { deck, rotate } = useRotatingDeck(PROMPT_HUNTS, 5, "fayai_seen_caca_prompt");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = deck[index];
  const pieceById = useMemo(() => new Map(round.pieces.map((piece) => [piece.id, piece])), [round]);
  const correct = checked && selected.join("|") === round.answer.join("|");

  const toggle = (id: string) => {
    if (checked) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < round.answer.length ? [...current, id] : current);
  };

  const verify = () => {
    if (selected.length !== round.answer.length || checked) return;
    setChecked(true);
    if (selected.join("|") === round.answer.join("|")) setScore((current) => current + 1);
  };

  const next = () => {
    if (index + 1 >= deck.length) return setFinished(true);
    setIndex((current) => current + 1); setSelected([]); setChecked(false);
  };

  const restart = () => {
    rotate(); setIndex(0); setSelected([]); setChecked(false); setScore(0); setFinished(false);
  };

  if (finished) return (
    <div className="relative py-9 text-center">
      <FxConfetti active={score >= 4} />
      <p className="relative text-5xl font-extrabold text-amber-400">{score}/{deck.length}</p>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Você desmontou imagens em ingredientes e remontou a anatomia dos prompts.</p>
      <button onClick={restart} className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]"><RefreshCw size={14} /> Novas caçadas</button>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground"><span>Caçada {index + 1} de {deck.length}</span><span className="text-amber-400">{score} completos</span></div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-lime-400/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={round.image} alt="Resultado cujo prompt será reconstruído" className="h-full w-full object-cover" />
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-muted-foreground">{round.mission}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-lime-300">Escolha {round.answer.length} peças e arraste para ordenar:</p>
          <Reorder.Group axis="y" values={selected} onReorder={checked ? () => undefined : setSelected} className="space-y-2">
            {selected.map((id, slotIndex) => {
              const piece = pieceById.get(id);
              if (!piece) return null;
              return (
                <Reorder.Item key={id} value={id} className="flex cursor-grab items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2.5 active:cursor-grabbing">
                  <GripVertical size={15} className="text-lime-300" />
                  <span className="w-20 shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-lime-300">{round.slots[slotIndex]}</span>
                  <span className="text-xs font-semibold">{piece.text}</span>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          {selected.length < round.answer.length && <div className="mt-2 rounded-xl border border-dashed border-white/15 px-3 py-3 text-center text-xs text-muted-foreground">Faltam {round.answer.length - selected.length} peça(s)</div>}
          <div className="mt-3 flex flex-wrap gap-2">
            {round.pieces.map((piece) => {
              const active = selected.includes(piece.id);
              return <button key={piece.id} onClick={() => toggle(piece.id)} disabled={checked} className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition" style={{ borderColor: active ? "#a3e635" : "rgba(255,255,255,.14)", background: active ? "rgba(163,230,53,.12)" : "rgba(22,26,54,.42)", opacity: checked && !active ? 0.45 : 1 }}>{piece.text}</button>;
            })}
          </div>
          {!checked && <button onClick={verify} disabled={selected.length !== round.answer.length} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-lime-400 to-lime-200 px-4 py-2 text-sm font-extrabold text-[#17300a] disabled:cursor-not-allowed disabled:opacity-40"><Check size={14} /> Conferir receita</button>}
        </div>
      </div>
      {checked && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: correct ? "#a3e635" : "#f47276" }}>{correct ? "Prompt reconstruído!" : "As peças certas existem — ajuste a seleção ou a ordem."}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{round.explanation}</p>
          <VocabularyChip term={round.term} />
          {!correct ? <button onClick={() => { setSelected([]); setChecked(false); }} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold text-muted-foreground"><RotateCcw size={14} /> Tentar de novo</button> : <button onClick={next} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-200 px-5 py-2 text-sm font-extrabold text-[#241a05]">{index + 1 >= deck.length ? "Ver resultado" : "Próxima caçada"} <ArrowRight size={14} /></button>}
        </motion.div>
      )}
    </div>
  );
}

