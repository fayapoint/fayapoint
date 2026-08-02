/**
 * Prefixo de idioma em link interno — uma implementação só, para o site inteiro.
 *
 * ⚠️ Por que isto existe (02/08/2026): o cabeçalho e o rodapé, que aparecem em
 * TODA página, emitiam `/cursos`, `/sobre`, `/precos` sem o `/pt-BR`. A URL real
 * é `/pt-BR/cursos` — então cada link interno do site custava um 308 antes de
 * chegar na página. Medido na home em produção: 14 dos 15 links internos sem
 * prefixo.
 *
 * Isso importa por dois motivos e nenhum deles é estético:
 *
 *  1. Rastreamento. O Googlebot segue o redirecionamento, mas gasta uma
 *     requisição para descobrir o que o HTML já poderia ter dito. Num domínio
 *     com 0 backlink, onde o Google já rastreia com parcimônia, gastar metade
 *     do orçamento em 308 é caro.
 *  2. Medição. Ferramenta de auditoria (a nossa inclusive) conta link por URL
 *     escrita: `/cursos` e `/pt-BR/cursos` viram destinos diferentes, e páginas
 *     que recebem link de todo lado aparecem como órfãs.
 *
 * É o mesmo descasamento que fez `Disallow: /login` não casar com `/pt-BR/login`
 * no robots.txt — ver [[reference_seo_armadilhas_locale]].
 */

/** `/cursos` → `/pt-BR/cursos`. Deixa em paz externo, âncora, `/api` e o que já tem prefixo. */
export function comIdioma(href: string, locale: string): string {
  if (!href.startsWith("/")) return href; // http(s), mailto:, tel:, #ancora
  if (href.startsWith("/api")) return href;
  if (/^\/(pt-BR|en)(\/|$)/.test(href)) return href;
  return `/${locale}${href === "/" ? "" : href}`;
}
