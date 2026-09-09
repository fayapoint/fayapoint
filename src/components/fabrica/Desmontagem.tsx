"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MarcaFabrica, TORRE_ALTURA, TORRE_LARGURA } from "./MarcaFabrica";
import "./desmontagem.css";

/**
 * A DESMONTAGEM — o banner se abre, vira torre, e entrega a torre para a página.
 *
 * ## As quatro fases
 *
 *   1. ACORDA     as juntas acendem, o módulo descola da página
 *   2. DESMONTA   os 24 painéis se soltam em 3D e revelam o interior
 *   3. REORGANIZA os painéis convergem e se empilham em seis lajes
 *   4. TRAVA      a luz varre de baixo para cima e a torre fica
 *
 * ## Por que ela pode durar 8 segundos
 *
 * Porque ela não está fazendo o leitor esperar: **a página carrega por baixo
 * dela.** O clique dispara a navegação no mesmo quadro em que a cortina sobe.
 * Quando a animação acaba, a rota já está pronta na maioria das conexões — e o
 * que se vê é continuidade, não carregamento.
 *
 * Quem já viu recebe a versão de 2 segundos (`localStorage`), porque
 * espetáculo repetido vira pedágio.
 *
 * ## A regra que não se quebra
 *
 * O último quadro daqui é o primeiro quadro de `/fabrica/loading.tsx`: a mesma
 * `<MarcaFabrica>`, centrada, na mesma escala. Sem isso a troca de rota pisca,
 * e o piscar apaga os 8 segundos inteiros.
 */

const COLUNAS = 6;
const LINHAS = 4;
const LAJES = 6;

/** A chave que lembra quem já assistiu. */
export const CHAVE_VISTA = "fabrica:desmontagem-vista";

export type Origem = { x: number; y: number; largura: number; altura: number };

const facil = {
  saida: "cubic-bezier(0.22, 1, 0.36, 1)",
  entrada: "cubic-bezier(0.55, 0, 0.1, 1)",
  mola: "cubic-bezier(0.34, 1.3, 0.64, 1)",
};

export function Desmontagem({
  origem,
  duracao,
  children,
  onFim,
}: {
  /** Onde o banner está na tela, para a animação começar exatamente ali. */
  origem: Origem;
  /** 8000 na primeira vez, 2000 em quem já viu. */
  duracao: number;
  /** A cópia do banner — vira a "pele" dos painéis. */
  children: ReactNode;
  onFim: () => void;
}) {
  const palco = useRef<HTMLDivElement>(null);
  const corpo = useRef<HTMLDivElement>(null);
  const marca = useRef<HTMLDivElement>(null);
  const varredura = useRef<HTMLDivElement>(null);
  const interior = useRef<HTMLDivElement>(null);
  const [saindo, setSaindo] = useState(false);
  const acabou = useRef(false);

  /** Encerra uma vez só, venha do fim natural ou do botão de pular. */
  const encerrar = () => {
    if (acabou.current) return;
    acabou.current = true;
    setSaindo(true);
    // 340ms é a duração de `dm-sair` no CSS. O palco some POR CIMA do loading,
    // que já desenhou a mesma torre — por isso ninguém vê a troca.
    window.setTimeout(onFim, 340);
  };

  useLayoutEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) {
      // Sem movimento: a cortina fica 400ms com a marca e sai.
      const t = window.setTimeout(encerrar, 400);
      return () => window.clearTimeout(t);
    }

    const pecas = Array.from(corpo.current?.querySelectorAll<HTMLElement>(".dm-peca") ?? []);
    if (!pecas.length) { encerrar(); return; }

    // A escala do tempo: 1 na versão longa, 0,25 na curta. Todas as fases
    // encolhem juntas para o ritmo continuar sendo o mesmo ritmo.
    const e = duracao / 8000;
    const T = (ms: number) => Math.max(1, ms * e);

    const { largura: W, altura: H } = origem;
    const larguraPeca = W / COLUNAS;
    const alturaPeca = H / LINHAS;
    const animacoes: Animation[] = [];

    // ── Fase 1 · ACORDA ────────────────────────────────────────────────────
    // O corpo inteiro sobe e cresce um fio. É o "ligar", e ele precisa de
    // tempo: sem esta pausa a fase 2 lê como explosão, não como máquina.
    animacoes.push(
      corpo.current!.animate(
        [
          { transform: "translateZ(0) scale(1)" },
          { transform: "translateZ(60px) scale(1.02)", offset: 0.7 },
          { transform: "translateZ(40px) scale(1.015)" },
        ],
        { duration: T(1200), easing: facil.saida, fill: "forwards" },
      ),
    );
    // O interior tem UMA animação para a vida inteira: entra quando o painel
    // abre e sai quando a torre tranca. Antes eram duas coisas — uma animação
    // para entrar e uma classe de CSS para sair — e a saída não pegava: o
    // maquinário ficava aceso atrás da torre montada, no quadro que o
    // `loading` ia repetir. Um efeito com dois donos não tem dono.
    animacoes.push(
      interior.current!.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: T(300) / duracao },
          { opacity: 1, offset: T(1200) / duracao },
          { opacity: 1, offset: T(6100) / duracao },
          { opacity: 0, offset: T(7100) / duracao },
          { opacity: 0, offset: 1 },
        ],
        { duration: duracao, easing: facil.saida, fill: "forwards" },
      ),
    );

    // ── Fases 2 e 3 · DESMONTA e REORGANIZA ────────────────────────────────
    pecas.forEach((peca, i) => {
      const col = i % COLUNAS;
      const lin = Math.floor(i / COLUNAS);

      // O vetor de saída: do centro do módulo para fora. Painel de canto voa
      // mais longe que painel do meio — é o que dá leitura de peça solta.
      const dx = (col - (COLUNAS - 1) / 2) / ((COLUNAS - 1) / 2);
      const dy = (lin - (LINHAS - 1) / 2) / ((LINHAS - 1) / 2);
      const dist = Math.hypot(dx, dy) || 0.001;
      // ⚠️ O voo é CURTO de propósito. Com 190+150 as peças saíam da moldura e
      // o meio da animação virava tela preta por dois segundos — o pior lugar
      // possível para um vazio, porque é exatamente onde a pessoa decide se
      // aquilo vale a espera. Perto, elas continuam legíveis girando, e o
      // interior aceso segura o centro.
      const voo = 115 + dist * 85;
      const giroX = (dy * 62 + (i % 3) * 9) * (i % 2 ? 1 : -1);
      const giroY = (dx * 68 + (i % 4) * 7) * (i % 2 ? -1 : 1);

      // O destino: seis lajes empilhadas, quatro painéis por laje. É aqui que
      // 24 painéis viram a torre que o loading vai repetir.
      const laje = Math.floor(i / (pecas.length / LAJES));
      const posNaLaje = i % (pecas.length / LAJES);
      const largLaje = TORRE_LARGURA - 24;
      const fator = [1, 0.88, 0.76, 0.64, 0.5, 0.34][LAJES - 1 - laje];
      const larguraAlvo = (largLaje * fator) / (pecas.length / LAJES);
      const alturaAlvo = 26 - laje * 2;

      const alvoX =
        -W / 2 + (posNaLaje + 0.5) * larguraAlvo + (largLaje * fator) / -2 + W / 2 - col * larguraPeca - larguraPeca / 2 + W / 2;
      const alvoY = TORRE_ALTURA / 2 - (LAJES - laje) * 34 - lin * alturaPeca - alturaPeca / 2 + H / 2;

      animacoes.push(
        peca.animate(
          [
            // repouso
            { transform: "translate3d(0,0,0) rotateX(0) rotateY(0) scale(1)", opacity: 1, offset: 0 },
            // acorda: a junta abre
            { transform: "translate3d(0,0,6px) scale(.985)", opacity: 1, offset: T(1200) / duracao },
            // desmonta: sai voando, girando
            {
              transform: `translate3d(${dx * voo}px, ${dy * voo * 0.7 - 40}px, ${120 + dist * 90}px) rotateX(${giroX}deg) rotateY(${giroY}deg) scale(.92)`,
              opacity: 1,
              offset: T(3400) / duracao,
            },
            // reorganiza: converge para a laje, endireitando
            {
              transform: `translate3d(${alvoX - W / 2}px, ${alvoY - H / 2}px, 0) rotateX(0) rotateY(0) scale(${larguraAlvo / larguraPeca}, ${alturaAlvo / alturaPeca})`,
              opacity: 1,
              offset: T(6000) / duracao,
            },
            // trava: entrega o lugar para a torre de verdade
            {
              transform: `translate3d(${alvoX - W / 2}px, ${alvoY - H / 2}px, 0) rotateX(0) rotateY(0) scale(${larguraAlvo / larguraPeca}, ${alturaAlvo / alturaPeca})`,
              opacity: 0,
              offset: T(7000) / duracao,
            },
            { transform: `translate3d(${alvoX - W / 2}px, ${alvoY - H / 2}px, 0)`, opacity: 0, offset: 1 },
          ],
          {
            duration: duracao,
            easing: facil.saida,
            fill: "forwards",
            // O atraso escalonado é o que faz 24 painéis parecerem um mecanismo
            // e não 24 objetos independentes.
            delay: T(dist * 90),
          },
        ),
      );
    });

    // ── Fase 4 · TRAVA ─────────────────────────────────────────────────────
    animacoes.push(
      varredura.current!.animate(
        [
          { transform: `translateY(${TORRE_ALTURA}px)`, opacity: 0 },
          { opacity: 0.9, offset: 0.25 },
          { opacity: 0.9, offset: 0.75 },
          { transform: `translateY(${-TORRE_ALTURA}px)`, opacity: 0 },
        ],
        { duration: T(1400), delay: T(6100), easing: facil.entrada, fill: "forwards" },
      ),
    );
    animacoes.push(
      marca.current!.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(.9)" },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        ],
        { duration: T(900), delay: T(6300), easing: facil.mola, fill: "forwards" },
      ),
    );

    const fim = window.setTimeout(encerrar, duracao + T(200));
    return () => {
      window.clearTimeout(fim);
      for (const a of animacoes) a.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma vez: a coreografia é imutável depois de montada
  }, []);

  // Trava a rolagem enquanto o palco está no ar, e devolve ao sair.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = antes; };
  }, []);

  const pecas = Array.from({ length: COLUNAS * LINHAS }, (_, i) => {
    const col = i % COLUNAS;
    const lin = Math.floor(i / COLUNAS);
    const w = origem.largura / COLUNAS;
    const h = origem.altura / LINHAS;
    return { i, left: col * w, top: lin * h, w, h };
  });

  return (
    <div
      ref={palco}
      className="dm-palco"
      data-saindo={saindo ? "1" : "0"}
      role="presentation"
      aria-hidden
    >
      <div
        ref={corpo}
        className="dm-corpo"
        style={{ width: origem.largura, height: origem.altura }}
      >
        {/* O interior: os trilhos que só existem porque o painel saiu da frente. */}
        <div ref={interior} className="dm-interior">
          {Array.from({ length: 7 }, (_, k) => (
            <div
              key={k}
              className="dm-trilho"
              style={{
                left: "4%",
                width: "92%",
                top: `${8 + k * 13}%`,
                opacity: 0.3 + (k % 3) * 0.2,
              }}
            />
          ))}
          {Array.from({ length: 14 }, (_, k) => (
            <div
              key={k}
              className="dm-no"
              style={{ left: `${6 + ((k * 37) % 88)}%`, top: `${10 + ((k * 23) % 78)}%` }}
            />
          ))}
        </div>

        {pecas.map((p) => (
          <div
            key={p.i}
            className="dm-peca"
            style={{ left: p.left, top: p.top, width: p.w, height: p.h }}
          >
            {/* A pele deslocada: cada painel mostra o seu pedaço do banner. */}
            <div
              className="dm-pele"
              style={{
                width: origem.largura,
                height: origem.altura,
                transform: `translate(${-p.left}px, ${-p.top}px)`,
              }}
            >
              {children}
            </div>
          </div>
        ))}
      </div>

      {/* A torre de verdade, que o loading repete quadro a quadro. */}
      <div ref={marca} className="dm-marca">
        <MarcaFabrica />
        <p
          style={{
            marginTop: 18,
            fontSize: 11,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(245,192,78,.75)",
          }}
        >
          Fábrica Autônoma
        </p>
      </div>

      <div
        ref={varredura}
        className="dm-varredura"
        style={{ top: `calc(50% - 45px)` }}
      />

      <button type="button" className="dm-pular" onClick={encerrar}>
        pular
      </button>
    </div>
  );
}
