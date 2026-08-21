"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { Camera, Clapperboard, Cpu, ExternalLink, MapPin, Quote, Wrench, ListVideo, ChevronRight } from "lucide-react";

import type { Trabalho } from "@/dados/casos";
import { VideoLeve } from "./VideoLeve";
import { definirAto, definirEstacao } from "./estado";
import css from "./galeria.module.css";

/** A pele de cada ato — a moldura muda com a era. Ver `galeria.module.css`. */
const PELE: Record<number, string> = {
  1: css.tubo,
  2: css.ilha,
  3: css.cinema,
  4: css.ar,
  5: css.rede,
  6: css.hoje,
};

/**
 * Os três marcadores que o dossiê usa, sem trazer um interpretador de markdown
 * inteiro: `**negrito**`, `*itálico*` e crase para nome de arquivo/comando.
 *
 * ⚠️ A primeira versão só entendia negrito, e os outros dois VAZARAM como
 * texto na tela — o leitor via `*"impact, caixa maior"*` e crases soltas no
 * meio do parágrafo da Fox. A ordem das alternativas na expressão importa:
 * `\*\*` tem de vir antes de `\*`, senão o itálico come metade do negrito.
 */
const MARCA = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

function TextoRico({ children, className }: { children: string; className?: string }) {
  return (
    <p className={className}>
      {children.split(MARCA).map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4)
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
          return (
            <em key={i} className="italic text-foreground/80">
              {p.slice(1, -1)}
            </em>
          );
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2)
          return (
            <code
              key={i}
              className="rounded bg-white/[0.07] px-1 py-px font-mono text-[0.92em] text-foreground/85"
            >
              {p.slice(1, -1)}
            </code>
          );
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

function Etiqueta({ children, cor }: { children: ReactNode; cor: string }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide"
      style={{ borderColor: `${cor}44`, background: `${cor}12`, color: `${cor}` }}
    >
      {children}
    </span>
  );
}

/** As barras de cor de uma ilha SD — só aparecem no Ato II. */
function BarrasDeCor() {
  const cores = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
  return (
    <div className={css.barras} aria-hidden="true">
      {cores.map((c) => (
        <span key={c} style={{ background: c, opacity: 0.5 }} />
      ))}
    </div>
  );
}

/** O painel do rádio-controle — só no Ato IV. */
function PainelDeVoo({ cor }: { cor: string }) {
  return (
    <>
      <div className={css.horizonte} aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-3 top-3 flex gap-3 font-mono text-[10px] tracking-widest"
        style={{ color: cor }}
        aria-hidden="true"
      >
        <span>ALT 42m</span>
        <span>GPS 9</span>
        <span>BAT 68%</span>
      </div>
    </>
  );
}

/** A tarja de crédito da emissora — só no Ato V. */
function TarjaDeCredito({ texto, cor }: { texto: string; cor: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 p-3" aria-hidden="true">
      <span className={`${css.tally} h-2 w-2 shrink-0 rounded-full bg-red-500`} />
      <span
        className="truncate rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
        style={{ background: `linear-gradient(90deg, ${cor}dd, ${cor}22)` }}
      >
        {texto}
      </span>
    </div>
  );
}

export function Estacao({ t, indice }: { t: Trabalho; indice: number }) {
  const ref = useRef<HTMLElement>(null);
  const naTela = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const [arteQuebrada, setArteQuebrada] = useState(false);
  const inverso = indice % 2 === 1;

  useEffect(() => {
    if (!naTela) return;
    definirAto(t.ato);
    definirEstacao(t.slug);
  }, [naTela, t.ato, t.slug]);

  /*
   * ⚠️ Vídeo PRIVADO não embeda: o YouTube devolve miniatura cinza de
   * "indisponível" e o player recusa. `Não listado` embeda normalmente.
   * A contagem, porém, continua sendo a do acervo inteiro — o trabalho
   * existiu mesmo que a peça esteja fechada.
   */
  const tocaveis = t.videos.filter((v) => v.vis !== "Privado");
  const fechados = t.videos.length - tocaveis.length;
  const capa = tocaveis[0];
  const resto = tocaveis.slice(1, 7);

  return (
    <section
      ref={ref}
      id={t.slug}
      data-ato={t.ato}
      className={`${css.estacao} scroll-mt-28 py-16 sm:py-24`}
      aria-labelledby={`${t.slug}-titulo`}
    >
      <div
        className={[
          "mx-auto grid max-w-7xl gap-10 px-4 lg:gap-16",
          t.destaque ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : "lg:grid-cols-2",
        ].join(" ")}
      >
        {/* ── o texto ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className={inverso ? "lg:order-2" : ""}
        >
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <span
              className="font-mono font-semibold tracking-[0.22em]"
              style={{ color: t.cor }}
            >
              {t.rotulo}
            </span>
            <span className="h-px w-8" style={{ background: `${t.cor}66` }} />
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {t.cidade}
            </span>
            {t.destaque ? <Etiqueta cor={t.corSec}>destaque</Etiqueta> : null}
          </div>

          <h3
            id={`${t.slug}-titulo`}
            className="text-balance text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-5xl"
          >
            {t.titulo}
          </h3>

          <p className="mt-3 text-sm uppercase tracking-[0.16em] text-muted-foreground">
            {t.papel}
          </p>

          <p
            className="mt-6 text-balance text-lg font-medium leading-snug sm:text-xl"
            style={{ color: t.corSec }}
          >
            {t.linha}
          </p>

          <TextoRico className="mt-5 leading-relaxed text-muted-foreground">{t.resumo}</TextoRico>

          {/* o contexto de época — o coração do dossiê */}
          <div
            className="mt-6 rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: `${t.cor}30`, background: `${t.cor}0a` }}
          >
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: t.cor }}>
              <Cpu className="h-3.5 w-3.5" />
              O que existia na época
            </p>
            <TextoRico className="text-sm leading-relaxed text-muted-foreground">
              {t.contexto}
            </TextoRico>
          </div>

          {t.feitos.length > 0 ? (
            <ul className="mt-6 space-y-2.5">
              {t.feitos.map((f) => (
                <li key={f} className="flex gap-3 text-sm leading-relaxed">
                  <ChevronRight
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: t.corSec }}
                    aria-hidden="true"
                  />
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {(t.ferramentas.length > 0 || t.hardware.length > 0) && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {t.ferramentas.map((f) => (
                  <Etiqueta key={f} cor={t.cor}>
                    {f}
                  </Etiqueta>
                ))}
              </div>
              {t.hardware.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Clapperboard className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  {t.hardware.map((h) => (
                    <Etiqueta key={h} cor={t.corSec}>
                      {h}
                    </Etiqueta>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* de onde a informação saiu — a página não afirma sem dizer a fonte */}
          <details className="group mt-6 text-xs text-muted-foreground/80">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-medium hover:text-foreground">
              <Quote className="h-3 w-3" aria-hidden="true" />
              De onde saiu
            </summary>
            <p className="mt-2 border-l pl-3 leading-relaxed" style={{ borderColor: `${t.cor}55` }}>
              {t.prova}
            </p>
          </details>
        </motion.div>

        {/* ── a imagem e o acervo ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className={inverso ? "lg:order-1" : ""}
        >
          <figure className={`${css.moldura} ${PELE[t.ato] ?? ""} aspect-video w-full`}>
            {t.ato === 2 ? <BarrasDeCor /> : null}
            {arteQuebrada ? (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  background: `radial-gradient(120% 100% at 30% 10%, ${t.cor}33, #05040a 70%)`,
                }}
              >
                <span className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: `${t.corSec}88` }}>
                  {t.slug}
                </span>
              </div>
            ) : (
               
              <img
                src={t.arte}
                alt={`${t.titulo} — ${t.linha}`}
                loading="lazy"
                decoding="async"
                onError={() => setArteQuebrada(true)}
                className="h-full w-full object-cover"
              />
            )}
            {/* o HUD é do DRONE, não do ato: em "Estudos de montagem" ele
                aparecia sobre uma moviola, o que não faz sentido nenhum */}
            {t.objeto === "drone" ? <PainelDeVoo cor={t.corSec} /> : null}
            {t.ato === 5 ? <TarjaDeCredito texto={t.org} cor={t.cor} /> : null}
            {t.ato === 2 ? (
              /* timecode de ilha SD: HH:MM:SS:FF, com ano e mês no lugar das horas */
              <span className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] tracking-widest text-white/60">
                {t.inicio.slice(2).replace("-", ":")}:00:00
              </span>
            ) : null}
          </figure>

          {/*
           * As fotos REAIS entram marcadas como tal. A arte da estação acima é
           * gerada — e uma página de portfólio que mistura as duas sem dizer
           * qual é qual perde o direito de ser levada a sério.
           */}
          {t.fotos.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {t.fotos.map((f) => (
                <figure key={f.src} className="overflow-hidden rounded-xl ring-1 ring-white/10">
                      <img
                    src={f.src}
                    alt={f.legenda}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                  <figcaption className="flex items-start gap-1.5 bg-white/[0.03] px-2.5 py-2 text-[10px] leading-snug text-muted-foreground">
                    <Camera className="mt-px h-3 w-3 shrink-0" style={{ color: t.corSec }} aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-foreground/80">Foto real.</strong> {f.legenda}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {capa ? (
            <div className="mt-5">
              <p className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <ListVideo className="h-3.5 w-3.5" aria-hidden="true" />
                Do acervo — {t.videos.length} {t.videos.length === 1 ? "peça" : "peças"}
                {fechados > 0 ? (
                  <span className="normal-case tracking-normal opacity-60">
                    ({fechados} {fechados === 1 ? "fechada" : "fechadas"})
                  </span>
                ) : null}
                {t.playlist ? <span className="normal-case tracking-normal opacity-70">· {t.playlist}</span> : null}
              </p>
              <VideoLeve id={capa.id} titulo={capa.titulo} dur={capa.dur} cor={t.corSec} />
              {resto.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-3">
                  {resto.map((v) => (
                    <VideoLeve
                      key={v.id}
                      id={v.id}
                      titulo={v.titulo}
                      dur={v.dur}
                      cor={t.cor}
                      variante="tira"
                    />
                  ))}
                </div>
              ) : null}

              {/* a playlist só aparece quando ela existe mesmo no canal */}
              {t.playlistId ? (
                <a
                  href={`https://www.youtube.com/playlist?list=${t.playlistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition hover:bg-white/5"
                  style={{ borderColor: `${t.cor}55`, color: t.corSec }}
                >
                  <ListVideo className="h-3.5 w-3.5" aria-hidden="true" />
                  Ver as {tocaveis.length} no YouTube
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border/60 p-4 text-xs leading-relaxed text-muted-foreground">
              {t.videos.length > 0
                ? `As ${t.videos.length} peças deste trabalho estão fechadas no acervo — existem, mas não são públicas. O que prova a passagem está no currículo, acima.`
                : "Sem vídeo no acervo — este trabalho é anterior ao YouTube, ou saiu em fita e nunca foi digitalizado. O que prova a passagem está no currículo, acima."}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
