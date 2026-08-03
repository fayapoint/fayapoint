import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Youtube, ExternalLink, Signal, Tag, Megaphone } from "lucide-react";
import {
  getMicrocurso,
  getRelacionados,
  linkDaFonte,
  timestampLegivel,
} from "@/data/microcursos";
import {
  calcularAcesso,
  getPlanoAtual,
  recortarMicrocurso,
  titulosBloqueados,
} from "@/lib/inventando-acesso";
import { generatePageMetadata } from "@/lib/metadata";
import { Secoes, Negrito } from "@/components/inventando/Blocos";
import { AulasTrancadas, SeloExpert } from "@/components/inventando/PortaoDePlano";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * A página lê o cookie de sessão para descobrir o plano, então é renderizada a
 * cada requisição. É o preço de cortar o conteúdo no servidor — e é o preço
 * certo: a alternativa (mandar tudo e esconder no CSS) entrega o conteúdo pago
 * para quem abrir o código-fonte.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const m = getMicrocurso(slug);

  // Slug desconhecido não recebe metadata "de verdade": a página vai responder
  // 404 e não deve ser indexada.
  if (!m) return { robots: { index: false, follow: true } };

  return generatePageMetadata({
    locale,
    path: `/inventando/${slug}/completo`,
    title: `${m.titulo} — microcurso completo | FayAI`,
    description: m.resumo,
  });
}

export default async function MicrocursoPage({ params }: Props) {
  const { locale, slug } = await params;
  const microcurso = getMicrocurso(slug);

  // Sem microcurso, sem página. Devolver 200 com "não encontrado" é a
  // definição de soft 404 — foi o que apagou 20 páginas de curso do índice em
  // 28/07/2026.
  if (!microcurso) notFound();

  const { plano, autenticado } = await getPlanoAtual();
  const acesso = calcularAcesso(plano, microcurso, autenticado);
  const visivel = recortarMicrocurso(microcurso, acesso);
  const trancadas = titulosBloqueados(microcurso, acesso);
  const relacionados = getRelacionados(slug);

  /**
   * Sinalização de conteúdo pago para o Google.
   *
   * `isAccessibleForFree: false` + `hasPart` com o seletor da parte fechada é
   * o mecanismo oficial para conteúdo com portão. Sem isso, servir texto
   * diferente para visitante e para robô seria cloaking; com isso, o Google
   * entende que a diferença é um portão declarado.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: microcurso.titulo,
    description: microcurso.resumo,
    datePublished: microcurso.publicadoEm,
    inLanguage: "pt-BR",
    learningResourceType: "Microcurso",
    educationalLevel: microcurso.nivel,
    teaches: microcurso.ferramenta,
    timeRequired: `PT${microcurso.duracao.replace(/\D/g, "")}M`,
    isAccessibleForFree: false,
    provider: { "@type": "Organization", name: "FayAI", url: "https://fayai.com.br" },
    hasPart: {
      "@type": "WebPageElement",
      isAccessibleForFree: false,
      cssSelector: ".microcurso-pago",
    },
    isBasedOn: {
      "@type": "VideoObject",
      name: microcurso.fonte.tituloVideo,
      url: linkDaFonte(microcurso),
    },
  };

  return (
    <div className="min-h-dvh text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        {/* Trilha */}
        <nav aria-label="Trilha" className="mb-6 text-xs text-white/40">
          <Link href={`/${locale}/inventando`} className="transition-colors hover:text-white/70">
            Inventando
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          {/* A versão grátis é a página-mãe: quem chega aqui direto do Google
              precisa de um caminho de volta para a aula pública. */}
          <Link
            href={`/${locale}/inventando/${slug}`}
            className="transition-colors hover:text-white/70"
          >
            {microcurso.ferramenta}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-white/60">completo</span>
        </nav>

        {/* Cabeçalho */}
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#f5c04e]/30 bg-[#f5c04e]/10 px-3 py-1 text-xs font-medium text-[#f5c04e]">
              {microcurso.categoria}
            </span>
            <span className="rounded-full border border-white/12 px-3 py-1 text-xs text-white/55">
              {microcurso.acesso}
            </span>
            {microcurso.patrocinado && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                <Megaphone aria-hidden className="h-3 w-3" />
                Patrocinado na fonte
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {microcurso.titulo}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-white/60">{microcurso.subtitulo}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Tag aria-hidden className="h-3.5 w-3.5" />
              {microcurso.fabricante}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Signal aria-hidden className="h-3.5 w-3.5" />
              {microcurso.nivel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="h-3.5 w-3.5" />
              {microcurso.duracao} de leitura
            </span>
            <span>
              {acesso.aulasLiberadas} de {acesso.totalAulas} aulas liberadas
            </span>
          </div>
        </header>

        {acesso.completo && (
          <div className="mt-7">
            <SeloExpert />
          </div>
        )}

        {/*
          O que é — livre para todos: é a ficha de identificação da ferramenta.

          Todo texto vindo dos dados passa por <Negrito>, não só o das aulas.
          O `**` escrito aqui e renderizado cru apareceu literal na página na
          primeira versão; centralizar a formatação evita que o defeito volte
          num campo que ainda não tem negrito hoje mas venha a ter.
        */}
        <section className="mt-9 space-y-4">
          {visivel.oQueE.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-white/75">
              <Negrito texto={p} />
            </p>
          ))}
        </section>

        {/* Por que importa */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Por que isso importa</h2>
          <ul className="space-y-2.5">
            {visivel.porQueImporta.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                <span
                  aria-hidden
                  className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5c04e]"
                />
                <span>
                  <Negrito texto={item} />
                </span>
              </li>
            ))}
          </ul>
          {!acesso.vePorQueImportaCompleto && (
            <p className="mt-3 text-xs text-white/35">
              + {microcurso.porQueImporta.length - 1} pontos nos planos pagos.
            </p>
          )}
        </section>

        {/* Ficha técnica — livre: é dado público da ferramenta */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Ficha técnica</h2>
          <dl className="overflow-hidden rounded-xl border border-white/10">
            {microcurso.ficha.map((linha, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 border-b border-white/8 px-4 py-3 last:border-0 sm:flex-row sm:gap-4"
              >
                <dt className="shrink-0 text-xs uppercase tracking-wide text-white/40 sm:w-44 sm:pt-0.5">
                  {linha.rotulo}
                </dt>
                <dd className="text-[15px] text-white/75">{linha.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Daqui para baixo é o microcurso: o que o plano paga ───────── */}
        <div className="microcurso-pago">
          {visivel.aulas.length > 0 && (
            <section className="mt-11">
              <h2 className="mb-6 text-lg font-semibold">O microcurso</h2>
              <div className="space-y-8">
                {visivel.aulas.map((aula, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <div className="mb-4 flex items-baseline justify-between gap-4">
                      <h3 className="text-base font-semibold text-white">
                        <span className="mr-2 text-[#f5c04e]">{i + 1}.</span>
                        {aula.titulo}
                      </h3>
                      <span className="shrink-0 text-xs text-white/35">{aula.duracao}</span>
                    </div>
                    <Secoes secoes={aula.secoes} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Portão */}
          <AulasTrancadas titulos={trancadas} acesso={acesso} locale={locale} />

          {visivel.praQuemServe.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold">Para quem isso serve</h2>
              <ul className="space-y-2.5">
                {visivel.praQuemServe.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                    <span
                      aria-hidden
                      className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70"
                    />
                    <span>
                      <Negrito texto={item} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visivel.limites.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold">O que ela ainda não faz</h2>
              <ul className="space-y-2.5">
                {visivel.limites.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                    <span
                      aria-hidden
                      className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60"
                    />
                    <span>
                      <Negrito texto={item} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visivel.proximosPassos.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-semibold">Próximos passos</h2>
              <div className="grid gap-2.5">
                {visivel.proximosPassos.map((passo, i) => (
                  <Link
                    key={i}
                    href={`/${locale}${passo.href}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/25"
                  >
                    <span className="text-[15px] text-white/75 group-hover:text-white">
                      {passo.texto}
                    </span>
                    <ExternalLink
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-white/25 group-hover:text-white/60"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Fonte — sempre visível. Crédito não é conteúdo pago. */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
            <Youtube aria-hidden className="h-4 w-4 text-red-400/80" />
            De onde saiu este microcurso
          </h2>
          <p className="text-sm leading-relaxed text-white/55">
            Do capítulo{" "}
            <strong className="font-medium text-white/80">
              &ldquo;{microcurso.fonte.capitulo}&rdquo;
            </strong>{" "}
            (aos {timestampLegivel(microcurso.fonte.inicio)}) do vídeo{" "}
            <em>{microcurso.fonte.tituloVideo}</em>, do canal{" "}
            <a
              href={microcurso.fonte.canalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-white/75 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white"
            >
              {microcurso.fonte.canal}
            </a>
            . Transcrevemos, conferimos os nomes contra as páginas oficiais e
            reescrevemos em português.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={linkDaFonte(microcurso)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3.5 py-2 text-xs text-white/70 transition-colors hover:border-white/35 hover:text-white"
            >
              Ver o trecho no vídeo
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
            <a
              href={microcurso.linkOficial}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3.5 py-2 text-xs text-white/70 transition-colors hover:border-white/35 hover:text-white"
            >
              Página oficial da ferramenta
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* Relacionados — distribuição de links internos */}
        {relacionados.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Continue por aqui</h2>
            <div className="grid gap-2.5">
              {relacionados.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/${locale}/inventando/${rel.slug}`}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/25"
                >
                  <span className="block text-[15px] font-medium text-white/80 group-hover:text-white">
                    {rel.titulo}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    {rel.categoria} · {rel.fabricante} · {rel.duracao}
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
