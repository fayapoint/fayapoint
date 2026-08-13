/**
 * As opções de conexão do Mongo, num lugar só — e por que elas existem.
 *
 * ⚠️ ISTO É O QUE IMPEDE UM ÚNICO SERVIDOR DE DERRUBAR O BANCO INTEIRO.
 *
 * Medido em 13/08/2026, com o site praticamente parado e 23 usuários no banco:
 * **228 das 500 conexões do cluster estavam abertas**, `totalCreated: 7825`. A
 * Atlas mandou dois alertas de "nearing the connection limit" e avisou o que
 * acontece depois: *"You will not be able to open new connections to your
 * cluster until existing connections have been closed."* Do lado do site, isso
 * aparece como as rotas logadas (`/api/user/profile`, `/api/user/dashboard`,
 * `/api/credits`) levando **11 a 23 segundos** — não porque a consulta é lenta
 * (medida daqui: 28ms), mas porque o pedido fica na fila esperando conexão.
 *
 * A causa é aritmética. O código abre **cinco pools independentes** por
 * instância — `mongodb.ts` (Mongoose), `database.ts`, `pricing.ts`,
 * `products.ts` e `users.ts`, cada um com o seu `cachedClient` — e nenhum deles
 * declarava `maxPoolSize`. O padrão do driver é **100**. Cinco pools de 100 dá
 * **500 conexões por instância**, que é exatamente o teto do cluster inteiro:
 * UMA instância aquecida podia consumir tudo sozinha.
 *
 * ⚠️ E assinar um plano maior NÃO resolve isto sozinho. O pool não tem teto por
 * instância, então mais tráfego significa mais instâncias, e mais instâncias
 * significam mais pools de 100 — qualquer limite novo é alcançado do mesmo
 * jeito, só que mais caro. O teto precisa estar aqui.
 *
 * `maxIdleTimeMS` é o que **devolve** conexão ao cluster: sem ele, uma conexão
 * aberta para uma consulta de 28ms fica pendurada enquanto a instância viver.
 */

/**
 * ⚠️ O BUILD E O SITE NO AR SÃO CARGAS OPOSTAS. Uma régua só quebra um dos dois.
 *
 * No ar, cada servidor da Netlify atende UM pedido por vez e existe aos montes:
 * o perigo é o número de conexões, e a resposta certa é pool pequeno e prazo
 * curto — melhor um erro tratável do que a tela girando.
 *
 * No build é o contrário: são 31 processos gerando 453 páginas ao mesmo tempo,
 * cada um com pressa e sem ninguém esperando na frente da tela. Medido em
 * 13/08/2026, na primeira tentativa com a régua do runtime aplicada aos dois:
 * `MongoNetworkTimeoutError` seis vezes e quatro páginas estourando o teto de
 * 60s do Next — inclusive a home. Prazo curto ali não protege ninguém, só
 * transforma fila em build quebrado.
 */
const EH_BUILD = process.env.NEXT_PHASE === "phase-production-build";

/** Build: janela curta, ninguém olhando, vale gastar conexão para terminar. */
const NO_BUILD = {
  maxPoolSize: 20,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
};

/**
 * No ar: só o teto do pool. NADA de prazo inventado.
 *
 * ⚠️ AQUI EU JÁ DERRUBEI O SITE UMA VEZ. Não repita.
 *
 * A primeira versão desta constante trazia `socketTimeoutMS: 20_000` e
 * `serverSelectionTimeoutMS: 5_000`, escolhidos por parecerem generosos — sem
 * eu ter medido quanto o trabalho realmente leva. Resultado em produção, em
 * 13/08/2026, poucos minutos depois do deploy:
 *
 *     Duration: 60000 ms
 *     Redis getOrSet error: MongoNetworkTimeoutError: connection 2 ... timed out
 *
 * e a home devolvendo **500 em 5 de 5 pedidos**, com "the edge function timed
 * out". Medido depois, com o prazo padrão: a PRIMEIRA regeneração de uma página
 * ISR contra o Mongo leva **30 e poucos segundos** (a home levou 33s; depois
 * caiu para 0,9s). Com prazo de 20s ela nunca terminava — a página nunca ficava
 * pronta, e todo pedido seguinte repetia o mesmo erro para sempre.
 *
 * **Um teto mais curto que o trabalho não protege: ele transforma "lento" em
 * "nunca".** E o custo aparece só quando a primeira página vence a validade,
 * bem depois de o deploy parecer bem-sucedido.
 *
 * O que resolvia o problema medido (228 das 500 conexões abertas com o site
 * parado) era o **teto do pool**, e só ele. Os prazos foram invenção minha em
 * cima. Ficam os padrões do driver — que funcionavam.
 */
const NO_AR = {
  /**
   * Cinco por pool. Uma função serverless atende um pedido por vez, então uma
   * conexão já bastaria; cinco dá folga para as chamadas em paralelo de uma
   * mesma rota sem multiplicar nada. Com cinco pools, são 25 por instância —
   * cabem 20 instâncias simultâneas dentro do M0 sem chegar perto do teto.
   */
  maxPoolSize: 5,

  /** Nada de conexão ociosa reservada: instância nova não nasce cobrando. */
  minPoolSize: 0,

  /** Conexão parada há 30s volta para o cluster em vez de morrer com a instância. */
  maxIdleTimeMS: 30_000,
};

export const OPCOES_MONGO = EH_BUILD ? NO_BUILD : NO_AR;
