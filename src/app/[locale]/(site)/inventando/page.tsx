import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Crown, Clock, ArrowRight, Check, Sparkles } from "lucide-react";
import { capaDe, getCategorias, microcursosOrdenados } from "@/data/microcursos";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";
import { TIER_CONFIGS } from "@/lib/course-tiers";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string; p?: string }>;
};

/**
 * `/inventando` — o hub dos microcursos.
 *
 * ── Por que paginado ───────────────────────────────────────────────────────
 *
 * A seção nasceu com 16 microcursos e passa de cem quando os outros dez vídeos
 * entrarem. Página única com tudo dentro seria pesada de carregar, impossível
 * de percorrer e — o pior — daria ao Google uma parede de links iguais em vez
 * de páginas com assunto próprio.
 *
 * ── Por que não lê mais o plano ────────────────────────────────────────────
 *
 * Antes o hub consultava a sessão para decidir o que mostrar, e isso obrigava
 * a renderizar a cada visita. Agora a regra é a mesma para todo mundo — a
 * primeira aula de todo microcurso é aberta —, então a página é estática. O
 * portão de plano vive só em `/<slug>/completo`.
 */
export const revalidate = 3600;

const POR_PAGINA = 9;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { p } = await searchParams;
  const pagina = Math.max(1, Number(p) || 1);

  return generatePageMetadata({
    locale,
    // A canônica da página 2 em diante aponta para ela mesma, não para a
    // primeira: são conjuntos diferentes de microcursos, e canônica apontando
    // para outro conteúdo é descartada pelo Google.
    path: pagina > 1 ? `/inventando?p=${pagina}` : "/inventando",
    title:
      locale === "en"
        ? pagina > 1
          ? `Inventing — AI micro-courses, page ${pagina} | FayAI`
          : ROUTE_SEO["/inventando"].en.title
        : pagina > 1
          ? `Inventando — microcursos de IA, página ${pagina} | FayAI`
          : ROUTE_SEO["/inventando"]["pt-BR"].title,
    description: ROUTE_SEO["/inventando"][locale === "en" ? "en" : "pt-BR"].description,
    image: "/inventando/arte/microcurso.webp",
  });
}

export default async function InventandoHub({ params, searchParams }: Props) {
  const { locale } = await params;
  const { categoria, p } = await searchParams;

  const categorias = getCategorias();

  const filtrados = categoria
    ? microcursosOrdenados.filter((m) => m.categoria === categoria)
    : microcursosOrdenados;

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Number(p) || 1), totalPaginas);
  const daPagina = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  /** Mantém o filtro ao trocar de página, e vice-versa. */
  const url = (opcoes: { categoria?: string | undefined; p?: number }) => {
    const q = new URLSearchParams();
    const cat = "categoria" in opcoes ? opcoes.categoria : categoria;
    if (cat) q.set("categoria", cat);
    if (opcoes.p && opcoes.p > 1) q.set("p", String(opcoes.p));
    const s = q.toString();
    return `/${locale}/inventando${s ? `?${s}` : ""}`;
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Herói ─────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <Image
            src="/inventando/arte/microcurso.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          {/* O mesmo herói, respirando.
              Ricardo, 04/08: *"dentro de inventando … não tem vídeo"*. O vídeo
              fica POR CIMA da imagem, não no lugar dela: se ele não carregar —
              rede ruim, formato não suportado, arquivo ainda não gerado — o que
              sobra é exatamente o herói de antes, e ninguém vê buraco. */}
          <video
            src="/inventando/hero-loop.webm"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {microcursosOrdenados.length} microcursos · primeira aula sempre grátis
          </p>
          <h1 className="mt-5 text-[clamp(2.75rem,9vw,5.5rem)] font-bold leading-[0.95] tracking-tighter">
            Inventando
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Toda semana saem dezenas de ferramentas novas, quase sempre
            anunciadas em inglês e em vídeos de meia hora. Aqui cada uma vira um
            microcurso curto em português — o que é, como usar e onde falha —
            conferido contra a documentação oficial do fabricante.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-400">
              <Check aria-hidden className="h-4 w-4" />
              Primeira aula aberta, sem cadastro
            </span>
            <Link
              href={`/${locale}/ferramentaria`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30"
            >
              <Sparkles aria-hidden className="h-4 w-4 text-primary" />
              Ver o catálogo de ferramentas
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        {/* ── Filtro por categoria ───────────────────────────────────── */}
        <nav aria-label="Categorias" className="flex flex-wrap gap-2">
          <Link
            href={url({ categoria: undefined, p: 1 })}
            className={[
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              !categoria ? "border-foreground/35 bg-foreground/10" : "border-border text-muted-foreground hover:border-foreground/25",
            ].join(" ")}
          >
            Todas ({microcursosOrdenados.length})
          </Link>
          {categorias.map((cat) => {
            const total = microcursosOrdenados.filter((m) => m.categoria === cat).length;
            const ativa = categoria === cat;
            return (
              <Link
                key={cat}
                href={url({ categoria: cat, p: 1 })}
                className={[
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  ativa ? "border-foreground/35 bg-foreground/10" : "border-border text-muted-foreground hover:border-foreground/25",
                ].join(" ")}
              >
                {cat} ({total})
              </Link>
            );
          })}
        </nav>

        {/* ── A grade ────────────────────────────────────────────────── */}
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {daPagina.map((m) => (
            <li
              key={m.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
            >
              <Link href={`/${locale}/inventando/${m.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                <Image
                  src={capaDe(m)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                  {m.categoria}
                </span>
                <span className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-[11px] text-white/85">
                  <Clock aria-hidden className="h-3 w-3" />
                  {m.duracao}
                  <span aria-hidden>·</span>
                  {m.aulas.length} aulas
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <Link href={`/${locale}/inventando/${m.slug}`}>
                  <h2 className="text-[16px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                    {m.titulo}
                  </h2>
                </Link>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {m.subtitulo}
                </p>

                <Link
                  href={`/${locale}/inventando/${m.slug}`}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Ver microcurso grátis
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>

        {/* ── Paginação ──────────────────────────────────────────────── */}
        {totalPaginas > 1 && (
          <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {pagina > 1 && (
              <Link href={url({ p: pagina - 1 })} rel="prev" className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30">
                Anterior
              </Link>
            )}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={url({ p: n })}
                aria-current={n === pagina ? "page" : undefined}
                className={[
                  "rounded-lg border px-4 py-2 text-sm transition-colors",
                  n === pagina ? "border-foreground/35 bg-foreground/10 font-semibold" : "border-border text-muted-foreground hover:border-foreground/25",
                ].join(" ")}
              >
                {n}
              </Link>
            ))}
            {pagina < totalPaginas && (
              <Link href={url({ p: pagina + 1 })} rel="next" className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30">
                Próxima
              </Link>
            )}
          </nav>
        )}

        {/* ── Como funciona o acesso ─────────────────────────────────── */}
        <section className="relative mt-14 overflow-hidden rounded-3xl border border-primary/25">
          <Image src="/inventando/arte/microcurso.webp" alt="" fill sizes="100vw" className="object-cover opacity-[0.12]" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Crown aria-hidden className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Como funciona o acesso</h2>
            </div>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
              A <strong className="text-foreground">primeira aula de todo microcurso é grátis</strong>, sem
              cadastro. A versão completa — passo a passo, critérios de escolha, onde a
              ferramenta falha — abre por plano, e{" "}
              <strong className="text-foreground">o microcurso inteiro é do Expert</strong>.
            </p>
            <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Todos", "1ª aula, sempre aberta"],
                ["Explorador", "2ª aula + limitações"],
                ["Profissional", "3ª aula + para quem serve"],
                ["Expert", "Tudo, em todos os microcursos"],
              ].map(([nome, abre]) => {
                const topo = nome === "Expert";
                return (
                  <li
                    key={nome}
                    className={["flex items-baseline gap-2 rounded-lg border px-3 py-2", topo ? "border-primary/40 bg-primary/[0.07]" : "border-border bg-background/40"].join(" ")}
                  >
                    <span className={topo ? "font-semibold text-primary" : "font-medium text-foreground/75"}>{nome}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{abre}</span>
                  </li>
                );
              })}
            </ul>
            <Link href={`/${locale}/precos`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Ver o plano Expert — R$ {TIER_CONFIGS.expert.monthlyPrice}/mês
            </Link>
          </div>
        </section>

        {/* ── A seção "De onde vem o conteúdo" foi REMOVIDA em 03/08/2026 ──
            Ela listava, no hub da seção, o TÍTULO e o CANAL de cada vídeo que
            originou os microcursos, com a contagem de quantos saíram de cada
            um. Era um índice das nossas fontes, servido na porta de entrada:
            quem quisesse pular o site tinha ali a lista completa de para onde
            ir. Nenhum microcurso individual vazava tanto quanto esta página.

            O método continua descrito — em "Como apuramos", dentro de cada
            microcurso — sem nomear ninguém.  segue existindo no
            módulo de dados para auditoria interna; ele apenas não é chamado
            por nenhuma página. */}
      </div>
    </div>
  );
}
