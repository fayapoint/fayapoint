"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Sparkles, RefreshCw, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROMPT_INGREDIENTS } from "@/data/games/monte-prompt";
import { VocabularyChip } from "@/components/portal/games/GameLearning";
import { PersonaFisher } from "@/components/portal/games/PersonaFisher";

/**
 * Monte o Prompt — primeiro minigame novo da trilha (F4 do PLANO_UX_NAVEGACAO).
 * Ensina a receita dos 5 ingredientes de um prompt de imagem profissional
 * (assunto + estilo + cor + fundo + luz — a mesma do exemplo
 * "imagem-sem-designer" da home) montando um prompt REAL, copiável.
 * Sem resposta errada: o jogo é sentir a estrutura. Sem XP fake: a recompensa
 * é o prompt pronto para usar no Studio ou em qualquer gerador.
 */

export function PromptBuilderGame() {
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});
  const [copiado, setCopiado] = useState(false);

  const completo = PROMPT_INGREDIENTS.every((ing) => escolhas[ing.id] !== undefined);

  const prompt = useMemo(() => {
    if (!completo) return "";
    const partes = PROMPT_INGREDIENTS.map((ing) => ing.options[escolhas[ing.id]].excerpt);
    return `Crie uma imagem: ${partes[0]}, ${partes[1]}, ${partes[2]}, ${partes[3]}, ${partes[4]}, alta qualidade, sem texto.`;
  }, [escolhas, completo]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* clipboard indisponível */ }
  };

  const surpreender = () => {
    setEscolhas(Object.fromEntries(PROMPT_INGREDIENTS.map((ingredient) => [
      ingredient.id,
      Math.floor(Math.random() * ingredient.options.length),
    ])));
    setCopiado(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-6 overflow-hidden">
      <div className="flex items-start gap-4">
        <span className="hidden sm:block w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/scenes/imagem-sem-designer.webp" alt="" className="w-full h-full object-cover" />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Minigame: Monte o Prompt
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            A diferença entre uma imagem amadora e uma profissional é a receita de 5 ingredientes.
            Escolha um de cada e veja o prompt nascer — depois é só copiar e testar.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {PROMPT_INGREDIENTS.map((ing) => (
          <div key={ing.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span
              className="shrink-0 w-20 text-[11px] font-extrabold uppercase tracking-widest"
              style={{ color: ing.color }}
            >
              {ing.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {ing.options.map((op, idx) => {
                const ativo = escolhas[ing.id] === idx;
                return (
                  <button
                    key={op.chip}
                    onClick={() => setEscolhas((e) => ({ ...e, [ing.id]: idx }))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
                      ativo ? "scale-[1.03]" : "border-border text-muted-foreground hover:text-foreground hover:border-white/30"
                    )}
                      style={ativo ? { borderColor: ing.color, background: `${ing.color}1e`, color: ing.color } : undefined}
                  >
                    {op.chip}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={surpreender} className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-200 hover:bg-violet-400/15">
        <Dices size={15} /> Surpreenda-me
      </button>

      <AnimatePresence>
        {completo && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded-2xl border p-4"
            style={{ borderColor: "#f5c04e55", background: "rgba(245,192,78,.06)", boxShadow: "0 12px 34px -14px rgba(245,192,78,.35)" }}
          >
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-1.5">
              Sua receita está pronta 🎉
            </span>
            <p className="text-sm leading-relaxed">{prompt}</p>
            <VocabularyChip term={{ slug: "prompt", label: "prompt estruturado", definition: "Um pedido organizado em partes claras: assunto, estilo, paleta, composição e iluminação." }} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={copiar}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold text-[#241a05] hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}
              >
                {copiado ? <Check size={15} /> : <Copy size={15} />}
                {copiado ? "Copiado!" : "Copiar prompt"}
              </button>
              <button
                onClick={() => { setEscolhas({}); setCopiado(false); }}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={14} />
                Montar outra
              </button>
              <span className="text-[12px] text-muted-foreground">
                Cole no Studio AI ou em qualquer gerador — a receita vale mais que a ferramenta.
              </span>
            </div>
            <PersonaFisher source="monte-prompt" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
