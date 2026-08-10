import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export interface IReceiptItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'course' | 'subscription' | 'service' | 'product' | 'credits';
  slug?: string;
  lifetimeAccess?: boolean;
  certificateIncluded?: boolean;
}

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;        // REC-2026-XXXXX
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;

  // Payment reference
  paymentId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  asaasPaymentId?: string;

  // Items
  items: IReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;

  // Payment details
  paymentMethod: 'pix' | 'boleto' | 'credit_card' | 'mercadopago';
  paymentMethodLabel: string;
  paidAt: Date;

  // Subscription details (if applicable)
  planName?: string;
  planCycle?: 'monthly' | 'yearly';

  // Status
  status: 'issued' | 'voided';
  voidedAt?: Date;
  voidReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const ReceiptItemSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  // `credits` faltava, e sem ele a compra de pacote gerava pagamento válido e
  // recibo nenhum — o cliente pagava e não recebia comprovante.
  type: { type: String, enum: ['course', 'subscription', 'service', 'product', 'credits'], required: true },
  slug: String,
  lifetimeAccess: { type: Boolean, default: false },
  certificateIncluded: { type: Boolean, default: false },
}, { _id: false });

const ReceiptSchema = new Schema<IReceipt>({
  receiptNumber: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },

  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  orderNumber: String,
  asaasPaymentId: String,

  items: [ReceiptItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  paymentMethod: { type: String, enum: ['pix', 'boleto', 'credit_card', 'mercadopago'], required: true },
  paymentMethodLabel: { type: String, required: true },
  paidAt: { type: Date, required: true },

  planName: String,
  planCycle: { type: String, enum: ['monthly', 'yearly'] },

  status: { type: String, enum: ['issued', 'voided'], default: 'issued' },
  voidedAt: Date,
  voidReason: String,
}, {
  timestamps: true,
});

/**
 * O número do recibo.
 *
 * ## ⚠️ Era `pre('save')`, e por isso NENHUM recibo jamais foi emitido
 *
 * `receiptNumber` é `required: true`. O hook que o gerava estava em
 * `pre('save')` — e **o Mongoose valida antes de rodar os hooks de `save`
 * definidos no schema**. Quer dizer: a validação acontecia com o campo ainda
 * vazio, estourava `Path 'receiptNumber' is required`, e o hook que ia
 * preenchê-lo nunca chegava a rodar.
 *
 * O erro era engolido pelo `try/catch` de quem chamava (o webhook loga e
 * segue), então o pagamento era confirmado normalmente e só o recibo sumia.
 * Medido em 10/08/2026: **a coleção `receipts` tinha zero documentos.** Nunca
 * funcionou.
 *
 * `pre('validate')` roda antes da validação — é o gancho certo para campo
 * obrigatório que o próprio modelo preenche.
 *
 * ## ⚠️ E o número não pode vir de `countDocuments()`
 *
 * `count + 1` dá o mesmo número para dois recibos emitidos no mesmo instante —
 * e `receiptNumber` é `unique`, então o segundo falharia. Pior: some um recibo
 * do banco e a contagem passa a repetir um número já usado. Contar linhas nunca
 * foi um gerador de sequência.
 *
 * O contador agora é atômico por ano (`$inc` em `counters`), com o `countDocuments`
 * antigo servindo só de piso para não recomeçar do 1 sobre um histórico que já
 * existisse.
 */
ReceiptSchema.pre('validate', async function (next) {
  if (!this.isNew || this.receiptNumber) return next();
  try {
    const year = new Date().getFullYear();
    const contadores = mongoose.connection.collection('counters');
    const r = await contadores.findOneAndUpdate(
      { _id: `receipt-${year}` as unknown as import('mongodb').ObjectId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
    const seq = (r as { seq?: number } | null)?.seq ?? 1;
    this.receiptNumber = `REC-${year}-${String(seq).padStart(5, '0')}`;
    next();
  } catch (erro) {
    // ⚠️ Não deixa o recibo sem número: sem isto voltaríamos ao defeito
    // original, só que por outro caminho. O sufixo aleatório garante unicidade
    // mesmo se o contador estiver indisponível.
    this.receiptNumber = `REC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    console.warn('[Receipt] contador indisponível, número de contingência:', (erro as Error)?.message);
    next();
  }
});

// =============================================================================
// MODEL
// =============================================================================

const Receipt: Model<IReceipt> =
  mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);

export default Receipt;

// =============================================================================
// HELPERS
// =============================================================================

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX — Transferência instantânea',
  boleto: 'Boleto Bancário',
  credit_card: 'Cartão de Crédito',
  mercadopago: 'MercadoPago',
};

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}
