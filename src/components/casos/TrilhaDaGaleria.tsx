"use client";

import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";

import type { Ato } from "@/dados/casos";
import { useGaleria } from "./estado";

/**
 * A trilha da galeria — uma música por ato, gerada aqui em casa.
 *
 * As seis faixas saíram do ACE-Step 1.5 XL Turbo rodando local (ver
 * `autoresearch/cases/trilhas.py`), com bpm, tonalidade e instrumentação
 * escolhidos por época: sintetizador analógico de 1992 no Ato I, bossa noir no
 * Ato III, metais de abertura de esporte no Ato V.
 *
 * ── As três regras que o navegador impõe, e como elas foram respeitadas ────
 *
 * 1. **Nada toca sozinho.** Autoplay com som é bloqueado, e mesmo quando passa
 *    é falta de educação. Começa mudo; quem quer, liga.
 * 2. **Só o áudio do ato em cena é baixado.** `preload="none"` e um `<audio>`
 *    único que troca de `src` — carregar as seis seria 3,4 MB de uma vez.
 * 3. **A troca é uma dissolvência**, não um corte: o volume desce, a faixa
 *    muda, o volume sobe. Corte seco em música é o erro que um editor de
 *    trinta anos jamais deixaria passar.
 */

const VOLUME = 0.32;

export function TrilhaDaGaleria({ atos }: { atos: Ato[] }) {
  const { ato } = useGaleria();
  const audio = useRef<HTMLAudioElement>(null);
  const [ligada, setLigada] = useState(false);
  const atoTocando = useRef<number>(0);

  // dissolvência entre atos
  useEffect(() => {
    const el = audio.current;
    if (!el || !ligada) return;
    const faixa = atos.find((a) => a.ato === ato);
    if (!faixa || atoTocando.current === ato) return;

    let cancelado = false;
    const trocar = async () => {
      // desce
      for (let v = el.volume; v > 0.02 && !cancelado; v -= 0.04) {
        el.volume = Math.max(0, v);
        await new Promise((r) => setTimeout(r, 28));
      }
      if (cancelado) return;
      atoTocando.current = ato;
      el.src = faixa.trilha;
      el.volume = 0;
      try {
        await el.play();
      } catch {
        // o navegador recusou: o usuário desligou o som ou saiu da aba.
        // Não é erro de programa — não há nada a consertar aqui.
        return;
      }
      // sobe
      for (let v = 0; v < VOLUME && !cancelado; v += 0.02) {
        el.volume = Math.min(VOLUME, v);
        await new Promise((r) => setTimeout(r, 34));
      }
    };
    void trocar();
    return () => {
      cancelado = true;
    };
  }, [ato, ligada, atos]);

  const alternar = async () => {
    const el = audio.current;
    if (!el) return;
    if (ligada) {
      el.pause();
      setLigada(false);
      return;
    }
    const faixa = atos.find((a) => a.ato === ato) ?? atos[0];
    atoTocando.current = faixa.ato;
    el.src = faixa.trilha;
    el.volume = 0;
    try {
      await el.play();
      setLigada(true);
      for (let v = 0; v < VOLUME; v += 0.02) {
        el.volume = Math.min(VOLUME, v);
        await new Promise((r) => setTimeout(r, 34));
      }
    } catch {
      setLigada(false);
    }
  };

  const nome = atos.find((a) => a.ato === ato)?.titulo ?? "";

  return (
    <>
      <audio ref={audio} loop preload="none" playsInline />
      <button
        type="button"
        onClick={alternar}
        aria-pressed={ligada}
        aria-label={ligada ? "Desligar a trilha" : "Ligar a trilha da galeria"}
        /*
         * À ESQUERDA de propósito: o canto inferior direito já é do botão
         * flutuante do site, e os dois se sobrepunham.
         */
        className={[
          "fixed left-3 z-40 flex items-center gap-2 rounded-full border px-3.5 py-2",
          "bottom-[74px] backdrop-blur-xl transition sm:left-6",
          ligada
            ? "border-amber-300/50 bg-amber-300/15 text-amber-200"
            : "border-white/15 bg-black/50 text-white/65 hover:text-white",
        ].join(" ")}
      >
        {ligada ? (
          <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-sm bg-current"
                style={{
                  height: "100%",
                  animation: `casosBarra 900ms ${i * 140}ms ease-in-out infinite alternate`,
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </span>
        ) : (
          <Music className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="hidden text-[11px] font-medium tracking-wide sm:inline">
          {ligada ? nome : "Trilha"}
        </span>
        {ligada ? <VolumeX className="h-3.5 w-3.5 opacity-60" aria-hidden="true" /> : null}
      </button>

      <style jsx global>{`
        @keyframes casosBarra {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes casosBarra {
            from { transform: scaleY(0.7); }
            to   { transform: scaleY(0.7); }
          }
        }
      `}</style>
    </>
  );
}
