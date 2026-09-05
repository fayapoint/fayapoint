/**
 * A FONTE DE TEMPO da lente — quem responde "que segundo é agora".
 *
 * ## Por que este arquivo existe (05/09/2026)
 *
 * A lente nunca precisou de áudio. Ela precisa de um RELÓGIO que ande na mesma
 * régua da linha do tempo (`.tempos.json`), e de um jeito de mandar nele
 * (tocar, pausar, pular). Até aqui esse relógio era sempre o `<audio>`, e a
 * lente falava com ele direto: `audioRef.current.currentTime`, `.paused`,
 * `.play()`, `addEventListener("timeupdate")`.
 *
 * Agora a mesma aula existe em VÍDEO — montado a partir da MESMA narração
 * (`cursos/aula_em_video.mjs` chama o mesmo `montar()` do audiobook), então o
 * segundo 137 do vídeo é o segundo 137 do áudio: **a régua é a mesma**.
 *
 * Ligar o vídeo à lente é, portanto, TROCAR A FONTE — não escrever uma segunda
 * lente. Este arquivo é o contrato que as duas cumprem. Tudo o que vem depois
 * do relógio (achar a fala, pintar o realce, perseguir a rolagem, gravar o
 * progresso) não sabe, e não precisa saber, de onde o número veio.
 *
 * ## ⚠️ O PULSO NÃO É `requestAnimationFrame`, E ISSO É DELIBERADO
 *
 * `requestAnimationFrame` PARA com a aba escondida — e ouvir/assistir aula com
 * a tela apagada é uso principal, não exceção. Se o progresso dependesse dele,
 * quem ouvisse um capítulo inteiro no bolso voltaria com nada verde e nada
 * gravado (o defeito está documentado no relógio de `LenteSobreposta`).
 *
 * Por isso cada fonte oferece um PULSO grosso que sobrevive à aba escondida:
 *
 *   · `<audio>`/`<video>`: o evento `timeupdate`, que continua disparando
 *     (~4×/s) com a aba oculta;
 *   · YouTube: um `setInterval` de 250 ms. O navegador estrangula o intervalo
 *     para ~1×/s quando a aba some, mas ele CONTINUA disparando — que é o que
 *     importa para o verde e para a gravação. `getCurrentTime()` do player
 *     segue correto porque quem toca é o iframe, não o nosso laço.
 *
 * O `requestAnimationFrame` continua existindo na lente, mas só para o que só
 * importa com a tela acesa: o número do tempo correndo e a interpolação da
 * rolagem.
 */

/** Como um capítulo pode virar vídeo. Os dois falam a mesma régua de tempo. */
export type VideoDaAula =
  | { fonte: "youtube"; videoId: string; titulo?: string | null }
  | { fonte: "arquivo"; url: string; titulo?: string | null };

export type EventoDaFonte = "pulso" | "tocou" | "pausou" | "terminou" | "pronta";

/**
 * O que a lente pede a um tocador. É de propósito o MENOR conjunto possível:
 * cada método a mais aqui é um método a mais para o YouTube fingir.
 */
export type FonteDeTempo = {
  tipo: "midia" | "youtube";
  /** Segundos corridos desde o início do capítulo. */
  tempo(): number;
  /** Duração conhecida, ou 0 enquanto o tocador ainda não sabe. */
  duracao(): number;
  pausado(): boolean;
  /** Já sabe a duração e aceita `irPara`. Equivale a `readyState >= 1`. */
  pronta(): boolean;
  tocar(): void;
  pausar(): void;
  irPara(segundos: number): void;
  velocidade(v: number): void;
  /** 0 a 1, como no `<audio>`. O YouTube converte para 0–100 por dentro. */
  volume(v: number): void;
  /** Assina um evento e devolve o cancelamento. */
  ouvir(evento: EventoDaFonte, fn: () => void): () => void;
};

/* ═══════════════════════════════════════════════════════════════════════════
   1. `<audio>` e `<video>` — o caminho que já existia
   ═══════════════════════════════════════════════════════════════════════════ */

const EVENTO_NATIVO: Record<EventoDaFonte, string> = {
  pulso: "timeupdate",
  tocou: "play",
  pausou: "pause",
  terminou: "ended",
  pronta: "loadedmetadata",
};

export function fonteDeMidia(el: HTMLMediaElement): FonteDeTempo {
  return {
    tipo: "midia",
    tempo: () => el.currentTime,
    duracao: () => (Number.isFinite(el.duration) ? el.duration : 0),
    pausado: () => el.paused,
    pronta: () => el.readyState >= 1,
    tocar: () => { void el.play()?.catch(() => { /* o navegador pode recusar sem gesto */ }); },
    pausar: () => el.pause(),
    irPara: (s) => {
      el.currentTime = Math.max(0, Math.min(s, el.duration || s));
    },
    velocidade: (v) => { el.playbackRate = v; },
    volume: (v) => { el.volume = Math.min(1, Math.max(0, v)); },
    ouvir: (evento, fn) => {
      const nome = EVENTO_NATIVO[evento];
      el.addEventListener(nome, fn);
      return () => el.removeEventListener(nome, fn);
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. YouTube — o mesmo contrato, por cima da IFrame API
   ═══════════════════════════════════════════════════════════════════════════ */

/** O pouco da IFrame API que usamos, declarado aqui para não puxar @types. */
export type TocadorYT = {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(segundos: number, permitirAdiantar: boolean): void;
  setPlaybackRate(v: number): void;
  setVolume(v: number): void;
  unMute(): void;
  mute(): void;
  destroy(): void;
};

/** Estados da IFrame API. -1 não iniciado, 0 fim, 1 tocando, 2 pausado, 3 buffer. */
export const YT_FIM = 0;
export const YT_TOCANDO = 1;
export const YT_PAUSADO = 2;

export type FonteYouTube = FonteDeTempo & {
  /** O tocador avisa a fonte; a fonte avisa a lente. */
  anunciar(evento: Exclude<EventoDaFonte, "pulso">): void;
};

/** De quanto em quanto tempo o YouTube é perguntado. Ver o cabeçalho. */
const PULSO_MS = 250;

export function fonteDoYouTube(player: TocadorYT): FonteYouTube {
  const ouvintes: Record<EventoDaFonte, Set<() => void>> = {
    pulso: new Set(), tocou: new Set(), pausou: new Set(), terminou: new Set(), pronta: new Set(),
  };
  let batida: ReturnType<typeof setInterval> | null = null;

  /**
   * O pulso só corre quando alguém está ouvindo — e para quando o último
   * ouvinte sai. Um intervalo órfão sobrevive à troca de capítulo e continua
   * empurrando tempo de um tocador que já foi destruído.
   */
  const ajustarBatida = () => {
    if (ouvintes.pulso.size > 0 && !batida) {
      batida = setInterval(() => ouvintes.pulso.forEach((f) => f()), PULSO_MS);
    } else if (ouvintes.pulso.size === 0 && batida) {
      clearInterval(batida);
      batida = null;
    }
  };

  return {
    tipo: "youtube",
    // ⚠️ Antes do primeiro `onReady` o player pode nem ter estes métodos: a
    // IFrame API os instala no objeto conforme o iframe responde. Perguntar
    // cedo devolvia `TypeError` e derrubava o quadro inteiro da lente.
    tempo: () => (typeof player.getCurrentTime === "function" ? player.getCurrentTime() || 0 : 0),
    duracao: () => (typeof player.getDuration === "function" ? player.getDuration() || 0 : 0),
    pausado: () => (typeof player.getPlayerState === "function" ? player.getPlayerState() !== YT_TOCANDO : true),
    pronta: () => typeof player.getDuration === "function" && player.getDuration() > 0,
    tocar: () => player.playVideo?.(),
    pausar: () => player.pauseVideo?.(),
    irPara: (s) => player.seekTo?.(Math.max(0, s), true),
    velocidade: (v) => player.setPlaybackRate?.(v),
    volume: (v) => {
      // O YouTube separa MUDO de VOLUME: pôr 0 no volume e deixar mudo ligado
      // faz o aluno subir a régua e continuar sem som nenhum.
      if (v <= 0) player.mute?.();
      else { player.unMute?.(); player.setVolume?.(Math.round(Math.min(1, v) * 100)); }
    },
    ouvir: (evento, fn) => {
      ouvintes[evento].add(fn);
      ajustarBatida();
      return () => { ouvintes[evento].delete(fn); ajustarBatida(); };
    },
    anunciar: (evento) => ouvintes[evento].forEach((f) => f()),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. Carregar a IFrame API uma vez só
   ═══════════════════════════════════════════════════════════════════════════ */

type ApiYT = {
  Player: new (
    el: HTMLElement | string,
    opcoes: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => TocadorYT;
};

declare global {
  interface Window {
    YT?: ApiYT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let promessaApi: Promise<ApiYT> | null = null;

/**
 * A API do YouTube é global e avisa por UMA função global. Duas chamadas
 * concorrentes (dois capítulos, dois modos) sobrescreviam `onYouTubeIframeAPIReady`
 * uma da outra e a segunda esperava para sempre. Uma promessa só, guardada.
 */
export function carregarApiYouTube(): Promise<ApiYT> {
  if (typeof window === "undefined") return Promise.reject(new Error("sem janela"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (promessaApi) return promessaApi;

  promessaApi = new Promise<ApiYT>((ok, falhar) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      anterior?.();
      if (window.YT?.Player) ok(window.YT);
      else falhar(new Error("a API do YouTube carregou sem Player"));
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => falhar(new Error("não deu para carregar a API do YouTube"));
      document.head.appendChild(s);
    }
  });
  // Uma falha guardada nunca mais deixaria a lente tentar de novo.
  promessaApi.catch(() => { promessaApi = null; });
  return promessaApi;
}
