import mongoose, { Schema, Document, Model } from 'mongoose';

// Product template for POD items
export interface IPODProductTemplate {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  basePrice: number; // Provider's base cost
  currency: string;
  variants: {
    id: string;
    name: string;
    options: string[];
    priceModifier?: number;
  }[];
  printAreas: {
    id: string;
    name: string;
    width: number;
    height: number;
    position: string;
  }[];
  mockupImages: string[];
  description: string;
  productionTime: number; // days
  shippingWeight?: number;
}

// API configuration for POD providers
export interface IPODApiConfig {
  type: 'rest' | 'graphql';
  baseUrl: string;
  version?: string;
  authMethod: 'bearer' | 'apikey' | 'oauth2' | 'basic';
  authHeader?: string;
  endpoints: {
    products: string;
    createProduct: string;
    orders: string;
    createOrder: string;
    shipping: string;
    mockup?: string;
    webhook?: string;
  };
  rateLimit: number; // requests per minute
  sandbox?: {
    baseUrl: string;
    apiKey?: string;
  };
}

// Shipping options
export interface IPODShipping {
  shipsToBrazil: boolean;
  shipsGlobal: boolean;
  averageDeliveryDays: {
    domestic: { min: number; max: number };
    international: { min: number; max: number };
    brazil?: { min: number; max: number };
  };
  shippingMethods: {
    id: string;
    name: string;
    estimatedDays: number;
    basePrice: number;
  }[];
  fulfillmentLocations: string[];
  trackingAvailable: boolean;
}

// Provider capabilities
export interface IPODCapabilities {
  customBranding: boolean;
  packingSlips: boolean;
  giftMessages: boolean;
  sampleOrders: boolean;
  bulkOrders: boolean;
  mockupGenerator: boolean;
  designTemplates: boolean;
  autoFulfillment: boolean;
  inventorySync: boolean;
  webhookSupport: boolean;
}

export interface IPODProvider extends Document {
  slug: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  website: string;
  
  // Classification
  specialization: 'general' | 'apparel' | 'jewelry' | 'wall-art' | 'home-decor' | 'accessories' | 'stationery';
  productCount: number;
  
  // API
  api: IPODApiConfig;
  integrationStatus: 'active' | 'inactive' | 'testing' | 'coming_soon';
  
  // Products
  productCategories: string[];
  featuredProducts: string[];
  
  // Shipping
  shipping: IPODShipping;
  
  // Capabilities
  capabilities: IPODCapabilities;
  
  // Pricing
  profitMarginSuggested: number; // percentage
  minimumProfit: number;
  paymentMethods: string[];
  payoutSchedule: string;
  payoutMinimum: number;
  
  // Quality metrics
  qualityScore: number;
  reliabilityScore: number;
  customerSupportScore: number;
  printQualityScore: number;
  
  // Statistics
  totalOrders: number;
  successRate: number;
  averageRating: number;
  
  // Admin
  isActive: boolean;
  isPremium: boolean;
  setupGuideUrl?: string;
  documentationUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PODApiConfigSchema = new Schema<IPODApiConfig>({
  type: { type: String, enum: ['rest', 'graphql'], default: 'rest' },
  baseUrl: { type: String, required: true },
  version: String,
  authMethod: { type: String, enum: ['bearer', 'apikey', 'oauth2', 'basic'], required: true },
  authHeader: String,
  endpoints: {
    products: String,
    createProduct: String,
    orders: String,
    createOrder: String,
    shipping: String,
    mockup: String,
    webhook: String,
  },
  rateLimit: { type: Number, default: 60 },
  sandbox: {
    baseUrl: String,
    apiKey: String,
  },
}, { _id: false });

const PODShippingSchema = new Schema<IPODShipping>({
  shipsToBrazil: { type: Boolean, default: true },
  shipsGlobal: { type: Boolean, default: true },
  averageDeliveryDays: {
    domestic: { min: Number, max: Number },
    international: { min: Number, max: Number },
    brazil: { min: Number, max: Number },
  },
  shippingMethods: [{
    id: String,
    name: String,
    estimatedDays: Number,
    basePrice: Number,
  }],
  fulfillmentLocations: [String],
  trackingAvailable: { type: Boolean, default: true },
}, { _id: false });

const PODCapabilitiesSchema = new Schema<IPODCapabilities>({
  customBranding: { type: Boolean, default: false },
  packingSlips: { type: Boolean, default: true },
  giftMessages: { type: Boolean, default: false },
  sampleOrders: { type: Boolean, default: true },
  bulkOrders: { type: Boolean, default: false },
  mockupGenerator: { type: Boolean, default: true },
  designTemplates: { type: Boolean, default: false },
  autoFulfillment: { type: Boolean, default: true },
  inventorySync: { type: Boolean, default: false },
  webhookSupport: { type: Boolean, default: true },
}, { _id: false });

const PODProviderSchema = new Schema<IPODProvider>({
  slug: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  description: String,
  logo: String,
  website: { type: String, required: true },
  
  specialization: {
    type: String,
    enum: ['general', 'apparel', 'jewelry', 'wall-art', 'home-decor', 'accessories', 'stationery'],
    default: 'general',
  },
  productCount: { type: Number, default: 0 },
  
  api: PODApiConfigSchema,
  integrationStatus: {
    type: String,
    enum: ['active', 'inactive', 'testing', 'coming_soon'],
    default: 'coming_soon',
  },
  
  productCategories: [String],
  featuredProducts: [String],
  
  shipping: PODShippingSchema,
  capabilities: PODCapabilitiesSchema,
  
  profitMarginSuggested: { type: Number, default: 30 },
  minimumProfit: { type: Number, default: 5 },
  paymentMethods: [String],
  payoutSchedule: { type: String, default: 'monthly' },
  payoutMinimum: { type: Number, default: 25 },
  
  qualityScore: { type: Number, default: 80, min: 0, max: 100 },
  reliabilityScore: { type: Number, default: 80, min: 0, max: 100 },
  customerSupportScore: { type: Number, default: 80, min: 0, max: 100 },
  printQualityScore: { type: Number, default: 80, min: 0, max: 100 },
  
  totalOrders: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
  averageRating: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true, index: true },
  isPremium: { type: Boolean, default: false },
  setupGuideUrl: String,
  documentationUrl: String,
}, {
  timestamps: true,
});

// Indexes
PODProviderSchema.index({ isActive: 1, specialization: 1 });
PODProviderSchema.index({ 'shipping.shipsToBrazil': 1 });

const PODProvider: Model<IPODProvider> =
  mongoose.models.PODProvider ||
  mongoose.model<IPODProvider>('PODProvider', PODProviderSchema);

export default PODProvider;

// Default POD Providers Configuration
export const DEFAULT_POD_PROVIDERS: Partial<IPODProvider>[] = [
  {
    slug: 'printify',
    name: 'Printify',
    displayName: 'Printify',
    description: 'Maior rede de impressão sob demanda com mais de 900 produtos. Conecta você a centenas de fornecedores globais.',
    logo: 'https://logo.clearbit.com/printify.com',
    website: 'https://printify.com',
    specialization: 'general',
    productCount: 900,
    api: {
      type: 'rest',
      baseUrl: 'https://api.printify.com/v1',
      version: 'v1',
      authMethod: 'bearer',
      authHeader: 'Authorization',
      endpoints: {
        products: '/shops/{shop_id}/products.json',
        createProduct: '/shops/{shop_id}/products.json',
        orders: '/shops/{shop_id}/orders.json',
        createOrder: '/shops/{shop_id}/orders.json',
        shipping: '/shops/{shop_id}/orders/{order_id}/shipping.json',
        mockup: '/shops/{shop_id}/products/{product_id}/mockups.json',
        webhook: '/shops/{shop_id}/webhooks.json',
      },
      rateLimit: 600,
      sandbox: {
        baseUrl: 'https://api.printify.com/v1',
      },
    },
    integrationStatus: 'active',
    productCategories: [
      'Camisetas', 'Moletons', 'Canecas', 'Posters', 'Canvas',
      'Almofadas', 'Bolsas', 'Capas de Celular', 'Adesivos', 'Bonés'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 3, max: 7 },
        international: { min: 10, max: 25 },
        brazil: { min: 15, max: 35 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard', estimatedDays: 20, basePrice: 5.99 },
        { id: 'express', name: 'Express', estimatedDays: 10, basePrice: 15.99 },
      ],
      fulfillmentLocations: ['USA', 'UK', 'EU', 'Australia', 'Canada'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: false,
      sampleOrders: true,
      bulkOrders: true,
      mockupGenerator: true,
      designTemplates: true,
      autoFulfillment: true,
      inventorySync: true,
      webhookSupport: true,
    },
    profitMarginSuggested: 35,
    minimumProfit: 3,
    paymentMethods: ['PayPal', 'Stripe', 'Credit Card'],
    payoutSchedule: 'per_order',
    payoutMinimum: 0,
    qualityScore: 85,
    reliabilityScore: 90,
    customerSupportScore: 80,
    printQualityScore: 85,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://developers.printify.com/',
  },
  {
    slug: 'printful',
    name: 'Printful',
    displayName: 'Printful',
    description: 'Líder em qualidade de impressão com produção própria. Ideal para marcas que priorizam excelência.',
    logo: 'https://logo.clearbit.com/printful.com',
    website: 'https://printful.com',
    specialization: 'general',
    productCount: 340,
    api: {
      type: 'rest',
      baseUrl: 'https://api.printful.com',
      version: 'v2',
      authMethod: 'bearer',
      authHeader: 'Authorization',
      endpoints: {
        products: '/store/products',
        createProduct: '/store/products',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipping/rates',
        mockup: '/mockup-generator/create-task/{id}',
        webhook: '/webhooks',
      },
      rateLimit: 120,
    },
    integrationStatus: 'active',
    productCategories: [
      'Camisetas Premium', 'Hoodies', 'Canecas', 'Posters', 'Canvas Premium',
      'Bordados', 'All-Over Print', 'Meias', 'Toalhas', 'Cobertores'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 2, max: 5 },
        international: { min: 8, max: 20 },
        brazil: { min: 12, max: 28 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard', estimatedDays: 15, basePrice: 7.99 },
        { id: 'express', name: 'Express', estimatedDays: 7, basePrice: 19.99 },
      ],
      fulfillmentLocations: ['USA', 'Mexico', 'EU', 'UK'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: true,
      sampleOrders: true,
      bulkOrders: true,
      mockupGenerator: true,
      designTemplates: true,
      autoFulfillment: true,
      inventorySync: true,
      webhookSupport: true,
    },
    profitMarginSuggested: 40,
    minimumProfit: 5,
    paymentMethods: ['PayPal', 'Credit Card', 'Printful Wallet'],
    payoutSchedule: 'per_order',
    payoutMinimum: 0,
    qualityScore: 95,
    reliabilityScore: 95,
    customerSupportScore: 90,
    printQualityScore: 98,
    isActive: true,
    isPremium: true,
    documentationUrl: 'https://developers.printful.com/',
  },
  {
    slug: 'gooten',
    name: 'Gooten',
    displayName: 'Gooten',
    description: 'Mais de 500 produtos com rede global de fornecedores. API robusta para integrações personalizadas.',
    logo: 'https://logo.clearbit.com/gooten.com',
    website: 'https://gooten.com',
    specialization: 'home-decor',
    productCount: 500,
    api: {
      type: 'rest',
      baseUrl: 'https://api.gooten.com/api',
      version: 'v1',
      authMethod: 'apikey',
      authHeader: 'X-API-Key',
      endpoints: {
        products: '/products',
        createProduct: '/orders',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shippingprices',
        mockup: '/productpreview',
      },
      rateLimit: 300,
    },
    integrationStatus: 'active',
    productCategories: [
      'Decoração', 'Canvas', 'Metal Prints', 'Acrílico', 'Almofadas',
      'Cobertores', 'Drinkware', 'Acessórios Pet', 'Quebra-cabeças', 'Calendários'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 3, max: 8 },
        international: { min: 12, max: 28 },
        brazil: { min: 18, max: 35 },
      },
      shippingMethods: [
        { id: 'economy', name: 'Economy', estimatedDays: 25, basePrice: 4.99 },
        { id: 'standard', name: 'Standard', estimatedDays: 18, basePrice: 8.99 },
      ],
      fulfillmentLocations: ['USA', 'UK', 'EU', 'Australia'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: false,
      packingSlips: true,
      giftMessages: false,
      sampleOrders: true,
      bulkOrders: true,
      mockupGenerator: true,
      designTemplates: false,
      autoFulfillment: true,
      inventorySync: false,
      webhookSupport: true,
    },
    profitMarginSuggested: 30,
    minimumProfit: 3,
    paymentMethods: ['Credit Card', 'PayPal'],
    payoutSchedule: 'per_order',
    payoutMinimum: 0,
    qualityScore: 82,
    reliabilityScore: 85,
    customerSupportScore: 75,
    printQualityScore: 85,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://www.gooten.com/api-documentation/',
  },
  {
    slug: 'shineon',
    name: 'ShineOn',
    displayName: 'ShineOn',
    description: 'Especializado em joias personalizadas com gravação. Colares, pulseiras e anéis de alta qualidade.',
    logo: 'https://logo.clearbit.com/shineon.com',
    website: 'https://shineon.com',
    specialization: 'jewelry',
    productCount: 150,
    api: {
      type: 'rest',
      baseUrl: 'https://api.shineon.com/v1',
      version: 'v1',
      authMethod: 'bearer',
      authHeader: 'Authorization',
      endpoints: {
        products: '/products',
        createProduct: '/products',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipping',
        mockup: '/mockups',
      },
      rateLimit: 60,
    },
    integrationStatus: 'active',
    productCategories: [
      'Colares Personalizados', 'Pulseiras', 'Anéis', 'Brincos',
      'Chaveiros', 'Relógios Gravados', 'Placas Acrílicas', 'Porta-Retratos'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 3, max: 7 },
        international: { min: 10, max: 21 },
        brazil: { min: 14, max: 28 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard USA', estimatedDays: 5, basePrice: 4.99 },
        { id: 'international', name: 'International', estimatedDays: 18, basePrice: 9.99 },
      ],
      fulfillmentLocations: ['USA'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: true,
      sampleOrders: true,
      bulkOrders: false,
      mockupGenerator: true,
      designTemplates: true,
      autoFulfillment: true,
      inventorySync: true,
      webhookSupport: true,
    },
    profitMarginSuggested: 50,
    minimumProfit: 10,
    paymentMethods: ['Stripe', 'PayPal'],
    payoutSchedule: 'weekly',
    payoutMinimum: 25,
    qualityScore: 92,
    reliabilityScore: 90,
    customerSupportScore: 88,
    printQualityScore: 95,
    isActive: true,
    isPremium: true,
    documentationUrl: 'https://shineon.com/pages/api-documentation',
  },
  {
    slug: 'prodigi',
    name: 'Prodigi',
    displayName: 'Prodigi',
    description: 'Especialista em arte de parede: metal prints, canvas, acrílico e impressões fine art de museu.',
    logo: 'https://logo.clearbit.com/prodigi.com',
    website: 'https://prodigi.com',
    specialization: 'wall-art',
    productCount: 250,
    api: {
      type: 'rest',
      baseUrl: 'https://api.prodigi.com/v4.0',
      version: 'v4.0',
      authMethod: 'apikey',
      authHeader: 'X-API-Key',
      endpoints: {
        products: '/products',
        createProduct: '/orders',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/quotes',
        mockup: '/mockups',
      },
      rateLimit: 100,
      sandbox: {
        baseUrl: 'https://api.sandbox.prodigi.com/v4.0',
      },
    },
    integrationStatus: 'active',
    productCategories: [
      'Metal Prints', 'Canvas Premium', 'Acrílico', 'Fine Art Prints',
      'Posters Emoldurados', 'Impressões Fotográficas', 'Cartões', 'Calendários'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 3, max: 7 },
        international: { min: 7, max: 18 },
        brazil: { min: 12, max: 25 },
      },
      shippingMethods: [
        { id: 'budget', name: 'Budget', estimatedDays: 20, basePrice: 6.99 },
        { id: 'standard', name: 'Standard', estimatedDays: 12, basePrice: 12.99 },
        { id: 'express', name: 'Express', estimatedDays: 5, basePrice: 24.99 },
      ],
      fulfillmentLocations: ['UK', 'USA', 'EU', 'Australia'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: false,
      sampleOrders: true,
      bulkOrders: true,
      mockupGenerator: true,
      designTemplates: false,
      autoFulfillment: true,
      inventorySync: false,
      webhookSupport: true,
    },
    profitMarginSuggested: 45,
    minimumProfit: 8,
    paymentMethods: ['Credit Card', 'PayPal', 'Bank Transfer'],
    payoutSchedule: 'per_order',
    payoutMinimum: 0,
    qualityScore: 96,
    reliabilityScore: 94,
    customerSupportScore: 90,
    printQualityScore: 98,
    isActive: true,
    isPremium: true,
    documentationUrl: 'https://www.prodigi.com/print-api/',
  },
  {
    slug: 'gelato',
    name: 'Gelato',
    displayName: 'Gelato',
    description: 'Rede global com produção local em 32+ países. Entrega mais rápida e menor pegada de carbono.',
    logo: 'https://logo.clearbit.com/gelato.com',
    website: 'https://gelato.com',
    specialization: 'general',
    productCount: 400,
    api: {
      type: 'rest',
      baseUrl: 'https://api.gelato.com/v3',
      version: 'v3',
      authMethod: 'apikey',
      authHeader: 'X-API-KEY',
      endpoints: {
        products: '/products',
        createProduct: '/orders',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipment/quotes',
        mockup: '/mockups',
      },
      rateLimit: 200,
    },
    integrationStatus: 'active',
    productCategories: [
      'Camisetas', 'Posters', 'Canvas', 'Livros Fotográficos',
      'Cartões', 'Calendários', 'Wall Art', 'Canecas', 'Adesivos'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 2, max: 5 },
        international: { min: 5, max: 14 },
        brazil: { min: 8, max: 18 },
      },
      shippingMethods: [
        { id: 'normal', name: 'Normal', estimatedDays: 12, basePrice: 5.99 },
        { id: 'express', name: 'Express', estimatedDays: 5, basePrice: 14.99 },
      ],
      fulfillmentLocations: ['32+ países incluindo Brasil'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: true,
      sampleOrders: true,
      bulkOrders: true,
      mockupGenerator: true,
      designTemplates: true,
      autoFulfillment: true,
      inventorySync: true,
      webhookSupport: true,
    },
    profitMarginSuggested: 35,
    minimumProfit: 4,
    paymentMethods: ['Credit Card', 'PayPal', 'Invoice'],
    payoutSchedule: 'per_order',
    payoutMinimum: 0,
    qualityScore: 90,
    reliabilityScore: 92,
    customerSupportScore: 88,
    printQualityScore: 90,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://developer.gelato.com/',
  },
  {
    slug: 'customcat',
    name: 'CustomCat',
    displayName: 'CustomCat',
    description: 'Foco em vestuário com envio super rápido nos EUA. DTG e sublimação de alta qualidade.',
    logo: 'https://logo.clearbit.com/customcat.com',
    website: 'https://customcat.com',
    specialization: 'apparel',
    productCount: 550,
    api: {
      type: 'rest',
      baseUrl: 'https://api.customcat.com/v1',
      version: 'v1',
      authMethod: 'apikey',
      authHeader: 'X-API-Key',
      endpoints: {
        products: '/products',
        createProduct: '/products',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipping/rates',
      },
      rateLimit: 120,
    },
    integrationStatus: 'active',
    productCategories: [
      'Camisetas', 'Moletons', 'Tank Tops', 'Leggings', 'All-Over Print',
      'Bonés', 'Canecas', 'Posters', 'Tote Bags', 'Meias'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 2, max: 4 },
        international: { min: 10, max: 21 },
        brazil: { min: 15, max: 30 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard', estimatedDays: 3, basePrice: 4.99 },
        { id: 'priority', name: 'Priority', estimatedDays: 2, basePrice: 8.99 },
      ],
      fulfillmentLocations: ['USA'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: false,
      sampleOrders: true,
      bulkOrders: true,
      mockupGenerator: true,
      designTemplates: false,
      autoFulfillment: true,
      inventorySync: true,
      webhookSupport: true,
    },
    profitMarginSuggested: 30,
    minimumProfit: 3,
    paymentMethods: ['Credit Card', 'PayPal'],
    payoutSchedule: 'per_order',
    payoutMinimum: 0,
    qualityScore: 85,
    reliabilityScore: 88,
    customerSupportScore: 82,
    printQualityScore: 88,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://customcat.com/api-documentation/',
  },
  {
    slug: 'spod',
    name: 'SPOD',
    displayName: 'SPOD by Spreadshirt',
    description: 'Braço POD do Spreadshirt com produção ultra-rápida de 48h. Excelente para vestuário.',
    logo: 'https://logo.clearbit.com/spod.com',
    website: 'https://spod.com',
    specialization: 'apparel',
    productCount: 200,
    api: {
      type: 'rest',
      baseUrl: 'https://api.spod.com/v1',
      version: 'v1',
      authMethod: 'oauth2',
      endpoints: {
        products: '/articles',
        createProduct: '/articles',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipping',
      },
      rateLimit: 100,
    },
    integrationStatus: 'active',
    productCategories: [
      'Camisetas', 'Moletons', 'Bonés', 'Sacolas', 'Aventais',
      'Baby Bodies', 'Canecas', 'Garrafas', 'Acessórios'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 2, max: 5 },
        international: { min: 8, max: 16 },
        brazil: { min: 12, max: 24 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard', estimatedDays: 4, basePrice: 4.99 },
        { id: 'express', name: 'Express', estimatedDays: 2, basePrice: 9.99 },
      ],
      fulfillmentLocations: ['USA', 'EU'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: true,
      packingSlips: true,
      giftMessages: false,
      sampleOrders: true,
      bulkOrders: false,
      mockupGenerator: true,
      designTemplates: true,
      autoFulfillment: true,
      inventorySync: true,
      webhookSupport: true,
    },
    profitMarginSuggested: 35,
    minimumProfit: 4,
    paymentMethods: ['PayPal', 'Credit Card'],
    payoutSchedule: 'monthly',
    payoutMinimum: 25,
    qualityScore: 88,
    reliabilityScore: 90,
    customerSupportScore: 85,
    printQualityScore: 90,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://spod.com/api',
  },
  {
    slug: 'zazzle',
    name: 'Zazzle',
    displayName: 'Zazzle',
    description: 'Marketplace criativo com milhões de designs. Perfeito para artistas e designers.',
    logo: 'https://logo.clearbit.com/zazzle.com',
    website: 'https://zazzle.com',
    specialization: 'accessories',
    productCount: 1200,
    api: {
      type: 'rest',
      baseUrl: 'https://api.zazzle.com/v1',
      version: 'v1',
      authMethod: 'oauth2',
      endpoints: {
        products: '/products',
        createProduct: '/products',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipping',
      },
      rateLimit: 60,
    },
    integrationStatus: 'testing',
    productCategories: [
      'Camisetas', 'Canecas', 'Capas de Celular', 'Cartões', 'Convites',
      'Posters', 'Adesivos', 'Buttons', 'Joias', 'Decoração Casa'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 4, max: 10 },
        international: { min: 12, max: 28 },
        brazil: { min: 18, max: 35 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard', estimatedDays: 8, basePrice: 5.99 },
        { id: 'express', name: 'Express', estimatedDays: 4, basePrice: 14.99 },
      ],
      fulfillmentLocations: ['USA'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: false,
      packingSlips: true,
      giftMessages: true,
      sampleOrders: false,
      bulkOrders: false,
      mockupGenerator: true,
      designTemplates: true,
      autoFulfillment: true,
      inventorySync: false,
      webhookSupport: false,
    },
    profitMarginSuggested: 15,
    minimumProfit: 2,
    paymentMethods: ['PayPal', 'Check'],
    payoutSchedule: 'monthly',
    payoutMinimum: 50,
    qualityScore: 80,
    reliabilityScore: 82,
    customerSupportScore: 75,
    printQualityScore: 82,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://www.zazzle.com/sell/developers',
  },
  {
    slug: 'redbubble',
    name: 'Redbubble',
    displayName: 'Redbubble',
    description: 'Marketplace global de artistas independentes. Ideal para alcançar audiência mundial.',
    logo: 'https://logo.clearbit.com/redbubble.com',
    website: 'https://redbubble.com',
    specialization: 'general',
    productCount: 70,
    api: {
      type: 'rest',
      baseUrl: 'https://api.redbubble.com/v1',
      version: 'v1',
      authMethod: 'oauth2',
      endpoints: {
        products: '/works',
        createProduct: '/works',
        orders: '/orders',
        createOrder: '/orders',
        shipping: '/shipping',
      },
      rateLimit: 30,
    },
    integrationStatus: 'coming_soon',
    productCategories: [
      'Camisetas', 'Adesivos', 'Posters', 'Canvas', 'Capas',
      'Cadernos', 'Canecas', 'Almofadas', 'Cobertores', 'Puzzles'
    ],
    shipping: {
      shipsToBrazil: true,
      shipsGlobal: true,
      averageDeliveryDays: {
        domestic: { min: 5, max: 12 },
        international: { min: 14, max: 30 },
        brazil: { min: 20, max: 40 },
      },
      shippingMethods: [
        { id: 'standard', name: 'Standard', estimatedDays: 20, basePrice: 4.99 },
      ],
      fulfillmentLocations: ['USA', 'UK', 'EU', 'Australia'],
      trackingAvailable: true,
    },
    capabilities: {
      customBranding: false,
      packingSlips: false,
      giftMessages: false,
      sampleOrders: false,
      bulkOrders: false,
      mockupGenerator: true,
      designTemplates: false,
      autoFulfillment: true,
      inventorySync: false,
      webhookSupport: false,
    },
    profitMarginSuggested: 20,
    minimumProfit: 2,
    paymentMethods: ['PayPal', 'Bank Transfer'],
    payoutSchedule: 'monthly',
    payoutMinimum: 20,
    qualityScore: 78,
    reliabilityScore: 80,
    customerSupportScore: 70,
    printQualityScore: 80,
    isActive: true,
    isPremium: false,
    documentationUrl: 'https://help.redbubble.com/',
  },
];
