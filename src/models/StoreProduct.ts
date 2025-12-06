import mongoose, { Schema, Document, Model } from 'mongoose';

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

const StoreProduct: Model<IStoreProduct> = mongoose.models.StoreProduct || mongoose.model<IStoreProduct>('StoreProduct', StoreProductSchema);

export default StoreProduct;
