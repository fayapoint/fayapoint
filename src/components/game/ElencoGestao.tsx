"use client";

import { useEffect, useState } from "react";
import type { painelElenco } from "@/lib/game/integridade-servidor";

type Dados = Awaited<ReturnType<typeof painelElenco>>;
export function ElencoGestao({ clubId, plataforma }: { clubId: string; plataforma: string }) {
  const [dados, setDados] = useState<Dados | null>(null); const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setDados(null); setErro("");
    void fetch(`/api/game/gestao/${encodeURIComponent(clubId)}/elenco?plataforma=${encodeURIComponent(plataforma)}`, { cache: "no-store", signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Não foi possível carregar o elenco."); return d; })
      .then(setDados).catch(e => { if (!controller.signal.aborted) setErro(e.message || "Falha de conexão."); });
    return () => controller.abort();
  }, [clubId, plataforma, tentativa]);
  return <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Seu elenco, na amostra capturada</h2><button type="button" className="text-sm text-lime-300 underline" onClick={() => setTentativa(tentativa + 1)}>Atualizar</button></div>{erro ? <p role="alert" className="mt-4 text-rose-200">{erro}</p> : !dados ? <p role="status" className="mt-4 text-white/60">Consultando o espelho…</p> : <>
    <p className="mt-3 text-sm text-white/50">{dados.fonte} · {dados.capturadoEm ? `Capturado em ${new Date(dados.capturadoEm).toLocaleString("pt-BR")}` : "Data de captura não disponível"}</p>
    <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Partidas na amostra", dados.partidasCapturadas], ["Com elenco conhecido", dados.partidasComElenco], ["Com sinal de W.O.", dados.partidasComSinal], ["Sem duração", dados.partidasSemDuracao]].map(([rotulo, valor]) => <div key={rotulo} className="rounded-xl bg-black/25 p-4"><p className="text-2xl font-semibold text-lime-300">{valor}</p><p className="mt-1 text-xs text-white/60">{rotulo}</p></div>)}</div>
    <p className="mb-5 max-w-3xl text-sm text-white/60">Últimas {dados.limiteAmostra} partidas disponíveis, no máximo. Presença indica aparições nessa amostra, não frequência na temporada. Partidas com sinal de W.O. ou sem duração ficam fora da soma de gols. Tempo parado não comprova abandono.</p>
    {dados.jogadores.length === 0 ? <p className="rounded-xl border border-white/10 p-4 text-white/60">O espelho ainda não tem elenco ou partidas suficientes para este clube.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Presença e estatísticas dos jogadores na amostra de partidas</caption><thead className="border-b border-white/20 text-xs text-white/50"><tr>{["Jogador", "Presença na amostra", "Gols válidos", "Tempo parado", "Partidas com sinal"].map(h => <th key={h} scope="col" className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{dados.jogadores.map(j => <tr key={j.nome.toLowerCase()} className="border-b border-white/5"><th scope="row" className="px-3 py-4 font-medium"><span className="block">{j.nome}</span><span className="mt-1 block text-xs font-normal text-white/40">{j.atual ? j.posicao ?? "No elenco capturado" : "Visto nas partidas"}</span></th><td className="px-3 py-4">{j.presencas} / {dados.partidasComElenco}</td><td className="px-3 py-4">{j.gols ?? "Não medido"}<span className="block text-xs text-white/40">{j.amostrasGols} partidas medidas</span></td><td className="px-3 py-4">{j.segundosParado === null ? "Não medido" : `${j.segundosParado} s`}<span className="block text-xs text-white/40">{j.amostrasIdle} partidas medidas</span></td><td className="px-3 py-4">{j.partidasComSinal}<span className="block text-xs text-white/40">Sem atribuição de culpa</span></td></tr>)}</tbody></table></div>}
  </>}</section>;
}
