import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * CANDIDATURA — alguém respondeu a uma vaga do Mercado.
 *
 * É o que substitui o "comenta que te chamo no WhatsApp" dos grupos: em vez de
 * a conversa se perder num fio de comentários, a manifestação de interesse fica
 * ligada à vaga e ao usuário, e o dono da vaga a vê reunida. O contato do
 * anunciante só é revelado DEPOIS da candidatura — assim o Mercado não vira uma
 * lista pública de WhatsApps para robô raspar, que é metade do lixo do grupo.
 *
 * O índice único (vaga + candidato) impede a mesma pessoa de inflar o contador
 * clicando dez vezes.
 */

export interface IGameCandidatura extends Document {
  vagaId: mongoose.Types.ObjectId;
  deUserId: mongoose.Types.ObjectId;
  /** Recado curto para o dono da vaga. */
  mensagem?: string;
  /** Gamertag/contato que o candidato quer que o dono use. */
  contato?: string;
  posicao?: string;
  overall?: number;
  createdAt: Date;
  updatedAt: Date;
}

const GameCandidaturaSchema = new Schema<IGameCandidatura>(
  {
    vagaId: { type: Schema.Types.ObjectId, ref: 'GameVaga', required: true, index: true },
    deUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mensagem: { type: String, trim: true, maxlength: 500 },
    contato: { type: String, trim: true, maxlength: 200 },
    posicao: { type: String },
    overall: { type: Number },
  },
  { timestamps: true, collection: 'game_candidaturas' }
);

/** Uma candidatura por pessoa por vaga. */
GameCandidaturaSchema.index({ vagaId: 1, deUserId: 1 }, { unique: true });

const GameCandidatura: Model<IGameCandidatura> =
  mongoose.models.GameCandidatura ||
  mongoose.model<IGameCandidatura>('GameCandidatura', GameCandidaturaSchema);

export default GameCandidatura;
