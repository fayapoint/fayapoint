"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Link2,
  Loader2,
  PenLine,
  RefreshCw,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * O LIVRO DO ALUNO — `/curso/<slug>/meu/livro`.
 *
 * ## O que mudou em 13/08/2026
 *
 * A primeira versão (12/08) resolvia o "o livro não existe em lugar nenhum":
 * deu endereço, capa, sumário e link de leitura. Ricardo abriu, e a queixa
 * seguinte foi outra:
 *
 * > *"deveria ter inclusive quando clicamos no livro, o controle do que foi
 * > feito e o que podemos mudar, exibindo os modelos a serem utilizados suas
 * > imagens"*
 *
 * Ou seja: a página mostrava o RESULTADO e escondia a FÁBRICA. Dá para ler o
 * capítulo, mas não dá para saber com que tom ele foi escrito, quem o
 * escreveu, quando, nem como pedir outro. Um produto que se vende como
 * "escrito para você" precisa deixar o "para você" à vista e ao alcance.
 *
 * Agora a página tem três camadas, nesta ordem:
 *
 *   1. **A capa** — o que é, de quem é, quanto já existe.
 *   2. **A ficha técnica** — com que ajustes foi feito, o que foi pago, e
 *      quem escreveu (`lib/modelos-do-atelie.ts`).
 *   3. **O sumário com controle** — por capítulo: quando, qual modelo,
 *      tamanho, e "regerar este".
 *
 * ⚠️ Os retratos dos modelos ainda são a identidade em gradiente do catálogo,
 * não arte. A arte real é troca de um campo (`imagem`) — ver o handoff.
 */

interface Cap {
  indice: number;
  numero: number | null;
  titulo: string;
  escrito: boolean;
  abertura: string;
  exemplo: string;
  tarefa: string;
  escritoEm: string | null;
  modelo: string | null;
  tamanho: number;
}

interface Opcao {
  id: string;
  rotulo: string;
  descricao: string;
  emoji?: string;
}

interface ModeloNaTela {
  id: string;
  nome: string;
  fabricante: string;
  oQueE: string;
  boaEm: string;
  jeitoDeEscrever: string;
  velocidade: string;
  custo1M: number;
  cores: [string, string];
  imagem?: string;
  capitulos: number;
}

interface Dados {
  curso: { slug: string; nome: string; capa: string; nivel: string };
  sumario: Cap[];
  escritos: number;
  total: number;
  autor: string;
  compartilhado: { ativo: boolean; token: string; visitas: number } | null;
  ajustes: {
    tom: string;
    profundidade: string;
    extensao: string;
    /** ⚠️ Lista, até 3 — ver `Ajustes` em `lib/atelie.ts`. */
    foco: string[];
    narrador: string;
    rotulos: {
      tom?: Opcao;
      profundidade?: Opcao;
      extensao?: Opcao;
      foco?: Opcao[];
      narrador?: { id: string; nome: string } | null;
    };
  };
  opcoes: { tons: Opcao[]; profundidades: Opcao[]; extensoes: Opcao[]; focos: Opcao[] };
  pacote: { id: string; creditos: number; pagoEm: string } | null;
  modelos: ModeloNaTela[];
}

/** O retrato do modelo: a arte quando existe, a identidade do catálogo quando não. */
function Retrato({ m, tamanho = 44 }: { m: ModeloNaTela; tamanho?: number }) {
  if (m.imagem) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={m.imagem}
        alt={m.nome}
        width={tamanho}
        height={tamanho}
        className="shrink-0 rounded-xl object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-xl font-black text-black/80"
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: tamanho * 0.36,
        background: `linear-gradient(135deg, ${m.cores[0]}, ${m.cores[1]})`,
      }}
    >
      {m.nome.slice(0, 2).toUpperCase()}
    </span>
  );
}

function quando(iso: string | null, T: (s: string) => string) {
  if (!iso) return T("sem data");
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function MeuLivro() {
  const T = useT();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [dados, setDados] = useState<Dados | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [regerando, setRegerando] = useState<number | null>(null);
  const [mostrarFicha, setMostrarFicha] = useState(false);

  const buscar = useCallback(async () => {
    const r = await fetch(`/api/user/livro?curso=${encodeURIComponent(slug)}`, {
      credentials: "include",
      headers: getClientAuthHeaders(),
      cache: "no-store",
    });
    if (!r.ok) return;
    setDados(await r.json());
  }, [slug]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const compartilhar = async (acao: "compartilhar" | "parar") => {
    setOcupado(true);
    try {
      const r = await fetch("/api/user/livro", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ curso: slug, acao }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d?.error || T("Não deu para mudar o compartilhamento"));
        return;
      }
      await buscar();
      toast.success(acao === "compartilhar" ? T("Link ligado") : T("Link desligado"));
    } finally {
      setOcupado(false);
    }
  };

  /**
   * Regera UM capítulo. Não cobra em curso já pago — quem garante isso é a
   * rota, não esta tela; aqui a promessa só é REPETIDA, no botão, para que a
   * pessoa não precise adivinhar se clicar custa dinheiro.
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
      if (!r.ok) {
        toast.error(d?.error || T("Não deu para reescrever agora"));
        return;
      }
      if (!d.geradas) {
        toast.error(T("O modelo não respondeu. Nada foi cobrado — tente de novo."));
        return;
      }
      await buscar();
      toast.success(
        d.creditosGastos
          ? `${T("Capítulo reescrito")} — ${d.creditosGastos} ${T("créditos")}`
          : T("Capítulo reescrito, sem cobrança nova."),
      );
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setRegerando(null);
    }
  };

  const faltam = useMemo(() => (dados ? dados.total - dados.escritos : 0), [dados]);

  if (!dados) {
    return (
      <div className="grid min-h-[70dvh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const url =
    dados.compartilhado?.ativo && typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/livro/${dados.compartilhado.token}`
      : "";

  const r = dados.ajustes?.rotulos || {};
  const focos = r.foco || [];
  /**
   * Cada caixinha da ficha: título, o que está valendo, e a explicação curta.
   *
   * ⚠️ "Nenhum" no foco é resposta, não buraco. O livro do Ricardo foi escrito
   * sem foco escolhido, e um campo em branco ali parece defeito da tela quando
   * na verdade é uma escolha com efeito real no texto.
   */
  const fichas: Array<[string, string, string]> = [
    [T("Tom"), r.tom ? `${r.tom.emoji || ""} ${r.tom.rotulo}`.trim() : "—", r.tom?.descricao || ""],
    [
      T("Profundidade"),
      r.profundidade ? `${r.profundidade.emoji || ""} ${r.profundidade.rotulo}`.trim() : "—",
      r.profundidade?.descricao || "",
    ],
    [
      T("Tamanho"),
      r.extensao ? `${r.extensao.emoji || ""} ${r.extensao.rotulo}`.trim() : "—",
      r.extensao?.descricao || "",
    ],
    [
      T("Foco"),
      focos.length ? focos.map((f) => `${f.emoji || ""} ${f.rotulo}`.trim()).join(", ") : T("Nenhum"),
      focos.length ? T("puxa os exemplos para esse lado") : T("os exemplos seguem só a sua persona"),
    ],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">
      <Link
        href={`/${locale}/curso/${slug}/meu`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-white/60 hover:text-white"
      >
        <ArrowLeft size={14} /> {T("Ateliê")}
      </Link>

      {/* ─── A CAPA ─── */}
      <div className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-transparent p-6 sm:p-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
          {T("A sua edição")}
        </p>
        <h1 className="mt-1.5 text-[28px] font-black leading-[1.1] text-white sm:text-[40px]">
          {dados.curso.nome}
        </h1>
        <p className="mt-2 text-[15px] text-white/70">
          {T("Escrito para")} <span className="font-bold text-amber-200">{dados.autor || T("você")}</span> —{" "}
          <span className="font-bold text-white">
            {dados.escritos} {T("de")} {dados.total}
          </span>{" "}
          {T("capítulos com a sua cara")}
        </p>

        {/* A barra: a mesma verdade do estúdio, para quem chega por aqui. */}
        <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
            style={{ width: `${Math.round((dados.escritos / Math.max(1, dados.total)) * 100)}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href={`/${locale}/curso/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-[14px] font-extrabold text-black hover:opacity-90"
          >
            <BookOpen size={15} /> {T("Ler no curso")}
          </Link>
          {faltam > 0 && (
            <Link
              href={`/${locale}/curso/${slug}/meu/escrevendo?pacote=${dados.pacote?.id || "escrito"}`}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-[14px] font-bold text-amber-100 hover:bg-amber-400/20"
            >
              <PenLine size={15} />
              {/* ⚠️ O número no botão é o ponto. "Escrever os que faltam" não
                  diz se faltam 1 ou 15, e foi assim que "1 de 16" passou por
                  pronto. */}
              {dados.pacote
                ? `${T("Continuar — faltam")} ${faltam}, ${T("já pagos")}`
                : `${T("Escrever os")} ${faltam} ${T("que faltam")}`}
            </Link>
          )}
          {/* ⚠️ A porta para MUDAR, ao lado da porta para LER (16/08/2026).
              Esta página mostra como o livro foi feito e não tinha por onde
              mudar nada: a ficha técnica mandava "volte ao Ateliê", e o Ateliê
              é a página de compra. Agora o caminho é direto. */}
          <Link
            href={`/${locale}/curso/${slug}/meu/ajustes`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-bold text-white hover:bg-white/10"
          >
            <SlidersHorizontal size={15} /> {T("Mudar como é escrito")}
          </Link>
        </div>
      </div>

      {/* ─── A FICHA TÉCNICA ─── */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03]">
        <button
          type="button"
          onClick={() => setMostrarFicha((v) => !v)}
          className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
        >
          <SlidersHorizontal size={16} className="shrink-0 text-amber-300" />
          <span className="text-[14px] font-bold text-white">{T("Como este livro foi feito")}</span>
          <span className="hidden truncate text-[12.5px] text-white/40 sm:inline">
            {fichas.map(([, valor]) => valor).filter((v) => v && v !== "—").join(" · ")}
          </span>
          <ChevronDown
            size={16}
            className={`ml-auto shrink-0 text-white/40 transition-transform ${mostrarFicha ? "rotate-180" : ""}`}
          />
        </button>

        {mostrarFicha && (
          <div className="space-y-5 border-t border-white/10 px-4 py-4">
            {/* Os ajustes com que ele foi escrito */}
            <div>
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-amber-300/70">
                {T("Os ajustes deste livro")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {fichas.map(([titulo, valor, nota]) => (
                  <div key={titulo} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                    <p className="text-[10.5px] uppercase tracking-wider text-white/40">{titulo}</p>
                    <p className="mt-0.5 text-[13.5px] font-bold text-white">{valor}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-white/45">{nota}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-white/45">
                {T("Para mudar qualquer um destes — e também quem escreve e quanto emoji entra — use a mesa de ajustes; depois “regerar” no capítulo que quiser refazer com o ajuste novo.")}{" "}
                <Link href={`/${locale}/curso/${slug}/meu/ajustes`} className="font-bold text-amber-300 hover:underline">
                  {T("Abrir a mesa de ajustes")}
                </Link>
              </p>
            </div>

            {/* Quem escreveu */}
            {dados.modelos?.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-amber-300/70">
                  {T("Quem escreveu")}
                </p>
                <div className="space-y-2">
                  {dados.modelos.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <Retrato m={m} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2 text-[13.5px] font-bold text-white">
                          {m.nome}
                          <span className="text-[11.5px] font-normal text-white/40">{m.fabricante}</span>
                          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                            {m.capitulos} {m.capitulos === 1 ? T("capítulo") : T("capítulos")}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">{m.oQueE}</p>
                        <p className="mt-1 text-[12.5px] leading-snug text-white/45">{m.jeitoDeEscrever}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {dados.modelos.length > 1 && (
                  <p className="mt-2 text-[12px] leading-snug text-white/45">
                    {T("Mais de um modelo escreveu este livro. Isso acontece quando um deles falha ou demora — o sistema passa para o próximo em vez de parar. Capítulos de autores diferentes soam um pouco diferentes; “regerar” refaz qualquer um deles.")}
                  </p>
                )}
              </div>
            )}

            {/* O que foi pago */}
            {dados.pacote && (
              <div>
                <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-amber-300/70">
                  {T("O que já está pago")}
                </p>
                <p className="text-[13.5px] text-white/70">
                  <span className="font-bold text-white">{dados.pacote.creditos} {T("créditos")}</span>{" "}
                  {T("em")} {quando(dados.pacote.pagoEm, T)}.{" "}
                  {T("O curso inteiro está incluso: terminar os capítulos que faltam não cobra nada. Reescrever um capítulo já pronto custa 2 créditos.")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── COMPARTILHAR ─── */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Share2 size={16} className="text-amber-300" />
          <p className="text-[14px] font-bold text-white">{T("Mostrar para alguém")}</p>
          {dados.compartilhado?.ativo && (
            <span className="inline-flex items-center gap-1 text-[12px] text-white/45">
              <Eye size={12} /> {dados.compartilhado.visitas} {T("leituras")}
            </span>
          )}
          <button
            type="button"
            disabled={ocupado}
            onClick={() => compartilhar(dados.compartilhado?.ativo ? "parar" : "compartilhar")}
            className={`ml-auto rounded-xl px-3.5 py-2 text-[13px] font-bold transition-colors ${
              dados.compartilhado?.ativo
                ? "border border-white/15 text-white hover:bg-white/10"
                : "bg-amber-400 text-black hover:opacity-90"
            }`}
          >
            {dados.compartilhado?.ativo ? T("Desligar o link") : T("Gerar link de leitura")}
          </button>
        </div>

        {url ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <Link2 size={14} className="shrink-0 text-white/40" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/70">{url}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success(T("Link copiado"));
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-white/20"
            >
              <Copy size={12} /> {T("Copiar")}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-[12.5px] text-white/45">
            {T("Quem abrir o link lê a sua versão — a sua abertura, o seu exemplo, a sua tarefa. A aula original do curso não vai junto.")}
          </p>
        )}
      </div>

      {/* ─── O SUMÁRIO COM CONTROLE ─── */}
      <ol className="mt-6 space-y-2">
        {dados.sumario.map((c) => {
          const ficha = dados.modelos.find((m) => m.id === c.modelo || (c.modelo || "").startsWith(m.id));
          return (
            <li
              key={c.indice}
              className={`overflow-hidden rounded-2xl border ${
                c.escrito ? "border-white/10 bg-white/[0.03]" : "border-dashed border-white/8 bg-transparent"
              }`}
            >
              <button
                type="button"
                disabled={!c.escrito}
                onClick={() => setAberto(aberto === c.indice ? null : c.indice)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                  c.escrito ? "cursor-pointer hover:bg-white/[0.04]" : "cursor-default"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                    c.escrito ? "bg-amber-400 text-black" : "bg-white/10 text-white/35"
                  }`}
                >
                  {c.escrito ? <Check size={12} /> : c.numero}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[14.5px] ${
                      c.escrito ? "font-semibold text-white" : "text-white/40"
                    }`}
                  >
                    {c.titulo}
                  </span>
                  {/* A linha de baixo é a ficha do capítulo: quando, quem,
                      quanto. Sem ela, dois capítulos de tamanhos muito
                      diferentes parecem iguais até serem abertos. */}
                  {c.escrito && (
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-white/40">
                      <span>{quando(c.escritoEm, T)}</span>
                      {ficha && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: `linear-gradient(135deg, ${ficha.cores[0]}, ${ficha.cores[1]})` }}
                          />
                          {ficha.nome}
                        </span>
                      )}
                      <span>{c.tamanho.toLocaleString("pt-BR")} {T("caracteres")}</span>
                    </span>
                  )}
                </span>
                {!c.escrito && (
                  <span className="ml-auto shrink-0 text-[11.5px] text-white/30">{T("ainda não escrito")}</span>
                )}
              </button>

              {aberto === c.indice && c.escrito && (
                <div className="space-y-3 border-t border-white/10 px-4 py-4">
                  {[
                    { r: T("A abertura"), t: c.abertura },
                    { r: T("O exemplo"), t: c.exemplo },
                    { r: T("A tarefa"), t: c.tarefa },
                  ]
                    .filter((b) => b.t)
                    .map((b) => (
                      <div key={b.r}>
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-300/70">{b.r}</p>
                        <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/80">
                          {b.t}
                        </p>
                      </div>
                    ))}

                  <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      disabled={regerando !== null}
                      onClick={() => regerar(c.indice)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      {regerando === c.indice ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      {T("Regerar este capítulo")}
                    </button>
                    <span className="text-[12px] text-white/40">
                      {/* ⚠️ Dizia "sem cobrança nova" e virou torneira aberta:
                          cada clique disparava uma chamada de modelo de graça.
                          Terminar o curso pago continua grátis; REESCREVER o que
                          já existe custa. Ver `curso_regerar_capitulo`. */}
                      {dados.pacote
                        ? T("reescrever um capítulo já pronto custa 2 créditos")
                        : T("escrever este curso cobra o pacote uma única vez")}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
