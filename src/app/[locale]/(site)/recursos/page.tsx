import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check } from "lucide-react";

type Item = {
  href: string;
  label: string;
  count: string;
  summary: string;
  bullets: string[];
};

/**
 * `/recursos` — o hub do material gratuito.
 *
 * ⚠️ POR QUE ESTA PÁGINA TEM TEXTO (20/08/2026)
 *
 * Ela servia 757 caracteres de HTML: um `<h1>` e quatro links soltos. Isso não
 * é "página leve", é página sem assunto — o rastreador chega, não encontra
 * nada que a distinga da home e a trata como soft 404. Quem clica também não
 * sabia o que ia encontrar do outro lado de cada link.
 *
 * O texto é renderizado no SERVIDOR de propósito. Conteúdo que só aparece
 * depois de um `fetch` no cliente não conta para indexação, e era esse o
 * diagnóstico do relatório de SEO ("texto magro no HTML servido").
 */
export default async function ResourcesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources" });
  const items = t.raw("items") as Item[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">{t("title")}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{t("intro")}</p>

          <h2 className="mt-14 mb-6 text-2xl font-semibold">{t("itemsTitle")}</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.href}
                className="rounded-2xl border border-border bg-secondary/40 p-6 transition hover:bg-secondary/70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{item.count}</p>
                <h3 className="mt-2 text-xl font-semibold">
                  <Link href={item.href} className="hover:text-amber-400">
                    {item.label}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                <ul className="mt-4 space-y-2">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:underline"
                >
                  {t("open")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>

          <section className="mt-14 rounded-2xl border border-border bg-secondary/30 p-8">
            <h2 className="text-2xl font-semibold">{t("ctaTitle")}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{t("ctaText")}</p>
            <Link
              href="/cursos"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {t("ctaLink")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
