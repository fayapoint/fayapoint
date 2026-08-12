"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Copy, Eye, Link2, Loader2, PenLine, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * O LIVRO DO ALUNO — `/curso/<slug>/meu/livro` (12/08/2026).
 *
 * ## Por que uma página inteira
 *
 * O que a pessoa mandou escrever não existia em lugar nenhum: sem página, sem
 * sumário, sem link. Ricardo: *"como não sai da página nem sei o que acontece
 * com ele, como se comporta, se posso compartilhar ele com outros"*. Um produto
 * que o cliente pagou para existir precisa de endereço, capa e porta de saída.
 *
 * ## O que esta página mostra, e o que ela NÃO mostra
 *
 * Mostra a **camada dele**: a abertura, o exemplo e a tarefa escritos com o
 * contexto do negócio dele. Não mostra a aula original — essa continua no
 * leitor do curso, onde a camada aparece encaixada no lugar certo. Aqui o
 * assunto é o que é dele.
 */

interface Cap {
  indice: number;
  numero: number | null;
  titulo: string;
  escrito: boolean;
  abertura: string;
  exemplo: string;
  tarefa: string;
}

export default function MeuLivro() {
  const T = useT();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [dados, setDados] = useState<{
    curso: { nome: string; capa: string; nivel: string };
    sumario: Cap[];
    escritos: number;
    total: number;
    autor: string;
    compartilhado: { ativo: boolean; token: string; visitas: number } | null;
  } | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState(false);

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
          {dados.escritos} {T("de")} {dados.total} {T("capítulos com a sua cara")}
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href={`/${locale}/curso/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-[14px] font-extrabold text-black hover:opacity-90"
          >
            <BookOpen size={15} /> {T("Ler no curso")}
          </Link>
          {dados.escritos < dados.total && (
            <Link
              href={`/${locale}/curso/${slug}/meu`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-bold text-white hover:bg-white/10"
            >
              <PenLine size={15} /> {T("Escrever os que faltam")}
            </Link>
          )}
        </div>
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

      {/* ─── O SUMÁRIO ─── */}
      <ol className="mt-6 space-y-2">
        {dados.sumario.map((c) => (
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
              <span className={`text-[14.5px] ${c.escrito ? "font-semibold text-white" : "text-white/40"}`}>
                {c.titulo}
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
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
