import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2, FolderOpen, Lock, Sparkles } from "lucide-react";
import { getAcessoPastaViva } from "@/lib/pasta-viva/acesso";
import { PASTA_DRIVE_URL, HOTMART_CHECKOUT, PRECO_EBOOK } from "@/lib/pasta-viva/config";
import { SEMENTES } from "@/data/pasta-viva/sementes";
import { GraficoMetodos } from "@/components/pasta-viva/GraficoMetodos";
import { AcervoExplorer } from "@/components/pasta-viva/AcervoExplorer";
import { TIER_CONFIGS } from "@/lib/course-tiers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pasta Viva — Ganhar dinheiro com IA | FayAI",
  description: "Um acervo editorial de métodos para prestar serviços com IA: fontes, passos, custo de início, tempo de trabalho e histórico de revisão.",
};

const DATA_DA_PRIMEIRA_EDICAO = "10 de setembro de 2026";

export default async function PastaVivaPage() {
  const acesso = await getAcessoPastaViva();
  // O portão vem antes de montar qualquer prop que contenha o acervo.
  if (!acesso.liberado) return <Convite acesso={acesso} />;

  const metodos = SEMENTES.map((semente) => ({
    slug: semente.slug,
    titulo: semente.titulo,
    tldr: semente.tldr,
    categoria: semente.categoria,
    tempoConclusaoHoras: semente.tempoConclusaoHoras,
    investimentoReais: semente.investimentoReais,
    dificuldade: semente.dificuldade,
    revisadoEm: semente.revisadoEm,
    capa: `/pasta-viva/capas/${semente.slug}-v1.png`,
  }));
  const dadosDoGrafico = metodos.map((metodo) => ({ ...metodo, temMedicao: false }));
  const fontesUnicas = new Set(SEMENTES.flatMap((semente) => semente.fontes.map((fonte) => fonte.id)));
  const categorias = [...new Set(SEMENTES.map((semente) => semente.categoria))];
  const primeiroMetodo = metodos.find((metodo) => metodo.slug === "mapa-de-oportunidades-na-lista-de-contatos");

  return (
    <main className="pb-16">
      <section className="relative isolate overflow-hidden border-b border-border bg-[#15130f] text-white">
        <Image src="/pasta-viva/hero-v1.png" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-center opacity-80" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,10,9,.98)_0%,rgba(10,10,9,.87)_42%,rgba(10,10,9,.28)_100%)]" aria-hidden />
        <div className="mx-auto grid min-h-[32rem] max-w-5xl content-center px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c04e] backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5" aria-hidden /> Pasta Viva</p>
            <h1 className="mt-5 font-display text-5xl leading-[.92] tracking-wide text-white sm:text-6xl">O livro termina. O acervo continua sendo cuidado.</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">Métodos para prestar serviços com IA, cada um com fonte, percurso de implementação e uma separação honesta entre o que sabemos e o que ainda não medimos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#acervo" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ouro px-5 py-2.5 text-sm font-bold text-ouro-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Explorar o acervo <ArrowRight className="h-4 w-4" aria-hidden /></a>
              {primeiroMetodo && <Link href={`/pasta-viva/metodo/${primeiroMetodo.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 bg-black/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Por onde começo <BookOpenCheck className="h-4 w-4" aria-hidden /></Link>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="relative -mt-7 grid gap-3 sm:grid-cols-4" aria-label="Resumo do acervo">
          <Ficha valor={String(SEMENTES.length)} rotulo="métodos no acervo" />
          <Ficha valor={String(categorias.length)} rotulo="etapas cobertas" />
          <Ficha valor={String(fontesUnicas.size)} rotulo="fontes citadas" />
          <Ficha valor="0" rotulo="retornos medidos por nós" vazio />
        </section>

        <section className="mt-12 grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-[1.1fr_.9fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Trilha de entrada</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Comece com um método que cabe no que você tem hoje.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">O mapa de oportunidades começa com a sua própria lista de contatos, não exige investimento e organiza hipóteses antes de qualquer abordagem. É uma porta de entrada, não uma promessa de resultado.</p>
            {primeiroMetodo && <Link href={`/pasta-viva/metodo/${primeiroMetodo.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">Abrir o método de R$ 0 e 2 horas <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground">O compromisso editorial</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> Toda sugestão nasce com fonte.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> Retorno só entra com declaração identificada ou medição nossa datada.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> Método que envelhece é arquivado, com URL e histórico preservados.</li>
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Leitura estrutural</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Custo de início e tempo de trabalho — não ROI.</h2></div><p className="max-w-md text-sm text-muted-foreground">O gráfico ajuda a comparar pontos de partida. A coluna de retorno continua declaradamente vazia enquanto não houver dado.</p></div>
          <div className="mt-6"><GraficoMetodos metodos={dadosDoGrafico} /></div>
        </section>

        <AcervoExplorer metodos={metodos} />

        <section className="my-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><FolderOpen className="h-5 w-5 text-primary" aria-hidden /> A pasta de arquivos</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Modelos que você leva para usar — mapa de contatos, combinado e orçamento. O acervo fica no site para que as revisões e o histórico continuem visíveis.</p><a href={PASTA_DRIVE_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Abrir a pasta <ArrowRight className="h-4 w-4" aria-hidden /></a></div>
          <div className="rounded-2xl border border-border bg-muted/30 p-6"><h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><CalendarDays className="h-5 w-5 text-primary" aria-hidden /> O que mudou nesta edição</h2><p className="mt-3 text-sm font-medium text-foreground">{DATA_DA_PRIMEIRA_EDICAO}</p><ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground"><li>• O acervo foi aberto com 12 métodos ligados aos capítulos do livro.</li><li>• Cada método ganhou data de revisão, capa editorial e página própria com fontes.</li><li>• A busca e os filtros passaram a permitir voltar ao ponto que faz sentido para você.</li></ul><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Próximas propostas passam por revisão antes de entrar. Este registro não será reescrito como se o acervo tivesse começado antes.</p></div>
        </section>
      </div>
    </main>
  );
}

function Ficha({ valor, rotulo, vazio = false }: { valor: string; rotulo: string; vazio?: boolean }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className={`text-2xl font-bold tabular-nums ${vazio ? "text-muted-foreground" : "text-foreground"}`}>{valor}</p><p className="mt-1 text-xs text-muted-foreground">{rotulo}</p></div>;
}

function Convite({ acesso }: { acesso: Awaited<ReturnType<typeof getAcessoPastaViva>> }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-24"><div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="relative min-h-52 overflow-hidden bg-[#15130f] p-7 text-white sm:p-9"><Image src="/pasta-viva/hero-v1.png" alt="" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-transparent" aria-hidden /><div className="relative max-w-lg"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c04e]"><Lock className="h-4 w-4" aria-hidden /> Pasta Viva</p><h1 className="mt-3 text-3xl font-bold tracking-tight">O acervo que continua depois da última página.</h1><p className="mt-3 text-sm leading-relaxed text-white/80">Métodos com fonte, percurso e histórico de revisão — liberados por compra do ebook ou pelo plano Expert.</p></div></div><div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8"><div className="rounded-xl border border-border p-5"><h2 className="text-sm font-semibold text-foreground">Comprou o ebook</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">O código está na primeira página do PDF. Resgate uma vez e o acesso fica na sua conta.</p><Link href="/pasta-viva/entrar" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">Resgatar código <ArrowRight className="h-4 w-4" aria-hidden /></Link></div><div className="rounded-xl border border-border p-5"><h2 className="text-sm font-semibold text-foreground">Ainda não comprou</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">O ebook custa R$ {PRECO_EBOOK} e inclui a Pasta Viva. O plano {TIER_CONFIGS.expert.displayName} também libera esta área.</p><div className="mt-5 flex flex-wrap gap-2"><a href={HOTMART_CHECKOUT} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Comprar o ebook</a><Link href="/precos" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">Ver o {TIER_CONFIGS.expert.displayName}</Link></div></div></div>{!acesso.autenticado && <p className="px-8 pb-8 text-sm text-muted-foreground">Já tem acesso? <Link href="/login" className="underline underline-offset-4">Entre na sua conta</Link>.</p>}</div></main>
  );
}
