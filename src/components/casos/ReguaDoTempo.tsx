"use client";
import { useT } from "@/i18n/dicionario";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Ato, Trabalho } from "@/dados/casos";
import { useGaleria } from "./estado";
import css from "./galeria.module.css";

/**
 * A moviola: a linha do tempo da página, que também é a navegação.
 *
 * Cada trabalho é um CLIPE na linha, com largura proporcional à duração real
 * da passagem (sete anos no Jockey ocupam mais faixa que um comercial de 2010).
 * O cabeçote branco é onde a leitura está. Clicar num clipe rola até ele.
 *
 * ── Por que a largura é proporcional ao tempo ──────────────────────────────
 *
 * Porque conta a verdade sem escrever nada: dá para VER que a carreira tem
 * três blocos longos (MultiRio, Jockey, Fox) e uma nuvem de trabalhos curtos
 * em volta. Uma régua de blocos iguais mentiria sobre a forma da vida.
 */

const ANO0 = 1992;
const ANO1 = 2026.7;

function paraAno(iso: string | null, padrao: number) {
  if (!iso) return padrao;
  const [a, m] = iso.split("-");
  return Number(a) + (Number(m || 1) - 1) / 12;
}

export function ReguaDoTempo({ atos, trabalhos }: { atos: Ato[]; trabalhos: Trabalho[] }) {
  const T = useT();
  const { estacao, ato } = useGaleria();
  const [aberta, setAberta] = useState(false);
  const [dica, setDica] = useState<string | null>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);

  const faixa = ANO1 - ANO0;

  /**
   * Os atos NÃO são fatias limpas do tempo: o drone (IV, 2013—2016) acontece
   * dentro da Fox (V, 2014—2018), e o Ato III vai até 2017. Empilhados numa
   * linha só, os rótulos se sobrepõem e viram sopa de letra — foi o que
   * apareceu na primeira renderização ("O AR" em cima de "A REDE GLOBAL").
   *
   * Então: cada rótulo desce uma linha até achar espaço. Ganância simples,
   * três linhas bastam, e a sobreposição vira informação — dá para ver que
   * duas eras correram juntas.
   */
  const faixasDosAtos = (() => {
    const fins: number[] = [];
    return atos
      .map((a) => {
        const doAto = trabalhos.filter((t) => t.ato === a.ato);
        if (!doAto.length) return null;
        const i0 = Math.min(...doAto.map((t) => paraAno(t.inicio, ANO0)));
        const i1 = Math.max(...doAto.map((t) => paraAno(t.fim, paraAno(t.inicio, ANO0) + 0.6)));
        const esq = ((i0 - ANO0) / faixa) * 100;
        const larg = Math.max(9, ((i1 - i0) / faixa) * 100);
        let linha = 0;
        while (fins[linha] !== undefined && esq < fins[linha] + 1) linha += 1;
        fins[linha] = esq + larg;
        return { a, esq, larg, linha };
      })
      .filter((x): x is { a: Ato; esq: number; larg: number; linha: number } => x !== null);
  })();

  const irPara = useCallback((slug: string) => {
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // a posição do cabeçote sai da estação em cena, não da rolagem crua:
  // assim ele para exatamente em cima do clipe que está sendo lido
  const atual = trabalhos.find((t) => t.slug === estacao) ?? trabalhos[0];
  const cabecote = atual
    ? ((paraAno(atual.inicio, ANO0) + paraAno(atual.fim, paraAno(atual.inicio, ANO0) + 0.6)) / 2 - ANO0) / faixa
    : 0;

  useEffect(() => {
    const ao = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && /input|textarea|select/i.test(alvo.tagName)) return;
      const i = trabalhos.findIndex((t) => t.slug === estacao);
      const prox = e.key === "ArrowRight" ? i + 1 : i - 1;
      if (prox >= 0 && prox < trabalhos.length) {
        e.preventDefault();
        irPara(trabalhos[prox].slug);
      }
    };
    window.addEventListener("keydown", ao);
    return () => window.removeEventListener("keydown", ao);
  }, [estacao, trabalhos, irPara]);

  return (
    <nav
      aria-label={T("Linha do tempo dos trabalhos")}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => {
        setAberta(false);
        setDica(null);
      }}
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-white/10",
        "bg-[#08070d]/85 backdrop-blur-xl transition-[height] duration-300",
        aberta ? "h-[104px]" : "h-[62px]",
      ].join(" ")}
    >
      <div className="relative mx-auto h-full max-w-[1600px] px-3 sm:px-6">
        {/* os atos, como faixas nomeadas */}
        <div className="relative h-4 pt-1.5">
          {faixasDosAtos.map(({ a, esq, larg, linha }) => {
            const ativo = a.ato === ato;
            // colapsada, só o ato em cena aparece — senão os rótulos se pisam
            if (!aberta && !ativo) return null;
            return (
              <span
                key={a.ato}
                className="absolute truncate font-mono text-[9px] uppercase tracking-[0.18em] transition-opacity"
                style={{
                  left: `${esq}%`,
                  width: `${Math.max(larg, 9)}%`,
                  top: aberta ? `${linha * 9}px` : 0,
                  color: ativo ? "#fff" : "rgba(255,255,255,0.42)",
                }}
              >
                {a.numero} · {T(a.titulo)}
              </span>
            );
          })}
        </div>

        {/* o trilho com os clipes */}
        <div ref={trilhoRef} className={`${css.regua} relative mt-1 h-8`}>
          {trabalhos.map((t) => {
            const i0 = paraAno(t.inicio, ANO0);
            const i1 = paraAno(t.fim, i0 + 0.6);
            const esq = ((i0 - ANO0) / faixa) * 100;
            const larg = Math.max(0.9, ((i1 - i0) / faixa) * 100);
            const ativo = t.slug === estacao;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => irPara(t.slug)}
                onMouseEnter={() => setDica(t.slug)}
                onFocus={() => setDica(t.slug)}
                aria-label={`${t.titulo} — ${t.rotulo}`}
                aria-current={ativo ? "true" : undefined}
                className={`${css.clipe} absolute top-1 h-6 rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
                style={{
                  left: `${esq}%`,
                  width: `${larg}%`,
                  background: ativo
                    ? `linear-gradient(180deg, ${t.corSec}, ${t.cor})`
                    : `linear-gradient(180deg, ${t.cor}bb, ${t.cor}55)`,
                  opacity: ativo ? 1 : 0.55,
                  boxShadow: ativo ? `0 0 1.2rem ${t.corSec}99` : "none",
                  zIndex: ativo ? 3 : 1,
                }}
              />
            );
          })}

          {/* o cabeçote de leitura */}
          <div
            className={`${css.cabecote} pointer-events-none absolute -top-1 h-10 w-px bg-white transition-[left] duration-500 ease-out`}
            style={{ left: `${Math.min(100, Math.max(0, cabecote * 100))}%` }}
            aria-hidden="true"
          >
            <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rotate-45 bg-white" />
          </div>
        </div>

        {/* a régua de anos */}
        <div className="relative mt-0.5 h-3">
          {[1995, 2000, 2005, 2010, 2015, 2020, 2025].map((a) => (
            <span
              key={a}
              className="absolute top-0 -translate-x-1/2 font-mono text-[9px] tabular-nums text-white/30"
              style={{ left: `${((a - ANO0) / faixa) * 100}%` }}
            >
              {a}
            </span>
          ))}
        </div>

        {/* a dica do clipe sob o cursor */}
        {aberta && dica ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-1 truncate text-center text-[11px] text-white/70 sm:inset-x-6">
            {(() => {
              const t = trabalhos.find((x) => x.slug === dica);
              return t ? (
                <>
                  <span className="font-semibold text-white">{T(t.titulo)}</span>
                  <span className="mx-2 opacity-40">·</span>
                  <span className="font-mono">{T(t.rotulo)}</span>
                  <span className="mx-2 opacity-40">·</span>
                  <span>{t.papel}</span>
                </>
              ) : null;
            })()}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
