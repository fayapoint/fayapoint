import mongoose from 'mongoose';
import Receipt, { getPaymentMethodLabel, IReceiptItem } from '@/models/Receipt';
import Payment from '@/models/Payment';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

interface GenerateReceiptOptions {
  paymentId?: string;
  subscriptionId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderNumber?: string;
  asaasPaymentId?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    type: 'course' | 'subscription' | 'service' | 'product';
    slug?: string;
    lifetimeAccess?: boolean;
    certificateIncluded?: boolean;
  }>;
  paymentMethod: 'pix' | 'boleto' | 'credit_card' | 'mercadopago';
  discount?: number;
  planName?: string;
  planCycle?: 'monthly' | 'yearly';
  paidAt?: Date;
}

/**
 * Generate a receipt for a completed payment.
 * Called from webhook after payment confirmation.
 */
export async function generateReceipt(options: GenerateReceiptOptions) {
  await dbConnect();

  // Check for duplicate receipt
  if (options.asaasPaymentId) {
    const existing = await Receipt.findOne({ asaasPaymentId: options.asaasPaymentId });
    if (existing) {
      console.log(`[Receipt] Already exists for payment ${options.asaasPaymentId}: ${existing.receiptNumber}`);
      return existing;
    }
  }

  const items: IReceiptItem[] = options.items.map(item => ({
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.unitPrice * item.quantity,
    type: item.type,
    slug: item.slug,
    lifetimeAccess: item.lifetimeAccess ?? (item.type === 'course'),
    certificateIncluded: item.certificateIncluded ?? (item.type === 'course'),
  }));

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = options.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const receipt = new Receipt({
    userId: new mongoose.Types.ObjectId(options.userId),
    userEmail: options.userEmail,
    userName: options.userName,
    paymentId: options.paymentId ? new mongoose.Types.ObjectId(options.paymentId) : undefined,
    subscriptionId: options.subscriptionId ? new mongoose.Types.ObjectId(options.subscriptionId) : undefined,
    orderNumber: options.orderNumber,
    asaasPaymentId: options.asaasPaymentId,
    items,
    subtotal,
    discount,
    total,
    paymentMethod: options.paymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(options.paymentMethod),
    paidAt: options.paidAt || new Date(),
    planName: options.planName,
    planCycle: options.planCycle,
    status: 'issued',
  });

  await receipt.save();
  console.log(`[Receipt] Generated ${receipt.receiptNumber} for ${options.userEmail} — R$${total.toFixed(2)}`);
  return receipt;
}

/**
 * Generate receipt from a Payment document (for course purchases).
 */
export async function generateReceiptFromPayment(paymentId: string) {
  await dbConnect();
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error(`Payment ${paymentId} not found`);

  const user = await User.findById(payment.userId);
  if (!user) throw new Error(`User ${payment.userId} not found`);

  const items = payment.items?.map((item: { name: string; description?: string; quantity: number; unitPrice: number; totalPrice: number; type: string; productSlug?: string }) => ({
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    type: item.type as 'course' | 'subscription' | 'service' | 'product',
    slug: item.productSlug,
    lifetimeAccess: item.type === 'course',
    certificateIncluded: item.type === 'course',
  })) || [{
    name: (payment as unknown as Record<string, string>).description || 'Pagamento FayAi',
    quantity: 1,
    unitPrice: payment.total,
    type: 'course' as const,
    lifetimeAccess: true,
    certificateIncluded: true,
  }];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentAny = payment as any;

  return generateReceipt({
    paymentId: String(payment._id),
    userId: String(payment.userId),
    userEmail: payment.userEmail,
    userName: user.name || payment.userEmail,
    orderNumber: payment.orderNumber,
    asaasPaymentId: paymentAny.asaasPaymentId || paymentAny.providerPaymentId,
    items,
    paymentMethod: (payment.method === 'undefined' ? 'pix' : payment.method) as 'pix' | 'boleto' | 'credit_card' | 'mercadopago',
    discount: payment.discount || 0,
    paidAt: payment.paidAt || payment.updatedAt || new Date(),
  });
}

/**
 * Generate receipt for a subscription payment.
 */
export async function generateReceiptFromSubscription(opts: {
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionId: string;
  asaasPaymentId: string;
  planName: string;
  planSlug: string;
  planCycle: 'monthly' | 'yearly';
  value: number;
  paymentMethod: 'pix' | 'boleto' | 'credit_card' | 'mercadopago';
  paidAt?: Date;
}) {
  return generateReceipt({
    subscriptionId: opts.subscriptionId,
    userId: opts.userId,
    userEmail: opts.userEmail,
    userName: opts.userName,
    asaasPaymentId: opts.asaasPaymentId,
    items: [{
      name: `Plano ${opts.planName} — FayAi Academia de IA`,
      description: `Assinatura ${opts.planCycle === 'yearly' ? 'anual' : 'mensal'} do plano ${opts.planName}`,
      quantity: 1,
      unitPrice: opts.value,
      type: 'subscription',
      slug: opts.planSlug,
    }],
    paymentMethod: opts.paymentMethod,
    planName: opts.planName,
    planCycle: opts.planCycle,
    paidAt: opts.paidAt,
  });
}
