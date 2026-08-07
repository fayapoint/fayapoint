"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";

/**
 * A ponte para o Ateliê — o que este bloco virou em 03/08/2026.
 *
 * ## O que ele era, e por que mudou
 *
 * Era o produto inteiro: um `<select>` nativo do navegador com os cursos do
 * aluno e um botão de corpo 12 escrito "Escrever para mim", dentro de uma aba
 * do Perfil Social. Sem preço, sem amostra, sem explicar o que sairia — e sem
 * nenhum outro lugar do site mencionando que aquilo existia. Ricardo, dono do
 * site, tropeçou nele por acaso: *"AGORA que eu percebi que ele estava ali...
 * ESTE É O CORAÇÃO DO SITE. Está jogado, como se não fosse nada."*
 *
 * A funcionalidade não morreu, mudou de casa: agora mora em
 * `/curso/<slug>/meu`, o Ateliê, onde há espaço para a amostra grátis, o
 * medidor da persona e o orçamento em créditos. Este bloco fica como PONTE —
 * quem estava acostumado a achar a personalização aqui continua achando o
 * caminho, e quem nunca soube que ela existia descobre.
 *
 * O `<select>` sumiu junto: escolher curso é uma decisão que merece a capa e o
 * estado de cada um, não uma lista de texto do sistema operacional.
 */

interface CursoDoAluno {
  slug: string;
  titulo: string;
}

export default function CursoComSuaCara({ token }: { token: string }) {
  const T = useT();
  const [cursos, setCursos] = useState<CursoDoAluno[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/curso-personalizado", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setCursos(Array.isArray(data.cursos) ? data.cursos : []);
        }
      } catch {
        /* sem lista o bloco simplesmente não aparece */
      } finally {
        setCarregando(false);
      }
    })();
  }, [token]);

  if (carregando || !cursos.length) return null;

  return (
    <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        <Sparkles size={14} className="text-amber-400" />  {T("Seu curso, com a sua cara")}
      </h4>
      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
        
        {T("Tudo o que você respondeu aqui vira abertura, exemplo e tarefa dentro dos seus cursos. Veja\r\n        uma amostra grátis antes de gastar qualquer crédito.")}
      </p>

      <div className="mt-3 space-y-1.5">
        {cursos.slice(0, 4).map((c) => (
          <Link
            key={c.slug}
            href={`/curso/${c.slug}/meu`}
            className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-[12px] font-semibold transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.06]"
          >
            <BookOpen size={13} className="shrink-0 text-amber-400/80" />
            <span className="min-w-0 flex-1 truncate">{T(c.titulo)}</span>
            <ArrowRight size={13} className="shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {cursos.length > 4 && (
        <p className="mt-2 text-[10.5px] text-muted-foreground">
          
          {T("e mais")} {cursos.length - 4}  {T("— todos personalizáveis pela página de cada curso.")}
        </p>
      )}
    </div>
  );
}
