/**
 * O dossiê de `/casos` no idioma pedido.
 *
 * O português mora em `casos.ts` e é a fonte. O inglês mora em
 * `casos.en.json`, gerado por `scripts/i18n/casos.mjs` — arquivo de máquina,
 * não editado à mão. A junção é campo a campo e cai no português sempre que a
 * tradução falta, então um trabalho novo aparece inteiro em inglês (em
 * português) no mesmo instante em que é escrito, e melhora quando o script
 * roda. Nunca some.
 *
 * ## Por que existe
 *
 * Item 12 do laudo de 26/08/2026: `/en/casos` tinha 36 trechos em português —
 * a página inteira. O cromo do site é traduzido pelo next-intl; o dossiê não
 * vem de `messages/`, e por isso passava batido.
 *
 * ## ⚠️ Campos que NÃO são traduzidos, de propósito
 *
 * `videos[].titulo` são os títulos REAIS dos vídeos do canal — registro de
 * acervo, não texto de tela. `org` e `cidade` são nomes próprios. `ferramentas`
 * e `hardware` são nomes de produto. `periodo` é uma faixa de anos. Traduzir
 * qualquer um deles inventaria um fato.
 *
 * É o mesmo desenho de `tools-idioma.ts`, e pelo mesmo motivo.
 */

import { ATOS, TRABALHOS, type Ato, type Trabalho } from "@/dados/casos";
import traducoes from "@/dados/casos.en.json";
import { ehIngles } from "@/lib/idioma";

type FichaEn = Record<string, unknown>;

const EN = traducoes as {
  trabalhos?: Record<string, FichaEn>;
  atos?: Record<string, FichaEn>;
};

/** Aplica a tradução campo a campo; o que falta atravessa em português. */
function juntar<T extends object>(base: T, ficha: FichaEn | undefined): T {
  if (!ficha) return base;
  const saida: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [campo, valor] of Object.entries(ficha)) {
    if (valor === undefined || valor === null) continue;
    // `fotos` chega como lista de {legenda}: só a legenda troca, o `src` fica.
    if (campo === "fotos" && Array.isArray(valor) && Array.isArray(saida.fotos)) {
      saida.fotos = (saida.fotos as { src: string; legenda: string }[]).map((f, i) => {
        const t = (valor as { legenda?: string }[])[i];
        return t?.legenda ? { ...f, legenda: t.legenda } : f;
      });
      continue;
    }
    saida[campo] = valor;
  }
  return saida as T;
}

export function casosDoIdioma(locale: string): { atos: Ato[]; trabalhos: Trabalho[] } {
  if (!ehIngles(locale)) return { atos: ATOS, trabalhos: TRABALHOS };
  return {
    atos: ATOS.map((a) => juntar(a, EN.atos?.[String(a.ato)])),
    trabalhos: TRABALHOS.map((t) => juntar(t, EN.trabalhos?.[t.slug])),
  };
}
