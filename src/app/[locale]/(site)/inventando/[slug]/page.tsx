import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Clock, Youtube, ExternalLink, Signal, Tag, Megaphone, ArrowRight, Lock, Check,
} from "lucide-react";
import {
  capaDe, getMicrocurso, getRelacionados, getTodosSlugs, linkDaFonte,
  logoDaFerramenta, timestampLegivel,
} from "@/data/microcursos";
import manifesto from "../../../../../../public/ferramentaria/manifesto.json";
import { generatePageMetadata } from "@/lib/metadata";
import { Secoes, Negrito } from "@/components/inventando/Blocos";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * O microcurso GRATUITO — curto, ilustrado e inteiramente público.
 *
 * Esta página não tem portão nenhum, e é de propósito. Ela é a porta de
 * entrada: quem chega do Google recebe uma aula inteira e útil antes de
 * qualquer pedido. A versão detalhada, com as demais aulas, fica em
 * `/completo`, e é lá que o plano decide o que se vê.
 *
 * Duas consequências boas de ela ser pública e estática:
 *
 * 1. **Ela carrega o SEO da seção.** Conteúdo original em português sobre
 *    lançamentos que quase ninguém cobriu nesse idioma, sem nada escondido do
 *    robô — não há portão para declarar, nem risco de conteúdo raso.
 * 2. **Ela é pré-renderizada** (`generateStaticParams`), então não consome
 *    função a cada visita, ao contrário da `/completo`, que precisa ler o
 *    cookie de sessão.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  return getTodosSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const m = getMicrocurso(slug);
  if (!m) return { robots: { index: false, follow: true } };

  return generatePageMetadata({
    locale,
    path: `/inventando/${slug}`,
    title: `${m.titulo} — microcurso grátis | FayAI`,
    description: m.resumo,
    image: capaDe(m),
  });
}

export default async function MicrocursoGratisPage({ params }: Props) {
  const { locale, slug } = await params;
  const m = getMicrocurso(slug);
  if (!m) notFound();

  const capa = capaDe(m);
  const logo = logoDaFerramenta(m, manifesto as Record<string, { logo?: string | null }>);
  const relacionados = getRelacionados(slug, 3);
  const [primeiraAula, ...demais] = m.aulas;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: m.titulo,
    description: m.resumo,
    datePublished: m.publicadoEm,
    inLanguage: "pt-BR",
    learningResourceType: "Microcurso",
    educationalLevel: m.nivel,
    teaches: m.ferramenta,
    isAccessibleForFree: true,
    image: `https://fayai.com.br${capa}`,
    provider: { "@type": "Organization", name: "FayAI", url: "https://fayai.com.br" },
    isBasedOn: { "@type": "VideoObject", name: m.fonte.tituloVideo, url: linkDaFonte(m) },
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Capa em sangria ───────────────────────────────────────────── */}
      <header className="relative">
        <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden sm:h-[56vh]">
          <Image src={capa} alt="" fill priority sizes="100vw" className="scale-105 object-cover" />
          {/* Duas camadas: a vertical escurece o topo para a navegação e funde
              a base no fundo da página; a horizontal abre espaço legível à
              esquerda, onde o título cai. */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-background" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />
        </div>

        <div className="mx-auto -mt-44 max-w-3xl px-4 pb-2 sm:-mt-52 sm:px-6">
          <nav aria-label="Trilha" className="mb-5 text-xs text-white/60">
            <Link href={`/${locale}/inventando`} className="transition-colors hover:text-white">Inventando</Link>
            <span className="mx-2" aria-hidden>/</span>
            <span className="text-white/80">{m.categoria}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              {m.categoria}
            </span>
            <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur">
              {m.acesso}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur">
              <Check aria-hidden className="h-3 w-3" />
              Microcurso grátis
            </span>
            {m.patrocinado && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs text-amber-200 backdrop-blur">
                <Megaphone aria-hidden className="h-3 w-3" />
                Patrocinado na fonte
              </span>
            )}
          </div>

          <div className="mt-5 flex items-start gap-4">
            {logo && (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/40 backdrop-blur">
                <Image src={logo} alt="" width={36} height={36} className="h-8 w-8 object-contain" />
              </span>
            )}
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-[2.6rem]">
              {m.titulo}
            </h1>
          </div>

          <p className="mt-4 text-lg leading-relaxed text-white/75">{m.subtitulo}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5"><Tag aria-hidden className="h-3.5 w-3.5" />{m.fabricante}</span>
            <span className="inline-flex items-center gap-1.5"><Signal aria-hidden className="h-3.5 w-3.5" />{m.nivel}</span>
            <span className="inline-flex items-center gap-1.5"><Clock aria-hidden className="h-3.5 w-3.5" />{m.duracao}</span>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <section className="space-y-4">
          {m.oQueE.map((p, i) => (
            <p key={i} className="text-[16px] leading-relaxed text-foreground/80">
              <Negrito texto={p} />
            </p>
          ))}
        </section>

        <section className="mt-9 rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Por que isso importa</h2>
          <ul className="space-y-2.5">
            {m.porQueImporta.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/75">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><Negrito texto={item} /></span>
              </li>
            ))}
          </ul>
        </section>

        {/* A aula grátis, inteira */}
        {primeiraAula && (
          <section className="mt-11">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight">
                <span className="mr-2 text-primary">1.</span>
                {primeiraAula.titulo}
              </h2>
              <span className="shrink-0 text-xs text-muted-foreground">{primeiraAula.duracao}</span>
            </div>
            <div className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
              <Secoes secoes={primeiraAula.secoes} />
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Ficha técnica</h2>
          <dl className="overflow-hidden rounded-2xl border border-border">
            {m.ficha.map((linha, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:gap-4">
                <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground sm:w-44 sm:pt-0.5">{linha.rotulo}</dt>
                <dd className="text-[15px] text-foreground/80">{linha.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Ponte para a versão completa ────────────────────────────── */}
        <section className="relative mt-12 overflow-hidden rounded-3xl border border-primary/30">
          <Image src={capa} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover opacity-[0.16] blur-[1px]" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/12 to-transparent" />

          <div className="relative p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Continue no microcurso completo
            </p>
            <h2 className="mt-2.5 text-2xl font-bold leading-snug sm:text-3xl">
              Você leu a primeira de {m.aulas.length} aulas
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              A versão detalhada traz o passo a passo completo, os critérios de
              escolha, onde a ferramenta falha e para quem ela realmente serve.
            </p>

            {demais.length > 0 && (
              <ul className="mt-5 space-y-2">
                {demais.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 backdrop-blur">
                    <Lock aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <span className="flex-1 text-[15px] font-medium text-foreground/60">{a.titulo}</span>
                    <span className="shrink-0 text-xs text-muted-foreground/50">{a.duracao}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/${locale}/inventando/${slug}/completo`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver o microcurso completo
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Youtube aria-hidden className="h-4 w-4 text-red-400" />
            De onde saiu este microcurso
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Do capítulo <strong className="font-medium text-foreground/80">&ldquo;{m.fonte.capitulo}&rdquo;</strong>{" "}
            (aos {timestampLegivel(m.fonte.inicio)}) do vídeo <em>{m.fonte.tituloVideo}</em>, do canal{" "}
            <a href={m.fonte.canalUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 hover:text-foreground">
              {m.fonte.canal}
            </a>
            . Transcrevemos, conferimos os nomes contra as páginas oficiais e reescrevemos em português.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={linkDaFonte(m)} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs transition-colors hover:border-foreground/30">
              Ver o trecho no vídeo <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
            <a href={m.linkOficial} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs transition-colors hover:border-foreground/30">
              Página oficial <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {relacionados.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Continue por aqui</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {relacionados.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/${locale}/inventando/${rel.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card/40 transition-colors hover:border-foreground/25"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden">
                    <Image src={capaDe(rel)} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="block p-3.5">
                    <span className="block text-[13px] font-medium leading-snug text-foreground/85">{rel.titulo}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{rel.categoria} · {rel.duracao}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
