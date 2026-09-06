"use client";

import { useState } from "react";

/**
 * A PLACA DOS CEM LUGARES — o herói da página de fundadores.
 *
 * Dez por dez, ouro = ocupado, contorno = livre. A escassez do programa é o
 * argumento inteiro, e um número escrito ("restam 88") é uma afirmação; cem
 * quadradinhos são uma demonstração — dá para contar com o olho, e o vazio
 * ocupa espaço na tela do jeito que o vazio ocupa espaço na vida real.
 *
 * ⚠️ `ocupados` vem do servidor, do `contarVagas()`, que lê o banco. Nunca
 * cravar um número aqui: esta casa já publicou painel anunciando MRR que não
 * existia, e num contador de escassez isso deixa de ser enfeite quebrado e vira
 * propaganda enganosa.
 */
export function PlacaDosCem({ ocupados, total }: { ocupados: number; total: number }) {
  const [dica, setDica] = useState<string | null>(null);
  const padrao = "Passe o cursor para ver cada lugar.";

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Os cem lugares
        </p>
        <p className="font-mono text-[13px] tabular-nums text-muted-foreground">
          <span className="text-amber-400">{ocupados}</span> ocupados ·{" "}
          <span>{total - ocupados}</span> livres
        </p>
      </div>

      <div
        className="grid grid-cols-10 gap-1.5"
        role="img"
        aria-label={`Mapa de ${total} lugares: ${ocupados} ocupados, ${total - ocupados} livres`}
        onMouseLeave={() => setDica(null)}
      >
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const ocupado = n <= ocupados;
          const rotulo = String(n).padStart(3, "0");
          return (
            <button
              key={n}
              type="button"
              aria-label={`Lugar ${rotulo}, ${ocupado ? "ocupado" : "livre"}`}
              onMouseEnter={() =>
                setDica(
                  ocupado
                    ? `Fundador #${rotulo} — lugar ocupado.`
                    : `#${rotulo} — livre. Pode ser o seu.`,
                )
              }
              onFocus={() =>
                setDica(ocupado ? `Fundador #${rotulo} — ocupado.` : `#${rotulo} — livre.`)
              }
              className={[
                "aspect-square rounded-[3px] border transition-colors",
                ocupado
                  ? "border-amber-300 bg-gradient-to-br from-amber-400 to-amber-600"
                  : "border-border hover:border-primary",
              ].join(" ")}
            />
          );
        })}
      </div>

      <p className="mt-3.5 min-h-[1.4em] font-mono text-xs text-muted-foreground">
        {dica ?? padrao}
      </p>

      <div className="mt-4 flex gap-5 border-t border-border pt-4 font-mono text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <i className="h-[11px] w-[11px] rounded-[2px] border border-amber-300 bg-gradient-to-br from-amber-400 to-amber-600" />
          ocupado
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-[11px] w-[11px] rounded-[2px] border border-border" />
          livre
        </span>
      </div>
    </div>
  );
}
