import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Pré-inscrição na liga piloto da seção /game (Fase 0 do PLANO_GAME).
 *
 * Ainda não é a inscrição formal numa competição — é a fila de interesse que
 * alimenta a seleção dos 8–16 clubes do piloto de outubro. Por isso aceita
 * visitante sem conta (só e-mail) E usuário logado; quando os dois existem,
 * `userId` liga os registros.
 */

export interface IGameInteresse extends Document {
  email: string;
  userId?: mongoose.Types.ObjectId;
  /** Papel de quem se inscreve no piloto. */
  role: 'captain' | 'player' | 'organizer' | 'fan';
  clubName?: string;
  eaClubId?: string;
  platform?: string;
  psnOrGamertag?: string;
  message?: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

const GameInteresseSchema = new Schema<IGameInteresse>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['captain', 'player', 'organizer', 'fan'],
      default: 'player',
    },
    clubName: { type: String, trim: true },
    eaClubId: { type: String },
    platform: { type: String },
    psnOrGamertag: { type: String, trim: true },
    message: { type: String, maxlength: 2000 },
    locale: { type: String, default: 'pt-BR' },
  },
  { timestamps: true, collection: 'game_interesse' }
);

// O mesmo e-mail pode atualizar a inscrição, não duplicá-la por papel.
GameInteresseSchema.index({ email: 1, role: 1 }, { unique: true });

const GameInteresse: Model<IGameInteresse> =
  mongoose.models.GameInteresse ||
  mongoose.model<IGameInteresse>('GameInteresse', GameInteresseSchema);

export default GameInteresse;
