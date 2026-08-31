"use client";

import { atributosAvatar, corStatus, type StatusPresenca } from "@/lib/game/avatar";

/**
 * O BONEQUINHO. Um busto de jogador de camisa, desenhado em SVG a partir da
 * semente — rosto amigável, cabelo, gola, número nas costas da gola e, para
 * alguns, a faixa de capitão. O anel colorido diz o status (procurando/
 * jogando/online). É o mesmo boneco em toda a plataforma: nuvem da comunidade,
 * card do mercado, resultado da busca.
 *
 * Sem imagem externa, sem dependência: SVG inline, seguro na CSP.
 */
export function AvatarJogador({
  seed,
  size = 56,
  status = "offline",
  anel = true,
  titulo,
}: {
  seed: string;
  size?: number;
  status?: StatusPresenca;
  /** Desenha o anel de status ao redor. */
  anel?: boolean;
  titulo?: string;
}) {
  const a = atributosAvatar(seed);
  const cor = corStatus(status);
  const id = `av-${simples(seed)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={titulo ?? "avatar"}
      style={{ display: "block", borderRadius: "50%", overflow: "visible" }}
    >
      <defs>
        <clipPath id={`${id}-c`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1f3a" />
          <stop offset="1" stopColor="#0c0e1d" />
        </linearGradient>
      </defs>

      {/* anel de status */}
      {anel && status !== "offline" && (
        <circle cx="32" cy="32" r="31" fill="none" stroke={cor} strokeWidth="2.5" opacity="0.9" />
      )}

      <g clipPath={`url(#${id}-c)`}>
        <circle cx="32" cy="32" r="30" fill={`url(#${id}-bg)`} />

        {/* ombros / camisa */}
        <path d="M6 62 C6 48 18 42 32 42 C46 42 58 48 58 62 Z" fill={a.camisa} />
        {/* gola em V */}
        <path d="M24 43 L32 52 L40 43 Z" fill={a.camisa2} opacity="0.95" />
        {/* listra do ombro */}
        <path d="M6 62 C6 54 10 49 15 46 L20 62 Z" fill={a.camisa2} opacity="0.55" />
        <path d="M58 62 C58 54 54 49 49 46 L44 62 Z" fill={a.camisa2} opacity="0.55" />
        {/* número na camisa */}
        <text
          x="32"
          y="60"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#0c0e1d"
          opacity="0.65"
          fontFamily="sans-serif"
        >
          {a.numero}
        </text>

        {/* pescoço */}
        <rect x="27" y="34" width="10" height="10" rx="4" fill={a.pele} />
        {/* cabeça */}
        <circle cx="32" cy="26" r="12" fill={a.pele} />

        {/* cabelo por penteado */}
        {a.penteado === 0 && (
          <path d="M20 25 C20 14 44 14 44 25 C44 20 40 16 32 16 C24 16 20 20 20 25 Z" fill={a.cabelo} />
        )}
        {a.penteado === 1 && (
          <path d="M21 24 C21 16 43 16 43 24 L43 21 C43 17 38 15 32 15 C26 15 21 17 21 21 Z" fill={a.cabelo} opacity="0.9" />
        )}
        {a.penteado === 2 && (
          <path d="M22 22 C22 12 42 12 42 22 C40 15 36 12 32 12 C28 12 25 15 24 20 C31 17 33 17 22 22 Z" fill={a.cabelo} />
        )}
        {a.penteado === 3 && (
          <>
            <circle cx="32" cy="14" r="5" fill={a.cabelo} />
            <path d="M21 25 C21 16 43 16 43 25 C43 19 38 16 32 16 C26 16 21 19 21 25 Z" fill={a.cabelo} />
          </>
        )}

        {/* faixa de capitão */}
        {a.faixa && <rect x="20" y="21" width="24" height="3.2" fill={a.camisa} opacity="0.9" />}

        {/* olhos */}
        <circle cx="27.5" cy="27" r="1.5" fill="#20242e" />
        <circle cx="36.5" cy="27" r="1.5" fill="#20242e" />
        {/* sorriso */}
        <path d="M28 31 Q32 34 36 31" fill="none" stroke="#20242e" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function simples(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "x";
}
