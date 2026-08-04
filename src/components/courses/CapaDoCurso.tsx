"use client";

import { useEffect, useRef, useState } from "react";
import { loopDaCapa } from "@/lib/capa-loop";

/**
 * A capa do curso — o livro parado, e o mesmo livro respirando quando há loop.
 *
 * Um só componente para os dois lugares onde a capa aparece (o card da vitrine e
 * o topo da página de venda), porque o alinhamento entre a imagem e o vídeo é
 * delicado e não pode ser reinventado em cada tela:
 *
 * - a capa estática é 720×1040 e o loop é 960×960;
 * - a capa estática foi montada com a arte quadrada ocupando a LARGURA cheia e
 *   tarja borrada em cima e embaixo, com as bordas dissolvidas num degradê;
 * - logo o vídeo é posicionado sobre essa faixa (15,385% de recuo, 69,231% de
 *   altura) e recebe a MESMA dissolução por máscara CSS. Esticá-lo na caixa
 *   inteira o faria crescer 44% e comer o título gravado.
 *
 * `preload="none"` é obrigatório no modo hover: a vitrine tem oito cursos com
 * loop, e pré-carregar todos custaria ~2 MB para quem talvez não passe o mouse
 * em nenhum.
 */
export function CapaDoCurso({
  slug,
  thumbnail,
  alt,
  modo = "hover",
  className = "",
  eager = false,
}: {
  slug: string;
  thumbnail?: string | null;
  alt: string;
  /** `hover` para os cards; `auto` para o herói, que toca sozinho quando visível. */
  modo?: "hover" | "auto";
  className?: string;
  eager?: boolean;
}) {
  const loop = loopDaCapa(slug);
  const video = useRef<HTMLVideoElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [tocando, setTocando] = useState(false);
  const [podeAnimar, setPodeAnimar] = useState(false);

  // Quem pediu menos movimento no sistema vê só o livro parado. A checagem mora
  // no cliente porque o servidor não sabe a preferência de quem vai olhar.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setPodeAnimar(!mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  // Modo `auto`: só toca enquanto está na tela. Um herói que continua rodando
  // depois que a pessoa rolou para os módulos gasta bateria e não é visto.
  useEffect(() => {
    if (modo !== "auto" || !podeAnimar || !loop || !caixa.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        const v = video.current;
        if (!v) return;
        if (e.isIntersecting) {
          v.play().then(() => setTocando(true)).catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(caixa.current);
    return () => obs.disconnect();
  }, [modo, podeAnimar, loop]);

  const entrar = () => {
    if (modo !== "hover" || !podeAnimar) return;
    const v = video.current;
    if (!v) return;
    v.play().then(() => setTocando(true)).catch(() => {});
  };

  const sair = () => {
    if (modo !== "hover") return;
    const v = video.current;
    if (!v) return;
    v.pause();
    setTocando(false);
  };

  return (
    <div
      ref={caixa}
      className={`relative overflow-hidden aspect-[720/1040] ${className}`}
      onMouseEnter={entrar}
      onMouseLeave={sair}
      onFocus={entrar}
      onBlur={sair}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading={eager ? "eager" : "lazy"}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-yellow-700" />
      )}

      {loop && podeAnimar && (
        <video
          ref={video}
          src={loop.video}
          poster={loop.poster}
          muted
          loop
          playsInline
          preload={modo === "auto" ? "metadata" : "none"}
          aria-hidden="true"
          /* A caixa do vídeo é a FAIXA DA ARTE, não a capa inteira.
             A capa 720×1040 é a arte quadrada de 720 centrada, com 160px de
             desfoque em cima e embaixo: 160/1040 = 15,385% de recuo e
             720/1040 = 69,231% de altura. Assim o vídeo quadrado cai exatamente
             sobre o próprio quadro dentro da imagem, e `object-cover` não
             deforma nada porque a caixa também é quadrada.

             A máscara existe porque a arte estática tem as bordas dissolvidas
             (96px de desvanecimento, = 13,3% dos 720). Sem repetir esse
             desvanecimento aqui, o vídeo entraria com borda reta por cima de uma
             imagem sem borda — e a linha que o degradê apagou reapareceria toda
             vez que o livro começasse a respirar. */
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 13.3%, #000 86.7%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 13.3%, #000 86.7%, transparent 100%)",
          }}
          className={`absolute left-0 w-full top-[15.385%] h-[69.231%] object-cover transition-opacity duration-500 ${
            tocando ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
