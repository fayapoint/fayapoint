"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/arcade/engine";

/**
 * Vídeo de ambiente — a "Liga B" da §10 da identidade, com as travas dela.
 *
 * As três regras que este componente existe para não deixar ninguém esquecer:
 *
 *  1. **O conteúdo nunca depende da animação** (§5). O pôster é a MESMA cena, e
 *     é ele que aparece enquanto o vídeo não carrega — ou para sempre, se o
 *     navegador recusar. A página fica idêntica com e sem movimento.
 *  2. **`prefers-reduced-motion` desliga de verdade**: não é só pausar, é não
 *     baixar. Quem pediu menos movimento não paga 100KB por ele.
 *  3. **Só toca quando está à vista.** Um `autoPlay` solto roda o clipe no
 *     rodapé de uma página de 5.000px, gastando bateria por nada.
 *
 * `preload="none"` + carregamento sob interseção: o vídeo só entra na rede
 * quando de fato vai ser visto.
 */
export function VideoAmbiente({
  nome,
  className,
  style,
}: {
  /** Base do arquivo em `/public/game/` — `X.webm` e `X-poster.webp`. */
  nome: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduzido = useReducedMotion();
  const [visivel, setVisivel] = useState(false);

  // O observador só ANOTA a visibilidade. Ele não toca.
  useEffect(() => {
    if (reduzido) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entrada]) => setVisivel(entrada.isIntersecting),
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduzido]);

  /**
   * Tocar é um efeito SEPARADO, e é o que faz o componente funcionar.
   *
   * Chamar `play()` dentro do callback do observador parece natural e não toca
   * nada: naquele instante o `src` ainda não existe — ele só é anexado no
   * render que o `setVisivel` provoca. O `play()` cai num elemento sem fonte,
   * a promessa rejeita em silêncio, e o que se vê é o pôster parado para
   * sempre, sem erro no console. Aqui o efeito roda DEPOIS do render que
   * colocou o `src`.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el || reduzido) return;
    if (visivel) void el.play().catch(() => {});
    else el.pause();
  }, [visivel, reduzido]);

  return (
    <video
      ref={ref}
      className={className}
      style={style}
      poster={`/game/${nome}-poster.webp`}
      // Sem `src` até estar à vista: é o que faz o `preload="none"` valer.
      src={reduzido || !visivel ? undefined : `/game/${nome}.webm`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
    />
  );
}
