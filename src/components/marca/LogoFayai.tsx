"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/**
 * O logo que vira 3D quando você chega perto — e que se mostra sozinho de vez
 * em quando, para quem nunca passa o cursor.
 *
 * A primeira leitura é o logo de sempre: texto real, instantâneo, indexável,
 * acessível. O 3D é recompensa, não estado padrão — o canvas WebGL só existe
 * enquanto a peça está em cena e some depois. O header aparece em toda página;
 * isso importa.
 *
 * **A saída é tão animada quanto a entrada.** A primeira versão desmontava o
 * canvas no `mouseleave` e o 3D sumia de uma vez, quase sempre girado para um
 * lado — o corte pulava. Agora existe um estado de saída: o volume volta ao
 * neutro, desvanece, e só então o canvas é descartado. O 2D reaparece no mesmo
 * ritmo, então a troca acontece sem salto.
 */

const LogoFayai3D = dynamic(
  () => import("@/components/marca/LogoFayai3D").then((m) => ({ default: m.LogoFayai3D })),
  { ssr: false }
);

/** Quanto dura o recolhimento antes de descartar o canvas. */
const MS_SAIDA = 460;
/**
 * A demonstração é irregular de propósito.
 *
 * Um intervalo fixo vira relógio: em duas voltas o olho já sabe quando vem, e
 * o que era surpresa vira ruído previsível. Sorteando a espera, a duração e o
 * ponto de partida do giro, cada aparição é diferente da anterior — parece um
 * objeto vivo em cima da mesa, não uma animação em laço.
 */
const PRIMEIRA_ESPERA_MS = 10_000;
const ESPERA_MIN_MS = 10_000;
const ESPERA_MAX_MS = 20_000;
const DEMO_MIN_MS = 5_000;
const DEMO_MAX_MS = 9_000;

const entre = (min: number, max: number) => min + Math.random() * (max - min);

type Fase = "plano" | "3d" | "recolhendo";

export function LogoFayai({ texto = "FayAi", className = "" }: { texto?: string; className?: string }) {
  const [fase, setFase] = useState<Fase>("plano");
  const [demo, setDemo] = useState(false);
  /** Desloca o ponto de partida do giro a cada aparição. */
  const [semente, setSemente] = useState(0);
  const caixa = useRef<HTMLSpanElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const relogios = useRef<{ saida?: number; proxima?: number; volta?: number }>({});
  const temCursor = useRef(false);

  const limpar = (...quais: Array<keyof typeof relogios.current>) => {
    for (const k of quais) {
      if (relogios.current[k]) window.clearTimeout(relogios.current[k]);
      relogios.current[k] = undefined;
    }
  };

  useEffect(() => () => limpar("saida", "proxima", "volta"), []);

  const recolher = useCallback(() => {
    limpar("saida");
    setFase("recolhendo");
    relogios.current.saida = window.setTimeout(() => setFase("plano"), MS_SAIDA);
  }, []);

  /**
   * A demonstração automática. Só roda quando o logo está na tela, sem cursor
   * em cima e sem `prefers-reduced-motion` — mostrar o que foi construído não
   * pode virar movimento que incomoda quem só quer ler a página.
   */
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let naTela = true;
    const io = new IntersectionObserver(([e]) => (naTela = e.isIntersecting), { threshold: 0.6 });
    io.observe(el);

    // `setTimeout` encadeado em vez de `setInterval`: só assim cada espera
    // pode ter uma duração própria.
    const agendar = (espera: number) => {
      relogios.current.proxima = window.setTimeout(() => {
        if (naTela && !temCursor.current && !document.hidden) {
          setSemente(Math.random() * 100);
          setDemo(true);
          setFase("3d");
          limpar("volta");
          relogios.current.volta = window.setTimeout(() => {
            setDemo(false);
            if (!temCursor.current) recolher();
          }, entre(DEMO_MIN_MS, DEMO_MAX_MS));
        }
        agendar(entre(ESPERA_MIN_MS, ESPERA_MAX_MS));
      }, espera);
    };
    agendar(PRIMEIRA_ESPERA_MS);

    return () => {
      io.disconnect();
      limpar("proxima", "volta");
    };
  }, [recolher]);

  const seguir = (e: React.MouseEvent) => {
    const el = caixa.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mouse.current = {
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    };
  };

  const montado = fase !== "plano";
  // Durante a demonstração o logo se apresenta sozinho, girando devagar; no
  // hover, quem manda é o cursor.
  const emDemonstracao = demo && !temCursor.current;

  return (
    <span
      ref={caixa}
      className={`relative inline-block align-middle ${className}`}
      onMouseEnter={() => {
        temCursor.current = true;
        limpar("saida", "volta");
        setDemo(false);
        setFase("3d");
      }}
      onMouseMove={seguir}
      onMouseLeave={() => {
        temCursor.current = false;
        mouse.current = { x: 0, y: 0 };
        recolher();
      }}
    >
      {/* O logo de sempre. Continua no DOM quando o 3D entra — some da vista,
          mas segue sendo o texto que o leitor de tela e o buscador leem. */}
      <span
        className="transition-opacity"
        style={{
          opacity: fase === "3d" ? 0 : 1,
          transitionDuration: fase === "3d" ? "180ms" : `${MS_SAIDA}ms`,
        }}
      >
        {texto}
      </span>

      {/* Folga para o volume girar sem ser recortado. `pointer-events-none` e
          fundo transparente: não atrapalha nada em volta. */}
      {montado && (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block pointer-events-none"
          style={{ width: "190%", height: "260%" }}
        >
          <LogoFayai3D
            recolhendo={fase === "recolhendo"}
            demonstrando={emDemonstracao}
            semente={semente}
            mouse={mouse}
          />
        </span>
      )}
    </span>
  );
}
