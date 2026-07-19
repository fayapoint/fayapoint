"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Gamepad2, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { PromptBuilderGame } from "@/components/portal/PromptBuilderGame";
import { VerdadeOuMito } from "@/components/portal/games/VerdadeOuMito";
import { QualPrompt } from "@/components/portal/games/QualPrompt";
import { BatalhaPrompts } from "@/components/portal/games/BatalhaPrompts";
import { CacaPrompt } from "@/components/portal/games/CacaPrompt";
import { ArcadeVisual, type ArcadeGameId } from "@/components/portal/ArcadeVisual";

/**
 * Arcade público (19/07/2026) — os mesmos 5 minigames do Arcade logado,
 * jogáveis SEM CADASTRO. Nenhum destes 5 componentes toca em auth/API (só
 * o Palpite em 30s tem persistência de XP, e esse já mora na home/NovaLanding
 * com o fluxo localStorage->claim-on-signup); reaproveitados aqui tal como
 * são no portal — zero duplicação de lógica de jogo.
 * Fecha o funil nó→aula→minigame→cadastro: dá um gostinho real do produto
 * antes de pedir e-mail.
 */

type PublicGameId = Exclude<ArcadeGameId, "palpite-30s">;

interface Jogo {
  id: PublicGameId;
  titulo: string;
  desc: string;
  cor: string;
}

const JOGOS: Jogo[] = [
  { id: "monte-o-prompt", titulo: "Monte o Prompt", desc: "A receita dos 5 ingredientes de uma imagem profissional.", cor: "#f472b6" },
  { id: "verdade-ou-mito", titulo: "Verdade ou Mito?", desc: "10 cartas para separar o hype da realidade da IA.", cor: "#38bdf8" },
  { id: "qual-prompt", titulo: "Qual Prompt Gerou Isto?", desc: "Olhe a arte, adivinhe a receita que a criou.", cor: "#a78bfa" },
  { id: "batalha-prompts", titulo: "Batalha de Prompts", desc: "Dois prompts entram, só um sai vencedor — descubra por quê.", cor: "#fb923c" },
  { id: "caca-prompt", titulo: "Caça ao Prompt Perdido", desc: "Escolha e arraste peças para reconstruir a receita original.", cor: "#a3e635" },
];

const TITULOS: Record<PublicGameId, string> = Object.fromEntries(
  JOGOS.map((j) => [j.id, j.titulo])
) as Record<PublicGameId, string>;

export function PublicArcade() {
  const posthog = usePostHog();
  const [jogo, setJogo] = useState<PublicGameId | null>(null);

  useEffect(() => {
    posthog?.capture("public_arcade_view");
  }, [posthog]);

  function openGame(id: PublicGameId) {
    setJogo(id);
    posthog?.capture("minigame_start", { game: id, context: "public_arcade" });
  }

  function closeGame() {
    if (jogo) posthog?.capture("minigame_complete", { game: jogo, context: "public_arcade" });
    setJogo(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-amber-400">
            <Gamepad2 size={16} />
            Arcade grátis — sem cadastro
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Experimente antes de criar sua conta</h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Os mesmos jogos de dentro da plataforma FayAi, jogáveis agora — dá um gostinho real do que você
            aprende aqui.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {jogo ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-screen-lg"
            >
              <button
                onClick={closeGame}
                className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={15} /> Voltar para os jogos
              </button>
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <ArcadeVisual
                  gameId={jogo}
                  alt={`Arte animada do jogo ${TITULOS[jogo]}`}
                  active
                  eager
                  className="aspect-[16/5] border-b border-border"
                  imageClassName="transition-transform duration-700 hover:scale-[1.02]"
                />
                <div className="p-4 md:p-6">
                  <h2 className="mb-4 text-lg font-bold">{TITULOS[jogo]}</h2>
                  {jogo === "monte-o-prompt" && <PromptBuilderGame />}
                  {jogo === "verdade-ou-mito" && <VerdadeOuMito />}
                  {jogo === "qual-prompt" && <QualPrompt />}
                  {jogo === "batalha-prompts" && <BatalhaPrompts />}
                  {jogo === "caca-prompt" && <CacaPrompt />}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {JOGOS.map((j) => (
                <button
                  key={j.id}
                  onClick={() => openGame(j.id)}
                  className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-1 hover:border-white/20"
                >
                  <ArcadeVisual
                    gameId={j.id}
                    alt={`Arte animada do jogo ${j.titulo}`}
                    className="aspect-[16/10]"
                    imageClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <h3 className="text-base font-bold" style={{ color: j.cor }}>
                      {j.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{j.desc}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
          <Sparkles className="mx-auto mb-2 text-amber-400" size={22} />
          <h3 className="text-lg font-bold">Gostou? Isso é só o começo.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie sua conta grátis e desbloqueie cursos completos, o jogo de Palpite em 30 Segundos com XP de
            verdade, certificados e muito mais.
          </p>
          <Link
            href="/registro"
            onClick={() => posthog?.capture("public_arcade_signup_cta_click")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-black transition-colors hover:bg-amber-400"
          >
            Criar conta grátis <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
