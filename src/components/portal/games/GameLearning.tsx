"use client";

import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { GameTerm } from "@/data/games/types";

export function VocabularyChip({ term }: { term: GameTerm }) {
  return (
    <details className="group mt-3 rounded-xl border border-violet-400/30 bg-violet-400/10 text-left">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-extrabold text-violet-200">
        <BookOpen size={14} />
        <span>Palavra nova: {term.label}</span>
        <span className="ml-auto text-[10px] font-semibold text-violet-200/60 group-open:hidden">toque para entender</span>
      </summary>
      <div className="border-t border-violet-400/20 px-3 py-2.5">
        <p className="text-xs leading-relaxed text-muted-foreground">{term.definition}</p>
        <Link
          href={`/pt-BR/recursos/glossario?q=${encodeURIComponent(term.label)}#${term.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 hover:text-violet-200"
        >
          Ver no glossário <ExternalLink size={11} />
        </Link>
      </div>
    </details>
  );
}

const CONFETTI = ["#38bdf8", "#a78bfa", "#f472b6", "#a3e635", "#f5c04e"];

export function FxConfetti({ active = true }: { active?: boolean }) {
  if (!active) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-1.5 rounded-sm"
          style={{ left: `${4 + ((i * 17) % 92)}%`, top: -12, background: CONFETTI[i % CONFETTI.length] }}
          initial={{ y: -12, rotate: 0, opacity: 0 }}
          animate={{ y: [0, 70 + (i % 5) * 28, 230], rotate: 180 + i * 47, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.7 + (i % 4) * 0.18, delay: (i % 7) * 0.06, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
