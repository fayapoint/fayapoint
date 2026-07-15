"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * PersonaFisher — "pesca" UMA informação do usuário no fim de cada jogo (14/07/2026).
 * Uma pergunta leve e opcional; a resposta vira sinal em /api/user/persona-signals
 * (o mesmo socialPersona que o USS usa). Perguntas respondidas não repetem.
 * Gamificação honesta: +10 XP só quando aprendemos algo novo.
 */

interface FishQuestion {
  id: string;
  question: string;
  options: { label: string; emoji: string; signals: Record<string, string[] | string> }[];
}

const QUESTIONS: FishQuestion[] = [
  {
    id: "onde-ajuda",
    question: "Onde a IA mais te ajudaria hoje?",
    options: [
      { label: "No trabalho", emoji: "💼", signals: { interests: ["trabalho"], facts: ["quer usar IA no trabalho"] } },
      { label: "Nos estudos", emoji: "📚", signals: { interests: ["estudos"], facts: ["quer usar IA nos estudos"] } },
      { label: "Para criar", emoji: "🎨", signals: { interests: ["criar"], facts: ["quer usar IA para criar"] } },
      { label: "No dia a dia", emoji: "☕", signals: { interests: ["dia-a-dia"], facts: ["quer usar IA no dia a dia"] } },
    ],
  },
  {
    id: "area",
    question: "Qual é a sua área?",
    options: [
      { label: "Tecnologia", emoji: "💻", signals: { industry: ["tech"] } },
      { label: "Negócios/Vendas", emoji: "💰", signals: { industry: ["marketing"] } },
      { label: "Educação/Saúde", emoji: "🏥", signals: { industry: ["education"] } },
      { label: "Criativa", emoji: "🎬", signals: { industry: ["art"] } },
    ],
  },
  {
    id: "nivel",
    question: "Seu nível com IA hoje?",
    options: [
      { label: "Começando agora", emoji: "🌱", signals: { experienceLevel: "beginner" } },
      { label: "Já uso às vezes", emoji: "🌿", signals: { experienceLevel: "intermediate" } },
      { label: "Uso todo dia", emoji: "🌳", signals: { experienceLevel: "advanced" } },
    ],
  },
  {
    id: "criar-o-que",
    question: "O que você mais gostaria de criar com IA?",
    options: [
      { label: "Textos e posts", emoji: "✍️", signals: { contentTypes: ["text"], interests: ["escrita"] } },
      { label: "Imagens", emoji: "📸", signals: { contentTypes: ["photos"], interests: ["imagens"] } },
      { label: "Vídeos", emoji: "🎬", signals: { contentTypes: ["videos"], interests: ["video"] } },
      { label: "Automações", emoji: "🤖", signals: { marketingGoals: ["automate"], interests: ["automacao"] } },
    ],
  },
  {
    id: "objetivo",
    question: "Qual objetivo fala mais com você?",
    options: [
      { label: "Ganhar tempo", emoji: "⏰", signals: { marketingGoals: ["automate"], facts: ["prioriza ganhar tempo"] } },
      { label: "Ganhar dinheiro", emoji: "💎", signals: { marketingGoals: ["sales"], facts: ["prioriza renda com IA"] } },
      { label: "Aprender por prazer", emoji: "✨", signals: { marketingGoals: ["education"], facts: ["aprende IA por prazer"] } },
      { label: "Crescer na carreira", emoji: "🚀", signals: { marketingGoals: ["authority"], facts: ["quer crescer na carreira com IA"] } },
    ],
  },
  {
    id: "tom",
    question: "Se a IA escrevesse por você, o tom seria...",
    options: [
      { label: "Descontraído", emoji: "😄", signals: { toneOfVoice: ["casual"] } },
      { label: "Profissional", emoji: "🎯", signals: { toneOfVoice: ["formal"] } },
      { label: "Inspirador", emoji: "✨", signals: { toneOfVoice: ["inspirational"] } },
      { label: "Divertido", emoji: "🎭", signals: { toneOfVoice: ["fun"] } },
    ],
  },
  {
    id: "trabalho-com",
    question: "Você trabalha por conta própria ou em empresa?",
    options: [
      { label: "Conta própria", emoji: "🧑‍🚀", signals: { facts: ["empreende por conta própria"], marketingGoals: ["personal-brand"] } },
      { label: "Empresa", emoji: "🏢", signals: { facts: ["trabalha em empresa"] } },
      { label: "Estudando ainda", emoji: "🎓", signals: { facts: ["ainda estudando"] } },
    ],
  },
];

const STORAGE_KEY = "fayai_fisher_answered";

export function PersonaFisher({ source }: { source: string }) {
  const [visible, setVisible] = useState(false);
  const [sent, setSent] = useState(false);

  const question = useMemo(() => {
    try {
      const answered: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const pending = QUESTIONS.filter((q) => !answered.includes(q.id));
      if (pending.length === 0) return null;
      return pending[Math.floor(Math.random() * pending.length)];
    } catch {
      return QUESTIONS[0];
    }
  }, []);

  useEffect(() => {
    if (question) setVisible(true);
  }, [question]);

  if (!question || !visible) return null;

  const answer = async (signals: Record<string, string[] | string>) => {
    setSent(true);
    try {
      const answered: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...answered, question.id]));
    } catch { /* storage indisponível */ }

    try {
      const token = localStorage.getItem("fayai_token") || "";
      const res = await fetch("/api/user/persona-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ source, signals }),
      });
      const data = await res.json();
      if (res.ok && data.xpAwarded > 0) {
        toast.success(`+${data.xpAwarded} XP — seu portal acabou de ficar mais seu ✨`);
      }
    } catch { /* rede — sem drama, a pergunta volta em outro jogo */ }

    setTimeout(() => setVisible(false), 250);
  };

  const dismiss = () => setVisible(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="mt-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 relative"
        >
          <button
            onClick={dismiss}
            aria-label="Agora não"
            className="absolute top-2.5 right-2.5 rounded-full p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
            <Sparkles size={12} /> Rapidinho — deixa tudo mais seu
          </p>
          <p className="mt-1.5 text-sm font-bold text-foreground">{question.question}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {question.options.map((op) => (
              <button
                key={op.label}
                disabled={sent}
                onClick={() => answer(op.signals)}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-semibold hover:border-violet-400/60 hover:bg-violet-500/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="mr-1.5">{op.emoji}</span>
                {op.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
