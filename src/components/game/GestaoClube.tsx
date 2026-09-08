"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ApuracoesClube } from "./ApuracoesClube";
import { ElencoGestao } from "./ElencoGestao";
import { Shield, Users, ArrowLeft, Loader2 } from "lucide-react";
import type { perfilParaTela } from "@/lib/game/gestao-servidor";

export type PerfilGestaoTela = Awaited<ReturnType<typeof perfilParaTela>>;
export const campoGestao = "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-300";
export const botaoGestao = "rounded-xl bg-lime-300 px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lime-200";
export const painelGestao = "rounded-2xl border border-white/10 bg-white/[0.035] p-6";
const estados = { pendente: "Aguardando revisão", aprovado: "Gestão aprovada", recusado: "Solicitação recusada", suspenso: "Gestão suspensa" };

export function GestaoClube({ clubId, locale, plataforma }: { clubId: string; locale: string; plataforma: string }) {
  const [perfil, setPerfil] = useState<PerfilGestaoTela | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [login, setLogin] = useState(false);
  const [federacao, setFederacao] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [membros, setMembros] = useState<PerfilGestaoTela["membros"]>([]);
  const endpoint = `/api/game/gestao/${encodeURIComponent(clubId)}`;
  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const resposta = await fetch(`${endpoint}?plataforma=${encodeURIComponent(plataforma)}`, { cache: "no-store" });
      const dados = await resposta.json();
      setLogin(resposta.status === 401);
      if (!resposta.ok) throw new Error(dados.error || "Não foi possível carregar a gestão.");
      setPerfil(dados.perfil); setFederacao(dados.federacao);
      setDescricao(dados.perfil?.descricao ?? ""); setMembros(dados.perfil?.membros ?? []);
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setCarregando(false); }
  }, [endpoint, plataforma]);
  useEffect(() => { void carregar(); }, [carregar]);

  async function salvar(body: Record<string, unknown>, method: "POST" | "PATCH") {
    setOcupado(true); setErro(""); setAviso("");
    try {
      const resposta = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, plataforma }) });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.error || "Não foi possível salvar.");
      setPerfil(dados.perfil); setDescricao(dados.perfil.descricao); setMembros(dados.perfil.membros);
      setAviso(method === "POST" ? "Solicitação enviada. A federação revisará a evidência antes de aprovar." : "Alteração salva.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setOcupado(false); }
  }

  return <main className="min-h-screen bg-[#090e11] px-5 pb-12 pt-28 text-white"><div className="mx-auto max-w-5xl space-y-8">
    <Link href={`/game/clube/${clubId}?p=${plataforma}`} locale={locale} className="inline-flex items-center gap-2 text-sm text-white/60"><ArrowLeft size={16} /> Central do clube</Link>
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.3em] text-lime-300">Winners 22 · Gestão do clube</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{perfil?.nome ?? `Clube ${clubId}`}</h1><p className="mt-3 text-white/60">Organize os responsáveis e acompanhe a situação do seu clube.</p></div>{perfil && <span className="rounded-full border border-lime-300/30 px-4 py-2 text-sm text-lime-200">{estados[perfil.estado]}</span>}</header>
    {carregando && <p role="status" className="flex items-center gap-3"><Loader2 className="animate-spin" size={18} /> Carregando gestão…</p>}
    {erro && <div role="alert" className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-4">{erro} <button type="button" onClick={() => void carregar()} disabled={carregando || ocupado} className="ml-3 underline">Atualizar</button></div>}
    {aviso && <p role="status" className="rounded-xl bg-lime-300/10 p-4 text-lime-200">{aviso}</p>}
    {login && <section className={painelGestao}><h2 className="text-xl font-semibold">Entre para gerenciar seu clube</h2><p className="my-4 text-white/60">Sua conta identifica quem solicita e quem recebe acesso.</p><Link href="/login" locale={locale} className={botaoGestao}>Entrar na conta</Link></section>}
    {!carregando && !login && !erro && (!perfil || (["pendente", "recusado"].includes(perfil.estado) && perfil.solicitantes.length === 0)) && <form className={painelGestao} onSubmit={(e) => { e.preventDefault(); void salvar({ justificativa }, "POST"); }}><Shield className="mb-4 text-lime-300" /><h2 className="text-2xl font-semibold">Solicitar a gestão</h2><p className="my-4 max-w-2xl text-white/60">Encontrar o clube na EA não comprova que você é o dono. Explique sua relação com o clube e como a federação pode conferir sua responsabilidade. Não envie senhas ou documentos pessoais.</p><label className="block space-y-2"><span>Justificativa e evidência</span><textarea className={campoGestao} rows={4} required minLength={10} maxLength={2000} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} /></label><button className={`${botaoGestao} mt-4`} disabled={ocupado || justificativa.trim().length < 10}>{ocupado ? "Enviando…" : "Enviar solicitação"}</button></form>}
    {perfil?.solicitantes.some(s => s.minha) ? <section className={painelGestao}><h2 className="text-xl font-semibold">Sua solicitação</h2>{perfil.solicitantes.filter(s => s.minha).map((s) => <p key={s.userId} className="mt-3 whitespace-pre-wrap text-white/70">{s.justificativa}</p>)}<p className="mt-4 text-sm text-white/50">O acesso só é liberado após revisão da federação.</p></section> : null}
    {perfil && ["pendente", "recusado"].includes(perfil.estado) && perfil.solicitantes.some(s => s.minha) && <ProvaAcesso perfil={perfil} ocupado={ocupado} onAcao={(body) => salvar(body, "PATCH")} />}
    {perfil?.permissoes.identidade && <form className={painelGestao} onSubmit={(e) => { e.preventDefault(); void salvar({ acao: "identidade", versao: perfil.versao, descricao }, "PATCH"); }}><h2 className="mb-4 text-2xl font-semibold">Identidade</h2><label className="block space-y-2"><span>Sobre o clube</span><textarea className={campoGestao} rows={3} maxLength={1000} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label><button className={`${botaoGestao} mt-4`} disabled={ocupado}>Salvar descrição</button></form>}
    {perfil?.permissoes.delegar && <section className={painelGestao}><Users className="mb-4 text-lime-300" /><h2 className="text-2xl font-semibold">Responsáveis do clube</h2><p className="my-4 text-white/60">O capitão pode editar a descrição e consultar o elenco; o vice pode consultar o elenco. O recrutador fica registrado como responsável, mas o acesso às vagas ainda depende de quem publicou cada anúncio. Somente o dono concede ou remove funções.</p><div className="space-y-3">{membros.map((m, i) => <div key={m.userId} className="grid items-center gap-3 sm:grid-cols-[1fr_160px_auto]"><span className="font-medium">{m.nome}</span><label><span className="mb-1 block text-xs text-white/60">Função de {m.nome}</span><select className={campoGestao} value={m.funcao} onChange={(e) => setMembros(membros.map((x, n) => n === i ? { ...x, funcao: e.target.value as typeof m.funcao } : x))}><option value="capitao">Capitão</option><option value="vice">Vice</option><option value="recrutador">Recrutador</option></select></label><button type="button" className="px-3 py-3 text-rose-200 underline" onClick={() => setMembros(membros.filter((_, n) => n !== i))}>Remover</button></div>)}</div><button type="button" className={botaoGestao + " mt-5"} disabled={ocupado} onClick={() => void salvar({ acao: "delegar", versao: perfil.versao, membros: membros.map(({ userId, funcao }) => ({ userId, funcao })) }, "PATCH")}>Salvar funções e remoções</button><AdicionarResponsavel ocupado={ocupado} onAdicionar={(email, funcao) => salvar({ acao: "adicionar-responsavel", versao: perfil.versao, email, funcao }, "PATCH")} /></section>}
    {perfil && (perfil.souDono || federacao) && <ApuracoesClube clubId={clubId} plataforma={plataforma} podeAbrir={perfil.estado === "aprovado"} onMudou={() => void carregar()} />}
    {(perfil?.permissoes.elenco || federacao) && <ElencoGestao clubId={clubId} plataforma={plataforma} />}
    {perfil && <nav aria-label="Ferramentas do clube" className="grid gap-4 sm:grid-cols-3">{[{ href: "/game/mercado", titulo: "Mercado", texto: "Encontre jogadores e vagas." }, { href: "/game/campeonatos", titulo: "Campeonatos", texto: "Consulte as competições." }, { href: `/game/clube/${clubId}?p=${plataforma}`, titulo: "Desempenho", texto: "Veja o elenco e a campanha." }].map((item) => <Link key={item.titulo} href={item.href} locale={locale} className={`${painelGestao} hover:border-lime-300/40`}><h2 className="font-semibold">{item.titulo} →</h2><p className="mt-2 text-sm text-white/60">{item.texto}</p></Link>)}</nav>}
    {perfil && perfil.historico.length > 0 && <section className={painelGestao}><h2 className="mb-4 text-xl font-semibold">Registro da gestão</h2><ol className="space-y-4">{perfil.historico.slice(-10).reverse().map((h, i) => <li key={i}><p className="text-sm text-lime-200">{h.acao} · {new Date(h.quando).toLocaleString("pt-BR")}</p><p className="mt-1 text-white/70">{h.motivo}</p></li>)}</ol></section>}
    {federacao && <Link href="/game/federacao" locale={locale} className="inline-block text-lime-300 underline">Abrir painel da federação</Link>}
  </div></main>;
}



function ProvaAcesso({ perfil, ocupado, onAcao }: { perfil: PerfilGestaoTela; ocupado: boolean; onAcao: (body: Record<string, unknown>) => Promise<void> }) {
  const [gamertag, setGamertag] = useState("");
  const desafio = perfil.solicitantes.find(s => s.minha)?.desafio;
  return <section className={painelGestao}><h2 className="text-2xl font-semibold">Comprovar acesso ao seu Pro</h2><p className="my-4 text-white/60">Gere um código, coloque-o no nome do seu Pro dentro do jogo e aguarde a próxima coleta da EA. A conferência prova acesso ao jogador; a federação ainda revisa quem responde pelo clube.</p><label className="block space-y-2"><span>Sua gamertag no elenco</span><input className={campoGestao} maxLength={40} value={gamertag} onChange={(e) => setGamertag(e.target.value)} /></label><button type="button" className={botaoGestao + " mt-4"} disabled={ocupado || gamertag.trim().length < 2} onClick={() => void onAcao({ acao: "gerar-prova", gamertag })}>{desafio ? "Gerar outro código" : "Gerar código"}</button>{desafio && <div className="mt-6 rounded-xl border border-lime-300/20 p-4"><p className="text-sm text-white/60">Inclua este código completo no nome do Pro de {desafio.gamertag}:</p><p className="my-3 select-all break-all font-mono text-2xl text-lime-300">{desafio.codigo}</p><p className="text-sm text-white/50">Válido até {new Date(desafio.expiraEm).toLocaleString("pt-BR")}. O espelho pode levar até a próxima coleta para mostrar a mudança.</p>{desafio.verificadoEm ? <p role="status" className="mt-4 text-lime-200">Acesso conferido. Aguarde a revisão da federação.</p> : <button type="button" className={botaoGestao + " mt-4"} disabled={ocupado} onClick={() => void onAcao({ acao: "verificar-prova" })}>Conferir no espelho</button>}</div>}</section>;
}

function AdicionarResponsavel({ ocupado, onAdicionar }: { ocupado: boolean; onAdicionar: (email: string, funcao: string) => Promise<void> }) {
  const [email, setEmail] = useState(""); const [funcao, setFuncao] = useState("recrutador");
  return <form className="mt-6 space-y-3 border-t border-white/10 pt-5" onSubmit={(e) => { e.preventDefault(); void onAdicionar(email, funcao); }}><h3 className="font-semibold">Adicionar responsável</h3><label className="block space-y-2"><span className="text-sm text-white/60">E-mail usado na conta Winners 22</span><input type="email" required maxLength={254} className={campoGestao} value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="block space-y-2"><span className="text-sm text-white/60">Função</span><select className={campoGestao} value={funcao} onChange={(e) => setFuncao(e.target.value)}><option value="recrutador">Recrutador</option><option value="vice">Vice</option><option value="capitao">Capitão</option></select></label><button className={botaoGestao} disabled={ocupado || !email.trim()}>Adicionar à gestão</button></form>;
}
