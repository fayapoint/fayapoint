import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap, Newspaper, Sparkles } from "lucide-react";
import { ferramentas, VERBOS, destaques, totalFerramentas } from "@/data/ferramentaria";
import { microcursosOrdenados } from "@/data/microcursos";
import { generatePageMetadata } from "@/lib/metadata";
import { FerramentariaClient } from "./FerramentariaClient";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/ferramentaria` — a vitrine de ferramentas.
 *
 * Sobre a URL: `/ferramentas` continua no ar e não foi tocada. Ela tem 14.772
 * caracteres medidos, está no sitemap desde 29/07 e é uma das poucas páginas
 * do site com conteúdo de profundidade — apagar ou redirecionar por cima seria
 * jogar fora sinal que custou a ser construído. Esta nasce em URL própria; se
 * provar valor, aí sim `/ferramentas` responde 308 para cá, como foi feito com
 * `/blog → /noticias`.
 *
 * As fichas individuais continuam em `/ferramentas/<slug>`: são 56 URLs já
 * indexadas e não há motivo para movê-las.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    locale,
    path: "/ferramentaria",
    // O nome da seção é "Ferramentaria", mas o título carrega as palavras que as
    // pessoas de fato buscam — o nome sozinho não casa com busca nenhuma.
    title: `Ferramentaria — as ${totalFerramentas} ferramentas de IA que valem seu tempo | FayAI`,
    description:
      "Filmar, programar, desenhar, compor: as ferramentas de IA organizadas pelo que você quer criar, com ficha, preço e curso de cada uma.",
  });
}

export default async function FerramentariaPage({ params }: Props) {
  const { locale } = await params;
  const emDestaque = destaques(3);
  const ultimosMicrocursos = microcursosOrdenados.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ferramentaria — ferramentas de IA",
    description:
      "Catálogo de ferramentas de inteligência artificial organizado por objetivo.",
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: "FayAI", url: "https://fayai.com.br" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalFerramentas,
      itemListElement: ferramentas.slice(0, 20).map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: f.nome,
        url: `https://fayai.com.br/pt-BR/ferramentas/${f.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FerramentariaClient ferramentas={ferramentas} verbos={VERBOS} locale={locale} />

      {/* ── Destaques editoriais ─────────────────────────────────────── */}
      {emDestaque.length > 0 && (
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                As mais bem avaliadas
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {emDestaque.map((f) => (
                <Link
                  key={f.slug}
                  href={`/${locale}/ferramentas/${f.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-foreground/25"
                >
                  <span className="relative block aspect-[16/9] overflow-hidden bg-muted">
                    {f.capa && (
                      <Image
                        src={f.capa}
                        alt={`${f.nome} — imagem oficial`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="block p-4">
                    <span className="block text-base font-semibold tracking-tight">
                      {f.nome}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">
                      {f.descricao}
                    </span>
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Logos e imagens são de cada fabricante, exibidos para identificação.
              As notas são nossas.
            </p>
          </div>
        </section>
      )}

      {/* ── Ponte para os microcursos ────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap aria-hidden className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Recém-lançadas
                </h2>
              </div>
              <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
                O catálogo acima cobre as ferramentas consolidadas. O que saiu
                esta semana ainda não está nele — vira microcurso primeiro.
              </p>
            </div>
            <Link
              href={`/${locale}/inventando`}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Ver todos os microcursos
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {ultimosMicrocursos.map((m) => (
              <Link
                key={m.slug}
                href={`/${locale}/inventando/${m.slug}`}
                className="group rounded-2xl border border-border bg-card/50 p-5 transition-colors hover:border-foreground/25"
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
                  {m.categoria}
                </span>
                <span className="mt-2 block text-[15px] font-semibold leading-snug">
                  {m.titulo}
                </span>
                <span className="mt-1.5 block line-clamp-2 text-sm text-muted-foreground">
                  {m.subtitulo}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Links internos ───────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            { href: "/cursos", titulo: "Cursos completos", desc: "Quando a ficha não basta", icone: GraduationCap },
            { href: "/ferramentas", titulo: "Fichas detalhadas", desc: "Prompts, casos de uso e armadilhas", icone: Sparkles },
            { href: "/noticias", titulo: "IA Hoje", desc: "O que mudou desde ontem", icone: Newspaper },
          ].map((l) => (
            <Link
              key={l.href}
              href={`/${locale}${l.href}`}
              className="group flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3.5 transition-colors hover:border-foreground/25"
            >
              <l.icone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">{l.titulo}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{l.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
