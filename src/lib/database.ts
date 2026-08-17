import type { MongoClient } from "mongodb";

import { clienteMongo } from "@/lib/mongo-cliente";

const DEFAULT_MONGODB_URI = '';

export function resolveMongoUri() {
  const envUri = process.env.MONGODB_URI;
  if (!envUri || envUri.includes("your-mongodb-uri")) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

/**
 * O cliente compartilhado — não mais um pool próprio.
 *
 * Este módulo tinha o seu `cachedClient` e o seu `new MongoClient()`, um dos
 * cinco pools que juntos custavam ~20 conexões por instância. Ver
 * `mongo-cliente.ts` para os números medidos.
 *
 * A assinatura fica de pé de propósito: ~30 rotas chamam `getMongoClient()`
 * daqui e continuam funcionando sem edição.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clienteMongo();
}
