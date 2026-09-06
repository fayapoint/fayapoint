import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── O FUNDADOR: um número, um código, e duas travas ──────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`
 *
 * As cem primeiras assinaturas da casa. Quem entra paga metade do preço
 * enquanto for assinante, recebe um número que não se repete (#001 a #100), e
 * ganha 7% em crédito (ou 5% em dinheiro) de tudo que indicar, sem prazo.
 *
 * ## A vaga só existe com pagamento confirmado
 *
 * `numero` é atribuído no webhook do Asaas, no `PAYMENT_CONFIRMED` — nunca no
 * cadastro. Se bastasse criar conta, as cem vagas sumiriam numa noite de robô e
 * o programa morreria antes de começar. É a mesma razão de o CPF ser único: uma
 * pessoa, um lugar.
 *
 * ## Por que o número é sequencial e único no banco, e não calculado
 *
 * "Você é o 37º" calculado por contagem (`countDocuments() + 1`) é uma corrida:
 * dois pagamentos confirmados no mesmo segundo recebem o mesmo 37. O número sai
 * de um contador atômico (`findOneAndUpdate` com `$inc`) na coleção
 * `contadores`, e o índice único aqui é a rede de segurança — se algum caminho
 * novo tentar gravar um número repetido, o banco recusa em vez de duplicar.
 *
 * ## O que "vitalício" quer dizer, em campo
 *
 * - `status: 'ativo'`   — assinatura em dia: paga metade e recebe comissão.
 * - `status: 'pausado'` — cancelou ou o cartão falhou. **A comissão pausa, não
 *   morre**: os lançamentos param de nascer, os já liberados continuam dele, e
 *   voltar a assinar reativa tudo. `pausadoEm` conta os 90 dias de carência.
 * - `status: 'encerrado'` — saiu por fraude ou pedido próprio. O `numero`
 *   continua gravado (é história, e o selo é permanente), o preço não volta.
 */

export type StatusFundador = 'ativo' | 'pausado' | 'encerrado';
export type NivelFundador = 'fundador' | 'bronze' | 'prata' | 'ouro' | 'lenda';

/** Os marcos da escada. Contados em indicações VÁLIDAS, não em cadastros. */
export const MARCOS: { nivel: NivelFundador; indicados: number; bonusCreditos: number }[] = [
  { nivel: 'bronze', indicados: 3, bonusCreditos: 50 },
  { nivel: 'prata', indicados: 10, bonusCreditos: 150 },
  { nivel: 'ouro', indicados: 25, bonusCreditos: 400 },
  { nivel: 'lenda', indicados: 50, bonusCreditos: 1000 },
];

export interface IFundador extends Document {
  userId: mongoose.Types.ObjectId;
  /** 1 a 100. Sai do contador atômico no primeiro pagamento confirmado. */
  numero: number;
  /** O endereço público: `fayai.com.br/f/<codigo>`. Minúsculo, sem acento. */
  codigo: string;
  status: StatusFundador;
  nivel: NivelFundador;
  /** Quando entrou (pagamento confirmado), não quando se cadastrou. */
  criadoEm: Date;
  /** Quando a assinatura caiu. Base dos 90 dias de carência. */
  pausadoEm?: Date;
  encerradoEm?: Date;
  motivoEncerramento?: string;
  /** Provas de identidade exigidas para o código ser emitido. */
  cpfVerificadoEm?: Date;
  telefone?: string;
  telefoneVerificadoEm?: Date;
  /** Contagem denormalizada — o extrato de verdade vive em `Comissao`. */
  indicadosValidos: number;
  creditosGanhos: number;
  dinheiroGanho: number;
  /** Marcos já pagos, para o bônus não cair duas vezes. */
  marcosPagos: NivelFundador[];
  /** Preferência de recebimento. Crédito paga 7%, dinheiro paga 5%. */
  formaPreferida: 'credito' | 'dinheiro';
}

const FundadorSchema = new Schema<IFundador>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    numero: { type: Number, required: true, unique: true, min: 1 },
    codigo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['ativo', 'pausado', 'encerrado'], default: 'ativo', index: true },
    nivel: {
      type: String,
      enum: ['fundador', 'bronze', 'prata', 'ouro', 'lenda'],
      default: 'fundador',
    },
    criadoEm: { type: Date, default: Date.now },
    pausadoEm: { type: Date },
    encerradoEm: { type: Date },
    motivoEncerramento: { type: String },
    cpfVerificadoEm: { type: Date },
    telefone: { type: String },
    telefoneVerificadoEm: { type: Date },
    indicadosValidos: { type: Number, default: 0 },
    creditosGanhos: { type: Number, default: 0 },
    dinheiroGanho: { type: Number, default: 0 },
    marcosPagos: [{ type: String }],
    formaPreferida: { type: String, enum: ['credito', 'dinheiro'], default: 'credito' },
  },
  { collection: 'fundadores' },
);

export const LIMITE_DE_VAGAS = 100;

const Fundador: Model<IFundador> =
  (mongoose.models.Fundador as Model<IFundador>) ||
  mongoose.model<IFundador>('Fundador', FundadorSchema);

export default Fundador;
