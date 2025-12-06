import mongoose, { Schema, Document, Model } from 'mongoose';

// Price history entry interface
export interface IPriceHistoryEntry {
  price: number;
  shippingCost: number;
  totalCost: number;
  currency: string;
  recordedAt: Date;
}

// Supplier information
export interface ISupplierInfo {
  name: string;
  storeUrl: string;
  rating: number;
  totalSales: number;
  responseTime: string;
  onTimeDelivery: number;
  positiveRating: number;
}

// Shipping option interface
export interface IShippingOption {
  method: string;
  cost: number;
  currency: string;
  estimatedDays: {
    min: number;
    max: number;
  };
  trackable: boolean;
  carrier?: string;
}

// Affiliate information
export interface IAffiliateInfo {
  hasProgram: boolean;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  programName?: string;
  affiliateLink?: string;
  cookieDuration?: number; // days
}

// AI-extracted product details
export interface IExtractedDetails {
  features: string[];
  materials: string[];
  includedItems: string[];
  targetAudience: string[];
  useCases: string[];
  warnings: string[];
  certifications: string[];
}

export interface IDropshippingProduct extends Document {
  // Basic identification
  externalId: string; // Original product ID from source
  sourceSlug: string; // Reference to DropshippingSource
  sourceName: string; // Human-readable source name
  sourceUrl: string; // Original product URL
  
  // Product info
  name: string;
  nameTranslated?: string; // Portuguese translation
  description: string;
  descriptionTranslated?: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  
  // Media
  thumbnail: string;
  images: string[];
  videos?: string[];
  
  // Pricing (in original currency)
  originalPrice: number;
  currentPrice: number;
  originalCurrency: string;
  
  // Pricing (converted to BRL)
  priceBRL: number;
  originalPriceBRL: number;
  exchangeRate: number;
  exchangeRateUpdatedAt: Date;
  
  // Our pricing (with 30% profit margin)
  sellingPrice: number; // Final price with profit
  profitMargin: number; // Percentage
  profitAmount: number; // Absolute value
  
  // Shipping to Brazil
  shippingOptions: IShippingOption[];
  bestShippingOption?: IShippingOption;
  shippingToBrazil: boolean;
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
  
  // Supplier info
  supplier: ISupplierInfo;
  
  // Affiliate info
  affiliate: IAffiliateInfo;
  
  // Stock & availability
  stock: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  isAvailable: boolean;
  
  // Reviews & ratings from source
  rating: number;
  reviewCount: number;
  soldCount: number;
  
  // Price tracking
  priceHistory: IPriceHistoryEntry[];
  lowestPrice: number;
  highestPrice: number;
  priceDropAlert: boolean;
  priceTrend: 'rising' | 'stable' | 'falling';
  
  // Trending & analytics
  trendingScore: number; // 0-100
  searchVolume: number;
  competitorCount: number;
  demandScore: number; // 0-100
  
  // AI-extracted details
  extractedDetails: IExtractedDetails;
  
  // Variants (sizes, colors, etc)
  variants?: {
    name: string;
    options: {
      value: string;
      priceAdjustment: number;
      stock: number;
      sku?: string;
    }[];
  }[];
  
  // SEO & copy
  seoTitle?: string;
  seoDescription?: string;
  generatedCopy?: string;
  tags: string[];
  keywords: string[];
  
  // Admin workflow
  status: 'pending' | 'reviewed' | 'approved' | 'imported' | 'rejected';
  importedToStoreAt?: Date;
  storeProductId?: string; // Reference to StoreProduct after import
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  
  // Timestamps
  lastPriceCheck: Date;
  lastStockCheck: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriceHistoryEntrySchema = new Schema<IPriceHistoryEntry>({
  price: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

const ShippingOptionSchema = new Schema<IShippingOption>({
  method: { type: String, required: true },
  cost: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  estimatedDays: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  trackable: { type: Boolean, default: false },
  carrier: String,
}, { _id: false });

const SupplierInfoSchema = new Schema<ISupplierInfo>({
  name: String,
  storeUrl: String,
  rating: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  responseTime: String,
  onTimeDelivery: { type: Number, default: 0 },
  positiveRating: { type: Number, default: 0 },
}, { _id: false });

const AffiliateInfoSchema = new Schema<IAffiliateInfo>({
  hasProgram: { type: Boolean, default: false },
  commissionRate: { type: Number, default: 0 },
  commissionType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  programName: String,
  affiliateLink: String,
  cookieDuration: Number,
}, { _id: false });

const ExtractedDetailsSchema = new Schema<IExtractedDetails>({
  features: [String],
  materials: [String],
  includedItems: [String],
  targetAudience: [String],
  useCases: [String],
  warnings: [String],
  certifications: [String],
}, { _id: false });

const DropshippingProductSchema = new Schema<IDropshippingProduct>({
  externalId: { type: String, required: true },
  sourceSlug: { type: String, required: true, index: true },
  sourceName: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  
  name: { type: String, required: true },
  nameTranslated: String,
  description: { type: String, required: true },
  descriptionTranslated: String,
  shortDescription: String,
  category: { type: String, required: true, index: true },
  subcategory: String,
  brand: String,
  
  thumbnail: { type: String, required: true },
  images: [String],
  videos: [String],
  
  originalPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  originalCurrency: { type: String, default: 'USD' },
  
  priceBRL: { type: Number, required: true },
  originalPriceBRL: { type: Number, required: true },
  exchangeRate: { type: Number, required: true },
  exchangeRateUpdatedAt: { type: Date, default: Date.now },
  
  sellingPrice: { type: Number, required: true },
  profitMargin: { type: Number, default: 30 },
  profitAmount: { type: Number, required: true },
  
  shippingOptions: [ShippingOptionSchema],
  bestShippingOption: ShippingOptionSchema,
  shippingToBrazil: { type: Boolean, default: false, index: true },
  estimatedDeliveryDays: {
    min: { type: Number, default: 15 },
    max: { type: Number, default: 45 },
  },
  
  supplier: SupplierInfoSchema,
  affiliate: AffiliateInfoSchema,
  
  stock: { type: Number, default: 0 },
  minOrderQuantity: { type: Number, default: 1 },
  maxOrderQuantity: Number,
  isAvailable: { type: Boolean, default: true, index: true },
  
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  
  priceHistory: [PriceHistoryEntrySchema],
  lowestPrice: { type: Number, default: 0 },
  highestPrice: { type: Number, default: 0 },
  priceDropAlert: { type: Boolean, default: false },
  priceTrend: { type: String, enum: ['rising', 'stable', 'falling'], default: 'stable' },
  
  trendingScore: { type: Number, default: 0, min: 0, max: 100 },
  searchVolume: { type: Number, default: 0 },
  competitorCount: { type: Number, default: 0 },
  demandScore: { type: Number, default: 0, min: 0, max: 100 },
  
  extractedDetails: ExtractedDetailsSchema,
  
  variants: [{
    name: String,
    options: [{
      value: String,
      priceAdjustment: { type: Number, default: 0 },
      stock: { type: Number, default: 0 },
      sku: String,
    }],
  }],
  
  seoTitle: String,
  seoDescription: String,
  generatedCopy: String,
  tags: [String],
  keywords: [String],
  
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'imported', 'rejected'],
    default: 'pending',
    index: true,
  },
  importedToStoreAt: Date,
  storeProductId: { type: Schema.Types.ObjectId, ref: 'StoreProduct' },
  reviewedBy: String,
  reviewedAt: Date,
  notes: String,
  
  lastPriceCheck: { type: Date, default: Date.now },
  lastStockCheck: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Indexes for efficient querying
DropshippingProductSchema.index({ externalId: 1, sourceSlug: 1 }, { unique: true });
DropshippingProductSchema.index({ name: 'text', description: 'text', tags: 'text', keywords: 'text' });
DropshippingProductSchema.index({ trendingScore: -1 });
DropshippingProductSchema.index({ sellingPrice: 1 });
DropshippingProductSchema.index({ 'affiliate.commissionRate': -1 });
DropshippingProductSchema.index({ 'estimatedDeliveryDays.max': 1 });
DropshippingProductSchema.index({ soldCount: -1 });
DropshippingProductSchema.index({ rating: -1 });
DropshippingProductSchema.index({ status: 1, createdAt: -1 });

// Static method to calculate pricing with profit margin
DropshippingProductSchema.statics.calculatePricing = function(
  basePriceBRL: number,
  shippingCostBRL: number,
  profitMargin: number = 30
) {
  const totalCost = basePriceBRL + shippingCostBRL;
  const profitMultiplier = 1 + (profitMargin / 100);
  const sellingPrice = Math.ceil(totalCost * profitMultiplier);
  const profitAmount = sellingPrice - totalCost;
  
  return {
    totalCost,
    sellingPrice,
    profitAmount,
    profitMargin,
  };
};

const DropshippingProduct: Model<IDropshippingProduct> = 
  mongoose.models.DropshippingProduct || 
  mongoose.model<IDropshippingProduct>('DropshippingProduct', DropshippingProductSchema);

export default DropshippingProduct;
