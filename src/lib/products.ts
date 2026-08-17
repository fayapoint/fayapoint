/**
 * Product Data Layer
 * 
 * Functions to fetch and manage products from MongoDB
 * With Redis caching for performance optimization
 */

import type { MongoClient, Collection } from 'mongodb';
import { clienteMongo } from '@/lib/mongo-cliente';
import { getOrSet, CACHE_TTL, CACHE_KEYS, invalidateCachePattern } from '@/lib/redis';
import {
  computeLessonContentCoverage,
  normalizeEditorialVerification,
  type EditorialVerification,
  type LessonContentCoverage,
} from '@/lib/editorial-verification';
import { getCourseMonthlyOfferMeta, type CourseMonthlyOfferMeta } from '@/lib/monthly-course-offers';
import { ehIngles } from '@/lib/idioma';

const DATABASE_NAME = 'fayapointProdutos';
const COLLECTION_NAME = 'products';

/**
 * O cliente compartilhado — este módulo não abre mais pool próprio.
 * Ver `mongo-cliente.ts`: cada cliente extra custava 4 conexões medidas.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clienteMongo();
}

// Get products collection
async function getProductsCollection(): Promise<Collection> {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(COLLECTION_NAME);
}

// Product type definition
export interface Product {
  _id?: string;
  productId: string;
  slug: string;
  type: 'course' | 'service' | 'product';
  status: 'active' | 'inactive' | 'draft';
  /**
   * Saiu do catálogo mas continua legível por quem já tem. Ver `SEM_APOSENTADOS`.
   *
   * ⚠️ NÃO use `status: 'inactive'` para aposentar: aquilo derruba a página do
   * curso e leva junto o livro pago de quem comprou.
   */
  aposentado?: boolean;
  /** Para onde mandar quem procurava este curso. Slug do sucessor. */
  sucessor?: string;
  name: string;
  shortName: string;
  tool: string;
  categoryPrimary: string;
  categorySecondary: string;
  tags: string[];
  level: string;
  targetAudience: string[];
  pricing: {
    currency: string;
    price: number;
    originalPrice: number;
    discount: number;
    /** Nota exibida junto ao preço (ex.: valor simbólico de processamento) */
    note?: string;
    installments?: {
      enabled: boolean;
      maxInstallments: number;
    };
  };
  metrics: {
    duration: string;
    lessons: number;
    students: number;
    rating: number;
    reviewCount: number;
    completionRate: number;
    lastUpdated: string;
  };
  copy: {
    headline: string;
    subheadline: string;
    shortDescription: string;
    fullDescription: string;
    benefits: string[];
    impactIndividuals: string[];
    impactEntrepreneurs: string[];
    impactCompanies: string[];
  };
  curriculum: {
    moduleCount: number;
    modules: Array<{
      id: number;
      title: string;
      description: string;
      duration: string;
      lessons: number;
    }>;
  };
  bonuses: Array<{
    title: string;
    value: number;
    description: string;
  }>;
  guarantees: string[];
  testimonials: Array<{
    name: string;
    role: string;
    company?: string;
    rating: number;
    comment: string;
    impact: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  cta: {
    primary: {
      text: string;
      url: string;
      style: string;
    };
    secondary?: {
      text: string;
      url: string;
      style: string;
    };
    whatsapp?: {
      enabled: boolean;
      number: string;
      message?: string;
    };
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
  };
  digitalAssets: unknown[];
  features: string[];
  contentChapters?: number;
  contentUpdatedAt?: string | Date | null;
  /**
   * Markdown do curso inteiro. Já vinha do banco e era lido por rotas que o
   * acessavam via `as` — a prévia pública (`/curso/<slug>/previa`) usa direto,
   * então o campo passou a ser declarado.
   */
  courseContent?: string;
  detailedCurriculum?: Array<{
    title?: string;
    description?: string;
    lessons?: Array<{
      title?: string;
      description?: string;
      duration?: number;
      order?: number;
      isFree?: boolean;
      hasContent?: boolean;
      content?: string;
      contentLength?: number;
    }>;
  }>;
  editorialVerification?: EditorialVerification;
  lessonContentCoverage?: LessonContentCoverage;
  thumbnail?: string;
  trailer?: string;
  monthlyOffer?: CourseMonthlyOfferMeta | null;
  featured?: boolean;
  featuredOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ── APOSENTADO ≠ INATIVO (16/08/2026) ─────────────────────────────────────
 *
 * Ricardo mandou tirar do catálogo os cursos repetidos — os que ensinam o mesmo
 * tema que um curso já no padrão do `chatgpt-zero` (n8n, Midjourney, Perplexity
 * e ChatGPT tinham cada um dois).
 *
 * O caminho óbvio era `status: 'inactive'`. **Ele quebra quem já comprou.**
 * `getProductBySlug` filtra `status: 'active'`, e a página `/curso/<slug>` faz
 * `notFound()` sem produto — então o botão "Ler no curso" do livro que o
 * Ricardo pagou (`chatgpt-masterclass`, 25 créditos, 16 capítulos escritos)
 * cairia num 404. É a mesma lição de 13/08, quando `enrolledCourses.isActive`
 * escondeu esse mesmo livro: **desligar a vitrine não pode desligar a porta de
 * quem já entrou.**
 *
 * `aposentado: true` separa as duas coisas:
 *   - some das LISTAS (catálogo, busca, destaques, relacionados) → não se vende;
 *   - a PÁGINA continua resolvendo → quem tem, lê; e a URL indexada não vira 404.
 *
 * ⚠️ Toda consulta de LISTA precisa de `SEM_APOSENTADOS`. Consulta por slug
 * NÃO leva — é justamente o que mantém a porta aberta.
 */
export const SEM_APOSENTADOS = { aposentado: { $ne: true } } as const;

function normalizeProduct(product: unknown): Product {
  const safeProduct = (product || {}) as Product;
  const detailedCurriculum = Array.isArray(safeProduct.detailedCurriculum)
    ? safeProduct.detailedCurriculum
    : [];

  const lessonContentCoverage = computeLessonContentCoverage(detailedCurriculum);

  return {
    ...safeProduct,
    detailedCurriculum,
    lessonContentCoverage,
    /**
     * ⚠️ Passa o PRODUTO, não o slug (03/08/2026).
     *
     * Com string, `getCourseMonthlyOfferMeta` cai em `getCourseBySlug` — a
     * lista estática de 18 cursos — e devolve `null` para todo curso que só
     * existe no banco. `monthlyOffer: null` viaja no payload da API e quem o
     * consome lê como "nenhum plano tem acesso": a página de venda e a vitrine
     * pública passavam a tratar o curso lançado na véspera como bloqueado.
     *
     * O produto já traz `level` e `pricing.price` — é tudo de que a função
     * precisa para responder pelo nível, sem consultar arquivo nenhum.
     */
    monthlyOffer:
      safeProduct.type === 'course'
        ? getCourseMonthlyOfferMeta({
            slug: safeProduct.slug,
            level: safeProduct.level,
            price: safeProduct.pricing?.price,
          })
        : null,
    editorialVerification: normalizeEditorialVerification(
      safeProduct.editorialVerification
    ),
  };
}

/**
 * Os campos que NUNCA podem atravessar a fronteira servidor→cliente.
 *
 * ⚠️ Medido em 04/08/2026 na `/cursos` servida em produção local: **4,3 MB de
 * HTML**, dos quais 3,9 MB eram payload RSC. Dentro dele, o texto das aulas dos
 * 22 cursos — 230 blocos "## Exercício Prático", 230 "Dica Pro" e 221 "O que
 * levar deste capítulo". Ou seja: **o conteúdo pago inteiro do catálogo estava
 * legível com "ver código-fonte", numa página pública, sem login.**
 *
 * A causa não é um bug de lógica, é a fronteira: `getAllProducts()` devolve o
 * documento completo do Mongo, e a página passava esse documento como prop para
 * `CoursesCatalog`, que é um Client Component. Tudo que é passado a um Client
 * Component é serializado no HTML — mesmo o que nenhum componente renderiza.
 *
 * Três estragos ao mesmo tempo:
 *   1. **comercial** — o curso que custa R$149 podia ser lido de graça;
 *   2. **SEO** — o Google indexa o conteúdo pago numa URL de vitrine, criando
 *      duplicata do próprio produto (e a indexação já está em 20/170);
 *   3. **desempenho** — 4,3 MB numa página que abre no celular de quem recebeu
 *      um flyer.
 *
 * ⚠️ É lista de EXCLUSÃO e não de inclusão de propósito: uma lista de inclusão
 * quebraria a vitrine em silêncio no dia em que um card passasse a mostrar um
 * campo novo. Aqui, o pior caso de esquecer um campo é peso a mais — nunca
 * tela quebrada. Mas o `courseContent` é o que importa: se um campo novo
 * carregar texto de aula, ele precisa entrar nesta lista.
 */
const CAMPOS_FORA_DA_VITRINE = [
  'courseContent',
  'detailedCurriculum',
  'canonModels',
  // A tradução inglesa do produto. Depois que `paraIdioma` resolveu o idioma,
  // ela é peso morto — e mandá-la junto faria a vitrine viajar com o catálogo
  // inteiro DUAS vezes, uma em cada língua. Rede de segurança: mesmo que
  // alguém esqueça o `paraIdioma`, este campo nunca atravessa a fronteira do
  // Client Component.
  'i18n',
] as const;

/**
 * O produto reduzido ao que a vitrine precisa mostrar.
 *
 * Use SEMPRE que produtos forem passados como prop para um Client Component.
 * Para a página de venda de UM curso, que precisa do currículo, continue
 * passando o produto inteiro — lá o custo é de um curso, não de vinte e dois,
 * e o `courseContent` segue de fora.
 */
export function paraVitrine(produtos: Product[]): Product[] {
  return produtos.map((p) => {
    const copia = { ...p } as Record<string, unknown>;
    for (const campo of CAMPOS_FORA_DA_VITRINE) delete copia[campo];
    return copia as unknown as Product;
  });
}

/**
 * O que NÃO sai do Mongo quando se lê uma LISTA de produtos.
 *
 * ⚠️ ISTO DERRUBOU O SITE. Não remova sem medir de novo.
 *
 * `paraVitrine` (acima) resolve a fronteira do Client Component — impede que o
 * texto das aulas seja serializado no HTML público. Mas ele age tarde demais
 * para o banco: quando ele roda, os megabytes já viajaram do Atlas até a
 * função, já foram normalizados e já foram gravados no Redis.
 *
 * Medido em 13/08/2026 contra a produção, os 22 cursos ativos:
 *
 *     sem projeção : 3,99 MB em 41.793 ms
 *     com projeção : 0,22 MB em  2.580 ms
 *
 * Quarenta e dois segundos. A home é ISR de 30 minutos: quando a validade
 * vence, o primeiro visitante paga essa conta inteira enquanto a `geoblock`
 * espera na borda — e a borda desiste antes. É exatamente o
 * "This edge function has crashed / the edge function timed out" que o Ricardo
 * fotografou, e o mesmo `MongoNetworkTimeoutError` que aparece no log de
 * `6e18ce3`. Naquele dia a conclusão foi "o teto do pool é menor que o
 * trabalho". Era verdade, mas incompleta: **o trabalho é que estava errado.**
 * Nenhuma tela de lista mostra o corpo das aulas.
 *
 * Confirmado ao vivo antes do conserto: `GET /api/products?type=course`
 * respondeu **500 depois de 36.471 ms** em produção.
 *
 * ⚠️ É lista de EXCLUSÃO, como a de cima e pelo mesmo motivo: esquecer um campo
 * custa peso, nunca tela quebrada. E `i18n` fica de FORA desta lista de
 * propósito — `paraIdioma` precisa dele para servir a vitrine em inglês; são
 * ~5 KB por curso contra ~280 KB do `courseContent`.
 *
 * Quem precisa do corpo do curso lê UM curso: `getProductBySlug`,
 * `getConteudoTraduzido` ou a rota `/api/courses/[slug]/content`, todas com a
 * própria projeção. Lá o custo é de um curso, não de vinte e dois.
 */
const PROJECAO_DE_LISTA = { courseContent: 0, detailedCurriculum: 0 } as const;

// ---------------------------------------------------------------------------
// IDIOMA
// ---------------------------------------------------------------------------

/**
 * O produto no idioma pedido.
 *
 * A tradução vive em `i18n.en` DENTRO do próprio documento, gerada por
 * `scripts/i18n/cursos-catalogo.mjs`. Subdocumento e não coleção paralela
 * porque toda leitura de produto já traz o documento inteiro: uma coleção
 * separada obrigaria um segundo `find` em cada uma das dezenas de rotas que
 * leem produto, e a primeira que esquecesse voltaria a servir português.
 *
 * (O corpo das AULAS é outra história e mora fora — ver
 * `getConteudoTraduzido`. Lá o campo tem centenas de KB por curso, e enfiá-lo
 * no produto faria toda leitura de catálogo carregar o curso inteiro.)
 *
 * ⚠️ A junção é PROFUNDA e campo a campo, e o que falta cai no português.
 * Isso é o que permite traduzir por partes: um curso com só metade dos campos
 * traduzidos aparece inteiro, metade em cada língua — nunca com buracos.
 *
 * ⚠️ `i18n` é apagado na saída. Depois de resolvido o idioma ele é peso morto,
 * e deixá-lo faria a página de venda viajar com as duas versões do texto.
 */
export function paraIdioma<T extends Product>(produto: T, locale: string): T {
  if (!ehIngles(locale)) {
    const semI18n = { ...(produto as Record<string, unknown>) };
    delete semI18n.i18n;
    return semI18n as unknown as T;
  }

  const traducao = (produto as Record<string, unknown>).i18n as
    | { en?: Record<string, unknown> }
    | undefined;

  const juntado = fundir(
    produto as unknown as Record<string, unknown>,
    traducao?.en ?? {},
  );
  delete juntado.i18n;
  return juntado as unknown as T;
}

/** `paraIdioma` para uma lista. */
export function paraIdiomaLista<T extends Product>(produtos: T[], locale: string): T[] {
  return produtos.map((p) => paraIdioma(p, locale));
}

/**
 * O CORPO do curso traduzido — markdown das aulas e currículo detalhado.
 *
 * Mora na coleção `conteudoTraduzido`, e não dentro do produto, porque são
 * ~250 KB por curso. No documento do produto, toda leitura de catálogo passaria
 * a carregar o curso inteiro em duas línguas — o mesmo caminho que fez a
 * `/cursos` servir 4,40 MB de texto de aula no HTML público.
 *
 * Devolve `null` quando não há tradução (ou quando o idioma é português), e o
 * chamador segue com o campo original. Falha de banco também devolve `null`:
 * uma queda aqui tem que degradar para o curso em português, nunca para tela
 * vazia.
 */
export async function getConteudoTraduzido(
  slug: string,
  locale: string,
): Promise<{ courseContent?: string; detailedCurriculum?: Product['detailedCurriculum'] } | null> {
  if (!ehIngles(locale)) return null;

  return getOrSet(
    `conteudo:en:${slug}`,
    async () => {
      try {
        const client = await getMongoClient();
        const doc = await client
          .db('fayapointProdutos')
          .collection('conteudoTraduzido')
          .findOne(
            { slug, locale: 'en' },
            { projection: { _id: 0, courseContent: 1, detailedCurriculum: 1 } },
          );
        return doc ? (doc as { courseContent?: string; detailedCurriculum?: Product['detailedCurriculum'] }) : null;
      } catch {
        return null;
      }
    },
    CACHE_TTL.PRODUCTS,
    /**
     * ⚠️ Aqui `null` é AMBÍGUO de propósito — ele significa "não tem tradução"
     * E TAMBÉM "o banco falhou" (o `catch` acima devolve `null` para degradar
     * para o português em vez de tela vazia). Guardar esse nulo faria uma queda
     * de meio segundo do Mongo virar meia dúzia de páginas em português para
     * quem pediu inglês, sem nada errado no banco. Nulo aqui não se cacheia.
     */
    { cachearNulo: false },
  );
}

/**
 * O produto com o corpo já no idioma pedido.
 *
 * Junta `paraIdioma` (vitrine, do subdocumento) com `getConteudoTraduzido`
 * (corpo, da coleção separada). É o que as rotas de LEITURA de aula devem usar
 * — a vitrine não precisa disto e não deve pagar a consulta.
 */
export async function produtoCompletoNoIdioma<T extends Product>(
  produto: T,
  locale: string,
): Promise<T> {
  const base = paraIdioma(produto, locale);
  const corpo = await getConteudoTraduzido(produto.slug, locale);
  if (!corpo) return base;
  return {
    ...base,
    ...(corpo.courseContent ? { courseContent: corpo.courseContent } : {}),
    ...(corpo.detailedCurriculum ? { detailedCurriculum: corpo.detailedCurriculum } : {}),
  };
}

/**
 * Junção profunda: o inglês vence onde existe, o português preenche o resto.
 *
 * Arrays são fundidos por ÍNDICE, não substituídos. Um módulo com título
 * traduzido e descrição faltando mantém a descrição em português em vez de
 * perder o campo — e um array inglês mais curto que o português (tradução
 * interrompida no meio) não apaga os itens que sobram.
 */
function fundir(
  pt: Record<string, unknown>,
  en: Record<string, unknown>,
): Record<string, unknown> {
  const saida: Record<string, unknown> = { ...pt };

  for (const [chave, valorEn] of Object.entries(en)) {
    if (valorEn === null || valorEn === undefined) continue;
    if (typeof valorEn === "string" && valorEn.trim() === "") continue;

    const valorPt = pt[chave];

    if (Array.isArray(valorPt) && Array.isArray(valorEn)) {
      saida[chave] = valorPt.map((itemPt, i) => {
        const itemEn = valorEn[i];
        if (itemEn === undefined) return itemPt;
        if (
          itemPt && typeof itemPt === "object" && !Array.isArray(itemPt) &&
          itemEn && typeof itemEn === "object" && !Array.isArray(itemEn)
        ) {
          return fundir(itemPt as Record<string, unknown>, itemEn as Record<string, unknown>);
        }
        return itemEn;
      });
      continue;
    }

    if (
      valorPt && typeof valorPt === "object" && !Array.isArray(valorPt) &&
      valorEn && typeof valorEn === "object" && !Array.isArray(valorEn)
    ) {
      saida[chave] = fundir(valorPt as Record<string, unknown>, valorEn as Record<string, unknown>);
      continue;
    }

    saida[chave] = valorEn;
  }

  return saida;
}

// Get all active products (CACHED: 10 minutes)
export async function getAllProducts(options?: {
  limit?: number;
  sortBy?: 'students' | 'rating' | 'price' | 'newest';
  type?: 'course' | 'tool';
}): Promise<Product[]> {
  // Create a cache key based on options
  const cacheKey = `${CACHE_KEYS.PRODUCTS}:${options?.sortBy || 'students'}:${options?.type || 'all'}:${options?.limit || 100}`;
  
  return getOrSet<Product[]>(
    cacheKey,
    async () => {
      const collection = await getProductsCollection();
      
      let sort: Record<string, 1 | -1> = {};
      switch (options?.sortBy) {
        case 'students':
          sort = { featured: -1, featuredOrder: 1, 'metrics.students': -1 };
          break;
        case 'rating':
          sort = { featured: -1, featuredOrder: 1, 'metrics.rating': -1 };
          break;
        case 'price':
          sort = { 'pricing.price': 1 };
          break;
        case 'newest':
          sort = { 'createdAt': -1 };
          break;
        default:
          sort = { featured: -1, featuredOrder: 1, 'metrics.students': -1 };
      }
      
      const query: Record<string, unknown> = { status: 'active', ...SEM_APOSENTADOS };
      if (options?.type) {
        query.type = options.type;
      }

      const products = await collection
        .find(query, { projection: PROJECAO_DE_LISTA })
        .sort(sort)
        .limit(options?.limit || 100)
        .toArray();
      
      return (products as unknown[]).map(normalizeProduct);
    },
    CACHE_TTL.PRODUCTS
  );
}

// Get product by slug (CACHED: 10 minutes)
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return getOrSet<Product | null>(
    CACHE_KEYS.PRODUCT(slug),
    async () => {
      const collection = await getProductsCollection();
      const product = await collection.findOne({ slug, status: 'active' });
      return product ? normalizeProduct(product) : null;
    },
    CACHE_TTL.PRODUCTS
  );
}

// Invalidate product cache (call when products are updated)
export async function invalidateProductCache(): Promise<void> {
  await invalidateCachePattern('products:*');
  await invalidateCachePattern('product:*');
  /**
   * ⚠️ O texto do curso picado em capítulos também é cache de produto.
   *
   * `livro:capitulos:*` e `atelie:capitulos:*` guardam o `courseContent` já
   * dividido, com uma hora de validade (ver as duas rotas do Ateliê). Sem estas
   * duas linhas, editar um curso no painel deixava o livro do aluno servindo o
   * texto ANTIGO por até uma hora — e o sintoma seria "editei e não mudou nada",
   * que manda depurar no lugar errado.
   */
  await invalidateCachePattern('livro:capitulos:*');
  await invalidateCachePattern('atelie:capitulos:*');
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const collection = await getProductsCollection();
  const products = await collection
    .find({
      categoryPrimary: category,
      status: 'active',
      ...SEM_APOSENTADOS,
    }, { projection: PROJECAO_DE_LISTA })
    .sort({ 'metrics.students': -1 })
    .toArray();
  
  return (products as unknown[]).map(normalizeProduct);
}

// Get products by tag
export async function getProductsByTag(tag: string): Promise<Product[]> {
  const collection = await getProductsCollection();
  const products = await collection
    .find({
      tags: tag,
      status: 'active',
      ...SEM_APOSENTADOS,
    }, { projection: PROJECAO_DE_LISTA })
    .sort({ 'metrics.students': -1 })
    .toArray();
  
  return (products as unknown[]).map(normalizeProduct);
}

// Get all unique categories
export async function getAllCategories(): Promise<Array<{ name: string; count: number }>> {
  const collection = await getProductsCollection();
  const categories = await collection.aggregate([
    { $match: { status: 'active', ...SEM_APOSENTADOS } },
    { 
      $group: {
        _id: '$categoryPrimary',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        name: '$_id',
        count: 1
      }
    }
  ]).toArray();
  
  return categories as Array<{ name: string; count: number }>;
}

// Get featured products (top rated with most students)
export async function getFeaturedProducts(limit: number = 3): Promise<Product[]> {
  const collection = await getProductsCollection();
  const products = await collection
    .find({ status: 'active', ...SEM_APOSENTADOS }, { projection: PROJECAO_DE_LISTA })
    .sort({
      featured: -1,
      featuredOrder: 1,
      'metrics.rating': -1,
      'metrics.students': -1
    })
    .limit(limit)
    .toArray();
  
  return (products as unknown[]).map(normalizeProduct);
}

// Search products
export async function searchProducts(query: string, type?: 'course' | 'tool'): Promise<Product[]> {
  const collection = await getProductsCollection();
  const searchRegex = new RegExp(query, 'i');
  
  const mongoQuery: Record<string, unknown> = {
    status: 'active',
    ...SEM_APOSENTADOS,
    $or: [
      { name: searchRegex },
      { shortName: searchRegex },
      { tool: searchRegex },
      { tags: searchRegex },
      { 'copy.shortDescription': searchRegex },
    ]
  };

  if (type) {
    mongoQuery.type = type;
  }

  const products = await collection
    .find(mongoQuery, { projection: PROJECAO_DE_LISTA })
    .sort({ 'metrics.students': -1 })
    .toArray();
  
  return (products as unknown[]).map(normalizeProduct);
}

// Get product statistics
export async function getProductStats() {
  const collection = await getProductsCollection();
  
  const stats = await collection.aggregate([
    { $match: { status: 'active', ...SEM_APOSENTADOS } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStudents: { $sum: '$metrics.students' },
        avgRating: { $avg: '$metrics.rating' },
        avgPrice: { $avg: '$pricing.price' },
        totalLessons: { $sum: '$metrics.lessons' },
      }
    }
  ]).toArray();
  
  return stats[0] || {};
}

// Calculate savings for a product
export function calculateSavings(product: Product): number {
  return product.pricing.originalPrice - product.pricing.price;
}

// Calculate discount percentage
export function calculateDiscountPercentage(product: Product): number {
  return Math.round(
    ((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100
  );
}

// Get related products (same category or tags)
export async function getRelatedProducts(slug: string, limit: number = 3): Promise<Product[]> {
  const collection = await getProductsCollection();
  
  const currentProduct = await getProductBySlug(slug);
  if (!currentProduct) return [];
  
  const products = await collection
    .find({
      status: 'active',
      ...SEM_APOSENTADOS,
      slug: { $ne: slug },
      $or: [
        { categoryPrimary: currentProduct.categoryPrimary },
        { tags: { $in: currentProduct.tags } }
      ]
    }, { projection: PROJECAO_DE_LISTA })
    .sort({ 'metrics.students': -1 })
    .limit(limit)
    .toArray();
  
  return (products as unknown[]).map(normalizeProduct);
}
