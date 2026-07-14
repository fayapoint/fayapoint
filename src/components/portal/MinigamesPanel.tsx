"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Gamepad2, Play } from "lucide-react";
import { PromptBuilderGame } from "@/components/portal/PromptBuilderGame";
import { VerdadeOuMito } from "@/components/portal/games/VerdadeOuMito";
import { QualPrompt } from "@/components/portal/games/QualPrompt";
import { BatalhaPrompts } from "@/components/portal/games/BatalhaPrompts";
import { CacaPrompt } from "@/components/portal/games/CacaPrompt";

/**
 * Arcade da IA — aba dedicada de minigames (F4 do PLANO_UX_NAVEGACAO).
 * Hub com arte gerada no ComfyUI, 3 jogos jogáveis hoje e os próximos com
 * selo CONSTRUINDO (honesto — nada de porta falsa). Backlog completo em
 * MINIGAMES_BACKLOG.md.
 */

interface Jogo {
  id: string;
  titulo: string;
  desc: string;
  cor: string;
  art: string;
  status: "jogar" | "construindo" | "home";
}

const JOGOS: Jogo[] = [
  { id: "monte-o-prompt", titulo: "Monte o Prompt", desc: "A receita dos 5 ingredientes de uma imagem profissional.", cor: "#f472b6", art: "/portal/arcade/monte-prompt.webp", status: "jogar" },
  { id: "verdade-ou-mito", titulo: "Verdade ou Mito?", desc: "10 cartas para separar o hype da realidade da IA.", cor: "#38bdf8", art: "/portal/arcade/verdade-mito.webp", status: "jogar" },
  { id: "qual-prompt", titulo: "Qual Prompt Gerou Isto?", desc: "Olhe a arte, adivinhe a receita que a criou.", cor: "#a78bfa", art: "/portal/arcade/qual-prompt.webp", status: "jogar" },
  { id: "palpite-30s", titulo: "Palpite em 30 Segundos", desc: "O clássico da página inicial — palpites e mágica.", cor: "#f5c04e", art: "/portal/arcade/palpite-30s.webp", status: "home" },
  { id: "batalha-prompts", titulo: "Batalha de Prompts", desc: "Dois prompts entram, só um sai vencedor — descubra por quê.", cor: "#fb923c", art: "/portal/arcade/batalha-prompts.webp", status: "jogar" },
  { id: "caca-prompt", titulo: "Caça ao Prompt Perdido", desc: "Escolha e arraste peças para reconstruir a receita original.", cor: "#a3e635", art: "/portal/arcade/caca-prompt.webp", status: "jogar" },
];

const TITULOS: Record<string, string> = {
  "monte-o-prompt": "Monte o Prompt",
  "verdade-ou-mito": "Verdade ou Mito?",
  "qual-prompt": "Qual Prompt Gerou Isto?",
  "batalha-prompts": "Batalha de Prompts",
  "caca-prompt": "Caça ao Prompt Perdido",
};

export function MinigamesPanel() {
  const [jogo, setJogo] = useState<string | null>(null);

  if (jogo) {
    return (
      <div className="space-y-4 min-w-0">
        <button onClick={() => setJogo(null)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Arcade
        </button>
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
          <h2 className="text-lg font-bold mb-4">{TITULOS[jogo]}</h2>
          {jogo === "monte-o-prompt" && <PromptBuilderGame />}
          {jogo === "verdade-ou-mito" && <VerdadeOuMito />}
          {jogo === "qual-prompt" && <QualPrompt />}
          {jogo === "batalha-prompts" && <BatalhaPrompts />}
          {jogo === "caca-prompt" && <CacaPrompt />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 min-w-0 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @property --arc-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes arc-rotate { to { --arc-angle: 360deg; } }
        .arc-magic { position: relative; z-index: 0; }
        .arc-magic::before {
          content: ""; position: absolute; inset: -2.5px; border-radius: 1.25rem; z-index: -1;
          background: conic-gradient(from var(--arc-angle), #38bdf8, #a78bfa, #f472b6, #f5c04e, #38bdf8);
          animation: arc-rotate 5s linear infinite; filter: blur(6px); opacity: .6;
        }
        @keyframes arc-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .arc-float { animation: arc-float 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .arc-magic::before, .arc-float { animation: none !important; } }
      ` }} />

      {/* HERO */}
      <div className="arc-magic rounded-2xl overflow-hidden">
        <div className="relative rounded-2xl overflow-hidden border border-border" style={{ background: "#0c0e1d" }}>
          <div className="grid sm:grid-cols-2 items-center">
            <div className="p-5 md:p-7">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-1" style={{ background: "rgba(245,192,78,.15)", color: "#f5c04e" }}>
                <Gamepad2 size={11} /> Arcade da IA
              </span>
              <h2 className="mt-2.5 text-2xl md:text-3xl font-extrabold leading-tight">
                Aprenda IA <span style={{ color: "#f5c04e" }}>jogando</span>
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Cada minigame ensina uma habilidade de verdade — prompts, olhar crítico, criatividade. Sem tutorial chato: entrou, jogou, aprendeu.
              </p>
            </div>
            <div className="relative h-40 sm:h-full min-h-[160px]">
              <img src="/landing/photos/cursos-hero.webp" alt="Pessoas aprendendo juntas com tecnologia" className="absolute inset-0 h-full w-full object-cover opacity-70" style={{ maskImage: "linear-gradient(90deg, transparent, black 22%)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 22%)" }} />
              <span className="absolute inset-0 bg-gradient-to-l from-[#0c0e1d]/10 to-[#0c0e1d] sm:to-transparent" />
              <span className="arc-float absolute bottom-3 right-4 block aspect-[3/2] w-36 rotate-2 overflow-hidden rounded-2xl border border-white/25 bg-[#141731] shadow-2xl shadow-violet-500/30 sm:w-44">
                <img src="/portal/arcade/arcade-hero.webp" alt="Robôs vetoriais jogando no Arcade da IA" className="h-full w-full object-cover" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE JOGOS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <AnimatePresence>
          {JOGOS.map((j, i) => {
            const conteudo = (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={j.status !== "construindo" ? { y: -5 } : undefined}
                className="group relative rounded-2xl overflow-hidden border bg-card h-full"
                style={{ borderColor: `${j.cor}44` }}
              >
                <span className="block relative overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={j.art} alt={j.titulo} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={j.status === "construindo" ? { filter: "saturate(.5) brightness(.7)" } : undefined} />
                  <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-widest rounded-full px-2 py-0.5" style={{ background: j.status === "construindo" ? "#f5c04e" : j.cor, color: "#0c0e1d" }}>
                    {j.status === "construindo" ? "Construindo" : j.status === "home" ? "Na página inicial" : "Jogar agora"}
                  </span>
                </span>
                <span className="block p-3.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{j.titulo}</span>
                    {j.status !== "construindo" && (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-transform group-hover:scale-110" style={{ background: j.cor, color: "#0c0e1d" }}>
                        {j.status === "home" ? <ArrowRight size={14} /> : <Play size={13} fill="currentColor" />}
                      </span>
                    )}
                  </span>
                  <span className="block mt-1 text-[12px] text-muted-foreground leading-snug">{j.desc}</span>
                </span>
              </motion.div>
            );

            if (j.status === "jogar") {
              return (
                <button key={j.id} onClick={() => setJogo(j.id)} className="text-left cursor-pointer">
                  {conteudo}
                </button>
              );
            }
            if (j.status === "home") {
              return (
                <Link key={j.id} href="/">
                  {conteudo}
                </Link>
              );
            }
            return <div key={j.id}>{conteudo}</div>;
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Banner-chamada do Arcade no dashboard — destaque animado que convida
 * para a aba de minigames.
 */
export function ArcadeBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left group">
      <div className="relative rounded-2xl overflow-hidden border border-border" style={{ background: "#0c0e1d" }}>
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal/arcade/arcade-hero.webp" alt="" className="w-full h-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0c0e1d 20%, rgba(12,14,29,.55) 60%, rgba(12,14,29,.25))" }} />
        </div>
        <div className="relative flex items-center justify-between gap-3 p-4 md:p-5">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-1" style={{ background: "rgba(245,192,78,.2)", color: "#f5c04e" }}>
              <Gamepad2 size={11} /> Novo: Arcade da IA
            </span>
            <p className="mt-1.5 font-bold text-sm md:text-base">5 minigames para aprender IA jogando</p>
            <p className="text-[12px] text-muted-foreground">Monte, compare e reconstrua prompts — entrou, jogou, aprendeu.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-[#241a05] shrink-0 group-hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}>
            Jogar <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}
