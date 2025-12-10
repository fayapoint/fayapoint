/**
 * Asaas Payment Gateway Integration Library
 * Documentation: https://docs.asaas.com
 * 
 * Supports:
 * - PIX payments
 * - Boleto bancário
 * - Credit card payments
 * - Customer management
 * - Payment webhooks
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';

export type AsaasPaymentStatus = 
  | 'PENDING'           // Aguardando pagamento
  | 'RECEIVED'          // Recebida (saldo já creditado)
  | 'CONFIRMED'         // Pagamento confirmado (aguardando compensação)
  | 'OVERDUE'           // Vencida
  | 'REFUNDED'          // Estornada
  | 'RECEIVED_IN_CASH'  // Recebida em dinheiro
  | 'REFUND_REQUESTED'  // Estorno solicitado
  | 'REFUND_IN_PROGRESS'// Estorno em processamento
  | 'CHARGEBACK_REQUESTED' // Chargeback solicitado
  | 'CHARGEBACK_DISPUTE' // Em disputa de chargeback
  | 'AWAITING_CHARGEBACK_REVERSAL' // Aguardando reversão de chargeback
  | 'DUNNING_REQUESTED' // Em processo de negativação
  | 'DUNNING_RECEIVED'  // Recuperada por negativação
  | 'AWAITING_RISK_ANALYSIS'; // Aguardando análise de risco

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string; // Customer ID
  billingType: AsaasBillingType;
  value: number;
  dueDate: string; // YYYY-MM-DD format
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number; // % per month
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  postalService?: boolean;
  split?: AsaasSplit[];
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
}

export interface AsaasSplit {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalFixedValue?: number;
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: AsaasBillingType;
  canBePaidAfterDueDate: boolean;
  pixTransaction?: string;
  status: AsaasPaymentStatus;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate?: string;
  estimatedCreditDate?: string;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  bankSlipUrl?: string;
  lastInvoiceViewedDate?: string;
  lastBankSlipViewedDate?: string;
  postalService: boolean;
  discount?: {
    value: number;
    limitDate?: string;
    dueDateLimitDays: number;
    type: string;
  };
  fine?: {
    value: number;
    type: string;
  };
  interest?: {
    value: number;
    type: string;
  };
  split?: AsaasSplit[];
  chargeback?: {
    status: string;
    reason: string;
  };
  refunds?: Array<{
    dateCreated: string;
    status: string;
    value: number;
    description?: string;
    transactionReceiptUrl?: string;
  }>;
}

export interface AsaasPixQrCode {
  encodedImage: string; // Base64 QR Code
  payload: string;       // PIX copia e cola
  expirationDate: string;
}

export interface AsaasBoletoIdentification {
  identificationField: string; // Linha digitável
  nossoNumero: string;
  barCode: string;
}

export interface AsaasWebhookEvent {
  id: string;
  event: AsaasWebhookEventType;
  dateCreated: string;
  payment?: AsaasPaymentResponse;
  transfer?: unknown;
  bill?: unknown;
  invoice?: unknown;
  subscription?: unknown;
}

export type AsaasWebhookEventType = 
  | 'PAYMENT_CREATED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_ANTICIPATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_PARTIALLY_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED';

export interface AsaasError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox';

const BASE_URL = ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

// =============================================================================
// HTTP CLIENT
// =============================================================================

async function asaasRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY,
    'User-Agent': 'FayaPoint/1.0',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  console.log(`[Asaas] ${method} ${endpoint}`, body ? JSON.stringify(body).slice(0, 200) : '');

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`[Asaas] Error ${response.status}:`, JSON.stringify(data));
    const error = data as AsaasError;
    throw new Error(
      error.errors?.map(e => e.description).join(', ') || 
      `Asaas API error: ${response.status}`
    );
  }

  return data as T;
}

// =============================================================================
// CUSTOMER MANAGEMENT
// =============================================================================

/**
 * Create a new customer in Asaas
 */
export async function createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>('/customers', 'POST', customer);
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(`/customers/${customerId}`);
}

/**
 * Find customer by CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const response = await asaasRequest<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${cpfCnpj}`
  );
  return response.data?.[0] || null;
}

/**
 * Find customer by email
 */
export async function findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
  const response = await asaasRequest<{ data: AsaasCustomer[] }>(
    `/customers?email=${encodeURIComponent(email)}`
  );
  return response.data?.[0] || null;
}

/**
 * Update existing customer
 */
export async function updateCustomer(
  customerId: string, 
  customer: Partial<AsaasCustomer>
): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(`/customers/${customerId}`, 'PUT', customer);
}

/**
 * Get or create customer (upsert by CPF/CNPJ or email)
 */
export async function getOrCreateCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
  // Try to find by CPF/CNPJ first
  if (customer.cpfCnpj) {
    const existing = await findCustomerByCpfCnpj(customer.cpfCnpj);
    if (existing?.id) {
      // Update with new info
      return updateCustomer(existing.id, customer);
    }
  }
  
  // Try to find by email
  if (customer.email) {
    const existing = await findCustomerByEmail(customer.email);
    if (existing?.id) {
      return updateCustomer(existing.id, customer);
    }
  }
  
  // Create new customer
  return createCustomer(customer);
}

// =============================================================================
// PAYMENT CREATION
// =============================================================================

/**
 * Create a payment (boleto, PIX, or credit card)
 */
export async function createPayment(
  payment: AsaasPayment
): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>('/payments', 'POST', payment);
}

/**
 * Create PIX payment
 */
export async function createPixPayment(
  customerId: string,
  value: number,
  options: {
    description?: string;
    externalReference?: string;
    dueDate?: string;
    callback?: { successUrl: string; autoRedirect?: boolean };
  } = {}
): Promise<AsaasPaymentResponse> {
  const dueDate = options.dueDate || getDefaultDueDate(1); // Tomorrow
  
  return createPayment({
    customer: customerId,
    billingType: 'PIX',
    value,
    dueDate,
    description: options.description,
    externalReference: options.externalReference,
    callback: options.callback,
  });
}

/**
 * Create Boleto payment
 */
export async function createBoletoPayment(
  customerId: string,
  value: number,
  options: {
    description?: string;
    externalReference?: string;
    dueDate?: string;
    discount?: { value: number; dueDateLimitDays: number; type: 'FIXED' | 'PERCENTAGE' };
    fine?: { value: number; type: 'FIXED' | 'PERCENTAGE' };
    interest?: { value: number };
    callback?: { successUrl: string; autoRedirect?: boolean };
  } = {}
): Promise<AsaasPaymentResponse> {
  const dueDate = options.dueDate || getDefaultDueDate(3); // 3 days
  
  return createPayment({
    customer: customerId,
    billingType: 'BOLETO',
    value,
    dueDate,
    description: options.description,
    externalReference: options.externalReference,
    discount: options.discount,
    fine: options.fine,
    interest: options.interest,
    callback: options.callback,
  });
}

/**
 * Create Credit Card payment
 */
export async function createCreditCardPayment(
  customerId: string,
  value: number,
  creditCard: AsaasCreditCard,
  creditCardHolderInfo: AsaasCreditCardHolderInfo,
  options: {
    description?: string;
    externalReference?: string;
    installmentCount?: number;
    installmentValue?: number;
    callback?: { successUrl: string; autoRedirect?: boolean };
  } = {}
): Promise<AsaasPaymentResponse> {
  const dueDate = getDefaultDueDate(0); // Today
  
  const payment: AsaasPayment & { 
    creditCard: AsaasCreditCard; 
    creditCardHolderInfo: AsaasCreditCardHolderInfo;
  } = {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    value,
    dueDate,
    description: options.description,
    externalReference: options.externalReference,
    installmentCount: options.installmentCount,
    installmentValue: options.installmentValue,
    callback: options.callback,
    creditCard,
    creditCardHolderInfo,
  };

  return asaasRequest<AsaasPaymentResponse>('/payments', 'POST', payment);
}

/**
 * Create payment link (customer chooses payment method)
 */
export async function createUndefinedPayment(
  customerId: string,
  value: number,
  options: {
    description?: string;
    externalReference?: string;
    dueDate?: string;
    callback?: { successUrl: string; autoRedirect?: boolean };
  } = {}
): Promise<AsaasPaymentResponse> {
  const dueDate = options.dueDate || getDefaultDueDate(3);
  
  return createPayment({
    customer: customerId,
    billingType: 'UNDEFINED', // Customer chooses payment method
    value,
    dueDate,
    description: options.description,
    externalReference: options.externalReference,
    callback: options.callback,
  });
}

// =============================================================================
// PAYMENT RETRIEVAL
// =============================================================================

/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(`/payments/${paymentId}`);
}

/**
 * Get payments by customer
 */
export async function getPaymentsByCustomer(
  customerId: string,
  status?: AsaasPaymentStatus
): Promise<{ data: AsaasPaymentResponse[]; totalCount: number }> {
  let url = `/payments?customer=${customerId}`;
  if (status) url += `&status=${status}`;
  return asaasRequest(url);
}

/**
 * Get payments by external reference
 */
export async function getPaymentsByExternalReference(
  externalReference: string
): Promise<{ data: AsaasPaymentResponse[]; totalCount: number }> {
  return asaasRequest(`/payments?externalReference=${externalReference}`);
}

/**
 * Get PIX QR Code for a payment
 */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasRequest<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

/**
 * Get boleto identification (linha digitável, código de barras)
 */
export async function getBoletoIdentification(
  paymentId: string
): Promise<AsaasBoletoIdentification> {
  return asaasRequest<AsaasBoletoIdentification>(
    `/payments/${paymentId}/identificationField`
  );
}

// =============================================================================
// PAYMENT ACTIONS
// =============================================================================

/**
 * Cancel/delete a payment
 */
export async function cancelPayment(paymentId: string): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(`/payments/${paymentId}`, 'DELETE');
}

/**
 * Refund a payment (partial or full)
 */
export async function refundPayment(
  paymentId: string,
  value?: number,
  description?: string
): Promise<AsaasPaymentResponse> {
  const body: { value?: number; description?: string } = {};
  if (value) body.value = value;
  if (description) body.description = description;
  
  return asaasRequest<AsaasPaymentResponse>(
    `/payments/${paymentId}/refund`,
    'POST',
    Object.keys(body).length > 0 ? body : undefined
  );
}

/**
 * Mark payment as received in cash (manual confirmation)
 */
export async function receiveInCash(
  paymentId: string,
  paymentDate: string,
  value: number,
  notifyCustomer: boolean = false
): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(
    `/payments/${paymentId}/receiveInCash`,
    'POST',
    { paymentDate, value, notifyCustomer }
  );
}

// =============================================================================
// SUBSCRIPTIONS (Recurring Payments)
// =============================================================================

export interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
  };
  endDate?: string;
  maxPayments?: number;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
}

export interface AsaasSubscriptionResponse extends AsaasSubscription {
  id: string;
  dateCreated: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  deleted: boolean;
}

/**
 * Create a subscription (recurring payment)
 */
export async function createSubscription(
  subscription: AsaasSubscription
): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>('/subscriptions', 'POST', subscription);
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>(`/subscriptions/${subscriptionId}`);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>(
    `/subscriptions/${subscriptionId}`,
    'DELETE'
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a default due date (days from today)
 */
export function getDefaultDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format CPF (000.000.000-00)
 */
export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Format CNPJ (00.000.000/0000-00)
 */
export function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Clean CPF/CNPJ (remove formatting)
 */
export function cleanCpfCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validate CPF
 */
export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // All same digit
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10]);
}

/**
 * Validate CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;
  if (remainder !== parseInt(digits[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;
  return remainder === parseInt(digits[13]);
}

/**
 * Determine if document is CPF or CNPJ
 */
export function getCpfCnpjType(document: string): 'cpf' | 'cnpj' | 'invalid' {
  const digits = document.replace(/\D/g, '');
  if (digits.length === 11 && isValidCpf(digits)) return 'cpf';
  if (digits.length === 14 && isValidCnpj(digits)) return 'cnpj';
  return 'invalid';
}

/**
 * Map Asaas status to user-friendly Portuguese text
 */
export function getPaymentStatusLabel(status: AsaasPaymentStatus): string {
  const labels: Record<AsaasPaymentStatus, string> = {
    PENDING: 'Aguardando pagamento',
    RECEIVED: 'Pago',
    CONFIRMED: 'Confirmado',
    OVERDUE: 'Vencido',
    REFUNDED: 'Estornado',
    RECEIVED_IN_CASH: 'Recebido em dinheiro',
    REFUND_REQUESTED: 'Estorno solicitado',
    REFUND_IN_PROGRESS: 'Estorno em processamento',
    CHARGEBACK_REQUESTED: 'Chargeback solicitado',
    CHARGEBACK_DISPUTE: 'Em disputa',
    AWAITING_CHARGEBACK_REVERSAL: 'Aguardando reversão',
    DUNNING_REQUESTED: 'Em negativação',
    DUNNING_RECEIVED: 'Recuperado',
    AWAITING_RISK_ANALYSIS: 'Em análise',
  };
  return labels[status] || status;
}

/**
 * Get payment method label
 */
export function getBillingTypeLabel(billingType: AsaasBillingType): string {
  const labels: Record<AsaasBillingType, string> = {
    BOLETO: 'Boleto Bancário',
    CREDIT_CARD: 'Cartão de Crédito',
    PIX: 'PIX',
    UNDEFINED: 'A definir',
  };
  return labels[billingType] || billingType;
}

/**
 * Check if payment is successful
 */
export function isPaymentSuccessful(status: AsaasPaymentStatus): boolean {
  return ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status);
}

/**
 * Check if payment is pending
 */
export function isPaymentPending(status: AsaasPaymentStatus): boolean {
  return ['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(status);
}

/**
 * Check if payment failed
 */
export function isPaymentFailed(status: AsaasPaymentStatus): boolean {
  return [
    'OVERDUE',
    'REFUNDED',
    'REFUND_REQUESTED',
    'REFUND_IN_PROGRESS',
    'CHARGEBACK_REQUESTED',
    'CHARGEBACK_DISPUTE',
  ].includes(status);
}

// =============================================================================
// WEBHOOK VERIFICATION
// =============================================================================

/**
 * Verify webhook signature/token
 * Note: Asaas uses a simple token-based verification
 */
export function verifyWebhookToken(
  receivedToken: string,
  expectedToken: string = process.env.ASAAS_WEBHOOK_TOKEN || ''
): boolean {
  return receivedToken === expectedToken;
}

// =============================================================================
// EXPORT CONFIGURATION
// =============================================================================

export const asaasConfig = {
  apiKey: ASAAS_API_KEY,
  environment: ASAAS_ENV,
  baseUrl: BASE_URL,
  isConfigured: !!ASAAS_API_KEY,
  isProduction: ASAAS_ENV === 'production',
};

export default {
  // Customer
  createCustomer,
  getCustomer,
  findCustomerByCpfCnpj,
  findCustomerByEmail,
  updateCustomer,
  getOrCreateCustomer,
  
  // Payments
  createPayment,
  createPixPayment,
  createBoletoPayment,
  createCreditCardPayment,
  createUndefinedPayment,
  getPayment,
  getPaymentsByCustomer,
  getPaymentsByExternalReference,
  getPixQrCode,
  getBoletoIdentification,
  cancelPayment,
  refundPayment,
  receiveInCash,
  
  // Subscriptions
  createSubscription,
  getSubscription,
  cancelSubscription,
  
  // Utilities
  getDefaultDueDate,
  formatCpf,
  formatCnpj,
  cleanCpfCnpj,
  isValidCpf,
  isValidCnpj,
  getCpfCnpjType,
  getPaymentStatusLabel,
  getBillingTypeLabel,
  isPaymentSuccessful,
  isPaymentPending,
  isPaymentFailed,
  verifyWebhookToken,
  
  // Config
  config: asaasConfig,
};
