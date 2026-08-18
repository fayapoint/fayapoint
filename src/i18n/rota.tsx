import MesclarFatia from "./MesclarFatia";

/**
 * O dicionário de interface que ESTA rota precisa — e só ele.
 *
 * ## O que estava errado antes
 *
 * O dicionário inglês tem 7.712 entradas e 806 KB. Numa primeira redução
 * (18/08/2026) o que ia ao navegador passou a ser a fatia alcançável por
 * QUALQUER componente de cliente do projeto: 6.425 entradas, 580 KB. Melhor,
 * mas ainda a mesma conta para todo mundo — `/en/sobre`, que usa 28 entradas,
 * pagava as mesmas 580 KB de `/en/portal`.
 *
 * Medido por rota (cadeia de layouts + a página), o que cada uma precisa de
 * verdade:
 *
 *     (site)/layout ............   2 KB    ← o que TODA página paga
 *     /sobre, /faq, /blog … ....   2 KB
 *     /ferramentas ............. 120 KB
 *     /cursos .................. 129 KB
 *     / (home) ................. 137 KB
 *     /curso/[slug] ............ 141 KB
 *     /portal .................. 257 KB
 *
 * A união de TODAS as rotas é 566 KB — praticamente a fatia global. Quer dizer:
 * a fatia global não estava errada, estava sendo cobrada da rota errada.
 *
 * ## Como a fatia chega aqui
 *
 * `scripts/i18n/fatiar-por-rota.mjs` caminha o grafo de importação a partir de
 * cada arquivo de rota, marca o que cruza uma fronteira `"use client"`, e grava
 * um JSON por provedor em `messages/rotas/`. Quem NÃO tem provedor cai na fatia
 * raiz (`messages/rotas/_raiz.json`), que o layout raiz entrega — então rota
 * nova nunca fica sem tradução: no pior caso ela engorda a fatia raiz, e o
 * script falha o build quando a raiz passa do teto. Erro barulhento, nunca tela
 * em português.
 *
 * ## ⚠️ Por que a decisão de idioma é aqui, num Server Component
 *
 * A fatia é `prop` de componente de cliente: tudo que ela contiver é
 * serializado no HTML. Se o corte por idioma fosse feito lá dentro
 * (`useLocale() === "en"`), a página PORTUGUESA já teria pago os bytes antes de
 * decidir não usá-los.
 *
 * Isso não é hipótese. Em 18/08/2026 a guarda equivalente foi escrita como
 * `if (!messages[CHAVE_DICIONARIO])` — e `!{}` é `false`, porque em português
 * `request.ts` põe um objeto vazio, não omite a chave. Resultado medido em
 * produção: `/pt-BR/cursos` saltou de 553 KB para 1.174 KB, o dobro, servindo
 * dicionário inglês a quem lê em português. Aqui, quando `locale` não é `"en"`,
 * `MesclarFatia` nem chega a ser renderizado e a fatia não atravessa nada.
 *
 * ## Uso
 *
 * ```tsx
 * import fatia from "../../../../messages/rotas/cursos.json";
 * import { ProvedorDeRota } from "@/i18n/rota";
 *
 * export default async function Layout({ children, params }: Props) {
 *   const { locale } = await params;
 *   return <ProvedorDeRota locale={locale} fatia={fatia}>{children}</ProvedorDeRota>;
 * }
 * ```
 *
 * O `locale` vem de `params`, e não de `getLocale()`, de propósito: 453 páginas
 * são geradas estaticamente e `params` é o que existe com certeza em geração
 * estática, sem depender do armazenamento de requisição do next-intl.
 */
export function ProvedorDeRota({
  locale,
  fatia,
  children,
}: {
  locale: string;
  fatia: Record<string, string>;
  children: React.ReactNode;
}) {
  if (locale !== "en") return <>{children}</>;
  return <MesclarFatia fatia={fatia}>{children}</MesclarFatia>;
}
