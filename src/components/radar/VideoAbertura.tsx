"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O plano de abertura da página /radar — o Ricardo em pessoa, ao lado do
 * cabeçalho.
 *
 * Por que é um vídeo e não uma imagem: a página inteira afirma "isto está
 * medindo agora". Um quadro parado ao lado dessa frase não sustenta a
 * afirmação; um plano que respira, sim. E por que é o rosto DELE: numa página
 * cuja tese é "nada aqui é estimado", quem assina o número precisa ter cara.
 *
 * O rosto é uma fotografia real, recortada e composta sobre a cena da marca —
 * não uma pessoa gerada. Ficou medido em 25/07/2026 que a geração local acerta
 * o tipo físico e erra a pessoa, e é justamente numa página sobre honestidade
 * de dado que um rosto "quase ele" seria a pior escolha possível.
 *
 * Cuidados de peso e de respeito ao leitor:
 *  - só carrega quando entra na tela (`preload="none"` + IntersectionObserver);
 *  - pausa quando sai, para não gastar bateria fora de vista;
 *  - mudo e em loop: som que começa sozinho é intrusão, não recurso;
 *  - `prefers-reduced-motion` fica no primeiro quadro, parado.
 */
export function VideoAbertura() {
  const ref = useRef<HTMLVideoElement>(null);
  const [visivel, setVisivel] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const obs = new IntersectionObserver(
      ([e]) => {
        setVisivel(e.isIntersecting);
        if (reduzido) return;
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "120px" }
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  // Sem o arquivo, a página segue inteira: o vídeo é reforço do argumento,
  // nunca o argumento.
  if (falhou) return null;

  return (
    <div
      className="relative w-full lg:w-[420px] xl:w-[480px] rounded-2xl overflow-hidden shrink-0"
      style={{ border: "1px solid #f5c04e33", background: "#0a0d1c" }}
    >
      <video
        ref={ref}
        className="block w-full h-auto"
        style={{ aspectRatio: "16 / 9" }}
        muted
        loop
        playsInline
        preload="none"
        poster="/radar/abertura.webp"
        onError={() => setFalhou(true)}
        aria-label="Ricardo Faya ao lado do globo do Radar FayAI"
      >
        <source src="/radar/abertura.webm" type="video/webm" />
      </video>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, #0c0e1dcc 0%, transparent 42%), radial-gradient(circle at 72% 45%, #f5c04e14, transparent 60%)",
        }}
      />
      <span
        className="absolute left-3 bottom-2.5 text-[10px] uppercase tracking-widest"
        style={{ color: visivel ? "#f5c04e" : "#f5c04e88" }}
      >
        medindo agora
      </span>
    </div>
  );
}
