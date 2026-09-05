"use client";

/**
 * A JANELA DE VÍDEO da lente — a imagem, e nada além dela.
 *
 * Este componente não sabe o que é uma fala nem o que é um realce. Ele desenha
 * o tocador e entrega para cima uma `FonteDeTempo` (ver `lente-fonte.ts`); quem
 * segue o texto continua sendo a lente, com o mesmo código que segue o áudio.
 *
 * ## Por que a janela é pequena e flutuante
 *
 * O produto aqui é LER ACOMPANHANDO. Um vídeo que ocupa a tela empurra o
 * capítulo para fora dela e o realce passa a acender onde ninguém vê — que é
 * o oposto do pedido. A imagem fica do tamanho de uma janela de canto, sobre o
 * texto, e o aluno pode encolhê-la quando quiser só a voz.
 *
 * ## ⚠️ O IFRAME NÃO PODE SER REMONTADO POR MUDANÇA DE ESTADO
 *
 * Recriar o `<div>` alvo faz a IFrame API perder o elemento e o vídeo recomeça
 * do zero. Por isso o alvo é um nó estável, o player nasce uma vez por vídeo, e
 * encolher a janela é CSS — nunca desmontar.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  carregarApiYouTube,
  fonteDeMidia,
  fonteDoYouTube,
  YT_FIM,
  YT_PAUSADO,
  YT_TOCANDO,
  type FonteDeTempo,
  type TocadorYT,
  type VideoDaAula,
} from "@/lib/lente-fonte";
import { cn } from "@/lib/utils";

export default function TocadorDeVideo({
  video,
  aoPronta,
  T = (s: string) => s,
  className,
}: {
  video: VideoDaAula;
  /** Chamado com a fonte quando o tocador existe, e com `null` ao sair. */
  aoPronta: (fonte: FonteDeTempo | null) => void;
  T?: (s: string) => string;
  className?: string;
}) {
  const alvoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<TocadorYT | null>(null);
  const fonteYTRef = useRef<ReturnType<typeof fonteDoYouTube> | null>(null);
  const aoProntaRef = useRef(aoPronta);
  aoProntaRef.current = aoPronta;

  const [carregando, setCarregando] = useState(video.fonte === "youtube");
  const [erro, setErro] = useState<string | null>(null);

  const chaveDoVideo = video.fonte === "youtube" ? `yt:${video.videoId}` : `url:${video.url}`;

  useEffect(() => {
    if (video.fonte !== "youtube") return;
    let vivo = true;
    setCarregando(true);
    setErro(null);

    carregarApiYouTube()
      .then((YT) => {
        const alvo = alvoRef.current;
        if (!vivo || !alvo) return;
        const player = new YT.Player(alvo, {
          videoId: video.videoId,
          // Sem cookie de rastreio enquanto o aluno não toca. É o domínio que o
          // próprio YouTube oferece para embutir com menos coleta.
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            // `enablejsapi` é o que permite perguntar o tempo — sem ele o
            // vídeo toca e a lente fica parada, sem erro nenhum na tela.
            enablejsapi: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!vivo) return;
              playerRef.current = player;
              const fonte = fonteDoYouTube(player);
              fonteYTRef.current = fonte;
              setCarregando(false);
              aoProntaRef.current(fonte);
              fonte.anunciar("pronta");
            },
            onStateChange: (e) => {
              const f = fonteYTRef.current;
              if (!f) return;
              if (e.data === YT_TOCANDO) f.anunciar("tocou");
              else if (e.data === YT_PAUSADO) f.anunciar("pausou");
              else if (e.data === YT_FIM) { f.anunciar("pausou"); f.anunciar("terminou"); }
            },
            onError: () => {
              if (!vivo) return;
              setCarregando(false);
              // 101/150 = o dono proibiu embutir. Dizer isso evita horas
              // procurando defeito na lente por causa de uma opção do vídeo.
              setErro(T("Este vídeo não permite ser embutido — abra-o no YouTube ou libere a incorporação."));
            },
          },
        });
      })
      .catch(() => {
        if (!vivo) return;
        setCarregando(false);
        setErro(T("Não consegui carregar o tocador do YouTube."));
      });

    return () => {
      vivo = false;
      aoProntaRef.current(null);
      fonteYTRef.current = null;
      try { playerRef.current?.destroy(); } catch { /* já foi embora com o DOM */ }
      playerRef.current = null;
    };
    // `T` fora das dependências de propósito: ele muda de identidade a cada
    // render do leitor e remontaria o player — o vídeo recomeçaria do zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDoVideo, video.fonte]);

  /**
   * Vídeo de URL direta: o próprio elemento já é a fonte.
   *
   * ⚠️ ESTÁVEL, senão o React chama com `null` e de novo com o elemento a cada
   * render — e a lente trocaria de fonte dezenas de vezes por segundo.
   */
  const prenderMidia = useCallback((el: HTMLVideoElement | null) => {
    aoProntaRef.current(el ? fonteDeMidia(el) : null);
  }, []);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-[var(--lente-barra-anel)]", className)}>
      {video.fonte === "youtube" ? (
        <>
          {/* O alvo do iframe. Nada de estado o remonta — ver o cabeçalho. */}
          <div ref={alvoRef} className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
          {(carregando || erro) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-4 text-center">
              {erro ? (
                <p className="text-[11px] leading-snug text-amber-300/80">{erro}</p>
              ) : (
                <Loader2 size={18} className="animate-spin text-violet-300" />
              )}
            </div>
          )}
        </>
      ) : (
        <video
          ref={prenderMidia}
          src={video.url}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
