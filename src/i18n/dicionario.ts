/**
 * O dicionário de interface: tradução chaveada pelo PRÓPRIO texto em português.
 *
 * ── Por que não `messages/en.json` com chave inventada ────────────────────────
 *
 * O `messages/*.json` continua sendo o certo para a parte do site escrita à mão:
 * chave estável, ICU, plural, interpolação. Ele resolveu a vitrine.
 *
 * O portal do aluno é outro problema. São ~1.100 trechos em 45 arquivos, e a
 * parte cara não é traduzir — é INVENTAR 1.100 chaves e reescrever 45 arquivos
 * sem quebrar nada. Pior: metade dos trechos mora em constante de módulo
 * (`const NIVEIS = { basic: "Básico" }`), onde hook é proibido e onde a chave
 * teria de subir junto, mudando a forma do dado.
 *
 * Chaveando pelo português isso vira outro trabalho:
 *
 *  - **O dado fica intocado.** `NIVEIS` continua em português. Só o lugar onde
 *    o valor chega na tela muda: `{nivel}` → `{T(nivel)}`. Uma edição por
 *    RENDER, e não uma por dado.
 *  - **Em pt-BR é a função identidade.** Sem tradução, devolve a entrada. Isso
 *    não é um detalhe de implementação: é a garantia mecânica de que a árvore
 *    portuguesa sai idêntica, que é a regra do projeto ([[idioma.ts]]).
 *  - **O JSON se lê como glossário.** `"Meus cursos": "My courses"` é auditável
 *    por quem não abre o código — inclusive pelo Ricardo.
 *
 * O preço é conhecido e aceito: texto repetido tem uma entrada só (bom), e duas
 * telas que usem a mesma palavra em sentidos diferentes ficam presas à mesma
 * tradução (raro em interface, e o dicionário mostra o choque na revisão).
 *
 * ── Entrega ───────────────────────────────────────────────────────────────────
 *
 * O dicionário viaja dentro das `messages` do next-intl, sob a chave
 * `DicionarioInterface` (ver `request.ts`). Duas consequências que valem o
 * caminho: quem lê em português **não baixa um byte** da tradução, e não entra
 * mecanismo novo de entrega no aplicativo — é o mesmo provedor que já existe.
 *
 * A leitura é índice de objeto, e não `t("chave")`, de propósito: o next-intl
 * trata `.` como separador de namespace, e frase em português tem ponto final.
 */

import { useMessages } from "next-intl";

/** A chave sob a qual o dicionário viaja nas `messages`. */
export const CHAVE_DICIONARIO = "DicionarioInterface";

export type Dicionario = Record<string, string>;

/**
 * A chave do dicionário a partir do texto: aparada e com o espaço interno
 * achatado.
 *
 * Texto de JSX carrega a indentação do arquivo — uma frase quebrada em três
 * linhas chega aqui com `\n` e doze espaços no meio. Sem achatar, a MESMA frase
 * indentada de outro jeito viraria outra entrada, e reindentar o arquivo
 * quebraria a tradução em silêncio. O HTML já achata isso na hora de desenhar;
 * aqui só fazemos a chave concordar com o que a tela mostra.
 */
export function chaveDe(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

/**
 * Traduz um texto de interface. Sem entrada no dicionário, devolve o original —
 * **o mesmo objeto**, e não uma cópia normalizada: em português esta função é a
 * identidade, e é isso que garante que a árvore pt-BR saia byte a byte igual.
 */
export function traduzir<T extends string | undefined | null>(
  dicionario: Dicionario | undefined,
  texto: T,
): T {
  if (!texto || !dicionario) return texto;
  const achado = dicionario[chaveDe(texto)];
  if (!achado) return texto;
  // devolve preservando o espaço em volta que o JSX tinha
  const antes = texto.slice(0, texto.length - texto.trimStart().length);
  const depois = texto.slice(texto.trimEnd().length);
  return `${antes}${achado}${depois}` as T;
}

/**
 * O tradutor de interface para componentes de cliente.
 *
 * ```tsx
 * const T = useT();
 * <h1>{T("Meus cursos")}</h1>
 * <span>{T(nivel)}</span>   // funciona igual com valor vindo de constante
 * ```
 *
 * ⚠️ Sem `useCallback` de propósito. O `useMessages` do next-intl funciona nos
 * dois lados — cliente e Server Component — mas `useCallback` é hook do React e
 * lança em Server Component. Metade das páginas que precisam disto (`/inventando`,
 * `/ferramentaria`) é servidor. A identidade nova a cada render custa nada aqui:
 * `T` é chamada durante o render, nunca passada como dependência.
 */
export function useT() {
  const messages = useMessages() as Record<string, unknown> | undefined;
  const dicionario = messages?.[CHAVE_DICIONARIO] as Dicionario | undefined;
  /**
   * Aceita `undefined` porque campo opcional de dado (`item.title?`) é
   * renderizado direto no JSX o tempo todo, e obrigar `!` no ponto de uso
   * trocaria um problema de tradução por um de tipo.
   */
  return <T extends string | undefined | null>(texto: T): T => traduzir(dicionario, texto);
}
