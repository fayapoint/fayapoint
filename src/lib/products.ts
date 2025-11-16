/**
 * Product Data Layer
 * 
 * Functions to fetch and manage products from MongoDB
 */

import { MongoClient, Collection } from 'mongodb';

const DEFAULT_MONGODB_URI = 'mongodb+srv://ricardofaya:3VJKNjK65tn5srSC@aicornercluster.2kiwt1o.mongodb.net/?retryWrites=true&w=majority&appName=aicornercluster';

function resolveMongoUri() {
  const envUri = process.env.MONGODB_URI;
  if (!envUri || envUri.includes('your-mongodb-uri')) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

const MONGODB_URI = resolveMongoUri();

const DATABASE_NAME = 'fayapointProdutos';
const COLLECTION_NAME = 'products';

let cachedClient: MongoClient | null = null;

// Get MongoDB client (cached for serverless)
async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
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
  digitalAssets: any[];
  features: string[];
  createdAt: string;
  updatedAt: string;
}

// Get all active products
export async function getAllProducts(options?: {
  limit?: number;
  sortBy?: 'students' | 'rating' | 'price' | 'newest';
  type?: 'course' | 'tool';
}): Promise<Product[]> {
  const collection = await getProductsCollection();
  
  let sort: any = {};
  switch (options?.sortBy) {
    case 'students':
      sort = { 'metrics.students': -1 };
      break;
    case 'rating':
      sort = { 'metrics.rating': -1 };
      break;
    case 'price':
      sort = { 'pricing.price': 1 };
      break;
    case 'newest':
      sort = { 'createdAt': -1 };
      break;
    default:
      sort = { 'metrics.students': -1 };
  }
  
  const query: any = { status: 'active' };
  if (options?.type) {
    query.type = options.type;
  }

  const products = await collection
    .find(query)
    .sort(sort)
    .limit(options?.limit || 100)
    .toArray();
  
  return products as unknown as Product[];
}

// Get product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const collection = await getProductsCollection();
  const product = await collection.findOne({ slug, status: 'active' });
  return product as unknown as Product | null;
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const collection = await getProductsCollection();
  const products = await collection
    .find({ 
      categoryPrimary: category,
      status: 'active'
    })
    .sort({ 'metrics.students': -1 })
    .toArray();
  
  return products as unknown as Product[];
}

// Get products by tag
export async function getProductsByTag(tag: string): Promise<Product[]> {
  const collection = await getProductsCollection();
  const products = await collection
    .find({ 
      tags: tag,
      status: 'active'
    })
    .sort({ 'metrics.students': -1 })
    .toArray();
  
  return products as unknown as Product[];
}

// Get all unique categories
export async function getAllCategories(): Promise<Array<{ name: string; count: number }>> {
  const collection = await getProductsCollection();
  const categories = await collection.aggregate([
    { $match: { status: 'active' } },
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
    .find({ status: 'active' })
    .sort({ 
      'metrics.rating': -1,
      'metrics.students': -1 
    })
    .limit(limit)
    .toArray();
  
  return products as unknown as Product[];
}

// Search products
export async function searchProducts(query: string, type?: 'course' | 'tool'): Promise<Product[]> {
  const collection = await getProductsCollection();
  const searchRegex = new RegExp(query, 'i');
  
  const mongoQuery: any = {
    status: 'active',
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
    .find(mongoQuery)
    .sort({ 'metrics.students': -1 })
    .toArray();
  
  return products as unknown as Product[];
}

// Get product statistics
export async function getProductStats() {
  const collection = await getProductsCollection();
  
  const stats = await collection.aggregate([
    { $match: { status: 'active' } },
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
      slug: { $ne: slug },
      $or: [
        { categoryPrimary: currentProduct.categoryPrimary },
        { tags: { $in: currentProduct.tags } }
      ]
    })
    .sort({ 'metrics.students': -1 })
    .limit(limit)
    .toArray();
  
  return products as unknown as Product[];
}
