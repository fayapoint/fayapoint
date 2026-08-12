"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { useT } from "@/i18n/dicionario";

/**
 * A leitura pública de um livro compartilhado — `/livro/<token>`.
 *
 * Sem login: é o endereço que o aluno manda para alguém. A página existe para
 * uma coisa e faz uma coisa — ler a versão dele. No fim, um convite para quem
 * chegou aqui fazer a sua, que é o único jeito de este link também trabalhar
 * para a casa.
 *
 * ⚠️ A aula original NÃO aparece aqui (a rota nem devolve). O que se compartilha
 * é o que é do aluno; o produto da casa continua atrás do login.
 */
export default function LivroPublico() {
  const T = useT();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";
  const token = typeof params?.token === "string" ? params.token : "";

  const [dados, setDados] = useState<{
    autor: string;
    curso: { nome: string; slug: string };
    sumario: Array<{ numero: number | null; titulo: string; abertura: string; exemplo: string; tarefa: string }>;
  } | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/livro-publico/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setErro(d?.error || "Este livro não está disponível");
          return;
        }
        setDados(d);
      })
      .catch(() => setErro("Não deu para abrir o livro"));
  }, [token]);

  if (erro) {
    return (
      <div className="mx-auto grid min-h-[70dvh] max-w-lg place-items-center px-4 text-center">
        <div>
          <p className="text-[17px] font-bold text-white">{T(erro)}</p>
          <Link
            href={`/${locale}/cursos`}
            className="mt-4 inline-block rounded-xl bg-amber-400 px-4 py-2.5 text-[14px] font-extrabold text-black"
          >
            {T("Conhecer os cursos")}
          </Link>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="grid min-h-[70dvh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-24">
      <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-transparent p-6 sm:p-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
          {T("Uma edição pessoal de")} {dados.curso.nome}
        </p>
        <h1 className="mt-1.5 text-[26px] font-black leading-[1.1] text-white sm:text-[36px]">
          {dados.autor ? `${T("A versão de")} ${dados.autor}` : T("Uma versão pessoal")}
        </h1>
        <p className="mt-2 text-[14px] text-white/65">
          {T("Cada capítulo abaixo foi reescrito para o contexto de quem estuda — o mesmo curso, com outro exemplo.")}
        </p>
      </div>

      <ol className="mt-6 space-y-4">
        {dados.sumario.map((c, i) => (
          <li key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/35">
              {T("Capítulo")} {c.numero}
            </p>
            <h2 className="mt-0.5 text-[18px] font-black text-white">{c.titulo}</h2>
            <div className="mt-3 space-y-3">
              {[
                { r: T("A abertura"), t: c.abertura },
                { r: T("O exemplo"), t: c.exemplo },
                { r: T("A tarefa"), t: c.tarefa },
              ]
                .filter((b) => b.t)
                .map((b) => (
                  <div key={b.r}>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-300/70">{b.r}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/80">{b.t}</p>
                  </div>
                ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-5 text-center">
        <BookOpen className="mx-auto text-amber-300" size={22} />
        <p className="mt-2 text-[16px] font-black text-white">{T("Dá para ter a sua versão disto")}</p>
        <p className="mt-1 text-[13.5px] text-white/65">
          {T("O curso é o mesmo para todo mundo. O exemplo, a abertura e a tarefa são escritos com o seu trabalho.")}
        </p>
        <Link
          href={`/${locale}/curso/${dados.curso.slug}`}
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-[14px] font-extrabold text-black hover:opacity-90"
        >
          {T("Ver este curso")}
        </Link>
      </div>
    </div>
  );
}
