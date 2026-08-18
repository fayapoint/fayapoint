import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

import { porSegredoOuAdmin } from "@/lib/guarda-de-servico";
import { invalidarCursoNoCache, invalidateProductCache } from "@/lib/products";

/**
 * POST /api/admin/invalidar-cache — apaga o cache de catálogo e de curso.
 *
 * ## Por que uma ROTA, e não uma chamada dentro do script
 *
 * Os scripts que gravam `courseContent` (`push-course-content.ts`,
 * `assemble_and_apply_courseContent.cjs`, `padronizar-curso.ts`,
 * `enrich-curriculum.ts`, `i18n/cursos-conteudo.mjs`) rodam no terminal do
 * Ricardo e falam direto com o Mongo. Eles **não têm as chaves do Upstash** —
 * `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` só existem no ambiente
 * da Netlify. Então "invalidar no fim do script" não é uma linha de código
 * local: é um pedido HTTP ao site, e o site é quem tem a chave.
 *
 * Sem isto, o que acontecia — e aconteceu — é o script dizer "curso gravado",
 * a pessoa abrir a página e ver o texto ANTERIOR por até 10 minutos, sem erro
 * em lugar nenhum.
 *
 * ## Auth
 *
 * Dois caminhos, porque os dois chamadores são diferentes:
 *
 * - `x-social-secret` — o mesmo par `SOCIAL_CRON_SECRET`/`AINEWS_SECRET` que
 *   `radar/medir`, `social/publish-due` e o cron de notícias já usam. É o que o
 *   script de terminal manda.
 * - JWT de admin — para o painel, que já tem sessão e não deve carregar segredo
 *   de cron no navegador.
 *
 * ⚠️ **Falha fechada.** Se nenhum segredo estiver configurado no ambiente, a
 * rota responde 401 mesmo para quem mandou cabeçalho. Não repita aqui o padrão
 * `process.env.X || "uma-senha-no-código"` — este repositório é PÚBLICO
 * (`github.com/fayapoint/fayapoint`), e uma senha padrão escrita no código é uma
 * senha publicada. Já custou caro em `flush-ratelimits`.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // A regra (segredo que existe, falha fechada) mora em `lib/guarda-de-servico.ts`
  // desde que a mesma decisão apareceu errada em três outras rotas.
  if (!(await porSegredoOuAdmin(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  /**
   * O slug pode vir na query (mais simples para `curl` e para os `.cjs`) ou no
   * corpo. Corpo ausente ou inválido não é erro: sem slug, invalida tudo.
   */
  const daQuery = new URL(req.url).searchParams.get("slug");
  const doCorpo = await req
    .json()
    .then((c: unknown) => (c as { slug?: string } | null)?.slug)
    .catch(() => undefined);
  const slug = (daQuery || doCorpo || "").trim();

  const comecou = Date.now();
  let apagadas = 0;
  const revalidadas: string[] = [];
  try {
    apagadas = slug ? await invalidarCursoNoCache(slug) : await invalidateProductCache();

    /**
     * ⚠️ APAGAR O REDIS NÃO BASTA — HÁ UMA SEGUNDA CAMADA, E ELA É DE FORA.
     *
     * Medido em produção, 18/08/2026, com os cabeçalhos das próprias páginas:
     *
     *     /pt-BR/curso/<slug>   Cache-Status: "Netlify Durable"; fwd=bypass
     *                           → NÃO é cacheada no CDN. O Redis é a única
     *                             camada, e a invalidação acima resolve.
     *
     *     /pt-BR/cursos         Cache-Status: "Netlify Durable"; fwd=stale
     *                           → É. `export const revalidate = 900` (15 min),
     *                             servindo velho enquanto revalida atrás.
     *
     *     /api/products         Cache-Status: "Netlify Edge"; hit; ttl=560
     *                           → E o `Netlify-Vary` só varia por parâmetros do
     *                             Next, então nem `?x=aleatório` fura.
     *
     * Ou seja: o catálogo, a home e a rota de lista podiam continuar mostrando
     * título, preço e contagem de aulas antigos por mais 15 minutos DEPOIS de o
     * Redis já estar limpo. Descobri isto porque a contagem de chaves apagadas
     * dava 0 num alvo que eu tinha acabado de aquecer — o pedido de aquecimento
     * nunca chegava à função.
     *
     * `revalidatePath` é o que fura essa camada. Alvos estreitos de propósito:
     * `revalidatePath("/", "layout")` derrubaria as 453 páginas de uma vez.
     */
    for (const locale of routing.locales) {
      const caminhos = slug
        ? [`/${locale}/curso/${slug}`, `/${locale}/curso/${slug}/previa`, `/${locale}/cursos`, `/${locale}`]
        : [`/${locale}/cursos`, `/${locale}`];
      for (const caminho of caminhos) {
        revalidatePath(caminho);
        revalidadas.push(caminho);
      }
    }
  } catch (erro) {
    /**
     * `invalidateCachePattern` já engole os próprios erros e falha aberta, então
     * chegar aqui é anormal. Ainda assim não deixamos virar 500 mudo: quem
     * chama é um script que precisa saber que o cache NÃO foi limpo, para poder
     * avisar em vez de dizer "pronto".
     */
    console.error("[invalidar-cache] falhou:", erro);
    return NextResponse.json(
      { ok: false, erro: (erro as Error)?.message ?? "falha ao invalidar" },
      { status: 500 },
    );
  }

  const ms = Date.now() - comecou;
  console.log(
    `[invalidar-cache] ${slug || "TUDO"}: ${apagadas} chave(s) do Redis, ` +
      `${revalidadas.length} caminho(s) do Next, em ${ms}ms`,
  );
  /**
   * `apagadas` é o que torna este conserto verificável de fora: zero num alvo que
   * acabou de ser lido denuncia invalidação que não casa com as chaves que o
   * `getOrSet` escreve — o defeito silencioso clássico daqui (apagar
   * `products:list` enquanto o cache guarda `v2:products:list`).
   *
   * ⚠️ Mas zero tem DUAS causas, e confundi-las custa tempo. A outra é a chave
   * simplesmente não existir — ou porque o TTL venceu, ou porque o pedido com
   * que você "aqueceu" o cache **nunca chegou até aqui**: a Netlify responde
   * `/api/products` da borda dela por 560s, e o `Netlify-Vary` só varia por
   * parâmetros do Next, então nem `?x=aleatório` fura. Para aquecer de verdade,
   * confira `Cache-Status` na resposta antes de concluir qualquer coisa.
   */
  return NextResponse.json({ ok: true, alvo: slug || "tudo", apagadas, revalidadas, ms });
}
