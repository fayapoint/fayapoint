"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * AS PEÇAS REAIS NA MESA — o que a fábrica entrega, montado pela rolagem.
 *
 * Aqui não entra imagem gerada para parecer entrega: são o carrossel, o reel e
 * a aula que a operação da FayAI produziu (`D:\fayai\30_REDES`, `20_AULAS`). Página
 * que vende operação e mostra maquete está vendendo maquete.
 *
 * A mesa monta em três tempos, cada um com a sua variável de CSS:
 *   --pa  as nove lâminas do carrossel se abrem em leque
 *   --pb  o celular sobe com o reel tocando
 *   --pc  a aula entra pela direita
 *
 * O CSS nasce com as três em 1 — a mesa MONTADA. Sem JavaScript, com movimento
 * reduzido ou no celular (onde não há trilho), a pessoa vê tudo no lugar. O
 * efeito só recua para 0 quando o JavaScript já está medindo a rolagem.
 */
export function MesaDePecas({ slides, reel, aula }: { slides: string[]; reel: { src: string; capa: string }; aula: string }) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const parado = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 900px)");
    let pedido = 0;
    let visivel = false;

    const faixa = (p: number, de: number, ate: number) => Math.min(1, Math.max(0, (p - de) / (ate - de)));
    const pintar = () => {
      pedido = 0;
      if (parado.matches) {
        for (const v of ["--pa", "--pb", "--pc"]) el.style.removeProperty(v);
        el.dataset.fase = "todas";
        return;
      }
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      const pa = faixa(p, 0.02, 0.36);
      const pb = faixa(p, 0.34, 0.64);
      const pc = faixa(p, 0.62, 0.9);
      el.style.setProperty("--pa", pa.toFixed(4));
      el.style.setProperty("--pb", pb.toFixed(4));
      el.style.setProperty("--pc", pc.toFixed(4));
      el.dataset.fase = String(pc > 0.3 ? 3 : pb > 0.3 ? 2 : 1);
    };
    const pedir = () => {
      if (!pedido && visivel) pedido = requestAnimationFrame(pintar);
    };
    const observador = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      pedir();
    });
    observador.observe(el);
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    parado.addEventListener("change", pedir);
    return () => {
      cancelAnimationFrame(pedido);
      observador.disconnect();
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      parado.removeEventListener("change", pedir);
    };
  }, []);

  return (
    <div className="fx-mesa" ref={raiz} data-fase="todas">
      <div className="fx-mesa-palco">
        <div className="fx-mesa-texto">
          <p className="fx-eyebrow">04 · Peças reais</p>
          <h2>
            Isto saiu da fábrica.
            <br />
            <span>Não é maquete.</span>
          </h2>
          <p className="fx-mesa-intro">
            São peças que a operação da FayAI produziu, com a marca da FayAI. Na sua fábrica, elas saem com a sua.
          </p>
          <ol className="fx-mesa-legendas">
            <li data-da-fase="1">
              <time>12:00 · Carrossel</time>
              <p>Nove lâminas com a sua marca. A arte é gerada; a letra sai da fonte, nunca do modelo.</p>
            </li>
            <li data-da-fase="2">
              <time>19:00 · Reel</time>
              <p>Roteiro, narração, legenda e corte. Só vai ao ar depois que a transcrição bate com o roteiro.</p>
            </li>
            <li data-da-fase="3">
              <time>Esteira longa · Aula</time>
              <p>O texto vira aula em vídeo, com cartelas e portões de corte. Faz parte da Fábrica Inteira.</p>
            </li>
          </ol>
        </div>

        <div className="fx-mesa-cena" aria-label="Peças produzidas pela operação da FayAI">
          <div className="fx-leque" role="list" aria-label="Carrossel de nove lâminas">
            {slides.map((s, i) => (
              <figure key={s} role="listitem" className="fx-lamina" style={{ ["--i" as string]: i }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s}
                  alt={i === 0 ? "Capa do carrossel “Como usar Perplexity: o jeito certo”" : `Lâmina ${i + 1} do carrossel`}
                  width={720}
                  height={900}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ))}
          </div>
          <ReelComVoz src={reel.src} capa={reel.capa} />
          <figure className="fx-aula">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aula} alt="Capa de uma aula do curso ChatGPT do Zero" width={960} height={540} loading="lazy" decoding="async" />
            <figcaption>
              <span className="fx-aula-play" aria-hidden="true" />
              Aula em vídeo · ChatGPT do Zero
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}

/**
 * O reel toca mudo enquanto está na tela e para quando sai — vídeo tocando
 * fora da vista gasta bateria de quem está lendo. O som é escolha da pessoa:
 * navegador nenhum deixa começar com som, e não deveria.
 */
export function ReelComVoz({ src, capa }: { src: string; capa: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [mudo, setMudo] = useState(true);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const alternarSom = () => {
    const el = video.current;
    if (!el) return;
    el.muted = !el.muted;
    setMudo(el.muted);
    if (!el.muted) el.play().catch(() => {});
  };

  return (
    <figure className="fx-celular">
      <video ref={video} src={src} poster={capa} muted loop playsInline preload="none" aria-label="Reel “Resposta sem fonte?” produzido pela fábrica" />
      <button type="button" onClick={alternarSom} aria-pressed={!mudo}>
        {mudo ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
        {mudo ? "Ouvir a narração" : "Silenciar"}
      </button>
    </figure>
  );
}
