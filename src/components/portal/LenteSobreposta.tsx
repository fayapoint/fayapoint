"use client";

/**
 * A LENTE — agora sobre o capítulo de verdade.
 *
 * ## O que mudou, e por que importa
 *
 * A primeira lente desenhava a própria coluna a partir da linha do tempo: só
 * texto, sem as imagens do capítulo, sem a formatação, sem a arte. Funcionava,
 * mas era um PAINEL que substituía a leitura — não uma lente.
 *
 * Esta enxerga o que já está na página. `marcarFalas` envolve cada frase
 * narrada num span dentro do Markdown renderizado, e daqui para a frente tudo é
 * CSS sobre esses spans mais uma rolagem que segue o áudio.
 *
 * Consequência prática: ligar a lente no meio do capítulo não muda nada de
 * lugar. As imagens continuam onde estavam, o que você estava lendo continua
 * onde estava, e a frase que toca acende ali mesmo.
 *
 * ## As três decisões que sustentam o resto
 *
 * 1. **O realce é do SPAN, não de um clone.** Nada é redesenhado; a página é a
 *    mesma, com classes a mais.
 * 2. **A rolagem persegue, não salta.** O destino é interpolado pelo progresso
 *    dentro da frase e alcançado por amortecimento — o texto desliza devagar em
 *    vez de pular de dez em dez segundos.
 * 3. **Verde é o que já passou, azul é o que vem.** Sublinhado, não fundo: num
 *    capítulo inteiro colorido, fundo vira mancha e cansa; a linha embaixo lê
 *    como progresso.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Gauge,
  ListTree,
  Lock,
  LockOpen,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { marcarFalas, type ResultadoDaMarcacao } from "@/lib/lente-spans";
import type { LinhaDoTempo } from "@/components/portal/LenteDeLeitura";

/** Onde a frase atual pousa: acima do meio, para o que vem a seguir caber. */
const ANCORA = 0.38;
const VELOCIDADES = [0.75, 1, 1.25, 1.5, 1.75] as const;
const PULO = 15;
const ZOOM_MIN = 1;
const ZOOM_MAX = 1.6;
const CHAVE_PREFS = "fayapoint_lente_v2";

function tempoHumano(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function acharFala(falas: LinhaDoTempo["falas"], t: number): number {
  let lo = 0, hi = falas.length - 1, achado = -1;
  while (lo <= hi) {
    const meio = (lo + hi) >> 1;
    if (t < falas[meio].de) hi = meio - 1;
    else { achado = meio; lo = meio + 1; }
  }
  return achado;
}

export default function LenteSobreposta({
  conteudoRef,
  rolagemRef,
  src,
  linhaDoTempo,
  chave,
  aoFechar,
  T = (s: string) => s,
}: {
  /** O container do Markdown renderizado — é nele que as falas são marcadas. */
  conteudoRef: React.RefObject<HTMLElement | null>;
  /** Quem rola de verdade (o `<main>` do leitor). */
  rolagemRef: React.RefObject<HTMLElement | null>;
  src?: string | null;
  linhaDoTempo: LinhaDoTempo;
  chave?: string;
  aoFechar?: () => void;
  T?: (s: string) => string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const marcacaoRef = useRef<ResultadoDaMarcacao | null>(null);
  const ignorarAte = useRef(0);

  const [tocando, setTocando] = useState(false);
  const [agora, setAgora] = useState(0);
  const [atual, setAtual] = useState(-1);
  const [maximo, setMaximo] = useState(-1);
  const [seguindo, setSeguindo] = useState(true);
  const [velocidade, setVelocidade] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [volume, setVolume] = useState(1);
  const [painelAberto, setPainelAberto] = useState(false);
  const [indiceAberto, setIndiceAberto] = useState(false);
  const [casadas, setCasadas] = useState<number | null>(null);

  const falas = linhaDoTempo.falas;
  const total = linhaDoTempo.segundos || 0;
  const comAudio = !!src;

  const semAnimacao = useMemo(
    () => typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // ── Marcar as falas no DOM, e limpar ao sair ─────────────────────────────
  //
  // Depende do capítulo (`chave`): trocar de capítulo desfaz a marcação antiga
  // antes de marcar a nova. Sem isso, os spans do capítulo anterior ficariam
  // órfãos e o realce apontaria para lugar nenhum.
  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz) return;
    const r = marcarFalas(raiz, falas.map((f) => ({ i: f.i, texto: f.texto })));
    marcacaoRef.current = r;
    setCasadas(r.casadas);
    return () => { r.desfazer(); marcacaoRef.current = null; };
  }, [conteudoRef, falas, chave]);

  // ── O relógio ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!comAudio) return;
    let vivo = true, quadro = 0;
    const passo = () => {
      const a = audioRef.current;
      if (a && vivo) {
        setAgora(a.currentTime);
        const i = acharFala(falas, a.currentTime);
        setAtual((ant) => (ant === i ? ant : i));
        setMaximo((m) => (i > m ? i : m));
      }
      if (vivo) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => { vivo = false; cancelAnimationFrame(quadro); };
  }, [falas, comAudio]);

  // ── O realce, aplicado como classe nos spans ─────────────────────────────
  useEffect(() => {
    const m = marcacaoRef.current;
    if (!m) return;
    for (const [i, span] of m.spans) {
      const posicao = falas.findIndex((f) => f.i === i);
      span.classList.toggle("lente-atual", posicao === atual);
      span.classList.toggle("lente-lida", posicao < atual || (posicao <= maximo && posicao !== atual));
      span.classList.toggle("lente-porvir", posicao > Math.max(atual, maximo));
    }
  }, [atual, maximo, falas]);

  // ── A rolagem que persegue ───────────────────────────────────────────────
  useEffect(() => {
    if (!comAudio || !seguindo || semAnimacao) return;
    let vivo = true, quadro = 0;
    const passo = () => {
      const rol = rolagemRef.current;
      const a = audioRef.current;
      const m = marcacaoRef.current;
      if (!rol || !a || !m || atual < 0) { if (vivo) quadro = requestAnimationFrame(passo); return; }

      const alvo = m.spans.get(falas[atual]?.i);
      if (!alvo) { if (vivo) quadro = requestAnimationFrame(passo); return; }

      const ondePousa = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const rr = rol.getBoundingClientRect();
        return rol.scrollTop + (r.top - rr.top) + r.height / 2 - rol.clientHeight * ANCORA;
      };

      const f = falas[atual];
      const dur = Math.max(0.001, (f.ate ?? 0) - (f.de ?? 0));
      const dentro = Math.min(1, Math.max(0, (a.currentTime - (f.de ?? 0)) / dur));
      const seguinte = m.spans.get(falas[atual + 1]?.i);

      const destino = seguinte
        ? ondePousa(alvo) + (ondePousa(seguinte) - ondePousa(alvo)) * dentro
        : ondePousa(alvo);

      const falta = Math.max(0, destino) - rol.scrollTop;
      if (Math.abs(falta) > 0.5) {
        ignorarAte.current = Date.now() + 400;
        rol.scrollTop += falta * 0.08;
      }
      if (vivo) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => { vivo = false; cancelAnimationFrame(quadro); };
  }, [comAudio, seguindo, semAnimacao, atual, falas, rolagemRef]);

  // Rolar com o dedo solta o seguimento — a lente não briga pelo scroll.
  useEffect(() => {
    const rol = rolagemRef.current;
    if (!rol || !comAudio) return;
    const aoRolar = () => {
      if (!seguindo || Date.now() < ignorarAte.current) return;
      setSeguindo(false);
    };
    rol.addEventListener("scroll", aoRolar, { passive: true });
    return () => rol.removeEventListener("scroll", aoRolar);
  }, [rolagemRef, seguindo, comAudio]);

  // ── SEM ÁUDIO, QUEM DÁ O FOCO É A ROLAGEM ───────────────────────────────
  //
  // No modo leitura não existe relógio, então `atual` ficaria em -1 para
  // sempre e nada acenderia — a lente viraria só um sublinhado azul parado. A
  // frase mais próxima da linha de âncora entra em foco: é o gesto que o
  // leitor já faz, com o dedo no lugar do relógio.
  useEffect(() => {
    const rol = rolagemRef.current;
    if (!rol || comAudio) return;

    const focar = () => {
      const m = marcacaoRef.current;
      if (!m) return;
      const alvoY = rol.getBoundingClientRect().top + rol.clientHeight * ANCORA;
      let melhor = -1, menor = Infinity;
      for (let i = 0; i < falas.length; i++) {
        const el = m.spans.get(falas[i].i);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - alvoY);
        if (d < menor) { menor = d; melhor = i; }
      }
      if (melhor >= 0) {
        setAtual((ant) => (ant === melhor ? ant : melhor));
        setMaximo((mx) => (melhor > mx ? melhor : mx));
      }
    };

    focar();
    rol.addEventListener("scroll", focar, { passive: true });
    return () => rol.removeEventListener("scroll", focar);
  }, [rolagemRef, comAudio, falas, casadas]);

  // ── Zoom da coluna: é o "aumenta a área que estou" ───────────────────────
  useEffect(() => {
    const raiz = conteudoRef.current;
    if (!raiz) return;
    raiz.style.setProperty("--lente-zoom", String(zoom));
    raiz.classList.add("lente-ativa");
    return () => { raiz.classList.remove("lente-ativa"); raiz.style.removeProperty("--lente-zoom"); };
  }, [conteudoRef, zoom]);

  useEffect(() => {
    try {
      const b = localStorage.getItem(CHAVE_PREFS);
      if (!b) return;
      const p = JSON.parse(b) as { zoom?: number; velocidade?: number; volume?: number };
      if (typeof p.zoom === "number") setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.zoom)));
      if (typeof p.velocidade === "number") setVelocidade(p.velocidade);
      if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
    } catch { /* preferência é conforto, não estado crítico */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CHAVE_PREFS, JSON.stringify({ zoom, velocidade, volume })); }
    catch { /* modo privado */ }
  }, [zoom, velocidade, volume]);

  useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = velocidade; }, [velocidade]);
  useEffect(() => { const a = audioRef.current; if (a) a.volume = volume; }, [volume]);

  // Onde parou, por capítulo — trocar de aula e voltar não recomeça do zero.
  const chaveMarca = chave ? `fayapoint_lente_pos_${chave}` : null;
  useEffect(() => {
    if (!chaveMarca) return;
    const a = audioRef.current;
    if (!a) return;
    const retomar = () => {
      try {
        const s = Number(localStorage.getItem(chaveMarca));
        if (s > 1 && a.duration && s < a.duration - 5) a.currentTime = s;
      } catch { /* sem memória, começa do zero */ }
    };
    if (a.readyState >= 1) retomar();
    else a.addEventListener("loadedmetadata", retomar, { once: true });
  }, [chaveMarca]);

  useEffect(() => {
    if (!chaveMarca) return;
    const guardar = () => {
      try {
        const a = audioRef.current;
        if (a && a.currentTime > 1) localStorage.setItem(chaveMarca, String(a.currentTime));
      } catch { /* idem */ }
    };
    const id = setInterval(guardar, 5000);
    window.addEventListener("pagehide", guardar);
    return () => { clearInterval(id); window.removeEventListener("pagehide", guardar); guardar(); };
  }, [chaveMarca]);

  const irPara = useCallback((s: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(s, a.duration || s));
    setSeguindo(true);
  }, []);

  const alternar = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play(); else a.pause();
  }, []);

  useEffect(() => {
    const noTeclado = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); alternar(); }
      else if (e.code === "ArrowLeft") irPara(agora - PULO);
      else if (e.code === "ArrowRight") irPara(agora + PULO);
    };
    window.addEventListener("keydown", noTeclado);
    return () => window.removeEventListener("keydown", noTeclado);
  }, [alternar, irPara, agora]);

  const secaoAtual = atual >= 0 ? falas[atual]?.secao : null;
  const progresso = total > 0 ? (agora / total) * 100 : 0;

  return (
    <>
      {/* ── A barra flutuante: um lugar só, sem moldura em volta do texto ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-3xl px-3 pb-3 pointer-events-auto">
          <div className="rounded-2xl bg-[var(--reader-float)]/95 backdrop-blur-xl ring-1 ring-[rgba(var(--reader-tint),0.1)] shadow-2xl shadow-black/50 overflow-hidden">

            {/* painel de tela e som */}
            <div className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              painelAberto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}>
              <div className="overflow-hidden">
                <div className="grid gap-4 sm:grid-cols-3 px-5 pt-4 pb-2 border-b border-[rgba(var(--reader-tint),0.06)]">
                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                      <span className="flex items-center gap-1.5"><ZoomIn size={12} />{T("Aumento")}</span>
                      <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
                    </span>
                    <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.05} value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-violet-400 cursor-pointer" aria-label={T("Aumento do texto")} />
                  </label>

                  {comAudio && (
                    <label className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                        <span className="flex items-center gap-1.5"><Gauge size={12} />{T("Velocidade")}</span>
                        <span className="tabular-nums">{velocidade}×</span>
                      </span>
                      <div className="flex gap-1">
                        {VELOCIDADES.map((v) => (
                          <button key={v} type="button" onClick={() => setVelocidade(v)}
                            className={cn("flex-1 py-1 rounded-lg text-[11px] tabular-nums transition-colors",
                              v === velocidade ? "bg-violet-500/25 text-violet-100"
                                : "bg-[rgba(var(--reader-tint),0.05)] text-[rgba(var(--reader-tint),0.5)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                            {v}×
                          </button>
                        ))}
                      </div>
                    </label>
                  )}

                  {comAudio && (
                    <label className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                        <span className="flex items-center gap-1.5">
                          {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}{T("Volume")}
                        </span>
                        <span className="tabular-nums">{Math.round(volume * 100)}%</span>
                      </span>
                      <input type="range" min={0} max={1} step={0.05} value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full accent-violet-400 cursor-pointer" aria-label={T("Volume")} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* progresso */}
            {comAudio && (
              <div className="relative h-1 bg-[rgba(var(--reader-tint),0.07)] cursor-pointer"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  irPara(((e.clientX - r.left) / r.width) * total);
                }}>
                <div className="absolute inset-y-0 left-0 bg-violet-400/80" style={{ width: `${progresso}%` }} />
                {linhaDoTempo.marcas.map((m) => (
                  <span key={`t-${m.segundos}`} className="absolute top-0 bottom-0 w-px bg-[rgba(var(--reader-tint),0.22)]"
                    style={{ left: `${total ? (m.segundos / total) * 100 : 0}%` }} />
                ))}
              </div>
            )}

            {/* controles */}
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5">
              {comAudio && (
                <>
                  <button type="button" onClick={() => irPara(agora - PULO)} title={T("Voltar 15 segundos")}
                    className="p-2 rounded-full text-[rgba(var(--reader-tint),0.55)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                    <RotateCcw size={16} />
                  </button>
                  <button type="button" onClick={alternar} aria-label={tocando ? T("Pausar") : T("Tocar")}
                    className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-900/30 transition-colors">
                    {tocando ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button type="button" onClick={() => irPara(agora + PULO)} title={T("Avançar 15 segundos")}
                    className="p-2 rounded-full text-[rgba(var(--reader-tint),0.55)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                    <RotateCw size={16} />
                  </button>
                  <span className="ml-1 text-[11px] tabular-nums text-[rgba(var(--reader-tint),0.4)] hidden sm:inline">
                    {tempoHumano(agora)}<span className="opacity-50"> / {tempoHumano(total)}</span>
                  </span>
                </>
              )}

              {!comAudio && (
                <span className="px-2 text-xs text-[rgba(var(--reader-tint),0.5)]">{T("Lente de leitura")}</span>
              )}

              <div className="flex-1" />

              {secaoAtual && (
                <span className="hidden md:inline text-[11px] text-[rgba(var(--reader-tint),0.45)] truncate max-w-[14rem]">
                  {secaoAtual}
                </span>
              )}

              {linhaDoTempo.marcas.length > 0 && comAudio && (
                <div className="relative">
                  <button type="button" onClick={() => setIndiceAberto((v) => !v)} aria-expanded={indiceAberto}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-[rgba(var(--reader-tint),0.6)] hover:text-[rgba(var(--reader-tint),0.9)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)] transition-colors">
                    <ListTree size={13} />
                    <ChevronDown size={11} className={cn("transition-transform", indiceAberto && "rotate-180")} />
                  </button>
                  {indiceAberto && (
                    <div className="absolute right-0 bottom-full mb-2 z-20 w-60 max-h-72 overflow-y-auto rounded-2xl bg-[var(--reader-popover)] ring-1 ring-[rgba(var(--reader-tint),0.1)] shadow-2xl shadow-black/50 py-1.5">
                      {linhaDoTempo.marcas.map((m) => (
                        <button key={`${m.segundos}-${m.titulo}`} type="button"
                          onClick={() => { irPara(m.segundos); setIndiceAberto(false); }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-[13px] text-[rgba(var(--reader-tint),0.7)] hover:text-[rgba(var(--reader-tint),1)] hover:bg-[rgba(var(--reader-tint),0.06)] transition-colors">
                          <span className="truncate">{m.titulo}</span>
                          <span className="tabular-nums text-[11px] text-[rgba(var(--reader-tint),0.35)]">{tempoHumano(m.segundos)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type="button" onClick={() => setPainelAberto((v) => !v)} aria-expanded={painelAberto}
                title={T("Tela e som")}
                className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                  painelAberto ? "text-violet-200 bg-violet-500/15"
                    : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                <SlidersHorizontal size={13} />
              </button>

              {comAudio && (
                <button type="button" onClick={() => setSeguindo((v) => !v)} aria-pressed={seguindo}
                  title={seguindo ? T("A página segue o áudio") : T("Vista solta")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                    seguindo ? "text-violet-200 bg-violet-500/15"
                      : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]")}>
                  {seguindo ? <Lock size={13} /> : <LockOpen size={13} />}
                </button>
              )}

              {aoFechar && (
                <button type="button" onClick={aoFechar} title={T("Fechar a lente")}
                  className="p-2 rounded-full text-[rgba(var(--reader-tint),0.45)] hover:text-[rgba(var(--reader-tint),0.9)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {casadas !== null && casadas < falas.length * 0.7 && (
            <p className="mt-1.5 text-center text-[10px] text-amber-300/60">
              {T("Sincronia parcial neste capítulo")} ({casadas}/{falas.length})
            </p>
          )}
        </div>
      </div>

      {comAudio && (
        <audio ref={audioRef} src={src ?? undefined} preload="metadata"
          onPlay={() => setTocando(true)} onPause={() => setTocando(false)}
          onEnded={() => setTocando(false)} className="hidden" />
      )}
    </>
  );
}
