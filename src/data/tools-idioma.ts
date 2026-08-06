/**
 * A ficha da ferramenta no idioma pedido.
 *
 * O português mora em `tools-complete.ts` e é a fonte. O inglês mora em
 * `tools-complete.en.json`, gerado por `scripts/i18n/ferramentas.mjs` — arquivo
 * de máquina, não editado à mão. A junção é campo a campo e cai no português
 * sempre que a tradução falta, então uma ficha nova em pt aparece inteira em
 * inglês (em português) no mesmo instante em que é escrita, e melhora quando o
 * script roda. Nunca some.
 *
 * ⚠️ Campos que NÃO existem no arquivo em inglês de propósito: `vendor`,
 * `pricing`, `rating`, `integrations`, `docUrl` e os `slug` dos cursos
 * relacionados. São identificadores, números e nomes de produto — traduzir
 * qualquer um deles quebra link, filtro ou ordenação.
 *
 * ⚠️ `pricing` merece nota: ele é o VALOR do filtro ("Freemium", "Pago") e é
 * comparado por igualdade em `/ferramentas`. Traduzir a string aqui zeraria o
 * resultado do filtro. O rótulo em inglês sai da tabela de mensagens, na tela;
 * o dado continua em português.
 */

import { toolsData } from "@/data/tools-complete";
import traducoes from "@/data/tools-complete.en.json";
import { ehIngles, escolher } from "@/lib/idioma";

type FichaEn = Partial<Record<string, unknown>>;

const EN = traducoes as Record<string, FichaEn>;

/**
 * Junta a ficha em português com a tradução, campo a campo.
 *
 * O parâmetro é `object` e não o tipo exato de `toolsData` de propósito: a
 * página de detalhe tem um `Tool` próprio, com tudo opcional, e duas fichas
 * legadas (`dalle`) declaradas fora do arquivo de dados. Amarrar a assinatura à
 * forma de `toolsData` deixaria essas de fora justamente onde a função é usada.
 * A junção é por chave presente na tradução — o que não existe do lado inglês
 * atravessa intacto.
 */
export function fichaDoIdioma<T extends object>(slug: string, ficha: T, locale: string): T {
  if (!ehIngles(locale)) return ficha;
  const en = EN[slug];
  if (!en) return ficha;

  const saida: Record<string, unknown> = { ...(ficha as Record<string, unknown>) };

  for (const [campo, valorEn] of Object.entries(en)) {
    const valorPt = (ficha as Record<string, unknown>)[campo];

    // Listas de objetos (prompts, relatedCourses): junta item a item para não
    // perder `slug` e `price`, que só existem do lado português.
    if (Array.isArray(valorPt) && Array.isArray(valorEn) && typeof valorPt[0] === "object") {
      saida[campo] = valorPt.map((item, i) => ({
        ...(item as object),
        ...((valorEn[i] as object) ?? {}),
      }));
      continue;
    }

    saida[campo] = escolher(locale, valorPt, valorEn as typeof valorPt);
  }

  return saida as T;
}

/** Todas as fichas no idioma pedido, na mesma ordem de sempre. */
export function fichasDoIdioma(locale: string) {
  return Object.entries(toolsData).map(([slug, ficha]) => ({
    slug,
    ...fichaDoIdioma(slug, ficha, locale),
  }));
}
