"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LIMA, OURO, CIANO, VIOLETA, ROSA, bebas, superficie } from "@/lib/game/tema";

/**
 * COMPRA E VENDA — a tela. Toda regra mora no servidor
 * (`lib/game/negociacao-servidor.ts`); aqui só se lê o quadro, pede avaliação
 * e envia proposta/resposta. Nenhum número de dinheiro é calculado no cliente.
 */

type Plat = "common-gen5" | "nx";
interface Parcela { rotulo: string; fichas: number }
interface Avaliacao { valor: number; minimo: number; maximo: number; confianca: string; parcelas: Parcela[] }
interface ClubeRef { eaClubId: string; plataforma: Plat; nome: string }
interface Neg {
  id: string; tipo: "clube" | "jogador"; estado: string; clube: ClubeRef | null; gamertag: string | null; destino: ClubeRef | null;
  valor: number; compensacao: number; referencia: { valor: number }; mensagem: string; comprador: string; vendedor: string;
  aceites: { vendedor: string | null; origem: string | null }; expiraEm: string; concluidaEm: string | null; criadaEm: string;
  papel: "comprador" | "vendedor" | "origem" | null; historico: Array<{ quando: string; acao: string; detalhe: string }>;
}
interface Quadro {
  recentes: Neg[]; minhas: Neg[];
  aVenda: Array<{ eaClubId: string; plataforma: Plat; nome: string; preco: number; nota: string; divisao: number | null; referencia: number | null }>;
  meusClubes: Array<{ eaClubId: string; plataforma: Plat; nome: string; souDono: boolean; aVenda: { preco: number } | null }>;
  totais: { transferencias: number; fichas: number };
}

const C = {
  pt: {
    totais: (n: number, f: number) => `${n} transferências concluídas · ${f.toLocaleString("pt-BR")} fichas movimentadas`,
    tutorial: "Como funciona (tutorial)",
    avaliar: "Avaliar e propor", jogador: "Contratar jogador", clube: "Comprar clube",
    gamertag: "Gamertag (como aparece no elenco da EA)", clubId: "ID do clube na EA", plataforma: "Plataforma",
    gen5: "PS5 · Series · PC", nx: "Switch 2", ver: "Ver valor de mercado",
    valor: "Valor de mercado", faixa: "Faixa aceita", conf: "confiança",
    destino: "Clube que contrata", semClube: "Você precisa gerir um clube aprovado (dono, capitão ou vice) para contratar.",
    total: "Total oferecido (fichas)", comp: "Parte para o clube de origem (compensação, opcional)", msg: "Mensagem (opcional)",
    enviar: "Enviar proposta e prender as fichas", login: "Entre na sua conta para negociar →",
    enviado: "Proposta enviada. As fichas estão em custódia até a resposta.",
    aVenda: "Clubes à venda", nenhumAVenda: "Nenhum clube anunciado agora.", propor: "Fazer proposta", pede: "pede", ref: "referência",
    anunciar: "Anunciar a venda do meu clube", preco: "Preço pedido (fichas)", nota: "Recado (opcional)", publicarAnuncio: "Anunciar", retirar: "Retirar anúncio", anunciado: "À venda por",
    minhas: "Minhas negociações", nenhuma: "Nenhuma negociação ainda.",
    aceitar: "Aceitar", recusar: "Recusar", cancelar: "Cancelar proposta",
    recentes: "Transferências recentes", nenhumaRecente: "Nenhuma transferência concluída ainda.",
    estados: { aberta: "aberta", concluida: "concluída", recusada: "recusada", cancelada: "cancelada", expirada: "vencida" } as Record<string, string>,
    papeis: { comprador: "você oferece", vendedor: "você recebe", origem: "clube de origem (seu)" } as Record<string, string>,
    aguardando: "aguardando", expira: "vence em",
    regra: "Fichas não têm valor econômico: não se compram, não se sacam. Pagamento por fora é proibido.",
  },
  en: {
    totais: (n: number, f: number) => `${n} completed transfers · ${f.toLocaleString("en")} chips moved`,
    tutorial: "How it works (tutorial)",
    avaliar: "Value and offer", jogador: "Sign a player", clube: "Buy a club",
    gamertag: "Gamertag (as shown in EA's squad)", clubId: "EA club ID", plataforma: "Platform",
    gen5: "PS5 · Series · PC", nx: "Switch 2", ver: "Get market value",
    valor: "Market value", faixa: "Accepted range", conf: "confidence",
    destino: "Signing club", semClube: "You must manage an approved club (owner, captain or vice) to sign players.",
    total: "Total offered (chips)", comp: "Share for the origin club (compensation, optional)", msg: "Message (optional)",
    enviar: "Send offer and escrow the chips", login: "Sign in to negotiate →",
    enviado: "Offer sent. Chips are in escrow until the answer.",
    aVenda: "Clubs for sale", nenhumAVenda: "No clubs listed right now.", propor: "Make an offer", pede: "asks", ref: "reference",
    anunciar: "List my club for sale", preco: "Asking price (chips)", nota: "Note (optional)", publicarAnuncio: "List", retirar: "Remove listing", anunciado: "For sale at",
    minhas: "My deals", nenhuma: "No deals yet.",
    aceitar: "Accept", recusar: "Decline", cancelar: "Cancel offer",
    recentes: "Recent transfers", nenhumaRecente: "No completed transfers yet.",
    estados: { aberta: "open", concluida: "completed", recusada: "declined", cancelada: "cancelled", expirada: "expired" } as Record<string, string>,
    papeis: { comprador: "you offer", vendedor: "you receive", origem: "origin club (yours)" } as Record<string, string>,
    aguardando: "waiting", expira: "expires",
    regra: "Chips have no monetary value: they cannot be bought or cashed out. Off-platform payment is forbidden.",
  },
};

async function postar(url: string, corpo: unknown): Promise<{ ok: boolean; status: number; erro?: string }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) }).catch(() => null);
  if (!res) return { ok: false, status: 0, erro: "Sem conexão." };
  const j = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, erro: j?.error };
}

const campo = "w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/40";

export function Negociacoes({ locale }: { locale: string }) {
  const c = locale === "en" ? C.en : C.pt;
  const [q, setQ] = useState<Quadro | null>(null);
  const recarregar = useCallback(() => {
    fetch("/api/game/negociacoes").then((r) => r.json()).then(setQ).catch(() => {});
  }, []);
  useEffect(recarregar, [recarregar]);

  const [aba, setAba] = useState<"jogador" | "clube">("jogador");
  const [plat, setPlat] = useState<Plat>("common-gen5");
  const [alvo, setAlvo] = useState("");
  const [av, setAv] = useState<Avaliacao | null>(null);
  const [erroAv, setErroAv] = useState("");
  const [destino, setDestino] = useState("");
  const [valor, setValor] = useState("");
  const [comp, setComp] = useState("");
  const [msg, setMsg] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro" | "login"; texto: string } | null>(null);

  const gestao = (q?.meusClubes ?? []).filter((m) => m.plataforma === plat);

  async function avaliar(tipo = aba, id = alvo, p = plat) {
    setAv(null); setErroAv(""); setAviso(null);
    const qs = tipo === "jogador" ? `tipo=jogador&gamertag=${encodeURIComponent(id.trim())}` : `tipo=clube&clubId=${encodeURIComponent(id.trim())}`;
    const r = await fetch(`/api/game/negociacoes/avaliar?${qs}&plataforma=${p}`).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (!r?.ok) return setErroAv(j?.error ?? "Erro");
    setAv(j.avaliacao);
    setValor(String(j.avaliacao.valor));
  }

  async function propor() {
    const corpo = aba === "jogador"
      ? { tipo: "jogador", plataforma: plat, gamertag: alvo.trim(), destinoClubId: destino, valor: Number(valor), compensacao: Number(comp || 0), mensagem: msg }
      : { tipo: "clube", plataforma: plat, eaClubId: alvo.trim(), valor: Number(valor), mensagem: msg };
    const r = await postar("/api/game/negociacoes", corpo);
    if (r.status === 401) return setAviso({ tipo: "login", texto: c.login });
    setAviso(r.ok ? { tipo: "ok", texto: c.enviado } : { tipo: "erro", texto: r.erro ?? "Erro" });
    if (r.ok) recarregar();
  }

  async function agir(id: string, acao: string) {
    const r = await postar(`/api/game/negociacoes/${id}`, { acao });
    if (!r.ok) alert(r.erro ?? "Erro");
    recarregar();
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        {q && <p className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: `${OURO}14`, color: OURO, border: `1px solid ${OURO}33` }}>{c.totais(q.totais.transferencias, q.totais.fichas)}</p>}
        <Link href="/game/tutorial#compra-venda" className="text-[12.5px] font-bold" style={{ color: LIMA }}>{c.tutorial} →</Link>
      </div>

      <section className="rounded-2xl border p-5 sm:p-6" style={superficie(CIANO)}>
        <h2 className="text-2xl leading-none" style={bebas}>{c.avaliar.toUpperCase()}</h2>
        <div className="mt-4 flex gap-2" role="tablist">
          {(["jogador", "clube"] as const).map((a) => (
            <button key={a} role="tab" aria-selected={aba === a} type="button" onClick={() => { setAba(a); setAv(null); setAlvo(""); setAviso(null); }}
              className="rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors"
              style={aba === a ? { background: CIANO, color: "#0c0e1d" } : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)" }}>
              {a === "jogador" ? c.jogador : c.clube}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <label className="text-[12px] text-white/60">{aba === "jogador" ? c.gamertag : c.clubId}
            <input className={campo} value={alvo} onChange={(e) => setAlvo(e.target.value)} inputMode={aba === "clube" ? "numeric" : "text"} maxLength={40} />
          </label>
          <label className="text-[12px] text-white/60">{c.plataforma}
            <select className={campo} value={plat} onChange={(e) => setPlat(e.target.value as Plat)}>
              <option value="common-gen5" style={{ color: "#000" }}>{c.gen5}</option>
              <option value="nx" style={{ color: "#000" }}>{c.nx}</option>
            </select>
          </label>
          <button type="button" onClick={() => avaliar()} disabled={alvo.trim().length < 2} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40" style={{ background: CIANO, color: "#0c0e1d" }}>{c.ver}</button>
        </div>
        {erroAv && <p className="mt-3 text-[13px]" style={{ color: ROSA }}>{erroAv}</p>}

        {av && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border px-4 py-3" style={superficie(OURO)}>
              <p className="text-[11px] uppercase tracking-widest text-white/50">{c.valor}</p>
              <p className="text-4xl leading-none" style={{ ...bebas, color: OURO }}>{av.valor}</p>
              <p className="text-[12px] text-white/60">{c.faixa}: {av.minimo}–{av.maximo} · {c.conf} {av.confianca}</p>
              <ul className="mt-2 space-y-0.5 text-[12.5px] text-white/70">{av.parcelas.map((p) => <li key={p.rotulo} className="flex justify-between gap-3"><span>{p.rotulo}</span><span className="tabular-nums">{p.fichas}</span></li>)}</ul>
            </div>
            <div className="space-y-3">
              {aba === "jogador" && (
                gestao.length ? (
                  <label className="block text-[12px] text-white/60">{c.destino}
                    <select className={campo} value={destino} onChange={(e) => setDestino(e.target.value)}>
                      <option value="" style={{ color: "#000" }}>—</option>
                      {gestao.map((m) => <option key={m.eaClubId} value={m.eaClubId} style={{ color: "#000" }}>{m.nome}</option>)}
                    </select>
                  </label>
                ) : <p className="text-[13px] text-white/60">{c.semClube}</p>
              )}
              <label className="block text-[12px] text-white/60">{c.total}
                <input className={campo} type="number" min={av.minimo} max={av.maximo} step={5} value={valor} onChange={(e) => setValor(e.target.value)} />
              </label>
              {aba === "jogador" && (
                <label className="block text-[12px] text-white/60">{c.comp}
                  <input className={campo} type="number" min={0} step={5} value={comp} onChange={(e) => setComp(e.target.value)} />
                </label>
              )}
              <label className="block text-[12px] text-white/60">{c.msg}
                <textarea className={campo} rows={2} maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)} />
              </label>
              <button type="button" onClick={propor} disabled={aba === "jogador" && !destino} className="w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-40" style={{ background: OURO, color: "#0c0e1d" }}>{c.enviar}</button>
              {aviso && (aviso.tipo === "login"
                ? <Link href="/login" className="block text-center text-[13px] font-bold" style={{ color: OURO }}>{aviso.texto}</Link>
                : <p className="text-[13px]" style={{ color: aviso.tipo === "ok" ? LIMA : ROSA }}>{aviso.texto}</p>)}
              <p className="text-[11.5px] text-white/45">{c.regra}</p>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl leading-none" style={bebas}>{c.aVenda.toUpperCase()}</h2>
        {!q?.aVenda.length ? <p className="mt-3 text-sm text-white/50">{c.nenhumAVenda}</p> : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {q.aVenda.map((v) => (
              <div key={v.eaClubId + v.plataforma} className="rounded-xl border px-4 py-3" style={superficie(LIMA)}>
                <Link href={`/game/clube/${v.eaClubId}?p=${v.plataforma}`} className="text-xl leading-none hover:underline" style={bebas}>{v.nome.toUpperCase()}</Link>
                <p className="text-[12px] text-white/55">{v.plataforma === "nx" ? c.nx : c.gen5}{v.divisao ? ` · Div ${v.divisao}` : ""}</p>
                <p className="mt-2 text-[13px] text-white/80">{c.pede} <b style={{ color: OURO }}>{v.preco}</b>{v.referencia ? ` · ${c.ref} ${v.referencia}` : ""}</p>
                {v.nota && <p className="mt-1 text-[12px] text-white/55">“{v.nota}”</p>}
                <button type="button" className="mt-3 text-[12.5px] font-bold" style={{ color: CIANO }}
                  onClick={() => { setAba("clube"); setPlat(v.plataforma); setAlvo(v.eaClubId); void avaliar("clube", v.eaClubId, v.plataforma).then(() => setValor(String(v.preco))); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  {c.propor} →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {!!q?.meusClubes.some((m) => m.souDono) && <AnunciarVenda q={q} c={c} aoMudar={recarregar} />}

      <section>
        <h2 className="text-2xl leading-none" style={bebas}>{c.minhas.toUpperCase()}</h2>
        {!q?.minhas.length ? <p className="mt-3 text-sm text-white/50">{c.nenhuma}</p> : (
          <div className="mt-4 space-y-3">{q.minhas.map((n) => <CartaoNeg key={n.id} n={n} c={c} agir={agir} />)}</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl leading-none" style={bebas}>{c.recentes.toUpperCase()}</h2>
        {!q?.recentes.length ? <p className="mt-3 text-sm text-white/50">{c.nenhumaRecente}</p> : (
          <div className="mt-4 space-y-2">{q.recentes.map((n) => <CartaoNeg key={n.id} n={n} c={c} agir={agir} />)}</div>
        )}
      </section>
    </div>
  );
}

type Copy = typeof C.pt;

function AnunciarVenda({ q, c, aoMudar }: { q: Quadro; c: Copy; aoMudar: () => void }) {
  const donos = q.meusClubes.filter((m) => m.souDono);
  const [sel, setSel] = useState(donos[0]?.eaClubId ?? "");
  const [preco, setPreco] = useState("");
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");
  const clube = donos.find((d) => d.eaClubId === sel);
  async function enviar(retirar: boolean) {
    setErro("");
    const r = await postar("/api/game/negociacoes/anuncio", { clubId: sel, plataforma: clube?.plataforma, preco: retirar ? null : Number(preco), nota });
    if (!r.ok) setErro(r.erro ?? "Erro"); else aoMudar();
  }
  return (
    <section className="rounded-2xl border p-5" style={superficie(VIOLETA)}>
      <h2 className="text-2xl leading-none" style={bebas}>{c.anunciar.toUpperCase()}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_1fr_auto] sm:items-end">
        <select className={campo} value={sel} onChange={(e) => setSel(e.target.value)} aria-label={c.clube}>
          {donos.map((d) => <option key={d.eaClubId} value={d.eaClubId} style={{ color: "#000" }}>{d.nome}</option>)}
        </select>
        <label className="text-[12px] text-white/60">{c.preco}<input className={campo} type="number" min={5} step={5} value={preco} onChange={(e) => setPreco(e.target.value)} /></label>
        <label className="text-[12px] text-white/60">{c.nota}<input className={campo} maxLength={300} value={nota} onChange={(e) => setNota(e.target.value)} /></label>
        <button type="button" onClick={() => enviar(false)} disabled={!preco} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40" style={{ background: VIOLETA, color: "#0c0e1d" }}>{c.publicarAnuncio}</button>
      </div>
      {clube?.aVenda && (
        <p className="mt-3 text-[13px] text-white/70">{c.anunciado} <b style={{ color: OURO }}>{clube.aVenda.preco}</b> · <button type="button" className="font-bold underline" onClick={() => enviar(true)}>{c.retirar}</button></p>
      )}
      {erro && <p className="mt-2 text-[13px]" style={{ color: ROSA }}>{erro}</p>}
    </section>
  );
}

function CartaoNeg({ n, c, agir }: { n: Neg; c: Copy; agir: (id: string, acao: string) => void }) {
  const titulo = n.tipo === "clube" ? n.clube?.nome : `${n.gamertag} → ${n.destino?.nome ?? ""}`;
  const cor = n.estado === "concluida" ? LIMA : n.estado === "aberta" ? CIANO : "rgba(255,255,255,.4)";
  const minhaVez = n.estado === "aberta" && ((n.papel === "vendedor" && !n.aceites.vendedor) || (n.papel === "origem" && !n.aceites.origem));
  return (
    <div className="rounded-xl border px-4 py-3" style={superficie(typeof cor === "string" && cor.startsWith("#") ? cor : LIMA)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-white">{n.tipo === "clube" ? "🏟️" : "👟"} {titulo}</p>
        <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: cor }}>{c.estados[n.estado] ?? n.estado}</p>
      </div>
      <p className="mt-1 text-[13px] text-white/70">
        <b style={{ color: OURO }}>{n.valor}</b> {n.compensacao ? `(${n.compensacao} → ${n.clube?.nome ?? ""})` : ""} · {n.comprador} ⇄ {n.vendedor}
        {n.papel && ` · ${c.papeis[n.papel]}`}
        {n.estado === "aberta" && ` · ${c.expira} ${new Date(n.expiraEm).toLocaleDateString()}`}
      </p>
      {n.mensagem && <p className="mt-1 text-[12.5px] text-white/55">“{n.mensagem}”</p>}
      {n.estado === "aberta" && n.papel && (
        <div className="mt-2 flex flex-wrap gap-2">
          {minhaVez && <button type="button" onClick={() => agir(n.id, "aceitar")} className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold" style={{ background: LIMA, color: "#0c0e1d" }}>{c.aceitar}</button>}
          {(n.papel === "vendedor" || n.papel === "origem") && <button type="button" onClick={() => agir(n.id, "recusar")} className="rounded-lg border border-white/20 px-3 py-1.5 text-[12.5px] font-bold text-white/80">{c.recusar}</button>}
          {n.papel === "comprador" && <button type="button" onClick={() => agir(n.id, "cancelar")} className="rounded-lg border border-white/20 px-3 py-1.5 text-[12.5px] font-bold text-white/80">{c.cancelar}</button>}
          {!minhaVez && n.papel !== "comprador" && <span className="text-[12px] text-white/50">{c.aguardando}</span>}
        </div>
      )}
    </div>
  );
}
