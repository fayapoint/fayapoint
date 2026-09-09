/**
 * A PELE — o desenho do banner, e só ele.
 *
 * ⚠️ Este componente é clonado **24 vezes** pela desmontagem, uma por painel,
 * cada cópia recortada no seu pedaço. Por isso ele obedece a três regras:
 *
 *   1. **Nada de `position: fixed`** — dentro de um painel recortado ele
 *      escaparia do recorte e apareceria inteiro em cada peça.
 *   2. **Nada de animação infinita aqui dentro** — 24 cópias começando o mesmo
 *      laço em momentos diferentes viram 24 relógios fora de sincronia, e o
 *      banner se parte em pedaços que piscam cada um para o seu lado. O
 *      movimento ambiente mora no invólucro, que NÃO é clonado.
 *   3. **Nada de `<canvas>` nem `<video>`** — clonar não copia o conteúdo
 *      desenhado, e as peças sairiam vazias.
 *
 * Ele recebe `estado` para o invólucro poder acender as juntas no hover sem
 * precisar de JavaScript dentro da pele.
 */

import { INVENTARIO } from "@/lib/fabrica";

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;

/** A grade de um dia real — o que a máquina faz sozinha, em três linhas. */
const GRADE = [
  { hora: "10:30", oque: "escreve, desenha e narra as peças" },
  { hora: "12:00", oque: "publica o carrossel" },
  { hora: "19:00", oque: "publica o reel, com a sua voz" },
];

export function PeleFabrica({ aceso = false }: { aceso?: boolean }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-3xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(245,192,78,.09) 0%, rgba(8,10,18,.97) 38%, rgba(8,10,18,.97) 66%, rgba(245,192,78,.07) 100%)",
        boxShadow: aceso
          ? "inset 0 0 0 1px rgba(245,192,78,.40), 0 30px 80px -40px rgba(245,192,78,.55)"
          : "inset 0 0 0 1px rgba(245,192,78,.18), 0 24px 60px -34px rgba(0,0,0,.9)",
        transition: "box-shadow 380ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* As juntas: a grade que a desmontagem vai seguir. Acesas no hover, elas
          prometem o que o clique cumpre — é a única "instrução de uso" que a
          peça tem, e ela não usa palavra nenhuma. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(245,192,78,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(245,192,78,.5) 1px, transparent 1px)",
          backgroundSize: "calc(100%/6) calc(100%/4)",
          opacity: aceso ? 0.5 : 0.13,
          transition: "opacity 420ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      <div className="relative h-full flex flex-col justify-between gap-4 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.34em]"
              style={{ color: "rgba(245,192,78,.8)" }}
            >
              Uma pasta · um comando
            </p>
            <h2
              className="mt-2 text-3xl sm:text-5xl leading-[0.95] tracking-wide text-white"
              style={bebas}
            >
              A fábrica que
              <br />
              <span style={{ color: "#f5c04e" }}>trabalha sem você</span>
            </h2>
          </div>

          {/* O selo de contagem: números medidos, nunca redondos de propósito. */}
          <div
            className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-right"
            style={{ color: "rgba(255,255,255,.55)" }}
          >
            <Numero valor={INVENTARIO.blueprints} rotulo="blueprints" />
            <Numero valor={INVENTARIO.armadilhas} rotulo="armadilhas" />
            <Numero valor={INVENTARIO.portoes} rotulo="portões" />
          </div>
        </div>

        {/* A grade do dia: o argumento inteiro em três linhas de horário. */}
        <ul className="flex flex-col gap-1.5">
          {GRADE.map((g) => (
            <li key={g.hora} className="flex items-center gap-3 text-[12px] sm:text-[13px]">
              <span
                className="tabular-nums shrink-0 rounded-md px-1.5 py-0.5 text-[11px]"
                style={{
                  color: "#f5c04e",
                  background: "rgba(245,192,78,.10)",
                  border: "1px solid rgba(245,192,78,.22)",
                }}
              >
                {g.hora}
              </span>
              <span style={{ color: "rgba(255,255,255,.72)" }}>{g.oque}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between gap-4">
          <p className="text-[12px] sm:text-[13px] leading-snug" style={{ color: "rgba(255,255,255,.5)" }}>
            Você responde 12 grupos de perguntas.
            <br className="hidden sm:block" /> O agente constrói o resto.
          </p>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] sm:text-sm font-bold shrink-0"
            style={{
              background: aceso ? "#f5c04e" : "rgba(245,192,78,.14)",
              color: aceso ? "#241a05" : "#f5c04e",
              border: "1px solid rgba(245,192,78,.45)",
              transition: "background 380ms cubic-bezier(0.22,1,0.36,1), color 380ms",
            }}
          >
            abrir a fábrica
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <b className="text-xl sm:text-2xl tabular-nums" style={{ ...bebas, color: "#f5c04e" }}>
        {valor}
      </b>
      <span className="text-[10px] uppercase tracking-[0.16em]">{rotulo}</span>
    </span>
  );
}
