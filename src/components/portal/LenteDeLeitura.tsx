"use client";

/**
 * A LENTE — ouvir e ler ao mesmo tempo, sem se perder.
 *
 * ## O problema que ela resolve
 *
 * Audiobook e texto competem. Quem ouve perde a página; quem lê ignora o áudio.
 * A lente junta os dois: a frase que está tocando fica grande e nítida, o resto
 * do capítulo recua — legível, mas fora de foco — e a página anda sozinha.
 *
 * ## Por que a unidade é a FRASE, e não a palavra
 *
 * Palavra a palavra o olho corre atrás do som e cansa em um minuto; parágrafo
 * inteiro não diz onde você está. A frase é a única unidade que dá as duas
 * coisas — contexto suficiente para entender e recorte estreito para achar.
 *
 * E ela sai pronta: o áudio foi gerado FRASE A FRASE, e o montador registrou em
 * que segundo cada uma começa dentro do capítulo. A lente não estima nada, não
 * alinha nada, não chuta nada. Ela lê a mesma régua que produziu o som — por
 * isso nunca chega cedo nem tarde.
 *
 * ## A profundidade de campo é o que faz parecer uma lente
 *
 * Só aumentar a frase atual produz um texto que pula. O que dá a sensação de
 * lente é o CONJUNTO: tamanho, opacidade e um desfoque mínimo que cresce com a
 * distância. O olho lê isso como profundidade, não como mudança de fonte.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ListTree,
  Lock,
  LockOpen,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Gauge,
  ZoomIn,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type FalaNaLinhaDoTempo = {
  i: number;
  de: number;
  ate: number;
  texto: string;
  tipo: string | null;
  secao: string | null;
  palavras?: { p: string; de: number; ate: number }[] | null;
};

export type LinhaDoTempo = {
  versao: number;
  titulo?: string;
  segundos: number;
  marcas: { segundos: number; titulo: string }[];
  falas: FalaNaLinhaDoTempo[];
};

/** Onde a frase atual pousa na tela: acima do meio, para o que vem a seguir caber. */
const ANCORA = 0.38;
const VELOCIDADES = [0.75, 1, 1.25, 1.5, 1.75] as const;

/** Passos do pulo. 15 s é o que se perde numa distração, não meia frase. */
const PULO = 15;

/**
 * O ZOOM É DO LEITOR, MAS COM LIMITES.
 *
 * O aumento serve a olhos diferentes e a telas diferentes — celular no ônibus
 * pede mais que monitor na mesa. Mas o valor tem teto e piso por um motivo
 * medido no próprio material: a frase média do acervo tem 144 caracteres. Muito
 * pequena, ela se perde no bloco; muito grande, ela não cabe na tela inteira e
 * o aluno passa a rolar DENTRO da frase — que é exatamente o que a lente existe
 * para evitar.
 *
 * 1 é o padrão calibrado; a faixa vai de 0,85 a 1,45.
 */
const ZOOM_MIN = 0.85;
const ZOOM_MAX = 1.45;
const ZOOM_PASSO = 0.05;

const CHAVE_PREFS = "fayapoint_lente_v1";

function tempoHumano(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Qual frase toca em `t`.
 *
 * Busca binária porque isto roda a cada quadro: varrer 52 frases 60 vezes por
 * segundo é desperdício que aparece em bateria de celular.
 */
function acharFala(falas: FalaNaLinhaDoTempo[], t: number): number {
  let lo = 0;
  let hi = falas.length - 1;
  let achado = -1;
  while (lo <= hi) {
    const meio = (lo + hi) >> 1;
    if (t < falas[meio].de) hi = meio - 1;
    else {
      achado = meio;
      lo = meio + 1;
    }
  }
  return achado;
}

export default function LenteDeLeitura({
  src,
  linhaDoTempo,
  aoFechar,
  T = (s: string) => s,
}: {
  src: string;
  linhaDoTempo: LinhaDoTempo;
  aoFechar?: () => void;
  T?: (s: string) => string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const colunaRef = useRef<HTMLDivElement | null>(null);
  const falaRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const [tocando, setTocando] = useState(false);
  const [agora, setAgora] = useState(0);
  const [atual, setAtual] = useState(-1);
  const [seguindo, setSeguindo] = useState(true);
  const [velocidade, setVelocidade] = useState<number>(1);
  const [zoom, setZoom] = useState(1);
  const [volume, setVolume] = useState(1);
  const [indiceAberto, setIndiceAberto] = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const [saiuDoLugar, setSaiuDoLugar] = useState(false);

  // Zoom, velocidade e volume são preferências do OLHO e do OUVIDO de quem
  // está lendo — não do capítulo. Perder isso a cada aula obrigaria a reajustar
  // três controles toda vez, e o aluno simplesmente pararia de usar a lente.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE_PREFS);
      if (!bruto) return;
      const p = JSON.parse(bruto) as { zoom?: number; velocidade?: number; volume?: number };
      if (typeof p.zoom === "number") setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.zoom)));
      if (typeof p.velocidade === "number") setVelocidade(p.velocidade);
      if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
    } catch { /* preferência é conforto, não estado crítico */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_PREFS, JSON.stringify({ zoom, velocidade, volume }));
    } catch { /* modo privado, cota cheia — segue sem lembrar */ }
  }, [zoom, velocidade, volume]);

  const falas = linhaDoTempo.falas;
  const total = linhaDoTempo.segundos || 0;

  const semAnimacao = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // ── O relógio ────────────────────────────────────────────────────────────
  //
  // requestAnimationFrame, e NÃO setInterval. Um intervalo de 250 ms erra a
  // troca de frase em até um quarto de segundo — o bastante para a lente
  // parecer atrasada justamente nas frases curtas, que são as mais rápidas.
  useEffect(() => {
    let vivo = true;
    let quadro = 0;
    const passo = () => {
      const a = audioRef.current;
      if (a && vivo) {
        const t = a.currentTime;
        setAgora(t);
        const i = acharFala(falas, t);
        setAtual((anterior) => (anterior === i ? anterior : i));
      }
      if (vivo) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
    };
  }, [falas]);

  // ── O deslizar ───────────────────────────────────────────────────────────
  //
  // `scrollTo({behavior:"smooth"})` do navegador já tem curva de desaceleração
  // e respeita o gesto do usuário. Escrever uma mola à mão aqui daria menos
  // suavidade e mais código — e brigaria com o scroll nativo do dedo.
  useEffect(() => {
    if (!seguindo || atual < 0) return;
    const alvo = falaRefs.current[atual];
    const coluna = colunaRef.current;
    if (!alvo || !coluna) return;

    const destino =
      alvo.offsetTop - coluna.clientHeight * ANCORA + alvo.clientHeight / 2;
    // A rolagem que a própria lente dispara não pode acionar o "soltou" —
    // por isso a janela de silêncio cobre também a animação suave.
    ignorarAte.current = Date.now() + 900;
    coluna.scrollTo({
      top: Math.max(0, destino),
      behavior: semAnimacao ? "auto" : "smooth",
    });
    setSaiuDoLugar(false);
  }, [atual, seguindo, semAnimacao]);

  // ── QUANDO O LAYOUT SE MEXE SOZINHO, NÃO FOI O USUÁRIO ──────────────────
  //
  // Medido em 02/09/2026, mexendo no zoom durante a reprodução: mudar o
  // aumento reflui o texto inteiro, o `scrollTop` deixa de bater com a frase
  // atual, e a heurística abaixo lia isso como "o aluno rolou para longe" e
  // DESLIGAVA o seguimento. Ou seja: usar o controle de zoom quebrava o
  // acompanhamento — o oposto do que o controle existe para fazer.
  //
  // Esta janela cobre o reflow e a rolagem suave que vem depois dele. Sem ela,
  // qualquer scroll programático da própria lente se autossabota.
  const ignorarAte = useRef(0);
  useEffect(() => { ignorarAte.current = Date.now() + 900; }, [zoom]);

  // Quem rola com o dedo enquanto está seguindo, quer olhar outra coisa. A
  // lente solta sozinha em vez de brigar pelo scroll — e avisa como voltar.
  const aoRolar = useCallback(() => {
    if (!seguindo || atual < 0) return;
    if (Date.now() < ignorarAte.current) return;
    const alvo = falaRefs.current[atual];
    const coluna = colunaRef.current;
    if (!alvo || !coluna) return;
    const esperado =
      alvo.offsetTop - coluna.clientHeight * ANCORA + alvo.clientHeight / 2;
    if (Math.abs(coluna.scrollTop - Math.max(0, esperado)) > coluna.clientHeight * 0.45) {
      setSeguindo(false);
      setSaiuDoLugar(true);
    }
  }, [seguindo, atual]);

  const irPara = useCallback((s: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(s, a.duration || s));
    setSeguindo(true);
    setSaiuDoLugar(false);
  }, []);

  const alternar = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  }, []);

  // Atalhos de teclado: quem ouve aula com o teclado na frente espera espaço e
  // setas funcionarem, como em qualquer tocador.
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

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = velocidade;
  }, [velocidade]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  const secaoAtual = atual >= 0 ? falas[atual]?.secao : null;
  const progresso = total > 0 ? (agora / total) * 100 : 0;

  return (
    <div className="relative flex flex-col h-[min(78vh,780px)] rounded-3xl overflow-hidden bg-[var(--reader-surface)] ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-2xl shadow-black/40">
      {/* ── cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(var(--reader-tint),0.06)] bg-[rgba(var(--reader-tint),0.02)] backdrop-blur-md">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
          <Volume2 size={15} className="text-violet-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[rgba(var(--reader-tint),0.35)]">
            {T("Ouvindo e lendo")}
          </p>
          <p className="text-sm font-medium text-[rgba(var(--reader-tint),0.85)] truncate">
            {secaoAtual || linhaDoTempo.titulo || T("Capítulo")}
          </p>
        </div>

        {linhaDoTempo.marcas.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIndiceAberto((v) => !v)}
              aria-expanded={indiceAberto}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[rgba(var(--reader-tint),0.6)] hover:text-[rgba(var(--reader-tint),0.9)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <ListTree size={14} />
              <span className="hidden sm:inline">{T("Seções")}</span>
              <ChevronDown size={12} className={cn("transition-transform", indiceAberto && "rotate-180")} />
            </button>
            {indiceAberto && (
              <div className="absolute right-0 top-full mt-2 z-20 w-60 max-h-72 overflow-y-auto rounded-2xl bg-[var(--reader-popover)] ring-1 ring-[rgba(var(--reader-tint),0.1)] shadow-2xl shadow-black/50 py-1.5">
                {linhaDoTempo.marcas.map((m) => (
                  <button
                    key={`${m.segundos}-${m.titulo}`}
                    type="button"
                    onClick={() => { irPara(m.segundos); setIndiceAberto(false); }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-[13px] text-[rgba(var(--reader-tint),0.7)] hover:text-[rgba(var(--reader-tint),1)] hover:bg-[rgba(var(--reader-tint),0.06)] transition-colors"
                  >
                    <span className="truncate">{m.titulo}</span>
                    <span className="tabular-nums text-[11px] text-[rgba(var(--reader-tint),0.35)]">
                      {tempoHumano(m.segundos)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {aoFechar && (
          <button
            type="button"
            onClick={aoFechar}
            className="px-3 py-1.5 rounded-full text-xs text-[rgba(var(--reader-tint),0.5)] hover:text-[rgba(var(--reader-tint),0.9)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)] transition-colors"
          >
            {T("Fechar")}
          </button>
        )}
      </div>

      {/* ── a coluna com a lente ──────────────────────────────────────── */}
      <div
        ref={colunaRef}
        onScroll={aoRolar}
        className="relative flex-1 overflow-y-auto px-6 sm:px-10 scroll-smooth"
      >
        {/* As bordas desvanecem para o texto não “bater” no cabeçalho e na
            barra — é o que faz a coluna parecer uma janela, e não uma caixa. */}
        <div className="pointer-events-none sticky top-0 h-16 -mb-16 z-10 bg-gradient-to-b from-[var(--reader-surface)] to-transparent" />

        <div className="max-w-[62ch] mx-auto py-10">
          {falas.map((f, idx) => {
            const distancia = atual < 0 ? 99 : Math.abs(idx - atual);
            const eAtual = idx === atual;
            const eTitulo = f.tipo === "titulo";
            const eSecao = f.tipo === "secao";

            return (
              <p
                key={f.i}
                ref={(el) => { falaRefs.current[idx] = el; }}
                onClick={() => irPara(f.de + 0.05)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") irPara(f.de + 0.05); }}
                aria-current={eAtual ? "true" : undefined}
                className={cn(
                  "cursor-pointer select-text outline-none transition-[opacity,filter,transform,color] duration-[600ms] ease-out",
                  "focus-visible:ring-2 focus-visible:ring-violet-400/50 rounded-lg",
                  eSecao && "mt-10 uppercase tracking-[0.16em] text-[0.72em] font-semibold",
                  eTitulo && "font-semibold",
                  eAtual
                    ? "my-5 leading-[1.45] text-[rgba(var(--reader-tint),0.98)] [text-shadow:0_0_28px_rgba(167,139,250,0.16)]"
                    : distancia === 1
                      ? "my-3 leading-[1.6] text-[rgba(var(--reader-tint),0.5)]"
                      : distancia === 2
                        ? "my-2.5 leading-[1.6] text-[rgba(var(--reader-tint),0.3)]"
                        : "my-2 leading-[1.6] text-[rgba(var(--reader-tint),0.17)]",
                )}
                style={{
                  // O zoom multiplica a escada inteira, então a PROPORÇÃO entre
                  // a frase em foco e as vizinhas se mantém em qualquer aumento
                  // — é a proporção que dá a sensação de lente, não o tamanho
                  // absoluto. Mexer só na frase atual achataria o efeito no
                  // zoom alto e o exageraria no baixo.
                  fontSize: eAtual
                    ? `clamp(${1.35 * zoom}rem, ${2.6 * zoom}vw, ${1.9 * zoom}rem)`
                    : distancia === 1
                      ? `clamp(${1 * zoom}rem, ${1.7 * zoom}vw, ${1.15 * zoom}rem)`
                      : distancia === 2
                        ? `clamp(${0.95 * zoom}rem, ${1.5 * zoom}vw, ${1.05 * zoom}rem)`
                        : `clamp(${0.9 * zoom}rem, ${1.4 * zoom}vw, ${1 * zoom}rem)`,
                  ...(semAnimacao || distancia <= 1
                    ? null
                    : { filter: `blur(${Math.min(1.6, (distancia - 1) * 0.5)}px)` }),
                }}
              >
                {eAtual && f.palavras?.length ? (
                  // Palavra a palavra DENTRO da frase que já está grande: o
                  // olho não precisa procurar, só confirmar. Por isso é um
                  // realce de brilho, e não uma caixa colorida que pisca.
                  f.palavras.map((w, k) => (
                    <span
                      key={`${w.de}-${k}`}
                      className={cn(
                        "transition-colors duration-200",
                        agora >= w.de && agora <= w.ate
                          ? "text-violet-200"
                          : agora > w.ate
                            ? "text-[rgba(var(--reader-tint),0.98)]"
                            : "text-[rgba(var(--reader-tint),0.62)]",
                      )}
                    >
                      {w.p}{" "}
                    </span>
                  ))
                ) : (
                  f.texto
                )}
              </p>
            );
          })}
        </div>

        <div className="pointer-events-none sticky bottom-0 h-20 -mt-20 bg-gradient-to-t from-[var(--reader-surface)] to-transparent" />
      </div>

      {/* “voltar para a leitura”, só quando a vista está solta e fora do lugar */}
      {saiuDoLugar && !seguindo && (
        <button
          type="button"
          onClick={() => { setSeguindo(true); setSaiuDoLugar(false); }}
          className="absolute left-1/2 -translate-x-1/2 bottom-28 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white bg-violet-600/90 hover:bg-violet-600 shadow-lg shadow-violet-900/40 backdrop-blur transition-colors"
        >
          <Lock size={13} />
          {T("Voltar para onde está tocando")}
        </button>
      )}

      {/* ── a barra ───────────────────────────────────────────────────── */}
      <div className="border-t border-[rgba(var(--reader-tint),0.06)] bg-[rgba(var(--reader-tint),0.02)] backdrop-blur-md">
        {/* ── o painel de tela e som ──────────────────────────────────────
            Fechado por padrão: quem só quer ouvir não precisa ver três
            réguas. Aberto, traz os ajustes de OLHO (zoom) e de OUVIDO
            (velocidade, volume) no mesmo lugar — é o mesmo gesto de
            "acertar a tela para mim". */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            painelAberto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="grid gap-4 sm:grid-cols-3 px-5 pt-4 pb-1 border-b border-[rgba(var(--reader-tint),0.05)]">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                  <span className="flex items-center gap-1.5"><ZoomIn size={12} />{T("Aumento")}</span>
                  <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
                </span>
                <input
                  type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={ZOOM_PASSO} value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-violet-400 cursor-pointer"
                  aria-label={T("Aumento do texto")}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                  <span className="flex items-center gap-1.5"><Gauge size={12} />{T("Velocidade")}</span>
                  <span className="tabular-nums">{velocidade}×</span>
                </span>
                <div className="flex gap-1">
                  {VELOCIDADES.map((v) => (
                    <button
                      key={v} type="button" onClick={() => setVelocidade(v)}
                      className={cn(
                        "flex-1 py-1 rounded-lg text-[11px] tabular-nums transition-colors",
                        v === velocidade
                          ? "bg-violet-500/25 text-violet-100"
                          : "bg-[rgba(var(--reader-tint),0.05)] text-[rgba(var(--reader-tint),0.5)] hover:bg-[rgba(var(--reader-tint),0.1)]",
                      )}
                    >
                      {v}×
                    </button>
                  ))}
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[rgba(var(--reader-tint),0.4)]">
                  <span className="flex items-center gap-1.5">
                    {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}{T("Volume")}
                  </span>
                  <span className="tabular-nums">{Math.round(volume * 100)}%</span>
                </span>
                <input
                  type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-violet-400 cursor-pointer"
                  aria-label={T("Volume")}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="relative h-1 bg-[rgba(var(--reader-tint),0.07)] group cursor-pointer"
             onClick={(e) => {
               const r = e.currentTarget.getBoundingClientRect();
               irPara(((e.clientX - r.left) / r.width) * total);
             }}>
          <div className="absolute inset-y-0 left-0 bg-violet-400/80 transition-[width] duration-150"
               style={{ width: `${progresso}%` }} />
          {linhaDoTempo.marcas.map((m) => (
            <span key={`t-${m.segundos}`}
                  className="absolute top-0 bottom-0 w-px bg-[rgba(var(--reader-tint),0.22)]"
                  style={{ left: `${total ? (m.segundos / total) * 100 : 0}%` }} />
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 sm:px-5 py-3">
          <button type="button" onClick={() => irPara(agora - PULO)} title={T("Voltar 15 segundos")}
                  className="p-2 rounded-full text-[rgba(var(--reader-tint),0.55)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
            <RotateCcw size={17} />
          </button>

          <button type="button" onClick={alternar} aria-label={tocando ? T("Pausar") : T("Tocar")}
                  className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-900/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
            {tocando ? <Pause size={19} /> : <Play size={19} className="ml-0.5" />}
          </button>

          <button type="button" onClick={() => irPara(agora + PULO)} title={T("Avançar 15 segundos")}
                  className="p-2 rounded-full text-[rgba(var(--reader-tint),0.55)] hover:text-[rgba(var(--reader-tint),0.95)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-colors">
            <RotateCw size={17} />
          </button>

          <span className="ml-1 text-xs tabular-nums text-[rgba(var(--reader-tint),0.4)]">
            {tempoHumano(agora)} <span className="opacity-50">/ {tempoHumano(total)}</span>
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setPainelAberto((v) => !v)}
            aria-expanded={painelAberto}
            title={T("Tela e som")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              painelAberto
                ? "text-violet-200 bg-violet-500/15"
                : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]",
            )}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline tabular-nums">{velocidade}×</span>
          </button>

          {/* O cadeado é o controle que o Ricardo pediu: destrancar a vista.
              Fechado = a página anda sozinha. Aberto = você manda no scroll. */}
          <button
            type="button"
            onClick={() => { setSeguindo((v) => !v); setSaiuDoLugar(false); }}
            aria-pressed={seguindo}
            title={seguindo ? T("A página segue o áudio") : T("Vista solta — você rola à vontade")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              seguindo
                ? "text-violet-200 bg-violet-500/15 hover:bg-violet-500/25"
                : "text-[rgba(var(--reader-tint),0.55)] bg-[rgba(var(--reader-tint),0.05)] hover:bg-[rgba(var(--reader-tint),0.1)]",
            )}
          >
            {seguindo ? <Lock size={13} /> : <LockOpen size={13} />}
            <span className="hidden sm:inline">{seguindo ? T("Seguindo") : T("Solto")}</span>
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        className="hidden"
      />
    </div>
  );
}
