import { Collection, MongoClient } from "mongodb";

const DEFAULT_MONGODB_URI =
  "mongodb+srv://ricardofaya:3VJKNjK65tn5srSC@aicornercluster.2kiwt1o.mongodb.net/?retryWrites=true&w=majority&appName=aicornercluster";

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

async function getMongoClient(): Promise<MongoClient> {
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

export async function getAllServicePrices(): Promise<ServicePriceDocument[]> {
  const collection = await getPricesCollection();
  return (await collection.find({}).toArray()) as ServicePriceDocument[];
}

export async function getServicePricesBySlug(
  serviceSlug: string,
): Promise<ServicePriceDocument[]> {
  const collection = await getPricesCollection();
  return (await collection
    .find({ serviceSlug })
    .sort({ track: 1, unitLabel: 1 })
    .toArray()) as ServicePriceDocument[];
}
