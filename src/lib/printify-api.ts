/**
 * Printify API Integration
 * Documentation: https://developers.printify.com/
 */

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';

// Get API key from environment
function getApiKey(): string {
  const apiKey = process.env.Printify_API;
  if (!apiKey) {
    throw new Error('Printify_API not found in environment variables');
  }
  return apiKey;
}

// Base request function
async function printifyRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'FayAi-POD/1.0',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Printify API Error [${response.status}]:`, errorText);
    throw new Error(`Printify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============== TYPES ==============

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintifyPrintProvider {
  id: number;
  title: string;
  location: {
    address1: string;
    address2: string;
    city: string;
    country: string;
    region: string;
    zip: string;
  };
}

export interface PrintifyVariant {
  id: number;
  title: string;
  options: Record<string, string>;
  placeholders: {
    position: string;
    height: number;
    width: number;
  }[];
  // Pricing info (in cents USD)
  price?: number;
  cost?: number;
  is_available?: boolean;
  is_default?: boolean;
}

export interface PrintifyShippingInfo {
  handling_time: {
    value: number;
    unit: string;
  };
  profiles: {
    variant_ids: number[];
    first_item: { cost: number; currency: string };
    additional_items: { cost: number; currency: string };
    countries: string[];
  }[];
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: { name: string; type: string; values: { id: number; title: string }[] }[];
  variants: {
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    options: number[];
  }[];
  images: { src: string; variant_ids: number[]; position: string; is_default: boolean }[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: {
    variant_ids: number[];
    placeholders: { position: string; images: { id: string; name: string; type: string; height: number; width: number; x: number; y: number; scale: number; angle: number }[] }[];
  }[];
  sales_channel_properties: unknown[];
}

export interface PrintifyOrder {
  id: string;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
  line_items: {
    product_id: string;
    variant_id: number;
    quantity: number;
    print_provider_id: number;
    blueprint_id: number;
    sku: string;
    cost: number;
    shipping_cost: number;
    status: string;
    metadata: { title: string; price: number; variant_label: string; sku: string; country: string };
    sent_to_production_at?: string;
    fulfilled_at?: string;
  }[];
  metadata: { order_type: string; shop_order_id: string; shop_order_label: string; shop_fulfilled_at?: string };
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  shipments: { carrier: string; number: string; url: string; delivered_at?: string }[];
  created_at: string;
  sent_to_production_at?: string;
  fulfilled_at?: string;
}

export interface CreateOrderInput {
  external_id: string;
  label: string;
  line_items: {
    product_id: string;
    variant_id: number;
    quantity: number;
  }[];
  shipping_method: number;
  is_printify_express?: boolean;
  send_shipping_notification?: boolean;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

// ============== SHOP ENDPOINTS ==============

/**
 * Get all shops associated with the account
 */
export async function getShops(): Promise<PrintifyShop[]> {
  return printifyRequest<PrintifyShop[]>('/shops.json');
}

/**
 * Disconnect a shop
 */
export async function disconnectShop(shopId: number): Promise<void> {
  await printifyRequest(`/shops/${shopId}/connection.json`, {
    method: 'DELETE',
  });
}

// ============== CATALOG ENDPOINTS ==============

/**
 * Get all available blueprints (product templates)
 */
export async function getBlueprints(): Promise<PrintifyBlueprint[]> {
  return printifyRequest<PrintifyBlueprint[]>('/catalog/blueprints.json');
}

/**
 * Get a specific blueprint
 */
export async function getBlueprint(blueprintId: number): Promise<PrintifyBlueprint> {
  return printifyRequest<PrintifyBlueprint>(`/catalog/blueprints/${blueprintId}.json`);
}

/**
 * Get print providers for a blueprint
 */
export async function getBlueprintPrintProviders(blueprintId: number): Promise<PrintifyPrintProvider[]> {
  return printifyRequest<PrintifyPrintProvider[]>(`/catalog/blueprints/${blueprintId}/print_providers.json`);
}

/**
 * Get variants for a blueprint + print provider combination
 */
export async function getBlueprintVariants(blueprintId: number, printProviderId: number): Promise<{ id: number; variants: PrintifyVariant[] }> {
  return printifyRequest<{ id: number; variants: PrintifyVariant[] }>(
    `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
  );
}

/**
 * Get shipping info for a blueprint + print provider
 */
export async function getBlueprintShipping(blueprintId: number, printProviderId: number): Promise<PrintifyShippingInfo> {
  return printifyRequest<PrintifyShippingInfo>(
    `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/shipping.json`
  );
}

// ============== PRODUCT ENDPOINTS ==============

/**
 * Get all products for a shop
 */
export async function getProducts(shopId: number, page = 1, limit = 100): Promise<{ current_page: number; data: PrintifyProduct[]; last_page: number; total: number }> {
  return printifyRequest<{ current_page: number; data: PrintifyProduct[]; last_page: number; total: number }>(
    `/shops/${shopId}/products.json?page=${page}&limit=${limit}`
  );
}

/**
 * Get a specific product
 */
export async function getProduct(shopId: number, productId: string): Promise<PrintifyProduct> {
  return printifyRequest<PrintifyProduct>(`/shops/${shopId}/products/${productId}.json`);
}

/**
 * Image layer for print areas
 */
export interface PrintifyImageLayer {
  id: string;       // Upload ID from Printify
  x: number;        // Horizontal position (0.0 to 1.0, 0.5 = center)
  y: number;        // Vertical position (0.0 to 1.0, 0.5 = center)
  scale: number;    // Scale factor (1.0 = original size relative to print area)
  angle: number;    // Rotation in degrees
}

/**
 * Print area placeholder (position like front, back, sleeve, etc.)
 */
export interface PrintifyPlaceholder {
  position: string; // 'front', 'back', 'left_sleeve', 'right_sleeve', 'neck_label', etc.
  images: PrintifyImageLayer[]; // Up to 20 layers per position
}

/**
 * Print area configuration
 */
export interface PrintifyPrintArea {
  variant_ids: number[];
  placeholders: PrintifyPlaceholder[];
}

/**
 * Product creation options
 */
export interface CreateProductOptions {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: { id: number; price: number; is_enabled: boolean }[];
  print_areas: PrintifyPrintArea[];
  tags?: string[];
}

/**
 * Create a new product
 * Supports multiple print areas (front, back, sleeves, etc.) and multiple layers per area (up to 20)
 */
export async function createProduct(
  shopId: number,
  product: CreateProductOptions
): Promise<PrintifyProduct> {
  return printifyRequest<PrintifyProduct>(`/shops/${shopId}/products.json`, {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

/**
 * Available print positions by product type
 */
export const PRINT_POSITIONS = {
  // Apparel (t-shirts, hoodies, etc.)
  apparel: ['front', 'back', 'left_sleeve', 'right_sleeve', 'neck_label'],
  // Mugs and drinkware
  mug: ['front', 'back', 'wrap'],
  // Wall art (posters, canvas)
  poster: ['front'],
  canvas: ['front'],
  // Phone cases
  phone_case: ['front', 'back'],
  // Pillows
  pillow: ['front', 'back'],
  // Bags
  tote_bag: ['front', 'back'],
  // All-over print (special)
  allover: ['front', 'back', 'sleeve'],
};

/**
 * Get available print positions for a blueprint
 */
export async function getBlueprintPrintPositions(blueprintId: number, printProviderId: number): Promise<string[]> {
  try {
    const variantsData = await getBlueprintVariants(blueprintId, printProviderId);
    const positions = new Set<string>();
    
    variantsData.variants.forEach(variant => {
      variant.placeholders?.forEach(placeholder => {
        positions.add(placeholder.position);
      });
    });
    
    return Array.from(positions);
  } catch (error) {
    console.error('Failed to get print positions:', error);
    return ['front']; // Default fallback
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  shopId: number,
  productId: string,
  updates: Partial<{
    title: string;
    description: string;
    tags: string[];
    variants: { id: number; price: number; is_enabled: boolean }[];
  }>
): Promise<PrintifyProduct> {
  return printifyRequest<PrintifyProduct>(`/shops/${shopId}/products/${productId}.json`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a product
 */
export async function deleteProduct(shopId: number, productId: string): Promise<void> {
  await printifyRequest(`/shops/${shopId}/products/${productId}.json`, {
    method: 'DELETE',
  });
}

/**
 * Publish a product to the sales channel
 */
export async function publishProduct(
  shopId: number,
  productId: string,
  options: {
    title?: boolean;
    description?: boolean;
    images?: boolean;
    variants?: boolean;
    tags?: boolean;
    keyFeatures?: boolean;
    shipping_template?: boolean;
  } = {}
): Promise<void> {
  await printifyRequest(`/shops/${shopId}/products/${productId}/publish.json`, {
    method: 'POST',
    body: JSON.stringify({
      title: options.title ?? true,
      description: options.description ?? true,
      images: options.images ?? true,
      variants: options.variants ?? true,
      tags: options.tags ?? true,
      keyFeatures: options.keyFeatures ?? true,
      shipping_template: options.shipping_template ?? true,
    }),
  });
}

// ============== ORDER ENDPOINTS ==============

/**
 * Get all orders for a shop
 */
export async function getOrders(shopId: number, page = 1, limit = 100): Promise<{ current_page: number; data: PrintifyOrder[]; last_page: number; total: number }> {
  return printifyRequest<{ current_page: number; data: PrintifyOrder[]; last_page: number; total: number }>(
    `/shops/${shopId}/orders.json?page=${page}&limit=${limit}`
  );
}

/**
 * Get a specific order
 */
export async function getOrder(shopId: number, orderId: string): Promise<PrintifyOrder> {
  return printifyRequest<PrintifyOrder>(`/shops/${shopId}/orders/${orderId}.json`);
}

/**
 * Create a new order
 */
export async function createOrder(shopId: number, order: CreateOrderInput): Promise<PrintifyOrder> {
  return printifyRequest<PrintifyOrder>(`/shops/${shopId}/orders.json`, {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

/**
 * Send order to production
 */
export async function sendOrderToProduction(shopId: number, orderId: string): Promise<PrintifyOrder> {
  return printifyRequest<PrintifyOrder>(`/shops/${shopId}/orders/${orderId}/send_to_production.json`, {
    method: 'POST',
  });
}

/**
 * Calculate shipping costs for an order
 */
export async function calculateShipping(
  shopId: number,
  lineItems: { product_id: string; variant_id: number; quantity: number }[],
  addressTo: { country: string; region: string; zip: string }
): Promise<{ standard: number; express: number; priority: number; economy: number }> {
  return printifyRequest<{ standard: number; express: number; priority: number; economy: number }>(
    `/shops/${shopId}/orders/shipping.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        line_items: lineItems,
        address_to: addressTo,
      }),
    }
  );
}

/**
 * Cancel an order
 */
export async function cancelOrder(shopId: number, orderId: string): Promise<PrintifyOrder> {
  return printifyRequest<PrintifyOrder>(`/shops/${shopId}/orders/${orderId}/cancel.json`, {
    method: 'POST',
  });
}

// ============== UPLOAD ENDPOINTS ==============

export interface PrintifyUpload {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}

/**
 * Get all uploads
 */
export async function getUploads(page = 1, limit = 100): Promise<{ current_page: number; data: PrintifyUpload[]; last_page: number }> {
  return printifyRequest<{ current_page: number; data: PrintifyUpload[]; last_page: number }>(
    `/uploads.json?page=${page}&limit=${limit}`
  );
}

/**
 * Upload an image by URL
 */
export async function uploadImageByUrl(fileName: string, imageUrl: string): Promise<PrintifyUpload> {
  return printifyRequest<PrintifyUpload>('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({
      file_name: fileName,
      url: imageUrl,
    }),
  });
}

/**
 * Upload an image by Base64
 */
export async function uploadImageByBase64(fileName: string, base64Data: string): Promise<PrintifyUpload> {
  return printifyRequest<PrintifyUpload>('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({
      file_name: fileName,
      contents: base64Data,
    }),
  });
}

/**
 * Archive an upload
 */
export async function archiveUpload(uploadId: string): Promise<void> {
  await printifyRequest(`/uploads/${uploadId}.json`, {
    method: 'POST',
    body: JSON.stringify({ archived: true }),
  });
}

// ============== WEBHOOK ENDPOINTS ==============

export interface PrintifyWebhook {
  id: string;
  topic: string;
  url: string;
  shop_id: string;
  secret: string;
}

/**
 * Get all webhooks for a shop
 */
export async function getWebhooks(shopId: number): Promise<PrintifyWebhook[]> {
  return printifyRequest<PrintifyWebhook[]>(`/shops/${shopId}/webhooks.json`);
}

/**
 * Create a webhook
 */
export async function createWebhook(
  shopId: number,
  topic: 'order:created' | 'order:updated' | 'order:sent-to-production' | 'order:shipment:created' | 'order:shipment:delivered' | 'product:deleted' | 'product:publish:started',
  url: string
): Promise<PrintifyWebhook> {
  return printifyRequest<PrintifyWebhook>(`/shops/${shopId}/webhooks.json`, {
    method: 'POST',
    body: JSON.stringify({ topic, url }),
  });
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(shopId: number, webhookId: string): Promise<void> {
  await printifyRequest(`/shops/${shopId}/webhooks/${webhookId}.json`, {
    method: 'DELETE',
  });
}

// ============== HELPER FUNCTIONS ==============

/**
 * Convert Printify price (in cents) to currency
 */
export function formatPrintifyPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Convert BRL to USD (approximate)
 */
export function brlToUsd(brl: number, rate = 0.20): number {
  return Math.round(brl * rate * 100); // Returns cents
}

/**
 * Calculate selling price with margin
 */
export function calculateSellingPrice(baseCostCents: number, marginPercent: number): number {
  return Math.round(baseCostCents * (1 + marginPercent / 100));
}

// ============== FULFILLMENT HELPERS ==============

let cachedShopId: number | null = null;

/**
 * Get the first available shop ID (cached)
 */
export async function getPrintifyShopId(): Promise<number> {
  if (cachedShopId) return cachedShopId;
  
  const shops = await getShops();
  if (shops.length === 0) {
    throw new Error('No Printify shops found');
  }
  
  cachedShopId = shops[0].id;
  return cachedShopId;
}

/**
 * Create a Printify order (wrapper for fulfillment)
 */
export async function createPrintifyOrder(
  shopId: number,
  orderData: CreateOrderInput
): Promise<PrintifyOrder> {
  const order = await createOrder(shopId, orderData);
  
  // Automatically send to production
  try {
    await sendOrderToProduction(shopId, order.id);
  } catch (error) {
    console.error('[Printify] Failed to send to production:', error);
    // Order still created, will be sent manually
  }
  
  return order;
}

/**
 * Map Printify order status to internal status
 */
export function mapPrintifyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'on-hold': 'processing',
    'in-production': 'in_production',
    'fulfilled': 'shipped',
    'shipped': 'shipped',
    'canceled': 'cancelled',
    'payment-not-received': 'failed',
  };
  
  return statusMap[status.toLowerCase()] || 'processing';
}

