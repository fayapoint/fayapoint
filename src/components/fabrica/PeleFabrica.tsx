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
 * Ele recebe `aceso` para o invólucro poder acender a peça no hover sem
 * precisar de JavaScript dentro da pele.
 *
 * ## O desenho de 15/09/2026
 *
 * O Ricardo achou o banner "muito feio": era um cartão de texto em ouro, com
 * grade, números e horários brigando no mesmo tamanho. Agora ele fala a língua
 * da página que vende, aprovada por ele no mesmo dia: a foto do estúdio montado
 * à direita, o título em Plus Jakarta e o azul da fábrica. O ouro saiu — nesta
 * casa ele premia aluno (IDENTIDADE_VISUAL §2), e a fábrica não é recompensa.
 *
 * A foto é um `<img>` comum, e isso é de propósito: clonar um `<img>` copia a
 * imagem (clonar `<canvas>` ou `<video>` não copia), então na desmontagem cada
 * painel leva o seu pedaço da foto — o estúdio literalmente se parte em peças.
 */

import { INVENTARIO, GRADE_DO_DIA } from "@/lib/fabrica";

const AZUL = "#3aa8ff";
const SUAVE = "cubic-bezier(0.22,1,0.36,1)";
const jakarta = { fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" } as const;
const mono = { fontFamily: "var(--font-dm-mono, ui-monospace), monospace" } as const;

export function PeleFabrica({ aceso = false }: { aceso?: boolean }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-3xl"
      style={{
        background: "#060911",
        boxShadow: aceso
          ? "inset 0 0 0 1px rgba(58,168,255,.45), 0 30px 80px -40px rgba(58,168,255,.55)"
          : "inset 0 0 0 1px rgba(255,255,255,.10), 0 24px 60px -34px rgba(0,0,0,.9)",
        transition: `box-shadow 380ms ${SUAVE}`,
      }}
    >
      {/* A foto. No desktop ocupa a direita e se dissolve no fundo para o título
          ter chão escuro; no celular fica em cima e se dissolve para baixo. */}
      <div
        aria-hidden
        className="relative h-44 [mask-image:linear-gradient(180deg,#000_55%,transparent)] sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[64%] sm:[mask-image:linear-gradient(90deg,transparent,#000_40%)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- arte local estática, e precisa ser clonável */}
        <img
          src="/fabrica/banner-estudio.webp"
          alt=""
          width={1400}
          height={615}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "50% 45%",
            filter: aceso ? "brightness(1.06) saturate(1.06)" : "brightness(.84) saturate(.94)",
            transform: aceso ? "scale(1.035)" : "scale(1)",
            transition: `filter 500ms ${SUAVE}, transform 900ms ${SUAVE}`,
          }}
        />
      </div>

      {/* As juntas: a grade que a desmontagem vai seguir. Acesas no hover, elas
          prometem o que o clique cumpre — é a única "instrução de uso" da peça. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(58,168,255,.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(58,168,255,.55) 1px, transparent 1px)",
          backgroundSize: "calc(100%/6) calc(100%/4)",
          opacity: aceso ? 0.32 : 0.05,
          transition: `opacity 420ms ${SUAVE}`,
        }}
      />

      <div className="relative flex h-full flex-col justify-between gap-5 p-5 sm:max-w-[58%] sm:p-8 lg:p-10">
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em]" style={{ ...mono, color: AZUL }}>
            Fábrica Autônoma · para empresas
          </p>
          <h2
            className="mt-3 text-[30px] sm:text-[40px] lg:text-[46px] font-bold leading-[1.02] tracking-[-0.04em] text-white"
            style={jakarta}
          >
            A fábrica que
            <br />
            trabalha <span style={{ color: AZUL }}>sem você.</span>
          </h2>
          {/* ⚠️ A LINHA QUE DIZ O QUE É.
              Sem ela, um estranho lê "a fábrica que trabalha sem você" e não sabe
              se isto automatiza venda, e-mail ou uma fábrica de verdade. Três
              segundos é todo o tempo que este banner tem. */}
          <p className="mt-3 max-w-[30rem] text-[13.5px] sm:text-[15px] leading-relaxed" style={{ color: "rgba(226,234,245,.72)" }}>
            Uma pasta vira um estúdio que escreve, desenha, narra e publica todo dia — com a identidade da sua empresa.
          </p>
        </div>

        {/* A grade do dia: o argumento inteiro em três horários, vindos de `GRADE_DO_DIA`. */}
        <ul className="flex flex-wrap gap-2">
          {GRADE_DO_DIA.filter((g) => g.curta).map((g) => (
            <li
              key={g.hora}
              className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[11.5px] sm:text-[12.5px]"
              style={{ background: "rgba(8,12,22,.62)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.8)" }}
            >
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] tabular-nums"
                style={{ ...mono, color: AZUL, background: "rgba(58,168,255,.13)" }}
              >
                {g.hora}
              </span>
              {g.curta}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] sm:text-sm font-semibold"
            style={{
              ...jakarta,
              background: aceso ? AZUL : "rgba(58,168,255,.14)",
              color: aceso ? "#03101d" : "#d4ebff",
              border: "1px solid rgba(58,168,255,.5)",
              transition: `background 380ms ${SUAVE}, color 380ms`,
            }}
          >
            Conhecer a fábrica
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {/* ⚠️ Os números saem de `INVENTARIO`, nunca digitados: um "12" cravado
              aqui já divergiu da página ao lado uma vez. */}
          <span className="text-[10.5px] uppercase tracking-[0.18em]" style={{ ...mono, color: "rgba(255,255,255,.42)" }}>
            {INVENTARIO.blueprints} blueprints · {INVENTARIO.armadilhas} armadilhas · {INVENTARIO.portoes} portões
          </span>
        </div>
      </div>
    </div>
  );
}
