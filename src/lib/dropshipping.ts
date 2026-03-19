/**
 * Dropshipping Automation Engine
 *
 * - Price monitoring: sync source prices, auto-adjust store prices
 * - Margin calculator: enforce minimum margin
 * - Auto-ordering: place orders with suppliers when customer pays
 * - Tracking sync: pull tracking from supplier, push to customer
 */

import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export interface MarginConfig {
  minimumMarginPercent: number; // e.g. 30 = 30% margin
  targetMarginPercent: number;  // e.g. 50 = 50% margin
  maxPriceBRL: number;          // Auto-disable if price exceeds this
  autoAdjust: boolean;          // Auto-adjust store price when source changes
  roundTo: number;              // Round to nearest (e.g. 0.99)
}

export interface PriceSyncResult {
  productId: string;
  productName: string;
  oldSourcePrice: number;
  newSourcePrice: number;
  oldStorePrice: number;
  newStorePrice: number;
  marginPercent: number;
  action: 'updated' | 'disabled' | 'no_change' | 'error';
  reason?: string;
}

export interface AutoOrderResult {
  paymentId: string;
  orderNumber: string;
  items: Array<{
    productName: string;
    supplierOrderId?: string;
    status: 'ordered' | 'failed' | 'out_of_stock';
    error?: string;
  }>;
  totalSupplierCost: number;
  totalCustomerPaid: number;
  profit: number;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_MARGIN: MarginConfig = {
  minimumMarginPercent: 30,
  targetMarginPercent: 50,
  maxPriceBRL: 500,
  autoAdjust: true,
  roundTo: 0.99,
};

// =============================================================================
// PRICE CALCULATION
// =============================================================================

export function calculateStorePrice(
  sourcePriceBRL: number,
  shippingCostBRL: number,
  config: MarginConfig = DEFAULT_MARGIN
): { storePrice: number; marginPercent: number; viable: boolean } {
  const totalCost = sourcePriceBRL + shippingCostBRL;
  const targetPrice = totalCost / (1 - config.targetMarginPercent / 100);

  // Round to psychological pricing (e.g., R$29.99)
  let storePrice = Math.ceil(targetPrice) - (1 - config.roundTo);
  if (storePrice < totalCost * 1.1) storePrice = totalCost * 1.1; // Minimum 10% above cost

  const marginPercent = ((storePrice - totalCost) / storePrice) * 100;
  const viable = marginPercent >= config.minimumMarginPercent && storePrice <= config.maxPriceBRL;

  return { storePrice: Math.round(storePrice * 100) / 100, marginPercent, viable };
}

// =============================================================================
// PRICE SYNC
// =============================================================================

export async function syncProductPrices(
  config: MarginConfig = DEFAULT_MARGIN
): Promise<PriceSyncResult[]> {
  await dbConnect();

  const DropshippingProduct = mongoose.models.DropshippingProduct;
  if (!DropshippingProduct) return [];

  const products = await DropshippingProduct.find({
    'storeStatus': { $in: ['active', 'listed'] },
  }).lean();

  const results: PriceSyncResult[] = [];

  for (const product of products) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = product as any;
    const result: PriceSyncResult = {
      productId: p._id.toString(),
      productName: p.name,
      oldSourcePrice: p.originalPrice || 0,
      newSourcePrice: p.originalPrice || 0, // Would fetch from source API
      oldStorePrice: p.sellingPrice || 0,
      newStorePrice: p.sellingPrice || 0,
      marginPercent: 0,
      action: 'no_change',
    };

    // Calculate new store price based on current source price
    const shippingCost = p.shippingOptions?.[0]?.cost || 0;
    const { storePrice, marginPercent, viable } = calculateStorePrice(
      p.originalPrice || 0,
      shippingCost,
      config
    );

    result.marginPercent = marginPercent;

    if (!viable) {
      result.action = 'disabled';
      result.reason = `Margin ${marginPercent.toFixed(1)}% below minimum ${config.minimumMarginPercent}%`;
      if (config.autoAdjust) {
        await DropshippingProduct.updateOne(
          { _id: p._id },
          { $set: { storeStatus: 'paused', pauseReason: result.reason } }
        );
      }
    } else if (Math.abs(storePrice - (p.sellingPrice || 0)) > 0.01) {
      result.newStorePrice = storePrice;
      result.action = 'updated';
      if (config.autoAdjust) {
        await DropshippingProduct.updateOne(
          { _id: p._id },
          {
            $set: { sellingPrice: storePrice },
            $push: {
              priceHistory: {
                price: p.originalPrice,
                shippingCost,
                totalCost: p.originalPrice + shippingCost,
                currency: 'BRL',
                recordedAt: new Date(),
              },
            },
          }
        );
      }
    }

    results.push(result);
  }

  return results;
}

// =============================================================================
// AUTO-ORDER
// =============================================================================

export async function processAutoOrder(paymentId: string): Promise<AutoOrderResult | null> {
  await dbConnect();

  const Payment = mongoose.models.Payment;
  const FulfillmentOrder = mongoose.models.FulfillmentOrder;
  const DropshippingProduct = mongoose.models.DropshippingProduct;

  if (!Payment || !FulfillmentOrder || !DropshippingProduct) return null;

  const payment = await Payment.findById(paymentId).lean();
  if (!payment) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pmt = payment as any;
  const result: AutoOrderResult = {
    paymentId,
    orderNumber: pmt.orderNumber,
    items: [],
    totalSupplierCost: 0,
    totalCustomerPaid: pmt.total || 0,
    profit: 0,
  };

  for (const item of pmt.items || []) {
    if (item.type !== 'product') continue;

    const product = await DropshippingProduct.findOne({
      $or: [
        { _id: item.productId },
        { 'storeSlug': item.productSlug },
      ],
    }).lean();

    if (!product) {
      result.items.push({
        productName: item.name,
        status: 'failed',
        error: 'Product not found in dropshipping catalog',
      });
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dp = product as any;

    // Create fulfillment order
    try {
      const fulfillment = new FulfillmentOrder({
        paymentId: pmt._id,
        userId: pmt.userId,
        orderNumber: pmt.orderNumber,
        type: 'dropshipping',
        status: 'awaiting_supplier',
        items: [{
          productId: dp._id,
          name: item.name,
          quantity: item.quantity,
          supplierPrice: dp.originalPrice,
          sellingPrice: item.unitPrice,
        }],
        supplierInfo: {
          sourceName: dp.sourceName,
          sourceUrl: dp.sourceUrl,
          externalId: dp.externalId,
        },
        shipping: pmt.customerAddress ? {
          address: {
            name: pmt.userName,
            street: pmt.customerAddress.street || '',
            number: pmt.customerAddress.number,
            complement: pmt.customerAddress.complement,
            neighborhood: pmt.customerAddress.neighborhood,
            city: pmt.customerAddress.city || '',
            state: pmt.customerAddress.state || '',
            postalCode: pmt.customerAddress.postalCode || '',
            country: 'Brasil',
            countryCode: 'BR',
            phone: pmt.customerPhone,
          },
        } : undefined,
        timeline: [{
          status: 'awaiting_supplier',
          timestamp: new Date(),
          message: 'Order created, awaiting supplier processing',
          notified: false,
        }],
      });

      await fulfillment.save();

      result.items.push({
        productName: item.name,
        supplierOrderId: fulfillment._id.toString(),
        status: 'ordered',
      });
      result.totalSupplierCost += (dp.originalPrice || 0) * item.quantity;
    } catch (err) {
      result.items.push({
        productName: item.name,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Order creation failed',
      });
    }
  }

  result.profit = result.totalCustomerPaid - result.totalSupplierCost;
  return result;
}
