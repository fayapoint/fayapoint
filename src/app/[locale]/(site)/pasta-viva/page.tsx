import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Lock, FolderOpen, CalendarDays } from "lucide-react";
import { getAcessoPastaViva } from "@/lib/pasta-viva/acesso";
import { PASTA_DRIVE_URL, HOTMART_CHECKOUT, PRECO_EBOOK } from "@/lib/pasta-viva/config";
import { SEMENTES } from "@/data/pasta-viva/sementes";
import { GraficoMetodos } from "@/components/pasta-viva/GraficoMetodos";
import { TIER_CONFIGS } from "@/lib/course-tiers";

/**
 * A PÁGINA VIVA — 10/09/2026
 *
 * O acervo que acompanha o ebook "Ganhar dinheiro com IA". Duas portas entram
 * aqui (assinante Expert e comprador do ebook), e o corte é no servidor: quem
 * não tem acesso não recebe o conteúdo no HTML, recebe a página de convite.
 *
 * ## As três decisões que sustentam esta página
 *
 * 1. **Nenhum número de resultado é prometido.** O gráfico mede tempo de
 *    trabalho e custo de início, que são fatos do método. Retorno tem coluna
 *    própria e ela diz "ainda não medimos" enquanto for verdade — em palavras,
 *    nunca com um traço, que lê como tabela quebrada.
 *
 * 2. **Toda linha tem fonte.** Um método sem fonte não entra no acervo. É o que
 *    separa este material de uma lista de dicas.
 *
 * 3. **O acervo não apaga.** Método que sai de moda é arquivado, não deletado,
 *    e continua acessível pela URL. A série temporal de o que funcionava em
 *    cada momento é a única coisa aqui que não dá para copiar.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pasta Viva — Ganhar dinheiro com IA | FayAI",
  description:
    "O acervo que se atualiza: métodos de prestar serviço com IA, com a fonte de cada um, quanto custa começar e quanto tempo leva até a primeira entrega.",
};

export default async function PastaVivaPage() {
  const acesso = await getAcessoPastaViva();

  if (!acesso.liberado) return <Convite acesso={acesso} />;

  const metodos = SEMENTES.map((s) => ({
    slug: s.slug,
    titulo: s.titulo,
    categoria: s.categoria,
    tempoConclusaoHoras: s.tempoConclusaoHoras,
    investimentoReais: s.investimentoReais,
    dificuldade: s.dificuldade,
    temMedicao: false,
  }));

  const fontesUnicas = new Set(SEMENTES.flatMap((s) => s.fontes.map((f) => f.id)));
  const categorias = [...new Set(SEMENTES.map((s) => s.categoria))];

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Pasta Viva
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          O acervo de métodos, e o que já sabemos sobre cada um
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Cada método aqui tem uma página própria com a fonte que o sustenta, o
          passo a passo de implementação e o que medimos até agora. Nada é
          apagado: um método que sai de uso é arquivado e continua consultável.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Você entrou {acesso.porta === "expert" ? "pelo plano Expert" : "pela compra do ebook"}.
        </p>
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-4">
        <Ficha valor={String(SEMENTES.length)} rotulo="métodos no acervo" />
        <Ficha valor={String(categorias.length)} rotulo="etapas cobertas" />
        <Ficha valor={String(fontesUnicas.size)} rotulo="fontes citadas" />
        <Ficha valor="0" rotulo="com retorno medido por nós" vazio />
      </section>

      <GraficoMetodos metodos={metodos} />

      <section className="my-12">
        <h2 className="mb-1 text-lg font-semibold text-foreground">O acervo</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Ordenado por etapa do trabalho: escolher o serviço, achar cliente,
          orçar, entregar, cobrar, escalar.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Método</th>
                <th className="px-4 py-3 text-left font-medium">Etapa</th>
                <th className="px-4 py-3 text-right font-medium">Começar custa</th>
                <th className="px-4 py-3 text-right font-medium">Até a 1ª entrega</th>
                <th className="px-4 py-3 text-left font-medium">Retorno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SEMENTES.map((m) => (
                <tr key={m.slug} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/pasta-viva/metodo/${m.slug}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {m.titulo}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.tldr}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.categoria}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {m.investimentoReais === 0
                      ? "R$ 0"
                      : `R$ ${m.investimentoReais.toLocaleString("pt-BR")}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {m.tempoConclusaoHoras}h
                  </td>
                  <td className="px-4 py-3">
                    <SemMedicao />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          A coluna de retorno começa vazia de propósito. Ela só recebe número em
          duas situações: quando uma fonte externa declarar um resultado — e aí
          entra com a fonte ao lado, como afirmação dela — ou quando nós
          medirmos, com data e tamanho da amostra. Estimativa não entra.
        </p>
      </section>

      <section className="my-12 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <FolderOpen className="h-5 w-5 text-primary" aria-hidden />
          A pasta de arquivos
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Os modelos prontos para baixar — planilha do mapa de contatos, modelo
          de combinado, modelo de orçamento. O acervo vive aqui no site, que é
          onde ele se atualiza; a pasta guarda o que você leva embora.
        </p>
        <a
          href={PASTA_DRIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Abrir a pasta <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </section>

      <section className="my-12 rounded-xl border border-dashed border-border p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          A edição de hoje
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ainda não há edição publicada. A primeira sai quando o debate diário
          entrar no ar — e a partir daí esta seção mostra o que entrou no
          acervo, o que mudou de posição e o que foi avaliado e recusado, com o
          motivo da recusa.
        </p>
      </section>
    </main>
  );
}

function Ficha({
  valor,
  rotulo,
  vazio = false,
}: {
  valor: string;
  rotulo: string;
  vazio?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p
        className={`text-2xl font-bold tabular-nums ${vazio ? "text-muted-foreground" : "text-foreground"}`}
      >
        {valor}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}

/**
 * O estado vazio da coluna de retorno.
 *
 * Faixa hachurada com a frase escrita, nunca um traço: em 26/08 uma tabela do
 * game com traços repetidos foi lida como carregamento quebrado, e o traço não
 * distingue "não temos" de "falhou" ([[reference_estado_vazio_tabela]]).
 */
function SemMedicao() {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-1 text-xs text-muted-foreground"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, color-mix(in oklab, currentColor 12%, transparent) 0 6px, transparent 6px 12px)",
      }}
    >
      ainda não medimos
    </span>
  );
}

function Convite({ acesso }: { acesso: Awaited<ReturnType<typeof getAcessoPastaViva>> }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-xl border border-border bg-card p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Lock className="h-4 w-4" aria-hidden />
          Pasta Viva
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">
          O acervo que se atualiza — e as duas formas de entrar
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Métodos de prestar serviço com IA, cada um com a fonte que o sustenta,
          quanto custa começar, quanto tempo leva até a primeira entrega e o que
          já foi medido. Nada é apagado: o acervo guarda o histórico inteiro.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Comprou o ebook
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              O código está na primeira página do PDF. Resgate uma vez e o acesso
              fica na sua conta.
            </p>
            <Link
              href="/pasta-viva/entrar"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Resgatar código <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Ainda não comprou
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              O ebook custa R$ {PRECO_EBOOK} e vem com a Pasta Viva. Ou assine o
              plano {TIER_CONFIGS.expert.displayName}, que abre esta e todas as
              outras áreas do site.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={HOTMART_CHECKOUT}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Comprar o ebook
              </a>
              <Link
                href="/precos"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Ver o {TIER_CONFIGS.expert.displayName}
              </Link>
            </div>
          </div>
        </div>

        {!acesso.autenticado && (
          <p className="mt-6 text-xs text-muted-foreground">
            Já tem acesso?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Entre na sua conta
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
