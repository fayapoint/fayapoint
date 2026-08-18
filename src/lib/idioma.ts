/**
 * O idioma, resolvido de um jeito só — e o par de helpers que decide de qual
 * lado do conteúdo bilíngue ler.
 *
 * O site nasceu em português e o inglês entrou depois. Isso tem uma
 * consequência que vale dizer em voz alta: **português é o original, inglês é a
 * tradução**. Toda estrutura de conteúdo bilíngue aqui segue o mesmo desenho —
 * o arquivo/campo em pt-BR fica intocado, e o inglês entra ao lado, aditivo.
 * Assim nenhuma tradução pode regredir a experiência que já está no ar.
 *
 * Por isso `escolher` cai no português quando falta tradução, e não o
 * contrário: faltar inglês mostra português (feio, mas legível e verdadeiro);
 * faltar português mostraria vazio numa página que hoje funciona.
 */

export const IDIOMA_PADRAO = "pt-BR";

/** `en`, `en-US`, `EN` — tudo isso é inglês. Qualquer outra coisa não é. */
export function ehIngles(locale: string | undefined | null): boolean {
  return typeof locale === "string" && locale.toLowerCase().startsWith("en");
}

/**
 * Escolhe entre o original em português e a tradução em inglês.
 *
 * `en` vazio, `null`, `undefined` ou só espaço em branco conta como
 * **não traduzido** — string vazia num campo de tradução é o estado normal de
 * uma migração pela metade, e devolver `""` apagaria o texto da tela.
 */
export function escolher<T>(locale: string | undefined | null, pt: T, en: T | null | undefined): T {
  if (!ehIngles(locale)) return pt;
  if (en === null || en === undefined) return pt;
  if (typeof en === "string" && en.trim() === "") return pt;
  if (Array.isArray(en) && en.length === 0) return pt;
  return en;
}

/** A tag BCP-47 para `toLocaleDateString`/`toLocaleString`. */
export function tagIntl(locale: string | undefined | null): string {
  return ehIngles(locale) ? "en-US" : "pt-BR";
}

/**
 * O idioma de uma chamada de API — lido da QUERY STRING, e de mais nada.
 *
 * ## Por que não do `Referer`, que seria automático
 *
 * Seria mais cômodo: a página `/en/cursos` manda o `Referer` sozinha e nenhuma
 * chamada precisaria mudar. E estaria errado, porque estas rotas são
 * **cacheadas na borda**:
 *
 *     next.config.ts → '/api/products/:path*'
 *                      'public, s-maxage=600, stale-while-revalidate=1800'
 *     netlify.toml   → o mesmo, repetido
 *
 * Cache de CDN é chaveado pela URL. Duas visitas com a mesma URL e `Referer`
 * diferente compartilham a resposta — quer dizer: o primeiro leitor inglês
 * envenenaria o catálogo em inglês para os próximos dez minutos de leitores
 * portugueses, e vice-versa. O idioma na query muda a URL, e portanto a chave.
 *
 * ## Por que o padrão é português
 *
 * Sem `?locale=`, devolve o mesmo que a rota devolvia antes desta mudança.
 * Chamador que ninguém lembrou de atualizar continua funcionando como sempre —
 * texto em português, nunca resposta vazia ou erro.
 */
export function localeDaBusca(searchParams: URLSearchParams): string {
  return ehIngles(searchParams.get("locale")) ? "en" : IDIOMA_PADRAO;
}
