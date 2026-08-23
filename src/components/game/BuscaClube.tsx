"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Search, Shield, ChevronRight, Loader2 } from "lucide-react";
import type { GameCopy } from "@/lib/game/copy";
import { LIMA, superficie, FUNDO } from "@/lib/game/tema";

interface ClubResult {
  clubId: string;
  name: string;
  regionId: number | null;
}

/**
 * Busca de clube ao vivo contra /api/game/ea/busca — a demonstração de que a
 * integração existe: o visitante digita o nome do clube dele no Clubs e cai na
 * central com elenco e partidas reais, sem login e sem senha.
 */
export function BuscaClube({ copy }: { copy: GameCopy }) {
  const [nome, setNome] = useState("");
  const [resultados, setResultados] = useState<ClubResult[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    const termo = nome.trim();
    if (termo.length < 2 || buscando) return;
    setBuscando(true);
    try {
      const res = await fetch(`/api/game/ea/busca?nome=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setResultados(Array.isArray(data.clubs) ? data.clubs : []);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div id="buscar" className="scroll-mt-28">
      <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={copy.search.placeholder}
            className="w-full rounded-xl border border-white/12 bg-white/[0.06] py-4 pl-12 pr-4 text-white outline-none transition-colors placeholder:text-white/45 focus:border-[color:var(--lima)] focus:bg-white/[0.08]"
            style={{ ["--lima" as string]: `${LIMA}99` }}
            maxLength={60}
          />
        </div>
        <button
          type="submit"
          disabled={buscando || nome.trim().length < 2}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
          style={{ background: LIMA, color: FUNDO }}
        >
          {buscando && <Loader2 size={16} className="animate-spin" />}
          {buscando ? copy.search.searching : copy.search.button}
        </button>
      </form>

      {resultados !== null && (
        <div className="mt-4 space-y-2">
          {resultados.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-sm text-white/55">
              {copy.search.empty}
            </p>
          )}
          {resultados.map((c) => (
            <Link
              key={c.clubId}
              href={`/game/clube/${c.clubId}`}
              className="group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-transform hover:-translate-y-0.5"
              style={superficie(LIMA)}
            >
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${LIMA}1a`, border: `1px solid ${LIMA}3a` }}
              >
                <Shield className="h-5 w-5" style={{ color: LIMA }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{c.name}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                  ID {c.clubId}
                  {c.regionId ? ` · ${copy.search.membersLabel} ${c.regionId}` : ""}
                </p>
              </div>
              <span className="hidden text-xs font-bold sm:inline" style={{ color: LIMA }}>
                {copy.search.open}
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5"
                style={{ color: LIMA }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
