"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowUpRight, X, Clock, Search, BookOpen, Sparkles, Pin, PinOff, Youtube, BookOpenText } from "lucide-react";
import type { EstadoPainel } from "@/components/radar/usePainelAssunto";

/**
 * O painel de detalhe — inserido no mapa, não por cima dele.
 *
 * A referência é o HUD de transmissão esportiva: o mapa não é escondido, ele
 * se **reacomoda**. A câmera 3D empurra o mundo para cima e para a esquerda
 * (`setViewOffset` no frustum, em `RadarGlobo`), e o painel entra no canto que
 * ficou livre, em perspectiva, como uma placa suspensa no mesmo espaço.
 *
 * Três decisões que fazem isso funcionar:
 *
 * 1. **Nada de cortina escura.** Um véu por cima mataria a leitura do mapa e a
 *    ideia inteira. O escurecimento é um gradiente diagonal que só existe atrás
 *    do painel, e o blur é curto — o mapa continua legível ao lado.
 * 2. **Perspectiva de verdade, sutil.** `rotateY` negativo pequeno mais um
 *    `translateZ`: o suficiente para o painel pertencer ao espaço 3D e não
 *    parecer um cartão colado na tela. Exagerar aqui vira efeito de
 *    apresentação de slides.
 * 3. **O número é o herói.** É o dado que a página promete; ele entra em corpo
 *    grande, tabular, com a janela de tempo logo abaixo — porque número sem
 *    intervalo não informa nada.
 */

/**
 * A leitura de IA de um termo — o que a linha do IA Trend carrega.
 *
 * Existe porque o IA Trend não mede volume: mede POSIÇÃO no autocomplete e
 * CANAL. Espremer isso no formato do World Trend (volume + janela) daria um
 * número que não foi medido. São grandezas diferentes e a placa mostra cada
 * uma pelo que ela é.
 */
export interface DetalheIa {
  nota: number;
  canais: "web+yt" | "web" | "yt";
  posWeb: number | null;
  posYt: number | null;
  /** Quantas perguntas diferentes trouxeram este termo — a amplitude do tema. */
  sementes: number;
  naNoticia: boolean;
  nicho: string;
  /** A ponte honesta com o catálogo: o que temos, o que não temos. */
  ponte: { texto: string; cursos: Array<{ slug: string; nome: string }> };
}

export interface AssuntoAberto {
  titulo: string;
  fonte: "busca" | "leitura" | "ia";
  volume: number;
  volumeRotulo: string;
  contexto: string | null;
  url: string | null;
  veiculo: string | null;
  temIa: boolean;
  lugares?: string[];
  /** Presente só quando `fonte === "ia"`. */
  ia?: DetalheIa;
}

const NOME_REGIAO: Record<string, string> = {
  N: "Norte",
  NE: "Nordeste",
  SE: "Sudeste",
  S: "Sul",
  CO: "Centro-Oeste",
};

export function ModalAssunto({
  assunto,
  cor,
  nomeDoLugar,
  estado,
  fixado,
  variante,
  onFechar,
  onPin,
}: {
  assunto: AssuntoAberto;
  cor: string;
  nomeDoLugar: string;
  /** "piscando" = outro assunto pediu a vez; "saindo" = animação de saída. */
  estado: EstadoPainel;
  fixado: boolean;
  /** Qual dos cinco gestos este painel usa para entrar e sair. */
  variante: number;
  onFechar: () => void;
  onPin: () => void;
}) {
  const T = useT();
  const ehIa = assunto.fonte === "ia";
  const ehBusca = assunto.fonte === "busca";
  const ia = assunto.ia;

  /**
   * No celular a folha precisa sair da árvore do mapa — e trocar para
   * `position: fixed` NÃO basta.
   *
   * O cartão do mapa é `.glass`, e `backdrop-filter` num ancestral faz dele o
   * **bloco contêiner** de qualquer descendente `fixed`. Medido: com `inset:
   * auto 0 0 0` o painel resolvia contra o cartão de 341 px em vez da janela,
   * e continuava exatamente onde estava. O portal corta a ancestralidade e
   * devolve a janela como referência.
   */
  const [emCelular, setEmCelular] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const aplica = () => setEmCelular(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    return () => mq.removeEventListener("change", aplica);
  }, []);

  const conteudo = (
    <div className="radar-hud-caixa absolute inset-0 z-20" style={{ perspective: "760px", perspectiveOrigin: "78% 72%" }}>
      {/* Sombra diagonal: escurece só o canto onde o painel vive, deixando o
          mapa nítido do outro lado. */}
      <div
        aria-hidden
        onClick={onFechar}
        className="radar-hud-veu absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(6,8,20,.34) 52%, rgba(6,8,20,.72) 78%)",
        }}
      />

      <div
        className={`radar-hud radar-v${variante} radar-hud-placa absolute right-0 bottom-0 w-[92%] sm:w-[86%] max-w-[380px] p-2.5 ${
          estado === "saindo" ? "radar-hud-saindo" : ""
        } ${estado === "piscando" ? "radar-hud-piscando" : ""}`}
      >
        <div
          className="radar-hud-perspectiva relative"
          style={{
            // Perspectiva mais assumida: a placa pertence ao espaço 3D do
            // mapa. Com `perspective` curta (760px) e origem deslocada, a
            // borda esquerda recua de verdade em vez de sugerir profundidade.
            transform: "rotateY(-17deg) rotateX(6deg) translateZ(36px)",
            transformOrigin: "100% 100%",
            transformStyle: "preserve-3d",
          }}
        >
          {/* placa */}
          <div
            className="relative overflow-hidden"
            style={{
              background: "linear-gradient(150deg, rgba(18,22,48,.93), rgba(10,13,30,.96))",
              backdropFilter: "blur(14px) saturate(1.5)",
              border: `1px solid ${cor}55`,
              borderLeft: `3px solid ${cor}`,
              // canto chanfrado — a assinatura de HUD, sem virar enfeite
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 22px 100%, 0 calc(100% - 22px))",
              boxShadow: `0 26px 60px -18px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.04) inset, -14px 0 46px -26px ${cor}`,
            }}
          >
            {/* Fio de permanência: mostra que o painel tem prazo. Some ao
                fixar — é o retorno visual de que o alfinete funcionou. */}
            {!fixado && estado !== "saindo" && (
              <span
                key={assunto.titulo}
                aria-hidden
                className="radar-hud-prazo absolute left-0 top-0 h-[2px]"
                style={{ background: cor }}
              />
            )}

            {/* trilhos de varredura, bem discretos */}
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-[.13]"
              style={{
                backgroundImage: `repeating-linear-gradient(180deg, ${cor}, ${cor} 1px, transparent 1px, transparent 5px)`,
              }}
            />
            <span
              aria-hidden
              className="radar-hud-brilho absolute inset-y-0 w-24 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${cor}22, transparent)`,
              }}
            />

            <div className="relative p-3.5 pl-4">
              <div className="radar-peca flex items-start justify-between gap-2" style={{ ["--i" as string]: 0 } as React.CSSProperties}>
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.18em]"
                  style={{ color: cor }}
                >
                  {ehIa ? <Sparkles size={10} /> : ehBusca ? <Search size={10} /> : <BookOpen size={10} />}
                  {ehIa ? `demanda de IA · ${ia?.nicho ?? ""}` : `${ehBusca ? T("em alta") : T("mais lido")} · ${nomeDoLugar}`}
                </span>
                <span className="flex items-center gap-0.5 shrink-0 -mt-0.5 -mr-0.5">
                  <button
                    onClick={onPin}
                    aria-label={fixado ? T("Soltar painel") : T("Fixar painel")}
                    aria-pressed={fixado}
                    title={fixado ? T("Soltar — volta a sair sozinho") : T("Fixar — não sai sozinho")}
                    className="grid place-items-center w-6 h-6 rounded transition-colors cursor-pointer hover:bg-white/10"
                    style={{ color: fixado ? cor : "rgba(255,255,255,.4)" }}
                  >
                    {fixado ? <Pin size={13} /> : <PinOff size={13} />}
                  </button>
                  <button
                    onClick={onFechar}
                    aria-label={T("Fechar")}
                    className="grid place-items-center w-6 h-6 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </span>
              </div>

              <h4 className="radar-peca mt-1 text-[19px] font-bold leading-[1.15] capitalize" style={{ ["--i" as string]: 1 } as React.CSSProperties}>
                {T(assunto.titulo)}
              </h4>

              {/* o número, com a janela que faltava */}
              <div className="radar-peca mt-2 flex items-end gap-2 border-t border-white/[0.07] pt-2" style={{ ["--i" as string]: 2 } as React.CSSProperties}>
                <span
                  className="text-[34px] font-extrabold tabular-nums leading-[0.85]"
                  style={{ color: cor, textShadow: `0 0 26px ${cor}55` }}
                >
                  {ehIa
                    ? (ia?.nota ?? 0).toLocaleString("pt-BR")
                    : assunto.volume
                      ? `${assunto.volume.toLocaleString("pt-BR")}+`
                      : "—"}
                </span>
                <span className="text-[10px] text-white/45 leading-tight pb-0.5">
                  {ehIa ? T("nota do radar") : ehBusca ? T("buscas") : T("leituras")}
                  <br />
                  <span className="inline-flex items-center gap-0.5 text-white/30">
                    <Clock size={8} /> {ehIa ? T("posição no autocomplete") : ehBusca ? T("últimas 24h") : T("ontem")}
                  </span>
                </span>
                {assunto.temIa && !ehIa && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                    style={{ background: "#a78bfa26", color: "#a78bfa" }}
                  >
                    <Sparkles size={8} /> IA
                  </span>
                )}
              </div>

              {/* O canal é a leitura que importa no IA Trend: um termo que só
                  aparece no YouTube é demanda de VÍDEO, onde um canal ganha
                  antes de o site ranquear. Sem isto a nota é um número solto. */}
              {ehIa && ia && (
                <div className="radar-peca mt-2 flex flex-wrap gap-1" style={{ ["--i" as string]: 3 } as React.CSSProperties}>
                  {ia.posWeb !== null && (
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                      style={{ background: "#38bdf826", color: "#38bdf8" }}
                    >
                      <Search size={8} />  {T("Google ·")} {ia.posWeb + 1}º
                    </span>
                  )}
                  {ia.posYt !== null && (
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                      style={{ background: "#f472b626", color: "#f472b6" }}
                    >
                      <Youtube size={8} />  {T("YouTube ·")} {ia.posYt + 1}º
                    </span>
                  )}
                  {ia.canais === "web+yt" && (
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                      style={{ background: "#a3e63526", color: "#a3e635" }}
                    >
                      
                      {T("confirmado nos dois")}
                    </span>
                  )}
                  {ia.naNoticia && (
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                      style={{ background: "#f5c04e26", color: "#f5c04e" }}
                    >
                      
                      {T("no noticiário de hoje")}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/35">
                    {ia.sementes} {ia.sementes === 1 ? T("pergunta distinta") : T("perguntas distintas")}
                  </span>
                </div>
              )}

              {assunto.contexto && (
                <p className="radar-peca mt-2 text-[12px] text-white/65 leading-snug line-clamp-3" style={{ ["--i" as string]: 3 } as React.CSSProperties}>
                  {T(assunto.contexto)}
                </p>
              )}

              {assunto.lugares?.length ? (
                <div className="radar-peca mt-2 flex flex-wrap gap-1" style={{ ["--i" as string]: 4 } as React.CSSProperties}>
                  {assunto.lugares.map((l) => (
                    <span
                      key={l}
                      className="rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider"
                      style={{ background: `${cor}1f`, color: cor }}
                    >
                      {NOME_REGIAO[l] ?? l}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* A ponte com o catálogo é escrita à mão por nicho e diz também o
                  que NÃO temos — prometer curso que não existe custa mais caro
                  que a visita perdida. */}
              {ehIa && ia && (
                <div
                  className="radar-peca mt-2.5 rounded-lg p-2"
                  style={{ ["--i" as string]: 4, border: `1px solid ${cor}33`, background: `${cor}0d` } as React.CSSProperties}
                >
                  <p
                    className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest mb-1"
                    style={{ color: cor }}
                  >
                    <BookOpenText size={9} />  {T("como a FayAI ajuda")}
                  </p>
                  <p className="text-[11px] text-white/65 leading-snug line-clamp-3">{T(ia.ponte.texto)}</p>
                  {ia.ponte.cursos.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {ia.ponte.cursos.slice(0, 2).map((c) => (
                        <Link
                          key={c.slug}
                          href={`/curso/${c.slug}`}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border transition-colors hover:bg-white/10"
                          style={{ borderColor: `${cor}55`, color: "#f3f1ff" }}
                        >
                          {T(c.nome)} <ArrowUpRight size={9} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {assunto.url && (
                <a
                  href={assunto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="radar-peca mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-opacity hover:opacity-80"
                  style={{ ["--i" as string]: 5 } as React.CSSProperties}
                >
                  {ehIa ? T("Ver no") : T("Ler em")} {assunto.veiculo ?? T("fonte")} <ArrowUpRight size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ---------------------------------------------------------------
           CELULAR — o painel deixa de ser HUD-dentro-do-mapa.
           No desktop o mapa tem 420-560px e sobra canto para a placa entrar.
           No celular o container do globo mede 317x317: a mesma placa
           atravessa a borda e é cortada. Abaixo de 640px ela vira uma folha
           ancorada no rodapé da janela — o mapa continua inteiro e visível
           acima, com a região acesa, que é o ponto de ter mapa.
           Encolher o HUD não resolveria: em 317px ele não cabe legível.
           --------------------------------------------------------------- */
        @media (max-width: 639px) {
          .radar-hud-caixa {
            position: fixed;
            inset: auto 0 0 0;
            z-index: 60;
            perspective: none !important;
          }
          /* Nada de cortina: o mapa fica acima da folha e precisa continuar
             legível — é ele que mostra ONDE o assunto acontece. */
          .radar-hud-caixa .radar-hud-veu { display: none; }
          .radar-hud-placa {
            position: static;
            width: 100%;
            max-width: none;
            padding: 0;
          }
          /* A perspectiva é o que faz a placa pertencer ao espaço 3D do mapa.
             Fora do mapa ela só rouba largura e corta texto. */
          .radar-hud-caixa .radar-hud-perspectiva {
            transform: none !important;
            transform-style: flat !important;
          }
          .radar-hud-caixa .radar-hud-perspectiva > div {
            border-left-width: 0;
            border-bottom-width: 0;
            border-radius: 18px 18px 0 0;
            clip-path: none !important;
            box-shadow: 0 -18px 44px -14px rgba(0,0,0,.9) !important;
          }
        }

        /* ---------------------------------------------------------------
           Cinco gestos. A troca sorteia um (sem repetir o anterior), e é isso
           que dá a cada assunto a sensação de ser uma peça própria em vez de
           conteúdo trocado dentro da mesma placa.
           --------------------------------------------------------------- */

        .radar-hud { animation: hud-entra-desliza .52s cubic-bezier(.16,.84,.34,1) both; }
        .radar-hud-veu { animation: hud-fade .4s ease both; }
        .radar-hud-brilho { animation: hud-varre 3.2s ease-in-out .5s infinite; }

        /* 0 · desmonta — as peças entram/saem em cascata, a placa acompanha */
        .radar-v0 { animation: hud-entra-suave .4s cubic-bezier(.2,.8,.3,1) both; }
        .radar-v0 .radar-peca {
          animation: peca-entra .44s cubic-bezier(.2,.85,.3,1) both;
          animation-delay: calc(var(--i, 0) * 52ms + 90ms);
        }
        .radar-v0.radar-hud-saindo { animation: hud-sai-suave .34s ease-in .16s both; }
        .radar-v0.radar-hud-saindo .radar-peca {
          animation: peca-sai .26s cubic-bezier(.6,0,.8,.2) both;
          animation-delay: calc((5 - var(--i, 0)) * 34ms);
        }

        /* 1 · desliza de baixo */
        .radar-v1 { animation: hud-entra-sobe .5s cubic-bezier(.16,.9,.3,1) both; }
        .radar-v1.radar-hud-saindo { animation: hud-sai-desce .36s cubic-bezier(.5,0,.85,.3) both; }

        /* 2 · desvanece com desfoque — o gesto discreto */
        .radar-v2 { animation: hud-entra-foca .46s ease-out both; }
        .radar-v2.radar-hud-saindo { animation: hud-sai-desfoca .34s ease-in both; }

        /* 3 · dobra no eixo, como uma placa física */
        .radar-v3 { animation: hud-entra-dobra .56s cubic-bezier(.2,.9,.3,1) both; }
        .radar-v3.radar-hud-saindo { animation: hud-sai-dobra .36s cubic-bezier(.6,0,.9,.4) both; }

        /* 4 · corta — a placa se revela e se recolhe por uma fresta */
        .radar-v4 { animation: hud-entra-corta .5s cubic-bezier(.16,.86,.32,1) both; }
        .radar-v4.radar-hud-saindo { animation: hud-sai-corta .34s cubic-bezier(.6,0,.9,.4) both; }

        @keyframes hud-entra-desliza {
          from { opacity: 0; transform: translate3d(26px, 14px, 0) rotateY(-16deg); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) rotateY(0deg); }
        }
        @keyframes hud-entra-suave { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hud-sai-suave   { from { opacity: 1 } to { opacity: 0 } }

        @keyframes hud-entra-sobe {
          from { opacity: 0; transform: translate3d(0, 46px, -40px); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes hud-sai-desce {
          from { opacity: 1; transform: translate3d(0, 0, 0); }
          to   { opacity: 0; transform: translate3d(0, 52px, -30px); }
        }

        @keyframes hud-entra-foca {
          from { opacity: 0; filter: blur(9px); transform: scale(1.04); }
          to   { opacity: 1; filter: blur(0);   transform: scale(1); }
        }
        @keyframes hud-sai-desfoca {
          from { opacity: 1; filter: blur(0);   transform: scale(1); }
          to   { opacity: 0; filter: blur(7px); transform: scale(.98); }
        }

        @keyframes hud-entra-dobra {
          from { opacity: 0; transform: rotateX(-72deg) translateZ(-30px); }
          to   { opacity: 1; transform: rotateX(0deg) translateZ(0); }
        }
        @keyframes hud-sai-dobra {
          from { opacity: 1; transform: rotateX(0deg); }
          to   { opacity: 0; transform: rotateX(64deg) translateZ(-24px); }
        }

        @keyframes hud-entra-corta {
          from { opacity: 0; clip-path: inset(46% 0 46% 0); }
          to   { opacity: 1; clip-path: inset(0 0 0 0); }
        }
        @keyframes hud-sai-corta {
          from { opacity: 1; clip-path: inset(0 0 0 0); }
          to   { opacity: 0; clip-path: inset(48% 0 48% 0); }
        }

        @keyframes peca-entra {
          from { opacity: 0; transform: translate3d(14px, 6px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes peca-sai {
          from { opacity: 1; transform: translate3d(0, 0, 0); }
          to   { opacity: 0; transform: translate3d(-10px, -4px, 0); }
        }

        @keyframes hud-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hud-varre {
          0%   { left: -20%; opacity: 0 }
          22%  { opacity: 1 }
          60%  { left: 105%; opacity: 0 }
          100% { left: 105%; opacity: 0 }
        }

        /* Aviso de troca. Não é um pisca-pisca: é uma interferência de sinal —
           a placa recua no eixo, o brilho passa e a borda pulsa. Lê como HUD
           perdendo sintonia, que é intencional, e não como falha de render. */
        .radar-hud-piscando { animation: hud-interfere 2s cubic-bezier(.4,0,.6,1) both; }
        @keyframes hud-interfere {
          0%   { opacity: 1; transform: translateZ(0) skewX(0deg); filter: saturate(1) }
          6%   { opacity: .55; transform: translateZ(-16px) skewX(1.6deg); filter: saturate(1.8) }
          11%  { opacity: 1; transform: translateZ(0) skewX(-.7deg); }
          17%  { opacity: .68; transform: translateZ(-9px) skewX(1deg); filter: saturate(1.5) }
          23%  { opacity: 1; transform: translateZ(0) skewX(0deg); filter: saturate(1) }
          70%  { opacity: .96 }
          100% { opacity: .9; transform: translateZ(-4px) }
        }

        .radar-hud-prazo { animation: hud-corre 9s linear both; opacity: .5; }
        @keyframes hud-corre { from { width: 100% } to { width: 0% } }

        @media (prefers-reduced-motion: reduce) {
          .radar-hud, .radar-hud-veu, .radar-hud-piscando, .radar-hud-saindo,
          .radar-v0, .radar-v1, .radar-v2, .radar-v3, .radar-v4,
          .radar-peca { animation: none !important }
          .radar-hud-brilho, .radar-hud-prazo { display: none }
        }
      `}</style>
    </div>
  );

  return emCelular ? createPortal(conteudo, document.body) : conteudo;
}
