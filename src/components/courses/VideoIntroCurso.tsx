"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { midiaDoCurso } from "@/data/curso-midia";

/**
 * O vídeo de abertura da página de curso.
 *
 * ⚠️ Não confundir com o loop de capa (`CapaDoCurso`). Aquele é imóvel de
 * propósito, para o modelo de vídeo não derreter o título gravado no livro.
 * Este é o oposto: câmera em movimento, nenhuma letra dentro do quadro, e o
 * texto que aparece por cima é HTML — sempre legível, traduzível e lido pelo
 * Google, que é o que o título assado no pixel nunca foi.
 *
 * ── Por que toca sozinho, e por que isso é seguro ──────────────────────────
 *
 * `muted` + `playsInline` + `loop`: é a única combinação que os navegadores
 * deixam iniciar sem gesto do visitante. Sem `muted`, o `play()` é recusado e
 * a página mostraria um pôster parado fingindo ser vídeo.
 *
 * E toca **só enquanto está na tela**. Um vídeo que continua rodando depois de
 * a pessoa ter descido para o currículo gasta bateria e não é visto por
 * ninguém — o `IntersectionObserver` pausa e o botão devolve o controle a quem
 * quiser parar de vez.
 *
 * `preload="none"` até o pôster aparecer: a página de venda já carrega a capa,
 * o loop da capa e três cenas. Baixar mais um vídeo antes de alguém chegar
 * nele atrasaria justamente a dobra que decide a venda.
 */
export function VideoIntroCurso({
  slug,
  titulo,
  chamada,
}: {
  slug: string;
  titulo: string;
  chamada?: string;
}) {
  const intro = midiaDoCurso(slug).intro;
  const video = useRef<HTMLVideoElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [tocando, setTocando] = useState(false);
  /** Quem apertou "pausar" não quer que a rolagem religue o vídeo. */
  const pausadoAMao = useRef(false);

  useEffect(() => {
    if (!intro || !caixa.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        const v = video.current;
        if (!v) return;
        if (e.isIntersecting && !pausadoAMao.current) {
          v.play()
            .then(() => setTocando(true))
            .catch(() => {});
        } else {
          v.pause();
          setTocando(false);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(caixa.current);
    return () => obs.disconnect();
  }, [intro]);

  if (!intro) return null;

  const alternar = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      pausadoAMao.current = false;
      v.play()
        .then(() => setTocando(true))
        .catch(() => {});
    } else {
      pausadoAMao.current = true;
      v.pause();
      setTocando(false);
    }
  };

  return (
    <section className="relative bg-black py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div
          ref={caixa}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-amber-500/25 bg-[#05060a] shadow-[0_40px_120px_-50px_rgba(245,192,78,.55)]"
        >
          <video
            ref={video}
            src={intro.video}
            poster={intro.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-label={`Vídeo de abertura do curso ${titulo}`}
            className="aspect-video w-full object-cover"
          />

          {/* O escurecimento existe para o texto, e só onde há texto: a metade
              de cima do quadro fica limpa, que é onde a câmera do vídeo
              costuma pousar o assunto. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(3,4,8,.92) 0%, rgba(3,4,8,.7) 22%, rgba(3,4,8,.25) 46%, transparent 70%)",
            }}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80">
                Uma olhada por dentro
              </p>
              <h2 className="mt-1 text-xl font-bold leading-tight text-white sm:text-3xl">
                {titulo}
              </h2>
              {chamada && (
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/65">
                  {chamada}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={alternar}
              aria-label={tocando ? "Pausar o vídeo" : "Tocar o vídeo"}
              className="pointer-events-auto shrink-0 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:border-amber-400/60 hover:bg-amber-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {tocando ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
