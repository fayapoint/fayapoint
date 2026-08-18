import { Redis } from '@upstash/redis';

import { comTeto } from '@/lib/com-teto';

// Initialize Upstash Redis client only when configured
// Set these in Netlify env vars:
// UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
// UPSTASH_REDIS_REST_TOKEN=xxx
const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Real Redis when configured, no-op stub when not (prevents constructor warnings)
const realRedis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      /**
       * O padrão do cliente é 5 tentativas com espera exponencial
       * (`exp(i) * 50ms`): ~4,3s de espera SOMADA por comando, antes de
       * desistir. Numa pane do Upstash isso não é resiliência — é o middleware
       * inteiro parado enquanto a edge function da Netlify conta o tempo dela.
       *
       * Uma repetição cobre o soluço de rede, que é o que repetição resolve.
       */
      retry: { retries: 1, backoff: () => 100 },
    })
  : null;

// No-op proxy so callers using default export don't need null checks
const noopRedis = new Proxy({} as Redis, {
  get: (_target, prop) => {
    if (typeof prop === 'string') {
      return async (..._args: unknown[]) => null;
    }
    return undefined;
  },
});

const redis = realRedis || noopRedis;

// Cache TTL values in seconds
export const CACHE_TTL = {
  LEADERBOARD: 300,       // 5 minutes - shared, changes slowly
  COMMUNITY_STATS: 300,   // 5 minutes - shared, aggregate data
  GALLERY: 120,           // 2 minutes - public gallery pages
  PRODUCTS: 600,          // 10 minutes - product list rarely changes
  COURSE_CONTENT: 3600,   // 1 hour - course content rarely changes
  USER_SESSION: 60,       // 1 minute - user-specific but cacheable
  SERVICE_PRICES: 1800,   // 30 minutes - prices rarely change
  STORE_FEATURED: 300,    // 5 minutes - featured products
  STORE_PRODUCT: 600,     // 10 minutes - individual store product
  CALENDAR_SLOT: 300,     // 5 minutes - next available slot
  GITHUB_REPOS: 3600,     // 1 hour - GitHub repos
  COURSES_LIST: 1800,     // 30 minutes - courses list (static data)
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  LEADERBOARD: 'leaderboard:weekly',
  COMMUNITY_STATS: 'community:stats',
  GALLERY: (page: number, limit: number) => `gallery:p${page}:l${limit}`,
  PRODUCTS: 'products:list',
  PRODUCT: (slug: string) => `product:${slug}`,
  COURSE_CONTENT: (slug: string) => `course:${slug}`,
  USER_DASHBOARD_STATIC: (userId: string) => `user:${userId}:dashboard:static`,
  SERVICE_PRICES: 'service:prices',
  SERVICE_PRICES_BY_SLUG: (slug: string) => `service:prices:${slug}`,
  STORE_FEATURED: 'store:featured',
  STORE_PRODUCT: (slug: string) => `store:product:${slug}`,
  CALENDAR_SLOT: 'calendar:next-slot',
  GITHUB_REPOS: (username: string, limit: number) => `github:repos:${username}:${limit}`,
  COURSES_LIST: 'courses:list',
  STORE_CATEGORIES: 'store:categories',
  STORE_BRANDS: 'store:brands',
  USER_CREATIONS: (userId: string) => `user:${userId}:creations`,
} as const;

/**
 * Dois tetos, e a diferença entre eles é o ponto.
 *
 * Uma ida ao Upstash foi medida em ~130ms. O que muda de um para o outro não é
 * a velocidade esperada — é o que acontece quando o teto estoura. `comTeto` não
 * cancela nada (ver `com-teto.ts`): ele só desiste de esperar.
 *
 * - **LEITURA (1500ms):** desistir é de graça. O pedido segue para o Mongo e
 *   responde. Teto curto aqui é o que impede um Upstash pendurado de virar tela
 *   girando — e `invalidateCache*`, que agora é esperada no fim de
 *   `generate-image`, entra nesta classe: perder uma invalidação serve dado
 *   velho por um TTL, mas travar a resposta perde a imagem que a pessoa pagou.
 *
 * - **ESCRITA (4000ms):** desistir custa a escrita. Neste ponto o `fetcher` já
 *   terminou e a resposta ainda não saiu, então o `await` é justamente o que
 *   mantém a instância viva o tempo de a escrita chegar ao Upstash. Um teto de
 *   1500ms aqui NÃO protegeria a resposta (ela já está pronta) e transformaria
 *   "escrita lenta" em "escrita perdida" — recriando, no caminho lento, o bug
 *   de cache que nunca enche. 4s é ~30× o tempo medido: só estoura com o Upstash
 *   realmente fora, e aí falha aberta.
 *
 *   E o teto não pode ser generoso demais: subir a versão da chave (`v2:`) faz o
 *   PRIMEIRO pedido de cada rota ser miss garantido depois do deploy. Se o
 *   Upstash pendurar justo aí, várias rotas pagam o teto ao mesmo tempo — e as
 *   rotas de cache (`/api/store/featured`, `/api/public/gallery`,
 *   `community-stats`, `dashboard`) não declaram `maxDuration` próprio. 4s cabe
 *   com folga em qualquer teto de função; 8s começava a namorar o limite.
 *
 * `falhar` e `pendurar` não são a mesma coisa: `.catch()` cobre a primeira e não
 * faz nada pela segunda.
 */
const TETO_LEITURA_MS = 1500;
const TETO_ESCRITA_MS = 4000;

/**
 * O TTL de um resultado NULO, curto de propósito.
 *
 * Cachear "não existe" evita que robô pedindo slug inválido vá ao Mongo o dia
 * inteiro. Mas com o TTL cheio (10 minutos para produto) um curso recém-criado
 * que já tinha recebido um pedido antes de existir continuaria 404 por 10
 * minutos — e `invalidateProductCache()` existe mas ninguém a chama, então nada
 * corrigiria isso antes do TTL vencer.
 *
 * 30 segundos mata a enxurrada de robô (que é por segundo) e limita o dano a
 * uma janela que ninguém percebe.
 */
const TTL_DO_NULO = 30;

export type OpcoesDeCache = {
  /**
   * `false` quando o `null` deste fetcher significa **"ainda não"** e não
   * **"não existe"**.
   *
   * ⚠️ A diferença é concreta e já custa caro aqui. `livro:capitulos:*` e
   * `atelie:capitulos:*` devolvem `null` tanto para "curso inexistente" quanto
   * para "curso existe e o `courseContent` ainda está vazio" — que é o estado
   * dos cursos sendo escritos AGORA. E o estúdio de escrita bate nessas rotas a
   * cada 4 segundos. Cachear esse `null` por 30s faria a tela dizer "sem
   * conteúdo" durante sete ou oito consultas seguidas, para um curso cujo texto
   * acabou de chegar.
   *
   * Só use `cachearNulo: false` quando o nulo for transitório assim. Para slug
   * que não existe — que é o caso do robô — cachear é justamente o objetivo.
   */
  cachearNulo?: boolean;
};

/**
 * `curto` para o que é de graça perder: leitura de cache e invalidação. `folgado`
 * para a escrita do valor, que é a única operação daqui cujo abandono deixa o
 * cache vazio para sempre.
 */
const curto = <T>(p: Promise<T>, oQue: string) => comTeto(p, TETO_LEITURA_MS, `redis ${oQue}`);
const folgado = <T>(p: Promise<T>, oQue: string) => comTeto(p, TETO_ESCRITA_MS, `redis ${oQue}`);

/**
 * ⚠️ MUDOU A FORMA DO QUE VAI AO REDIS — POR ISSO A CHAVE MUDOU JUNTO.
 *
 * O valor agora é embrulhado (`{ v: dado }`) para que "não está no cache" e
 * "está no cache, e é nulo" deixem de ser a mesma coisa. Chave sem versão com
 * forma nova serve dado velho no formato errado — foi o que já aconteceu quando
 * a forma do `getOrSet` mudou e o site serviu 16 minutos de dado antigo. Ao
 * mudar a forma outra vez, **suba esta versão no mesmo commit**.
 */
const VERSAO_DO_CACHE = 'v2';
const comVersao = (chave: string) => `${VERSAO_DO_CACHE}:${chave}`;

/**
 * ⚠️ O envelope guarda `null`, mas NÃO guarda `undefined`.
 *
 * O Upstash serializa objeto com `JSON.stringify`, e `JSON.stringify({v:
 * undefined})` devolve `'{}'` — a chave `v` desaparece, a leitura não encontra
 * envelope e trata como miss. Nenhum dos `getOrSet` de hoje devolve `undefined`
 * (todos usam `null`, array ou objeto), então isto não morde ninguém agora. Mas
 * um fetcher novo que devolva `undefined` fica com cache silenciosamente
 * desligado: devolva `null`.
 */
type Envelope<T> = { v: T };

/**
 * Uma segunda chance para a busca na fonte — e ela existia por acidente.
 *
 * ⚠️ EU TIREI ISTO SEM PERCEBER, E O DASHBOARD DEU 500.
 *
 * A versão anterior do `getOrSet` chamava o `fetcher` DENTRO do `try` que
 * protegia o Redis, e o `catch` terminava em `return await fetcher()`. A
 * intenção era cobrir falha do Redis; o efeito colateral era uma repetição de
 * graça sempre que a fonte falhasse. Ao separar as duas coisas — que está certo,
 * porque falha de cache não deve fazer o Mongo trabalhar duas vezes — eu levei a
 * repetição junto, e um erro passageiro do Mongo passou a virar 500 na cara de
 * quem abriu o portal. Foi o que aconteceu em 17/08/2026, minutos depois do
 * deploy: `/api/user/dashboard` deu 500 uma vez e carregou na segunda tentativa.
 *
 * Agora a repetição é DELIBERADA, e só da fonte:
 *
 * - **uma** tentativa extra, depois de 120ms. Soluço de rede e eleição de
 *   primário no Atlas duram menos que isso; problema de verdade não se resolve
 *   com dez tentativas, só multiplica carga no banco que já está sofrendo.
 * - só para leitura. Todo `fetcher` deste arquivo enche cache — são consultas.
 *   ⚠️ **Não passe por aqui nada que ESCREVA:** repetir escrita não idempotente
 *   é como se cobra duas vezes pela mesma coisa.
 */
async function buscarComUmaSegundaChance<T>(fetcher: () => Promise<T>, chave: string): Promise<T> {
  try {
    return await fetcher();
  } catch (erro) {
    console.warn(`[cache] a fonte de "${chave}" falhou; uma segunda tentativa:`, (erro as Error)?.message);
    await new Promise((r) => setTimeout(r, 120));
    return await fetcher();
  }
}

/**
 * Get cached value or fetch from source
 * @param key Cache key
 * @param fetcher Function to fetch data if cache miss
 * @param ttl Time to live in seconds
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  opcoes?: OpcoesDeCache,
): Promise<T> {
  if (!realRedis) return await fetcher();

  const chave = comVersao(key);

  try {
    const guardado = await curto(redis.get<Envelope<T>>(chave), `get ${chave}`);
    /**
     * O envelope é o que permite cachear resultado NULO. Antes, `null` era lido
     * como "não tem no cache": todo pedido por slug que não existe — e robô faz
     * isso o dia inteiro — ia ao Mongo, guardava `null`, e o próximo ia de novo.
     * Cacheado de verdade, o inexistente custa uma ida ao Redis.
     */
    if (guardado && typeof guardado === 'object' && 'v' in guardado) {
      return guardado.v;
    }
  } catch (error) {
    // Leitura falhou ou estourou o teto: segue para a fonte. Cache é atalho,
    // não caminho único.
    console.error('Redis getOrSet (leitura):', error);
  }

  const data = await buscarComUmaSegundaChance(fetcher, key);

  /**
   * ⚠️ ESTE `await` NÃO PODE SAIR.
   *
   * Esta escrita estava solta (`.catch()`, sem esperar). É o mesmo erro que já
   * está documentado em `rate-limit.ts:77`: numa função serverless a instância
   * é CONGELADA quando a resposta sai, e promessa pendente pode ser descartada
   * ou terminar muito depois. Escrita de cache perdida não dá erro em lugar
   * nenhum — ela reaparece como todo pedido indo ao Mongo, que é justamente a
   * pressão de conexão que derrubou o site em 13/08.
   *
   * O custo é uma ida ao Upstash (~130ms) **só quando deu miss**, com teto e
   * falhando aberto. O benefício é o cache existir.
   */
  const vazio = data === null || data === undefined;
  if (vazio && opcoes?.cachearNulo === false) {
    // Nulo transitório: não guarda nada, para que a próxima consulta veja o dado
    // no instante em que ele existir. Ver `OpcoesDeCache.cachearNulo`.
    return data;
  }

  try {
    const envelope: Envelope<T> = { v: data };
    const validade = vazio ? Math.min(ttl, TTL_DO_NULO) : ttl;
    await folgado(redis.set(chave, envelope, { ex: validade }), `set ${chave}`);
  } catch (error) {
    console.error('Redis getOrSet (escrita):', error);
  }

  return data;
}

/**
 * Invalidate a cache key
 *
 * ⚠️ Apaga a chave VERSIONADA, a mesma que o `getOrSet` escreve. Invalidação que
 * apaga `products:list` enquanto o cache guarda `v2:products:list` não dá erro
 * nenhum — só deixa de invalidar, e o site serve dado velho até o TTL.
 */
export async function invalidateCache(key: string): Promise<number> {
  try {
    if (!realRedis) return 0;
    /**
     * Apaga a versionada E a legada. `invalidateCachePattern` já fazia as duas;
     * esta fazia só uma. Enquanto houver chave `v1` viva no Upstash — inclusive
     * escrita por uma instância do deploy anterior, que coexiste por alguns
     * minutos —, invalidar de verdade é apagar as duas.
     */
    return (await curto(redis.del(comVersao(key), key), `del ${key}`)) ?? 0;
  } catch (error) {
    console.error('Redis invalidate error:', error);
    return 0;
  }
}

/**
 * Invalidate multiple cache keys by pattern (use with caution)
 *
 * O padrão recebido é o de sempre (`'products:*'`); a versão entra aqui, para
 * quem chama não precisar saber que ela existe.
 *
 * ⚠️ Também apaga o que ficou da versão anterior do formato (`products:*` sem
 * prefixo). Enquanto houver chave `v1` viva no Upstash, invalidar de verdade é
 * apagar as duas — a antiga expira sozinha, mas até lá ela existe.
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    if (!realRedis) return 0;
    const encontradas = await curto(
      Promise.all([redis.keys(comVersao(pattern)), redis.keys(pattern)]),
      `keys ${pattern}`,
    );
    const keys = encontradas.flat();
    if (keys.length === 0) return 0;
    await curto(redis.del(...keys), `del ${keys.length} chaves`);
    return keys.length;
  } catch (error) {
    console.error('Redis invalidate pattern error:', error);
    return 0;
  }
}

/**
 * Set cache directly
 *
 * Mesmo envelope e mesma versão do `getOrSet`, para que os dois possam usar a
 * mesma chave sem se atropelar.
 */
export async function setCache<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    if (!realRedis) return;
    await folgado(
      redis.set(comVersao(key), { v: data } satisfies Envelope<T>, { ex: ttl }),
      `set ${key}`,
    );
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Get cache directly
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!realRedis) return null;
    const guardado = await curto(redis.get<Envelope<T>>(comVersao(key)), `get ${key}`);
    if (guardado && typeof guardado === 'object' && 'v' in guardado) {
      return guardado.v;
    }
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export default redis;
