import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── QUEM TROUXE QUEM ─────────────────────────────────────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`
 *
 * Uma linha por conta indicada. É o vínculo que faz a comissão existir, e o
 * lugar onde a fraude é barrada.
 *
 * ## O índice único é a regra de negócio, não uma otimização
 *
 * `indicadoUserId` é único: **uma conta pertence a um indicador, para sempre**.
 * Sem isso, um segundo código digitado depois trocaria o dono da comissão — e
 * quem indicou de verdade perderia a renda para quem chegou por último. A
 * atribuição é do PRIMEIRO vínculo, e ele não se desfaz.
 *
 * ## `estado`, e por que "pendente" não é detalhe
 *
 * - `pendente` — o vínculo existe, o pagamento ainda não. Não conta marco, não
 *   gera comissão. É a maior parte das linhas, e tem de ser barata.
 * - `valida`   — houve pagamento confirmado. A partir daqui nascem `Comissao`.
 * - `anulada`  — autoindicação, mesmo CPF/aparelho/cartão, ou reembolso do
 *   primeiro pagamento. Fica gravada com o `motivo`: apagar esconderia o
 *   padrão de quem tenta de novo.
 *
 * ## `origem` serve para medir, não para enfeitar
 *
 * `url` (entrou por `/f/<codigo>`), `digitado` (escreveu no checkout) e
 * `cookie` (viu o código antes, converteu depois, dentro dos 90 dias que o
 * `lib/attribution.ts` já guardava). Se `cookie` responder por quase tudo, a
 * página de convite não está convertendo e o problema é ela, não a comissão.
 */

export type EstadoIndicacao = 'pendente' | 'valida' | 'anulada';

export interface IIndicacao extends Document {
  fundadorId: mongoose.Types.ObjectId;
  /** Denormalizado: o painel lista sem `$lookup` a cada linha. */
  codigo: string;
  indicadoUserId: mongoose.Types.ObjectId;
  indicadoEmail?: string;
  origem: 'url' | 'digitado' | 'cookie';
  estado: EstadoIndicacao;
  criadoEm: Date;
  primeiraConversaoEm?: Date;
  anuladaEm?: Date;
  motivo?: string;
  /**
   * Sinais colhidos no momento do vínculo, para a conferência de autoindicação.
   * IP em prefixo /24, como o `UsageEvent` já faz — separa pessoa sem virar
   * dossiê.
   */
  sinais?: {
    ipPrefixo?: string;
    agente?: string;
  };
}

const IndicacaoSchema = new Schema<IIndicacao>(
  {
    fundadorId: { type: Schema.Types.ObjectId, ref: 'Fundador', required: true, index: true },
    codigo: { type: String, required: true, lowercase: true, index: true },
    indicadoUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    indicadoEmail: { type: String },
    origem: { type: String, enum: ['url', 'digitado', 'cookie'], default: 'url' },
    estado: { type: String, enum: ['pendente', 'valida', 'anulada'], default: 'pendente', index: true },
    criadoEm: { type: Date, default: Date.now },
    primeiraConversaoEm: { type: Date },
    anuladaEm: { type: Date },
    motivo: { type: String },
    sinais: {
      ipPrefixo: { type: String },
      agente: { type: String },
    },
  },
  { collection: 'indicacoes' },
);

/** O teto diário por código vive aqui porque é a consulta que o valida. */
IndicacaoSchema.index({ fundadorId: 1, criadoEm: -1 });

const Indicacao: Model<IIndicacao> =
  (mongoose.models.Indicacao as Model<IIndicacao>) ||
  mongoose.model<IIndicacao>('Indicacao', IndicacaoSchema);

export default Indicacao;
