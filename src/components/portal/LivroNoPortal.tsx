"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, BookOpen, Check, Loader2, PenLine, RefreshCw, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * O LIVRO DENTRO DO DASHBOARD (16/08/2026)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Ricardo, com a tela aberta: *"quando dentro do ateliê eu clico para ver meu
 * livro, eu sou mandado para esta página fora do dashboard (…) do jeito que
 * está eu tenho que clicar mais 3 vezes para ver meu curso."*
 *
 * Ele está certo, e a conta é literal. Para trocar o tom do livro, a partir do
 * portal: aba do Ateliê → cartão do curso → `/curso/<slug>/meu/livro` (fora do
 * portal) → "Mudar como é escrito" → `/meu/ajustes`. Quatro telas, três delas
 * fora do dashboard, para mexer num seletor.
 *
 * ## O que este componente é, e o que ele NÃO é
 *
 * Ele **não** é uma segunda cópia da página do livro. É a camada que o portal
 * precisa: o sumário do que já foi escrito e os ajustes que mudam o que vem
 * pela frente, no MESMO lugar, sem sair. O que continua morando em
 * `/curso/<slug>/meu/livro` é o que só faz sentido fora do portal — o link
 * público de leitura, a ficha técnica completa, os retratos dos modelos.
 *
 * ⚠️ Os ajustes aqui gravam pelo MESMO `PATCH /api/user/atelie` da mesa. Uma
 * segunda rota de gravação seria a maneira mais rápida de a mesa e o portal
 * discordarem sobre o que está valendo.
 */

interface Cap {
  indice: number;
  numero: number | null;
  titulo: string;
  escrito: boolean;
  escritoEm: string | null;
  tamanho: number;
}

interface Opcao {
  id: string;
  rotulo: string;
  descricao: string;
  emoji?: string;
}

interface Ajustes {
  tom: string;
  profundidade: string;
  extensao: string;
  foco: string[];
  narrador: string;
  emojis?: string;
  modelo?: string;
}

export function LivroNoPortal({ slug, aoVoltar }: { slug: string; aoVoltar: () => void }) {
  const T = useT();
  const [livro, setLivro] = useState<{
    curso: { nome: string; capa: string };
    sumario: Cap[];
    escritos: number;
    total: number;
    pacote: { creditos: number } | null;
  } | null>(null);
  const [mesa, setMesa] = useState<{
    ajustes: Ajustes;
    catalogo: { tons: Opcao[]; profundidades: Opcao[]; extensoes: Opcao[]; emojis: Opcao[] };
  } | null>(null);
  const [regerando, setRegerando] = useState<number | null>(null);

  const buscar = useCallback(async () => {
    const h = { credentials: "include" as const, headers: getClientAuthHeaders(), cache: "no-store" as const };
    // As duas em paralelo: o sumário e os ajustes aparecem juntos ou a tela se
    // monta aos pedaços na frente da pessoa.
    const [a, b] = await Promise.all([
      fetch(`/api/user/livro?curso=${encodeURIComponent(slug)}`, h),
      fetch(`/api/user/atelie?curso=${encodeURIComponent(slug)}`, h),
    ]);
    if (a.ok) setLivro(await a.json());
    if (b.ok) setMesa(await b.json());
  }, [slug]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const mudarAjuste = async (mudanca: Partial<Ajustes>) => {
    if (!mesa) return;
    const antes = mesa.ajustes;
    const novos = { ...antes, ...mudanca };
    setMesa({ ...mesa, ajustes: novos });
    const r = await fetch("/api/user/atelie", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
      body: JSON.stringify({ curso: slug, ajustes: novos }),
    });
    if (!r.ok) {
      setMesa((v) => (v ? { ...v, ajustes: antes } : v));
      toast.error(T("Não deu para salvar o ajuste"));
    }
  };

  /**
   * ⚠️ Regerar CUSTA, e o botão diz isso antes do clique.
   *
   * Ricardo: *"não pode custar zero para gerar outro nunca, pois assim
   * poderíamos ter um sem fim de requisições só porque é de graça."* Quem
   * garante a cobrança é a rota; aqui o preço é repetido para que ninguém
   * descubra o gasto depois de gastar.
   */
  const regerar = async (indice: number) => {
    setRegerando(indice);
    try {
      const r = await fetch("/api/user/curso-personalizado", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ curso: slug, capitulos: [indice], limite: 1 }),
      });
      const d = await r.json();
      if (!r.ok) return void toast.error(d?.error || T("Não deu para reescrever agora"));
      if (!d.geradas) return void toast.error(T("O modelo não respondeu. Nada foi cobrado."));
      await buscar();
      toast.success(
        d.creditosGastos
          ? `${T("Capítulo reescrito")} — ${d.creditosGastos} ${T("créditos")}`
          : T("Capítulo reescrito"),
      );
    } finally {
      setRegerando(null);
    }
  };

  if (!livro) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const faltam = Math.max(0, livro.total - livro.escritos);
  const a = mesa?.ajustes;
  const c = mesa?.catalogo;

  /** Uma fileira de ajuste. Compacta: aqui ela divide espaço com o sumário. */
  const Fileira = ({
    titulo,
    opcoes,
    atual,
    aoEscolher,
  }: {
    titulo: string;
    opcoes?: Opcao[];
    atual?: string;
    aoEscolher: (id: string) => void;
  }) =>
    !opcoes?.length ? null : (
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">{T(titulo)}</p>
        <div className="flex flex-wrap gap-1.5">
          {opcoes.map((o) => {
            const on = atual === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => aoEscolher(o.id)}
                title={o.descricao}
                className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  on
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-white/[0.02] text-white/65 hover:border-white/25"
                }`}
              >
                {o.emoji ? `${o.emoji} ` : ""}
                {T(o.rotulo)}
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={aoVoltar}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/60 hover:text-white"
      >
        <ArrowLeft size={14} /> {T("Todos os cursos do Ateliê")}
      </button>

      {/* ── A CAPA ── */}
      <div className="overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-transparent p-5">
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
          {T("A sua edição")}
        </p>
        <h2 className="mt-1 text-[22px] font-black leading-tight text-white sm:text-[28px]">{livro.curso.nome}</h2>
        <p className="mt-1 text-[13.5px] text-white/70">
          <span className="font-bold text-white">
            {livro.escritos} {T("de")} {livro.total}
          </span>{" "}
          {T("capítulos com a sua cara")}
        </p>
        <div className="mt-2.5 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
            style={{ width: `${Math.round((livro.escritos / Math.max(1, livro.total)) * 100)}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/curso/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-2 text-[13.5px] font-extrabold text-black hover:opacity-90"
          >
            <BookOpen size={14} /> {T("Ler no curso")}
          </Link>
          {faltam > 0 && (
            <Link
              href={`/curso/${slug}/meu/escrevendo`}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2 text-[13.5px] font-bold text-amber-100 hover:bg-amber-400/20"
            >
              <PenLine size={14} /> {T("Continuar — faltam")} {faltam}
            </Link>
          )}
          <Link
            href={`/curso/${slug}/meu/ajustes`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2 text-[13.5px] font-bold text-white hover:bg-white/10"
          >
            <SlidersHorizontal size={14} /> {T("Mesa de ajustes completa")}
          </Link>
        </div>
      </div>

      {/* ── OS AJUSTES, AQUI MESMO ──
          ⚠️ É o ponto do pedido. Os quatro controles que mais mudam o texto
          ficam a UM clique do sumário, sem sair do dashboard. O que exige a
          mesa inteira (revisar o prompt, escolher o modelo, a prova grátis)
          continua lá, e o link está logo acima. */}
      {a && c && (
        <details open className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <summary className="cursor-pointer list-none px-4 py-3 text-[14px] font-bold text-white">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-amber-300" />
              {T("Como este livro é escrito")}
            </span>
          </summary>
          <div className="space-y-3.5 border-t border-white/10 px-4 py-4">
            <Fileira
              titulo="Profundidade das explicações"
              opcoes={c.profundidades}
              atual={a.profundidade}
              aoEscolher={(id) => mudarAjuste({ profundidade: id })}
            />
            <Fileira titulo="Tom" opcoes={c.tons} atual={a.tom} aoEscolher={(id) => mudarAjuste({ tom: id })} />
            <Fileira
              titulo="Emoji"
              opcoes={c.emojis}
              atual={a.emojis || "espelho"}
              aoEscolher={(id) => mudarAjuste({ emojis: id })}
            />
            <Fileira
              titulo="Tamanho"
              opcoes={c.extensoes}
              atual={a.extensao}
              aoEscolher={(id) => mudarAjuste({ extensao: id })}
            />
            <p className="text-[12px] leading-snug text-white/45">
              {T(
                "Mudar um ajuste não reescreve o que já está pronto — ele vale para o que vier. Para aplicar a um capítulo já escrito, use “regerar” abaixo (custa 2 créditos).",
              )}
            </p>
          </div>
        </details>
      )}

      {/* ── O SUMÁRIO ── */}
      <ol className="space-y-1.5">
        {livro.sumario.map((cap) => (
          <li
            key={cap.indice}
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
              cap.escrito ? "border-white/10 bg-white/[0.03]" : "border-dashed border-white/10"
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                cap.escrito ? "bg-amber-400 text-black" : "bg-white/10 text-white/35"
              }`}
            >
              {cap.escrito ? <Check size={12} /> : cap.numero}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[13.5px] ${cap.escrito ? "font-semibold text-white" : "text-white/40"}`}
              >
                {cap.titulo}
              </span>
              {cap.escrito && (
                <span className="text-[11px] text-white/35">
                  {cap.tamanho.toLocaleString("pt-BR")} {T("caracteres")}
                </span>
              )}
            </span>
            {cap.escrito && (
              <button
                type="button"
                disabled={regerando !== null}
                onClick={() => regerar(cap.indice)}
                title={T("Reescrever com os ajustes atuais — 2 créditos")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[12px] font-bold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {regerando === cap.indice ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                {T("regerar")} <span className="text-amber-300">2</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
