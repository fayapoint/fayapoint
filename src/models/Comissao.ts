import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── O EXTRATO DA COMISSÃO ────────────────────────────────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`
 *
 * Um lançamento por PAGAMENTO da conta indicada — não por mês, não por conta.
 * Enquanto ela pagar, nasce lançamento; se ela parar, param sozinhos.
 *
 * ## `asaasPaymentId` é único, e isso é o que impede pagar duas vezes
 *
 * O webhook do Asaas reentrega evento: `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`
 * chegam para a MESMA cobrança, e retentativa de rede repete os dois. Sem a
 * unicidade aqui, cada reentrega viraria dinheiro novo saindo do caixa. A rota
 * já tem uma checagem de idempotência por evento; esta é a segunda tranca, no
 * banco, que não depende de a rota lembrar de conferir.
 *
 * ## Por que nasce RETIDA
 *
 * O CDC dá 7 dias de arrependimento em compra online, e cartão pode ser
 * estornado bem depois. Comissão liberada na hora é dinheiro que sai antes de
 * ter certeza de que entrou. Ela nasce `retida`, com `liberaEm` a 30 dias — e
 * `PAYMENT_REFUNDED` a vira `estornada` antes disso, sem precisar cobrar de
 * ninguém depois.
 *
 * ## A base é o LÍQUIDO, e o percentual é gravado na linha
 *
 * `baseLiquida` é o `netValue` do Asaas: o que de fato entrou, já sem a taxa da
 * maquininha. Comissão sobre o bruto pagaria percentual sobre dinheiro que
 * nunca chegou.
 *
 * E `percentual` fica gravado em cada lançamento em vez de ser lido da tabela
 * na hora de somar: quem virou Lenda passa a 10%, e o extrato antigo tem de
 * continuar contando os 7% que valiam naquele mês. Percentual lido de fora
 * reescreveria o passado a cada promoção.
 */

export type EstadoComissao = 'retida' | 'liberada' | 'paga' | 'estornada';

export interface IComissao extends Document {
  fundadorId: mongoose.Types.ObjectId;
  indicacaoId: mongoose.Types.ObjectId;
  indicadoUserId: mongoose.Types.ObjectId;
  /** Idempotência dura: um pagamento, um lançamento. */
  asaasPaymentId: string;
  /** `netValue` do Asaas, em reais. */
  baseLiquida: number;
  percentual: number;
  valor: number;
  forma: 'credito' | 'dinheiro';
  estado: EstadoComissao;
  criadoEm: Date;
  liberaEm: Date;
  liberadaEm?: Date;
  pagaEm?: Date;
  estornadaEm?: Date;
  /** O que gerou: assinatura, crédito, curso, certificado. */
  origem?: string;
}

const ComissaoSchema = new Schema<IComissao>(
  {
    fundadorId: { type: Schema.Types.ObjectId, ref: 'Fundador', required: true, index: true },
    indicacaoId: { type: Schema.Types.ObjectId, ref: 'Indicacao', required: true },
    indicadoUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asaasPaymentId: { type: String, required: true, unique: true },
    baseLiquida: { type: Number, required: true },
    percentual: { type: Number, required: true },
    valor: { type: Number, required: true },
    forma: { type: String, enum: ['credito', 'dinheiro'], required: true },
    estado: {
      type: String,
      enum: ['retida', 'liberada', 'paga', 'estornada'],
      default: 'retida',
      index: true,
    },
    criadoEm: { type: Date, default: Date.now },
    liberaEm: { type: Date, required: true },
    liberadaEm: { type: Date },
    pagaEm: { type: Date },
    estornadaEm: { type: Date },
    origem: { type: String },
  },
  { collection: 'comissoes' },
);

/** A varredura que libera o que passou dos 30 dias lê exatamente por aqui. */
ComissaoSchema.index({ estado: 1, liberaEm: 1 });

const Comissao: Model<IComissao> =
  (mongoose.models.Comissao as Model<IComissao>) ||
  mongoose.model<IComissao>('Comissao', ComissaoSchema);

export default Comissao;
