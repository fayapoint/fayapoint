"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  Film,
  Image as ImageIcon,
  Loader2,
  Play,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { GRUPOS, rotuloDoAjuste } from "@/lib/forja/engine/vocabulario";

/**
 * ⚠️ `<img>` e não `next/image`, e a razão é do repositório inteiro.
 *
 * As referências e as artes moram no Cloudinary, e o `next.config.ts` **não
 * declara `images.remotePatterns`**. `next/image` recusa host não declarado — e
 * aqui o sintoma nem foi o buraco silencioso que a Vitrine do Ateliê levou: foi
 * "Application error: a client-side exception", a tela inteira branca, na
 * primeira vez que um personagem tinha foto. Ver o cabeçalho de
 * `AtelieVitrine.tsx`.
 */

/**
 * AS PEÇAS — o plano de filmagem, e o botão que o transforma em arquivo.
 *
 * ## A ordem que a tela impõe, e por que ela é essa
 *
 * Plano → arte → clipe. Não é uma preferência: o clipe do LTX 2.5 PARTE da
 * imagem aprovada, e é isso que faz o vídeo ter a cara que a pessoa escolheu em
 * vez de uma cara que o modelo inventou. Por isso o botão de vídeo de um quadro
 * fica desabilitado enquanto não há arte — e o motivo aparece no `title`, não
 * numa mensagem de erro depois do clique.
 *
 * ## O que a tela nunca esconde
 *
 * O preço. Cada botão de gerar mostra "grátis" ou o número, antes do clique. Um
 * produto com saldo de créditos ao lado precisa disso: sem o rótulo, todo botão
 * vira uma aposta, e a pessoa para de clicar.
 */

interface Quadro {
  numero: number;
  titulo: string;
  acao: string;
  textoNaTela?: string;
  fala?: string;
  duracao?: number;
  quemAparece?: string[];
  ajustes: Record<string, string>;
  prompt: string;
  leitura?: string;
  correcoes?: string[];
  arte?: string;
  video?: string;
  estado?: string;
}

interface Peca {
  _id: string;
  formato: string;
  tema: string;
  titulo: string;
  legenda: string;
  hashtags: string[];
  quadros: Quadro[];
}

interface ResumoPeca {
  _id: string;
  formato: string;
  tema: string;
  titulo: string;
  totalQuadros: number;
  comArte: number;
  comVideo: number;
}

interface Formato {
  id: string;
  titulo: string;
  promessa: string;
  quadros: number;
  ehVideo: boolean;
  protagonista: string;
}

interface PersonagemLeve {
  _id: string;
  nome: string;
  origem: string;
}

export default function Pecas({
  personagens,
  aoMudarFila,
  recarregarSinal,
}: {
  personagens: PersonagemLeve[];
  aoMudarFila: () => void;
  recarregarSinal: number;
}) {
  const T = useT();
  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [formato, setFormato] = useState("reel");
  const [tema, setTema] = useState("");
  const [observacao, setObservacao] = useState("");
  const [custoDoPlano, setCustoDoPlano] = useState(2);

  const [lista, setLista] = useState<ResumoPeca[]>([]);
  const [aberta, setAberta] = useState<Peca | null>(null);
  const [montando, setMontando] = useState(false);
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    const r = await fetch("/api/forja/pecas", { headers: getClientAuthHeaders() });
    if (!r.ok) return;
    const d = await r.json();
    setLista(d.pecas || []);
    setFormatos(d.formatos || []);
    if (typeof d.custoDoPlano === "number") setCustoDoPlano(d.custoDoPlano);
  }, []);

  const abrir = useCallback(async (id: string) => {
    const r = await fetch(`/api/forja/pecas?id=${id}`, { headers: getClientAuthHeaders() });
    if (!r.ok) return;
    const d = await r.json();
    setAberta(d.peca);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // um trabalho que terminou muda a arte de um quadro: a peça aberta precisa
  // voltar do banco, e só ela
  useEffect(() => {
    if (recarregarSinal && aberta) abrir(aberta._id);
    if (recarregarSinal) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarregarSinal]);

  async function montar() {
    if (tema.trim().length < 3) {
      setErro(T("Diga sobre o que é a peça."));
      return;
    }
    setMontando(true);
    setErro("");
    try {
      const r = await fetch("/api/forja/pecas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ formato, tema, observacao }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(
          r.status === 402
            ? `${T("Faltam")} ${d.faltam} ${T("créditos para montar este plano.")}`
            : d.error || T("Não deu para montar agora."),
        );
        return;
      }
      setAberta(d.peca);
      setTema("");
      setObservacao("");
      carregar();
    } finally {
      setMontando(false);
    }
  }

  async function gerar(corpo: Record<string, unknown>, marca: string) {
    setOcupado(marca);
    setErro("");
    try {
      const r = await fetch("/api/forja/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify(corpo),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(
          r.status === 402
            ? `${T("Faltam")} ${d.faltam || d.total} ${T("créditos.")}`
            : d.error || T("Não deu para enfileirar."),
        );
        return;
      }
      aoMudarFila();
      if (aberta) abrir(aberta._id);
    } finally {
      setOcupado("");
    }
  }

  async function salvarQuadro(numero: number, quadro: Partial<Quadro>) {
    if (!aberta) return;
    const r = await fetch("/api/forja/pecas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
      body: JSON.stringify({ id: aberta._id, numero, quadro }),
    });
    if (r.ok) setAberta((await r.json()).peca);
  }

  const f = formatos.find((x) => x.id === formato);

  if (aberta) {
    const fAberta = formatos.find((x) => x.id === aberta.formato);
    const semArte = aberta.quadros.filter((q) => !q.arte).length;
    const comArte = aberta.quadros.filter((q) => q.arte).length;

    return (
      <div className="space-y-4">
        <button
          onClick={() => setAberta(null)}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {T("Voltar às peças")}
        </button>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">{aberta.titulo}</h2>
              <p className="text-[11px] text-slate-500">
                {fAberta?.titulo} · {aberta.quadros.length} {T("quadros")} · {aberta.tema}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {semArte > 0 && (
                <button
                  onClick={() => gerar({ alvo: "peca", pecaId: aberta._id, midia: "imagem" }, "peca-img")}
                  disabled={!!ocupado}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {ocupado === "peca-img" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                  {T("Gerar as")} {semArte} {T("artes")} · {T("grátis")}
                </button>
              )}
              {fAberta?.ehVideo && comArte > 0 && (
                <button
                  onClick={() => gerar({ alvo: "peca", pecaId: aberta._id, midia: "video" }, "peca-vid")}
                  disabled={!!ocupado}
                  className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-[11px] font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-50"
                >
                  {ocupado === "peca-vid" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Film className="h-3 w-3" />}
                  {T("Gerar os clipes")} · {T("grátis")}
                </button>
              )}
            </div>
          </div>

          {erro && <p className="mt-3 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300">{erro}</p>}

          {aberta.legenda && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-300">{aberta.legenda}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(aberta.legenda)}
                  className="shrink-0 rounded p-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300"
                  title={T("Copiar a legenda")}
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              {!!aberta.hashtags.length && (
                <p className="mt-2 text-[10px] text-indigo-400/70">{aberta.hashtags.map((h) => `#${h}`).join(" ")}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {aberta.quadros.map((q) => (
            <CartaoDeQuadro
              key={q.numero}
              q={q}
              ehVideo={!!fAberta?.ehVideo}
              personagens={personagens}
              ocupado={ocupado}
              aoGerar={gerar}
              aoSalvar={salvarQuadro}
              pecaId={aberta._id}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold">{T("Que peça vamos montar?")}</h2>

        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {formatos.map((x) => (
            <button
              key={x.id}
              onClick={() => setFormato(x.id)}
              className={`rounded-lg border p-2.5 text-left transition ${
                formato === x.id
                  ? "border-indigo-500/60 bg-indigo-500/10"
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
              }`}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                {x.ehVideo ? <Film className="h-3 w-3 text-violet-400" /> : <ImageIcon className="h-3 w-3 text-slate-500" />}
                {T(x.titulo)}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{T(x.promessa)}</p>
            </button>
          ))}
        </div>

        <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {T("Sobre o que é")}
        </label>
        <textarea
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          rows={3}
          placeholder={T("Ex.: por que o cliente some depois do orçamento — e o que eu mudei para resolver")}
          className="mt-1 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
        />

        <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {T("Alguma exigência? (opcional)")}
        </label>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder={T("Ex.: gravo sozinho, sem equipe; mostrar a loja")}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
        />

        <button
          onClick={montar}
          disabled={montando}
          className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {montando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {T("Montar")} {f ? T(f.titulo) : ""} · {f?.quadros} {T("quadros")} · {custoDoPlano} {T("créditos")}
        </button>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          {T(
            "O plano custa créditos porque usa um modelo de linguagem. As imagens e os vídeos depois disso são de graça — rodam na GPU da FayAI.",
          )}
        </p>
        {erro && <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300">{erro}</p>}
      </div>

      {!!lista.length && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold">{T("Suas peças")}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {lista.map((p) => (
              <button
                key={p._id}
                onClick={() => abrir(p._id)}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-left transition hover:border-slate-700"
              >
                <p className="truncate text-xs font-semibold">{p.titulo || p.tema}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{p.totalQuadros} {T("quadros")}</span>
                  <span className={p.comArte ? "text-emerald-400" : ""}>
                    {p.comArte}/{p.totalQuadros} {T("com arte")}
                  </span>
                  {p.comVideo > 0 && <span className="text-violet-400">{p.comVideo} {T("em vídeo")}</span>}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CartaoDeQuadro({
  q,
  ehVideo,
  personagens,
  ocupado,
  aoGerar,
  aoSalvar,
  pecaId,
}: {
  q: Quadro;
  ehVideo: boolean;
  personagens: PersonagemLeve[];
  ocupado: string;
  aoGerar: (corpo: Record<string, unknown>, marca: string) => void;
  aoSalvar: (numero: number, quadro: Partial<Quadro>) => void;
  pecaId: string;
}) {
  const T = useT();
  const [aberto, setAberto] = useState(false);
  const marcaImg = `q${q.numero}-img`;
  const marcaVid = `q${q.numero}-vid`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex gap-3">
        {/* a arte */}
        <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          {q.video ? (
            <video src={q.video} className="h-full w-full object-cover" controls playsInline preload="metadata" />
          ) : q.arte ? (
            <img src={q.arte} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              {q.estado === "na-fila" ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500/60" />
              ) : (
                <Clapperboard className="h-4 w-4 text-slate-700" />
              )}
            </div>
          )}
          <span className="absolute left-1 top-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums">
            {q.numero}
          </span>
        </div>

        {/* o conteúdo */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{q.titulo}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{q.acao}</p>

          {q.textoNaTela && (
            <p className="mt-1.5 inline-block rounded bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300">
              {T("na tela")}: “{q.textoNaTela}”
            </p>
          )}
          {q.fala && <p className="mt-1 text-[10px] italic text-slate-500">“{q.fala}”</p>}

          {!!q.correcoes?.length && (
            <p className="mt-1.5 text-[10px] leading-relaxed text-amber-400/70">
              {T("Ajustei a câmera")}: {q.correcoes.join(" ")}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {Object.entries(q.ajustes || {})
              .filter(([, v]) => v)
              .map(([g, v]) => (
                <span key={g} className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[9px] text-slate-400">
                  {rotuloDoAjuste(g, v)}
                </span>
              ))}
            {q.duracao ? (
              <span className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[9px] text-slate-400">{q.duracao}s</span>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => aoGerar({ alvo: "quadro", pecaId, numero: q.numero, midia: "imagem" }, marcaImg)}
              disabled={!!ocupado || q.estado === "na-fila"}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-[10px] text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
            >
              {ocupado === marcaImg ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
              {q.arte ? T("Refazer a arte") : T("Gerar a arte")} · {T("grátis")}
            </button>

            {ehVideo && (
              <button
                onClick={() => aoGerar({ alvo: "quadro", pecaId, numero: q.numero, midia: "video" }, marcaVid)}
                disabled={!!ocupado || !q.arte}
                title={
                  q.arte
                    ? T("O clipe parte desta arte, com áudio de ambiente")
                    : T("O clipe parte da arte aprovada — gere a imagem primeiro")
                }
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 px-2.5 py-1 text-[10px] text-violet-300 transition hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {ocupado === marcaVid ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                {q.video ? T("Refazer o clipe") : T("Virar clipe")} · {T("grátis")}
              </button>
            )}

            <button
              onClick={() => aoGerar({ alvo: "quadro", pecaId, numero: q.numero, midia: "imagem", furarFila: true }, `${marcaImg}-f`)}
              disabled={!!ocupado}
              title={T("Passa na frente de quem está esperando")}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-amber-400/70 transition hover:bg-amber-500/10 disabled:opacity-40"
            >
              <Zap className="h-3 w-3" /> {T("na frente")}
            </button>

            <button
              onClick={() => setAberto(!aberto)}
              className="ml-auto flex items-center gap-1 rounded p-1 text-[10px] text-slate-600 transition hover:text-slate-400"
            >
              {T("ajustar")} <ChevronDown className={`h-3 w-3 transition ${aberto ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {aberto && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{T("O que se vê")}</label>
          <textarea
            defaultValue={q.acao}
            onBlur={(e) => e.target.value !== q.acao && aoSalvar(q.numero, { acao: e.target.value })}
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-[11px] outline-none focus:border-indigo-500/50"
          />

          {!!personagens.length && (
            <div className="mt-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {T("Quem aparece")}
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {personagens.map((p) => {
                  const dentro = (q.quemAparece || []).includes(p._id);
                  return (
                    <button
                      key={p._id}
                      onClick={() =>
                        aoSalvar(q.numero, {
                          quemAparece: dentro
                            ? (q.quemAparece || []).filter((x) => x !== p._id)
                            : [...(q.quemAparece || []), p._id],
                        })
                      }
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition ${
                        dentro ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {dentro && <Check className="h-2.5 w-2.5" />}
                      {p.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {GRUPOS.filter((g) => ehVideo || !g.soVideo).map((g) => (
              <div key={g.chave}>
                <label className="text-[10px] text-slate-500">{T(g.rotulo)}</label>
                <select
                  value={q.ajustes?.[g.chave] || ""}
                  onChange={(e) => aoSalvar(q.numero, { ajustes: { ...q.ajustes, [g.chave]: e.target.value } })}
                  className="mt-0.5 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-[11px] outline-none focus:border-indigo-500/50"
                >
                  <option value="">—</option>
                  {g.opcoes.map((o) => (
                    <option key={o.valor} value={o.valor} title={o.explica}>
                      {T(o.rotulo)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {q.leitura && (
            <div className="mt-3 rounded-lg bg-slate-950/60 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {T("O que vai para o gerador")}
              </p>
              <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-slate-400">{q.leitura}</p>
              <details className="mt-1.5">
                <summary className="cursor-pointer text-[10px] text-slate-600 hover:text-slate-400">
                  {T("ver o prompt em inglês")}
                </summary>
                <p className="mt-1 break-words font-mono text-[9px] leading-relaxed text-slate-600">{q.prompt}</p>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
