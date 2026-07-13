"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

/**
 * Tour de boas-vindas do portal (F3.4 do PLANO_UX_NAVEGACAO) — 4 passos que
 * apresentam o que dá para fazer, com as artes da trilha. Aparece UMA vez
 * (localStorage fayai_tour_done), sempre pulável, nunca segura conteúdo.
 */

const STEPS = [
  {
    art: "/portal/trail/magica.webp",
    cor: "#38bdf8",
    titulo: "Bem-vindo ao seu portal!",
    texto: "Este é o seu espaço. O mapa 'Seu caminho para dominar IA' mostra exatamente onde você está na jornada — cada passo concluído vira um selo dourado, de verdade, sem enfeite.",
  },
  {
    art: "/portal/trail/primeiro-curso.webp",
    cor: "#f5c04e",
    titulo: "Aprenda fazendo",
    texto: "Os cursos são práticos e curtos. Comece um, avance no seu ritmo — seu progresso fica salvo e aparece na trilha e no seu nível.",
  },
  {
    art: "/portal/trail/primeira-imagem.webp",
    cor: "#f472b6",
    titulo: "Crie de verdade no Studio",
    texto: "Gere imagens com IA direto daqui, sem instalar nada. Sua primeira criação desbloqueia um passo da trilha — e rende XP.",
  },
  {
    art: "/portal/trail/primeira-conquista.webp",
    cor: "#a3e635",
    titulo: "Jogue, conquiste, repita",
    texto: "Desafios diários, conquistas, ranking e recompensas. Tudo com XP real — aprenda IA fazendo, não assistindo.",
  },
];

export function PortalTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("fayai_tour_done")) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem("fayai_tour_done", "1");
    setOpen(false);
  };

  if (!open) return null;

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-sm rounded-3xl border bg-card p-6 text-center"
        style={{ borderColor: `${s.cor}55`, boxShadow: `0 24px 70px -20px ${s.cor}55` }}
      >
        <button
          onClick={close}
          aria-label="Pular tour"
          className="absolute top-3 right-3 p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <span
              className="mx-auto block w-28 h-28 rounded-full overflow-hidden"
              style={{ border: `3px solid ${s.cor}`, boxShadow: `0 0 28px -6px ${s.cor}aa` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.art} alt="" className="w-full h-full object-cover" />
            </span>
            <h2 className="mt-4 text-xl font-bold">{s.titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.texto}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Passo ${i + 1}`}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === step ? s.cor : "rgba(255,255,255,.2)" }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button onClick={close} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            Pular
          </button>
          <button
            onClick={() => (last ? close() : setStep(step + 1))}
            className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold text-[#241a05] hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}
          >
            {last ? "Começar!" : "Próximo"}
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
