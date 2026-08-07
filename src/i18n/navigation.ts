/**
 * Link que carrega o idioma sozinho.
 *
 * ⚠️ POR QUE ISTO EXISTE (07/08/2026)
 *
 * O site ficou em inglês, mas quem entrava por `/en/cursos` e clicava num curso
 * caía em `/pt-BR/...` — porque o `href` era `/curso/<slug>` cru e o middleware
 * redireciona (308) toda URL sem idioma para o `defaultLocale` do visitante. O
 * Ricardo viu isso como "os cursos não ficaram em inglês", e estava certo: a
 * tradução funcionava, a NAVEGAÇÃO é que trocava de idioma no meio do caminho.
 *
 * O padrão até aqui era escrever `/${locale}/curso/...` à mão em cada `href`.
 * Isso funciona e falha do mesmo jeito: 28 pontos escaparam em 21 arquivos,
 * porque um padrão que depende de lembrar não é um padrão, é uma aposta. Um
 * `href` esquecido não quebra o build, não quebra o `tsc`, não aparece no
 * console — só troca o idioma do site para quem clicou.
 *
 * `createNavigation` resolve na origem: este `Link` prefixa o idioma ATUAL
 * sozinho, em Server e em Client Component (o next-intl tem build para os dois).
 *
 * ⚠️ Ao trocar `next/link` por este import num arquivo, TIRE o `/${locale}`
 * escrito à mão dos hrefs desse arquivo — senão sai `/en/en/curso/...`.
 *
 * Para sair do idioma de propósito (âncora externa, download, rota fora do
 * `[locale]`), continue usando o `next/link` normal.
 *
 * ⚠️ SÃO DOIS MECANISMOS, E ISSO É DE PROPÓSITO — mas NÃO MISTURE OS DOIS NO
 * MESMO ARQUIVO (é assim que nasce `/en/en/curso/...`):
 *
 *   • este `Link`  → href escrito à mão no JSX. Prefixa sozinho.
 *   • `comIdioma(href, locale)` de `@/lib/rota-idioma` → href que vem de DADO
 *     (`seed-news.ts`, CMS, banco), onde quem escreveu o dado não tinha como
 *     saber o idioma do leitor. É idempotente: ignora o que já tem prefixo.
 *
 * A regra é a origem do href, não a preferência de quem edita.
 */
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
