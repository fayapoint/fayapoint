"use client";

import { useEffect, useState } from "react";

import { LetreiroFayai, SimboloFayai } from "@/components/marca/MarcaFayai";
import { LoaderFayai, SeloCarregando } from "@/components/marca/LoaderFayai";
import { AZUL, AZUL_CLARO, AZUL_FUNDO, BRANCO_DA_MARCA, NAVY, OURO } from "@/components/marca/cores";

/**
 * A bancada: o logo em todos os estados, parado, para conferir com o olho.
 *
 * ⚠️ Todo loader aqui roda com `registrar={false}`. Sem isso a bancada
 * manteria o contador de carga sempre aberto e o favicon animaria para sempre
 * enquanto a página estivesse na aba — que é exatamente o comportamento que o
 * `estado-de-carga.ts` existe para evitar.
 */

function Bloco({
  titulo,
  nota,
  children,
  fundo = "escuro",
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
  fundo?: "escuro" | "claro" | "cor";
}) {
  const fundos = {
    escuro: { background: NAVY },
    claro: { background: "#ffffff" },
    cor: { background: `linear-gradient(135deg, ${AZUL_FUNDO}, #6d28d9)` },
  } as const;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/45">
        {titulo}
      </h2>
      {nota && <p className="mt-1 text-xs leading-snug text-white/35">{nota}</p>}
      <div
        className="mt-4 grid place-items-center gap-8 rounded-xl px-6 py-10"
        style={fundos[fundo]}
      >
        {children}
      </div>
    </section>
  );
}

export function BancadaDaMarca() {
  const [progresso, setProgresso] = useState(0);
  const [correndo, setCorrendo] = useState(true);

  // Um progresso de mentira, só para ver o modo determinado se mexer.
  useEffect(() => {
    if (!correndo) return;
    const t = window.setInterval(() => {
      setProgresso((p) => (p >= 1 ? 0 : Math.min(1, p + 0.04)));
    }, 120);
    return () => window.clearInterval(t);
  }, [correndo]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-24 pt-28">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/35">
        Bancada interna
      </p>
      <h1 className="mt-2 text-3xl font-black text-white">A marca</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
        Os contornos saem da Inter Bold por <code className="text-white/60">scripts/logo-svg.py</code>.
        O mesmo <code className="text-white/60">d</code> serve ao letreiro, ao símbolo, ao
        carregamento, ao favicon e à extrusão 3D — por isso nenhum deles pode divergir dos outros.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Bloco titulo="Letreiro" nota="O logo oficial. Fundo escuro é a casa.">
          <LetreiroFayai style={{ fontSize: 64 }} />
          <LetreiroFayai style={{ fontSize: 28 }} />
          <LetreiroFayai style={{ fontSize: 14 }} />
        </Bloco>

        <Bloco titulo="Uma cor só" nota="Fundo colorido e fundo claro/impresso." fundo="cor">
          <LetreiroFayai style={{ fontSize: 48 }} variante="branco" />
        </Bloco>

        <Bloco titulo="Tinta" nota="Fatura, contrato, papel." fundo="claro">
          <LetreiroFayai style={{ fontSize: 48 }} variante="tinta" />
        </Bloco>

        <Bloco titulo="Símbolo" nota="As iniciais. É o que vira favicon e ícone de aplicativo.">
          <div className="flex items-end gap-6">
            <SimboloFayai style={{ fontSize: 96 }} />
            <SimboloFayai style={{ fontSize: 48 }} />
            <SimboloFayai style={{ fontSize: 32 }} />
            <SimboloFayai style={{ fontSize: 16 }} />
          </div>
        </Bloco>

        <Bloco titulo="Carregando — sem progresso" nota="O laço: enche, respira, esvazia.">
          <LoaderFayai style={{ fontSize: 56 }} registrar={false} />
          <SeloCarregando style={{ fontSize: 56 }} registrar={false} />
        </Bloco>

        <Bloco
          titulo="Carregando — com progresso"
          nota={`O nível segue o número. Agora em ${Math.round(progresso * 100)}%.`}
        >
          <LoaderFayai style={{ fontSize: 56 }} progresso={progresso} registrar={false} />
          <SeloCarregando style={{ fontSize: 56 }} progresso={progresso} registrar={false} />
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(progresso * 100)}
              onChange={(e) => {
                setCorrendo(false);
                setProgresso(Number(e.target.value) / 100);
              }}
              className="w-48 accent-sky-400"
            />
            <button
              type="button"
              onClick={() => setCorrendo((c) => !c)}
              className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white/60 hover:bg-white/5"
            >
              {correndo ? "parar" : "correr"}
            </button>
          </div>
        </Bloco>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/45">
          Cores
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            ["Branco da marca", BRANCO_DA_MARCA],
            ["Azul claro", AZUL_CLARO],
            ["Azul", AZUL],
            ["Azul fundo", AZUL_FUNDO],
            ["Navy", NAVY],
            ["Ouro (recompensa)", OURO],
          ].map(([nome, cor]) => (
            <div key={cor} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
              <span className="h-6 w-6 rounded-md border border-white/20" style={{ background: cor }} />
              <span className="text-xs text-white/60">
                {nome} <span className="text-white/35">{cor}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/35">
          O ouro não saiu do site: ele continua sendo o acento de recompensa (XP, certificado,
          CTA de curso). O que virou azul foi o <strong className="text-white/50">logo</strong>.
        </p>
      </section>
    </main>
  );
}
