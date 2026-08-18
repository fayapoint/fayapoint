import { NextRequest, NextResponse } from "next/server";

import { verifyAdminToken } from "@/lib/admin-auth";
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

async function autorizado(req: NextRequest): Promise<boolean> {
  const segredo = process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
  if (segredo && req.headers.get("x-social-secret") === segredo) return true;

  const admin = await verifyAdminToken(req).catch(() => null);
  return Boolean(admin?.valid && admin.admin);
}

export async function POST(req: NextRequest) {
  if (!(await autorizado(req))) {
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
  try {
    if (slug) {
      await invalidarCursoNoCache(slug);
    } else {
      await invalidateProductCache();
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
  console.log(`[invalidar-cache] ${slug || "TUDO"} em ${ms}ms`);
  return NextResponse.json({ ok: true, alvo: slug || "tudo", ms });
}
