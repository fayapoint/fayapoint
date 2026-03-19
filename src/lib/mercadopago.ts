/**
 * Mercado Pago Payment Gateway Integration
 * SDK Docs: https://github.com/mercadopago/sdk-nodejs
 * API Docs: https://www.mercadopago.com.br/developers/en/reference
 *
 * Supports: PIX, Boleto, Credit Card (with installments)
 */

import { MercadoPagoConfig, Payment as MPPayment, Preference, PaymentRefund } from 'mercadopago';
import type { PaymentMethod, PaymentStatus } from '@/models/Payment';

// =============================================================================
// CONFIG
// =============================================================================

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

export const mpConfig = {
  isConfigured: !!accessToken,
  isSandbox: accessToken.startsWith('TEST-'),
};

function getClient() {
  if (!accessToken) throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
  return new MercadoPagoConfig({ accessToken });
}

// =============================================================================
// TYPES
// =============================================================================

export type MPPaymentMethod = 'pix' | 'boleto' | 'credit_card';

export interface MPPixResponse {
  qrCodeBase64: string;
  qrCodePayload: string;
  expirationDate: Date;
}

export interface MPBoletoResponse {
  barCode: string;
  digitableLine: string;
  bankSlipUrl: string;
  dueDate: Date;
}

export interface MPCreditCardData {
  token: string; // Card token from SDK frontend
  installments: number;
  issuerId: string;
  paymentMethodId: string; // visa, mastercard, etc.
}

export interface MPPayerInfo {
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
  phone?: string;
  address?: {
    zipCode: string;
    street: string;
    number: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
}

export interface MPCreatePaymentOptions {
  description: string;
  externalReference: string;
  notificationUrl?: string;
  method: MPPaymentMethod;
  payer: MPPayerInfo;
  creditCard?: MPCreditCardData;
}

export interface MPPaymentResponse {
  id: number;
  status: string;
  statusDetail: string;
  paymentMethodId: string;
  transactionAmount: number;
  installments: number;
  pixData?: MPPixResponse;
  boletoData?: MPBoletoResponse;
  creditCardData?: {
    lastFourDigits: string;
    brand: string;
    holderName: string;
    installments: number;
    installmentValue: number;
  };
}

// =============================================================================
// PAYMENT CREATION
// =============================================================================

export async function createMPPayment(
  amount: number,
  options: MPCreatePaymentOptions
): Promise<MPPaymentResponse> {
  const client = getClient();
  const payment = new MPPayment(client);

  const webhookUrl = options.notificationUrl ||
    `${process.env.NEXTAUTH_URL || 'https://fayai.shop'}/api/payments/webhook/mercadopago`;

  const nameParts = options.payer.firstName
    ? { first_name: options.payer.firstName, last_name: options.payer.lastName }
    : (() => {
        const parts = (options.payer.firstName || '').split(' ');
        return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' };
      })();

  // Build base payment body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    transaction_amount: amount,
    description: options.description,
    external_reference: options.externalReference,
    notification_url: webhookUrl,
    payer: {
      email: options.payer.email,
      first_name: nameParts.first_name,
      last_name: nameParts.last_name,
      identification: {
        type: 'CPF',
        number: options.payer.cpf.replace(/\D/g, ''),
      },
    },
  };

  // Set payment method specific fields
  switch (options.method) {
    case 'pix':
      body.payment_method_id = 'pix';
      break;

    case 'boleto':
      body.payment_method_id = 'bolbradesco';
      body.date_of_expiration = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString();
      break;

    case 'credit_card':
      if (!options.creditCard) throw new Error('Credit card data required');
      body.token = options.creditCard.token;
      body.installments = options.creditCard.installments || 1;
      body.issuer_id = options.creditCard.issuerId;
      body.payment_method_id = options.creditCard.paymentMethodId;
      break;
  }

  // Add address if available
  if (options.payer.address) {
    body.payer.address = {
      zip_code: options.payer.address.zipCode,
      street_name: options.payer.address.street,
      street_number: options.payer.address.number,
      neighborhood: options.payer.address.neighborhood,
      city: options.payer.address.city,
      federal_unit: options.payer.address.state,
    };
  }

  const result = await payment.create({ body });

  // Build response
  const response: MPPaymentResponse = {
    id: result.id!,
    status: result.status!,
    statusDetail: result.status_detail!,
    paymentMethodId: result.payment_method_id!,
    transactionAmount: result.transaction_amount!,
    installments: result.installments || 1,
  };

  // Extract PIX data
  if (options.method === 'pix' && result.point_of_interaction?.transaction_data) {
    const txData = result.point_of_interaction.transaction_data;
    response.pixData = {
      qrCodeBase64: txData.qr_code_base64 || '',
      qrCodePayload: txData.qr_code || '',
      expirationDate: new Date(result.date_of_expiration || Date.now() + 30 * 60 * 1000),
    };
  }

  // Extract boleto data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultAny = result as any;
  if (options.method === 'boleto' && (resultAny.barcode || resultAny.transaction_details)) {
    response.boletoData = {
      barCode: resultAny.barcode?.content || '',
      digitableLine: resultAny.digitable_line || '',
      bankSlipUrl: result.transaction_details?.external_resource_url || '',
      dueDate: new Date(result.date_of_expiration || Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
  }

  // Extract credit card data
  if (options.method === 'credit_card' && result.card) {
    response.creditCardData = {
      lastFourDigits: result.card.last_four_digits || '',
      brand: result.payment_method_id || '',
      holderName: result.card.cardholder?.name || '',
      installments: result.installments || 1,
      installmentValue: amount / (result.installments || 1),
    };
  }

  return response;
}

// =============================================================================
// CHECKOUT PREFERENCE (Redirect Flow)
// =============================================================================

export interface MPCheckoutItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  pictureUrl?: string;
}

export async function createMPPreference(
  items: MPCheckoutItem[],
  options: {
    externalReference: string;
    payerEmail: string;
    notificationUrl?: string;
    successUrl?: string;
    failureUrl?: string;
    pendingUrl?: string;
  }
) {
  const client = getClient();
  const preference = new Preference(client);

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fayai.shop';
  const webhookUrl = options.notificationUrl ||
    `${baseUrl}/api/payments/webhook/mercadopago`;

  const result = await preference.create({
    body: {
      items: items.map((item) => ({
        id: options.externalReference,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'BRL',
        picture_url: item.pictureUrl,
      })),
      payer: { email: options.payerEmail },
      external_reference: options.externalReference,
      notification_url: webhookUrl,
      back_urls: {
        success: options.successUrl || `${baseUrl}/pt-BR/checkout/success?order=${options.externalReference}`,
        failure: options.failureUrl || `${baseUrl}/pt-BR/checkout/failure?order=${options.externalReference}`,
        pending: options.pendingUrl || `${baseUrl}/pt-BR/checkout/pending?order=${options.externalReference}`,
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
    },
  });

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point!,
  };
}

// =============================================================================
// PAYMENT QUERY
// =============================================================================

export async function getMPPayment(paymentId: number) {
  const client = getClient();
  const payment = new MPPayment(client);
  return payment.get({ id: paymentId });
}

// =============================================================================
// REFUND
// =============================================================================

export async function refundMPPayment(paymentId: number, amount?: number) {
  const client = getClient();
  const refund = new PaymentRefund(client);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {};
  if (amount) body.amount = amount;
  return refund.create({ payment_id: paymentId, body });
}

// =============================================================================
// STATUS MAPPING
// =============================================================================

export function mapMPStatusToPaymentStatus(mpStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    approved: 'paid',
    authorized: 'confirmed',
    in_process: 'processing',
    in_mediation: 'processing',
    pending: 'pending',
    rejected: 'failed',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'failed',
  };
  return map[mpStatus] || 'pending';
}

export function mapMPMethodToPaymentMethod(mpMethod: string): PaymentMethod {
  if (mpMethod === 'pix') return 'pix';
  if (mpMethod === 'bolbradesco' || mpMethod === 'boleto') return 'boleto';
  if (['visa', 'mastercard', 'amex', 'elo', 'hipercard', 'credit_card'].includes(mpMethod)) return 'credit_card';
  return 'undefined';
}
