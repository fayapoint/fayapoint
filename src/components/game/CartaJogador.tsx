"use client";

import { Crown, Star } from "lucide-react";
import type { CopyCampeonato } from "@/lib/game/copy-campeonato";
import { bebas } from "@/lib/game/tema";

/**
 * A CARTA DO JOGADOR — 25/08/2026.
 *
 * Ricardo: *"ter sua carta como existem as bordas e o layout de outros fifa"*.
 *
 * ## O que a carta mostra, e por que não é a carta do Ultimate Team
 *
 * A carta do FUT tem ritmo, finalização, passe, drible, defesa e físico —
 * atributos que a EA publica para as cartas do modo dela e **não publica para
 * o Pro do Clubs**. Copiar a grade de seis atributos aqui obrigaria a inventar
 * seis números, e número inventado numa carta que parece oficial é a pior
 * espécie de mentira: ela é convincente.
 *
 * Então a grade é a mesma FORMA (seis células, três por linha, sigla em cima
 * do número) com os seis números que a fonte de fato entrega para Clubs:
 * jogos, gols, assistências, nota média, prêmios de craque e aproveitamento.
 * Quem joga Clubs reconhece o formato e lê dados que significam alguma coisa
 * para ele.
 *
 * ## Os níveis
 *
 * Bronze, prata, ouro e lenda saem do OVR do Pro — que a EA publica de verdade
 * (`proOverall`). Sem OVR, a carta cai para prata e não finge saber.
 *
 * Tudo é CSS e SVG: nenhuma imagem, nenhuma fonte de terceiro, nada que
 * dependa de rede. A carta é usada na tela, no elenco e dentro do pôster do
 * campeão — e o pôster é gerado no servidor, onde não há navegador para
 * carregar imagem.
 */

export type NivelCarta = "bronze" | "prata" | "ouro" | "lenda";

export interface DadosCarta {
  gamertag: string;
  proName?: string | null;
  posicao?: string | null;
  overall?: number | null;
  jogos?: number | null;
  gols?: number | null;
  assistencias?: number | null;
  nota?: number | null;
  craques?: number | null;
  vitorias?: number | null;
  clube?: string | null;
  /** Faixa honorífica: "Artilheiro", "Campeão"… Aparece sobre o nome. */
  titulo?: string | null;
}

/** O nível sai do OVR que a EA publica. Sem OVR, prata — e não finge. */
export function nivelDoOverall(overall?: number | null): NivelCarta {
  if (overall == null) return "prata";
  if (overall >= 87) return "lenda";
  if (overall >= 75) return "ouro";
  if (overall >= 65) return "prata";
  return "bronze";
}

interface PaletaCarta {
  fundo: string;
  brilho: string;
  borda: string;
  tinta: string;
  tintaSuave: string;
  linha: string;
}

/**
 * As quatro paletas. Cada uma é um metal, não uma cor chapada: o gradiente vai
 * de um tom escuro no canto a um claro no centro, que é o que faz metal
 * parecer metal em vez de plástico.
 */
const PALETAS: Record<NivelCarta, PaletaCarta> = {
  bronze: {
    fundo: "linear-gradient(160deg,#4a2c17 0%,#8a5a30 38%,#c98a4b 55%,#7a4c26 78%,#3d2412 100%)",
    brilho: "rgba(255,214,170,.45)",
    borda: "#c98a4b",
    tinta: "#2b1708",
    tintaSuave: "rgba(43,23,8,.72)",
    linha: "rgba(43,23,8,.35)",
  },
  prata: {
    fundo: "linear-gradient(160deg,#3f4550 0%,#8b939f 36%,#dfe5ec 55%,#8b939f 76%,#343a44 100%)",
    brilho: "rgba(255,255,255,.55)",
    borda: "#dfe5ec",
    tinta: "#1d2129",
    tintaSuave: "rgba(29,33,41,.72)",
    linha: "rgba(29,33,41,.3)",
  },
  ouro: {
    fundo: "linear-gradient(160deg,#5a4212 0%,#b8912f 34%,#f5d97a 54%,#b8912f 76%,#4d3810 100%)",
    brilho: "rgba(255,243,200,.6)",
    borda: "#f5d97a",
    tinta: "#2c2007",
    tintaSuave: "rgba(44,32,7,.72)",
    linha: "rgba(44,32,7,.32)",
  },
  // A lenda foge do metal de propósito: ela não é "ouro melhor", é outra coisa.
  lenda: {
    fundo: "linear-gradient(160deg,#160d2e 0%,#3b1d6e 30%,#7b3fd1 50%,#2a1352 74%,#0d0720 100%)",
    brilho: "rgba(214,188,255,.6)",
    borda: "#c9a6ff",
    tinta: "#f4ecff",
    tintaSuave: "rgba(244,236,255,.75)",
    linha: "rgba(201,166,255,.35)",
  },
};

/**
 * A silhueta da carta. É o recorte que faz o olho reconhecer "carta de
 * futebol" antes de ler qualquer coisa: ombros retos em cima, cintura reta e
 * base afunilada.
 */
const RECORTE =
  "polygon(0% 6%, 6% 0%, 94% 0%, 100% 6%, 100% 82%, 88% 100%, 12% 100%, 0% 82%)";

const SIGLA_POSICAO: Record<string, string> = {
  goalkeeper: "GOL",
  gk: "GOL",
  defender: "ZAG",
  cb: "ZAG",
  lb: "LAT",
  rb: "LAT",
  defensivemid: "VOL",
  cdm: "VOL",
  midfielder: "MEI",
  cm: "MEI",
  cam: "MEI",
  lm: "MEI",
  rm: "MEI",
  forward: "ATA",
  striker: "ATA",
  st: "ATA",
  cf: "ATA",
  lw: "PON",
  rw: "PON",
};

function siglaPosicao(pos?: string | null, copy?: CopyCampeonato): string {
  if (!pos) return "—";
  const k = pos.trim().toLowerCase();
  return copy?.carta.positions[k] ?? SIGLA_POSICAO[k] ?? pos.slice(0, 3).toUpperCase();
}

/** As iniciais, para o lugar onde o FUT põe a foto do jogador. */
function iniciais(nome: string): string {
  const partes = nome.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function CartaJogador({
  dados,
  copy,
  largura = 200,
  className = "",
}: {
  dados: DadosCarta;
  copy: CopyCampeonato;
  /** Largura em px. A carta escala inteira a partir daqui. */
  largura?: number;
  className?: string;
}) {
  const nivel = nivelDoOverall(dados.overall);
  const p = PALETAS[nivel];
  const nome = dados.proName || dados.gamertag;
  // A escala amarra TODOS os tamanhos à largura pedida. Sem isso, a carta a
  // 120px fica com fonte de 200px e vira um borrão.
  const e = largura / 200;

  const celulas: Array<[string, string]> = [
    [copy.painel.cols.played, fmt(dados.jogos)],
    [copy.painel.cols.goals, fmt(dados.gols)],
    [copy.painel.cols.assists, fmt(dados.assistencias)],
    [copy.painel.cols.rating, dados.nota != null ? dados.nota.toFixed(1) : "—"],
    ["MOM", fmt(dados.craques)],
    ["VIT", dados.vitorias != null ? `${Math.round(dados.vitorias)}%` : "—"],
  ];

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: largura, aspectRatio: "200 / 278" }}
    >
      {/* O corpo da carta, com o recorte e o metal. */}
      <div
        className="absolute inset-0"
        style={{ clipPath: RECORTE, background: p.fundo, color: p.tinta }}
      >
        {/* O brilho diagonal. Uma faixa só, larga e fraca — duas fariam a carta
            parecer molhada em vez de metálica. */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(115deg, transparent 30%, ${p.brilho} 47%, transparent 62%)`,
            mixBlendMode: "soft-light",
          }}
        />
        {/* Textura fina, para o metal não ficar liso demais de perto. */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            background: `repeating-linear-gradient(115deg, transparent 0 ${3 * e}px, rgba(255,255,255,.5) ${3 * e}px ${4 * e}px)`,
          }}
        />

        {/* -------- Bloco de cima: OVR, posição e as iniciais -------- */}
        <div
          className="absolute flex items-start justify-between"
          style={{ left: 18 * e, right: 18 * e, top: 22 * e }}
        >
          <div className="text-left leading-none">
            <p style={{ ...bebas, fontSize: 44 * e, lineHeight: 0.82 }}>
              {dados.overall ?? "—"}
            </p>
            <p
              style={{
                ...bebas,
                fontSize: 15 * e,
                letterSpacing: "0.12em",
                marginTop: 3 * e,
                color: p.tintaSuave,
              }}
            >
              {siglaPosicao(dados.posicao, copy)}
            </p>
            <span
              aria-hidden
              className="block"
              style={{
                width: 22 * e,
                height: 1,
                background: p.linha,
                marginTop: 5 * e,
              }}
            />
            <p
              style={{
                ...bebas,
                fontSize: 11 * e,
                letterSpacing: "0.1em",
                marginTop: 4 * e,
                color: p.tintaSuave,
              }}
            >
              {copy.carta.tiers[nivel]}
            </p>
          </div>

          {/* O lugar da foto: as iniciais num disco. Foto de Pro a EA não
              publica, e um contorno genérico de jogador deixaria a carta com
              cara de espaço reservado. */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 74 * e,
              height: 74 * e,
              border: `${2 * e}px solid ${p.linha}`,
              background: "rgba(255,255,255,.1)",
            }}
          >
            <span style={{ ...bebas, fontSize: 32 * e, color: p.tinta }}>
              {iniciais(nome)}
            </span>
          </div>
        </div>

        {/* -------- Faixa do nome -------- */}
        <div
          className="absolute text-center"
          style={{ left: 12 * e, right: 12 * e, top: 128 * e }}
        >
          {dados.titulo && (
            <p
              className="inline-flex items-center justify-center gap-1"
              style={{
                ...bebas,
                fontSize: 10 * e,
                letterSpacing: "0.18em",
                color: p.tintaSuave,
                marginBottom: 2 * e,
              }}
            >
              <Crown size={9 * e} />
              {dados.titulo}
            </p>
          )}
          <p
            className="truncate"
            style={{ ...bebas, fontSize: 21 * e, lineHeight: 1, letterSpacing: "0.02em" }}
          >
            {nome.toUpperCase()}
          </p>
          <span
            aria-hidden
            className="mx-auto block"
            style={{
              width: "72%",
              height: 1,
              background: p.linha,
              marginTop: 7 * e,
            }}
          />
        </div>

        {/* -------- Grade de números -------- */}
        <div
          className="absolute grid grid-cols-3"
          style={{
            left: 16 * e,
            right: 16 * e,
            top: 168 * e,
            rowGap: 7 * e,
          }}
        >
          {celulas.map(([rotulo, valor]) => (
            <div key={rotulo} className="text-center leading-none">
              <p
                style={{
                  ...bebas,
                  fontSize: 9 * e,
                  letterSpacing: "0.14em",
                  color: p.tintaSuave,
                }}
              >
                {rotulo}
              </p>
              <p style={{ ...bebas, fontSize: 19 * e, marginTop: 1 * e }}>{valor}</p>
            </div>
          ))}
        </div>

        {/* -------- Rodapé: o clube -------- */}
        {dados.clube && (
          <p
            className="absolute truncate text-center"
            style={{
              left: 14 * e,
              right: 14 * e,
              bottom: 12 * e,
              ...bebas,
              fontSize: 10 * e,
              letterSpacing: "0.14em",
              color: p.tintaSuave,
            }}
          >
            {dados.clube.toUpperCase()}
          </p>
        )}

        {/* A estrela da lenda: o único enfeite, e só no nível que o merece. */}
        {nivel === "lenda" && (
          <Star
            aria-hidden
            size={13 * e}
            className="absolute"
            style={{ right: 16 * e, bottom: 26 * e, color: p.borda }}
          />
        )}
      </div>

      {/* A borda, desenhada por fora do recorte para a linha ficar nítida. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: RECORTE,
          boxShadow: `inset 0 0 0 ${1.5 * e}px ${p.borda}`,
        }}
      />
    </div>
  );
}

const fmt = (v?: number | null) => (v == null ? "—" : String(Math.round(v)));
