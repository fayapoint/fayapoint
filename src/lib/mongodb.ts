import mongoose from 'mongoose';

import { OPCOES_MONGO } from '@/lib/mongo-opcoes';

const DB_NAME = 'fayapoint';
const RAW_URI = process.env.MONGODB_URI || '';

/**
 * Ensure the database name is in the connection URI itself, not just in the
 * options object. When Turbopack creates separate worker contexts the `dbName`
 * option can silently get lost, causing Mongoose to fall back to the "test"
 * database. Embedding the name in the URI path makes it impossible to miss.
 */
function buildUri(raw: string): string {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    // If the URI already has a database name in the path, keep it
    if (url.pathname && url.pathname !== '/') return raw;
    // Inject the database name into the path
    url.pathname = `/${DB_NAME}`;
    return url.toString();
  } catch {
    // Fallback: simple string injection before the query string
    const qIdx = raw.indexOf('?');
    if (qIdx === -1) return `${raw.replace(/\/$/, '')}/${DB_NAME}`;
    const base = raw.slice(0, qIdx).replace(/\/$/, '');
    return `${base}/${DB_NAME}${raw.slice(qIdx)}`;
  }
}

const MONGODB_URI = buildUri(RAW_URI);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  /**
   * ⚠️ NÃO "conserte" isto reconectando quando `readyState !== 1`.
   *
   * Parece o cuidado óbvio — conexão em cache só serve se estiver viva — e eu
   * cheguei a escrever exatamente isso aqui. É uma armadilha, e a prova está no
   * código do Mongoose instalado:
   *
   *   `node_modules/mongoose/lib/drivers/node-mongodb-native/connection.js`
   *
   *   - ao PERDER o primário do replica set, ele faz
   *     `conn.readyState = STATES.disconnected` (0) e deixa o `MongoClient`
   *     vivo, porque o driver recupera sozinho (`topologyDescriptionChanged`);
   *   - quando o primário volta, `_handleReconnect()` devolve o estado para 1;
   *   - e `createClient()` faz `this.client = new mongodb.MongoClient(...)`
   *     **sem fechar o cliente anterior**.
   *
   * Ou seja: `readyState === 0` é rotina numa eleição de primário na Atlas, e
   * forçar reconexão nessa janela abandona um pool aberto e abre outro por cima
   * — o vazamento que este trabalho existe para eliminar, disparado justamente
   * na hora em que o cluster está instável.
   *
   * Nada mais fecha este cliente (o `close()` da rota de diagnóstico saiu), então
   * "conectado mas morto para sempre" não é um estado que este código produza. A
   * reconexão é trabalho do driver. Deixe com ele.
   */
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Belt AND suspenders: dbName in both the URI and the options
      dbName: DB_NAME,
      // O teto de conexões. Ver `mongo-opcoes.ts` — sem isto, este pool sozinho
      // podia abrir 100 conexões das 500 do cluster.
      ...OPCOES_MONGO,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
