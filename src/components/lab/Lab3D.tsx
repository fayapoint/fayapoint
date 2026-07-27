"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MousePointer2 } from "lucide-react";
import { LogoFayai } from "@/components/marca/LogoFayai";
import { ORDEM, RECEITAS, VARIANTE_ATUAL } from "@/components/marca/logo3d-variantes";
import dynamic from "next/dynamic";

// Os ícones só existem no cliente (WebGL) e pesam — não entram no bundle
// de quem abre a página só para ver o logo.
const IconesLab = dynamic(() => import("@/components/lab/IconesLab").then((m) => m.IconesLab), {
  ssr: false,
  loading: () => <p className="text-sm text-white/35">carregando as peças…</p>,
});

/**
 * A bancada de escolha — não é página de produto.
 *
 * Existe para o Ricardo comparar as opções lado a lado no mesmo fundo, com o
 * mesmo tamanho e o mesmo gesto. Comparar por print não funciona aqui: as três
 * leituras se diferenciam pela forma como a luz corre quando a peça gira, e
 * isso só existe em movimento.
 */

const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const CUSTO_COR: Record<string, string> = {
  baixo: "#a3e635",
  médio: "#f5c04e",
  alto: "#f472b6",
};

export function Lab3D() {
  const [fundoClaro, setFundoClaro] = useState(false);

  return (
    <div
      // pt-24: o cabeçalho do site é fixo e comia o título com py-10.
      className="min-h-dvh px-4 sm:px-8 pt-24 pb-10"
      style={{ background: fundoClaro ? "#f0ece3" : "#0c0e1d", color: fundoClaro ? "#0d0d14" : "#f3f1ff" }}
    >
      <div className="max-w-6xl mx-auto">
        <header>
          <h1 className="text-4xl sm:text-5xl tracking-wide" style={bebas}>
            BANCADA <span style={{ color: GOLD }}>3D</span>
          </h1>
          <p className="mt-1 text-sm max-w-2xl" style={{ opacity: 0.6 }}>
            As opções lado a lado, no mesmo tamanho e no mesmo fundo. Passe o cursor em cada uma —
            é girando que elas se diferenciam. Nenhuma está no site ainda, exceto a marcada como
            atual.
          </p>
        </header>

        {/* O vidro é a única que depende do fundo para existir; sem esse
            controle, escolher entre as três seria escolher no escuro. */}
        <button
          onClick={() => setFundoClaro((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
          style={{
            border: `1px solid ${fundoClaro ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.2)"}`,
            opacity: 0.75,
          }}
        >
          fundo {fundoClaro ? "claro" : "escuro"} — trocar
        </button>

        <section className="mt-6">
          <h2 className="text-xl tracking-wide mb-3" style={bebas}>
            LOGO — 3 OPÇÕES
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {ORDEM.map((id) => {
              const r = RECEITAS[id];
              const atual = id === VARIANTE_ATUAL;
              return (
                <div
                  key={id}
                  className="rounded-3xl p-4 flex flex-col"
                  style={{
                    border: `1px solid ${atual ? `${GOLD}66` : fundoClaro ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.12)"}`,
                    background: fundoClaro ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.03)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg tracking-wide" style={bebas}>
                      {r.nome}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {atual && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                          style={{ background: `${GOLD}22`, color: GOLD }}
                        >
                          no ar hoje
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                        style={{ background: `${CUSTO_COR[r.custo]}22`, color: CUSTO_COR[r.custo] }}
                        title="Custo de GPU — importa para decidir se a técnica se espalha pelo site"
                      >
                        GPU {r.custo}
                      </span>
                    </span>
                  </div>

                  <div
                    className="mt-3 grid place-items-center rounded-2xl py-10"
                    style={{ background: fundoClaro ? "rgba(0,0,0,.04)" : "rgba(0,0,0,.35)" }}
                  >
                    <span className="text-5xl tracking-wide select-none" style={bebas}>
                      <LogoFayai texto="FAYAI" variante={id} />
                    </span>
                  </div>

                  <p className="mt-3 text-[12px] leading-relaxed flex-1" style={{ opacity: 0.62 }}>
                    {r.tese}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] flex items-center gap-1.5" style={{ opacity: 0.4 }}>
            <MousePointer2 size={12} /> Sem cursor em cima, cada uma se demonstra sozinha em
            intervalos irregulares — é o comportamento real do header, não uma prévia.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl tracking-wide mb-3" style={bebas}>
            ÍCONES DO DASHBOARD — FAMÍLIA ESCOLHIDA
          </h2>
          <IconesLab />
        </section>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-[12px] font-bold transition-opacity hover:opacity-100"
          style={{ opacity: 0.45 }}
        >
          voltar para a home <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
