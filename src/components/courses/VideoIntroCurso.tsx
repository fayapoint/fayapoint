"use client";
import { useT } from "@/i18n/dicionario";

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
  const T = useT();
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

          {/* ── A PROTEÇÃO DO TEXTO ────────────────────────────────────────
              Ricardo, 05/08/2026: *"o texto em cima do vídeo no desktop dá pra
              ler, mas se tivermos um vídeo com o fundo claro ficará bem difícil
              de ler, precisamos também de uma forma de proteger"*.

              O degradê sozinho não protege: ele escurece uma QUANTIDADE fixa,
              e um quadro claro atravessa qualquer quantidade fixa. São três
              camadas, e cada uma cobre o que a anterior não cobre:

              1. o degradê, que dá a base e o acabamento;
              2. `backdrop-filter: brightness(.55) saturate(.9)` na faixa do
                 texto — este é o que resolve o caso do vídeo claro, porque
                 escurece **o que estiver atrás**, seja lá o que for, em vez de
                 pintar preto por cima;
              3. `text-shadow` na própria letra, que sobrevive mesmo se as duas
                 primeiras falharem num navegador sem `backdrop-filter`.

              Só a última é garantida em todo lugar, e é por isso que ela
              existe. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3"
            style={{
              background:
                "linear-gradient(to top, rgba(3,4,8,.94) 0%, rgba(3,4,8,.74) 26%, rgba(3,4,8,.3) 58%, transparent 100%)",
              backdropFilter: "brightness(.55) saturate(.9)",
              WebkitBackdropFilter: "brightness(.55) saturate(.9)",
              maskImage: "linear-gradient(to top, #000 0%, #000 42%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 42%, transparent 100%)",
            }}
          />

          {/* ⚠️ NO CELULAR O TEXTO NÃO FICA POR CIMA — ele desce para o corpo.
              Ricardo: *"no celular fica bem estranho, como você pode ver nas
              imagens"*. E estava: num aparelho de 393px o vídeo tem 221px de
              altura e a chamada do curso ocupa SETE linhas. O bloco era
              `absolute`, então ele não empurrava nada — simplesmente
              atravessava o vídeo inteiro e saía pelos dois lados, cobrindo a
              arte e ficando ilegível sobre ela.

              Sobrepor texto a imagem só funciona quando há área sobrando, e num
              retângulo de 221px não há. No celular fica só o rótulo e o
              título; a chamada vai para baixo do vídeo, onde tem largura. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-8">
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90 sm:text-[11px]"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,.9)" }}
              >
                
                {T("Uma olhada por dentro")}
              </p>
              <h2
                className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-white sm:text-3xl"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,.92), 0 0 40px rgba(0,0,0,.6)" }}
              >
                {T(titulo)}
              </h2>
              {chamada && (
                <p
                  className="mt-1.5 hidden max-w-xl text-sm leading-relaxed text-white/80 sm:line-clamp-2 sm:block"
                  style={{ textShadow: "0 1px 12px rgba(0,0,0,.95)" }}
                >
                  {T(chamada)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={alternar}
              aria-label={tocando ? T("Pausar o vídeo") : T("Tocar o vídeo")}
              className="pointer-events-auto shrink-0 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur-md transition-colors hover:border-amber-400/60 hover:bg-amber-400/15 sm:p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {tocando ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        {/* A chamada, no celular, embaixo do vídeo e com a largura inteira. */}
        {chamada && (
          <p className="mx-auto mt-3 max-w-5xl text-sm leading-relaxed text-white/60 sm:hidden">
            {T(chamada)}
          </p>
        )}
      </div>
    </section>
  );
}
