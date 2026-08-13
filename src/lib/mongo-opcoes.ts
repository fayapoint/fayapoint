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
  serverSelectionTimeoutMS: 30_000,
  socketTimeoutMS: 120_000,
};

/** No ar: pool pequeno, e falhar rápido em vez de pendurar a tela de alguém. */
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

  /**
   * O padrão é 30s. Quando o cluster está sem conexão livre, esse padrão é
   * exatamente a tela girando: o pedido não é recusado, ele ESPERA. Cinco
   * segundos ainda é generoso para um cluster que responde em 28ms, e
   * transforma "o site travou" num erro que dá para tratar.
   */
  serverSelectionTimeoutMS: 5_000,

  /** Consulta que passa disso está travada, não lenta. */
  socketTimeoutMS: 20_000,
};

export const OPCOES_MONGO = EH_BUILD ? NO_BUILD : NO_AR;
