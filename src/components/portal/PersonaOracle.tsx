"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Check, X, Wand2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { FxConfetti } from "@/components/portal/games/GameLearning";

/**
 * O Vidente — Akinator da persona (14/07/2026).
 * Em vez de formulário, o mascote-vidente faz perguntas INDIRETAS e tenta
 * ADIVINHAR quem o usuário é. Cada acerto confirmado (ou correção) vira
 * sinal real em /api/user/persona-signals — o mesmo socialPersona do USS.
 * Artes: /portal/persona/* (fusão vetor+foto, batch 14/07).
 */

type Dim = "industry" | "goal" | "level";

interface OracleOption {
  label: string;
  emoji: string;
  /** evidências: dimensão → hipótese → peso */
  evidence: Partial<Record<Dim, Record<string, number>>>;
}

interface OracleQuestion {
  id: string;
  text: string;
  options: OracleOption[];
}

const QUESTIONS: OracleQuestion[] = [
  {
    id: "dia",
    text: "Me conta: seu dia normal tem mais...",
    options: [
      { label: "Reuniões e e-mails", emoji: "📅", evidence: { industry: { tech: 2, marketing: 2, consulting: 2 }, goal: { automate: 2 } } },
      { label: "Criação e ideias", emoji: "💡", evidence: { industry: { art: 3, entertainment: 2 }, goal: { "content-scale": 2 } } },
      { label: "Aulas e estudo", emoji: "📖", evidence: { industry: { education: 3 }, level: { beginner: 1 }, goal: { education: 2 } } },
      { label: "Clientes e vendas", emoji: "🤝", evidence: { industry: { marketing: 3, retail: 2 }, goal: { sales: 3 } } },
    ],
  },
  {
    id: "ferramenta",
    text: "Se você tivesse que escolher UMA para sempre...",
    options: [
      { label: "Planilha", emoji: "📊", evidence: { industry: { tech: 2, finance: 3 }, goal: { automate: 2 } } },
      { label: "Pincel/câmera", emoji: "🎨", evidence: { industry: { art: 3 }, goal: { "content-scale": 2 } } },
      { label: "Bloco de notas", emoji: "✍️", evidence: { industry: { education: 2, consulting: 2 }, goal: { authority: 2 } } },
      { label: "WhatsApp", emoji: "💬", evidence: { industry: { marketing: 2, retail: 2 }, goal: { sales: 2, community: 2 } } },
    ],
  },
  {
    id: "vitoria",
    text: "O que soaria como uma VITÓRIA daqui a 3 meses?",
    options: [
      { label: "Sobrar tempo no meu dia", emoji: "⏰", evidence: { goal: { automate: 3 } } },
      { label: "Uma renda nova", emoji: "💰", evidence: { goal: { sales: 3, "personal-brand": 1 } } },
      { label: "Dominar um assunto", emoji: "🎓", evidence: { goal: { education: 3 }, level: { beginner: 1 } } },
      { label: "Ser reconhecido pelo que faço", emoji: "⭐", evidence: { goal: { authority: 3, "personal-brand": 2 } } },
    ],
  },
  {
    id: "ia-hoje",
    text: "E a IA na sua vida hoje, sendo bem honesto...",
    options: [
      { label: "Tô começando agora", emoji: "🌱", evidence: { level: { beginner: 3 } } },
      { label: "Uso quando lembro", emoji: "🌿", evidence: { level: { intermediate: 3 } } },
      { label: "Uso todo santo dia", emoji: "🌳", evidence: { level: { advanced: 3 } } },
    ],
  },
  {
    id: "fim-de-semana",
    text: "Última: num sábado livre, você...",
    options: [
      { label: "Estudo algo novo", emoji: "🤓", evidence: { goal: { education: 2 }, level: { intermediate: 1 } } },
      { label: "Crio alguma coisa", emoji: "🛠️", evidence: { industry: { art: 2, tech: 1 }, goal: { "content-scale": 1 } } },
      { label: "Cuido dos meus projetos", emoji: "🚀", evidence: { goal: { "personal-brand": 2, sales: 1 }, industry: { consulting: 1 } } },
      { label: "Desligo de tudo", emoji: "🌴", evidence: { goal: { automate: 2 } } },
    ],
  },
];

const INDUSTRY_LABEL: Record<string, string> = {
  tech: "TECNOLOGIA", marketing: "NEGÓCIOS E VENDAS", education: "EDUCAÇÃO",
  art: "ÁREA CRIATIVA", consulting: "CONSULTORIA", finance: "FINANÇAS",
  retail: "VAREJO", entertainment: "ENTRETENIMENTO",
};
const GOAL_LABEL: Record<string, string> = {
  automate: "ganhar TEMPO automatizando", sales: "gerar RENDA",
  education: "DOMINAR novos assuntos", authority: "construir AUTORIDADE",
  "personal-brand": "construir sua MARCA", "content-scale": "CRIAR sem parar",
  community: "criar COMUNIDADE",
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: "está começando", intermediate: "já se vira bem", advanced: "vive de IA",
};

type Stage = "intro" | "asking" | "guessing" | "right" | "fixing" | "done";

export default function PersonaOracle({ onComplete }: { onComplete?: () => void }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState<Record<Dim, Record<string, number>>>({ industry: {}, goal: {}, level: {} });
  const [fixed, setFixed] = useState<{ industry?: string; goal?: string }>({});

  const guess = useMemo(() => {
    const top = (dim: Dim, fallback: string) => {
      const entries = Object.entries(scores[dim]);
      if (entries.length === 0) return fallback;
      entries.sort((a, b) => b[1] - a[1]);
      return entries[0][0];
    };
    return {
      industry: top("industry", "tech"),
      goal: top("goal", "education"),
      level: top("level", "beginner"),
    };
  }, [scores]);

  const pick = (op: OracleOption) => {
    setScores((prev) => {
      const next = { industry: { ...prev.industry }, goal: { ...prev.goal }, level: { ...prev.level } };
      for (const dim of ["industry", "goal", "level"] as Dim[]) {
        for (const [k, w] of Object.entries(op.evidence[dim] || {})) {
          next[dim][k] = (next[dim][k] || 0) + w;
        }
      }
      return next;
    });
    if (qIndex + 1 >= QUESTIONS.length) setStage("guessing");
    else setQIndex(qIndex + 1);
  };

  const save = async (industry: string, goal: string, level: string, confirmed: boolean) => {
    try {
      const token = localStorage.getItem("fayai_token") || "";
      const res = await fetch("/api/user/persona-signals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          source: "vidente",
          signals: {
            industry: [industry],
            marketingGoals: [goal],
            experienceLevel: level,
            facts: [confirmed ? `o vidente acertou: ${INDUSTRY_LABEL[industry]?.toLowerCase()} querendo ${GOAL_LABEL[goal]}` : `corrigiu o vidente: ${INDUSTRY_LABEL[industry]?.toLowerCase()}`],
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.xpAwarded > 0) {
        toast.success(`+${data.xpAwarded} XP — o Vidente anotou tudo ✨`);
      }
    } catch { /* rede — sem drama */ }
  };

  const confirm = async () => {
    setStage("right");
    await save(guess.industry, guess.goal, guess.level, true);
    setTimeout(() => { setStage("done"); onComplete?.(); }, 2200);
  };

  const applyFix = async () => {
    const industry = fixed.industry || guess.industry;
    const goal = fixed.goal || guess.goal;
    await save(industry, goal, guess.level, false);
    setStage("done");
    onComplete?.();
  };

  const restart = () => {
    setStage("intro"); setQIndex(0); setFixed({});
    setScores({ industry: {}, goal: {}, level: {} });
  };

  const art = (name: string) => `/portal/persona/${name}.webp`;
  const guessArt =
    guess.industry === "art" || guess.industry === "entertainment" ? "palpite-criativo"
    : guess.industry === "education" ? "palpite-estudos"
    : guess.goal === "sales" || guess.industry === "marketing" || guess.industry === "retail" ? "palpite-negocios"
    : "palpite-trabalho";

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/10 to-transparent">
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="relative mx-auto aspect-[3/2] max-h-56 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art("vidente-hero")} alt="O Vidente da FayAI" className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-extrabold text-foreground">🔮 O Vidente</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Responda 5 perguntas rápidas e eu <strong className="text-violet-300">adivinho quem você é</strong> —
                sem formulário chato. Se eu errar, você me corrige.
              </p>
              <button
                onClick={() => setStage("asking")}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-extrabold text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Wand2 size={15} /> Pode adivinhar
              </button>
            </div>
          </motion.div>
        )}

        {stage === "asking" && (
          <motion.div key={`q-${qIndex}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
              <Sparkles size={12} /> Pergunta {qIndex + 1} de {QUESTIONS.length}
            </p>
            <p className="mt-2 text-base font-bold text-foreground">{QUESTIONS[qIndex].text}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {QUESTIONS[qIndex].options.map((op) => (
                <button
                  key={op.label}
                  onClick={() => pick(op)}
                  className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-left text-sm font-semibold hover:border-violet-400/60 hover:bg-violet-500/15 transition-colors cursor-pointer"
                >
                  <span className="mr-2">{op.emoji}</span>
                  {op.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {stage === "guessing" && (
          <motion.div key="guess" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="relative mx-auto aspect-[3/2] max-h-52 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art(guessArt)} alt="O palpite do Vidente" className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-300">A bola de cristal diz…</p>
              <p className="mx-auto mt-2 max-w-md text-base font-bold text-foreground leading-relaxed">
                Vejo alguém de <span className="text-violet-300">{INDUSTRY_LABEL[guess.industry]}</span>, que{" "}
                <span className="text-amber-300">{LEVEL_LABEL[guess.level]}</span> com IA e sonha em{" "}
                <span className="text-fuchsia-300">{GOAL_LABEL[guess.goal]}</span>. Acertei? 🔮
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={confirm} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 px-5 py-2 text-sm font-extrabold text-[#12250a] cursor-pointer hover:opacity-90">
                  <Check size={15} /> Na mosca!
                </button>
                <button onClick={() => setStage("fixing")} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-5 py-2 text-sm font-bold text-white/70 hover:text-white hover:border-white/40 cursor-pointer transition-colors">
                  <X size={15} /> Quase…
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === "right" && (
          <motion.div key="right" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative text-center">
            <FxConfetti active />
            <div className="relative mx-auto aspect-[3/2] max-h-52 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art("acertou")} alt="O Vidente acertou" className="h-full w-full object-cover" />
            </div>
            <p className="p-5 text-base font-extrabold text-foreground">🎯 Eu SABIA! Anotei tudo — seu portal agora te conhece melhor.</p>
          </motion.div>
        )}

        {stage === "fixing" && (
          <motion.div key="fixing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="relative mx-auto aspect-[3/2] max-h-44 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art("errou")} alt="O Vidente errou" className="h-full w-full object-cover" />
            </div>
            <div className="p-5 text-left">
              <p className="text-center text-sm font-bold text-foreground">Ops! Me ajuda a acertar:</p>
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-widest text-violet-300">Sua área é…</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Object.entries(INDUSTRY_LABEL).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setFixed((f) => ({ ...f, industry: k }))}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${(fixed.industry || guess.industry) === k ? "border-violet-400 bg-violet-500/25 text-violet-200" : "border-white/15 text-white/60 hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-widest text-fuchsia-300">E seu sonho é…</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Object.entries(GOAL_LABEL).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setFixed((f) => ({ ...f, goal: k }))}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${(fixed.goal || guess.goal) === k ? "border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-200" : "border-white/15 text-white/60 hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button onClick={applyFix} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-extrabold text-white cursor-pointer hover:opacity-90">
                  <Check size={15} /> Agora sim
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center">
            <p className="text-sm font-bold text-foreground">✨ Persona atualizada com o que o Vidente aprendeu.</p>
            <p className="mt-1 text-xs text-muted-foreground">Isso deixa recomendações, desafios e o conteúdo do USS com a sua cara.</p>
            <button onClick={restart} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold text-white/60 hover:text-white cursor-pointer transition-colors">
              <RefreshCw size={12} /> Consultar de novo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
