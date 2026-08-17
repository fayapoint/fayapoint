import { type MongoClient, type Collection, ObjectId, type Document } from 'mongodb';
import { clienteMongo } from '@/lib/mongo-cliente';

const DATABASE_NAME = 'fayapoint';
const COLLECTION_NAME = 'users';

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  role?: string;
  interest?: string; // Keep for backward compatibility, but use interests array
  source?: string;
  leadType?: string;
  leadDetails?: {
    referrerUrl?: string;
    details?: string;
    utm?: Record<string, string | undefined>;
    capturedAt?: string;
  };
  
  // Profile Fields
  gender?: string;
  birthDate?: Date;
  image?: string;
  bio?: string;
  profession?: string;
  company?: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  interests?: string[];
  goals?: string;
  values?: string;
  personality?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  languages?: string[];
  targetAudience?: string;
  marketSegment?: string;
  contentPreferences?: string;
  communicationTone?: string;
  inspirations?: string;
  funFacts?: string;
  contactAvailability?: string;
  importantLinks?: string[];
  
  bookDiscountCode?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * O cliente compartilhado — este módulo não abre mais pool próprio.
 * Ver `mongo-cliente.ts`: cada cliente extra custava 4 conexões medidas.
 */
async function getMongoClient(): Promise<MongoClient> {
  return clienteMongo();
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
export async function upsertUser(userData: Partial<User> & { email: string; name: string }): Promise<User> {
  const existingUser = await getUserByEmail(userData.email);
  
  if (existingUser) {
    // Remove fields that shouldn't be overwritten if undefined in userData
    const { _id, email, createdAt, updatedAt, ...updates } = userData;
    
    const updated = await updateUser(userData.email, updates as Partial<Omit<User, '_id' | 'email' | 'createdAt'>>);
    return updated!;
  } else {
    return await createUser(userData as Omit<User, '_id' | 'createdAt' | 'updatedAt'>);
  }
}
