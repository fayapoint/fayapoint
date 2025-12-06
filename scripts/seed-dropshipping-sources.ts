/**
 * Seed script for dropshipping sources
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-dropshipping-sources.ts
 * Or: node -r dotenv/config scripts/seed-dropshipping-sources.js
 */

import mongoose from 'mongoose';

// Load environment variables
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

// Import the default sources directly
const DEFAULT_DROPSHIPPING_SOURCES = [
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
    apiConfig: { type: 'affiliate_api', baseUrl: 'https://api.aliexpress.com', authMethod: 'oauth2' },
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
    apiConfig: { type: 'affiliate_api', baseUrl: 'https://webservices.amazon.com', authMethod: 'basic' },
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
    slug: 'shopee',
    name: 'Shopee',
    displayName: 'Shopee Brasil',
    description: 'Marketplace asiático com forte presença no Brasil',
    logo: 'https://logo.clearbit.com/shopee.com.br',
    website: 'https://shopee.com.br',
    type: 'marketplace',
    region: 'global',
    primaryCurrency: 'BRL',
    apiConfig: { type: 'affiliate_api', baseUrl: 'https://open.shopee.com', authMethod: 'oauth2' },
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
    apiConfig: { type: 'rest', baseUrl: 'https://api.mercadolibre.com', authMethod: 'oauth2' },
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
    apiConfig: { type: 'scraping', baseUrl: 'https://www.temu.com' },
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
    apiConfig: { type: 'affiliate_api', baseUrl: 'https://api.shein.com', authMethod: 'oauth2' },
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
    slug: 'banggood',
    name: 'Banggood',
    displayName: 'Banggood',
    description: 'Marketplace chinês popular com bons preços e envio para Brasil',
    logo: 'https://logo.clearbit.com/banggood.com',
    website: 'https://banggood.com',
    type: 'marketplace',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: { type: 'affiliate_api', baseUrl: 'https://api.banggood.com', authMethod: 'apikey' },
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
    slug: 'cjdropshipping',
    name: 'CJ Dropshipping',
    displayName: 'CJ Dropshipping',
    description: 'Plataforma especializada em dropshipping com warehouse no Brasil',
    logo: 'https://logo.clearbit.com/cjdropshipping.com',
    website: 'https://cjdropshipping.com',
    type: 'aggregator',
    region: 'china',
    primaryCurrency: 'USD',
    apiConfig: { type: 'rest', baseUrl: 'https://cjdropshipping.com/api', authMethod: 'apikey' },
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
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  
  await mongoose.connect(MONGODB_URI, { dbName: 'fayapoint' });
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  
  const collection = db.collection('dropshippingsources');

  // Check existing sources
  const existingCount = await collection.countDocuments();
  console.log(`📦 Found ${existingCount} existing sources`);

  // Get existing slugs
  const existingSlugs = await collection.distinct('slug');
  
  // Filter new sources
  const newSources = DEFAULT_DROPSHIPPING_SOURCES.filter(
    s => !existingSlugs.includes(s.slug)
  );

  if (newSources.length === 0) {
    console.log('✅ All default sources already exist');
  } else {
    // Insert new sources
    const result = await collection.insertMany(newSources);
    console.log(`✅ Added ${result.insertedCount} new dropshipping sources:`);
    newSources.forEach(s => console.log(`   - ${s.displayName} (${s.slug})`));
  }

  // Show summary
  const finalCount = await collection.countDocuments();
  console.log(`\n📊 Total sources: ${finalCount}`);
  
  const prioritySources = await collection.countDocuments({ isPriority: true });
  console.log(`⭐ Priority sources: ${prioritySources}`);

  const activeSources = await collection.countDocuments({ isActive: true });
  console.log(`🟢 Active sources: ${activeSources}`);

  await mongoose.disconnect();
  console.log('\n✅ Seed completed!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
