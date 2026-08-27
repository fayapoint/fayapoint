"use client";

import { useState } from "react";
import { Download, ImagePlus, Loader2, Zap } from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";
import type { TrabalhoNaFila } from "./BarraDaFila";

/**
 * ⚠️ `<img>` e não `next/image`, e a razão é do repositório inteiro.
 *
 * As referências e as artes moram no Cloudinary, e o `next.config.ts` **não
 * declara `images.remotePatterns`**. `next/image` recusa host não declarado — e
 * aqui o sintoma nem foi o buraco silencioso que a Vitrine do Ateliê levou: foi
 * "Application error: a client-side exception", a tela inteira branca, na
 * primeira vez que um personagem tinha foto. Ver o cabeçalho de
 * `AtelieVitrine.tsx`.
 */

/**
 * UMA IMAGEM, A PEDIDO.
 *
 * ## Por que isto não manda o texto do usuário direto para o gerador
 *
 * O caminho ingênuo falha por três motivos que se somam: a pessoa escreve em
 * português (o gerador entende pior), escreve o QUE quer e não o que se VÊ
 * ("algo que passe confiança"), e não diz nada de câmera. O resultado é a
 * imagem genérica de banco que ela poderia ter baixado de graça.
 *
 * Então o pedido passa por uma tradução: um modelo de linguagem transforma o
 * desejo em plano de quadro com ajustes em vocabulário FECHADO, e o prompt
 * final continua sendo composto por código. A pessoa escreve como fala; o
 * gerador recebe como precisa.
 *
 * ⚠️ A tradução é um ATALHO, não um requisito. Se o modelo tropeçar, o pedido
 * cru vira a ação e a imagem sai assim mesmo — perder o pedido inteiro por
 * causa de uma chamada que às vezes falha seria o pior dos dois mundos.
 */

const ASPECTOS = [
  { id: "4:5", rotulo: "Feed (4:5)" },
  { id: "9:16", rotulo: "Story (9:16)" },
  { id: "1:1", rotulo: "Quadrado" },
  { id: "16:9", rotulo: "Capa (16:9)" },
];

export default function ImagemAvulsa({
  trabalhos,
  aoMudarFila,
}: {
  trabalhos: TrabalhoNaFila[];
  aoMudarFila: () => void;
}) {
  const T = useT();
  const [pedido, setPedido] = useState("");
  const [aspecto, setAspecto] = useState("4:5");
  const [comTexto, setComTexto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimaLeitura, setUltimaLeitura] = useState("");

  const prontas = trabalhos.filter((t) => t.estado === "pronto" && t.resultado?.url).slice(0, 8);

  async function pedir(furarFila = false) {
    if (pedido.trim().length < 4) {
      setErro(T("Diga o que você quer ver."));
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const r = await fetch("/api/forja/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ alvo: "avulso", pedido, aspecto, textoNaArte: comTexto, furarFila }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(
          r.status === 402 ? `${T("Faltam")} ${d.faltam} ${T("créditos.")}` : d.error || T("Não deu para enfileirar."),
        );
        return;
      }
      setUltimaLeitura(d.leitura || "");
      setPedido("");
      aoMudarFila();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus className="h-4 w-4 text-indigo-400" /> {T("Só uma imagem")}
        </h2>
        <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
          {T(
            "Escreva como você falaria. Eu traduzo para o que a câmera vê — enquadramento, luz, lente — e mando para a GPU da FayAI.",
          )}
        </p>

        <textarea
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          rows={3}
          placeholder={T("Ex.: eu no balcão da loja no fim da tarde, entregando uma sacola para uma cliente")}
          className="mt-3 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {ASPECTOS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspecto(a.id)}
                className={`rounded-lg px-2.5 py-1 text-[10px] transition ${
                  aspecto === a.id ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
                }`}
              >
                {T(a.rotulo)}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-500">
            <input
              type="checkbox"
              checked={comTexto}
              onChange={(e) => setComTexto(e.target.checked)}
              className="h-3 w-3 accent-indigo-500"
            />
            {T("com letra dentro da imagem")}
          </label>
        </div>

        {comTexto && (
          <p className="mt-2 text-[10px] leading-relaxed text-amber-300/70">
            {T(
              "Escrever dentro da arte usa outro gerador, mais lento, e é o único que acerta português. Frase curta funciona muito melhor que frase longa.",
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => pedir(false)}
            disabled={enviando}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {T("Gerar")} · {T("grátis")}
          </button>
          <button
            onClick={() => pedir(true)}
            disabled={enviando}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-2 text-[11px] text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
            title={T("Passa na frente de quem está esperando")}
          >
            <Zap className="h-3 w-3" /> {T("na frente da fila")}
          </button>
        </div>

        {erro && <p className="mt-3 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300">{erro}</p>}
        {ultimaLeitura && (
          <div className="mt-3 rounded-lg bg-slate-950/60 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{T("Entendi assim")}</p>
            <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-slate-400">{ultimaLeitura}</p>
          </div>
        )}
      </div>

      {!!prontas.length && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold">{T("Saiu da forja")}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {prontas.map((t) => (
              <a
                key={t._id}
                href={t.resultado?.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-slate-800"
              >
                {/(mp4|webm)$/i.test(t.resultado?.url || "") ? (
                  <video src={t.resultado?.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={t.resultado?.url as string} alt={t.rotulo} className="absolute inset-0 h-full w-full object-cover" />
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-slate-950/80 px-2 py-1 text-[9px] text-slate-300 opacity-0 transition group-hover:opacity-100">
                  <Download className="h-2.5 w-2.5" /> {T("abrir")}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
