import { obterT } from "@/i18n/dicionario-servidor";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Clock, ShieldCheck, Signal, Tag, Megaphone, ArrowRight, Lock, Check,
} from "lucide-react";
import {
  capaDe, getMicrocurso, getRelacionados, getTodosSlugs, logoDaFerramenta,
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
  const T = await obterT(locale);
  const m = getMicrocurso(slug);
  if (!m) notFound();

  const capa = capaDe(m);
  const logo = logoDaFerramenta(m, manifesto as Record<string, { logo?: string | null }>);
  const relacionados = getRelacionados(slug, 3);
  const [primeiraAula, ...demais] = m.aulas;

  // O recorte do que é público. Mantido aqui, ao lado do JSX, porque é a única
  // página da seção que não passa por `recortarMicrocurso` — ela não tem plano
  // para consultar, é pública por definição.
  const AMOSTRA_SECOES = 2;
  const amostraDaAula = primeiraAula?.secoes.slice(0, AMOSTRA_SECOES) ?? [];
  const temMaisNaAula = (primeiraAula?.secoes.length ?? 0) > AMOSTRA_SECOES;
  // Três linhas identificam a ferramenta; a ficha inteira dispensaria o
  // microcurso. O resto é benefício do Expert, em `/completo`.
  const fichaPublica = m.ficha.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: m.titulo,
    description: m.resumo,
    datePublished: m.publicadoEm,
    // O JSON-LD declara o idioma DA PAGINA, e a mesma rota serve as duas
    // arvores. Cravado em "pt-BR", `/en/...` anunciava ao Google conteudo
    // portugues numa URL que agora e inglesa — e idioma declarado errado
    // vale menos que idioma nao declarado.
    inLanguage: locale === "en" ? "en" : "pt-BR",
    learningResourceType: "Microcurso",
    educationalLevel: m.nivel,
    teaches: m.ferramenta,
    isAccessibleForFree: true,
    image: `https://fayai.com.br${capa}`,
    provider: { "@type": "Organization", name: "FayAI", url: "https://fayai.com.br" },
    // `isBasedOn` apontava para o vídeo de origem. Saiu junto com a seção da
    // fonte: dado estruturado é público por definição, e declarar a origem no
    // JSON-LD entregaria no schema o que acabamos de tirar do texto.
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
            <span className="text-white/80">{T(m.categoria)}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              {T(m.categoria)}
            </span>
            <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/80 backdrop-blur">
              {T(m.acesso)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur">
              <Check aria-hidden className="h-3 w-3" />
              
              {T("Microcurso grátis")}
            </span>
            {/* "Patrocinado na fonte" dizia, sem querer, que existe uma fonte
                externa — e ainda por cima que ela estava vendendo. Vira um
                aviso sobre a FERRAMENTA, que é o que interessa a quem lê. */}
            {m.patrocinado && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs text-amber-200 backdrop-blur">
                <Megaphone aria-hidden className="h-3 w-3" />
                
                {T("Divulgação paga do fabricante")}
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
              {T(m.titulo)}
            </h1>
          </div>

          <p className="mt-4 text-lg leading-relaxed text-white/75">{T(m.subtitulo)}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5"><Tag aria-hidden className="h-3.5 w-3.5" />{T(m.fabricante)}</span>
            <span className="inline-flex items-center gap-1.5"><Signal aria-hidden className="h-3.5 w-3.5" />{T(m.nivel)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock aria-hidden className="h-3.5 w-3.5" />{T(m.duracao)}</span>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <section className="space-y-4">
          {m.oQueE.map((p, i) => (
            <p key={i} className="text-[16px] leading-relaxed text-foreground/80">
              <Negrito texto={T(p)} />
            </p>
          ))}
        </section>

        <section className="mt-9 rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Por que isso importa</h2>
          <ul className="space-y-2.5">
            {m.porQueImporta.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/75">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span><Negrito texto={T(item)} /></span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── A amostra da 1ª aula ───────────────────────────────────────
            Antes esta seção servia a primeira aula INTEIRA, de graça. Era
            generoso demais em dois sentidos: a pessoa saía satisfeita sem
            motivo para assinar, e o degrau do free ficava igual ao de quem
            paga. Agora sai a abertura — o bastante para provar que o texto
            presta e para o Google ter conteúdo real que não é soft 404 — e o
            resto da própria aula 1 já é o primeiro benefício de plano. */}
        {primeiraAula && (
          <section className="mt-11">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight">
                <span className="mr-2 text-primary">1.</span>
                {T(primeiraAula.titulo)}
              </h2>
              <span className="shrink-0 text-xs text-muted-foreground">{T(primeiraAula.duracao)}</span>
            </div>
            <div className="relative rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
              <Secoes secoes={amostraDaAula} />
              {temMaisNaAula && (
                <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                  
                  {T("O passo a passo desta aula continua no microcurso.")}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">{T("Ficha técnica")}</h2>
          <dl className="overflow-hidden rounded-2xl border border-border">
            {fichaPublica.map((linha, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:gap-4">
                <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground sm:w-44 sm:pt-0.5">{T(linha.rotulo)}</dt>
                <dd className="text-[15px] text-foreground/80">{T(linha.valor)}</dd>
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
              
              {T("Você leu a abertura de")} {m.aulas.length}  {T("aulas")}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              
              {T("O microcurso traz o passo a passo completo, os critérios de escolha,\r\n              onde a ferramenta falha, para quem ela realmente serve — e, no Expert,\r\n              o endereço oficial para começar hoje.")}
            </p>

            {demais.length > 0 && (
              <ul className="mt-5 space-y-2">
                {demais.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 backdrop-blur">
                    <Lock aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <span className="flex-1 text-[15px] font-medium text-foreground/60">{T(a.titulo)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground/50">{T(a.duracao)}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/${locale}/inventando/${slug}/completo`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              
              {T("Ver o microcurso completo")}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Apuração, sem entregar a fonte ────────────────────────────
            Aqui havia o canal, o título do vídeo, o minuto e dois links: um
            para o trecho original e outro para a página oficial da ferramenta.
            Os três eram o caminho para o leitor sair do site e não voltar — o
            vídeo entrega a novidade e a página oficial entrega o produto.
            O que fica é a credibilidade do método, que é nossa; o endereço,
            que é de terceiros, sai. A página oficial passou a ser um benefício
            do Expert e vive em `/completo`. */}
        <section className="mt-12 rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck aria-hidden className="h-4 w-4 text-emerald-400" />
            
            {T("Como apuramos")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            
            {T("Acompanhamos os lançamentos direto nas fontes primárias, transcrevemos o que\r\n            é demonstrado, conferimos cada nome e cada número contra a documentação\r\n            oficial do fabricante e reescrevemos em português — com o que a ferramenta")}{" "}
            <strong className="font-medium text-foreground/80">{T("não")}</strong>  {T("faz junto,\r\n            que é a parte que o anúncio omite.")}
          </p>
        </section>

        {relacionados.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">{T("Continue por aqui")}</h2>
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
                    <span className="block text-[13px] font-medium leading-snug text-foreground/85">{T(rel.titulo)}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{T(rel.categoria)} · {T(rel.duracao)}</span>
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
