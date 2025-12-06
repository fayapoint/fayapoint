import mongoose, { Schema, Document, Model } from 'mongoose';

// API configuration for automated fetching
export interface IApiConfig {
  type: 'rest' | 'graphql' | 'scraping' | 'affiliate_api';
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  affiliateId?: string;
  trackingId?: string;
  rateLimit?: number; // requests per minute
  headers?: Record<string, string>;
  authMethod?: 'bearer' | 'apikey' | 'basic' | 'oauth2';
}

// Shipping configuration
export interface IShippingConfig {
  shipsToBrazil: boolean;
  averageDeliveryDays: {
    min: number;
    max: number;
  };
  trackingAvailable: boolean;
  freeShippingThreshold?: number; // in USD
  shippingMethods: string[];
}

// Affiliate program details
export interface IAffiliateProgram {
  available: boolean;
  name?: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed' | 'tiered';
  cookieDuration: number; // days
  paymentMethods: string[];
  minimumPayout: number;
  paymentCurrency: string;
  signupUrl?: string;
  dashboardUrl?: string;
}

// Search capabilities
export interface ISearchCapabilities {
  supportsKeywordSearch: boolean;
  supportsCategoryBrowse: boolean;
  supportsImageSearch: boolean;
  supportsPriceFilter: boolean;
  supportsShippingFilter: boolean;
  supportsSortByPopularity: boolean;
  supportsSortByPrice: boolean;
  supportsSortByRating: boolean;
  maxResultsPerPage: number;
}

export interface IDropshippingSource extends Document {
  slug: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  website: string;
  
  // Classification
  type: 'marketplace' | 'wholesale' | 'pod' | 'aggregator'; // print-on-demand, aggregator
  region: 'china' | 'usa' | 'europe' | 'global';
  primaryCurrency: string;
  
  // API & Integration
  apiConfig: IApiConfig;
  integrationStatus: 'active' | 'inactive' | 'testing' | 'deprecated';
  lastSync?: Date;
  syncFrequency: number; // hours
  
  // Shipping
  shipping: IShippingConfig;
  
  // Affiliate
  affiliate: IAffiliateProgram;
  
  // Search
  searchCapabilities: ISearchCapabilities;
  
  // Quality metrics
  reliabilityScore: number; // 0-100
  qualityScore: number; // 0-100
  priceCompetitiveness: number; // 0-100
  supportQuality: number; // 0-100
  
  // Statistics
  totalProductsIndexed: number;
  successfulOrders: number;
  failedOrders: number;
  averageDeliveryDays: number;
  averageRating: number;
  
  // Admin
  isActive: boolean;
  isPriority: boolean;
  notes?: string;
  
  // Categories mapping
  categoryMapping: {
    sourceCategory: string;
    ourCategory: string;
    ourSubcategory?: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const ApiConfigSchema = new Schema<IApiConfig>({
  type: { type: String, enum: ['rest', 'graphql', 'scraping', 'affiliate_api'], required: true },
  baseUrl: String,
  apiKey: String,
  apiSecret: String,
  affiliateId: String,
  trackingId: String,
  rateLimit: { type: Number, default: 60 },
  headers: { type: Map, of: String },
  authMethod: { type: String, enum: ['bearer', 'apikey', 'basic', 'oauth2'] },
}, { _id: false });

const ShippingConfigSchema = new Schema<IShippingConfig>({
  shipsToBrazil: { type: Boolean, required: true },
  averageDeliveryDays: {
    min: { type: Number, default: 15 },
    max: { type: Number, default: 45 },
  },
  trackingAvailable: { type: Boolean, default: true },
  freeShippingThreshold: Number,
  shippingMethods: [String],
}, { _id: false });

const AffiliateProgramSchema = new Schema<IAffiliateProgram>({
  available: { type: Boolean, default: false },
  name: String,
  commissionRate: { type: Number, default: 0 },
  commissionType: { type: String, enum: ['percentage', 'fixed', 'tiered'], default: 'percentage' },
  cookieDuration: { type: Number, default: 30 },
  paymentMethods: [String],
  minimumPayout: { type: Number, default: 50 },
  paymentCurrency: { type: String, default: 'USD' },
  signupUrl: String,
  dashboardUrl: String,
}, { _id: false });

const SearchCapabilitiesSchema = new Schema<ISearchCapabilities>({
  supportsKeywordSearch: { type: Boolean, default: true },
  supportsCategoryBrowse: { type: Boolean, default: true },
  supportsImageSearch: { type: Boolean, default: false },
  supportsPriceFilter: { type: Boolean, default: true },
  supportsShippingFilter: { type: Boolean, default: false },
  supportsSortByPopularity: { type: Boolean, default: true },
  supportsSortByPrice: { type: Boolean, default: true },
  supportsSortByRating: { type: Boolean, default: true },
  maxResultsPerPage: { type: Number, default: 50 },
}, { _id: false });

const DropshippingSourceSchema = new Schema<IDropshippingSource>({
  slug: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  description: String,
  logo: String,
  website: { type: String, required: true },
  
  type: { 
    type: String, 
    enum: ['marketplace', 'wholesale', 'pod', 'aggregator'], 
    default: 'marketplace' 
  },
  region: { 
    type: String, 
    enum: ['china', 'usa', 'europe', 'global'], 
    default: 'china' 
  },
  primaryCurrency: { type: String, default: 'USD' },
  
  apiConfig: ApiConfigSchema,
  integrationStatus: { 
    type: String, 
    enum: ['active', 'inactive', 'testing', 'deprecated'], 
    default: 'inactive' 
  },
  lastSync: Date,
  syncFrequency: { type: Number, default: 24 },
  
  shipping: ShippingConfigSchema,
  affiliate: AffiliateProgramSchema,
  searchCapabilities: SearchCapabilitiesSchema,
  
  reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
  qualityScore: { type: Number, default: 50, min: 0, max: 100 },
  priceCompetitiveness: { type: Number, default: 50, min: 0, max: 100 },
  supportQuality: { type: Number, default: 50, min: 0, max: 100 },
  
  totalProductsIndexed: { type: Number, default: 0 },
  successfulOrders: { type: Number, default: 0 },
  failedOrders: { type: Number, default: 0 },
  averageDeliveryDays: { type: Number, default: 30 },
  averageRating: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true, index: true },
  isPriority: { type: Boolean, default: false },
  notes: String,
  
  categoryMapping: [{
    sourceCategory: String,
    ourCategory: String,
    ourSubcategory: String,
  }],
}, {
  timestamps: true,
});

// Indexes
DropshippingSourceSchema.index({ isActive: 1, isPriority: -1 });
DropshippingSourceSchema.index({ 'shipping.shipsToBrazil': 1, isActive: 1 });
DropshippingSourceSchema.index({ 'affiliate.available': 1, 'affiliate.commissionRate': -1 });

const DropshippingSource: Model<IDropshippingSource> = 
  mongoose.models.DropshippingSource || 
  mongoose.model<IDropshippingSource>('DropshippingSource', DropshippingSourceSchema);

export default DropshippingSource;

// Default sources configuration
export const DEFAULT_DROPSHIPPING_SOURCES: Partial<IDropshippingSource>[] = [
  {
    slug: 'aliexpress',
    name: 'AliExpress',
    displayName: 'AliExpress',
    description: 'Maior marketplace da China com milhões de produtos e programa de afiliados robusto',
    logo: 'https://logo.clearbit.com/aliexpress.com',
    website: 'https://aliexpress.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://api.aliexpress.com',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 20, max: 60 },
      trackingAvailable: true,
      freeShippingThreshold: 10,
      shippingMethods: ['AliExpress Standard', 'ePacket', 'Yanwen', 'China Post'],
    },
    affiliate: {
      available: true,
      name: 'AliExpress Affiliate Program',
      commissionRate: 8.5,
      commissionType: 'percentage',
      cookieDuration: 3,
      paymentMethods: ['PayPal', 'Wire Transfer'],
      minimumPayout: 16,
      paymentCurrency: 'USD',
      signupUrl: 'https://portals.aliexpress.com',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: true,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 60,
    },
    reliabilityScore: 85,
    qualityScore: 70,
    priceCompetitiveness: 95,
    supportQuality: 65,
    isActive: true,
    isPriority: true,
  },
  {
    slug: 'amazon',
    name: 'Amazon',
    displayName: 'Amazon',
    description: 'Maior e-commerce do mundo com entregas rápidas e programa Amazon Associates',
    logo: 'https://logo.clearbit.com/amazon.com',
    website: 'https://amazon.com',
    type: 'marketplace',
    region: 'usa',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://webservices.amazon.com',
      authMethod: 'basic',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 7, max: 21 },
      trackingAvailable: true,
      freeShippingThreshold: 49,
      shippingMethods: ['Amazon Global', 'AmazonGlobal Standard', 'AmazonGlobal Expedited'],
    },
    affiliate: {
      available: true,
      name: 'Amazon Associates',
      commissionRate: 4,
      commissionType: 'tiered',
      cookieDuration: 1,
      paymentMethods: ['Bank Transfer', 'Gift Card', 'Check'],
      minimumPayout: 10,
      paymentCurrency: 'USD',
      signupUrl: 'https://affiliate-program.amazon.com',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: false,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 50,
    },
    reliabilityScore: 98,
    qualityScore: 90,
    priceCompetitiveness: 70,
    supportQuality: 95,
    isActive: true,
    isPriority: true,
  },
  {
    slug: 'banggood',
    name: 'Banggood',
    displayName: 'Banggood',
    description: 'Marketplace chinês popular com bons preços e envio para Brasil',
    logo: 'https://logo.clearbit.com/banggood.com',
    website: 'https://banggood.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://api.banggood.com',
      authMethod: 'apikey',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 15, max: 45 },
      trackingAvailable: true,
      freeShippingThreshold: 20,
      shippingMethods: ['Priority Direct Mail', 'Banggood Express', 'Standard Shipping'],
    },
    affiliate: {
      available: true,
      name: 'Banggood Affiliate',
      commissionRate: 10,
      commissionType: 'percentage',
      cookieDuration: 30,
      paymentMethods: ['PayPal', 'Wire Transfer'],
      minimumPayout: 20,
      paymentCurrency: 'USD',
      signupUrl: 'https://www.banggood.com/affiliate.html',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: false,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 48,
    },
    reliabilityScore: 80,
    qualityScore: 75,
    priceCompetitiveness: 90,
    supportQuality: 70,
    isActive: true,
    isPriority: false,
  },
  {
    slug: 'dhgate',
    name: 'DHgate',
    displayName: 'DHgate',
    description: 'Marketplace B2B chinês com preços atacado e dropshipping',
    logo: 'https://logo.clearbit.com/dhgate.com',
    website: 'https://dhgate.com',
    type: 'wholesale',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://open.dhgate.com',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 20, max: 50 },
      trackingAvailable: true,
      freeShippingThreshold: 50,
      shippingMethods: ['ePacket', 'EMS', 'DHL', 'FedEx'],
    },
    affiliate: {
      available: true,
      name: 'DHgate Affiliate Program',
      commissionRate: 6,
      commissionType: 'percentage',
      cookieDuration: 30,
      paymentMethods: ['PayPal', 'Wire Transfer'],
      minimumPayout: 50,
      paymentCurrency: 'USD',
      signupUrl: 'https://www.dhgate.com/affiliate/index.html',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: false,
      supportsPriceFilter: true,
      supportsShippingFilter: false,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 48,
    },
    reliabilityScore: 75,
    qualityScore: 70,
    priceCompetitiveness: 92,
    supportQuality: 60,
    isActive: true,
    isPriority: false,
  },
  {
    slug: 'cjdropshipping',
    name: 'CJ Dropshipping',
    displayName: 'CJ Dropshipping',
    description: 'Plataforma especializada em dropshipping com warehouse no Brasil',
    logo: 'https://logo.clearbit.com/cjdropshipping.com',
    website: 'https://cjdropshipping.com',
    type: 'aggregator',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'rest',
      baseUrl: 'https://cjdropshipping.com/api',
      authMethod: 'apikey',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 12, max: 30 },
      trackingAvailable: true,
      freeShippingThreshold: 0,
      shippingMethods: ['CJPacket', 'USPS', 'DHL', 'Brazil Warehouse'],
    },
    affiliate: {
      available: true,
      name: 'CJ Partner Program',
      commissionRate: 3,
      commissionType: 'percentage',
      cookieDuration: 60,
      paymentMethods: ['PayPal', 'Payoneer'],
      minimumPayout: 30,
      paymentCurrency: 'USD',
      signupUrl: 'https://cjdropshipping.com/affiliate',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: true,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 100,
    },
    reliabilityScore: 88,
    qualityScore: 78,
    priceCompetitiveness: 85,
    supportQuality: 85,
    isActive: true,
    isPriority: true,
  },
  {
    slug: 'wish',
    name: 'Wish',
    displayName: 'Wish',
    description: 'Marketplace com preços muito baixos e envio global',
    logo: 'https://logo.clearbit.com/wish.com',
    website: 'https://wish.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'rest',
      baseUrl: 'https://merchant.wish.com/api/v2',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 15, max: 60 },
      trackingAvailable: true,
      freeShippingThreshold: 0,
      shippingMethods: ['Wish Post', 'Standard Shipping'],
    },
    affiliate: {
      available: true,
      name: 'Wish Affiliate',
      commissionRate: 7,
      commissionType: 'percentage',
      cookieDuration: 7,
      paymentMethods: ['PayPal'],
      minimumPayout: 25,
      paymentCurrency: 'USD',
      signupUrl: 'https://www.wish.com/affiliate',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: false,
      supportsPriceFilter: true,
      supportsShippingFilter: false,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 60,
    },
    reliabilityScore: 65,
    qualityScore: 55,
    priceCompetitiveness: 98,
    supportQuality: 50,
    isActive: true,
    isPriority: false,
  },
  {
    slug: 'lightinthebox',
    name: 'LightInTheBox',
    displayName: 'LightInTheBox',
    description: 'E-commerce global com foco em moda e eletrônicos',
    logo: 'https://logo.clearbit.com/lightinthebox.com',
    website: 'https://lightinthebox.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://www.lightinthebox.com/api',
      authMethod: 'apikey',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 15, max: 35 },
      trackingAvailable: true,
      freeShippingThreshold: 39,
      shippingMethods: ['Standard Shipping', 'Expedited Shipping', 'Super Saver'],
    },
    affiliate: {
      available: true,
      name: 'LightInTheBox Affiliate',
      commissionRate: 12,
      commissionType: 'percentage',
      cookieDuration: 30,
      paymentMethods: ['PayPal', 'Wire Transfer'],
      minimumPayout: 30,
      paymentCurrency: 'USD',
      signupUrl: 'https://www.lightinthebox.com/affiliate/',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: false,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 60,
    },
    reliabilityScore: 78,
    qualityScore: 72,
    priceCompetitiveness: 82,
    supportQuality: 75,
    isActive: true,
    isPriority: false,
  },
  {
    slug: 'temu',
    name: 'Temu',
    displayName: 'Temu',
    description: 'Novo marketplace chinês com preços agressivos e frete grátis',
    logo: 'https://logo.clearbit.com/temu.com',
    website: 'https://temu.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'scraping',
      baseUrl: 'https://www.temu.com',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 7, max: 20 },
      trackingAvailable: true,
      freeShippingThreshold: 0,
      shippingMethods: ['Temu Standard', 'Express Delivery'],
    },
    affiliate: {
      available: true,
      name: 'Temu Affiliate Program',
      commissionRate: 20,
      commissionType: 'percentage',
      cookieDuration: 30,
      paymentMethods: ['PayPal'],
      minimumPayout: 20,
      paymentCurrency: 'USD',
      signupUrl: 'https://affiliate.temu.com',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: true,
      supportsPriceFilter: true,
      supportsShippingFilter: false,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 100,
    },
    reliabilityScore: 82,
    qualityScore: 68,
    priceCompetitiveness: 97,
    supportQuality: 70,
    isActive: true,
    isPriority: true,
  },
  {
    slug: 'shein',
    name: 'SHEIN',
    displayName: 'SHEIN',
    description: 'Gigante da moda com preços baixos e presença forte no Brasil',
    logo: 'https://logo.clearbit.com/shein.com',
    website: 'https://shein.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://api.shein.com',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 7, max: 15 },
      trackingAvailable: true,
      freeShippingThreshold: 79,
      shippingMethods: ['SHEIN Standard', 'SHEIN Express', 'SHEIN Economy'],
    },
    affiliate: {
      available: true,
      name: 'SHEIN Affiliate',
      commissionRate: 15,
      commissionType: 'percentage',
      cookieDuration: 30,
      paymentMethods: ['PayPal', 'Bank Transfer'],
      minimumPayout: 20,
      paymentCurrency: 'USD',
      signupUrl: 'https://us.shein.com/affiliate-info-a-1266.html',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: true,
      supportsPriceFilter: true,
      supportsShippingFilter: false,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 120,
    },
    reliabilityScore: 88,
    qualityScore: 72,
    priceCompetitiveness: 94,
    supportQuality: 80,
    isActive: true,
    isPriority: true,
  },
  {
    slug: 'alibaba',
    name: 'Alibaba',
    displayName: 'Alibaba',
    description: 'Maior plataforma B2B do mundo para compras em atacado',
    logo: 'https://logo.clearbit.com/alibaba.com',
    website: 'https://alibaba.com',
    type: 'wholesale',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: {
      type: 'rest',
      baseUrl: 'https://open.1688.com',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 15, max: 45 },
      trackingAvailable: true,
      freeShippingThreshold: 500,
      shippingMethods: ['Sea Freight', 'Air Freight', 'Express'],
    },
    affiliate: {
      available: false,
      commissionRate: 0,
      commissionType: 'percentage',
      cookieDuration: 0,
      paymentMethods: [],
      minimumPayout: 0,
      paymentCurrency: 'USD',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: true,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 48,
    },
    reliabilityScore: 90,
    qualityScore: 80,
    priceCompetitiveness: 98,
    supportQuality: 75,
    isActive: true,
    isPriority: false,
  },
  {
    slug: 'shopee',
    name: 'Shopee',
    displayName: 'Shopee',
    description: 'Marketplace asiático com forte presença no Brasil',
    logo: 'https://logo.clearbit.com/shopee.com.br',
    website: 'https://shopee.com.br',
    type: 'marketplace',
    region: 'global',
    primaryCurrency: 'BRL',
    apiConfig: {
      type: 'affiliate_api',
      baseUrl: 'https://open.shopee.com',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 3, max: 15 },
      trackingAvailable: true,
      freeShippingThreshold: 29,
      shippingMethods: ['Shopee Xpress', 'Correios', 'Jadlog'],
    },
    affiliate: {
      available: true,
      name: 'Shopee Affiliate Program',
      commissionRate: 8,
      commissionType: 'percentage',
      cookieDuration: 7,
      paymentMethods: ['Bank Transfer', 'PayPal'],
      minimumPayout: 50,
      paymentCurrency: 'BRL',
      signupUrl: 'https://affiliate.shopee.com.br/',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: true,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 60,
    },
    reliabilityScore: 85,
    qualityScore: 75,
    priceCompetitiveness: 88,
    supportQuality: 80,
    isActive: true,
    isPriority: true,
  },
  {
    slug: 'mercadolivre',
    name: 'Mercado Livre',
    displayName: 'Mercado Livre',
    description: 'Maior marketplace da América Latina',
    logo: 'https://logo.clearbit.com/mercadolivre.com.br',
    website: 'https://mercadolivre.com.br',
    type: 'marketplace',
    region: 'global',
    primaryCurrency: 'BRL',
    apiConfig: {
      type: 'rest',
      baseUrl: 'https://api.mercadolibre.com',
      authMethod: 'oauth2',
    },
    shipping: {
      shipsToBrazil: true,
      averageDeliveryDays: { min: 1, max: 10 },
      trackingAvailable: true,
      freeShippingThreshold: 79,
      shippingMethods: ['Mercado Envios', 'Full', 'Flex'],
    },
    affiliate: {
      available: true,
      name: 'Programa de Afiliados ML',
      commissionRate: 11,
      commissionType: 'percentage',
      cookieDuration: 3,
      paymentMethods: ['Mercado Pago'],
      minimumPayout: 50,
      paymentCurrency: 'BRL',
      signupUrl: 'https://afiliados.mercadolivre.com.br',
    },
    searchCapabilities: {
      supportsKeywordSearch: true,
      supportsCategoryBrowse: true,
      supportsImageSearch: false,
      supportsPriceFilter: true,
      supportsShippingFilter: true,
      supportsSortByPopularity: true,
      supportsSortByPrice: true,
      supportsSortByRating: true,
      maxResultsPerPage: 50,
    },
    reliabilityScore: 95,
    qualityScore: 85,
    priceCompetitiveness: 75,
    supportQuality: 90,
    isActive: true,
    isPriority: true,
  },
];
