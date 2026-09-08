"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

interface Dados {
  nome: string; slug: string; oficialCapturadaEm: string | null; consultadoEm: string; fontesOficiais: string[];
  conferencia: Array<{ time: string; veredito: string; oficial?: { jogos?: number; pontos?: number }; ea?: { jogos: number; series: number }; nota?: string }>;
  times: Array<{ nome: string; vinculo: string; evidencia: string[] }>;
  cobertura: { partidas: number; series: number; janelaHoras: number }; aviso: string;
}

export function AuditoriaCopa({ locale }: { locale: string }) {
  const [dados, setDados] = useState<Dados | null>(null); const [erro, setErro] = useState(""); const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setDados(null); setErro("");
    void fetch("/api/game/federacao/copa/super-copa-dos-streamers", { cache: "no-store", signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Não foi possível consultar a Copa."); return d; })
      .then(setDados).catch(e => { if (!controller.signal.aborted) setErro(e.message || "Falha de conexão."); });
    return () => controller.abort();
  }, [tentativa]);
  return <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6"><header className="flex flex-wrap justify-between gap-3"><div><p className="mb-2 text-xs uppercase tracking-widest text-lime-300">Organização e EA, lado a lado</p><h2 className="text-2xl font-semibold">Auditoria da Copa</h2></div><button type="button" className="text-sm text-lime-300 underline" onClick={() => setTentativa(tentativa + 1)}>Atualizar conferência</button></header>{erro ? <p role="alert" className="text-rose-200">{erro}</p> : !dados ? <p role="status" className="text-white/60">Consultando a conferência…</p> : <>
    <p className="text-lg font-medium">{dados.nome}</p><p className="text-sm text-white/60">{dados.aviso}</p><div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100/80">{dados.cobertura.partidas} partidas capturadas · {dados.cobertura.series} agrupamentos com janela de {dados.cobertura.janelaHoras} h. A janela da EA pode omitir jogos antigos.</div>
    <p className="text-xs text-white/50">Tabela declarada: {dados.oficialCapturadaEm ? `capturada em ${new Date(dados.oficialCapturadaEm).toLocaleString("pt-BR")}` : "data de captura não informada"}. Consulta deste painel: {new Date(dados.consultadoEm).toLocaleString("pt-BR")}.</p>
    {dados.conferencia.length === 0 ? <p className="text-white/60">Ainda não há linhas para comparar.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Contagens declaradas e observadas, com limites de comparação</caption><thead className="border-b border-white/20 text-xs text-white/50"><tr>{["Time", "Confrontos declarados", "Agrupamentos EA", "Partidas EA", "Revisão"].map(h => <th key={h} scope="col" className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{dados.conferencia.map(l => <tr key={l.time} className="border-b border-white/5"><th scope="row" className="p-3 font-medium">{l.time}</th><td className="p-3">{l.oficial?.jogos ?? "Não informado"}</td><td className="p-3">{l.ea?.series ?? "Não observado"}</td><td className="p-3">{l.ea?.jogos ?? "Não observado"}</td><td className="max-w-sm p-3"><span className={l.veredito === "diverge" ? "text-amber-200" : "text-white/70"}>{l.veredito === "diverge" ? "Contagens diferentes" : l.veredito === "so-oficial" ? "Somente declaração" : l.veredito === "so-ea" ? "Somente observação EA" : l.veredito === "confere" && typeof l.oficial?.jogos === "number" && l.oficial.jogos > 0 ? "Conferência disponível" : "Sem base comparável"}</span>{l.nota && <p className="mt-2 text-xs text-white/50">{l.nota}</p>}</td></tr>)}</tbody></table></div>}
    <details className="border-t border-white/10 pt-4"><summary className="cursor-pointer text-sm text-lime-300">Vínculos usados na conferência</summary><ul className="mt-4 space-y-3">{dados.times.map(t => <li key={t.nome} className="text-sm"><p className="font-medium">{t.nome} · {t.vinculo === "confirmado" ? "Vínculo confirmado" : t.vinculo === "provavel" ? "Vínculo provável" : "Clube ainda não encontrado"}</p>{t.evidencia.map((e, i) => <p key={i} className="mt-1 text-xs text-white/50">{e}</p>)}</li>)}</ul></details>
    <Link href={`/game/copa/${dados.slug}`} locale={locale} className="inline-block text-sm text-lime-300 underline">Abrir a página pública da Copa</Link>
  </>}</section>;
}
