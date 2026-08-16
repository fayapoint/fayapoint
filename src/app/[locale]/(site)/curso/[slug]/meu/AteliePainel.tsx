"use client";
import { useT } from "@/i18n/dicionario";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Headphones,
  Loader2,
  Lock,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getClientAuthHeaders } from "@/lib/client-auth";
import type { Ajustes, IdOpcao, OpcaoAjuste, Orcamento } from "@/lib/atelie";
import type { Narrador } from "@/data/narradores";

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
  ajustes: Ajustes;
  catalogo: {
    tons: OpcaoAjuste[];
    profundidades: OpcaoAjuste[];
    extensoes: OpcaoAjuste[];
    focos: OpcaoAjuste[];
    narradores: NarradorNaTela[];
  };
  previa: { video: string; poster: string };
  plano: string;
  podeGastar: boolean;
  temNoAcervo: boolean;
}

type NarradorNaTela = Narrador & { jaGravado: boolean };

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
  const [escolhidas, setEscolhidas] = useState<IdOpcao[]>(["escrito"]);
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
          // ⚠️ O pacote VAI no corpo. Sem ele o servidor assume o degrau de
          // entrada e o aluno que escolheu "completo" pagaria 25 e receberia
          // só o texto — a tela prometendo uma coisa e a caixa cobrando outra.
          body: JSON.stringify({ curso: slug, pacote: escolhidas[0] || "escrito" }),
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

  /**
   * ⚠️ Virou seleção ÚNICA em 11/08/2026.
   *
   * Era um alternar de caixas independentes, e fazia sentido enquanto as
   * opções eram add-ons ("texto", "imagens", "rosto"). Agora são degraus de uma
   * escada em que cada um contém o anterior — marcar dois seria cobrar duas
   * vezes pelo mesmo conteúdo, e desmarcar o de baixo mantendo o de cima seria
   * pedir narração de um curso que não foi escrito.
   */
  const alternar = (id: IdOpcao) => setEscolhidas([id]);

  /**
   * Grava um ajuste e recarrega.
   *
   * Otimista de propósito: o ladrilho acende no clique e a rota confirma
   * depois. Um `<select>` que espera a rede para mudar de estado é a coisa que
   * faz uma tela parecer quebrada — e aqui não há nada a perder, porque
   * gravar ajuste não gasta crédito nem gera nada.
   */
  const mudarAjuste = async (mudanca: Partial<Ajustes>) => {
    if (!dados) return;
    const novos: Ajustes = { ...dados.ajustes, ...mudanca };
    setDados({ ...dados, ajustes: novos });
    try {
      const r = await fetch("/api/user/atelie", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ curso: slug, ajustes: novos }),
      });
      if (!r.ok) {
        toast.error(T("Não deu para salvar o ajuste"));
        await buscar();
        return;
      }
      // O orçamento muda com a narração e a narração muda com o narrador — a
      // conta na tela tem de vir do servidor, não de uma segunda conta feita
      // aqui (é como o preço mostrado e o preço cobrado passam a divergir).
      await buscar();
    } catch {
      toast.error(T("Erro de rede"));
    }
  };

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
  const custoTexto = orcamento.itens.find((i) => i.id === escolhidas[0]) || orcamento.itens[0];
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

      {/* ⚠️ A PORTA DO LIVRO, e ela vem ANTES de tudo.
          O Ateliê continuava sendo uma página de compra depois de o livro
          existir e estar pago: *"entrei e não vi o livro no ateliê e nem na
          minha seção de cursos"*. Quem já tem capítulo escrito precisa
          encontrar o que é dele no primeiro olhar, não abaixo do orçamento.

          ⚠️ E ELA PRECISA DIZER A VERDADE. Antes, esta faixa anunciava "O seu
          livro está pronto para ler" sempre que existisse UM capítulo — o
          número real ficava embaixo, em cinza, como se fosse detalhe.

          Ricardo, 13/08/2026: *"o livro ficou com 1 capítulo escrito, nunca me
          foi dito que seria apenas 1, não sei onde consigo que ele continue
          escrevendo"*. Ele tinha pago 25 créditos por este curso — a compra
          está gravada em `AtelieConfig.pacotePago` — e a tela dizia "pronto"
          para 1 de 16, sem nenhuma porta para continuar. Dinheiro parado e
          nenhum caminho à vista.

          Agora são três estados, e só um deles diz "pronto". */}
      {camada.capitulos > 0 && (() => {
        const faltam = Math.max(0, orcamento.capitulos - camada.capitulos);
        const completo = faltam === 0;
        // `pacotePago` é o degrau já comprado. Ele é o que separa "amostra" de
        // "trabalho pago que parou no meio" — e só o segundo pode ser retomado
        // sem cobrar de novo.
        const pago = !!orcamento.pacotePago;
        const interrompido = pago && !completo;

        const destino = interrompido ? "escrevendo" : "livro";
        const titulo = completo
          ? T("O seu livro está pronto para ler")
          : interrompido
            ? T("A escrita parou no meio — e você já pagou por ela")
            : T("Você tem uma amostra deste livro");
        const detalhe = completo
          ? `${camada.capitulos} ${T("de")} ${orcamento.capitulos} ${T("capítulos · compartilhe com quem quiser")}`
          : interrompido
            ? `${camada.capitulos} ${T("de")} ${orcamento.capitulos} ${T("escritos · faltam")} ${faltam}, ${T("sem cobrar de novo")}`
            : `${camada.capitulos} ${T("de")} ${orcamento.capitulos} ${T("capítulos · o resto ainda não foi escrito")}`;
        const acao = completo ? T("Abrir") : interrompido ? T("Continuar") : T("Ver");

        return (
          <Link
            href={`/${locale}/curso/${curso.slug}/meu/${destino}`}
            className={`mb-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
              interrompido
                ? "border-orange-400/50 bg-orange-400/[0.10] hover:bg-orange-400/[0.16]"
                : "border-amber-400/40 bg-amber-400/[0.09] hover:bg-amber-400/[0.15]"
            }`}
          >
            <BookOpen size={20} className={`shrink-0 ${interrompido ? "text-orange-300" : "text-amber-300"}`} />
            <div className="min-w-0">
              <p className="text-[15px] font-black leading-tight text-white">{titulo}</p>
              <p className={`text-[12.5px] ${interrompido ? "text-orange-100/75" : "text-amber-100/70"}`}>{detalhe}</p>
            </div>
            <span
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-extrabold text-black ${
                interrompido ? "bg-orange-400" : "bg-amber-400"
              }`}
            >
              {acao} <ArrowRight size={14} />
            </span>
          </Link>
        );
      })()}

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
            
            {T("Os")} {curso.capitulos}  {T("capítulos deste curso, reescritos para o seu negócio — cada um com uma\n            abertura, um exemplo e uma tarefa no seu contexto. A aula original continua intacta: a\n            camada envolve o conteúdo, não o substitui.")}
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
                {dados.amostraDisponivel?.titulo || T("de amostra")}
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
            <p className="mt-2 text-[11px] text-muted-foreground">{T("Leva uns 10 segundos.")}</p>
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

      {/* ═══ 2. OS AJUSTES ═══
          ⚠️ **DEIXOU DE SER UM PAINEL E VIROU UMA PORTA (16/08/2026).**

          Os quatro seletores moravam aqui, no meio de uma página que também
          vende o pacote, mostra a amostra, escolhe o narrador e mede a persona.
          Ricardo pediu *"uma nova área de customização"* — e a mudança não é só
          de endereço: a mesa (`/meu/ajustes`) tem duas coisas que NÃO cabiam
          aqui sem transformar esta página num painel de controle de avião —
          a revisão do que vai para o escritor e a escolha do modelo.

          Duplicar os seletores nos dois lugares seria pior do que não tê-los:
          o dia em que um ganhasse uma opção nova, o outro passaria a prometer
          um controle que não existe mais. Aqui fica o RESUMO do que está
          valendo, que é a informação que esta página precisa dar, e o caminho
          para mexer. */}
      <section className="mt-10">
        <Cabecalho
          numero={2}
          icone={<SlidersHorizontal size={15} className="text-white" />}
          cor="from-sky-500 to-indigo-600"
          titulo="Como você quer ESTE curso"
          sub="Sua persona diz quem você é. A mesa de ajustes diz como você quer este curso — e cada escolha lá muda o texto que sai."
        />

        <Link
          href={`/${locale}/curso/${curso.slug}/meu/ajustes`}
          className="block rounded-2xl border border-sky-400/30 bg-sky-500/[0.06] p-4 transition-colors hover:border-sky-400/60 hover:bg-sky-500/[0.11] sm:p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal size={18} className="shrink-0 text-sky-300" />
            <p className="text-[15px] font-black text-white">{T("Abrir a mesa de ajustes")}</p>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-400 px-3.5 py-2 text-[13px] font-extrabold text-black">
              {T("Ajustar")} <ArrowRight size={14} />
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-snug text-sky-100/70">
            {T("Revise o que o escritor vai saber sobre você, escolha quem escreve, a profundidade das explicações, o tom, o tamanho, o emoji e o foco.")}
          </p>

          {/* O que está valendo agora — para a decisão de abrir a mesa ser
              informada, e não uma caixa-preta. */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              dados.catalogo.profundidades.find((o) => o.id === dados.ajustes.profundidade),
              dados.catalogo.tons.find((o) => o.id === dados.ajustes.tom),
              dados.catalogo.extensoes.find((o) => o.id === dados.ajustes.extensao),
              ...(dados.ajustes.foco || []).map((f) => dados.catalogo.focos.find((o) => o.id === f)),
            ]
              .filter(Boolean)
              .map((o) => (
                <span
                  key={o!.id}
                  className="rounded-full border border-white/12 bg-black/25 px-2.5 py-1 text-[11.5px] font-semibold text-white/70"
                >
                  {o!.emoji ? `${o!.emoji} ` : ""}
                  {T(o!.rotulo)}
                </span>
              ))}
          </div>
        </Link>

        {amostra && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-400/25 bg-sky-500/[0.06] px-3 py-2">
            <p className="text-[11.5px] text-sky-100/80">
              {T("Mudou os ajustes? A amostra acima ainda é a antiga — refazer é de graça.")}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => gerarAmostra(true)}
              disabled={gerandoAmostra}
              className="border-sky-400/40 text-sky-200 hover:bg-sky-500/10"
            >
              {gerandoAmostra ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Wand2 size={13} className="mr-1.5" />}
              {T("Refazer a amostra")}
            </Button>
          </div>
        )}
      </section>

      {/* ═══ 3. QUEM NARRA ═══ */}
      <section className="mt-10">
        <Cabecalho
          numero={3}
          icone={<Headphones size={15} className="text-white" />}
          cor="from-fuchsia-500 to-purple-600"
          titulo="Quem narra o seu curso"
          sub="Ouça antes de escolher. A voz vale para o áudio deste curso — e você troca quando quiser."
        />
        <Narradores
          narradores={dados.catalogo.narradores}
          escolhido={dados.ajustes.narrador}
          aoEscolher={(id) => mudarAjuste({ narrador: id })}
          previa={dados.previa}
          curso={curso.titulo}
        />
      </section>

      {/* ═══ 4. O MEDIDOR ═══ */}
      <section className="mt-10">
        <Cabecalho
          numero={4}
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
              
              {T("Mínimo para personalizar:")} {persona.minima}{T("%. Faltam")} {persona.minima - persona.confianca}  {T("pontos.")}
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
                        
                        {T("Completar isto vale +")}{ganho}  {T("pontos de precisão")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* O Estúdio da Persona (10/08) e não mais a aba do Perfil Social: lá o
            dossiê era uma placa de 320px na coluna lateral, e mandar alguém
            "responder no Perfil Social" era mandá-lo procurar. */}
        <Link href={`/${locale}/portal/persona`}>
          <Button variant="outline" className="mt-4 w-full border-violet-400/40 text-violet-200 hover:bg-violet-500/10" size="lg">
            {T("Completar meu perfil — leva 2 minutos")}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </section>

      {/* ═══ 5. O ORÇAMENTO ═══ */}
      <section className="mt-10">
        <Cabecalho
          numero={5}
          icone={<Coins size={15} className="text-white" />}
          cor="from-emerald-500 to-teal-600"
          titulo="Quanto custa o seu"
          sub="Preço por CURSO, não por capítulo. Escolha um degrau — cada um inclui o de baixo."
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
                {/* ⚠️ Degrau é escolha ÚNICA, então o controle é redondo, não
                    quadrado. A forma é o que diz "só um" antes de qualquer
                    texto — um quadrado convida a marcar dois. */}
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    marcada && !travada ? "border-emerald-400 bg-emerald-500" : "border-white/25",
                  )}
                >
                  {item.emBreve ? (
                    <Lock size={11} className="text-white/40" />
                  ) : item.jaFeito ? (
                    <Check size={12} className="text-emerald-300" />
                  ) : marcada ? (
                    <Check size={12} className="text-black" />
                  ) : null}
                </span>

                {/* A ilustração do degrau. Sem arquivo, o emoji segura o lugar —
                    uma vaga de imagem vazia parece imagem quebrada (rodada 3 do
                    gauntlet, 11/08). */}
                <span className="hidden h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] sm:flex">
                  {item.imagem ? (
                    <Image src={item.imagem} alt="" width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl">{item.emoji}</span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{T(item.titulo)}</strong>
                    {item.emBreve && (
                      <Badge className="border-white/15 bg-white/5 text-[9px] text-white/60">{T("Em breve")}</Badge>
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
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    {item.inclui.map((linha) => (
                      <span key={linha} className="flex items-center gap-1 text-[10.5px] text-white/55">
                        <Check size={10} className="shrink-0 text-emerald-400/70" />
                        {T(linha)}
                      </span>
                    ))}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-white/45">{T(item.conta)}</span>
                </span>

                <span className="shrink-0 text-right">
                  {/* Preço cheio riscado quando há degrau já pago: sem isto, o
                      aluno que pagou 25 e vê "75" acha que o site esqueceu. */}
                  {!item.jaFeito && item.precoCheio > item.creditos && (
                    <span className="block text-[10px] tabular-nums text-white/35 line-through">{item.precoCheio}</span>
                  )}
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
                
                {T("= R$")} {creditos.saldo}
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
                
                {T("= R$")} {total}  {T("· sobram")} {Math.max(0, creditos.saldo - total)}
              </p>
            </div>
          </div>

          {!dados.podeGastar && (
            <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-500/[0.07] px-3 py-2 text-[11px] text-amber-200">
              
              {T("Este curso ainda não está no seu acervo. Adicione-o primeiro — personalizar capítulos\n              que você não consegue abrir gastaria seu crédito à toa.")}
            </p>
          )}

          {/* ⚠️ Este aviso dizia "você só paga pelos que faltam", que era
              verdade no preço por capítulo e virou mentira em 11/08: o pacote é
              do curso e pago uma vez. Agora ele conta a verdade nova, que é
              melhor: já pagou, pode regerar à vontade. */}
          {orcamento.pacotePago ? (
            <p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-[11px] text-emerald-200">
              {T("Este curso já é seu neste pacote — gerar de novo, depois de melhorar seu perfil, não custa nada.")}
            </p>
          ) : camada.capitulos > 0 && !camada.completo ? (
            <p className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-2 text-[11px] text-cyan-200">
              {camada.capitulos}  {T("de")} {orcamento.capitulos}  {T("capítulos já estão no seu contexto.")}
            </p>
          ) : null}

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
                <strong className="text-white/80">{Math.round((progresso / 100) * Math.max(1, orcamento.capitulos - camada.capitulos))}  {T("de")}{" "}
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
                    
                    {T("Faltam")} {persona.minima - persona.confianca}  {T("pontos. O medidor acima mostra quais\n                    respostas rendem mais — normalmente duas bastam.")}
                  </p>
                </div>
              ) : faltamCreditos > 0 ? (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-3 text-center">
                  <p className="text-xs font-bold text-amber-200">
                    
                    {T("Faltam")} {faltamCreditos}  {T("créditos para este curso")}
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
                    
                    {T("Adicionar ao meu acervo primeiro")}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              ) : (
                /* ⚠️ Vai para o ESTÚDIO, não escreve aqui. A geração acontecia
                   nesta página com um `toast` no fim: trinta capítulos, dez
                   minutos, nada para olhar e nenhuma porta no final. O laço
                   mudou de casa (`meu/escrevendo`), onde tem palco e leva ao
                   livro. `gerar()` continua aqui só como retaguarda. */
                <Button
                  onClick={() =>
                    router.push(
                      `/${locale}/curso/${curso.slug}/meu/escrevendo?pacote=${encodeURIComponent(escolhidas[0] || "escrito")}`,
                    )
                  }
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

/**
 * O seletor de narrador com prévia de estúdio.
 *
 * ## Por que a prévia toca vídeo E voz ao mesmo tempo
 *
 * Ricardo pediu *"um preview... de um exemplo top tier com áudio e vídeo"*. O
 * material existe e estava parado: a abertura animada do curso
 * (`/cursos/intro/<slug>.webm`) e 172 MB de narração profissional em
 * `public/audio/`. A prévia junta os dois — vídeo mudo em laço, voz por cima —
 * e é isso que o produto entrega quando o áudio do curso estiver pronto.
 *
 * ⚠️ **Um áudio por vez.** Sem a referência única, cada clique empilhava uma
 * voz sobre a outra e a prévia virava barulho.
 */
function Narradores({
  narradores,
  escolhido,
  aoEscolher,
  previa,
  curso,
}: {
  narradores: NarradorNaTela[];
  escolhido: string;
  aoEscolher: (id: string) => void;
  previa: { video: string; poster: string };
  curso: string;
}) {
  const T = useT();
  const [tocando, setTocando] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [temVideo, setTemVideo] = useState(true);

  const tocar = (n: NarradorNaTela) => {
    if (!n.amostra) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (tocando === n.id) {
      setTocando(null);
      return;
    }
    const a = new Audio(n.amostra);
    a.onended = () => setTocando(null);
    a.onerror = () => setTocando(null);
    audioRef.current = a;
    void a.play();
    setTocando(n.id);
  };

  // Sair da página com uma voz tocando é o tipo de coisa que assusta quem está
  // no escritório.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const atual = narradores.find((n) => n.id === escolhido) || narradores[0];

  return (
    /**
     * Empilhado: a prévia em cima, a grade de vozes embaixo.
     *
     * ⚠️ Lado a lado, a prévia (alta, com texto) e a grade de seis cartões
     * nunca fechavam na mesma altura — sobrava um vão preto ao lado da coluna
     * cheia. E há um motivo de produto para a prévia vir primeiro: ela é o
     * argumento; a escolha vem depois de ouvir.
     */
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {narradores.map((n) => {
          const ativo = n.id === escolhido;
          return (
            <div
              key={n.id}
              className={cn(
                "rounded-2xl border p-3 transition-all",
                ativo ? "border-fuchsia-400/50 bg-fuchsia-500/[0.08]" : "border-white/10 bg-white/[0.02]",
                !n.disponivel && "opacity-70",
              )}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[17px]"
                  style={{ background: `${n.cor}22`, color: n.cor }}
                >
                  {n.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[13px] font-bold text-white">{T(n.nome)}</p>
                    {n.jaGravado && (
                      <Badge className="border-emerald-400/30 bg-emerald-500/10 text-[9px] text-emerald-300">
                        {T("já gravado")}
                      </Badge>
                    )}
                    {!n.disponivel && (
                      <Badge className="border-white/15 bg-white/5 text-[9px] text-white/60">{T("Em breve")}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{T(n.timbre)}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-white/40">{T(n.boaPara)}</p>
                  {!n.disponivel && n.falta && (
                    <p className="mt-1 text-[10.5px] leading-snug text-amber-200/70">{T(n.falta)}</p>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                {n.amostra ? (
                  <button
                    onClick={() => tocar(n)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors"
                    style={{ borderColor: `${n.cor}55`, color: n.cor }}
                  >
                    {tocando === n.id ? <Pause size={11} /> : <Play size={11} />}
                    {tocando === n.id ? T("parar") : T("ouvir")}
                  </button>
                ) : (
                  <span className="text-[10.5px] text-white/30">{T("sem amostra ainda")}</span>
                )}

                {n.disponivel && (
                  <button
                    onClick={() => aoEscolher(n.id)}
                    className={cn(
                      "ml-auto cursor-pointer rounded-full px-3 py-1 text-[11px] font-extrabold transition-opacity",
                      ativo ? "bg-fuchsia-500 text-black" : "border border-white/15 text-white/70 hover:text-white",
                    )}
                  >
                    {ativo ? T("escolhida") : T("escolher")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── A prévia de estúdio ───────────────────────────────── */}
      <div className="order-first grid overflow-hidden rounded-2xl border border-white/10 bg-black/40 sm:grid-cols-[280px_1fr]">
        <div className="relative aspect-video w-full bg-black">
          {temVideo ? (
            <video
              src={previa.video}
              poster={previa.poster}
              muted
              loop
              autoPlay
              playsInline
              onError={() => setTemVideo(false)}
              className="h-full w-full object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- pôster local; o vídeo pode não existir para todo curso */
            <img src={previa.poster} alt="" className="h-full w-full object-cover opacity-70" />
          )}
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80">
            <Play size={8} />
            {T("prévia de estúdio · vídeo + voz")}
          </span>
        </div>
        <div className="flex flex-col justify-center p-4">
          <p className="text-[13px] font-black text-white">
            {T(curso)} — {T("narrado por")} {T(atual?.nome || "")}
          </p>
          <p className="mt-1 max-w-md text-[11.5px] leading-snug text-white/70">
            {T("É assim que soa o seu curso: a abertura em vídeo e a voz que você escolheu. Toque para ouvir a voz por cima do vídeo.")}
          </p>
          {atual?.amostra && (
            <button
              onClick={() => tocar(atual)}
              className="mt-3 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-1.5 text-[11.5px] font-extrabold text-black"
            >
              {tocando === atual.id ? <Pause size={12} /> : <Play size={12} />}
              {tocando === atual.id ? T("parar prévia") : T("tocar prévia")}
            </button>
          )}
        </div>
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
