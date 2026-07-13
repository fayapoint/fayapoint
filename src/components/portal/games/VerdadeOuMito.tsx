"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RefreshCw, ArrowRight } from "lucide-react";

/**
 * Verdade ou Mito — minigame do Arcade (F4). Dez afirmações sobre IA,
 * julgamento rápido com feedback animado e explicação curta. Sem XP fake:
 * a recompensa é sair sabendo separar hype de realidade.
 */

const CARTAS: { frase: string; verdade: boolean; explica: string }[] = [
  { frase: "Você pode gravar uma reunião no celular e pedir para a IA transcrever e resumir.", verdade: true, explica: "É um dos usos mais práticos: áudio → texto → ata com decisões e pendências." },
  { frase: "A IA sempre diz a verdade.", verdade: false, explica: "IAs podem 'alucinar' — inventar fatos com confiança. Sempre confira informações importantes." },
  { frase: "Para usar IA no trabalho você precisa saber programar.", verdade: false, explica: "Saber conversar (prompt) já resolve a maioria dos usos do dia a dia." },
  { frase: "Uma IA pode te ajudar a entender um contrato antes de assinar.", verdade: true, explica: "Cole a cláusula e peça a explicação simples + o que perguntar antes de assinar." },
  { frase: "IAs conseguem analisar uma foto que você envia.", verdade: true, explica: "Modelos multimodais leem imagens: planta, prato, boleto, print de erro..." },
  { frase: "A IA sabe tudo que aconteceu no mundo em tempo real.", verdade: false, explica: "O conhecimento tem data de corte; sem busca conectada, ela não viu a notícia de hoje." },
  { frase: "Dá para criar uma música completa, com letra em português, usando IA.", verdade: true, explica: "Geradores de música criam melodia, arranjo e vocal a partir de uma descrição." },
  { frase: "Prompts mais longos são sempre melhores.", verdade: false, explica: "Clareza vale mais que tamanho: contexto + tarefa + formato desejado." },
  { frase: "A IA pode montar seu cardápio da semana só com o que tem na geladeira.", verdade: true, explica: "Liste os ingredientes e peça cardápio + lista de compras do que faltar." },
  { frase: "Usar IA é sempre pago e caro.", verdade: false, explica: "Há versões gratuitas poderosas de chat, imagem e transcrição — o custo é aprender a usar." },
];

export function VerdadeOuMito() {
  const [i, setI] = useState(0);
  const [resposta, setResposta] = useState<boolean | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  const carta = CARTAS[i];
  const acertou = resposta !== null && resposta === carta.verdade;

  const responder = (v: boolean) => {
    if (resposta !== null) return;
    setResposta(v);
    if (v === carta.verdade) setAcertos((a) => a + 1);
  };

  const proxima = () => {
    if (i + 1 >= CARTAS.length) { setFim(true); return; }
    setI(i + 1);
    setResposta(null);
  };

  const reiniciar = () => { setI(0); setResposta(null); setAcertos(0); setFim(false); };

  if (fim) {
    const nota = acertos >= 9 ? "Você separa hype de realidade como gente grande! 🏆" : acertos >= 6 ? "Mandou bem — o resto a trilha ensina. ✨" : "Ótimo começo: agora você sabe o que NÃO sabia. 🌱";
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <p className="text-5xl font-extrabold" style={{ color: "#f5c04e" }}>{acertos}/{CARTAS.length}</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{nota}</p>
        <button onClick={reiniciar} className="mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold text-[#241a05]" style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}>
          <RefreshCw size={14} /> Jogar de novo
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        <span>Carta {i + 1} de {CARTAS.length}</span>
        <span style={{ color: "#f5c04e" }}>{acertos} acertos</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 30, rotate: 1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border p-5 text-center"
          style={{
            borderColor: resposta === null ? "rgba(255,255,255,.14)" : acertou ? "#a3e63588" : "#f4727688",
            background: resposta === null ? "rgba(22,26,54,.42)" : acertou ? "rgba(163,230,53,.08)" : "rgba(244,114,118,.08)",
            boxShadow: resposta !== null ? `0 14px 40px -14px ${acertou ? "#a3e635" : "#f47276"}55` : undefined,
          }}
        >
          <p className="text-base sm:text-lg font-bold leading-snug">{carta.frase}</p>

          {resposta === null ? (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button onClick={() => responder(true)} className="flex items-center gap-2 rounded-2xl px-6 py-3 font-extrabold text-[#0c2a12] hover:scale-[1.04] transition-transform" style={{ background: "linear-gradient(135deg, #a3e635, #d3f36b)" }}>
                <Check size={17} strokeWidth={3} /> Verdade
              </button>
              <button onClick={() => responder(false)} className="flex items-center gap-2 rounded-2xl px-6 py-3 font-extrabold text-white hover:scale-[1.04] transition-transform" style={{ background: "linear-gradient(135deg, #f47276, #f472b6)" }}>
                <X size={17} strokeWidth={3} /> Mito
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: acertou ? "#a3e635" : "#f47276" }}>
                {acertou ? "Acertou!" : carta.verdade ? "Era verdade!" : "Era mito!"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{carta.explica}</p>
              <button onClick={proxima} className="mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold text-[#241a05]" style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}>
                {i + 1 >= CARTAS.length ? "Ver resultado" : "Próxima"} <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
