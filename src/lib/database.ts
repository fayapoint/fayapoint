import { MongoClient } from "mongodb";

const DEFAULT_MONGODB_URI = '';

let cachedClient: MongoClient | null = null;

export function resolveMongoUri() {
  const envUri = process.env.MONGODB_URI;
  if (!envUri || envUri.includes("your-mongodb-uri")) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(resolveMongoUri());
  await client.connect();
  cachedClient = client;
  return client;
}
