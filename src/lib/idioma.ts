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
