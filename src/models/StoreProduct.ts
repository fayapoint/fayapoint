import mongoose, { Schema, Document, Model } from 'mongoose';

// POD product variant for store listing
export interface IStoreProductVariant {
  id: string;
  name: string;
  options: Record<string, string>; // e.g., { color: 'Black', size: 'M' }
  price: number;
  stock: number;
  sku: string;
  printifyVariantId?: number;
  isActive: boolean;
}

// POD-specific fields
export interface IPODInfo {
  isPOD: boolean;
  creatorId: mongoose.Types.ObjectId;
  creatorName: string;
  creatorEmail: string;
  podProductId: mongoose.Types.ObjectId; // Reference to UserPODProduct
  printifyProductId?: string;
  printifyShopId?: number;
  blueprintId?: number;
  printProviderId?: number;
  commissionRate: number; // Percentage that goes to creator (default 70%)
  baseCost: number; // Cost from Printify
  designUrl?: string;
  variants: IStoreProductVariant[];
  publishedToPrintify: boolean;
  printifySyncStatus: 'pending' | 'synced' | 'error' | 'not_synced';
  lastSyncedAt?: Date;
}

export interface IStoreProduct extends Document {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  thumbnail: string;
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  currency: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  tags: string[];
  specifications: {
    key: string;
    value: string;
  }[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  warranty: string;
  externalUrl?: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  // POD-specific fields
  podInfo?: IPODInfo;
  createdAt: Date;
  updatedAt: Date;
}

// Categories for the store
export const STORE_CATEGORIES = {
  computers: {
    name: 'Computadores',
    icon: 'Monitor',
    subcategories: ['Desktops Completos', 'Ilhas de Edição', 'Workstations', 'Servidores IA', 'Mini PCs']
  },
  components: {
    name: 'Componentes',
    icon: 'Cpu',
    subcategories: ['Processadores', 'Placas de Vídeo', 'Memória RAM', 'SSDs e HDDs', 'Placas-mãe', 'Fontes']
  },
  peripherals: {
    name: 'Periféricos',
    icon: 'Mouse',
    subcategories: ['Mouses', 'Teclados', 'Headsets', 'Webcams', 'Microfones', 'Mousepads']
  },
  monitors: {
    name: 'Monitores',
    icon: 'MonitorSmartphone',
    subcategories: ['Monitores Gaming', 'Monitores Profissionais', 'Ultrawide', '4K/8K']
  },
  accessories: {
    name: 'Acessórios',
    icon: 'Package',
    subcategories: ['Cabos', 'Suportes', 'Hubs USB', 'Iluminação LED', 'Organizadores', 'Cadeiras Gamer']
  },
  software: {
    name: 'Software',
    icon: 'Code',
    subcategories: ['Sistemas Operacionais', 'Suítes Office', 'Editores de Vídeo', 'Ferramentas IA', 'Antivírus']
  },
  networking: {
    name: 'Rede',
    icon: 'Wifi',
    subcategories: ['Roteadores', 'Switches', 'Access Points', 'Cabos de Rede']
  },
  storage: {
    name: 'Armazenamento',
    icon: 'HardDrive',
    subcategories: ['NAS', 'HDs Externos', 'Pendrives', 'Cartões SD']
  },
  pod: {
    name: 'Print on Demand',
    icon: 'Palette',
    subcategories: ['Camisetas', 'Moletons', 'Canecas', 'Posters', 'Canvas', 'Capinhas', 'Bolsas', 'Almofadas', 'Adesivos', 'Outros']
  },
  dropshipping: {
    name: 'Dropshipping',
    icon: 'Truck',
    subcategories: ['Eletrônicos', 'Casa & Jardim', 'Moda', 'Esportes', 'Beleza', 'Brinquedos', 'Ferramentas', 'Outros']
  }
} as const;

const StoreProductSchema = new Schema<IStoreProduct>({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200,
  },
  fullDescription: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  subcategory: {
    type: String,
    required: true,
    index: true,
  },
  brand: {
    type: String,
    required: true,
    index: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  images: [String],
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  currency: {
    type: String,
    default: 'BRL',
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  specifications: [{
    key: String,
    value: String,
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  warranty: String,
  externalUrl: String,
  weight: Number,
  dimensions: {
    width: Number,
    height: Number,
    depth: Number,
  },
  // POD-specific fields
  podInfo: {
    isPOD: { type: Boolean, default: false },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    creatorName: String,
    creatorEmail: String,
    podProductId: { type: Schema.Types.ObjectId, ref: 'UserPODProduct' },
    printifyProductId: String,
    printifyShopId: Number,
    blueprintId: Number,
    printProviderId: Number,
    commissionRate: { type: Number, default: 70 }, // 70% to creator
    baseCost: Number,
    designUrl: String,
    variants: [{
      id: String,
      name: String,
      options: Schema.Types.Mixed,
      price: Number,
      stock: Number,
      sku: String,
      printifyVariantId: Number,
      isActive: { type: Boolean, default: true },
    }],
    publishedToPrintify: { type: Boolean, default: false },
    printifySyncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error', 'not_synced'],
      default: 'not_synced',
    },
    lastSyncedAt: Date,
  },
}, {
  timestamps: true,
});

// Text search index
StoreProductSchema.index({
  name: 'text',
  shortDescription: 'text',
  brand: 'text',
  tags: 'text',
});

// Compound indexes for common queries
StoreProductSchema.index({ category: 1, isActive: 1 });
StoreProductSchema.index({ price: 1 });
StoreProductSchema.index({ isFeatured: 1, isActive: 1 });
StoreProductSchema.index({ createdAt: -1 });
StoreProductSchema.index({ soldCount: -1 });
// POD-specific indexes
StoreProductSchema.index({ 'podInfo.isPOD': 1, isActive: 1 });
StoreProductSchema.index({ 'podInfo.creatorId': 1 });
StoreProductSchema.index({ 'podInfo.printifyProductId': 1 });

const StoreProduct: Model<IStoreProduct> = mongoose.models.StoreProduct || mongoose.model<IStoreProduct>('StoreProduct', StoreProductSchema);

export default StoreProduct;
