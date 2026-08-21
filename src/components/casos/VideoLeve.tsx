"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Um vídeo do YouTube que só vira `<iframe>` depois do clique.
 *
 * ── Por que não usar o embed direto ────────────────────────────────────────
 *
 * Esta página lista 235 vídeos. Cada `<iframe>` do YouTube traz ~1,2 MB de
 * JavaScript de terceiro e abre conexão com quatro domínios ANTES de qualquer
 * interação. Vinte embeds na página seriam ~24 MB e um LCP arruinado.
 *
 * Aqui o que carrega é a miniatura (uma imagem, ~15 KB) e o `<iframe>` só nasce
 * no clique, já com `autoplay=1`. É a técnica do `lite-youtube-embed`, escrita
 * à mão para não trazer mais uma dependência.
 *
 * ⚠️ `i.ytimg.com` precisa estar liberado em `next.config` se um dia isto virar
 * `next/image`. Enquanto for `<img>` puro não precisa — e é de propósito: a
 * miniatura vem do CDN do YouTube já no tamanho certo, otimizar de novo seria
 * pagar duas vezes.
 */

type Props = {
  id: string;
  titulo: string;
  dur?: string;
  cor?: string;
  /** `capa` = grande, com play no centro; `tira` = miniatura de lista */
  variante?: "capa" | "tira";
};

export function VideoLeve({ id, titulo, dur, cor = "#ffc400", variante = "capa" }: Props) {
  const [tocando, setTocando] = useState(false);
  const miniatura = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  if (tocando) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  const tira = variante === "tira";

  return (
    <button
      type="button"
      onClick={() => setTocando(true)}
      aria-label={`Reproduzir: ${titulo}`}
      className={[
        "group relative block w-full overflow-hidden rounded-xl bg-black text-left",
        "ring-1 ring-white/10 transition hover:ring-white/35",
        "focus-visible:outline-none focus-visible:ring-2",
        tira ? "aspect-video" : "aspect-video",
      ].join(" ")}
      style={{ ["--cor" as string]: cor }}
    >
      <img
        src={miniatura}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full scale-[1.02] object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <span
        className={[
          "pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2",
          "items-center justify-center rounded-full backdrop-blur-sm transition",
          "group-hover:scale-110",
          tira ? "h-9 w-9" : "h-14 w-14",
        ].join(" ")}
        style={{ background: `${cor}22`, boxShadow: `0 0 2rem ${cor}55`, border: `1px solid ${cor}88` }}
      >
        <Play className={tira ? "h-3.5 w-3.5" : "h-6 w-6"} style={{ color: cor }} fill="currentColor" />
      </span>

      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
        <span
          className={[
            "line-clamp-2 font-medium leading-tight text-white/90",
            tira ? "text-[10px]" : "text-xs sm:text-sm",
          ].join(" ")}
        >
          {titulo}
        </span>
        {dur ? (
          <span className="shrink-0 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/80">
            {dur}
          </span>
        ) : null}
      </span>
    </button>
  );
}
