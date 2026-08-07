"use client";
import { useT } from "@/i18n/dicionario";

import { cenaDoCurso } from "@/data/curso-midia";

/**
 * Uma cena do curso — a imagem que mostra o que aquele trecho da página diz.
 *
 * Some sozinha quando o curso ainda não tem a cena `indice`. Isso é
 * deliberado: as 22 páginas de venda ganham arte em ondas, e uma moldura vazia
 * esperando arquivo é pior do que a página de ontem.
 *
 * A legenda não é decorativa — ela é o `alt` também. Uma imagem de curso sem
 * legenda vira enfeite, e enfeite numa página de venda é peso morto: ocupa a
 * dobra, atrasa o carregamento e não responde a nenhuma dúvida de quem está
 * decidindo pagar.
 */
export function CenaDoCurso({
  slug,
  indice,
  className = "",
}: {
  slug: string;
  indice: number;
  className?: string;
}) {
  const T = useT();
  const cena = cenaDoCurso(slug, indice);
  if (!cena) return null;

  return (
    /* ⚠️ SEM animação de entrada por JavaScript aqui — é decisão, não esquecimento.
       A primeira versão usava `motion.figure` com `initial={{ opacity: 0 }}` e
       `whileInView`. Medido na página do `rag-knowledge`: as três cenas ficaram
       presas em `opacity: 0` para sempre, e não eram as únicas — 14 elementos
       daquela página estavam no mesmo estado.
       Numa página de venda, uma animação de entrada que falha não degrada para
       "sem animação": degrada para **conteúdo invisível**. Os arquivos
       respondiam 200 o tempo todo e ninguém veria nenhum deles.
       O `width`/`height` na imagem reserva a proporção antes de o byte chegar —
       é o que tira o pulo de layout e faz o carregamento preguiçoso disparar. */
    <figure className={`relative mx-auto max-w-4xl ${className}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-black shadow-[0_30px_80px_-40px_rgba(245,192,78,.4)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática, servida pela CDN sem otimizador */}
        <img
          src={cena.src}
          alt={T(cena.legenda)}
          width={1376}
          height={768}
          loading="lazy"
          decoding="async"
          className="w-full transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
        />
        {/* O esfumado só na base, e fraco: a cena existe para ser vista, não
            para virar fundo de texto. Ele está aqui apenas para a borda
            inferior não bater seca contra a legenda. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.22) 45%, transparent 100%)",
          }}
        />
      </div>
      <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        {T(cena.legenda)}
      </figcaption>
    </figure>
  );
}
