import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── O CÓDIGO ENVIADO PARA O CELULAR ──────────────────────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`, §7
 *
 * Guarda o **hash** do código, nunca o código. A diferença importa mais aqui do
 * que numa senha comum: são seis dígitos, o espaço de busca é minúsculo, e
 * qualquer leitura do banco (backup, log de consulta, um `find()` mal-intencionado
 * no painel de admin) entregaria a verificação de todo mundo que estivesse com
 * um código aberto naquele minuto.
 *
 * ## O TTL faz o trabalho da expiração
 *
 * `expiraEm` tem índice TTL: o Mongo apaga o documento sozinho quando o prazo
 * passa. Não há cron para esquecer de rodar, e a coleção não cresce — mesmo
 * desenho da presença do `/game`, que já provou funcionar no serverless.
 *
 * ⚠️ O TTL do Mongo roda a cada ~60s, então um documento pode sobreviver alguns
 * segundos ao próprio prazo. Por isso a rota **também** compara `expiraEm` na
 * hora de conferir: o TTL é faxina, não é a regra.
 *
 * ## Tentativas contadas no documento, não na sessão
 *
 * Cinco tentativas por código. Contar na sessão (cookie, memória do processo)
 * não serve: o serverless troca de instância entre uma tentativa e outra, e
 * quem está adivinhando só precisa abrir outra aba.
 */

export interface IVerificacaoTelefone extends Document {
  userId: mongoose.Types.ObjectId;
  /** Só dígitos, com DDI: `5521999998888`. */
  telefone: string;
  /** SHA-256 de `codigo + segredo`. O código em si não é guardado. */
  hash: string;
  tentativas: number;
  enviadoPor: 'whatsapp' | 'sms' | 'console';
  criadoEm: Date;
  expiraEm: Date;
}

const VerificacaoTelefoneSchema = new Schema<IVerificacaoTelefone>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    telefone: { type: String, required: true },
    hash: { type: String, required: true },
    tentativas: { type: Number, default: 0 },
    enviadoPor: { type: String, enum: ['whatsapp', 'sms', 'console'], default: 'console' },
    criadoEm: { type: Date, default: Date.now },
    expiraEm: { type: Date, required: true },
  },
  { collection: 'verificacoes_telefone' },
);

VerificacaoTelefoneSchema.index({ expiraEm: 1 }, { expireAfterSeconds: 0 });

const VerificacaoTelefone: Model<IVerificacaoTelefone> =
  (mongoose.models.VerificacaoTelefone as Model<IVerificacaoTelefone>) ||
  mongoose.model<IVerificacaoTelefone>('VerificacaoTelefone', VerificacaoTelefoneSchema);

export default VerificacaoTelefone;
