"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowDown, Film, Clapperboard, Layers, CalendarRange } from "lucide-react";

import type { Ato, Trabalho } from "@/dados/casos";
import { Estacao } from "./Estacao";
import { ReguaDoTempo } from "./ReguaDoTempo";
import { TrilhaDaGaleria } from "./TrilhaDaGaleria";
import { useGaleria, useRolagemDaGaleria } from "./estado";
import css from "./galeria.module.css";

/**
 * A galeria inteira.
 *
 * A cena WebGL entra por `dynamic(..., { ssr:false })` de propósito: ela é o
 * ÚNICO pedaço pesado da página, e quem chega por busca precisa do texto antes
 * do 3D. Sem `ssr:false` o `three` iria para o bundle do servidor e o primeiro
 * byte demoraria por causa de um enfeite.
 */
const CenaDaGaleria = dynamic(
  () => import("./CenaDaGaleria").then((m) => m.CenaDaGaleria),
  { ssr: false, loading: () => null }
);

function Numero({
  valor,
  rotulo,
  Icone,
}: {
  valor: string;
  rotulo: string;
  Icone: typeof Film;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <Icone className="mb-3 h-5 w-5 text-amber-300/80" aria-hidden="true" />
      <p className="text-3xl font-bold tabular-nums sm:text-4xl">{valor}</p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{rotulo}</p>
    </div>
  );
}

function Abertura({ totalVideos, nTrabalhos }: { totalVideos: number; nTrabalhos: number }) {
  return (
    <header className="relative flex min-h-[100svh] items-center px-4 pt-24">
      <div className="mx-auto w-full max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-amber-200"
        >
          <Film className="h-3.5 w-3.5" aria-hidden="true" />
          Portfólio · 1992 — 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-balance text-5xl font-bold leading-[0.95] sm:text-7xl lg:text-8xl"
        >
          Trinta e quatro anos
          <span className="block text-amber-300">numa tira de filme só.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18 }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          De um 386 no interior paulista a uma ilha de edição da Fox com mais de 20 milhões
          de espectadores por dia — e daí para a inteligência artificial. Tudo que está aqui
          aconteceu, e cada peça diz de onde a informação saiu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#ato-1"
            className="group inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-[#1c1814] transition hover:bg-amber-200"
          >
            Começar o passeio
            <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" aria-hidden="true" />
          </a>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
          >
            Falar comigo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.38 }}
          className="mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Numero valor={String(nTrabalhos)} rotulo="Trabalhos" Icone={Layers} />
          <Numero valor="360" rotulo="Peças no acervo" Icone={Clapperboard} />
          <Numero valor={String(totalVideos)} rotulo="Vídeos que tocam aqui" Icone={Film} />
          <Numero valor="34" rotulo="Anos de corte" Icone={CalendarRange} />
        </motion.div>
      </div>
    </header>
  );
}

/**
 * O roteiro — o índice de tudo que vem pela frente.
 *
 * ── Por que ele existe ─────────────────────────────────────────────────────
 *
 * A galeria tem 32 estações: 44 telas de rolagem no desktop e **76 no
 * celular** (medido). Sem um índice, quem chega procurando "ele já fez
 * drone?" tem de rolar às cegas ou descobrir a moviola lá embaixo. Aqui a
 * carreira inteira cabe numa tela, agrupada por ato, e cada linha é uma
 * âncora — o que também dá ao Google 32 links internos com texto de verdade.
 */
function Roteiro({ atos, trabalhos }: { atos: Ato[]; trabalhos: Trabalho[] }) {
  return (
    <section className="relative px-4 py-16" aria-labelledby="roteiro-titulo">
      <div className="mx-auto max-w-6xl">
        <h2
          id="roteiro-titulo"
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80"
        >
          O roteiro
        </h2>
        <p className="mb-8 max-w-xl text-sm text-muted-foreground">
          Trinta e dois trabalhos em seis atos. Clique em qualquer um para ir direto —
          ou use a moviola no rodapé.
        </p>
        {/* colunas de TEXTO, não grade: com grade, o Ato III (12 trabalhos)
            estica a linha inteira e abre um buraco de meia tela embaixo */}
        <div className="gap-x-8 sm:columns-2 lg:columns-3">
          {atos.map((a) => {
            const doAto = trabalhos.filter((t) => t.ato === a.ato);
            if (!doAto.length) return null;
            return (
              <div key={a.ato} className="mb-7 break-inside-avoid">
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  {a.numero} · {a.titulo} · {a.periodo}
                </p>
                <ul className="space-y-1">
                  {doAto.map((t) => (
                    <li key={t.slug}>
                      <a
                        href={`#${t.slug}`}
                        className="group flex items-baseline gap-2 rounded py-0.5 text-sm text-white/70 transition hover:text-white"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition group-hover:scale-150"
                          style={{ background: t.cor }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{t.titulo}</span>
                        <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-white/30">
                          {t.inicio.slice(0, 4)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PortalDoAto({ a, quantos }: { a: Ato; quantos: number }) {
  return (
    <section
      id={`ato-${a.ato}`}
      className="relative flex min-h-[62svh] scroll-mt-20 items-center px-4 py-20"
      aria-label={`Ato ${a.numero} — ${a.titulo}`}
    >
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10"
        >
          <span className={`${css.numeroAto} text-[7rem] font-black sm:text-[11rem]`}>
            {a.numero}
          </span>
          <div className="pb-2">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-300/80">
              {a.periodo} · {quantos} {quantos === 1 ? "trabalho" : "trabalhos"}
            </p>
            <h2 className="mt-2 text-4xl font-bold sm:text-6xl">{a.titulo}</h2>
            <p className="mt-4 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
              {a.linha}
            </p>
            <div className={`${css.risco} mt-6 w-40 text-amber-300/60`} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Fecho() {
  return (
    <section className="relative px-4 py-28">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-balance text-4xl font-bold leading-tight sm:text-5xl"
        >
          A ferramenta muda.
          <span className="block text-amber-300">A curiosidade é a mesma.</span>
        </motion.h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Em 1992 era um 386 renderizando um dragão a noite inteira para vender RPG. Em 2013,
          um drone que não tinha sensor nenhum. Hoje é inteligência artificial. O ofício, esse,
          não mudou: <strong className="text-foreground">entender a ferramenta antes de todo mundo e usá-la para explicar melhor.</strong>
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-7 py-3.5 text-sm font-semibold text-[#1c1814] transition hover:bg-amber-200"
          >
            Chamar para um projeto
          </Link>
          <Link
            href="/cursos"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:text-white"
          >
            Ver os cursos
          </Link>
        </div>
      </div>
    </section>
  );
}

export function GaleriaCasos({
  atos,
  trabalhos,
  totalVideos,
}: {
  atos: Ato[];
  trabalhos: Trabalho[];
  totalVideos: number;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  useRolagemDaGaleria(raiz);
  const { ato } = useGaleria();

  return (
    /*
     * ⚠️ `isolate` não é enfeite. A cena WebGL é um filho `fixed -z-10` e, sem
     * um contexto de empilhamento AQUI, z-index negativo pinta atrás do
     * contexto ancestral mais próximo — que é o `<body>`, e o body tem fundo
     * OPACO. Resultado sem `isolate`: o canvas existe, desenha, e some por
     * baixo do fundo do site. Custou uma rodada de depuração.
     */
    <div ref={raiz} className="relative isolate bg-[#08070d] text-white">
      <CenaDaGaleria ato={ato} />

      <main className="relative z-10 pb-40">
        <Abertura totalVideos={totalVideos} nTrabalhos={trabalhos.length} />
        <Roteiro atos={atos} trabalhos={trabalhos} />

        {atos.map((a) => {
          const doAto = trabalhos.filter((t) => t.ato === a.ato);
          return (
            <div key={a.ato}>
              <PortalDoAto a={a} quantos={doAto.length} />
              {doAto.map((t, i) => (
                <Estacao key={t.slug} t={t} indice={i} />
              ))}
            </div>
          );
        })}

        <Fecho />
      </main>

      <ReguaDoTempo atos={atos} trabalhos={trabalhos} />
      <TrilhaDaGaleria atos={atos} />
    </div>
  );
}
