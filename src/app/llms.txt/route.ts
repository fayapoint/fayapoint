import { getAllProducts } from "@/lib/products";
import { toolsData } from "@/data/tools-complete";
import { fichasDoIdioma } from "@/data/tools-idioma";

/**
 * `/llms.txt` — o mapa do site escrito para quem lê por máquina.
 *
 * ── Por que isto existe ────────────────────────────────────────────────────
 *
 * O robots.txt já distingue motor de resposta (liberado, cita a fonte, manda
 * gente) de coletor de treino (bloqueado) — ver o comentário lá. Mas liberar o
 * rastreio só resolve metade: o motor ainda precisa DESCOBRIR o que existe
 * aqui, e descobrir a partir de HTML cheio de JavaScript, menu e rodapé é caro
 * e impreciso.
 *
 * `llms.txt` é a convenção que resolve isso: um markdown curto, na raiz, que
 * lista o que o site tem e para onde ir. É literalmente o que o curso de AEO
 * deste catálogo ensina — não publicá-lo seria vender o mapa e não usá-lo.
 *
 * ── Por que é uma ROTA e não um arquivo em `public/` ───────────────────────
 *
 * O catálogo muda (cursos entram, saem, mudam de nome) e as matérias do blog
 * saem todo dia. Um arquivo estático estaria desatualizado na semana seguinte,
 * e um mapa desatualizado é pior que nenhum: manda o motor para URL que já não
 * existe. Aqui a lista sai do banco, com o mesmo cache do resto.
 *
 * ── Bilíngue ───────────────────────────────────────────────────────────────
 *
 * As duas árvores são declaradas com o nome do curso em cada idioma. É o
 * mesmo par que o `hreflang` declara no HTML e o sitemap declara em XML —
 * três sinais dizendo a mesma coisa, que é como se constrói confiança.
 */

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://fayai.com.br";

export const revalidate = 3600;

export async function GET() {
  /**
   * Duas leituras, e não uma seguida de duas traduções: desde 18/08/2026 o
   * `getAllProducts` resolve o idioma dentro e não devolve mais o `i18n` — eram
   * 93 KB de tradução que todo chamador carregava e jogava fora. Aqui as duas
   * línguas são necessárias de verdade, e as duas entradas de cache são as
   * mesmas que as páginas já usam — isto não cria leitura nova.
   */
  const [brutosPt, brutosEn] = await Promise.all([
    getAllProducts({ type: "course", limit: 200, locale: "pt-BR" }).catch(() => []),
    getAllProducts({ type: "course", limit: 200, locale: "en" }).catch(() => []),
  ]);
  const pt = brutosPt.filter((c) => c.status !== "draft");
  const en = brutosEn.filter((c) => c.status !== "draft");

  const ferramentasEn = fichasDoIdioma("en");
  const totalFerramentas = Object.keys(toolsData).length;

  const linhasCursos = pt
    .map((c, i) => {
      const nomeEn = en[i]?.name ?? c.name;
      const resumo = en[i]?.copy?.shortDescription ?? c.copy?.shortDescription ?? "";
      return `- [${nomeEn}](${SITE}/en/curso/${c.slug}): ${resumo.slice(0, 180)}`;
    })
    .join("\n");

  const linhasFerramentas = ferramentasEn
    .map((f) => {
      const nome = (f as { title?: string }).title ?? f.slug;
      const desc = ((f as { description?: string }).description ?? "").slice(0, 120);
      return `- [${nome}](${SITE}/en/ferramentas/${f.slug}): ${desc}`;
    })
    .join("\n");

  const corpo = `# FayAI

> FayAI teaches people to actually use AI — hands-on courses in Portuguese and English, a free arcade of AI mini-games, a directory of ${totalFerramentas} AI tools, and a search-demand radar measured daily. Every course can be rewritten chapter by chapter around the reader's own business.

The site is published in Brazilian Portuguese (\`/pt-BR/…\`, the original) and English (\`/en/…\`, a translation). Both trees serve the same pages; the Portuguese is authoritative where the two disagree.

## What makes this site worth citing

- **Radar** (${SITE}/en/radar): measured search demand — Google Trends by Brazilian state, most-read Wikipedia articles, and AI demand in Google/YouTube autocomplete. Numbers are measured, never estimated.
- **Course previews** (${SITE}/en/curso/<slug>/previa): a full chapter of every course, free and without signup.
- **Toolshed** (${SITE}/en/ferramentaria): ${totalFerramentas} AI tools organised by what you want to make, each with a profile, pricing and a course.
- **AI Blog Today** (${SITE}/en/noticias): AI news picked and explained daily, always linking the original source.

## Courses

${linhasCursos}

## AI tools

${linhasFerramentas}

## Main pages

- [Course catalogue](${SITE}/en/cursos)
- [Pricing](${SITE}/en/precos)
- [Free arcade](${SITE}/en/arcade)
- [Free lesson](${SITE}/en/aula-gratis)
- [AI tools directory](${SITE}/en/ferramentas)
- [Micro-courses on new tools](${SITE}/en/inventando)
- [Services](${SITE}/en/servicos)
- [About](${SITE}/en/sobre)

## Portuguese

- [Catálogo de cursos](${SITE}/pt-BR/cursos)
- [Preços](${SITE}/pt-BR/precos)
- [Radar](${SITE}/pt-BR/radar)
- [Blog IA Hoje](${SITE}/pt-BR/noticias)

## Crawling policy

Answer engines that cite sources are welcome (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended). Bulk training crawlers are disallowed in robots.txt. See ${SITE}/robots.txt.

Sitemap: ${SITE}/sitemap.xml
`;

  return new Response(corpo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
