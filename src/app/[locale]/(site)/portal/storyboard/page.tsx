"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Clapperboard,
  Copy,
  Film,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { GRUPOS, rotuloDoAjuste } from "@/lib/storyboard/cinematica";

/**
 * O Ateliê de Storyboard — `/portal/storyboard`.
 *
 * A engenharia de storyboard do WorldForge (a mesma que planeja os planos de
 * câmera da série *They Can Hear*) apontada para o conteúdo do usuário: a
 * persona dele entra, e sai um plano de filmagem quadro a quadro — o que se vê,
 * de que ângulo, com que luz, o que está escrito na tela, o que ele fala.
 *
 * ## Por que não é "gerar post com IA"
 *
 * Gerador de post devolve texto e a pessoa continua sem saber o que filmar. Um
 * storyboard devolve a peça pronta para produzir — e, no fim de cada quadro, o
 * prompt em inglês que o gerador de imagem entende. O texto da tela sai como
 * dado, nunca como pixel: gerador escreve português torto, e uma palavra torta
 * derruba o quadro inteiro.
 */

type IdFormato = "reel" | "carrossel" | "story" | "post" | "anuncio";

interface Quadro {
  numero: number;
  titulo: string;
  acao: string;
  textoNaTela?: string;
  fala?: string;
  duracao?: number;
  ajustes: Record<string, string>;
  prompt: string;
  negativo: string;
  arte?: string;
  estado?: string;
}

interface Peca {
  _id: string;
  formato: IdFormato;
  tema: string;
  titulo: string;
  legenda: string;
  hashtags: string[];
  quadros: Quadro[];
  criadoEm?: string;
}

interface ResumoPeca {
  _id: string;
  formato: IdFormato;
  tema: string;
  titulo: string;
  totalQuadros: number;
  comArte: number;
  criadoEm: string;
}

const FORMATOS: Array<{ id: IdFormato; titulo: string; promessa: string; quadros: number; icone: LucideIcon }> = [
  { id: "reel", titulo: "Reel", promessa: "vídeo vertical de 15 a 30s", quadros: 5, icone: Film },
  { id: "carrossel", titulo: "Carrossel", promessa: "cartões para arrastar", quadros: 6, icone: Layers },
  { id: "story", titulo: "Story", promessa: "três telas de bastidor", quadros: 3, icone: Camera },
  { id: "post", titulo: "Post único", promessa: "uma imagem e a legenda", quadros: 1, icone: ImageIcon },
  { id: "anuncio", titulo: "Anúncio", promessa: "peça para tráfego pago", quadros: 3, icone: Sparkles },
];

export default function AtelieDeStoryboard() {
  const T = useT();
  const { locale } = useParams<{ locale: string }>();

  const [formato, setFormato] = useState<IdFormato>("reel");
  const [tema, setTema] = useState("");
  const [observacao, setObservacao] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  const [pecas, setPecas] = useState<ResumoPeca[]>([]);
  const [aberta, setAberta] = useState<Peca | null>(null);
  const [custo, setCusto] = useState(2);
  const [rosto, setRosto] = useState("");

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/user/storyboard", { headers: getClientAuthHeaders() });
      if (!r.ok) return;
      const d = await r.json();
      setPecas(d.pecas || []);
      if (typeof d.custo === "number") setCusto(d.custo);
      setRosto(d.rosto || "");
    } catch {
      /* silêncio: a lista vazia já diz o que precisa */
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function gerar() {
    if (tema.trim().length < 3) return;
    setGerando(true);
    setErro("");
    try {
      const r = await fetch("/api/user/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ formato, tema, observacao }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(
          d.faltam
            ? `${T("Faltam")} ${d.faltam} ${T("créditos para esta peça.")}`
            : d.error || T("Não deu para montar agora."),
        );
        return;
      }
      setAberta(d.peca);
      setTema("");
      setObservacao("");
      carregar();
    } catch (e) {
      setErro(String(e));
    } finally {
      setGerando(false);
    }
  }

  async function abrir(id: string) {
    const r = await fetch(`/api/user/storyboard?id=${id}`, { headers: getClientAuthHeaders() });
    if (r.ok) setAberta((await r.json()).peca);
  }

  async function apagar(id: string) {
    await fetch(`/api/user/storyboard?id=${id}`, { method: "DELETE", headers: getClientAuthHeaders() });
    if (aberta?._id === id) setAberta(null);
    carregar();
  }

  const formatoAtual = useMemo(() => FORMATOS.find((f) => f.id === formato)!, [formato]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href={`/${locale}/portal`}
          className="mb-6 inline-flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {T("Voltar ao portal")}
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 ring-1 ring-indigo-500/30">
              <Clapperboard className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{T("Ateliê de Storyboard")}</h1>
              <p className="text-xs text-slate-400">
                {T("O seu perfil vira um plano de filmagem: quadro a quadro, o que aparece, o que está escrito e o que você fala.")}
              </p>
            </div>
          </div>
        </header>

        {!aberta && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 text-sm font-semibold">{T("Que peça vamos montar?")}</h2>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {FORMATOS.map((f) => {
                  const Icone = f.icone;
                  const ativo = formato === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormato(f.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        ativo
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <Icone className={`mb-1.5 h-4 w-4 ${ativo ? "text-indigo-300" : "text-slate-400"}`} />
                      <p className="text-xs font-semibold">{T(f.titulo)}</p>
                      <p className="mt-0.5 text-[10px] leading-snug text-slate-400">{T(f.promessa)}</p>
                    </button>
                  );
                })}
              </div>

              <label className="mb-3 block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-400">
                  {T("Sobre o que é")}
                </span>
                <textarea
                  rows={3}
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder={T("Ex.: por que o cliente some depois do orçamento — e o que eu mudei para resolver")}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none"
                />
              </label>

              <label className="mb-4 block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-slate-400">
                  {T("Alguma exigência? (opcional)")}
                </span>
                <input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder={T("Ex.: gravo sozinho, sem equipe; mostrar a loja")}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none"
                />
              </label>

              {erro && (
                <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {erro}
                </p>
              )}

              <button
                onClick={gerar}
                disabled={gerando || tema.trim().length < 3}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
              >
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {gerando
                  ? T("Montando os quadros…")
                  : `${T("Montar")} ${T(formatoAtual.titulo)} · ${formatoAtual.quadros} ${T("quadros")} · ${custo} ${T("créditos")}`}
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                {T("Usa o seu perfil da persona. Quanto mais completo, mais a peça se parece com você.")}{" "}
                <Link href={`/${locale}/portal/persona`} className="text-indigo-300 underline decoration-dotted">
                  {T("completar perfil")}
                </Link>
              </p>
            </section>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 text-sm font-semibold">{T("Suas peças")}</h2>
              {pecas.length === 0 ? (
                <p className="text-xs text-slate-500">{T("Nenhuma ainda. A primeira leva menos de um minuto.")}</p>
              ) : (
                <ul className="space-y-2">
                  {pecas.map((p) => (
                    <li key={p._id}>
                      <button
                        onClick={() => abrir(p._id)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-indigo-500/40"
                      >
                        <p className="truncate text-xs font-semibold">{p.titulo || p.tema}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {T(FORMATOS.find((f) => f.id === p.formato)?.titulo || p.formato)} · {p.totalQuadros}{" "}
                          {T("quadros")} · {p.comArte}/{p.totalQuadros} {T("com arte")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}

        {aberta && (
          <PecaAberta
            peca={aberta}
            rosto={rosto}
            fechar={() => setAberta(null)}
            apagar={() => apagar(aberta._id)}
            recarregar={() => abrir(aberta._id)}
          />
        )}
      </div>
    </div>
  );
}

// ─── A peça aberta ────────────────────────────────────────────────────────────

function PecaAberta({
  peca,
  rosto,
  fechar,
  apagar,
  recarregar,
}: {
  peca: Peca;
  rosto: string;
  fechar: () => void;
  apagar: () => void;
  recarregar: () => void;
}) {
  const T = useT();
  const [copiado, setCopiado] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button onClick={fechar} className="mb-2 text-xs text-slate-400 hover:text-white">
            ← {T("todas as peças")}
          </button>
          <h2 className="text-lg font-semibold">{peca.titulo}</h2>
          <p className="text-xs text-slate-400">{peca.tema}</p>
        </div>
        <button
          onClick={apagar}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
        >
          <Trash2 className="h-3 w-3" /> {T("apagar")}
        </button>
      </div>

      {peca.legenda && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400">{T("Legenda")}</h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${peca.legenda}\n\n${peca.hashtags.map((h) => `#${h}`).join(" ")}`,
                );
                setCopiado(-1);
                setTimeout(() => setCopiado(null), 1500);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              <Copy className="h-3 w-3" /> {copiado === -1 ? T("copiado") : T("copiar")}
            </button>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{peca.legenda}</p>
          {peca.hashtags.length > 0 && (
            <p className="mt-2 text-xs text-indigo-300">{peca.hashtags.map((h) => `#${h}`).join(" ")}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {peca.quadros.map((q) => (
          <CartaoQuadro key={q.numero} pecaId={peca._id} quadro={q} rosto={rosto} recarregar={recarregar} />
        ))}
      </div>
    </div>
  );
}

// ─── Um quadro ────────────────────────────────────────────────────────────────

function CartaoQuadro({
  pecaId,
  quadro,
  rosto,
  recarregar,
}: {
  pecaId: string;
  quadro: Quadro;
  rosto: string;
  recarregar: () => void;
}) {
  const T = useT();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerandoArte, setGerandoArte] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");
  const [usarRosto, setUsarRosto] = useState(!!rosto);

  const [acao, setAcao] = useState(quadro.acao);
  const [texto, setTexto] = useState(quadro.textoNaTela || "");
  const [fala, setFala] = useState(quadro.fala || "");
  const [ajustes, setAjustes] = useState<Record<string, string>>(quadro.ajustes || {});

  async function gravar(corpo: Record<string, unknown>) {
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch("/api/user/storyboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ id: pecaId, numero: quadro.numero, quadro: corpo }),
      });
      if (!r.ok) {
        setErro((await r.json()).error || T("não gravou"));
        return false;
      }
      recarregar();
      return true;
    } catch (e) {
      setErro(String(e));
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function gerarArte() {
    setGerandoArte(true);
    setErro("");
    try {
      const r = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({
          prompt: `${quadro.prompt}. Avoid: ${quadro.negativo}`,
          ...(usarRosto && rosto ? { referenceImage: rosto } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || T("a geração falhou"));
        return;
      }
      await gravar({ arte: d.imageUrl, estado: "gerado" });
    } catch (e) {
      setErro(String(e));
    } finally {
      setGerandoArte(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-44 sm:shrink-0">
          {quadro.arte ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quadro.arte}
              alt=""
              className="aspect-[9/16] w-full rounded-xl border border-white/10 object-cover sm:aspect-[3/4]"
            />
          ) : (
            <div className="flex aspect-[9/16] w-full items-center justify-center rounded-xl border border-dashed border-white/15 text-[11px] text-slate-500 sm:aspect-[3/4]">
              {T("sem imagem")}
            </div>
          )}
          <div className="mt-2 space-y-1.5">
            <button
              onClick={gerarArte}
              disabled={gerandoArte}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600/90 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              {gerandoArte ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
              {quadro.arte ? T("gerar de novo") : T("gerar imagem")}
            </button>
            {rosto && (
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <input type="checkbox" checked={usarRosto} onChange={(e) => setUsarRosto(e.target.checked)} />
                {T("com o meu rosto")}
              </label>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              {String(quadro.numero).padStart(2, "0")}
            </span>
            <h3 className="text-sm font-semibold">{quadro.titulo}</h3>
            {quadro.duracao ? <span className="text-[11px] text-slate-400">{quadro.duracao}s</span> : null}
            <button
              onClick={() => setEditando((e) => !e)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              <Pencil className="h-3 w-3" /> {editando ? T("fechar") : T("editar")}
            </button>
          </div>

          {editando ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
                  {T("O que se vê")}
                </span>
                <textarea
                  rows={2}
                  value={acao}
                  onChange={(e) => setAcao(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
                    {T("Texto na tela")}
                  </span>
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">{T("Fala")}</span>
                  <input
                    value={fala}
                    onChange={(e) => setFala(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500/50 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {GRUPOS.map((g) => (
                  <label key={g.chave} className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">
                      {T(g.rotulo)}
                    </span>
                    <select
                      value={ajustes[g.chave] || ""}
                      onChange={(e) => setAjustes((a) => ({ ...a, [g.chave]: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1.5 text-[11px] text-white focus:outline-none"
                    >
                      <option value="">{T("—")}</option>
                      {g.opcoes.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {erro && <p className="text-[11px] text-rose-300">{erro}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditando(false)} className="text-[11px] text-slate-400 hover:text-white">
                  {T("cancelar")}
                </button>
                <button
                  onClick={async () => {
                    const ok = await gravar({ acao, textoNaTela: texto, fala, ajustes });
                    if (ok) setEditando(false);
                  }}
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                  {salvando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  {T("gravar quadro")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-slate-300">{quadro.acao}</p>
              {quadro.textoNaTela && (
                <p className="mt-2 inline-block rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold">
                  {quadro.textoNaTela}
                </p>
              )}
              {quadro.fala && <p className="mt-2 text-xs italic text-slate-400">“{quadro.fala}”</p>}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(quadro.ajustes || {}).map(([g, v]) => (
                  <span
                    key={g}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-300"
                  >
                    {rotuloDoAjuste(g, v)}
                  </span>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/60 p-2">
                <p className="font-mono text-[10px] leading-relaxed text-slate-400">{quadro.prompt}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${quadro.prompt}\n\nNEGATIVE: ${quadro.negativo}`);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1500);
                }}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                <Copy className="h-3 w-3" /> {copiado ? T("copiado") : T("copiar prompt")}
              </button>
              {erro && <p className="mt-2 text-[11px] text-rose-300">{erro}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
