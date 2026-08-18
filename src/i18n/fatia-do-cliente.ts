import fatiaRaiz from "../../messages/rotas/_raiz.json";

import { CHAVE_DICIONARIO } from "./dicionario";

/**
 * O dicionário que TODA página `/en` paga — hoje 2 KB, e a história de como.
 *
 * ## Os três estados
 *
 *     dicionário inteiro no HTML de toda página /en ....... 806 KB
 *     fatia alcançável por qualquer código de cliente ..... 580 KB
 *     fatia da RAIZ (o layout e as rotas leves) ..........   2 KB
 *
 * O segundo estado foi o corte de 18/08/2026: o dicionário serve dois públicos
 * com custos opostos — Server Component lê no servidor e não custa rede nenhuma
 * ao visitante; Client Component lê do provedor, e é isso que viaja. Mandar só
 * o que o código de cliente alcança tirou 226 KB.
 *
 * Só que continuava sendo a MESMA conta para todo mundo: `/en/sobre`, que usa
 * 28 entradas, pagava as mesmas 580 KB de `/en/portal`. O terceiro estado é o
 * recorte por rota — cada rota pesada carrega a sua fatia por um provedor
 * aninhado (`src/i18n/rota.tsx`), e aqui fica só o que o layout e as rotas leves
 * precisam.
 *
 * ⚠️ Rota sem provedor NÃO fica sem dicionário: ela cai nesta fatia raiz, que o
 * gerador engorda sozinho. É de propósito, porque o sintoma de uma chave que
 * falta não é erro — é a frase aparecer em português numa página inglesa, em
 * silêncio. Quando a raiz passa do teto, o `prebuild` falha dizendo qual rota
 * pesada entrou sem provedor. Erro barulhento em vez de tela errada.
 */
export function messagesDoCliente(
  messages: Record<string, unknown>,
): Record<string, unknown> {
  /**
   * ⚠️ `{}` É TRUTHY, E ISSO CUSTOU UM DEPLOY.
   *
   * Em português, `request.ts` não omite a chave: ele põe um objeto VAZIO
   * (`[CHAVE_DICIONARIO]: {}`), porque lá `traduzir` é a identidade. A primeira
   * versão desta guarda era `if (!messages[CHAVE_DICIONARIO]) return messages`
   * — e `!{}` é `false`. Resultado: a página PORTUGUESA trocava o objeto vazio
   * pela fatia INGLESA e passava a carregar 580 KB que nunca usaria.
   *
   * Medido em produção antes do conserto: `/pt-BR/cursos` saltou de 553 KB para
   * **1.174 KB** — o dobro. A otimização tinha piorado exatamente quem ela não
   * devia tocar.
   *
   * A pergunta certa não é "existe a chave?", é "tem tradução dentro?".
   */
  const dicionario = messages[CHAVE_DICIONARIO];
  const temTraducao =
    dicionario && typeof dicionario === "object" && Object.keys(dicionario).length > 0;
  if (!temTraducao) return messages;

  return { ...messages, [CHAVE_DICIONARIO]: fatiaRaiz };
}
