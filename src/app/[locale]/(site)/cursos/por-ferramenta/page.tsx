import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllProducts, paraIdiomaLista } from "@/lib/products";
import { ArrowRight } from "lucide-react";

/**
 * `/cursos/por-ferramenta` — o catálogo agrupado pela ferramenta que se aprende.
 *
 * ⚠️ POR QUE ESTA PÁGINA FOI REESCRITA (20/08/2026)
 *
 * A versão anterior era uma lista fixa de onze nomes de ferramenta escrita à
 * mão nas mensagens, e cada nome linkava para `/cursos/<nome>`. Medido em
 * produção: **os onze links davam 404** — `/cursos/<algo>` redireciona (308)
 * para `/curso/<algo>`, que é a rota de UM curso, e nenhum curso se chama
 * "chatgpt" ou "n8n". Um hub cujos links todos morrem gasta rastreio, some do
 * índice e leva junto quem clicou.
 *
 * Agora a página é montada a partir do catálogo real: agrupa os cursos ativos
 * pelo campo `tool` do produto. Assim não existe grupo vazio, não existe link
 * para curso que não existe, e o texto servido ao rastreador é o nome e a
 * descrição dos cursos de verdade — não onze palavras soltas.
 *
 * `catch(() => [])`: banco fora do ar mostra a página com a introdução e o
 * caminho para `/cursos`. Nunca vale derrubar o hub por causa disto.
 */
export const revalidate = 900;

type Props = { params: Promise<{ locale: string }> };

export default async function CoursesByToolPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CoursesByTool" });

  const produtos = await getAllProducts({ type: "course", limit: 200, locale }).catch(() => []);
  const cursos = paraIdiomaLista(produtos, locale);

  // Agrupa pelo que o produto DIZ que ensina. Sem `tool` preenchido o curso cai
  // num grupo "outros" em vez de sumir — hub que esconde curso é pior que hub feio.
  const grupos = new Map<string, typeof cursos>();
  for (const c of cursos) {
    const chave = (c.tool || "").trim() || t("otherTool");
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(c);
  }
  const ordenados = [...grupos.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );

  const notas = t.raw("toolNotes") as Record<string, string>;
  const nota = (ferramenta: string) =>
    notas[ferramenta.toLowerCase()] || t("genericNote", { tool: ferramenta });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">{t("title")}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{t("intro")}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("summary", { courses: cursos.length, tools: ordenados.length })}
          </p>

          <div className="mt-12 space-y-12">
            {ordenados.map(([ferramenta, lista]) => (
              <section key={ferramenta}>
                <h2 className="text-2xl font-semibold">{ferramenta}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {nota(ferramenta)}
                </p>

                <ul className="mt-5 grid gap-4 md:grid-cols-2">
                  {lista.map((curso) => (
                    <li
                      key={curso.slug}
                      className="rounded-2xl border border-border bg-secondary/40 p-5 transition hover:bg-secondary/70"
                    >
                      <h3 className="text-lg font-semibold">
                        <Link href={`/curso/${curso.slug}`} className="hover:text-amber-400">
                          {curso.name}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {curso.copy?.shortDescription || curso.copy?.subheadline || ""}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground/80">
                        {[curso.level, curso.metrics?.duration, t("lessons", { n: curso.metrics?.lessons ?? 0 })]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <Link
                        href={`/curso/${curso.slug}/previa`}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:underline"
                      >
                        {t("preview")}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-14 rounded-2xl border border-border bg-secondary/30 p-8">
            <h2 className="text-2xl font-semibold">{t("ctaTitle")}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("ctaText")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {t("ctaAll")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/recursos"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold"
              >
                {t("ctaResources")}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
