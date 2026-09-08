"use client";

import { useCallback, useEffect, useState } from "react";

interface Caso {
  id: string; estado: "aguardando-defesa" | "em-revisao" | "decidida"; motivo: string; evidencia: string; cautelar: boolean; abertaEm: string;
  defesa: { texto: string; quando: string } | null;
  decisao: { resultado: "arquivar" | "advertir" | "suspender"; motivo: string; quando: string } | null;
}
interface Dados { casos: Caso[]; versao: number; federacao: boolean; dono: boolean }
const campo = "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-300";
const botao = "rounded-xl bg-lime-300 px-4 py-3 font-semibold text-black disabled:opacity-30";

export function ApuracoesClube({ clubId, plataforma, podeAbrir, onMudou }: { clubId: string; plataforma: string; podeAbrir: boolean; onMudou?: () => void }) {
  const [dados, setDados] = useState<Dados | null>(null); const [erro, setErro] = useState(""); const [aviso, setAviso] = useState(""); const [ocupado, setOcupado] = useState(false);
  const [motivo, setMotivo] = useState(""); const [evidencia, setEvidencia] = useState(""); const [cautelar, setCautelar] = useState(false);
  const endpoint = `/api/game/gestao/${encodeURIComponent(clubId)}/apuracoes`;
  const carregar = useCallback(async () => {
    setErro("");
    try { const r = await fetch(`${endpoint}?plataforma=${plataforma}`, { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Não foi possível carregar as apurações."); setDados(d); }
    catch (e) { setErro(e instanceof Error ? e.message : "Falha de conexão."); }
  }, [endpoint, plataforma]);
  useEffect(() => { void carregar(); }, [carregar]);
  async function agir(body: Record<string, unknown>) {
    if (!dados) return;
    setOcupado(true); setErro(""); setAviso("");
    try {
      const r = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, plataforma, versao: dados.versao }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Não foi possível registrar a ação.");
      setDados(d); setAviso("Registro salvo. O histórico foi atualizado."); setMotivo(""); setEvidencia(""); setCautelar(false); onMudou?.();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha de conexão."); } finally { setOcupado(false); }
  }
  return <section className="space-y-4 rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-semibold">Apurações e direito de defesa</h2><button type="button" disabled={ocupado} onClick={() => void carregar()} className="text-sm text-lime-300 underline">Atualizar apurações</button></div><p className="text-sm text-white/60">A evidência é revisada por uma pessoa. Uma sanção definitiva exige defesa registrada. Suspensão cautelar é temporária enquanto o caso é apurado.</p>{erro && <p role="alert" className="text-rose-200">{erro}</p>}{aviso && <p role="status" className="text-lime-200">{aviso}</p>}{!dados && !erro && <p role="status">Carregando apurações…</p>}{dados?.casos.length === 0 && <p className="text-sm text-white/50">Nenhuma apuração registrada para este clube.</p>}{dados?.casos.slice().reverse().map(c => <CasoApuracao key={`${c.id}:${c.estado}`} caso={c} dono={dados.dono} federacao={dados.federacao && !dados.dono} ocupado={ocupado} onAgir={agir} />)}
    {dados?.federacao && !dados.dono && podeAbrir && !dados.casos.some(c => c.estado !== "decidida") && <form className="space-y-4 border-t border-white/10 pt-5" onSubmit={e => { e.preventDefault(); void agir({ acao: "abrir", motivo, evidencia, cautelar }); }}><h3 className="font-semibold">Abrir apuração</h3><label className="block space-y-2"><span>O que precisa ser apurado?</span><textarea required minLength={10} maxLength={2000} className={campo} value={motivo} onChange={e => setMotivo(e.target.value)} /></label><label className="block space-y-2"><span>Evidências e partidas relacionadas</span><textarea required minLength={10} maxLength={2000} className={campo} value={evidencia} onChange={e => setEvidencia(e.target.value)} placeholder="Identifique as partidas e descreva o que foi observado. Não inclua dados pessoais." /></label><label className="flex items-start gap-3 text-sm text-white/70"><input type="checkbox" checked={cautelar} onChange={e => setCautelar(e.target.checked)} className="mt-1" /><span>Suspender a gestão cautelarmente enquanto se apura. Explique a necessidade na fundamentação acima.</span></label><button className={botao} disabled={ocupado || motivo.trim().length < 10 || evidencia.trim().length < 10}>Registrar apuração</button></form>}
  </section>;
}

function CasoApuracao({ caso, dono, federacao, ocupado, onAgir }: { caso: Caso; dono: boolean; federacao: boolean; ocupado: boolean; onAgir: (body: Record<string, unknown>) => Promise<void> }) {
  const [texto, setTexto] = useState(""); const [resultado, setResultado] = useState("arquivar");
  const nomes = { "aguardando-defesa": "Aguardando defesa", "em-revisao": "Defesa recebida · em revisão", decidida: "Decisão registrada" };
  return <article className="space-y-3 rounded-xl border border-white/10 p-4"><header className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-lime-200">{nomes[caso.estado]}</h3><span className="text-xs text-white/50">{new Date(caso.abertaEm).toLocaleString("pt-BR")}</span></header>{caso.cautelar && caso.estado !== "decidida" && <p className="text-sm text-amber-200">Suspensão cautelar em vigor durante a apuração.</p>}<p className="whitespace-pre-wrap">{caso.motivo}</p><div className="rounded-lg bg-black/20 p-3"><h4 className="text-xs uppercase tracking-wide text-white/40">Evidências apresentadas</h4><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{caso.evidencia}</p></div>{caso.defesa && <div><h4 className="font-medium">Defesa do responsável</h4><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{caso.defesa.texto}</p></div>}{caso.decisao && <div className="border-t border-white/10 pt-3"><h4 className="font-semibold">{caso.decisao.resultado === "arquivar" ? "Arquivada" : caso.decisao.resultado === "advertir" ? "Advertência" : "Gestão suspensa"}</h4><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{caso.decisao.motivo}</p></div>}
    {dono && caso.estado === "aguardando-defesa" && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void onAgir({ acao: "defesa", id: caso.id, texto }); }}><label className="block space-y-2"><span>Sua defesa</span><textarea className={campo} required minLength={10} maxLength={2000} rows={4} value={texto} onChange={e => setTexto(e.target.value)} /></label><p className="text-xs text-white/50">Revise antes de enviar. Esta manifestação fica preservada no caso.</p><button className={botao} disabled={ocupado || texto.trim().length < 10}>Enviar defesa</button></form>}
    {federacao && caso.estado !== "decidida" && <form className="space-y-3 border-t border-white/10 pt-3" onSubmit={e => { e.preventDefault(); void onAgir({ acao: "decidir", id: caso.id, resultado, motivo: texto }); }}><label className="block space-y-2"><span>Decisão humana</span><select className={campo} value={resultado} onChange={e => setResultado(e.target.value)}><option value="arquivar">Arquivar sem sanção</option><option value="advertir" disabled={!caso.defesa}>Aplicar advertência</option><option value="suspender" disabled={!caso.defesa}>Suspender a gestão</option></select></label>{!caso.defesa && <p className="text-xs text-white/50">Advertência e suspensão definitiva aguardam a defesa.</p>}<label className="block space-y-2"><span>Fundamentação após revisar as evidências</span><textarea className={campo} required minLength={10} maxLength={2000} value={texto} onChange={e => setTexto(e.target.value)} /></label><button className={botao} disabled={ocupado || texto.trim().length < 10}>Registrar decisão</button></form>}
  </article>;
}
