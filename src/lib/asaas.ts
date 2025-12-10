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
// ENHANCED SUBSCRIPTIONS
// =============================================================================

/**
 * List all subscriptions
 */
export async function listSubscriptions(
  options: {
    customer?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    offset?: number;
    limit?: number;
  } = {}
): Promise<{ data: AsaasSubscriptionResponse[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.customer) params.append('customer', options.customer);
  if (options.status) params.append('status', options.status);
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/subscriptions?${params.toString()}`);
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  data: Partial<Omit<AsaasSubscription, 'id' | 'customer'>>
): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>(
    `/subscriptions/${subscriptionId}`,
    'PUT',
    data
  );
}

/**
 * Get subscription payments
 */
export async function getSubscriptionPayments(
  subscriptionId: string,
  status?: AsaasPaymentStatus
): Promise<{ data: AsaasPaymentResponse[]; totalCount: number }> {
  let url = `/subscriptions/${subscriptionId}/payments`;
  if (status) url += `?status=${status}`;
  return asaasRequest(url);
}

/**
 * Generate subscription payment booklet (carnê)
 */
export async function getSubscriptionPaymentBook(
  subscriptionId: string
): Promise<{ success: boolean; url: string }> {
  return asaasRequest(`/subscriptions/${subscriptionId}/paymentBook`);
}

// =============================================================================
// PAYMENT LINKS
// =============================================================================

export type PaymentLinkChargeType = 'DETACHED' | 'RECURRENT' | 'INSTALLMENT';

export interface AsaasPaymentLink {
  id?: string;
  name: string;
  description?: string;
  endDate?: string;
  value?: number;
  billingType: AsaasBillingType;
  chargeType: PaymentLinkChargeType;
  dueDateLimitDays?: number;
  subscriptionCycle?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  maxInstallmentCount?: number;
  externalReference?: string;
  notificationEnabled?: boolean;
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
  isAddressRequired?: boolean;
}

export interface AsaasPaymentLinkResponse extends AsaasPaymentLink {
  id: string;
  active: boolean;
  url: string;
  deleted: boolean;
  viewCount: number;
}

/**
 * Create a payment link
 */
export async function createPaymentLink(
  link: AsaasPaymentLink
): Promise<AsaasPaymentLinkResponse> {
  return asaasRequest<AsaasPaymentLinkResponse>('/paymentLinks', 'POST', link);
}

/**
 * Get payment link by ID
 */
export async function getPaymentLink(
  linkId: string
): Promise<AsaasPaymentLinkResponse> {
  return asaasRequest<AsaasPaymentLinkResponse>(`/paymentLinks/${linkId}`);
}

/**
 * List payment links
 */
export async function listPaymentLinks(
  options: { active?: boolean; offset?: number; limit?: number } = {}
): Promise<{ data: AsaasPaymentLinkResponse[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.active !== undefined) params.append('active', String(options.active));
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/paymentLinks?${params.toString()}`);
}

/**
 * Update payment link
 */
export async function updatePaymentLink(
  linkId: string,
  data: Partial<AsaasPaymentLink>
): Promise<AsaasPaymentLinkResponse> {
  return asaasRequest<AsaasPaymentLinkResponse>(
    `/paymentLinks/${linkId}`,
    'PUT',
    data
  );
}

/**
 * Delete payment link
 */
export async function deletePaymentLink(
  linkId: string
): Promise<AsaasPaymentLinkResponse> {
  return asaasRequest<AsaasPaymentLinkResponse>(
    `/paymentLinks/${linkId}`,
    'DELETE'
  );
}

/**
 * Restore payment link
 */
export async function restorePaymentLink(
  linkId: string
): Promise<AsaasPaymentLinkResponse> {
  return asaasRequest<AsaasPaymentLinkResponse>(
    `/paymentLinks/${linkId}/restore`,
    'POST'
  );
}

// =============================================================================
// INSTALLMENTS (Parcelamento)
// =============================================================================

export interface AsaasInstallment {
  id?: string;
  installmentCount: number;
  customer: string;
  value: number;
  totalValue?: number;
  billingType: AsaasBillingType;
  dueDate: string;
  description?: string;
  postalService?: boolean;
  paymentExternalReference?: string;
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
  splits?: AsaasSplit[];
}

export interface AsaasInstallmentResponse extends AsaasInstallment {
  id: string;
  netValue: number;
  paymentValue: number;
  billingType: AsaasBillingType;
  paymentDate?: string;
  expirationDay: number;
  dateCreated: string;
  deleted: boolean;
  transactionReceiptUrl?: string;
  creditCard?: {
    creditCardNumber: string;
    creditCardBrand: string;
    creditCardToken?: string;
  };
}

/**
 * Create installment (parcelamento)
 */
export async function createInstallment(
  installment: AsaasInstallment
): Promise<AsaasInstallmentResponse> {
  return asaasRequest<AsaasInstallmentResponse>('/installments', 'POST', installment);
}

/**
 * Get installment by ID
 */
export async function getInstallment(
  installmentId: string
): Promise<AsaasInstallmentResponse> {
  return asaasRequest<AsaasInstallmentResponse>(`/installments/${installmentId}`);
}

/**
 * List installments
 */
export async function listInstallments(
  options: { customer?: string; offset?: number; limit?: number } = {}
): Promise<{ data: AsaasInstallmentResponse[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.customer) params.append('customer', options.customer);
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/installments?${params.toString()}`);
}

/**
 * Get installment payments
 */
export async function getInstallmentPayments(
  installmentId: string
): Promise<{ data: AsaasPaymentResponse[]; totalCount: number }> {
  return asaasRequest(`/installments/${installmentId}/payments`);
}

/**
 * Delete installment (cancel all pending charges)
 */
export async function deleteInstallment(
  installmentId: string
): Promise<AsaasInstallmentResponse> {
  return asaasRequest<AsaasInstallmentResponse>(
    `/installments/${installmentId}`,
    'DELETE'
  );
}

/**
 * Generate installment payment booklet (carnê)
 */
export async function getInstallmentPaymentBook(
  installmentId: string
): Promise<{ success: boolean; url: string }> {
  return asaasRequest(`/installments/${installmentId}/paymentBook`);
}

/**
 * Refund entire installment
 */
export async function refundInstallment(
  installmentId: string,
  description?: string
): Promise<AsaasInstallmentResponse> {
  return asaasRequest<AsaasInstallmentResponse>(
    `/installments/${installmentId}/refund`,
    'POST',
    description ? { description } : undefined
  );
}

// =============================================================================
// CREDIT CARD TOKENIZATION
// =============================================================================

export interface AsaasCreditCardToken {
  creditCardNumber: string;
  creditCardBrand: 'VISA' | 'MASTERCARD' | 'ELO' | 'DINERS' | 'DISCOVER' | 'AMEX' | 'UNKNOWN';
  creditCardToken: string;
}

/**
 * Tokenize a credit card for future payments
 */
export async function tokenizeCreditCard(
  customerId: string,
  creditCard: AsaasCreditCard,
  creditCardHolderInfo: AsaasCreditCardHolderInfo,
  remoteIp: string
): Promise<AsaasCreditCardToken> {
  return asaasRequest<AsaasCreditCardToken>(
    '/creditCard/tokenizeCreditCard',
    'POST',
    {
      customer: customerId,
      creditCard,
      creditCardHolderInfo,
      remoteIp,
    }
  );
}

/**
 * Create payment with tokenized credit card
 */
export async function createPaymentWithToken(
  customerId: string,
  value: number,
  creditCardToken: string,
  creditCardHolderInfo: AsaasCreditCardHolderInfo,
  options: {
    description?: string;
    externalReference?: string;
    installmentCount?: number;
    installmentValue?: number;
    callback?: { successUrl: string; autoRedirect?: boolean };
  } = {}
): Promise<AsaasPaymentResponse> {
  const dueDate = getDefaultDueDate(0);
  
  return asaasRequest<AsaasPaymentResponse>('/payments', 'POST', {
    customer: customerId,
    billingType: 'CREDIT_CARD',
    value,
    dueDate,
    description: options.description,
    externalReference: options.externalReference,
    installmentCount: options.installmentCount,
    installmentValue: options.installmentValue,
    callback: options.callback,
    creditCardToken,
    creditCardHolderInfo,
  });
}

// =============================================================================
// INVOICES (NFS-e - Notas Fiscais de Serviço)
// =============================================================================

export type InvoiceStatus = 
  | 'SCHEDULED' 
  | 'AUTHORIZED' 
  | 'PROCESSING_CANCELLATION' 
  | 'CANCELED' 
  | 'CANCELLATION_DENIED' 
  | 'ERROR';

export interface AsaasInvoiceTaxes {
  retainIss: boolean;
  cofins: number;
  csll: number;
  inss: number;
  ir: number;
  pis: number;
  iss: number;
}

export interface AsaasInvoice {
  payment?: string;
  installment?: string;
  customer?: string;
  serviceDescription: string;
  observations: string;
  externalReference?: string;
  value: number;
  deductions: number;
  effectiveDate: string;
  municipalServiceId?: string;
  municipalServiceCode?: string;
  municipalServiceName: string;
  updatePayment?: boolean;
  taxes: AsaasInvoiceTaxes;
}

export interface AsaasInvoiceResponse extends AsaasInvoice {
  id: string;
  status: InvoiceStatus;
  statusDescription?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  rpsSerie?: string;
  rpsNumber?: string;
  number?: string;
  validationCode?: string;
  estimatedTaxesDescription?: string;
}

/**
 * Schedule an invoice (NFS-e)
 */
export async function createInvoice(
  invoice: AsaasInvoice
): Promise<AsaasInvoiceResponse> {
  return asaasRequest<AsaasInvoiceResponse>('/invoices', 'POST', invoice);
}

/**
 * Get invoice by ID
 */
export async function getInvoice(
  invoiceId: string
): Promise<AsaasInvoiceResponse> {
  return asaasRequest<AsaasInvoiceResponse>(`/invoices/${invoiceId}`);
}

/**
 * List invoices
 */
export async function listInvoices(
  options: {
    payment?: string;
    installment?: string;
    customer?: string;
    status?: InvoiceStatus;
    offset?: number;
    limit?: number;
  } = {}
): Promise<{ data: AsaasInvoiceResponse[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.payment) params.append('payment', options.payment);
  if (options.installment) params.append('installment', options.installment);
  if (options.customer) params.append('customer', options.customer);
  if (options.status) params.append('status', options.status);
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/invoices?${params.toString()}`);
}

/**
 * Update invoice
 */
export async function updateInvoice(
  invoiceId: string,
  data: Partial<AsaasInvoice>
): Promise<AsaasInvoiceResponse> {
  return asaasRequest<AsaasInvoiceResponse>(
    `/invoices/${invoiceId}`,
    'PUT',
    data
  );
}

/**
 * Authorize/issue invoice
 */
export async function authorizeInvoice(
  invoiceId: string
): Promise<AsaasInvoiceResponse> {
  return asaasRequest<AsaasInvoiceResponse>(
    `/invoices/${invoiceId}/authorize`,
    'POST'
  );
}

/**
 * Cancel invoice
 */
export async function cancelInvoice(
  invoiceId: string
): Promise<AsaasInvoiceResponse> {
  return asaasRequest<AsaasInvoiceResponse>(
    `/invoices/${invoiceId}/cancel`,
    'POST'
  );
}

// =============================================================================
// PAYMENT DUNNING (Cobrança/Negativação)
// =============================================================================

export type DunningType = 'CREDIT_BUREAU' | 'PROTEST';

export interface AsaasPaymentDunning {
  payment: string;
  type: DunningType;
  description?: string;
}

export interface AsaasPaymentDunningResponse {
  id: string;
  status: string;
  type: DunningType;
  payment: string;
  description?: string;
  dateCreated: string;
  value: number;
  netValue: number;
  feeValue: number;
  requestDate?: string;
  protestDate?: string;
  cancellationDate?: string;
}

/**
 * Create payment dunning (negativação)
 */
export async function createPaymentDunning(
  dunning: AsaasPaymentDunning
): Promise<AsaasPaymentDunningResponse> {
  return asaasRequest<AsaasPaymentDunningResponse>('/paymentDunnings', 'POST', dunning);
}

/**
 * Get dunning by ID
 */
export async function getPaymentDunning(
  dunningId: string
): Promise<AsaasPaymentDunningResponse> {
  return asaasRequest<AsaasPaymentDunningResponse>(`/paymentDunnings/${dunningId}`);
}

/**
 * List dunnings
 */
export async function listPaymentDunnings(
  options: { payment?: string; offset?: number; limit?: number } = {}
): Promise<{ data: AsaasPaymentDunningResponse[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.payment) params.append('payment', options.payment);
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/paymentDunnings?${params.toString()}`);
}

/**
 * Cancel dunning
 */
export async function cancelPaymentDunning(
  dunningId: string
): Promise<AsaasPaymentDunningResponse> {
  return asaasRequest<AsaasPaymentDunningResponse>(
    `/paymentDunnings/${dunningId}/cancel`,
    'POST'
  );
}

/**
 * Simulate dunning (get fees before creating)
 */
export async function simulatePaymentDunning(
  payment: string,
  type: DunningType
): Promise<{
  netValue: number;
  value: number;
  feeValue: number;
  requestDate: string;
  protestDate?: string;
}> {
  return asaasRequest('/paymentDunnings/simulate', 'POST', { payment, type });
}

/**
 * Get payments available for dunning
 */
export async function getPaymentsAvailableForDunning(
  options: { offset?: number; limit?: number } = {}
): Promise<{ data: AsaasPaymentResponse[]; totalCount: number }> {
  const params = new URLSearchParams();
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/paymentDunnings/paymentsAvailableForDunning?${params.toString()}`);
}

// =============================================================================
// SALES SIMULATION
// =============================================================================

export interface AsaasPaymentSimulation {
  customer?: string;
  billingTypes?: AsaasBillingType[];
  value: number;
  installmentCount?: number;
}

export interface AsaasPaymentSimulationResponse {
  billingTypes: Array<{
    billingType: AsaasBillingType;
    installmentCount: number;
    netValue: number;
    feeValue: number;
    feePercentage: number;
  }>;
}

/**
 * Simulate payment to get net value and fees
 */
export async function simulatePayment(
  simulation: AsaasPaymentSimulation
): Promise<AsaasPaymentSimulationResponse> {
  return asaasRequest<AsaasPaymentSimulationResponse>(
    '/payments/simulate',
    'POST',
    simulation
  );
}

/**
 * Get payment limits
 */
export async function getPaymentLimits(): Promise<{
  creation: {
    daily: { limit: number; used: number; available: number };
    monthly: { limit: number; used: number; available: number };
  };
}> {
  return asaasRequest('/payments/limits');
}

// =============================================================================
// PAYMENT DOCUMENTS
// =============================================================================

/**
 * Upload document to payment
 */
export async function uploadPaymentDocument(
  paymentId: string,
  document: {
    type: string;
    file: string; // Base64 encoded file
    name: string;
  }
): Promise<{ id: string; type: string; name: string }> {
  return asaasRequest(`/payments/${paymentId}/documents`, 'POST', document);
}

/**
 * List payment documents
 */
export async function listPaymentDocuments(
  paymentId: string
): Promise<{ data: Array<{ id: string; type: string; name: string }> }> {
  return asaasRequest(`/payments/${paymentId}/documents`);
}

// =============================================================================
// FINANCIAL INFO
// =============================================================================

/**
 * Get account balance
 */
export async function getAccountBalance(): Promise<{
  balance: number;
  blocked: number;
}> {
  return asaasRequest('/finance/balance');
}

/**
 * Get payment statistics
 */
export async function getPaymentStatistics(): Promise<{
  income: number;
  incomeCount: number;
  pending: number;
  pendingCount: number;
  overdue: number;
  overdueCount: number;
}> {
  return asaasRequest('/finance/payment/statistics');
}

/**
 * Get account fees
 */
export async function getAccountFees(): Promise<{
  payment: { 
    bankSlip: { defaultValue: number; discountValue: number };
    pix: { percentageFee: number; fixedFee: number; minimumFee: number };
    creditCard: { 
      operationValue: number; 
      oneInstallmentPercentage: number;
      twoToSixInstallmentsPercentage: number;
      sevenToTwelveInstallmentsPercentage: number;
    };
  };
  anticipation: { pixPercentage: number; bankSlipPercentage: number; creditCardPercentage: number };
  transfer: { pixFee: number; tedFee: number };
}> {
  return asaasRequest('/myAccount/fees/');
}

// =============================================================================
// REFUNDS (Enhanced)
// =============================================================================

/**
 * Get payment refunds
 */
export async function getPaymentRefunds(
  paymentId: string
): Promise<{
  data: Array<{
    dateCreated: string;
    status: 'PENDING' | 'DONE' | 'CANCELLED';
    value: number;
    description?: string;
    transactionReceiptUrl?: string;
  }>;
}> {
  return asaasRequest(`/payments/${paymentId}/refunds`);
}

/**
 * Refund bank slip specifically
 */
export async function refundBankSlip(
  paymentId: string,
  refundData: {
    value?: number;
    description?: string;
    bankAccount?: {
      bank: { code: string };
      accountName: string;
      ownerName: string;
      ownerBirthDate?: string;
      cpfCnpj: string;
      agency: string;
      agencyDigit?: string;
      account: string;
      accountDigit: string;
      bankAccountType: 'CONTA_CORRENTE' | 'CONTA_POUPANCA';
    };
  }
): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>(
    `/payments/${paymentId}/bankSlip/refund`,
    'POST',
    refundData
  );
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * Get customer notifications
 */
export async function getCustomerNotifications(
  customerId: string
): Promise<{
  data: Array<{
    id: string;
    customer: string;
    enabled: boolean;
    emailEnabledForProvider: boolean;
    smsEnabledForProvider: boolean;
    phoneCallEnabledForProvider: boolean;
    whatsappEnabledForProvider: boolean;
  }>;
}> {
  return asaasRequest(`/customers/${customerId}/notifications`);
}

/**
 * Update notification settings
 */
export async function updateNotification(
  notificationId: string,
  settings: {
    enabled?: boolean;
    emailEnabledForProvider?: boolean;
    smsEnabledForProvider?: boolean;
    phoneCallEnabledForProvider?: boolean;
    whatsappEnabledForProvider?: boolean;
  }
): Promise<{ id: string }> {
  return asaasRequest(`/notifications/${notificationId}`, 'PUT', settings);
}

// =============================================================================
// CHARGEBACKS
// =============================================================================

/**
 * Get payment chargeback info
 */
export async function getPaymentChargeback(
  paymentId: string
): Promise<{
  id: string;
  payment: string;
  status: 'REQUESTED' | 'IN_DISPUTE' | 'DISPUTE_LOST' | 'REVERSED' | 'DONE';
  reason: string;
  disputeStartDate: string;
  value: number;
}> {
  return asaasRequest(`/payments/${paymentId}/chargeback`);
}

/**
 * Create chargeback dispute
 */
export async function createChargebackDispute(
  chargebackId: string,
  documents: Array<{ type: string; file: string }>
): Promise<{ success: boolean }> {
  return asaasRequest(`/chargebacks/${chargebackId}/dispute`, 'POST', { documents });
}

/**
 * List chargebacks
 */
export async function listChargebacks(
  options: { status?: string; offset?: number; limit?: number } = {}
): Promise<{ data: Array<{ id: string; payment: string; status: string; value: number }> }> {
  const params = new URLSearchParams();
  if (options.status) params.append('status', options.status);
  if (options.offset) params.append('offset', String(options.offset));
  if (options.limit) params.append('limit', String(options.limit));
  
  return asaasRequest(`/chargebacks/?${params.toString()}`);
}

// =============================================================================
// PIX FEATURES
// =============================================================================

/**
 * Create static PIX QR Code
 */
export async function createStaticPixQrCode(
  options: {
    addressKey: string;
    description?: string;
    value?: number;
    format?: 'ALL' | 'IMAGE' | 'PAYLOAD';
    expirationDate?: string;
    expirationSeconds?: number;
    allowsMultiplePayments?: boolean;
  }
): Promise<{
  id: string;
  encodedImage: string;
  payload: string;
  allowsMultiplePayments: boolean;
}> {
  return asaasRequest('/pix/qrCodes/static', 'POST', options);
}

/**
 * List PIX keys
 */
export async function listPixKeys(): Promise<{
  data: Array<{
    id: string;
    key: string;
    type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
    status: 'AWAITING_ACTIVATION' | 'ACTIVE' | 'AWAITING_DELETION' | 'DELETED' | 'ERROR';
    dateCreated: string;
  }>;
}> {
  return asaasRequest('/pix/addressKeys');
}

// =============================================================================
// BILLING INFO
// =============================================================================

/**
 * Get payment billing info
 */
export async function getPaymentBillingInfo(
  paymentId: string
): Promise<{
  creditCard?: {
    creditCardNumber: string;
    creditCardBrand: string;
    creditCardToken?: string;
  };
  bankSlip?: {
    identificationField: string;
    nossoNumero: string;
    barCode: string;
    bankSlipUrl: string;
  };
  pix?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
}> {
  return asaasRequest(`/payments/${paymentId}/billingInfo`);
}

/**
 * Get payment viewing info
 */
export async function getPaymentViewingInfo(
  paymentId: string
): Promise<{
  invoiceViewed: boolean;
  bankSlipViewed: boolean;
  invoiceViewedDate?: string;
  bankSlipViewedDate?: string;
}> {
  return asaasRequest(`/payments/${paymentId}/viewingInfo`);
}

// =============================================================================
// TRANSACTION RECEIPTS
// =============================================================================

/**
 * Get transaction receipt URL
 */
export async function getTransactionReceipt(
  paymentId: string
): Promise<{ transactionReceiptUrl?: string }> {
  const payment = await getPayment(paymentId);
  return { transactionReceiptUrl: payment.transactionReceiptUrl };
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
// SUBSCRIPTION WEBHOOKS TYPES
// =============================================================================

export type AsaasSubscriptionWebhookEventType = 
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_PAYMENT_CREATED';

export type AsaasInvoiceWebhookEventType =
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'INVOICE_AUTHORIZED'
  | 'INVOICE_CANCELED'
  | 'INVOICE_ERROR';

export interface AsaasSubscriptionWebhookEvent {
  id: string;
  event: AsaasSubscriptionWebhookEventType;
  dateCreated: string;
  subscription: AsaasSubscriptionResponse;
}

export interface AsaasInvoiceWebhookEvent {
  id: string;
  event: AsaasInvoiceWebhookEventType;
  dateCreated: string;
  invoice: AsaasInvoiceResponse;
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
  getCustomerNotifications,
  
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
  getPaymentBillingInfo,
  getPaymentViewingInfo,
  getTransactionReceipt,
  
  // Subscriptions
  createSubscription,
  getSubscription,
  cancelSubscription,
  listSubscriptions,
  updateSubscription,
  getSubscriptionPayments,
  getSubscriptionPaymentBook,
  
  // Payment Links
  createPaymentLink,
  getPaymentLink,
  listPaymentLinks,
  updatePaymentLink,
  deletePaymentLink,
  restorePaymentLink,
  
  // Installments
  createInstallment,
  getInstallment,
  listInstallments,
  getInstallmentPayments,
  deleteInstallment,
  getInstallmentPaymentBook,
  refundInstallment,
  
  // Credit Card Tokenization
  tokenizeCreditCard,
  createPaymentWithToken,
  
  // Invoices (NFS-e)
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoice,
  authorizeInvoice,
  cancelInvoice,
  
  // Dunning
  createPaymentDunning,
  getPaymentDunning,
  listPaymentDunnings,
  cancelPaymentDunning,
  simulatePaymentDunning,
  getPaymentsAvailableForDunning,
  
  // Simulation & Limits
  simulatePayment,
  getPaymentLimits,
  
  // Documents
  uploadPaymentDocument,
  listPaymentDocuments,
  
  // Financial
  getAccountBalance,
  getPaymentStatistics,
  getAccountFees,
  
  // Refunds
  getPaymentRefunds,
  refundBankSlip,
  
  // Chargebacks
  getPaymentChargeback,
  createChargebackDispute,
  listChargebacks,
  
  // PIX
  createStaticPixQrCode,
  listPixKeys,
  
  // Notifications
  updateNotification,
  
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
