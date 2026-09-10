import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Clock, Wallet, Gauge } from "lucide-react";
import { getAcessoPastaViva } from "@/lib/pasta-viva/acesso";
import { SEMENTES } from "@/data/pasta-viva/sementes";

/**
 * A página de um método do acervo.
 *
 * ## Por que a fonte aparece AQUI, e não nos microcursos
 *
 * Em `/inventando` a fonte é omitida de propósito: lá ela é a nossa vantagem de
 * apuração, e publicá-la entrega ao leitor o caminho para pular o site.
 *
 * Aqui é o contrário, e a diferença é o que a pessoa comprou. O produto da
 * Pasta Viva **é** a apuração: saber que este método veio deste capítulo, que
 * aquele veio de um canal com nome e data, e poder abrir e conferir. Um acervo
 * de métodos sem fonte é uma lista de dicas, e lista de dicas não sustenta
 * assinatura nenhuma.
 *
 * O que continua fora da tela é o MÉTODO de apuração — como o debate escolhe,
 * como pontua, o que descartou e por qual critério interno. Fonte publicada,
 * processo não ([[feedback_nao_publicar_o_metodo]]).
 */

export const dynamic = "force-dynamic";

const DIFICULDADE: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export default async function MetodoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const metodo = SEMENTES.find((m) => m.slug === slug);
  if (!metodo) notFound();

  const acesso = await getAcessoPastaViva();

  if (!acesso.liberado) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Pasta Viva
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{metodo.titulo}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{metodo.tldr}</p>
        <p className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          O passo a passo, as fontes e o que medimos deste método ficam do outro
          lado do portão.{" "}
          <Link href="/pasta-viva" className="underline underline-offset-4">
            Ver como entrar
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/pasta-viva"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Voltar ao acervo
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {metodo.categoria}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{metodo.titulo}</h1>
        <p className="mt-3 text-base text-muted-foreground">{metodo.tldr}</p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Ficha
          icone={<Wallet className="h-4 w-4" aria-hidden />}
          rotulo="Começar custa"
          valor={
            metodo.investimentoReais === 0
              ? "R$ 0"
              : `R$ ${metodo.investimentoReais.toLocaleString("pt-BR")}`
          }
        />
        <Ficha
          icone={<Clock className="h-4 w-4" aria-hidden />}
          rotulo="Até a primeira entrega"
          valor={`${metodo.tempoConclusaoHoras} horas de trabalho`}
        />
        <Ficha
          icone={<Gauge className="h-4 w-4" aria-hidden />}
          rotulo="Dificuldade"
          valor={DIFICULDADE[metodo.dificuldade]}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Como implementar</h2>
        <ol className="mt-4 space-y-4">
          {metodo.tutorial.map((p) => (
            <li key={p.passo} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {p.passo}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{p.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.detalhe}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">O que já medimos</h2>
        <p
          className="mt-3 inline-flex rounded px-2 py-1 text-xs text-muted-foreground"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, color-mix(in oklab, currentColor 12%, transparent) 0 6px, transparent 6px 12px)",
          }}
        >
          ainda não medimos este método
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Nenhuma fonte declarou um retorno para ele, e nós ainda não temos
          amostra própria. Quando qualquer um dos dois existir, aparece aqui com
          data — e dizendo qual dos dois é.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Fontes</h2>
        <ul className="mt-4 space-y-3">
          {metodo.fontes.map((f) => (
            <li key={f.id} className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">{f.titulo}</p>
              {f.autor && (
                <p className="mt-0.5 text-xs text-muted-foreground">{f.autor}</p>
              )}
              {f.sustenta && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Sustenta: {f.sustenta}
                </p>
              )}
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-primary underline underline-offset-4"
                >
                  Abrir a fonte
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Ficha({
  icone,
  rotulo,
  valor,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icone}
        {rotulo}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{valor}</p>
    </div>
  );
}
