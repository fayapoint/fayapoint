"use client";

import { useState } from "react";
import PersonaDossie from "@/components/portal/PersonaDossie";
import type { Dossie } from "@/lib/persona";

/**
 * O invólucro da bancada. Reproduz a única coisa do portal que muda como o
 * dossiê se comporta: ele mora numa coluna lateral estreita e grudenta. Sem
 * isso o teste do botão "ampliar" não valeria nada — é justamente de dentro
 * dessa coluna que a placa não tem para onde crescer.
 */
export default function BancadaDossie({ dossie: inicial }: { dossie: Dossie }) {
  const [dossie, setDossie] = useState(inicial);

  return (
    <div className="min-h-dvh px-4 pt-24 pb-16" style={{ background: "#171310", color: "#f3f1ff" }}>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-lg font-bold">Bancada do dossiê</h1>
          <p className="mt-2 text-sm text-white/50">
            Esta coluna existe só para ocupar o espaço da esquerda, como no portal. O
            dossiê é o de verdade, na coluna estreita à direita — inclinado em repouso,
            reto e maior quando você clica em ampliar.
          </p>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <PersonaDossie
            dossie={dossie}
            fotos={[]}
            onSalvo={setDossie}
            aoRecarregarFotos={() => {}}
          />
        </aside>
      </div>
    </div>
  );
}
