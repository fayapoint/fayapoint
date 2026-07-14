import { ObjectId, type Document } from 'mongodb';
import { getMongoClient } from '@/lib/products';
import StoreProduct from '@/models/StoreProduct';
import type { IPaymentItem } from '@/models/Payment';
import { resolvePlan, TIER_CONFIGS } from '@/lib/course-tiers';

const PRODUCTS_DATABASE = 'fayapointProdutos';
const MAX_CART_LINES = 20;
const MAX_ITEM_QUANTITY = 10_000;

type CheckoutItemType = IPaymentItem['type'];

export interface CheckoutItemInput {
  id?: unknown;
  slug?: unknown;
  type?: unknown;
  quantity?: unknown;
  serviceSlug?: unknown;
  unitLabel?: unknown;
  track?: unknown;
  /**
   * Display-only price snapshot. It is never used to calculate a charge; it
   * only lets us stop checkout if the catalog changed while the cart was open.
   */
  expectedUnitPrice?: unknown;
  /** Legacy client field kept only for stale-price detection. */
  price?: unknown;
}

export interface CheckoutPricingContext {
  subscriptionPlan?: string;
  subscriptionActive?: boolean;
}

export class CheckoutCatalogError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'CheckoutCatalogError';
  }
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseQuantity(value: unknown, label: string): number {
  const quantity = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
    throw new CheckoutCatalogError(
      `Quantidade inválida para ${label}`,
      'INVALID_QUANTITY',
    );
  }
  return quantity;
}

function normalizeMoney(value: unknown, label: string): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new CheckoutCatalogError(
      `Preço indisponível para ${label}`,
      'INVALID_CATALOG_PRICE',
      409,
    );
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function assertBrl(currency: unknown, label: string) {
  if (currency && currency !== 'BRL') {
    throw new CheckoutCatalogError(
      `Moeda não suportada para ${label}`,
      'UNSUPPORTED_CURRENCY',
      409,
    );
  }
}

function assertDisplayedPrice(input: CheckoutItemInput, actualPrice: number, label: string) {
  const snapshot = input.expectedUnitPrice ?? input.price;
  if (snapshot === undefined || snapshot === null) return;

  const displayedPrice = Number(snapshot);
  if (!Number.isFinite(displayedPrice) || Math.abs(displayedPrice - actualPrice) >= 0.01) {
    throw new CheckoutCatalogError(
      `O preço de ${label} foi atualizado. Revise o carrinho antes de continuar.`,
      'PRICE_CHANGED',
      409,
    );
  }
}

function getCourseSlug(input: CheckoutItemInput): string | null {
  const slug = asNonEmptyString(input.slug);
  if (slug) return slug;

  const id = asNonEmptyString(input.id);
  if (!id) return null;
  return id.startsWith('course:') ? id.slice('course:'.length) : id;
}

async function resolveCourse(input: CheckoutItemInput): Promise<IPaymentItem> {
  const slug = getCourseSlug(input);
  if (!slug) {
    throw new CheckoutCatalogError('Curso inválido', 'INVALID_COURSE');
  }

  const quantity = parseQuantity(input.quantity, slug);
  if (quantity !== 1) {
    throw new CheckoutCatalogError(
      'Cursos digitais só podem ser comprados uma vez por pedido',
      'INVALID_COURSE_QUANTITY',
    );
  }

  const client = await getMongoClient();
  const product = await client
    .db(PRODUCTS_DATABASE)
    .collection('products')
    .findOne(
      { slug, type: 'course', status: 'active' },
      {
        projection: {
          _id: 1,
          productId: 1,
          slug: 1,
          name: 1,
          pricing: 1,
          'copy.shortDescription': 1,
        },
      },
    );

  if (!product) {
    throw new CheckoutCatalogError(
      'Curso não encontrado ou indisponível',
      'COURSE_NOT_AVAILABLE',
      409,
    );
  }

  const name = asNonEmptyString(product.name) || slug;
  const pricing = product.pricing as { price?: unknown; currency?: unknown } | undefined;
  assertBrl(pricing?.currency, name);
  const unitPrice = normalizeMoney(pricing?.price, name);
  assertDisplayedPrice(input, unitPrice, name);

  return {
    productId: asNonEmptyString(product.productId) || String(product._id),
    productSlug: slug,
    type: 'course',
    name,
    description: asNonEmptyString((product.copy as Document | undefined)?.shortDescription) || undefined,
    quantity,
    unitPrice,
    totalPrice: unitPrice,
  };
}

async function resolveService(input: CheckoutItemInput): Promise<IPaymentItem> {
  const serviceSlug = asNonEmptyString(input.serviceSlug);
  const unitLabel = asNonEmptyString(input.unitLabel);
  const track = asNonEmptyString(input.track);
  if (!serviceSlug || !unitLabel || !track) {
    throw new CheckoutCatalogError(
      'Serviço sem identificador de catálogo',
      'INVALID_SERVICE',
    );
  }

  const client = await getMongoClient();
  const query: Record<string, unknown> = { serviceSlug, unitLabel, track };

  const service = await client
    .db(PRODUCTS_DATABASE)
    .collection('products_prices')
    .findOne(query);

  if (!service) {
    throw new CheckoutCatalogError(
      'Serviço não encontrado ou indisponível',
      'SERVICE_NOT_AVAILABLE',
      409,
    );
  }

  const name = asNonEmptyString(service.unitLabel) || unitLabel;
  const quantity = parseQuantity(input.quantity, name);
  const minQuantity = Number(service.minQuantity ?? 1);
  if (Number.isFinite(minQuantity) && quantity < minQuantity) {
    throw new CheckoutCatalogError(
      `A quantidade mínima para ${name} é ${minQuantity}`,
      'QUANTITY_BELOW_MINIMUM',
      409,
    );
  }

  const priceRange = service.priceRange as {
    recommended?: unknown;
    currency?: unknown;
  } | undefined;
  assertBrl(priceRange?.currency, name);
  const unitPrice = normalizeMoney(priceRange?.recommended, name);
  assertDisplayedPrice(input, unitPrice, name);

  return {
    productId: String(service._id),
    productSlug: serviceSlug,
    type: 'service',
    name,
    description: asNonEmptyString(service.description) || undefined,
    quantity,
    unitPrice,
    totalPrice: Math.round(unitPrice * quantity * 100) / 100,
  };
}

async function resolveStoreProduct(input: CheckoutItemInput): Promise<IPaymentItem> {
  const rawId = asNonEmptyString(input.id);
  if (!rawId) {
    throw new CheckoutCatalogError('Produto inválido', 'INVALID_PRODUCT');
  }

  const identifier = rawId.startsWith('store-') ? rawId.slice('store-'.length) : rawId;
  const filter = ObjectId.isValid(identifier)
    ? { _id: new ObjectId(identifier), isActive: true }
    : { slug: identifier, isActive: true };
  const product = await StoreProduct.findOne(filter).lean();

  if (!product) {
    throw new CheckoutCatalogError(
      'Produto não encontrado ou indisponível',
      'PRODUCT_NOT_AVAILABLE',
      409,
    );
  }

  const name = product.name;
  const quantity = parseQuantity(input.quantity, name);
  if (quantity > product.stock) {
    throw new CheckoutCatalogError(
      `Estoque insuficiente para ${name}`,
      'INSUFFICIENT_STOCK',
      409,
    );
  }

  assertBrl(product.currency, name);
  const unitPrice = normalizeMoney(product.price, name);
  assertDisplayedPrice(input, unitPrice, name);

  return {
    productId: String(product._id),
    productSlug: product.slug,
    type: 'product',
    name,
    description: product.shortDescription,
    quantity,
    unitPrice,
    totalPrice: Math.round(unitPrice * quantity * 100) / 100,
  };
}

export async function resolveCheckoutItems(
  rawItems: unknown,
  pricing: CheckoutPricingContext = {},
): Promise<IPaymentItem[]> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new CheckoutCatalogError('Nenhum item no carrinho', 'EMPTY_CART');
  }
  if (rawItems.length > MAX_CART_LINES) {
    throw new CheckoutCatalogError('Carrinho grande demais', 'CART_TOO_LARGE');
  }

  const resolved: IPaymentItem[] = [];
  const seen = new Set<string>();

  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== 'object') {
      throw new CheckoutCatalogError('Item inválido no carrinho', 'INVALID_ITEM');
    }

    const input = rawItem as CheckoutItemInput;
    const type = asNonEmptyString(input.type) as CheckoutItemType | null;
    let item: IPaymentItem;

    switch (type) {
      case 'course':
        item = await resolveCourse(input);
        break;
      case 'service':
        item = await resolveService(input);
        break;
      case 'product':
      case 'pod':
        item = await resolveStoreProduct(input);
        break;
      case 'subscription':
        throw new CheckoutCatalogError(
          'Assinaturas devem usar o checkout de planos',
          'INVALID_PAYMENT_FLOW',
        );
      default:
        throw new CheckoutCatalogError('Tipo de item inválido', 'INVALID_ITEM_TYPE');
    }

    if (item.type === 'course' && pricing.subscriptionActive) {
      const plan = resolvePlan(pricing.subscriptionPlan || 'free');
      const discount = TIER_CONFIGS[plan].purchaseDiscount;
      if (discount > 0) {
        const originalUnitPrice = item.unitPrice;
        item.originalUnitPrice = originalUnitPrice;
        item.unitPrice = Math.round(originalUnitPrice * (1 - discount) * 100) / 100;
        item.totalPrice = Math.round(item.unitPrice * item.quantity * 100) / 100;
      }
    }

    const key = `${item.type}:${item.productId || item.productSlug}`;
    if (seen.has(key)) {
      throw new CheckoutCatalogError('Item duplicado no carrinho', 'DUPLICATE_ITEM');
    }
    seen.add(key);
    resolved.push(item);
  }

  return resolved;
}

export function calculateCheckoutSubtotal(items: IPaymentItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
}

export function calculateCheckoutOriginalSubtotal(items: IPaymentItem[]): number {
  return Math.round(items.reduce(
    (sum, item) => sum + (item.originalUnitPrice ?? item.unitPrice) * item.quantity,
    0,
  ) * 100) / 100;
}
