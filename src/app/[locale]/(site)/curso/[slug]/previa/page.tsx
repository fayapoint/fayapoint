import { obterT } from "@/i18n/dicionario-servidor";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getAllProducts,
  paraIdioma,
  paraIdiomaLista,
  produtoCompletoNoIdioma,
  type Product,
} from "@/lib/products";
import { generatePageMetadata } from "@/lib/metadata";
import { schemaEmenta, schemaTrilha } from "@/lib/structured-data";
import { sanitizeCourseContent } from "@/lib/course-content-sanitizer";
import { montarPrevia } from "@/lib/curso-previa";
import { resolveContentFacts } from "@/lib/content-facts";
import { AvisoTraducao } from "@/components/courses/AvisoTraducao";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Três cursos vizinhos, para a prévia não ser um beco sem saída.
 *
 * Prioriza a mesma categoria e, dentro dela, o nível mais próximo — quem lê
 * "IA em Produção" tende a querer outro curso técnico, não um de Midjourney.
 * Se a categoria não render três, completa com os mais próximos em nível.
 */
function relacionados(todos: Product[], atual: Product, n = 3): Product[] {
  const outros = todos.filter((p) => p.slug && p.slug !== atual.slug && p.name);
  const mesmaCategoria = outros.filter(
    (p) => p.categoryPrimary && p.categoryPrimary === atual.categoryPrimary
  );
  const mesmoNivel = outros.filter((p) => p.level && p.level === atual.level);
  const vistos = new Set<string>();
  const saida: Product[] = [];
  for (const grupo of [mesmaCategoria, mesmoNivel, outros]) {
    for (const p of grupo) {
      if (saida.length >= n) return saida;
      if (vistos.has(p.slug)) continue;
      vistos.add(p.slug);
      saida.push(p);
    }
  }
  return saida;
}

// Mesmo intervalo da página de vendas: o conteúdo vem do banco e não pode
// congelar no build.
export const revalidate = 900;

/**
 * ⚠️ `alternates.canonical` PRÓPRIO — não é detalhe.
 *
 * O `title`/canonical do layout desce para todo filho que não declara o seu.
 * Em 21/07 isso fez toda matéria herdar o canonical da home e sumir do índice.
 * `generatePageMetadata` resolve, desde que o `path` seja o desta rota.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const bruto = await getProductBySlug(slug).catch(() => null);
  const product = bruto ? paraIdioma(bruto, locale) : null;
  if (!product) {
    return generatePageMetadata({
      locale,
      path: `/curso/${slug}/previa`,
      title: "Prévia do curso | FayAI",
      description: "Veja a ementa completa e um capítulo inteiro antes de comprar.",
    });
  }

  const nome = product.name || slug;
  return generatePageMetadata({
    locale,
    path: `/curso/${slug}/previa`,
    // Título distinto do da página de vendas de propósito: duas URLs com o
    // mesmo título competem entre si e o Google escolhe uma (27/07).
    title: `${nome}: ementa completa e capítulo de amostra | FayAI`,
    description:
      `Leia um capítulo inteiro de ${nome} de graça e veja a ementa dos ` +
      `${product.contentChapters || 30} capítulos, módulo a módulo. Sem cadastro.`,
  });
}

export default async function PreviaPage({ params }: Props) {
  const { locale, slug } = await params;
  const T = await obterT(locale);

  // Igual à página de vendas: distinguir "não existe" de "banco fora" evita
  // que uma queda do Mongo vire 404 em massa — e 404 remove do índice.
  let product = null;
  let bancoRespondeu = true;
  try {
    // A ÚNICA chamada que precisa do texto das aulas: a prévia corta o primeiro
  // capítulo. Ver o aviso em `getProductBySlug` — são 248 KB a mais.
  const bruto = await getProductBySlug(slug, { comConteudo: true });
    // A prévia MOSTRA um capítulo inteiro — precisa do corpo traduzido, não só
    // da vitrine. `produtoCompletoNoIdioma` busca na coleção separada; sem
    // tradução, devolve o português e a página continua funcionando.
    product = bruto ? await produtoCompletoNoIdioma(bruto, locale) : null;
  } catch {
    bancoRespondeu = false;
  }
  if (bancoRespondeu && !product) notFound();
  if (!product?.courseContent) notFound();

  // Os tokens `{{fact:…}}` precisam virar texto ANTES de sair daqui. Esta
  // página é pública e indexada: sem isto, o visitante lê
  // "{{fact:openai-flagship}}" no meio da frase — e o Google indexa junto.
  const conteudo = await resolveContentFacts(
    sanitizeCourseContent(String(product.courseContent)).content || ""
  );
  const previa = montarPrevia(conteudo, slug, 1);
  if (!previa.totalCapitulos) notFound();

  const nome = product.name || slug;
  const descricao = product.seo?.metaDescription?.trim() || product.copy?.shortDescription || "";
  const preco = product.pricing?.price;

  // Sem isto a prévia é um beco: entra tráfego, lê, e não tem para onde ir.
  const catalogo = paraIdiomaLista(
    await getAllProducts({ type: "course", limit: 200, locale }).catch(() => []),
    locale,
  );
  const vizinhos = relacionados(catalogo, product);

  const dados = [
    schemaEmenta({
      slug,
      locale,
      nome,
      descricao,
      nivel: product.level,
      duracao: product.metrics?.duration,
      modulos: previa.modulos.map((m) => ({
        numero: m.numero,
        titulo: m.titulo,
        descricao: m.descricao,
        capitulos: m.capitulos.length,
      })),
    }),
    schemaTrilha(locale, [
      { nome: "Início", caminho: "" },
      { nome: "Cursos", caminho: "/cursos" },
      { nome, caminho: `/curso/${slug}` },
      { nome: "Prévia", caminho: `/curso/${slug}/previa` },
    ]),
  ];

  return (
    <>
      {dados.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}

      <main className="mx-auto w-full max-w-3xl px-5 py-12 md:py-16">
        <nav aria-label={T("Trilha")} className="mb-8 text-sm text-white/50">
          <Link href={`/${locale}/cursos`} className="hover:text-white/80">
            
            {T("Cursos")}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/curso/${slug}`} className="hover:text-white/80">
            {T(nome)}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{T("Prévia")}</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
            
            {T("Prévia gratuita · sem cadastro")}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
            {T(nome)}{T(": ementa completa e um capítulo inteiro")}
          </h1>
          {previa.intro.map((p, i) => (
            <p key={i} className="mt-4 text-white/70 leading-relaxed">
              {T(p)}
            </p>
          ))}
          <p className="mt-6 text-sm text-white/50">
            {previa.totalCapitulos}  {T("capítulos ·")} {previa.modulos.length}  {T("módulos")}
            {product.metrics?.duration ? ` · ${product.metrics.duration}` : ""}
          </p>
        </header>

        <section aria-labelledby="ementa" className="mb-14">
          <h2 id="ementa" className="mb-6 text-2xl font-semibold text-white">
            
            {T("O que você aprende, capítulo a capítulo")}
          </h2>
          <div className="space-y-8">
            {previa.modulos.map((mod) => (
              <div key={mod.numero} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                <h3 className="text-lg font-semibold text-white">
                  
                  {T("Módulo")} {mod.numero}: {T(mod.titulo)}
                </h3>
                {mod.descricao && <p className="mt-1 text-sm text-white/60">{T(mod.descricao)}</p>}
                <ol className="mt-5 space-y-5">
                  {mod.capitulos.map((cap) => (
                    <li key={cap.numero}>
                      <h4 className="text-[15px] font-medium text-white/90">
                        {cap.numero}. {T(cap.titulo)}
                      </h4>
                      {cap.resumo.length > 0 && (
                        <ul className="mt-2 space-y-1.5 pl-4">
                          {cap.resumo.slice(0, 3).map((r, i) => (
                            <li key={i} className="list-disc text-sm leading-relaxed text-white/55">
                              {T(r)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {previa.amostra && (
          <section aria-labelledby="amostra" className="mb-14">
            <h2 id="amostra" className="mb-2 text-2xl font-semibold text-white">
              
              {T("Capítulo")} {previa.amostra.numero}  {T("na íntegra")}
            </h2>
            <p className="mb-6 text-sm text-white/50">
              
              {T("Este é o capítulo completo, igual ao que está dentro do curso — texto, imagens e vídeos.")}
            </p>
            <AvisoTraducao slug={slug} locale={locale} />
            <article
              className="curso-previa-conteudo"
              dangerouslySetInnerHTML={{ __html: previa.amostra.html }}
            />
          </section>
        )}

        <aside className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6 text-center">
          <p className="text-lg font-medium text-white">
            
            {T("Continue nos outros")} {previa.totalCapitulos - 1}  {T("capítulos")}
          </p>
          <p className="mt-2 text-sm text-white/60">
            
            {T("Acesso vitalício, atualizações incluídas e certificado ao concluir.")}
          </p>
          <Link
            href={`/${locale}/curso/${slug}`}
            className="mt-5 inline-block rounded-xl bg-emerald-400 px-6 py-3 font-medium text-black transition hover:bg-emerald-300"
          >
            {typeof preco === "number" ? `Garantir por R$ ${preco}` : T("Ver o curso completo")}
          </Link>
        </aside>

        {vizinhos.length > 0 && (
          <section aria-labelledby="relacionados" className="mt-14">
            <h2 id="relacionados" className="mb-5 text-xl font-semibold text-white">
              
              {T("Prévias de cursos parecidos")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {vizinhos.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/${locale}/curso/${v.slug}/previa`}
                    className="block h-full rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-emerald-400/30 hover:bg-white/[0.04]"
                  >
                    <span className="block text-[15px] font-medium leading-snug text-white/90">
                      {T(v.name)}
                    </span>
                    {v.copy?.shortDescription && (
                      <span className="mt-1.5 block text-xs leading-relaxed text-white/50">
                        {v.copy.shortDescription.slice(0, 90)}
                        {v.copy.shortDescription.length > 90 ? "…" : ""}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/cursos`}
              className="mt-5 inline-block text-sm text-emerald-400/80 underline-offset-4 hover:underline"
            >
              
              {T("Ver todos os cursos →")}
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
