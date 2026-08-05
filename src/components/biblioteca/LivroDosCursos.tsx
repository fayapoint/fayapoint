"use client";

/**
 * O livro que se folheia — os cursos em que o aluno está matriculado.
 *
 * ── De onde veio ───────────────────────────────────────────────────────────
 *
 * Do pen `codepen.io/zerdebek/pen/019f8d6a…` ("Elven Field Journal"), escolhido
 * pelo Ricardo em 03/08/2026: *"para folhearmos nossos cursos, como se fosse um
 * livro que abriga o que estamos lendo"*. Ele decidiu também o que se folheia:
 * **cursos matriculados**, não capítulos.
 *
 * ── A técnica, que é o motivo de este arquivo não ter dependência ──────────
 *
 * A virada é a **View Transitions API**, não uma biblioteca de flipbook. Cada
 * página ganha um `view-transition-name`; o navegador tira uma foto do estado
 * velho e do novo e nós animamos as duas fotos com `rotateY` sob uma
 * `perspective`. O CSS mora em `globals.css` (as `::view-transition-*` são
 * pseudo-elementos do documento — não dá para escrevê-las inline).
 *
 * ── As três redes de segurança, todas obrigatórias ─────────────────────────
 *
 * 1. **Sem suporte** (`startViewTransition` ausente) → troca instantânea. O
 *    livro continua funcionando, só não anima.
 * 2. **`prefers-reduced-motion`** → idem. Girar uma página em 3D é exatamente
 *    o tipo de movimento que essa preferência existe para desligar.
 * 3. **`flushSync`** dentro do callback. ⚠️ Esta é a armadilha do React 19:
 *    `startViewTransition(cb)` exige que o DOM esteja atualizado QUANDO `cb`
 *    retorna, e `setState` é assíncrono. Sem o `flushSync`, o navegador
 *    fotografa o estado velho duas vezes e nada anima — sem erro nenhum no
 *    console, o que torna o defeito difícil de achar depois.
 *
 * ── Celular ────────────────────────────────────────────────────────────────
 *
 * Duas páginas lado a lado num aparelho de 375px dariam 187px cada. Abaixo de
 * `md` só a página da esquerda aparece (os dados do curso); a capa vira uma
 * faixa no topo. É a mesma decisão do pen, que corta em 720px.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BookOpen, ChevronLeft, ChevronRight, Clock, Layers, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CursoDoLivro {
  slug: string;
  titulo: string;
  capa: string;
  href: string;
  ferramenta?: string;
  nivel?: string;
  aulas?: number;
  duracao?: string;
  progresso?: number;
  resumo?: string;
}

const DURACAO_MS = 700;

export function LivroDosCursos({ cursos }: { cursos: CursoDoLivro[] }) {
  const [indice, setIndice] = useState(0);
  const virando = useRef(false);
  const [anunciar, setAnunciar] = useState("");

  const curso = cursos[indice];
  const total = cursos.length;

  // Pré-carrega a capa vizinha. O pen faz isso e é o que evita a página de
  // destino aparecer vazia no meio da virada — a animação é rápida demais para
  // esperar a rede.
  useEffect(() => {
    for (const i of [indice - 1, indice + 1]) {
      const vizinho = cursos[i];
      if (!vizinho?.capa) continue;
      const img = new Image();
      img.src = vizinho.capa;
    }
  }, [indice, cursos]);

  const virar = useCallback(
    (direcao: 1 | -1) => {
      if (virando.current) return;
      const proximo = indice + direcao;
      if (proximo < 0 || proximo >= total) return;

      const trocar = () => {
        setIndice(proximo);
        setAnunciar(`Curso ${proximo + 1} de ${total}: ${cursos[proximo].titulo}`);
      };

      const podeAnimar =
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!podeAnimar) {
        trocar();
        return;
      }

      virando.current = true;
      document.documentElement.dataset.viradaLivro = direcao === 1 ? "frente" : "tras";

       
      const transicao = (document as any).startViewTransition(() => {
        // ⚠️ `flushSync` — ver o cabeçalho. Sem ele, nada anima.
        flushSync(trocar);
      });

      transicao.finished.finally(() => {
        delete document.documentElement.dataset.viradaLivro;
        virando.current = false;
      });
    },
    [indice, total, cursos],
  );

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      virar(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      virar(-1);
    }
  };

  // Arrastar o dedo vira a página. É o gesto que a pessoa tenta primeiro num
  // objeto que parece um livro.
  const toqueX = useRef<number | null>(null);
  const aoTocar = {
    onTouchStart: (e: React.TouchEvent) => {
      toqueX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (toqueX.current === null) return;
      const dx = e.changedTouches[0].clientX - toqueX.current;
      toqueX.current = null;
      if (Math.abs(dx) < 48) return;
      virar(dx < 0 ? 1 : -1);
    },
  };

  const etiqueta = useMemo(
    () => [curso?.ferramenta, curso?.nivel].filter(Boolean).join(" · "),
    [curso],
  );

  if (!curso) return null;

  const noComeco = indice === 0;
  const noFim = indice === total - 1;

  return (
    <section
      className="relative"
      aria-roledescription="livro"
      aria-label="Seus cursos, folheáveis"
      tabIndex={0}
      onKeyDown={aoTeclar}
      {...aoTocar}
      style={{ perspective: "1800px" }}
    >
      <p aria-live="polite" className="sr-only">
        {anunciar}
      </p>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d16] shadow-[0_1.5rem_2rem_rgba(0,0,0,.35)] md:grid-cols-[1.05fr_1fr]">
        {/* ── Página da esquerda: o curso ── */}
        <article
          data-pagina="esquerda"
          className="relative flex min-w-0 flex-col justify-between gap-5 p-5 sm:p-7"
        >
          {/* A textura do papel, discreta — é o que impede o painel de parecer
              só um card escuro. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
              backgroundSize: "22px 22px, 31px 31px",
            }}
          />

          <div className="relative min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70">
              {`Curso ${indice + 1} de ${total}`}
              {etiqueta && <span className="text-white/35"> · {etiqueta}</span>}
            </p>

            <h3 className="mt-3 text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
              {curso.titulo}
            </h3>

            <span aria-hidden className="mt-4 block h-px w-16 bg-gradient-to-r from-amber-300/70 to-transparent" />

            {curso.resumo && (
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/55">{curso.resumo}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/45">
              {typeof curso.aulas === "number" && curso.aulas > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Layers size={11} /> {curso.aulas} aulas
                </span>
              )}
              {curso.duracao && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} /> {curso.duracao}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            {typeof curso.progresso === "number" && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-white/55">
                  {/* ⚠️ Concluído é um terceiro estado — ver a mesma correção em
                      TrilhoParallax. "Seu progresso · 100%" ao lado de um botão
                      escrito "Continuar de onde parou" faz quem já tem o
                      certificado achar que o sistema perdeu o histórico dele. */}
                  <span className={curso.progresso >= 100 ? "font-bold text-amber-300" : undefined}>
                    {curso.progresso >= 100
                      ? "Curso concluído"
                      : curso.progresso > 0
                        ? "Seu progresso"
                        : "Ainda não começou"}
                  </span>
                  <span className="tabular-nums">{curso.progresso}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${curso.progresso >= 100 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(100, Math.max(0, curso.progresso))}%` }}
                  />
                </div>
              </div>
            )}

            <Link
              href={curso.href}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              <PlayCircle size={16} />
              {typeof curso.progresso === "number" && curso.progresso >= 100
                ? "Revisar o curso"
                : curso.progresso && curso.progresso > 0
                  ? "Continuar de onde parou"
                  : "Começar o curso"}
            </Link>
          </div>

          {/* Borda de lombada: só existe quando há duas páginas. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-white/15 to-transparent md:block"
          />
        </article>

        {/* ── Página da direita: a capa ── */}
        <article
          data-pagina="direita"
          className="relative order-first flex min-h-[180px] items-center justify-center overflow-hidden bg-[#05060a] p-5 md:order-none md:min-h-[420px] md:p-7"
        >
          { }
          <img
            src={curso.capa}
            alt={`Capa do curso ${curso.titulo}`}
            className="h-full max-h-[150px] w-auto rounded-lg object-contain shadow-[0_1rem_2rem_rgba(0,0,0,.55)] md:max-h-[380px]"
            loading="eager"
          />
        </article>
      </div>

      {/* ── Os controles ── */}
      <div className="mt-4 flex items-center justify-between gap-4 px-1">
        <button
          type="button"
          onClick={() => virar(-1)}
          disabled={noComeco}
          aria-label="Curso anterior"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          <ChevronLeft size={14} />
          Anterior
        </button>

        <div className="flex items-center gap-1.5" aria-hidden>
          {cursos.map((c, i) => (
            <span
              key={c.slug}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === indice ? "w-5 bg-amber-400" : "w-1.5 bg-white/20",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => virar(1)}
          disabled={noFim}
          aria-label="Próximo curso"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Próximo
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}

/** O cabeçalho da seção, para o painel não precisar repetir a marcação. */
export function TituloDoLivro({ quantos }: { quantos: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
        <BookOpen size={15} className="text-white" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold">Seus cursos</h3>
        {/**
         * "na estante", e não "no acervo".
         *
         * O trilho abaixo tem um filtro chamado "No acervo", que conta só as
         * MATRÍCULAS. Este livro conta quem tem matrícula OU progresso — quem
         * abriu o curso já aparece aqui. São dois números legitimamente
         * diferentes, e usar a mesma palavra nos dois punha "6 no acervo" logo
         * acima de "No acervo 5" na mesma tela.
         */}
        <p className="text-xs text-muted-foreground">
          {quantos} na estante · folheie com as setas ou arrastando
        </p>
      </div>
    </div>
  );
}
