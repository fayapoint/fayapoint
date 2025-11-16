import { MongoClient, Collection, ObjectId, Document } from 'mongodb';

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
const COLLECTION_NAME = 'usuarios';

let cachedClient: MongoClient | null = null;

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  role?: string;
  interest?: string;
  createdAt: Date;
  updatedAt: Date;
  source?: string;
}

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

async function getUsersCollection(): Promise<Collection> {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME).collection(COLLECTION_NAME);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ email: email.toLowerCase() });
  return user as unknown as User | null;
}

/**
 * Create a new user
 */
export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const collection = await getUsersCollection();
  
  const user: Omit<User, '_id'> = {
    ...userData,
    email: userData.email.toLowerCase(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await collection.insertOne(user as Document);
  
  return {
    ...user,
    _id: result.insertedId,
  } as User;
}

/**
 * Update existing user
 */
export async function updateUser(email: string, updates: Partial<Omit<User, '_id' | 'email' | 'createdAt'>>): Promise<User | null> {
  const collection = await getUsersCollection();
  
  const result = await collection.findOneAndUpdate(
    { email: email.toLowerCase() },
    { 
      $set: {
        ...updates,
        updatedAt: new Date(),
      }
    },
    { returnDocument: 'after' }
  );
  
  return result as unknown as User | null;
}

/**
 * Create or update user (upsert)
 */
export async function upsertUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const existingUser = await getUserByEmail(userData.email);
  
  if (existingUser) {
    const updated = await updateUser(userData.email, {
      name: userData.name,
      role: userData.role,
      interest: userData.interest,
      source: userData.source,
    });
    return updated!;
  } else {
    return await createUser(userData);
  }
}
