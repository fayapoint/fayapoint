/**
 * Prodigi Print API Integration
 * API Documentation: https://www.prodigi.com/print-api/docs/reference/
 * 
 * Prodigi is a premium print-on-demand provider specializing in:
 * - Wall Art (Canvas, Metal Prints, Acrylics, Fine Art)
 * - Photobooks
 * - Tech accessories
 * - Home decor
 * 
 * Key features:
 * - Global fulfillment network (UK, USA, EU, Australia)
 * - Ships to Brazil
 * - High quality printing
 * - Custom branding options
 * - Webhook callbacks for order status
 */

// ========================
// CONFIGURATION
// ========================

const PRODIGI_API_KEY = process.env.PRODIGI_API_KEY || '';
const PRODIGI_ENV = process.env.PRODIGI_ENV || 'sandbox'; // 'sandbox' | 'live'

const API_URLS = {
  sandbox: 'https://api.sandbox.prodigi.com/v4.0',
  live: 'https://api.prodigi.com/v4.0',
};

const getBaseUrl = () => API_URLS[PRODIGI_ENV as keyof typeof API_URLS] || API_URLS.sandbox;

// ========================
// TYPES & INTERFACES
// ========================

// Address
export interface ProdigiAddress {
  line1: string;
  line2?: string;
  postalOrZipCode: string;
  countryCode: string; // ISO 3166 country code
  townOrCity: string;
  stateOrCounty?: string;
}

// Recipient
export interface ProdigiRecipient {
  name: string;
  email?: string;
  phoneNumber?: string;
  address: ProdigiAddress;
}

// Cost object
export interface ProdigiCost {
  amount: string;
  currency: string; // ISO 4217 currency code (GBP, USD, EUR, etc.)
}

// Asset (image to print)
export interface ProdigiAsset {
  printArea: 'default' | 'spine' | 'lid' | string;
  url: string;
  md5Hash?: string;
  pageCount?: number; // For photobooks
  thumbnailUrl?: string;
  status?: 'complete' | 'inProgress' | 'error';
}

// Order Item
export interface ProdigiOrderItem {
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing?: 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea';
  attributes?: Record<string, string>; // e.g., { color: 'black', wrap: 'ImageWrap' }
  assets: ProdigiAsset[];
  recipientCost?: ProdigiCost; // What your customer paid (for your records)
}

// Branding assets
export interface ProdigiBranding {
  postcard?: { url: string };
  flyer?: { url: string };
  packing_slip_bw?: { url: string };
  packing_slip_color?: { url: string };
  sticker_exterior_round?: { url: string };
  sticker_exterior_rectangle?: { url: string };
  sticker_interior_round?: { url: string };
  sticker_interior_rectangle?: { url: string };
}

// Shipping methods
export type ProdigiShippingMethod = 'Budget' | 'Standard' | 'StandardPlus' | 'Express' | 'Overnight';

// Order Status Stage
export type ProdigiOrderStage = 'InProgress' | 'Complete' | 'Cancelled';

// Order Status Details
export interface ProdigiStatusDetails {
  downloadAssets: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
  printReadyAssetsPrepared: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
  allocateProductionLocation: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
  inProduction: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
  shipping: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
}

// Order Status Issue
export interface ProdigiStatusIssue {
  objectId: string;
  errorCode: string;
  description: string;
  authorisationDetails?: {
    authorisationUrl: string;
    paymentDetails: ProdigiCost;
  };
}

// Order Status
export interface ProdigiStatus {
  stage: ProdigiOrderStage;
  issues: ProdigiStatusIssue[];
  details: ProdigiStatusDetails;
}

// Charge Item
export interface ProdigiChargeItem {
  id: string;
  shipmentId?: string;
  itemId?: string;
  cost: ProdigiCost;
}

// Charge
export interface ProdigiCharge {
  id: string;
  chargeType: 'Item' | 'Shipping' | 'Refund' | 'Other';
  prodigiInvoiceNumber?: string;
  totalCost: ProdigiCost;
  items: ProdigiChargeItem[];
}

// Tracking
export interface ProdigiTracking {
  url?: string;
  number?: string;
}

// Fulfillment Location
export interface ProdigiFulfillmentLocation {
  countryCode: string;
  labCode: string;
}

// Shipment Item
export interface ProdigiShipmentItem {
  itemId: string;
}

// Shipment
export interface ProdigiShipment {
  id: string;
  status: 'Processing' | 'Cancelled' | 'Shipped';
  carrier?: string;
  tracking?: ProdigiTracking;
  dispatchDate?: string;
  items: ProdigiShipmentItem[];
  fulfillmentLocation?: ProdigiFulfillmentLocation;
}

// Order Item (in response)
export interface ProdigiOrderItemResponse {
  id: string;
  status: 'Ok' | 'Invalid' | 'NotYetDownloaded';
  merchantReference?: string;
  sku: string;
  copies: number;
  sizing: 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea';
  attributes: Record<string, string>;
  assets: (ProdigiAsset & { id: string; status: string })[];
  recipientCost?: ProdigiCost;
}

// Full Order
export interface ProdigiOrder {
  id: string;
  created: string;
  lastUpdated: string;
  callbackUrl?: string;
  merchantReference?: string;
  shippingMethod: ProdigiShippingMethod;
  idempotencyKey?: string;
  status: ProdigiStatus;
  charges: ProdigiCharge[];
  shipments: ProdigiShipment[];
  recipient: ProdigiRecipient;
  branding?: ProdigiBranding;
  items: ProdigiOrderItemResponse[];
  packingSlip?: { url: string; status: string };
  metadata?: Record<string, unknown>;
}

// Create Order Request
export interface ProdigiCreateOrderRequest {
  merchantReference?: string;
  shippingMethod: ProdigiShippingMethod;
  idempotencyKey?: string;
  callbackUrl?: string;
  recipient: ProdigiRecipient;
  branding?: ProdigiBranding;
  items: ProdigiOrderItem[];
  packingSlip?: { url: string };
  metadata?: Record<string, unknown>;
}

// API Response wrapper
export interface ProdigiResponse<T> {
  outcome: 'Created' | 'Ok' | 'CreatedWithIssues' | 'AlreadyExists';
  traceParent?: string;
  order?: T;
  orders?: T[];
  quotes?: T[];
  product?: T;
}

// Quote Item
export interface ProdigiQuoteItem {
  sku: string;
  copies: number;
  attributes?: Record<string, string>;
  assets: { printArea: string }[];
}

// Quote Request
export interface ProdigiQuoteRequest {
  shippingMethod?: ProdigiShippingMethod;
  destinationCountryCode: string;
  currencyCode: string;
  items: ProdigiQuoteItem[];
}

// Quote Response Item
export interface ProdigiQuoteResponseItem {
  id: string;
  sku: string;
  copies: number;
  unitCost: ProdigiCost;
  attributes: Record<string, string>;
  assets: { printArea: string }[];
}

// Quote Shipment
export interface ProdigiQuoteShipment {
  carrier: { name: string; service: string };
  fulfillmentLocation: ProdigiFulfillmentLocation;
  cost: ProdigiCost;
  items: string[];
}

// Quote Cost Summary
export interface ProdigiQuoteCostSummary {
  items: ProdigiCost;
  shipping: ProdigiCost;
}

// Quote
export interface ProdigiQuote {
  shipmentMethod: ProdigiShippingMethod;
  costSummary: ProdigiQuoteCostSummary;
  shipments: ProdigiQuoteShipment[];
  items: ProdigiQuoteResponseItem[];
}

// Product Dimensions
export interface ProdigiProductDimensions {
  width: number;
  height: number;
  units: 'in' | 'cm' | 'mm';
}

// Product Print Area
export interface ProdigiPrintArea {
  required: boolean;
}

// Product Variant
export interface ProdigiProductVariant {
  attributes: Record<string, string>;
  shipsTo: string[]; // ISO country codes
  printAreaSizes: {
    [key: string]: {
      horizontalResolution: number;
      verticalResolution: number;
    };
  };
}

// Product Details
export interface ProdigiProductDetails {
  sku: string;
  description: string;
  productDimensions: ProdigiProductDimensions;
  attributes: Record<string, string[]>;
  printAreas: Record<string, ProdigiPrintArea>;
  variants: ProdigiProductVariant[];
}

// Callback Event (CloudEvents format)
export interface ProdigiCallbackEvent {
  specversion: string;
  type: string; // e.g., 'com.prodigi.order.status.stage.changed#InProgress'
  source: string;
  id: string;
  time: string;
  datacontenttype: string;
  data: {
    order: ProdigiOrder;
  };
  subject: string; // Order ID
}

// ========================
// API HELPER
// ========================

async function prodigiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  
  const headers: HeadersInit = {
    'X-API-Key': PRODIGI_API_KEY,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Prodigi API Error]', data);
    throw new Error(data.message || data.description || `Prodigi API error: ${response.status}`);
  }

  return data;
}

// ========================
// ORDER ENDPOINTS
// ========================

/**
 * Create a new order
 */
export async function createOrder(
  orderData: ProdigiCreateOrderRequest
): Promise<ProdigiResponse<ProdigiOrder>> {
  return prodigiRequest<ProdigiResponse<ProdigiOrder>>('/Orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

/**
 * Get an order by ID
 */
export async function getOrder(orderId: string): Promise<ProdigiResponse<ProdigiOrder>> {
  return prodigiRequest<ProdigiResponse<ProdigiOrder>>(`/Orders/${orderId}`);
}

/**
 * Get all orders
 */
export async function getOrders(params?: {
  top?: number;
  skip?: number;
  merchantReference?: string;
  status?: ProdigiOrderStage;
  createdFrom?: string;
  createdTo?: string;
}): Promise<ProdigiResponse<ProdigiOrder[]>> {
  const queryParams = new URLSearchParams();
  if (params?.top) queryParams.set('top', params.top.toString());
  if (params?.skip) queryParams.set('skip', params.skip.toString());
  if (params?.merchantReference) queryParams.set('merchantReference', params.merchantReference);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.createdFrom) queryParams.set('createdFrom', params.createdFrom);
  if (params?.createdTo) queryParams.set('createdTo', params.createdTo);

  const queryString = queryParams.toString();
  return prodigiRequest<ProdigiResponse<ProdigiOrder[]>>(
    `/Orders${queryString ? `?${queryString}` : ''}`
  );
}

/**
 * Get available actions for an order
 */
export async function getOrderActions(orderId: string): Promise<{ actions: string[] }> {
  return prodigiRequest<{ actions: string[] }>(`/Orders/${orderId}/actions`);
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<ProdigiResponse<ProdigiOrder>> {
  return prodigiRequest<ProdigiResponse<ProdigiOrder>>(`/Orders/${orderId}/actions/cancel`, {
    method: 'POST',
  });
}

/**
 * Update order shipping method
 */
export async function updateShippingMethod(
  orderId: string,
  shippingMethod: ProdigiShippingMethod
): Promise<ProdigiResponse<ProdigiOrder>> {
  return prodigiRequest<ProdigiResponse<ProdigiOrder>>(
    `/Orders/${orderId}/actions/updateShippingMethod`,
    {
      method: 'POST',
      body: JSON.stringify({ shippingMethod }),
    }
  );
}

/**
 * Update order recipient
 */
export async function updateRecipient(
  orderId: string,
  recipient: ProdigiRecipient
): Promise<ProdigiResponse<ProdigiOrder>> {
  return prodigiRequest<ProdigiResponse<ProdigiOrder>>(
    `/Orders/${orderId}/actions/updateRecipient`,
    {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    }
  );
}

/**
 * Update order metadata
 */
export async function updateMetadata(
  orderId: string,
  metadata: Record<string, unknown>
): Promise<ProdigiResponse<ProdigiOrder>> {
  return prodigiRequest<ProdigiResponse<ProdigiOrder>>(
    `/Orders/${orderId}/actions/updateMetadata`,
    {
      method: 'POST',
      body: JSON.stringify({ metadata }),
    }
  );
}

// ========================
// QUOTE ENDPOINTS
// ========================

/**
 * Get a quote for items (pricing without creating order)
 */
export async function createQuote(
  quoteData: ProdigiQuoteRequest
): Promise<ProdigiResponse<ProdigiQuote[]>> {
  return prodigiRequest<ProdigiResponse<ProdigiQuote[]>>('/Quotes', {
    method: 'POST',
    body: JSON.stringify(quoteData),
  });
}

/**
 * Get quotes for all shipping methods
 */
export async function getQuotesAllMethods(
  destinationCountryCode: string,
  currencyCode: string,
  items: ProdigiQuoteItem[]
): Promise<ProdigiQuote[]> {
  const response = await createQuote({
    destinationCountryCode,
    currencyCode,
    items,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (response as any).quotes || [];
}

// ========================
// PRODUCT ENDPOINTS
// ========================

/**
 * Get product details by SKU
 */
export async function getProductDetails(sku: string): Promise<ProdigiResponse<ProdigiProductDetails>> {
  return prodigiRequest<ProdigiResponse<ProdigiProductDetails>>(`/Products/${sku}`);
}

/**
 * Get photobook spine details
 */
export async function getPhotobookSpineDetails(
  sku: string,
  destinationCountryCode: string,
  state: string,
  numberOfPages: number
): Promise<{ success: boolean; message: string; spineInfo: { widthMm: number } }> {
  return prodigiRequest(`/Products/spine`, {
    method: 'POST',
    body: JSON.stringify({
      sku,
      destinationCountryCode,
      state,
      numberOfPages,
    }),
  });
}

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Generate idempotency key for order
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Map our internal status to Prodigi status
 */
export function mapProdigiStatus(status: ProdigiStatus): string {
  const { stage, details } = status;
  
  if (stage === 'Cancelled') return 'cancelled';
  if (stage === 'Complete') return 'delivered';
  
  // In Progress - determine more specific status
  if (details.shipping === 'InProgress' || details.shipping === 'Complete') return 'shipped';
  if (details.inProduction === 'InProgress') return 'in_production';
  if (details.allocateProductionLocation === 'InProgress') return 'processing';
  if (details.downloadAssets === 'InProgress') return 'processing';
  
  return 'pending';
}

/**
 * Parse Prodigi callback event type
 */
export function parseCallbackType(type: string): {
  object: string;
  path: string[];
  newValue: string;
} {
  // Format: com.prodigi.order.status.stage.changed#InProgress
  const [pathPart, newValue] = type.split('#');
  const path = pathPart.replace('com.prodigi.', '').split('.');
  const object = path[0];
  
  return { object, path, newValue: newValue || '' };
}

/**
 * Convert Prodigi cost to number (BRL)
 */
export function convertProdigiCost(cost: ProdigiCost, toBRL = true): number {
  const amount = parseFloat(cost.amount);
  
  if (!toBRL) return amount;
  
  // Exchange rates (should ideally be fetched from an API)
  const rates: Record<string, number> = {
    'GBP': 6.30, // GBP to BRL
    'USD': 5.00, // USD to BRL
    'EUR': 5.50, // EUR to BRL
    'BRL': 1.00,
  };
  
  const rate = rates[cost.currency] || 1;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Calculate selling price with margin
 */
export function calculateSellingPrice(
  baseCostBRL: number,
  marginPercent: number = 45
): number {
  return Math.round(baseCostBRL * (1 + marginPercent / 100) * 100) / 100;
}

/**
 * Validate shipping to Brazil
 */
export function canShipToBrazil(variants: ProdigiProductVariant[]): boolean {
  return variants.some(v => v.shipsTo.includes('BR'));
}

// ========================
// PRODIGI PRODUCT CATALOG
// ========================

// Common Prodigi SKUs organized by category
export const PRODIGI_CATALOG = {
  canvas: [
    { sku: 'GLOBAL-CAN-10X10', name: 'Canvas 25x25cm', size: '10x10"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-12X12', name: 'Canvas 30x30cm', size: '12x12"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-16X16', name: 'Canvas 40x40cm', size: '16x16"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-20X20', name: 'Canvas 50x50cm', size: '20x20"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-8X10', name: 'Canvas 20x25cm', size: '8x10"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-11X14', name: 'Canvas 28x35cm', size: '11x14"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-12X16', name: 'Canvas 30x40cm', size: '12x16"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-16X20', name: 'Canvas 40x50cm', size: '16x20"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-18X24', name: 'Canvas 45x60cm', size: '18x24"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-20X30', name: 'Canvas 50x75cm', size: '20x30"', category: 'Wall Art' },
    { sku: 'GLOBAL-CAN-24X36', name: 'Canvas 60x90cm', size: '24x36"', category: 'Wall Art' },
  ],
  framedPrints: [
    { sku: 'GLOBAL-CFPM-8X10', name: 'Framed Print 20x25cm', size: '8x10"', category: 'Framed' },
    { sku: 'GLOBAL-CFPM-11X14', name: 'Framed Print 28x35cm', size: '11x14"', category: 'Framed' },
    { sku: 'GLOBAL-CFPM-12X16', name: 'Framed Print 30x40cm', size: '12x16"', category: 'Framed' },
    { sku: 'GLOBAL-CFPM-16X20', name: 'Framed Print 40x50cm', size: '16x20"', category: 'Framed' },
    { sku: 'GLOBAL-CFPM-18X24', name: 'Framed Print 45x60cm', size: '18x24"', category: 'Framed' },
    { sku: 'GLOBAL-CFPM-20X30', name: 'Framed Print 50x75cm', size: '20x30"', category: 'Framed' },
    { sku: 'GLOBAL-CFPM-24X36', name: 'Framed Print 60x90cm', size: '24x36"', category: 'Framed' },
  ],
  fineArtPrints: [
    { sku: 'GLOBAL-FAP-8X10', name: 'Fine Art Print 20x25cm', size: '8x10"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-10X10', name: 'Fine Art Print 25x25cm', size: '10x10"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-11X14', name: 'Fine Art Print 28x35cm', size: '11x14"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-12X12', name: 'Fine Art Print 30x30cm', size: '12x12"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-12X16', name: 'Fine Art Print 30x40cm', size: '12x16"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-16X20', name: 'Fine Art Print 40x50cm', size: '16x20"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-18X24', name: 'Fine Art Print 45x60cm', size: '18x24"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-20X30', name: 'Fine Art Print 50x75cm', size: '20x30"', category: 'Fine Art' },
    { sku: 'GLOBAL-FAP-24X36', name: 'Fine Art Print 60x90cm', size: '24x36"', category: 'Fine Art' },
  ],
  posters: [
    { sku: 'GLOBAL-HPR-8X10', name: 'Poster 20x25cm', size: '8x10"', category: 'Posters' },
    { sku: 'GLOBAL-HPR-11X14', name: 'Poster 28x35cm', size: '11x14"', category: 'Posters' },
    { sku: 'GLOBAL-HPR-12X16', name: 'Poster 30x40cm', size: '12x16"', category: 'Posters' },
    { sku: 'GLOBAL-HPR-16X20', name: 'Poster 40x50cm', size: '16x20"', category: 'Posters' },
    { sku: 'GLOBAL-HPR-18X24', name: 'Poster 45x60cm', size: '18x24"', category: 'Posters' },
    { sku: 'GLOBAL-HPR-24X36', name: 'Poster 60x90cm', size: '24x36"', category: 'Posters' },
  ],
  metalPrints: [
    { sku: 'GLOBAL-MET-8X10', name: 'Metal Print 20x25cm', size: '8x10"', category: 'Metal' },
    { sku: 'GLOBAL-MET-10X10', name: 'Metal Print 25x25cm', size: '10x10"', category: 'Metal' },
    { sku: 'GLOBAL-MET-12X12', name: 'Metal Print 30x30cm', size: '12x12"', category: 'Metal' },
    { sku: 'GLOBAL-MET-12X16', name: 'Metal Print 30x40cm', size: '12x16"', category: 'Metal' },
    { sku: 'GLOBAL-MET-16X16', name: 'Metal Print 40x40cm', size: '16x16"', category: 'Metal' },
    { sku: 'GLOBAL-MET-16X20', name: 'Metal Print 40x50cm', size: '16x20"', category: 'Metal' },
    { sku: 'GLOBAL-MET-18X24', name: 'Metal Print 45x60cm', size: '18x24"', category: 'Metal' },
    { sku: 'GLOBAL-MET-20X20', name: 'Metal Print 50x50cm', size: '20x20"', category: 'Metal' },
    { sku: 'GLOBAL-MET-20X30', name: 'Metal Print 50x75cm', size: '20x30"', category: 'Metal' },
    { sku: 'GLOBAL-MET-24X36', name: 'Metal Print 60x90cm', size: '24x36"', category: 'Metal' },
  ],
  acrylicPrints: [
    { sku: 'GLOBAL-ACRY-8X10', name: 'Acrylic Print 20x25cm', size: '8x10"', category: 'Acrylic' },
    { sku: 'GLOBAL-ACRY-10X10', name: 'Acrylic Print 25x25cm', size: '10x10"', category: 'Acrylic' },
    { sku: 'GLOBAL-ACRY-12X12', name: 'Acrylic Print 30x30cm', size: '12x12"', category: 'Acrylic' },
    { sku: 'GLOBAL-ACRY-12X16', name: 'Acrylic Print 30x40cm', size: '12x16"', category: 'Acrylic' },
    { sku: 'GLOBAL-ACRY-16X20', name: 'Acrylic Print 40x50cm', size: '16x20"', category: 'Acrylic' },
    { sku: 'GLOBAL-ACRY-18X24', name: 'Acrylic Print 45x60cm', size: '18x24"', category: 'Acrylic' },
    { sku: 'GLOBAL-ACRY-20X30', name: 'Acrylic Print 50x75cm', size: '20x30"', category: 'Acrylic' },
  ],
  phoneCases: [
    { sku: 'GLOBAL-TECH-IP15PM-SC-CP', name: 'iPhone 15 Pro Max Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP15P-SC-CP', name: 'iPhone 15 Pro Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP15-SC-CP', name: 'iPhone 15 Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP14PM-SC-CP', name: 'iPhone 14 Pro Max Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP14P-SC-CP', name: 'iPhone 14 Pro Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP14-SC-CP', name: 'iPhone 14 Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP13PM-SC-CP', name: 'iPhone 13 Pro Max Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP13P-SC-CP', name: 'iPhone 13 Pro Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-IP13-SC-CP', name: 'iPhone 13 Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-SAMS24U-SC-CP', name: 'Samsung S24 Ultra Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-SAMS24P-SC-CP', name: 'Samsung S24+ Case', size: 'Snap', category: 'Phone Cases' },
    { sku: 'GLOBAL-TECH-SAMS24-SC-CP', name: 'Samsung S24 Case', size: 'Snap', category: 'Phone Cases' },
  ],
  mugs: [
    { sku: 'GLOBAL-CER-11OZ', name: 'Ceramic Mug 11oz', size: '11oz', category: 'Mugs' },
    { sku: 'GLOBAL-CER-15OZ', name: 'Ceramic Mug 15oz', size: '15oz', category: 'Mugs' },
    { sku: 'GLOBAL-CER-MUG-ENAMEL', name: 'Enamel Mug', size: '12oz', category: 'Mugs' },
  ],
  greetingCards: [
    { sku: 'GLOBAL-GCB-A5', name: 'Greeting Card A5', size: 'A5', category: 'Cards' },
    { sku: 'GLOBAL-GCB-A6', name: 'Greeting Card A6', size: 'A6', category: 'Cards' },
    { sku: 'GLOBAL-GCB-SQ', name: 'Greeting Card Square', size: '5x5"', category: 'Cards' },
  ],
  calendars: [
    { sku: 'GLOBAL-WCCL-A3-LAND', name: 'Wall Calendar A3 Landscape', size: 'A3', category: 'Calendars' },
    { sku: 'GLOBAL-WCCL-A4-PORT', name: 'Wall Calendar A4 Portrait', size: 'A4', category: 'Calendars' },
  ],
  photobooks: [
    { sku: 'BOOK-A4-L-HARD-M', name: 'Photobook A4 Landscape Hardcover', size: 'A4', category: 'Books' },
    { sku: 'BOOK-A4-P-HARD-M', name: 'Photobook A4 Portrait Hardcover', size: 'A4', category: 'Books' },
    { sku: 'BOOK-A5-L-HARD-M', name: 'Photobook A5 Landscape Hardcover', size: 'A5', category: 'Books' },
    { sku: 'BOOK-A5-P-HARD-M', name: 'Photobook A5 Portrait Hardcover', size: 'A5', category: 'Books' },
    { sku: 'BOOK-8X8-HARD-M', name: 'Photobook 8x8" Hardcover', size: '8x8"', category: 'Books' },
  ],
};

// Get all SKUs as flat array
export function getAllProdigiSkus(): string[] {
  const allSkus: string[] = [];
  Object.values(PRODIGI_CATALOG).forEach(category => {
    category.forEach(product => allSkus.push(product.sku));
  });
  return allSkus;
}

// Search products in catalog
export function searchProdigiCatalog(query: string): typeof PRODIGI_CATALOG.canvas {
  const lowerQuery = query.toLowerCase();
  const results: typeof PRODIGI_CATALOG.canvas = [];
  
  Object.values(PRODIGI_CATALOG).forEach(category => {
    category.forEach(product => {
      if (
        product.sku.toLowerCase().includes(lowerQuery) ||
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery)
      ) {
        results.push(product);
      }
    });
  });
  
  return results;
}

// Get products by category
export function getProdigiProductsByCategory(
  category: keyof typeof PRODIGI_CATALOG
): typeof PRODIGI_CATALOG.canvas {
  return PRODIGI_CATALOG[category] || [];
}

// ========================
// ORDER HELPERS
// ========================

/**
 * Build a complete order request for Prodigi
 */
export function buildProdigiOrder(params: {
  merchantReference: string;
  recipient: ProdigiRecipient;
  items: {
    sku: string;
    imageUrl: string;
    copies?: number;
    attributes?: Record<string, string>;
    customerPrice?: number;
    customerCurrency?: string;
  }[];
  shippingMethod?: ProdigiShippingMethod;
  callbackUrl?: string;
  branding?: ProdigiBranding;
  metadata?: Record<string, unknown>;
}): ProdigiCreateOrderRequest {
  const {
    merchantReference,
    recipient,
    items,
    shippingMethod = 'Standard',
    callbackUrl,
    branding,
    metadata,
  } = params;

  const orderItems: ProdigiOrderItem[] = items.map((item, index) => ({
    merchantReference: `${merchantReference}-item-${index + 1}`,
    sku: item.sku,
    copies: item.copies || 1,
    sizing: 'fillPrintArea',
    attributes: item.attributes || {},
    assets: [
      {
        printArea: 'default',
        url: item.imageUrl,
      },
    ],
    recipientCost: item.customerPrice
      ? {
          amount: item.customerPrice.toFixed(2),
          currency: item.customerCurrency || 'BRL',
        }
      : undefined,
  }));

  return {
    merchantReference,
    shippingMethod,
    idempotencyKey: generateIdempotencyKey(),
    callbackUrl,
    recipient,
    branding,
    items: orderItems,
    metadata: {
      ...metadata,
      source: 'fayapoint',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Calculate estimated delivery date
 */
export function calculateEstimatedDelivery(
  shippingMethod: ProdigiShippingMethod,
  destinationCountryCode: string
): { minDays: number; maxDays: number } {
  // Production time: 2-5 business days
  const productionDays = { min: 2, max: 5 };
  
  // Shipping time based on method and destination
  const shippingTimes: Record<ProdigiShippingMethod, Record<string, { min: number; max: number }>> = {
    'Budget': {
      'BR': { min: 15, max: 30 },
      'US': { min: 10, max: 20 },
      'GB': { min: 5, max: 10 },
      'default': { min: 12, max: 25 },
    },
    'Standard': {
      'BR': { min: 10, max: 20 },
      'US': { min: 5, max: 12 },
      'GB': { min: 3, max: 7 },
      'default': { min: 8, max: 18 },
    },
    'StandardPlus': {
      'BR': { min: 7, max: 15 },
      'US': { min: 4, max: 8 },
      'GB': { min: 2, max: 5 },
      'default': { min: 5, max: 12 },
    },
    'Express': {
      'BR': { min: 5, max: 10 },
      'US': { min: 2, max: 5 },
      'GB': { min: 1, max: 3 },
      'default': { min: 3, max: 7 },
    },
    'Overnight': {
      'BR': { min: 3, max: 7 },
      'US': { min: 1, max: 2 },
      'GB': { min: 1, max: 1 },
      'default': { min: 2, max: 5 },
    },
  };
  
  const shipping = shippingTimes[shippingMethod]?.[destinationCountryCode] 
    || shippingTimes[shippingMethod]?.['default'] 
    || { min: 10, max: 20 };
  
  return {
    minDays: productionDays.min + shipping.min,
    maxDays: productionDays.max + shipping.max,
  };
}

export default {
  createOrder,
  getOrder,
  getOrders,
  cancelOrder,
  updateShippingMethod,
  updateRecipient,
  createQuote,
  getQuotesAllMethods,
  getProductDetails,
  PRODIGI_CATALOG,
  getAllProdigiSkus,
  searchProdigiCatalog,
  getProdigiProductsByCategory,
  buildProdigiOrder,
  calculateEstimatedDelivery,
  convertProdigiCost,
  calculateSellingPrice,
  mapProdigiStatus,
  parseCallbackType,
  generateIdempotencyKey,
};
