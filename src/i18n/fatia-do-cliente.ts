import fatia from "../../messages/dicionario.cliente.en.json";

import { CHAVE_DICIONARIO } from "./dicionario";

/**
 * O dicionário que o NAVEGADOR recebe — e por que não é o mesmo do servidor.
 *
 * ## O número
 *
 * `messages/dicionario.en.json` tem **7.712 entradas e 806 KB**, e ia inteiro
 * dentro das `messages` do next-intl. Como o `NextIntlClientProvider` serializa
 * o que recebe, isso significava 806 KB embutidos no HTML de **toda página
 * `/en`**, inclusive nas que não usam uma linha dele. Medido em 18/08/2026, já
 * comprimido, que é o que o visitante paga:
 *
 *     /pt-BR/cursos     553 KB cru ·  88 KB comprimido
 *     /en/cursos      1.342 KB cru · 341 KB comprimido
 *
 * ## Por que dá para cortar
 *
 * O dicionário serve dois públicos com custos opostos:
 *
 * - **Server Component** (`obterT`, e `useT` em componente síncrono de servidor)
 *   lê no servidor. Custo de rede: zero. É quem renderiza as páginas de conteúdo
 *   longo — notícia, ferramenta, `/inventando` —, de onde vem a maior parte das
 *   entradas.
 * - **Client Component** (`useT`) lê do provedor, e é isso que viaja.
 *
 * A fatia é gerada por `scripts/i18n/fatiar-dicionario.mjs`, que caminha o
 * **grafo de importação** a partir de cada arquivo `"use client"` e recolhe todo
 * literal de string que exista no dicionário.
 *
 * ⚠️ Grafo, e não "literais do próprio arquivo". Há **935** chamadas
 * `T(variável)` em componentes de cliente — `T(post.title)`,
 * `T(step.description)` —, e o valor delas costuma vir de uma constante em outro
 * módulo (`src/data/blog-posts.ts` e companhia). Recortar só pelo arquivo
 * deixaria essas de fora, e o sintoma seria a tela inglesa voltando a português
 * **em silêncio**, que é a armadilha cara deste projeto.
 *
 * ⚠️ String vinda do BANCO (título de curso, corpo de notícia) nunca esteve no
 * dicionário — ele é gerado varrendo o código-fonte, não o Mongo. Para ela
 * `traduzir()` já devolvia o original antes desta mudança e continua devolvendo:
 * por esse caminho não há regressão possível. Conteúdo de banco se traduz por
 * outro mecanismo (`i18n.en` no produto, `conteudoTraduzido` nas aulas).
 *
 * ## O que sobra, e qual seria o próximo passo
 *
 * A fatia ainda é grande porque um punhado de módulos de dados é importado por
 * páginas que são componentes de CLIENTE — `src/data/tools-complete.ts` sozinho
 * responde por 115 KB, puxado por `/ferramentas` e `/ferramentaria`.
 *
 * Medido por rota (layout + rota), o que cada uma precisaria de verdade:
 *
 *     layout ...................  0 KB   ← o que TODA página deveria pagar
 *     mediana das 98 rotas .....  0 KB
 *     /cursos .................. 127 KB
 *     /portal .................. 253 KB
 *
 * Ou seja: o recorte realmente certo é **por rota**, com provedor aninhado nas
 * ~12 rotas pesadas. Não foi feito aqui porque escolher a fatia no layout exige
 * saber o caminho, e ler `headers()` no layout raiz tira as 453 páginas da
 * geração estática — o remédio seria pior. Os números por rota acima ficam
 * registrados para quem pegar isto: a medição já está feita.
 */
export function messagesDoCliente(
  messages: Record<string, unknown>,
): Record<string, unknown> {
  /**
   * Em português o dicionário nem existe nas `messages` (ver `request.ts`) —
   * `traduzir` é a identidade. Não há o que reduzir, e criar a chave aqui faria
   * a árvore portuguesa carregar um objeto vazio à toa.
   */
  if (!messages[CHAVE_DICIONARIO]) return messages;

  return { ...messages, [CHAVE_DICIONARIO]: fatia };
}
