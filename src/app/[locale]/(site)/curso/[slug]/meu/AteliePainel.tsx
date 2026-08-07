"use client";
import { useT } from "@/i18n/dicionario";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Coins,
  Loader2,
  Lock,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getClientAuthHeaders } from "@/lib/client-auth";
import type { IdOpcao, Orcamento } from "@/lib/atelie";

/**
 * O Ateliê — a página onde o curso vira o curso DELE (03/08/2026).
 *
 * ## O que esta tela existe para desfazer
 *
 * A personalização é a razão de existir do site e morava num `<select>` nativo
 * escondido dentro de uma aba do Perfil Social, com um botão de corpo 12
 * escrito "Escrever para mim". Ricardo descobriu por acaso, sendo o dono:
 * *"AGORA que eu percebi que ele estava ali... ESTE É O CORAÇÃO DO SITE. Está
 * jogado, como se não fosse nada."*
 *
 * ## As quatro perguntas, nesta ordem
 *
 * A ordem não é estética — é a ordem em que a dúvida aparece na cabeça de quem
 * chega, e responder fora de ordem custa a venda:
 *
 * 1. **"Isso é bom?"** → a amostra grátis, antes e depois, lado a lado. É a
 *    única seção acima da dobra porque é a única que convence.
 * 2. **"Vai falar de MIM mesmo?"** → o medidor das sete dimensões, com o que
 *    já sabemos e o quanto cada resposta que falta ainda vale.
 * 3. **"Quanto custa?"** → o orçamento, com a conta à mostra e o saldo ao lado.
 * 4. **"E se eu não tiver crédito?"** → o caminho, nunca o beco.
 *
 * Nada aqui gasta crédito sem um clique explícito no botão que diz o preço.
 */

interface Faltando {
  campo: string;
  pergunta: string;
  ganho: string;
}

interface Dimensao {
  id: string;
  titulo: string;
  paraQue: string;
  confianca: number;
  conhecido: Array<{ rotulo: string; valor: string }>;
  faltando: Faltando[];
}

interface Dados {
  curso: {
    slug: string;
    titulo: string;
    nomeCompleto: string;
    capa: string | null;
    nivel: string | null;
    ferramenta: string | null;
    capitulos: number;
  };
  persona: {
    confianca: number;
    minima: number;
    qualidade: string;
    resumo: string;
    calibre: "insuficiente" | "basico" | "bom" | "afiado";
    titulo: string;
    frase: string;
    dimensoes: Dimensao[];
  };
  camada: { capitulos: number; desatualizados: number; completo: boolean };
  amostra: {
    tituloCapitulo: string;
    original: string;
    abertura: string;
    exemplo: string;
    tarefa: string;
    confianca: number;
    envelheceu: boolean;
  } | null;
  amostraDisponivel: { capitulo: number; titulo: string; numero: number } | null;
  creditos: { saldo: number; mensal: number; comprado: number };
  orcamento: Orcamento;
  plano: string;
  podeGastar: boolean;
  temNoAcervo: boolean;
}

const TOM_CALIBRE: Record<Dados["persona"]["calibre"], { cor: string; barra: string }> = {
  insuficiente: { cor: "text-rose-300 border-rose-400/30 bg-rose-500/10", barra: "bg-rose-400" },
  basico: { cor: "text-amber-300 border-amber-400/30 bg-amber-500/10", barra: "bg-amber-400" },
  bom: { cor: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10", barra: "bg-cyan-400" },
  afiado: { cor: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10", barra: "bg-emerald-400" },
};

export default function AteliePainel({ slug, locale }: { slug: string; locale: string }) {
  const T = useT();
  const router = useRouter();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhidas, setEscolhidas] = useState<IdOpcao[]>(["texto"]);
  const [gerandoAmostra, setGerandoAmostra] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const buscar = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/user/atelie?curso=${encodeURIComponent(slug)}&opcoes=${escolhidas.join(",")}`,
        { credentials: "include", headers: getClientAuthHeaders(), cache: "no-store" },
      );
      if (r.status === 401) {
        router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/curso/${slug}/meu`)}`);
        return;
      }
      const d = await r.json();
      if (!r.ok) {
        setErro(d?.error || "Não deu para abrir o Ateliê");
        return;
      }
      setDados(d);
    } catch {
      setErro(T("Erro de rede"));
    }
  }, [slug, locale, escolhidas, router]);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  const gerarAmostra = async (refazer = false) => {
    setGerandoAmostra(true);
    try {
      const r = await fetch("/api/user/atelie", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ curso: slug, refazer }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d?.error || "Não deu para escrever a amostra");
        return;
      }
      await buscar();
      if (!d.reaproveitada) toast.success(T("Pronto — este é o seu capítulo 📘"));
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setGerandoAmostra(false);
    }
  };

  /**
   * O laço de lotes — e por que ele vive no cliente.
   *
   * ⚠️ Medido em 03/08: **20 segundos por capítulo**. Um curso de 30 numa
   * requisição só levaria dez minutos contra um teto de cinco — a função
   * morreria na metade e a pessoa veria um erro de rede sem saber que metade
   * do curso já tinha sido escrita.
   *
   * Agora cada chamada escreve um punhado (o servidor faz esses em paralelo) e
   * devolve quantos faltam; aqui a gente chama de novo até zerar. Três ganhos
   * de uma vez: nenhuma requisição chega perto do teto, a barra mostra
   * progresso REAL em vez de uma estimativa que mente, e fechar a aba no meio
   * não perde nada — a idempotência retoma de onde parou.
   *
   * `voltas` é uma trava de segurança: se o servidor parasse de progredir, um
   * `while (restantes > 0)` viraria um laço infinito de requisições pagas.
   */
  const gerar = async () => {
    if (!dados) return;
    setGerando(true);
    setProgresso(0);

    const alvo = Math.max(1, dados.orcamento.capitulos - dados.camada.capitulos);
    let feitas = 0;
    let gastoTotal = 0;
    let falhas = 0;

    try {
      for (let voltas = 0; voltas < 40; voltas++) {
        const r = await fetch("/api/user/curso-personalizado", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
          // O tamanho do lote é decisão do SERVIDOR (medido: 2 = 12s, 4 = 41s
          // por causa do estrangulamento do provedor). O cliente não manda o
          // número para não haver dois lugares definindo o mesmo limite.
          body: JSON.stringify({ curso: slug }),
        });
        const d = await r.json();

        if (r.status === 402) {
          toast.error(d.error);
          break;
        }
        if (r.status === 422) {
          toast.error(T("Complete o perfil primeiro — role até o medidor."));
          break;
        }
        if (!r.ok) {
          toast.error(d?.error || "Não deu para gerar agora");
          break;
        }

        feitas += d.geradas || 0;
        gastoTotal += d.creditosGastos || 0;
        falhas += d.erros?.length || 0;
        setProgresso(Math.min(99, (feitas / alvo) * 100));

        // Nada escrito e nada restando: acabou. Nada escrito mas ainda
        // restando: o lote inteiro falhou, e insistir só queimaria chamadas.
        if (!d.restantes) break;
        if (!d.geradas) {
          toast.error(T("Alguns capítulos não puderam ser escritos agora."));
          break;
        }
      }

      setProgresso(100);
      if (feitas > 0) {
        toast.success(
          `${feitas} ${feitas === 1 ? "capítulo escrito" : "capítulos escritos"} para você · −${gastoTotal} créditos`,
        );
      }
      if (falhas > 0) {
        toast(`${falhas} capítulo(s) falharam e não foram cobrados.`, { icon: "⚠️" });
      }
      await buscar();
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setGerando(false);
    }
  };

  const alternar = (id: IdOpcao) =>
    setEscolhidas((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /**
   * Quanto a confiança SOBE se esta dimensão for completada.
   *
   * Não é chute: `montarDossie` calcula a confiança como a média simples das
   * sete dimensões, então levar uma delas a 100 acrescenta exatamente
   * `(100 − atual) / 7` pontos ao total. Mostrar esse número transforma o
   * painel de cobrança em proposta — "responda isto e ganhe 8 pontos" é uma
   * frase que a pessoa consegue avaliar; "complete seu perfil" não é.
   */
  const ganhoDe = (d: Dimensao) => Math.round((100 - d.confianca) / 7);

  const dimensoesOrdenadas = useMemo(
    () => (dados ? [...dados.persona.dimensoes].sort((a, b) => a.confianca - b.confianca) : []),
    [dados],
  );

  if (erro) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-lg font-bold">{T(erro)}</p>
        <Link href={`/${locale}/curso/${slug}`} className="mt-4 inline-block text-amber-400 hover:underline">
          
          {T("Voltar para o curso")}
        </Link>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-white/5" />
          <div className="h-48 rounded-2xl bg-white/5" />
          <div className="h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  const { curso, persona, camada, amostra, creditos, orcamento } = dados;
  const tom = TOM_CALIBRE[persona.calibre];
  const podePersonalizar = persona.confianca >= persona.minima;
  const custoTexto = orcamento.itens.find((i) => i.id === "texto");
  const total = orcamento.total;
  const faltamCreditos = Math.max(0, total - creditos.saldo);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-24 sm:px-6">
      {/* ═══ HERÓI ═══ */}
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}/cursos`} className="hover:text-white">{T("Cursos")}</Link>
        <ChevronRight size={14} />
        <Link href={`/${locale}/curso/${curso.slug}`} className="hover:text-white">{T(curso.titulo)}</Link>
        <ChevronRight size={14} />
        <span className="text-amber-400">{T("O seu")}</span>
      </div>

      <div className="grid gap-6 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.09] via-transparent to-violet-500/[0.06] p-5 sm:p-7 md:grid-cols-[150px_1fr]">
        {curso.capa && (
          <div className="relative mx-auto aspect-[720/1040] w-[150px] overflow-hidden rounded-xl shadow-2xl shadow-black/60 md:mx-0">
            <Image src={curso.capa} alt={T(curso.titulo)} fill className="object-cover" sizes="150px" unoptimized />
          </div>
        )}
        <div className="min-w-0">
          <Badge className="mb-2 border-amber-400/30 bg-amber-500/15 text-[10px] text-amber-200">
            <Wand2 size={11} className="mr-1" />  {T("ATELIÊ")}
          </Badge>
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">
            O <span className="text-amber-400">{T("seu")}</span> {T(curso.titulo)}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Os {curso.capitulos}  {T("capítulos deste curso, reescritos para o seu negócio — cada um com uma\n            abertura, um exemplo e uma tarefa no seu contexto. A aula original continua intacta: a\n            camada envolve o conteúdo, não o substitui.")}
          </p>
          <p className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs italic text-white/70">
            {T(persona.resumo)}
          </p>
        </div>
      </div>

      {/* ═══ 1. A PROVA ═══ */}
      <section className="mt-8">
        <Cabecalho
          numero={1}
          icone={<Sparkles size={15} className="text-white" />}
          cor="from-amber-500 to-yellow-600"
          titulo="Veja antes de gastar"
          sub="Um capítulo escrito para você, de graça. Nenhum crédito é usado aqui."
        />

        {!amostra ? (
          <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-500/[0.04] p-6 text-center sm:p-10">
            <p className="mx-auto max-w-lg text-sm text-muted-foreground">
              
              {T("Escrevemos o capítulo")}{" "}
              <strong className="text-white">
                {dados.amostraDisponivel?.titulo || "de amostra"}
              </strong>{" "}
              
              {T("com o que já sabemos sobre você, e mostramos lado a lado com o original. Depois você\n              decide se vale.")}
            </p>
            <Button
              onClick={() => gerarAmostra(false)}
              disabled={gerandoAmostra || !dados.amostraDisponivel}
              className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-500 font-extrabold text-black hover:opacity-90"
              size="lg"
            >
              {gerandoAmostra ? (
                <>
                  <Loader2 size={17} className="mr-2 animate-spin" />  {T("Escrevendo o seu capítulo…")}
                </>
              ) : (
                <>
                  <Wand2 size={17} className="mr-2" />  {T("Ver com a minha cara — grátis")}
                </>
              )}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">Leva uns 10 segundos.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  
                  {T("Como todo mundo lê")}
                </p>
                <p className="text-sm leading-relaxed text-white/55">{T(amostra.original)}…</p>
              </div>

              <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles size={12} />  {T("Como VOCÊ vai ler")}
                </p>
                {/* Os três rótulos são exatamente os que `montarBloco` injeta no
                    leitor. A amostra tem que parecer o produto, não um cartaz
                    sobre o produto. */}
                <div className="space-y-3 text-sm leading-relaxed">
                  <Peca emoji="🎯" titulo="Por que isto muda o seu jogo" texto={T(amostra.abertura)} />
                  <Peca emoji="🧩" titulo="No seu contexto" texto={T(amostra.exemplo)} />
                  <Peca emoji="✍️" titulo="Sua vez" texto={T(amostra.tarefa)} />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                
                {T("Escrito com")} <strong className="text-white">{amostra.confianca}%</strong>  {T("de você")}
                {amostra.confianca < 75 && T(" — quanto mais eu souber, mais específico isso fica")}.
              </p>
              {amostra.envelheceu && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => gerarAmostra(true)}
                  disabled={gerandoAmostra}
                  className="border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
                >
                  {gerandoAmostra ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Wand2 size={13} className="mr-1.5" />}
                  
                  {T("Seu perfil mudou — refazer de graça")}
                </Button>
              )}
            </div>
          </>
        )}
      </section>

      {/* ═══ 2. O MEDIDOR ═══ */}
      <section className="mt-10">
        <Cabecalho
          numero={2}
          icone={<Target size={15} className="text-white" />}
          cor="from-violet-500 to-purple-600"
          titulo="O quanto eu te conheço"
          sub="Cada resposta muda o texto que sai. Aqui está o que já sei e o que ainda vale perguntar."
        />

        <div className={cn("rounded-2xl border p-4 sm:p-5", tom.cor)}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-base font-black">{T(persona.titulo)}</p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed opacity-80">{T(persona.frase)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-black tabular-nums">{persona.confianca}%</p>
              <p className="text-[10px] uppercase tracking-wider opacity-70">{T(persona.qualidade)}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
            <div className={cn("h-full rounded-full transition-all duration-700", tom.barra)} style={{ width: `${persona.confianca}%` }} />
          </div>
          {!podePersonalizar && (
            <p className="mt-2 text-[11px] opacity-80">
              
              {T("Mínimo para personalizar:")} {persona.minima}%. Faltam {persona.minima - persona.confianca}  {T("pontos.")}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {dimensoesOrdenadas.map((d) => {
            const ganho = ganhoDe(d);
            return (
              <div key={d.id} className="rounded-xl border border-border bg-card/60 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{T(d.titulo)}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{T(d.paraQue)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-black tabular-nums text-white/70">{d.confianca}%</span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      d.confianca >= 60 ? "bg-emerald-400" : d.confianca >= 30 ? "bg-amber-400" : "bg-rose-400",
                    )}
                    style={{ width: `${Math.max(2, d.confianca)}%` }}
                  />
                </div>

                {d.conhecido.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.conhecido.map((c) => (
                      <span
                        key={c.rotulo}
                        className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200"
                      >
                        <Check size={9} className="mr-0.5 inline" />
                        {c.valor.length > 34 ? `${c.valor.slice(0, 34)}…` : c.valor}
                      </span>
                    ))}
                  </div>
                )}

                {d.faltando.length > 0 && (
                  <div className="mt-2.5 border-t border-white/5 pt-2">
                    {d.faltando.map((f) => (
                      <div key={f.campo} className="mb-1.5 last:mb-0">
                        <p className="text-[11.5px] font-semibold text-white/85">{T(f.pergunta)}</p>
                        <p className="text-[10.5px] leading-snug text-muted-foreground">{T(f.ganho)}</p>
                      </div>
                    ))}
                    {ganho > 0 && (
                      <p className="mt-1 text-[10px] font-bold text-violet-300">
                        Completar isto vale +{ganho}  {T("pontos de precisão")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Link href={`/${locale}/portal?tab=social`}>
          <Button variant="outline" className="mt-4 w-full border-violet-400/40 text-violet-200 hover:bg-violet-500/10" size="lg">
            
            {T("Responder no Perfil Social")}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </section>

      {/* ═══ 3. O ORÇAMENTO ═══ */}
      <section className="mt-10">
        <Cabecalho
          numero={3}
          icone={<Coins size={15} className="text-white" />}
          cor="from-emerald-500 to-teal-600"
          titulo="Quanto custa o seu"
          sub="A conta inteira à mostra, antes de qualquer clique que gaste crédito."
        />

        <div className="space-y-2.5">
          {orcamento.itens.map((item) => {
            const marcada = escolhidas.includes(item.id);
            const travada = item.emBreve || item.jaFeito;
            return (
              <button
                key={item.id}
                onClick={() => !travada && alternar(item.id)}
                disabled={travada}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                  travada
                    ? "cursor-default border-white/8 bg-white/[0.02] opacity-60"
                    : marcada
                      ? "border-emerald-400/40 bg-emerald-500/[0.07]"
                      : "border-border bg-card/60 hover:border-white/20",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    marcada && !travada ? "border-emerald-400 bg-emerald-500" : "border-white/25",
                  )}
                >
                  {item.jaFeito ? (
                    <Check size={12} className="text-emerald-300" />
                  ) : item.emBreve ? (
                    <Lock size={11} className="text-white/40" />
                  ) : marcada ? (
                    <Check size={12} className="text-black" />
                  ) : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{T(item.titulo)}</strong>
                    {item.emBreve && (
                      <Badge className="border-white/15 bg-white/5 text-[9px] text-white/60">Em breve</Badge>
                    )}
                    {item.jaFeito && !item.emBreve && (
                      <Badge className="border-emerald-400/30 bg-emerald-500/10 text-[9px] text-emerald-300">
                        
                        {T("Já feito")}
                      </Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                    {T(item.descricao)}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-white/45">{T(item.conta)}</span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-base font-black tabular-nums">
                    {item.jaFeito ? "—" : item.creditos}
                  </span>
                  {!item.jaFeito && (
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">
                      
                      {T("créditos")}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* O saldo e o total, um do lado do outro — a conta que decide o clique */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{T("Seu saldo")}</p>
              <p className="text-xl font-black tabular-nums">
                {creditos.saldo} <span className="text-xs font-normal text-muted-foreground">{T("créditos")}</span>
              </p>
              {/* 1 crédito = R$1. Repetir o valor em reais ao lado do número é
                  o que torna o preço julgável — "32 créditos" não diz nada a
                  quem chegou hoje; "R$32" diz tudo. */}
              <p className="text-[10px] text-muted-foreground">
                = R$ {creditos.saldo}
                {creditos.comprado > 0 && ` · ${creditos.mensal} do plano + ${creditos.comprado} comprados`}
              </p>
            </div>
            <ArrowRight size={18} className="hidden text-muted-foreground sm:block" />
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{T("Este curso")}</p>
              <p className={cn("text-xl font-black tabular-nums", faltamCreditos > 0 ? "text-rose-300" : "text-emerald-300")}>
                −{total}
              </p>
              <p className="text-[10px] text-muted-foreground">
                = R$ {total} · sobram {Math.max(0, creditos.saldo - total)}
              </p>
            </div>
          </div>

          {!dados.podeGastar && (
            <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/[0.07] px-3 py-2 text-[11px] text-amber-200">
              
              {T("Este curso ainda não está no seu acervo. Adicione-o primeiro — personalizar capítulos\n              que você não consegue abrir gastaria seu crédito à toa.")}
            </p>
          )}

          {camada.capitulos > 0 && !camada.completo && (
            <p className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-2 text-[11px] text-cyan-200">
              {camada.capitulos} de {orcamento.capitulos}  {T("capítulos já estão no seu contexto — você só\n              paga pelos que faltam.")}
            </p>
          )}

          {gerando && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                
                {T("Escrevendo o seu curso —")}{" "}
                <strong className="text-white/80">{Math.round((progresso / 100) * Math.max(1, orcamento.capitulos - camada.capitulos))} de{" "}
                {Math.max(1, orcamento.capitulos - camada.capitulos)}</strong>  {T("capítulos. Pode fechar a\n                aba: o que já foi escrito fica salvo e você retoma daqui.")}
              </p>
            </div>
          )}

          {!gerando && (
            <div className="mt-4 space-y-2">
              {camada.completo ? (
                <Link href={`/${locale}/portal/learn/${curso.slug}`}>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 font-extrabold text-black" size="lg">
                    <BookOpen size={17} className="mr-2" />
                    
                    {T("Seu curso está pronto — ler agora")}
                  </Button>
                </Link>
              ) : !podePersonalizar ? (
                <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.06] p-3 text-center">
                  <p className="text-xs font-bold text-rose-200">
                    
                    {T("Primeiro me conte um pouco mais sobre você")}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Faltam {persona.minima - persona.confianca}  {T("pontos. O medidor acima mostra quais\n                    respostas rendem mais — normalmente duas bastam.")}
                  </p>
                </div>
              ) : faltamCreditos > 0 ? (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-3 text-center">
                  <p className="text-xs font-bold text-amber-200">
                    Faltam {faltamCreditos}  {T("créditos para este curso")}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Link href={`/${locale}/portal?tab=rewards`}>
                      <Button size="sm" variant="outline" className="border-amber-400/40 text-amber-200">
                        
                        {T("Comprar créditos")}
                      </Button>
                    </Link>
                    {dados.plano !== "expert" && (
                      <Link href={`/${locale}/precos`}>
                        <Button size="sm" variant="outline" className="border-violet-400/40 text-violet-200">
                          
                          {T("Ver planos com mais créditos")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : !dados.podeGastar ? (
                <Link href={`/${locale}/curso/${curso.slug}`}>
                  <Button variant="outline" className="w-full border-amber-400/40 text-amber-200" size="lg">
                    Adicionar ao meu acervo primeiro
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={gerar}
                  disabled={total === 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 py-6 text-base font-extrabold text-black hover:opacity-90"
                  size="lg"
                >
                  <Zap size={18} className="mr-2" />
                  
                  {T("Escrever o meu curso —")} {total}  {T("créditos (R$")} {total})
                </Button>
              )}

              {custoTexto && !custoTexto.jaFeito && podePersonalizar && faltamCreditos === 0 && !camada.completo && (
                <p className="text-center text-[10.5px] text-muted-foreground">
                  
                  {T("Você paga só pelos capítulos que forem escritos. Se algum falhar, ele não é cobrado.")}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Cabecalho({
  numero,
  icone,
  cor,
  titulo,
  sub,
}: {
  numero: number;
  icone: React.ReactNode;
  cor: string;
  titulo: string;
  sub: string;
}) {
  const T = useT();
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br", cor)}>
        {icone}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-black leading-tight">
          <span className="mr-1.5 text-muted-foreground">{numero}.</span>
          {T(titulo)}
        </h2>
        <p className="text-[11.5px] leading-snug text-muted-foreground">{T(sub)}</p>
      </div>
    </div>
  );
}

function Peca({ emoji, titulo, texto }: { emoji: string; titulo: string; texto: string }) {
  const T = useT();
  if (!texto) return null;
  return (
    <div className="border-l-2 border-amber-400/40 pl-3">
      <p className="text-[11px] font-bold text-amber-200">
        {T(emoji)} {T(titulo)}
      </p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">{T(texto)}</p>
    </div>
  );
}
