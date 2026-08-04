"use client";

import { useEffect, useRef } from "react";

/**
 * O loop de fundo do hero de uma página de serviço.
 *
 * Três decisões que valem a leitura:
 *
 * 1. **Ele pausa fora da tela.** Um `<video autoPlay loop>` continua decodificando
 *    quadro a quadro mesmo depois que o visitante rolou para longe — é bateria e
 *    CPU gastas para ninguém. O `IntersectionObserver` aqui é o mesmo padrão de
 *    `VideoAbertura.tsx` no /radar.
 *
 * 2. **`preload="none"` + `poster`.** O primeiro quadro chega como imagem (~30KB) e
 *    o `.webm` (~220KB) só começa a baixar quando a seção entra em cena. Sem isso,
 *    o vídeo disputa banda com o LCP do próprio hero.
 *
 * 3. **`motion-reduce:hidden`.** Quem pediu menos movimento no sistema recebe o
 *    pôster parado, não o loop.
 *
 * O vídeo é decorativo: fica atrás do gradiente e do texto, com opacidade baixa.
 * Se ele competir com o H1, a página perdeu o ponto.
 */
export function ServicoHeroLoop({ slug }: { slug: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respeita a preferência do sistema — nem tenta tocar.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.1 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      aria-hidden
      muted
      loop
      playsInline
      preload="none"
      poster={`/servicos/${slug}-loop.webp`}
      /* `-z-10` porque um elemento posicionado pinta ACIMA dos irmãos que não
         são posicionados — sem isto o loop cobre o H1 do hero. O pai carrega
         `isolate`, então o -10 fica preso a este contexto e não vaza para o
         resto da página. */
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-25 motion-reduce:hidden"
    >
      <source src={`/servicos/${slug}-loop.webm`} type="video/webm" />
    </video>
  );
}
