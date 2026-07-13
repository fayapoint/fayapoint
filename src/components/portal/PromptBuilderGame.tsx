"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Monte o Prompt — primeiro minigame novo da trilha (F4 do PLANO_UX_NAVEGACAO).
 * Ensina a receita dos 5 ingredientes de um prompt de imagem profissional
 * (assunto + estilo + cor + fundo + luz — a mesma do exemplo
 * "imagem-sem-designer" da home) montando um prompt REAL, copiável.
 * Sem resposta errada: o jogo é sentir a estrutura. Sem XP fake: a recompensa
 * é o prompt pronto para usar no Studio ou em qualquer gerador.
 */

interface Ingrediente {
  id: string;
  rotulo: string;
  cor: string;
  opcoes: { chip: string; trecho: string }[];
}

const INGREDIENTES: Ingrediente[] = [
  {
    id: "assunto",
    rotulo: "Assunto",
    cor: "#38bdf8",
    opcoes: [
      { chip: "🧁 Logotipo de confeitaria", trecho: "logotipo para a confeitaria 'Doce Manhã'" },
      { chip: "🐶 Mascote de petshop", trecho: "mascote fofo para um petshop, um cachorrinho sorridente" },
      { chip: "🚀 Capa de podcast de tecnologia", trecho: "capa para um podcast de tecnologia chamado 'Órbita'" },
    ],
  },
  {
    id: "estilo",
    rotulo: "Estilo",
    cor: "#a78bfa",
    opcoes: [
      { chip: "Minimalista flat", trecho: "estilo minimalista flat" },
      { chip: "Aquarela artesanal", trecho: "estilo aquarela artesanal" },
      { chip: "3D fofinho", trecho: "estilo 3D fofinho com formas arredondadas" },
    ],
  },
  {
    id: "cor",
    rotulo: "Cores",
    cor: "#f472b6",
    opcoes: [
      { chip: "Pastel suave", trecho: "paleta pastel suave" },
      { chip: "Vibrante e quente", trecho: "cores vibrantes e quentes" },
      { chip: "Azul e dourado", trecho: "paleta azul profundo com detalhes dourados" },
    ],
  },
  {
    id: "fundo",
    rotulo: "Fundo",
    cor: "#a3e635",
    opcoes: [
      { chip: "Liso e limpo", trecho: "fundo liso e limpo" },
      { chip: "Gradiente sutil", trecho: "fundo em gradiente sutil" },
      { chip: "Cena desfocada", trecho: "fundo de cena levemente desfocada" },
    ],
  },
  {
    id: "luz",
    rotulo: "Luz",
    cor: "#f5c04e",
    opcoes: [
      { chip: "Suave de estúdio", trecho: "iluminação suave de estúdio" },
      { chip: "Golden hour", trecho: "luz quente de fim de tarde" },
      { chip: "Neon dramático", trecho: "iluminação neon dramática" },
    ],
  },
];

export function PromptBuilderGame() {
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});
  const [copiado, setCopiado] = useState(false);

  const completo = INGREDIENTES.every((ing) => escolhas[ing.id] !== undefined);

  const prompt = useMemo(() => {
    if (!completo) return "";
    const partes = INGREDIENTES.map((ing) => ing.opcoes[escolhas[ing.id]].trecho);
    return `Crie uma imagem: ${partes[0]}, ${partes[1]}, ${partes[2]}, ${partes[3]}, ${partes[4]}, alta qualidade, sem texto.`;
  }, [escolhas, completo]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* clipboard indisponível */ }
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
        {INGREDIENTES.map((ing) => (
          <div key={ing.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span
              className="shrink-0 w-20 text-[11px] font-extrabold uppercase tracking-widest"
              style={{ color: ing.cor }}
            >
              {ing.rotulo}
            </span>
            <div className="flex flex-wrap gap-2">
              {ing.opcoes.map((op, idx) => {
                const ativo = escolhas[ing.id] === idx;
                return (
                  <button
                    key={op.chip}
                    onClick={() => setEscolhas((e) => ({ ...e, [ing.id]: idx }))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
                      ativo ? "scale-[1.03]" : "border-border text-muted-foreground hover:text-foreground hover:border-white/30"
                    )}
                    style={ativo ? { borderColor: ing.cor, background: `${ing.cor}1e`, color: ing.cor } : undefined}
                  >
                    {op.chip}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
