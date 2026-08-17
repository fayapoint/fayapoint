import type { MongoClient } from "mongodb";
import mongoose from "mongoose";

import dbConnect from "@/lib/mongodb";

/**
 * UM cliente Mongo por instância. Este arquivo existe para que não exista um
 * segundo.
 *
 * ## O que estava errado
 *
 * Em 13/08/2026 (`ae66f66`) medimos 228 das 500 conexões do cluster abertas com
 * o site parado, e a Atlas mandou dois alertas de "nearing the connection
 * limit". O diagnóstico daquele dia — **cinco pools independentes por
 * instância** (`mongodb.ts` com o Mongoose, mais `database.ts`, `pricing.ts`,
 * `products.ts` e `users.ts`, cada um com o seu `cachedClient`) — estava certo.
 * O conserto, não: pusemos teto (`maxPoolSize: 5`) em cada um dos cinco e
 * deixamos os cinco de pé.
 *
 * Medido em 17/08/2026, no cluster de verdade, um cliente por vez:
 *
 *     um cliente com maxPoolSize:5, ocioso          → 2 conexões
 *     o mesmo cliente sob 8 operações em paralelo   → 4 conexões
 *     CUSTO DE CADA CLIENTE EXTRA                   → 4 conexões
 *
 * Não são 5, e não são 1: o driver mantém um pool **por membro** do replica set
 * e abre conexão de monitoramento que não conta no `maxPoolSize`. Cinco clientes
 * custam ~20 conexões por instância; um custa ~4.
 *
 * E o preço aparece na hora errada. Rajada medida em produção (24 pedidos
 * paralelos em cada uma de 5 rotas, antes desta mudança):
 *
 *     pico de 104 conexões, de uma base de 7 — 100 conexões criadas
 *
 * Na mesma proporção, **~120 visitantes simultâneos batem no teto de 500** e o
 * Atlas passa a recusar conexão nova. E não só para o site: `mission-control`,
 * `worldforge`, `content_factory_ai` e os scripts de geração de curso moram no
 * MESMO cluster e dividem o MESMO orçamento.
 *
 * ## Por que pelo Mongoose, e não um `MongoClient` novo aqui
 *
 * Porque o Mongoose já abre um, ele já está aberto em 111 das 158 rotas, e o
 * repositório já usava esta saída em `monthly-course-offers.ts`. Um cliente
 * serve qualquer banco: `cliente.db('fayapointProdutos')` funciona mesmo com
 * `/fayapoint` na URI. Abrir um segundo cliente para falar com outro banco do
 * mesmo cluster é pagar 4 conexões por nada.
 *
 * ⚠️ NÃO crie `new MongoClient()` em código de runtime. Se precisar do driver
 * cru — agregação, `bulkWrite`, coleção sem model — peça o cliente aqui.
 * (Script de terminal é outro assunto: ver `scripts/mongo-saude.mjs`.)
 */
export async function clienteMongo(): Promise<MongoClient> {
  try {
    await dbConnect();
  } catch (erro) {
    /**
     * ⚠️ A contrapartida honesta da consolidação: antes, um problema do fluxo de
     * conexão do Mongoose derrubava as rotas com model e deixava catálogo,
     * preços e usuários de pé, porque cada um tinha cliente próprio. Agora os
     * quatro pendem daqui.
     *
     * O ganho compensa (5 pools → 1, ~20 conexões por instância → ~4), mas o
     * diagnóstico não pode ficar pior: este rótulo é o que separa "o Mongoose
     * não conectou, e portanto TUDO caiu" de "uma consulta falhou". Sem ele, um
     * incidente destes se descobre por eliminação.
     */
    console.error('[mongo] o cliente compartilhado NÃO conectou — isto derruba todas as leituras do site:', erro);
    throw erro;
  }
  return mongoose.connection.getClient();
}

/**
 * Atalho para quem só quer uma coleção. Evita a repetição de
 * `(await clienteMongo()).db(X).collection(Y)` espalhada por trinta rotas.
 */
export async function colecaoMongo(banco: string, colecao: string) {
  const cliente = await clienteMongo();
  return cliente.db(banco).collection(colecao);
}
