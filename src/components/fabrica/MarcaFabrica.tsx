/**
 * A TORRE — o desenho que a animação monta e que o `loading` repete.
 *
 * ⛔ Este componente é a **fonte única** do quadro de continuidade. O último
 * quadro da desmontagem e o primeiro quadro de `/fabrica/loading.tsx` são este
 * mesmo desenho, na mesma posição e na mesma escala. Se ele mudar, os dois
 * mudam juntos — que é exatamente o motivo de existir um componente só em vez
 * de dois SVGs parecidos.
 *
 * A torre são seis lajes empilhadas: as mesmas seis que a animação forma quando
 * os painéis do banner convergem. A de baixo é a mais larga (a fundação, o
 * blueprint 01) e a de cima é a mais estreita (a memória, o 20).
 */

export const TORRE_LARGURA = 168;
export const TORRE_ALTURA = 232;

/** As lajes, de baixo para cima: [largura, altura, folga acima]. */
const LAJES = [
  { w: 1.0, h: 26 },
  { w: 0.88, h: 24 },
  { w: 0.76, h: 22 },
  { w: 0.64, h: 20 },
  { w: 0.5, h: 18 },
  { w: 0.34, h: 16 },
] as const;

export function MarcaFabrica({
  pulsando = false,
  className,
}: {
  /** No `loading` a torre respira, para dizer "estou trabalhando" sem girar nada. */
  pulsando?: boolean;
  className?: string;
}) {
  const gap = 8;
  const alturaTotal = LAJES.reduce((s, l) => s + l.h + gap, -gap);
  let y = alturaTotal;

  return (
    <svg
      width={TORRE_LARGURA}
      height={TORRE_ALTURA}
      viewBox={`0 0 ${TORRE_LARGURA} ${TORRE_ALTURA}`}
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="tf-laje" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c04e" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f5c04e" stopOpacity="0.42" />
        </linearGradient>
        <filter id="tf-brilho" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        transform={`translate(${TORRE_LARGURA / 2}, ${(TORRE_ALTURA - alturaTotal) / 2})`}
        filter="url(#tf-brilho)"
        style={
          pulsando
            ? { animation: "tf-respira 2600ms cubic-bezier(0.45,0,0.55,1) infinite", transformOrigin: "center" }
            : undefined
        }
      >
        {LAJES.map((l, i) => {
          const w = l.w * (TORRE_LARGURA - 24);
          y -= l.h;
          const topo = y;
          y -= gap;
          return (
            <g key={i}>
              <rect
                x={-w / 2}
                y={topo}
                width={w}
                height={l.h}
                rx={4}
                fill="url(#tf-laje)"
                opacity={0.14 + i * 0.05}
              />
              <rect
                x={-w / 2}
                y={topo}
                width={w}
                height={l.h}
                rx={4}
                fill="none"
                stroke="#f5c04e"
                strokeOpacity={0.7}
                /* ⚠️ 1px com o filtro de brilho por cima some no tamanho
                   nativo (168px) e a laje lê como contorno partido — logo a
                   borda que a peça inteira usa como "chapa pegando luz".
                   `non-scaling-stroke` mantém a espessura quando a animação
                   escala a torre. */
                strokeWidth={1.6}
                vectorEffect="non-scaling-stroke"
              />
              {/* A ranhura da laje: é ela que dá leitura de máquina, não de caixa. */}
              <line
                x1={-w / 2 + 8}
                y1={topo + l.h / 2}
                x2={w / 2 - 8}
                y2={topo + l.h / 2}
                stroke="#f5c04e"
                strokeOpacity={0.28}
                strokeWidth={1}
                strokeDasharray="3 5"
              />
            </g>
          );
        })}
      </g>

      <style>{`
        @keyframes tf-respira {
          0%, 100% { transform: scale(1);     opacity: 1; }
          50%      { transform: scale(1.035); opacity: .86; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="tf-respira"] { animation: none !important; }
        }
      `}</style>
    </svg>
  );
}
