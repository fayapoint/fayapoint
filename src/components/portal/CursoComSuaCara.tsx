"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Sparkles, RefreshCw, AlertTriangle, Check, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * O curso escrito para ELE — a recompensa de ter preenchido o dossiê.
 *
 * Isto mora na aba Persona de propósito. O aluno acabou de responder o que o
 * público dele sente e o que ele já tentou com IA; o pagamento por esse
 * trabalho não pode ser só um post melhor. É aqui que ele vê a aula do curso
 * ganhar a abertura, o exemplo e a tarefa do negócio dele.
 *
 * ## A recusa é parte do produto
 *
 * Abaixo de uma confiança mínima o servidor devolve 422 com as perguntas que
 * faltam (`/api/user/curso-personalizado`). Esta tela mostra essas perguntas
 * em vez de um erro genérico — porque um texto que AFIRMA falar do negócio da
 * pessoa e fala de um negócio genérico é pior do que não personalizar: quebra
 * a promessa na frente dela.
 */

interface Faltando {
  dimensao: string;
  campo: string;
  pergunta: string;
  ganho: string;
}

interface Estado {
  capitulosComCamada: number;
  confianca: number;
  minima: number;
  pronto: boolean;
  desatualizada: boolean;
  faltando: Faltando[];
}

interface CursoDoAluno {
  slug: string;
  titulo: string;
}

export default function CursoComSuaCara({ token }: { token: string }) {
  const [cursos, setCursos] = useState<CursoDoAluno[]>([]);
  const [escolhido, setEscolhido] = useState<string>("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [bloqueio, setBloqueio] = useState<{ mensagem: string; faltando: Faltando[] } | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/curso-personalizado", { credentials: "include", headers, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const lista: CursoDoAluno[] = Array.isArray(data.cursos) ? data.cursos : [];
          setCursos(lista);
          if (lista.length) setEscolhido(lista[0].slug);
        }
      } catch {
        /* sem lista o bloco simplesmente não aparece */
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consultar = useCallback(
    async (slug: string) => {
      if (!slug) return;
      try {
        const res = await fetch(`/api/user/curso-personalizado?curso=${encodeURIComponent(slug)}`, {
          credentials: "include",
          headers,
          cache: "no-store",
        });
        if (res.ok) setEstado(await res.json());
      } catch {
        /* silencioso */
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [token]
  );

  useEffect(() => {
    if (escolhido) consultar(escolhido);
  }, [escolhido, consultar]);

  const gerar = async (refazer: boolean) => {
    setGerando(true);
    setBloqueio(null);
    try {
      const res = await fetch("/api/user/curso-personalizado", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ curso: escolhido, refazer }),
      });
      const data = await res.json();

      if (res.status === 422) {
        setBloqueio({ mensagem: data.error, faltando: data.faltando || [] });
        return;
      }
      if (!res.ok) {
        toast.error(data?.error || "Não deu para personalizar agora");
        return;
      }

      toast.success(
        data.geradas > 0
          ? `${data.geradas} ${data.geradas === 1 ? "capítulo reescrito" : "capítulos reescritos"} para você 📘`
          : "Já estava tudo em dia"
      );
      await consultar(escolhido);
    } catch {
      toast.error("Erro de rede");
    } finally {
      setGerando(false);
    }
  };

  if (carregando) return null;
  if (!cursos.length) return null;

  return (
    <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-4">
      <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        <BookOpen size={14} className="text-amber-400" /> Seu curso, com a sua cara
      </h4>
      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
        Cada capítulo ganha uma abertura, um exemplo e uma tarefa escritos para o SEU negócio. A aula original
        continua intacta — a camada envolve o conteúdo, não o substitui.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={escolhido}
          onChange={(e) => setEscolhido(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber-400/60 focus:outline-none"
        >
          {cursos.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.titulo}
            </option>
          ))}
        </select>

        <button
          onClick={() => gerar(estado?.desatualizada === true)}
          disabled={gerando || !escolhido}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-2 text-[12px] font-extrabold text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {gerando ? <Loader2 size={13} className="animate-spin" /> : estado?.capitulosComCamada ? <RefreshCw size={13} /> : <Sparkles size={13} />}
          {gerando ? "Escrevendo…" : estado?.capitulosComCamada ? "Atualizar" : "Escrever para mim"}
        </button>
      </div>

      {estado && !bloqueio && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {estado.capitulosComCamada > 0 ? (
            <>
              <Check size={12} className="text-emerald-400" />
              {estado.capitulosComCamada} {estado.capitulosComCamada === 1 ? "capítulo já está" : "capítulos já estão"} no seu contexto
              {estado.desatualizada && <span className="text-amber-400"> · sua persona mudou desde então</span>}
            </>
          ) : (
            <>Confiança da persona: {estado.confianca}% (mínimo {estado.minima}%)</>
          )}
        </p>
      )}

      {bloqueio && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-3">
          <p className="flex items-start gap-1.5 text-[11.5px] font-bold text-amber-300">
            <AlertTriangle size={13} className="mt-[1px] shrink-0" />
            {bloqueio.mensagem}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Responda no painel ao lado — bastam uma ou duas:
          </p>
          <ul className="mt-1.5 space-y-1">
            {bloqueio.faltando.slice(0, 3).map((f) => (
              <li key={f.campo} className="flex items-start gap-1.5 text-[11px] text-white/70">
                <ArrowRight size={11} className="mt-[3px] shrink-0 text-amber-400/70" />
                <span>
                  <strong className="text-white/85">{f.dimensao}:</strong> {f.pergunta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
