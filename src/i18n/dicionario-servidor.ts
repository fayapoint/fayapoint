import { getMessages } from "next-intl/server";
import { CHAVE_DICIONARIO, traduzir, type Dicionario } from "./dicionario";

/**
 * O mesmo dicionário de `dicionario.ts`, para Server Component ASSÍNCRONO.
 *
 * ⚠️ Por que dois arquivos, e não uma função só:
 *
 * `useMessages()` é hook. Componente de servidor `async` não pode chamar hook —
 * o build não avisa com clareza, ele quebra na PRÉ-RENDERIZAÇÃO com
 * "Expected a suspended thenable. This is a bug in React", que não menciona
 * hook nem idioma. Foi assim que a `/inventando/[slug]` derrubou o build
 * inteiro depois que o codemod passou por ela.
 *
 * A separação em arquivo próprio também é obrigatória por outro motivo:
 * `next-intl/server` não pode ser importado de um componente de cliente, e
 * `dicionario.ts` é importado por dezenas deles.
 *
 * ```tsx
 * export default async function Pagina({ params }) {
 *   const { locale } = await params;
 *   const T = await obterT(locale);
 *   return <h1>{T("Ferramentas")}</h1>;
 * }
 * ```
 */
export async function obterT(locale?: string) {
  const messages = (await getMessages(locale ? { locale } : undefined)) as Record<string, unknown>;
  const dicionario = messages?.[CHAVE_DICIONARIO] as Dicionario | undefined;
  return <T extends string | undefined | null>(texto: T): T => traduzir(dicionario, texto);
}
