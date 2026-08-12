"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * O ESTÚDIO DE ESCRITA — `/curso/<slug>/meu/escrevendo` (12/08/2026).
 *
 * ## O defeito que ele corrige
 *
 * O botão "Escrever o meu curso" disparava trinta chamadas em segundo plano e
 * devolvia um `toast`. Ricardo, no primeiro teste de ponta a ponta:
 *
 * > *"foi uma experiência muito ruim, não aconteceu nada, não fui para uma tela
 * > especial que ia me dando a impressão de juntar meus dados e ir criando algo
 * > único e especial, não fui levado a lugar nenhum, não apareceu nem um link"*
 *
 * A coisa mais cara do produto acontecia sem nada para olhar. Aqui ela tem
 * palco: o sumário inteiro na tela desde o primeiro segundo, cada capítulo
 * acendendo quando fica pronto, e no fim uma porta para o livro.
 *
 * ## O que é verdade nesta tela
 *
 * O progresso é **medido**, não animado: cada volta do laço pergunta ao
 * servidor o que já existe e a lista reflete o banco. Barra que anda sozinha
 * enquanto o servidor falha é a mentira mais comum deste tipo de tela — e a
 * pessoa só descobre no fim, quando tem menos paciência para perdoar.
 *
 * ⚠️ O laço vive no CLIENTE de propósito: 20s por capítulo, 30 capítulos, e
 * qualquer função de servidor morreria no meio. Cada chamada escreve um punhado
 * e devolve quantos faltam; fechar a aba não perde nada, porque a rota é
 * idempotente e retoma de onde parou.
 */

interface Item {
  indice: number;
  numero: number | null;
  titulo: string;
  escrito: boolean;
}

export default function Escrevendo() {
  const T = useT();
  const params = useParams();
  const router = useRouter();
  const busca = useSearchParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const pacote = busca.get("pacote") || "escrito";

  const [sumario, setSumario] = useState<Item[]>([]);
  const [nomeCurso, setNomeCurso] = useState("");
  const [rodando, setRodando] = useState(false);
  const [terminou, setTerminou] = useState(false);
  const [gasto, setGasto] = useState(0);
  const [falhas, setFalhas] = useState(0);
  const [linha, setLinha] = useState("");
  const comecou = useRef(false);

  const buscarSumario = useCallback(async () => {
    const r = await fetch(`/api/user/livro?curso=${encodeURIComponent(slug)}`, {
      credentials: "include",
      headers: getClientAuthHeaders(),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = await r.json();
    setSumario(d.sumario || []);
    setNomeCurso(d.curso?.nome || "");
    return d;
  }, [slug]);

  /**
   * ⚠️ O sumário se atualiza SOZINHO a cada 4s enquanto o laço roda.
   *
   * Medido em 12/08: o servidor já tinha gravado 2 capítulos e a tela ainda
   * mostrava zero, porque só recarregava quando o lote inteiro respondia — e um
   * lote leva bem mais de um minuto. A pessoa fica encarando "0 de 16" enquanto
   * o trabalho que ela pagou acontece: exatamente a sensação de "não aconteceu
   * nada" que esta tela existe para acabar.
   */
  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => {
      buscarSumario();
    }, 4000);
    return () => clearInterval(id);
  }, [rodando, buscarSumario]);

  useEffect(() => {
    // React 18 monta duas vezes em desenvolvimento; sem esta trava o laço
    // dispararia duas vezes e o aluno pagaria a conta do modo estrito.
    if (comecou.current) return;
    comecou.current = true;

    (async () => {
      const inicial = await buscarSumario();
      if (!inicial) {
        toast.error(T("Não deu para abrir o seu livro"));
        return;
      }
      if (inicial.escritos >= inicial.total && inicial.total > 0) {
        setTerminou(true);
        return;
      }
      setRodando(true);

      let gastoTotal = 0;
      let erros = 0;
      try {
        for (let voltas = 0; voltas < 40; voltas++) {
          setLinha(T("Lendo o seu perfil e escrevendo o próximo trecho…"));
          const r = await fetch("/api/user/curso-personalizado", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
            body: JSON.stringify({ curso: slug, pacote }),
          });
          const d = await r.json();

          if (r.status === 402) {
            toast.error(d.error);
            break;
          }
          if (r.status === 422) {
            toast.error(T("Complete o perfil primeiro."));
            break;
          }
          if (!r.ok) {
            toast.error(d?.error || T("Não deu para escrever agora"));
            break;
          }

          gastoTotal += d.creditosGastos || 0;
          erros += d.erros?.length || 0;
          setGasto(gastoTotal);
          setFalhas(erros);
          await buscarSumario();

          if (!d.restantes) break;
          if (!d.geradas) {
            toast.error(T("Alguns capítulos não puderam ser escritos agora."));
            break;
          }
        }
      } catch {
        toast.error(T("Erro de rede"));
      } finally {
        setRodando(false);
        setTerminou(true);
        setLinha("");
        await buscarSumario();
      }
    })();
  }, [slug, pacote, buscarSumario, T]);

  const escritos = sumario.filter((s) => s.escrito).length;
  const total = sumario.length || 1;
  const pct = Math.round((escritos / total) * 100);

  return (
    /* ⚠️ `pb-32`: a barra do fim é `sticky` e com padding menor ela deitava em
       cima do último capítulo da lista. */
    <div className="mx-auto min-h-[100dvh] max-w-5xl px-4 pb-32 pt-24">
      <header className="mb-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
          {T("Estúdio de escrita")}
        </p>
        <h1 className="mt-1 text-[26px] font-black leading-tight text-white sm:text-[34px]">
          {terminou && !rodando
            ? T("O seu livro está pronto")
            : `${T("Escrevendo")} ${nomeCurso} ${T("para você")}`}
        </h1>
        <p className="mt-1.5 text-[14px] text-white/60">
          {rodando
            ? T("Pode deixar esta aba aberta. Se fechar, o que já foi escrito continua seu e a gente retoma de onde parou.")
            : T("Cada capítulo abaixo foi reescrito com o que você contou sobre o seu trabalho.")}
        </p>
      </header>

      {/* A barra é a soma do que EXISTE no banco, não um relógio. */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-end justify-between gap-3">
          <p className="text-[13px] font-bold text-white">
            <span className="text-[22px] tabular-nums text-amber-300">{escritos}</span>
            <span className="text-white/60">
              {" "}
              {T("de")} {sumario.length} {T("capítulos escritos")}
            </span>
          </p>
          {gasto > 0 && (
            <p className="text-[12px] text-white/45">
              −{gasto} {T("créditos")}
            </p>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {linha && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-amber-200/80">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {linha}
          </p>
        )}
        {falhas > 0 && (
          <p className="mt-2 text-[12.5px] text-white/50">
            {falhas} {T("capítulo(s) não puderam ser escritos — e não foram cobrados.")}
          </p>
        )}
      </div>

      <ol className="space-y-1.5">
        {sumario.map((c) => (
          <li
            key={c.indice}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
              c.escrito
                ? "border-amber-400/25 bg-amber-400/[0.07]"
                : "border-white/8 bg-white/[0.02]"
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                c.escrito ? "bg-amber-400 text-black" : "bg-white/10 text-white/40"
              }`}
            >
              {c.escrito ? <Check size={13} /> : c.numero}
            </span>
            <span className={`text-[14px] ${c.escrito ? "font-semibold text-white" : "text-white/45"}`}>
              {c.titulo}
            </span>
            {c.escrito && <Sparkles size={13} className="ml-auto shrink-0 text-amber-300" />}
          </li>
        ))}
      </ol>

      {terminou && escritos > 0 && (
        <div className="sticky bottom-4 mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/30 bg-[#17130b] p-4 shadow-2xl">
          <BookOpen className="text-amber-300" size={20} />
          <p className="text-[14px] font-bold text-white">{T("Ele já tem endereço próprio.")}</p>
          <Link
            href={`/${locale}/curso/${slug}/meu/livro`}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-[14px] font-extrabold text-black transition-opacity hover:opacity-90"
          >
            {T("Abrir o meu livro")} <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {terminou && escritos === 0 && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/curso/${slug}/meu`)}
          className="mt-6 rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-bold text-white hover:bg-white/10"
        >
          {T("Voltar ao Ateliê")}
        </button>
      )}
    </div>
  );
}
