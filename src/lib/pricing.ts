import { Collection, MongoClient } from "mongodb";
import { getOrSet, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

const DEFAULT_MONGODB_URI = '';

function resolveMongoUri() {
  const envUri = process.env.MONGODB_URI;
  if (!envUri || envUri.includes("your-mongodb-uri")) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

const MONGODB_URI = resolveMongoUri();

const DATABASE_NAME = "fayapointProdutos";
const COLLECTION_NAME = "products_prices";

let cachedClient: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

async function getPricesCollection(): Promise<Collection<ServicePriceDocument>> {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(COLLECTION_NAME);
}

export type PriceUnitType =
  | "per_project"
  | "per_screen"
  | "per_page"
  | "per_hour"
  | "per_day"
  | "per_month"
  | "per_workflow"
  | "per_collection"
  | "per_minute"
  | "per_release"
  | "per_language"
  | "per_format";

export interface ServicePriceDocument {
  _id?: string;
  category: string;
  serviceSlug: string;
  track: string;
  unitLabel: string;
  description: string;
  unitType: PriceUnitType;
  minQuantity: number;
  defaultQuantity: number;
  priceRange: {
    currency: string;
    min: number;
    recommended: number;
    max: number;
  };
  dependencies?: string[];
  upsellSuggestions?: string[];
  tags?: string[];
  lastValidatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// CACHED: 30 minutes TTL - prices rarely change
export async function getAllServicePrices(): Promise<ServicePriceDocument[]> {
  return getOrSet<ServicePriceDocument[]>(
    CACHE_KEYS.SERVICE_PRICES,
    async () => {
      const collection = await getPricesCollection();
      return (await collection.find({}).toArray()) as ServicePriceDocument[];
    },
    CACHE_TTL.SERVICE_PRICES
  );
}

// CACHED: 30 minutes TTL - prices rarely change
export async function getServicePricesBySlug(
  serviceSlug: string,
): Promise<ServicePriceDocument[]> {
  return getOrSet<ServicePriceDocument[]>(
    CACHE_KEYS.SERVICE_PRICES_BY_SLUG(serviceSlug),
    async () => {
      const collection = await getPricesCollection();
      return (await collection
        .find({ serviceSlug })
        .sort({ track: 1, unitLabel: 1 })
        .toArray()) as ServicePriceDocument[];
    },
    CACHE_TTL.SERVICE_PRICES
  );
}
