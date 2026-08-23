import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Clube de futebol virtual vinculado por um usuário do site (seção /game).
 *
 * O vínculo NÃO guarda credencial nenhuma da EA: o clubId vem da busca na API
 * pública de Clubs, e o snapshot abaixo é só a última leitura dela — a fonte
 * da verdade continua sendo a EA, re-lida quando a página do clube abre.
 * `sourceGrade` acompanha a escala do plano (A = telemetria assinada …
 * E = manual); tudo que nasce da API pública entra como "B".
 */

export type GamePlatform = 'common-gen5' | 'common-gen4';

export interface IGameClub extends Document {
  eaClubId: string;
  platform: GamePlatform;
  name: string;
  /** Usuário do site que reivindicou o clube (capitão/dono). */
  ownerUserId: mongoose.Types.ObjectId;
  crestAssetId?: string;
  regionId?: number;
  snapshot: {
    wins: number;
    losses: number;
    ties: number;
    gamesPlayed: number;
    goals: number;
    goalsAgainst: number;
    skillRating?: number;
    memberCount?: number;
    capturedAt?: Date;
  };
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameClubSchema = new Schema<IGameClub>(
  {
    eaClubId: { type: String, required: true, index: true },
    platform: { type: String, enum: ['common-gen5', 'common-gen4'], default: 'common-gen5' },
    name: { type: String, required: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crestAssetId: { type: String },
    regionId: { type: Number },
    snapshot: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      ties: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      goals: { type: Number, default: 0 },
      goalsAgainst: { type: Number, default: 0 },
      skillRating: { type: Number },
      memberCount: { type: Number },
      capturedAt: { type: Date },
    },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'B' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'game_clubs' }
);

// Um usuário não vincula o mesmo clube duas vezes na mesma plataforma.
GameClubSchema.index({ eaClubId: 1, platform: 1, ownerUserId: 1 }, { unique: true });

const GameClub: Model<IGameClub> =
  mongoose.models.GameClub || mongoose.model<IGameClub>('GameClub', GameClubSchema);

export default GameClub;
