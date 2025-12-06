import mongoose, { Schema, Document, Model } from 'mongoose';

// Design file reference
export interface IDesignFile {
  url: string;
  publicId?: string; // Cloudinary ID
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  printAreaId?: string;
}

// Product variant configuration
export interface IProductVariant {
  id: string;
  providerVariantId: string;
  name: string;
  options: Record<string, string>; // e.g., { color: 'Black', size: 'M' }
  sku: string;
  basePrice: number;
  sellingPrice: number;
  profit: number;
  stock?: number;
  isActive: boolean;
}

// Provider sync status
export interface IProviderSync {
  providerId: string;
  providerSlug: string;
  providerProductId?: string;
  providerSku?: string;
  syncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'error' | 'not_synced';
  errorMessage?: string;
  publishedUrl?: string;
}

export interface IUserPODProduct extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Basic info
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Category
  category: string;
  subcategory?: string;
  tags: string[];
  
  // Design
  designFiles: IDesignFile[];
  mockupImages: string[];
  primaryMockup?: string;
  
  // Product template
  templateId: string;
  templateName: string;
  baseProductType: string;
  
  // Variants
  variants: IProductVariant[];
  
  // Pricing
  baseCost: number;
  suggestedPrice: number;
  minimumPrice: number;
  currency: string;
  
  // Provider sync
  providers: IProviderSync[];
  primaryProvider?: string;
  
  // Status
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived';
  isPublished: boolean;
  publishedAt?: Date;
  
  // Store visibility
  showInUserStore: boolean;
  showInMarketplace: boolean;
  
  // Statistics
  views: number;
  sales: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const DesignFileSchema = new Schema<IDesignFile>({
  url: { type: String, required: true },
  publicId: String,
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  format: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  printAreaId: String,
}, { _id: false });

const ProductVariantSchema = new Schema<IProductVariant>({
  id: { type: String, required: true },
  providerVariantId: { type: String, required: true },
  name: { type: String, required: true },
  options: { type: Map, of: String },
  sku: { type: String, required: true },
  basePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  profit: { type: Number, required: true },
  stock: Number,
  isActive: { type: Boolean, default: true },
}, { _id: false });

const ProviderSyncSchema = new Schema<IProviderSync>({
  providerId: { type: String, required: true },
  providerSlug: { type: String, required: true },
  providerProductId: String,
  providerSku: String,
  syncedAt: Date,
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error', 'not_synced'],
    default: 'not_synced',
  },
  errorMessage: String,
  publishedUrl: String,
}, { _id: false });

const UserPODProductSchema = new Schema<IUserPODProduct>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: String,
  
  category: { type: String, required: true, index: true },
  subcategory: String,
  tags: [String],
  
  designFiles: [DesignFileSchema],
  mockupImages: [String],
  primaryMockup: String,
  
  templateId: { type: String, required: true },
  templateName: { type: String, required: true },
  baseProductType: { type: String, required: true },
  
  variants: [ProductVariantSchema],
  
  baseCost: { type: Number, required: true },
  suggestedPrice: { type: Number, required: true },
  minimumPrice: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  
  providers: [ProviderSyncSchema],
  primaryProvider: String,
  
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'paused', 'rejected', 'archived'],
    default: 'draft',
    index: true,
  },
  isPublished: { type: Boolean, default: false, index: true },
  publishedAt: Date,
  
  showInUserStore: { type: Boolean, default: true },
  showInMarketplace: { type: Boolean, default: false },
  
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  
  metaTitle: String,
  metaDescription: String,
}, {
  timestamps: true,
});

// Indexes
UserPODProductSchema.index({ userId: 1, status: 1 });
UserPODProductSchema.index({ userId: 1, slug: 1 }, { unique: true });
UserPODProductSchema.index({ isPublished: 1, showInMarketplace: 1 });
UserPODProductSchema.index({ category: 1, isPublished: 1 });
UserPODProductSchema.index({ tags: 1 });
UserPODProductSchema.index({ sales: -1 });

// Text search
UserPODProductSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

const UserPODProduct: Model<IUserPODProduct> =
  mongoose.models.UserPODProduct ||
  mongoose.model<IUserPODProduct>('UserPODProduct', UserPODProductSchema);

export default UserPODProduct;

// POD Product Categories
export const POD_CATEGORIES = {
  apparel: {
    name: 'Vestuário',
    icon: 'Shirt',
    subcategories: ['Camisetas', 'Moletons', 'Hoodies', 'Tank Tops', 'Leggings', 'All-Over Print'],
  },
  accessories: {
    name: 'Acessórios',
    icon: 'Watch',
    subcategories: ['Bonés', 'Bolsas', 'Tote Bags', 'Mochilas', 'Meias', 'Máscaras'],
  },
  home: {
    name: 'Casa & Decoração',
    icon: 'Home',
    subcategories: ['Almofadas', 'Cobertores', 'Tapetes', 'Cortinas', 'Toalhas'],
  },
  wallArt: {
    name: 'Arte de Parede',
    icon: 'Frame',
    subcategories: ['Posters', 'Canvas', 'Metal Prints', 'Acrílico', 'Fine Art', 'Emoldurados'],
  },
  drinkware: {
    name: 'Drinkware',
    icon: 'Coffee',
    subcategories: ['Canecas', 'Garrafas', 'Copos', 'Tumbleres'],
  },
  tech: {
    name: 'Tech & Eletrônicos',
    icon: 'Smartphone',
    subcategories: ['Capas de Celular', 'Capas de Laptop', 'Mousepads', 'AirPods Cases'],
  },
  stationery: {
    name: 'Papelaria',
    icon: 'BookOpen',
    subcategories: ['Cadernos', 'Adesivos', 'Cartões', 'Calendários', 'Posters'],
  },
  jewelry: {
    name: 'Joias',
    icon: 'Gem',
    subcategories: ['Colares', 'Pulseiras', 'Brincos', 'Anéis', 'Chaveiros'],
  },
  pet: {
    name: 'Pet',
    icon: 'Dog',
    subcategories: ['Roupas Pet', 'Camas', 'Tigelas', 'Coleiras'],
  },
} as const;

// Helper to generate slug
export function generateProductSlug(title: string, userId: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const shortId = userId.slice(-6);
  return `${baseSlug}-${shortId}-${Date.now().toString(36)}`;
}
