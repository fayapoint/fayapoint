"use client";

/**
 * A BANCADA DA LENTE — ver funcionando, em vez de deduzir do código.
 *
 * Monta a lente sobre o TEXTO REAL de um capítulo (o mesmo que o aluno lê) com
 * a RÉGUA REAL do montador, e deixa trocar a fonte de tempo entre:
 *
 *   · o áudio do audiobook (`capNN.m4a`),
 *   · o vídeo da aula montado na máquina (`capNN.mp4`, URL direta),
 *   · um vídeo do YouTube, digitando o ID.
 *
 * ⚠️ A estrutura de rolagem é a MESMA do leitor de propósito: `min-h-screen
 * flex flex-col` com um `<main class="flex-1 overflow-y-auto">`. É esse arranjo
 * que faz quem rola ser a JANELA e não o `<main>` — o defeito que fez a lente
 * "não acompanhar o texto" e que `rolagem.ts` mede em vez de deduzir. Testar
 * numa página com outro arranjo aprovaria uma lente que não funciona no leitor.
 *
 * ⚠️ Ela mora DENTRO de `[locale]` porque o proxy de idioma prefixa toda URL
 * sem idioma (medido em 26/08, ver `next.config`): uma rota na raiz levaria 308
 * para `/pt-BR/…` e cairia em 404.
 *
 * ⛔ A rota de dados (`/api/prova-lente`) só responde em desenvolvimento; esta
 * página sem ela mostra o erro e mais nada.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import LenteSobreposta from "@/components/portal/LenteSobreposta";
import type { LinhaDoTempo } from "@/components/portal/LenteDeLeitura";
import type { VideoDaAula } from "@/lib/lente-fonte";

type Pacote = {
  curso: string;
  capitulo: number;
  markdown: string | null;
  linhaDoTempo: LinhaDoTempo;
  audio: string;
  video: string;
  temVideo: boolean;
};

export default function BancadaDaLente() {
  const rolagemRef = useRef<HTMLElement | null>(null);
  const conteudoRef = useRef<HTMLDivElement | null>(null);

  const [curso, setCurso] = useState("chatgpt-zero");
  const [cap, setCap] = useState(3);
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ytId, setYtId] = useState("");
  /** Qual vídeo entregar à lente: o arquivo montado aqui, ou um do YouTube. */
  const [origemDoVideo, setOrigemDoVideo] = useState<"arquivo" | "youtube">("arquivo");

  const carregar = useCallback(() => {
    setErro(null);
    setPacote(null);
    fetch(`/api/prova-lente?curso=${curso}&cap=${cap}`)
      .then((r) => r.json())
      .then((d) => (d.erro ? setErro(d.erro) : setPacote(d)))
      .catch((e) => setErro(String(e)));
  }, [curso, cap]);

  useEffect(() => { carregar(); }, [carregar]);

  const video: VideoDaAula | null = !pacote
    ? null
    : origemDoVideo === "youtube" && ytId.trim().length >= 11
      ? { fonte: "youtube", videoId: ytId.trim().slice(-11), titulo: "prova" }
      : pacote.temVideo
        ? { fonte: "arquivo", url: pacote.video, titulo: "prova" }
        : null;

  return (
    <div
      data-reader-theme="dark"
      className="min-h-screen flex flex-col text-[var(--reader-fg)] bg-[var(--reader-bg)]"
    >
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-surface)] px-4 py-2 text-xs">
        <strong className="text-[rgba(var(--reader-tint),0.7)]">bancada da lente</strong>
        <input value={curso} onChange={(e) => setCurso(e.target.value)}
          className="w-44 rounded bg-[rgba(var(--reader-tint),0.07)] px-2 py-1" aria-label="curso" />
        <input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))}
          className="w-16 rounded bg-[rgba(var(--reader-tint),0.07)] px-2 py-1" aria-label="capítulo" />
        <button onClick={carregar} className="rounded bg-violet-600 px-3 py-1 text-white">carregar</button>

        <span className="ml-2 text-[rgba(var(--reader-tint),0.4)]">vídeo:</span>
        <button onClick={() => setOrigemDoVideo("arquivo")}
          className={origemDoVideo === "arquivo" ? "rounded bg-violet-500/30 px-2 py-1" : "rounded px-2 py-1 text-[rgba(var(--reader-tint),0.5)]"}>
          arquivo local
        </button>
        <button onClick={() => setOrigemDoVideo("youtube")}
          className={origemDoVideo === "youtube" ? "rounded bg-violet-500/30 px-2 py-1" : "rounded px-2 py-1 text-[rgba(var(--reader-tint),0.5)]"}>
          youtube
        </button>
        <input value={ytId} onChange={(e) => setYtId(e.target.value)} placeholder="id do youtube"
          className="w-40 rounded bg-[rgba(var(--reader-tint),0.07)] px-2 py-1" aria-label="id do youtube" />

        {pacote && (
          <span className="ml-auto tabular-nums text-[rgba(var(--reader-tint),0.45)]">
            {pacote.linhaDoTempo.falas.length} falas · {Math.round(pacote.linhaDoTempo.segundos)}s
            {pacote.temVideo ? " · mp4 ok" : " · sem mp4"}
          </span>
        )}
      </header>

      <main ref={rolagemRef} className="flex-1 overflow-y-auto">
        {erro && <p className="p-8 text-amber-300">{erro}</p>}
        {!pacote && !erro && <p className="p-8 text-[rgba(var(--reader-tint),0.4)]">carregando…</p>}
        {pacote?.markdown && (
          <div
            ref={conteudoRef}
            className="prose prose-invert mx-auto max-w-3xl px-6 py-10"
            style={{ fontSize: "17px", lineHeight: 1.75 }}
          >
            {/* Os marcadores `<!--media:…-->` são instruções de arte, não texto:
                o leitor os consome no `sanitizeCourseMarkdown` dele. Aqui eles
                só precisam sair da frente, senão viram parágrafo e sujam o DOM
                que a lente vasculha. */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {pacote.markdown.replace(/<!--[\s\S]*?-->/g, "")}
            </ReactMarkdown>
          </div>
        )}
        {pacote && !pacote.markdown && (
          <p className="p-8 text-amber-300">
            o capítulo {pacote.capitulo} não existe no `courseContent` de {pacote.curso}
          </p>
        )}
        <div className="h-40" />
      </main>

      {pacote?.markdown && (
        <LenteSobreposta
          key={`${pacote.curso}:${pacote.capitulo}`}
          conteudoRef={conteudoRef}
          rolagemRef={rolagemRef}
          src={pacote.audio}
          video={video}
          linhaDoTempo={pacote.linhaDoTempo}
          chave={`prova:${pacote.curso}:${pacote.capitulo}`}
        />
      )}
    </div>
  );
}
