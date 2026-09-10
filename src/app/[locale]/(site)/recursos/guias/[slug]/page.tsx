import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { BookOpen, Clock, ArrowRight, HelpCircle } from "lucide-react";
import { guiaPorSlug, slugsDeGuias, type SecaoGuia } from "@/data/guias";
import { generatePageMetadata } from "@/lib/metadata";

/**
 * A página de UM guia.
 *
 * Três decisões que vieram de defeito medido neste repositório, não de gosto:
 *
 * 1. **`notFound()` para slug desconhecido.** Devolver 200 com "guia não
 *    encontrado" é a definição de soft 404, e o Search Console já reclamou
 *    disso aqui — foi o que aconteceu com `/blog/<slug>` em 28/07/2026, e com
 *    as rotas dinâmicas de `/curso` e `/loja`. Sem corpo, sem página.
 *
 * 2. **Metadata própria, com canônica própria.** Sendo server component, cada
 *    guia declara a sua. Herdar a do layout faz todas as URLs dizerem ser a
 *    página-índice — canônica apontando para outra URL é descartada pelo
 *    Google, que então escolhe sozinho.
 *
 * 3. **`noindex` fora do português.** Os guias existem só em pt-BR. Servir o
 *    mesmo texto em `/en/...` e anunciá-lo como versão inglesa é dizer ao
 *    Google algo falso — foi exatamente o que custou a saída do `hreflang="en"`
 *    em 27/07/2026. Quando houver tradução de verdade, isto sai.
 */

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://fayai.com.br";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * ⚠️ `dynamicParams = false` é o que faz o 404 ser 404 — e ele existe por
 * medição, não por preferência.
 *
 * Medido em 10/09/2026, no build de produção servido por `next start`:
 * `/pt-BR/recursos/guias/nao-existe` respondia **HTTP 200** com a página de
 * 404 dentro. Isso é soft 404, e não era defeito desta rota: o mesmo teste
 * devolveu 200 em `/pt-BR/curso/nao-existe`, `/pt-BR/ferramentas/nao-existe`,
 * `/pt-BR/inventando/nao-existe` e `/pt-BR/blog/nao-existe`. Só o caminho que
 * não casa com rota nenhuma (`/pt-BR/pagina-que-nunca-existiu`) devolveu 404.
 *
 * A causa é estrutural: o root layout do site vive dentro de `[locale]`, e não
 * existe `src/app/layout.tsx` nem `src/app/not-found.tsx` na raiz. Sem isso, o
 * `notFound()` chamado de dentro de uma rota dinâmica renderiza a página de
 * erro mas não carrega o status. Consertar aquilo é mexer na raiz de um site
 * com 479 URLs — está anotado como tarefa própria no quadro.
 *
 * Aqui a saída é local e não depende daquele conserto: com `dynamicParams`
 * desligado, slug fora de `generateStaticParams` nem chega a renderizar, e cai
 * no mecanismo de rota-inexistente do Next — que devolve 404 de verdade,
 * conforme medido. O `notFound()` do corpo fica como segunda trava.
 *
 * O custo de escolher isto: guia novo só aparece depois de um build. Para
 * conteúdo que muda uma vez por semana, é o troco certo por um status honesto.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsDeGuias().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) return { robots: { index: false, follow: true } };

  const base = generatePageMetadata({
    locale,
    path: `/recursos/guias/${slug}`,
    title: guia.titulo,
    description: guia.descricao,
  });

  /**
   * ⚠️ O `hreflang="en"` SAI daqui, e isso não é detalhe.
   *
   * `generatePageMetadata` declara o par pt-BR/en para todo o site, porque a
   * regra geral é que as duas árvores existem. Os guias são a exceção: só há
   * versão portuguesa, e `/en/recursos/guias/*` serve o mesmo texto com
   * `noindex` logo abaixo. Deixar o par no HTML apontaria o `hreflang` para
   * uma página não indexável — o Google exige reciprocidade entre páginas
   * indexáveis e descarta o par inteiro quando não a encontra.
   *
   * Pior que perder o sinal seria CONTRADIZER o sitemap: lá estes caminhos
   * entram com `alternates(path, true)`, isto é, só pt-BR e x-default. O
   * próprio sitemap.ts avisa que divergir entre sitemap e página faz o Google
   * descartar os dois sinais. Foi assim que este bloco nasceu: o build de
   * 10/09 gerou o HTML com `hreflang="en"` enquanto o sitemap dizia só-pt.
   *
   * **Quando os guias forem traduzidos, apague este bloco, o `noindex` abaixo
   * e a entrada em `SO_EM_PORTUGUES` no sitemap — os três juntos.**
   */
  const soPt = {
    ...base,
    alternates: {
      ...base.alternates,
      languages: {
        "x-default": `${SITE_URL}/pt-BR/recursos/guias/${slug}`,
        "pt-BR": `${SITE_URL}/pt-BR/recursos/guias/${slug}`,
      },
    },
  };

  if (locale !== "pt-BR") {
    return { ...soPt, robots: { index: false, follow: true } };
  }
  return soPt;
}

function Secao({ s }: { s: SecaoGuia }) {
  switch (s.tipo) {
    case "titulo":
      return <h2 className="text-2xl font-bold mt-12 mb-4">{s.texto}</h2>;
    case "paragrafo":
      return <p className="text-muted-foreground leading-relaxed mb-5">{s.texto}</p>;
    case "citacao":
      return (
        <blockquote className="my-8 border-l-2 border-blue-500/60 pl-5 text-lg italic text-foreground/90">
          {s.texto}
        </blockquote>
      );
    case "lista":
      return (
        <ul className="mb-6 space-y-3">
          {s.itens.map((item) => (
            <li key={item} className="flex gap-3 text-muted-foreground leading-relaxed">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "passos":
      return (
        <ol className="mb-6 space-y-4">
          {s.itens.map((item, i) => (
            <li key={item} className="flex gap-4 text-muted-foreground leading-relaxed">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-300">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      );
  }
}

export default async function GuiaPage({ params }: Props) {
  const { slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  /* FAQPage só é declarado porque as perguntas abaixo estão MESMO na página,
   * com a resposta inteira. Marcação que descreve conteúdo ausente é motivo de
   * ação manual, não de destaque. */
  const schemaFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guia.faq.map((f) => ({
      "@type": "Question",
      name: f.pergunta,
      acceptedAnswer: { "@type": "Answer", text: f.resposta },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
      />

      <main className="pt-32 pb-20">
        <article className="container mx-auto max-w-3xl px-4">
          <Link
            href="/recursos/guias"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-blue-400"
          >
            <BookOpen size={15} /> Guias práticos
          </Link>

          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-300">
                {guia.categoria}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock size={14} /> {guia.leitura} min de leitura
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">{guia.titulo}</h1>
            <p className="text-xl text-muted-foreground">{guia.descricao}</p>
          </header>

          <div className="mb-16">
            {guia.secoes.map((s, i) => (
              <Secao key={i} s={s} />
            ))}
          </div>

          <section className="mb-16">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
              <HelpCircle size={22} className="text-blue-400" /> Perguntas frequentes
            </h2>
            <div className="space-y-4">
              {guia.faq.map((f) => (
                <details
                  key={f.pergunta}
                  className="group rounded-xl border border-border bg-secondary p-5 open:bg-white/[0.04]"
                >
                  <summary className="cursor-pointer list-none font-semibold marker:content-none">
                    {f.pergunta}
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{f.resposta}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-gradient-to-r from-blue-900/20 to-amber-900/20 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Quer ir além do guia?</h2>
            <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
              Este guia cobre o começo. O curso cobre o trabalho inteiro, com exercício, exemplo
              pronto e o que fazer quando dá errado.
            </p>
            <Link
              href={`/curso/${guia.curso}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
            >
              Ver o curso <ArrowRight size={17} />
            </Link>
          </section>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Atualizado em {new Date(guia.atualizadoEm).toLocaleDateString("pt-BR")}
          </p>
        </article>
      </main>
    </div>
  );
}
