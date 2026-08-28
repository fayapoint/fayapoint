import dbConnect from "@/lib/mongodb";
import StoreProduct, { STORE_CATEGORIES } from "@/models/StoreProduct";

/**
 * Leitura da loja para a vitrine PÚBLICA (`/loja`).
 *
 * Os campos são reduzidos aqui, no servidor, pelo mesmo motivo de
 * `paraVitrine` em `@/lib/products`: o que atravessa a fronteira de um
 * Client Component é serializado no HTML público. O documento cru de
 * `StoreProduct` carrega `podInfo` com nome e E-MAIL do criador — isso não
 * pode sair no HTML de uma página sem login.
 */

export interface VarianteDaLoja {
  id: string;
  name: string;
  options: Record<string, string>;
  price: number;
}

export interface ProdutoDaVitrine {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  discount: number;
}

export interface ProdutoDaLoja extends ProdutoDaVitrine {
  shortDescription: string;
  fullDescription: string;
  brand: string;
  images: string[];
  stock: number;
  variants: VarianteDaLoja[];
}

export function nomeDaCategoria(category: string): string {
  const entrada = STORE_CATEGORIES[category as keyof typeof STORE_CATEGORIES];
  return entrada?.name ?? category;
}

type DocumentoDaLoja = {
  _id: { toString(): string };
  slug: string;
  name: string;
  category: string;
  thumbnail?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  shortDescription?: string;
  fullDescription?: string;
  brand?: string;
  images?: string[];
  stock?: number;
  podInfo?: {
    variants?: {
      id: string;
      name: string;
      options?: Record<string, string>;
      price: number;
      isActive?: boolean;
    }[];
  };
};

function paraVitrineDaLoja(doc: DocumentoDaLoja): ProdutoDaVitrine {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    categoryName: nomeDaCategoria(doc.category),
    thumbnail: doc.thumbnail ?? "",
    price: doc.price,
    originalPrice: doc.originalPrice ?? doc.price,
    discount: doc.discount ?? 0,
  };
}

export async function getProdutosDaLoja(): Promise<ProdutoDaVitrine[]> {
  await dbConnect();
  const docs = await StoreProduct.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<DocumentoDaLoja[]>();
  return docs.map(paraVitrineDaLoja);
}

export async function getProdutoDaLoja(slug: string): Promise<ProdutoDaLoja | null> {
  await dbConnect();
  const doc = await StoreProduct.findOne({ slug, isActive: true }).lean<DocumentoDaLoja | null>();
  if (!doc) return null;
  return {
    ...paraVitrineDaLoja(doc),
    shortDescription: doc.shortDescription ?? "",
    fullDescription: doc.fullDescription ?? "",
    brand: doc.brand ?? "",
    images: doc.images?.length ? doc.images : doc.thumbnail ? [doc.thumbnail] : [],
    stock: doc.stock ?? 0,
    variants: (doc.podInfo?.variants ?? [])
      .filter((v) => v.isActive !== false)
      .map((v) => ({
        id: v.id,
        name: v.name,
        options: v.options ?? {},
        price: v.price,
      })),
  };
}

/**
 * Sanitiza o HTML de descrição do produto antes do `dangerouslySetInnerHTML`.
 *
 * O conteúdo é nosso (vem do admin, não de visitante), então a defesa é uma
 * cerca simples: derruba tag de execução (`script`, `style`, `iframe`…),
 * atributo de evento (`onclick`…) e URL `javascript:`. Não tenta ser um
 * sanitizador completo de HTML hostil.
 */
export function sanitizarHtmlDaLoja(html: string): string {
  if (!html) return "";
  return (
    html
      // tags com corpo que executam ou embutem documento externo
      .replace(/<(script|style|iframe|object|embed|form)\b[\s\S]*?<\/\1\s*>/gi, "")
      // as mesmas tags sem fechamento, e as vazias perigosas
      .replace(/<\/?(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*>/gi, "")
      // atributos de evento: onclick=, onload=…
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      // javascript: em href/src
      .replace(/\s+(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, "")
  );
}

/** Descrição em texto puro para `<meta name="description">` e OG. */
export function textoPuro(html: string, limite = 160): string {
  const texto = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}
