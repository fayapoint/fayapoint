import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Espelho das tabelas ESTÁTICAS da EA — hoje, só as regras das 10 divisões
 * (`settings`: quantos pontos promovem, seguram e dão título em cada uma).
 *
 * Parece pequeno demais para ter coleção própria, e teria mesmo se a fonte
 * respondesse. Mas o `settings` cai no mesmo HTTP 403 que a EA devolve para IP
 * de datacenter (ver `GameEaClube`), e sem ele a régua "cai / permanece / sobe"
 * da central e a escada de divisões da landing somem em produção — sem erro,
 * sem aviso, só um bloco que não aparece.
 *
 * `chave` é o nome da tabela; `valor` é o conteúdo já normalizado. Guardar
 * assim evita uma coleção nova a cada tabela estática que a EA acrescentar.
 */

export interface IGameEaConfig extends Document {
  chave: string;
  valor: unknown;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameEaConfigSchema = new Schema<IGameEaConfig>(
  {
    chave: { type: String, required: true, unique: true },
    valor: { type: Schema.Types.Mixed, required: true },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'game_ea_config' }
);

const GameEaConfig: Model<IGameEaConfig> =
  mongoose.models.GameEaConfig ||
  mongoose.model<IGameEaConfig>('GameEaConfig', GameEaConfigSchema);

export default GameEaConfig;
