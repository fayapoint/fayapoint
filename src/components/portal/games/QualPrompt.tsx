"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ArrowRight, Check, X } from "lucide-react";

/**
 * Qual Prompt Gerou Isto? — minigame do Arcade (F4). Mostra uma arte REAL do
 * site (gerada no ComfyUI) e três prompts candidatos; adivinhe qual criou a
 * imagem. Treina o olho para a relação prompt → resultado.
 */

interface Rodada {
  img: string;
  opcoes: [string, string, string];
  certa: 0 | 1 | 2;
  dica: string;
}

const RODADAS: Rodada[] = [
  {
    img: "/landing/scenes/reuniao-resumida.webp",
    opcoes: [
      "Robô DJ tocando música em um celular com luzes de festa",
      "Celular com app de gravador e onda sonora se transformando em checklist",
      "Fone de ouvido flutuando sobre um caderno de anotações",
    ],
    certa: 1,
    dica: "O botão vermelho de gravar e a onda virando lista entregam o jogo.",
  },
  {
    img: "/landing/scenes/professor-24h.webp",
    opcoes: [
      "Robô professor com lousa mostrando bola de futebol e moedas, caneca aluna",
      "Jogador de futebol robô chutando uma pilha de livros",
      "Professora humana escrevendo fórmulas em um quadro verde",
    ],
    certa: 0,
    dica: "Futebol + moedas na lousa = juros compostos com analogia de futebol.",
  },
  {
    img: "/landing/scenes/cardapio-semana.webp",
    opcoes: [
      "Chef robô cozinhando macarrão em uma panela gigante",
      "Mesa de jantar posta com velas e taças",
      "Geladeira aberta com ingredientes sorridentes e calendário de refeições surgindo",
    ],
    certa: 2,
    dica: "Os ingredientes com rostinho DENTRO da geladeira são o palco da cena.",
  },
  {
    img: "/landing/scenes/flashcards.webp",
    opcoes: [
      "Livro aberto com páginas virando cartões de estudo voadores",
      "Estante de biblioteca com livros brilhantes",
      "Caderno com anotações e uma caneta dourada",
    ],
    certa: 0,
    dica: "A transformação livro → cartões é exatamente o que o prompt pede.",
  },
  {
    img: "/landing/scenes/conta-explicada.webp",
    opcoes: [
      "Advogado robô discursando em um tribunal",
      "Robô com lupa sobre documento de letras miúdas e balão com lâmpada",
      "Pilha de boletos com um carimbo vermelho de pago",
    ],
    certa: 1,
    dica: "Lupa nas letras miúdas + ideia clara saindo = contrato traduzido.",
  },
];

export function QualPrompt() {
  const [i, setI] = useState(0);
  const [resposta, setResposta] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  const r = RODADAS[i];
  const acertou = resposta !== null && resposta === r.certa;

  const proxima = () => {
    if (i + 1 >= RODADAS.length) { setFim(true); return; }
    setI(i + 1); setResposta(null);
  };
  const reiniciar = () => { setI(0); setResposta(null); setAcertos(0); setFim(false); };

  if (fim) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <p className="text-5xl font-extrabold" style={{ color: "#f5c04e" }}>{acertos}/{RODADAS.length}</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          {acertos === RODADAS.length ? "Olho calibrado: você já lê imagens como prompts! 🏆" : "Cada acerto é seu olho aprendendo a receita por trás da imagem. ✨"}
        </p>
        <button onClick={reiniciar} className="mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold text-[#241a05]" style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}>
          <RefreshCw size={14} /> Jogar de novo
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        <span>Rodada {i + 1} de {RODADAS.length}</span>
        <span style={{ color: "#f5c04e" }}>{acertos} acertos</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
          <div className="relative overflow-hidden rounded-2xl border border-border" style={{ aspectRatio: "3 / 2", maxWidth: 460, margin: "0 auto" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.img} alt="Qual prompt gerou esta imagem?" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          <p className="mt-4 text-center text-sm font-bold">Qual prompt gerou esta imagem?</p>

          <div className="mt-3 space-y-2 max-w-lg mx-auto">
            {r.opcoes.map((op, idx) => {
              const escolhida = resposta === idx;
              const revelada = resposta !== null;
              const éCerta = idx === r.certa;
              return (
                <button
                  key={idx}
                  onClick={() => resposta === null && (setResposta(idx), idx === r.certa && setAcertos((a) => a + 1))}
                  className="w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all"
                  style={{
                    borderColor: revelada ? (éCerta ? "#a3e635" : escolhida ? "#f47276" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.14)",
                    background: revelada && éCerta ? "rgba(163,230,53,.1)" : revelada && escolhida ? "rgba(244,114,118,.1)" : "rgba(22,26,54,.42)",
                    opacity: revelada && !éCerta && !escolhida ? 0.55 : 1,
                  }}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold shrink-0" style={{ background: "rgba(255,255,255,.1)" }}>
                    {revelada && éCerta ? <Check size={13} className="text-lime-400" /> : revelada && escolhida ? <X size={13} className="text-rose-400" /> : String.fromCharCode(65 + idx)}
                  </span>
                  {op}
                </button>
              );
            })}
          </div>

          {resposta !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
              <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: acertou ? "#a3e635" : "#f47276" }}>
                {acertou ? "Acertou!" : "Quase!"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{r.dica}</p>
              <button onClick={proxima} className="mt-3 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold text-[#241a05]" style={{ background: "linear-gradient(135deg, #f5c04e, #ffd97a)" }}>
                {i + 1 >= RODADAS.length ? "Ver resultado" : "Próxima"} <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
