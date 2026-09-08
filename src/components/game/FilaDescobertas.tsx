"use client";

import { useEffect, useState } from "react";
import { campoGestao, botaoGestao, painelGestao } from "./GestaoClube";

const estados = { novo: "Novos", investigando: "Em investigação", descartado: "Descartados", promovido: "Com cobertura" };
type Estado = keyof typeof estados;
interface Candidato {
  chave: string; plataforma: string; apelido: string; estado: Estado;
  confrontos: number; series: number; partidas: number; vezesVisto: number;
  forca: number; densidade: number;
  primeiraEm: string | null; ultimaEm: string | null; motivo: string | null; copaSlug: string | null;
  clubes: Array<{ clubId: string; nome: string; jogos: number }>;
}
const data = (valor: string | null) => valor ? new Date(valor).toLocaleString("pt-BR") : "Não informada";

/**
 * FORÇA e DENSIDADE são o que separa torneio de clube-polo — e por isso estão
 * na tela, não só no banco.
 *
 * O descobridor achou uma vez 56 clubes ligados por 8 séries, força 79: parecia
 * o achado do mês. Era um clube só jogando amistoso com muita gente diferente.
 * A densidade (séries por clube) denunciou: 0,14 ali, contra 0,63 na Super Copa.
 * Quem revisa precisa ver esse número, senão promove o clube-polo achando que
 * está promovendo um campeonato.
 */

export function FilaDescobertas() {
  const [estado, setEstado] = useState<Estado>("novo");
  const [dados, setDados] = useState<{ candidatos: Candidato[]; aviso: string } | null>(null);
  const [erro, setErro] = useState(""); const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setDados(null); setErro("");
    void fetch(`/api/game/descobertas?estado=${estado}`, { cache: "no-store", signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Não foi possível consultar as descobertas."); return d; })
      .then(d => { if (!controller.signal.aborted) setDados(d); })
      .catch(e => { if (!controller.signal.aborted) setErro(e instanceof Error ? e.message : "Falha de conexão."); });
    return () => controller.abort();
  }, [estado, tentativa]);
  return <section className={`${painelGestao} space-y-5`}>
    <header><h2 className="text-2xl font-semibold">Campeonatos em descoberta</h2><p className="mt-2 text-sm text-white/60">Grupos de clubes encontrados automaticamente, aguardando revisão humana. Um candidato ainda não é um campeonato confirmado.</p></header>
    <div className="flex flex-wrap items-end gap-3"><label className="space-y-2"><span className="block text-sm">Situação da descoberta</span><select className={campoGestao} value={estado} onChange={e => setEstado(e.target.value as Estado)}>{Object.entries(estados).map(([v, nome]) => <option key={v} value={v}>{nome}</option>)}</select></label><button type="button" className="px-4 py-3 text-lime-300 underline" onClick={() => setTentativa(t => t + 1)}>Atualizar descobertas</button></div>
    {erro ? <p role="alert" className="text-rose-200">{erro}</p> : !dados ? <p role="status">Consultando candidatos…</p> : <>
      <p className="text-sm text-amber-100/80">{dados.aviso}</p>
      <p className="text-xs text-white/50">Até 50 candidatos por consulta. Cada lista de clubes mostra até 24 integrantes observados.</p>
      {dados.candidatos.length === 0 && <p>Nenhum candidato nesta situação.</p>}
      {dados.candidatos.map(c => <RevisaoDescoberta key={`${c.plataforma}:${c.chave}`} candidato={c} onSalvo={() => setTentativa(t => t + 1)} />)}
    </>}
  </section>;
}

function RevisaoDescoberta({ candidato: c, onSalvo }: { candidato: Candidato; onSalvo: () => void }) {
  const [estado, setEstado] = useState<Estado>(c.estado);
  const [motivo, setMotivo] = useState(c.motivo ?? ""); const [slug, setSlug] = useState(c.copaSlug ?? "");
  const [ocupado, setOcupado] = useState(false); const [erro, setErro] = useState("");
  async function salvar() {
    setOcupado(true); setErro("");
    try {
      const r = await fetch("/api/game/descobertas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chave: c.chave, plataforma: c.plataforma, estado, motivo: motivo.trim(), copaSlug: slug.trim() }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Não foi possível registrar a decisão."); onSalvo();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha de conexão."); } finally { setOcupado(false); }
  }
  return <details className="rounded-xl border border-white/15 p-4">
    <summary className="cursor-pointer break-words"><span className="font-semibold">{c.apelido}</span><span className="mt-1 block text-xs text-white/50">Apelido automático · {c.plataforma} · {c.partidas} partidas observadas</span></summary>
    <div className="mt-4 space-y-4">
      <p className="text-sm text-white/70">{c.series} séries agrupadas · {c.confrontos} confrontos · reencontrado em {c.vezesVisto} rodadas da busca.</p>
      <p className="text-sm"><span className="text-white/50">Força </span><strong className="text-lime-300">{c.forca}</strong><span className="text-white/50"> · densidade </span><strong className={c.densidade < 0.3 ? "text-amber-300" : "text-white/85"}>{c.densidade}</strong>{c.densidade < 0.3 && <span className="text-amber-200/80"> — abaixo de 0,3 quase nunca é torneio: costuma ser um clube-polo jogando muito amistoso com gente diferente.</span>}</p>
      <p className="text-xs text-white/50">Primeira observação: {data(c.primeiraEm)}. Última observação: {data(c.ultimaEm)}.</p>
      <ul className="space-y-1 text-sm">{c.clubes.map(clube => <li key={clube.clubId} className="break-words">{clube.nome} · clube {clube.clubId} · {clube.jogos} jogos observados</li>)}</ul>
      {c.motivo && <p className="whitespace-pre-wrap text-sm text-white/70">Último motivo registrado: {c.motivo}</p>}
      <form className="space-y-3 border-t border-white/10 pt-4" onSubmit={e => { e.preventDefault(); void salvar(); }}>
        <label className="block space-y-2"><span>Decisão sobre o candidato</span><select className={campoGestao} value={estado} disabled={ocupado} onChange={e => setEstado(e.target.value as Estado)}>{Object.entries(estados).map(([v, nome]) => <option key={v} value={v}>{nome}</option>)}</select></label>
        <label className="block space-y-2"><span>Motivo {estado === "descartado" ? "(obrigatório)" : "(opcional)"}</span><textarea className={campoGestao} value={motivo} onChange={e => setMotivo(e.target.value)} required={estado === "descartado"} minLength={estado === "descartado" ? 3 : undefined} maxLength={2000} disabled={ocupado} /></label>
        {estado === "promovido" && <label className="block space-y-2"><span>Identificador da Copa já cadastrada</span><input className={campoGestao} value={slug} onChange={e => setSlug(e.target.value)} required maxLength={200} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="super-copa-dos-streamers" disabled={ocupado} /><span className="block text-xs text-white/50">É o trecho final do endereço da Copa. Registrar a decisão não cria uma Copa.</span></label>}
        {erro && <p role="alert" className="text-rose-200">{erro}</p>}
        <button className={botaoGestao} disabled={ocupado || (estado === "descartado" && motivo.trim().length < 3) || (estado === "promovido" && !slug.trim())}>{ocupado ? "Registrando…" : "Registrar decisão"}</button>
      </form>
    </div>
  </details>;
}
