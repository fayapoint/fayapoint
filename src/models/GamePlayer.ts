import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Jogador (o "Pro") de Clubs reivindicado por um usuário do site (seção /game).
 *
 * É o par do `GameClub`: aquele liga o CLUBE a uma conta, este liga a GAMERTAG.
 * Sem ele, a estatística individual não segue a pessoa — ela some junto com o
 * clube quando o jogador troca de time, que é o caso mais comum no Clubs.
 *
 * Como no clube, nenhuma credencial da EA entra aqui. O vínculo é uma
 * REIVINDICAÇÃO: o usuário aponta o próprio nome dentro do elenco que a EA
 * publica. A prova de posse (código de verificação no nome do Pro, ou o
 * consentimento oficial do programa FC Community API) entra na Fase 1 —
 * `verified` já existe para não haver migração quando ela chegar.
 */

export type GamePlatform = 'common-gen5' | 'common-gen4';

export interface IGamePlayer extends Document {
  /** Gamertag como a EA publica no elenco. É a chave de identidade. */
  gamertag: string;
  platform: GamePlatform;
  /** Clube em que a gamertag foi encontrada no momento da reivindicação. */
  eaClubId: string;
  clubName?: string;
  /** Nome do avatar dentro do jogo ("M. Camilo"). Muda; a gamertag, não. */
  proName?: string;
  proOverall?: number;
  favoritePosition?: string;
  ownerUserId: mongoose.Types.ObjectId;
  snapshot: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    ratingAve?: number;
    manOfTheMatch: number;
    winRate?: number;
    capturedAt?: Date;
  };
  /** Falso enquanto a posse não for provada — ver o comentário do topo. */
  verified: boolean;
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GamePlayerSchema = new Schema<IGamePlayer>(
  {
    gamertag: { type: String, required: true, index: true },
    platform: { type: String, enum: ['common-gen5', 'common-gen4'], default: 'common-gen5' },
    eaClubId: { type: String, required: true, index: true },
    clubName: { type: String },
    proName: { type: String },
    proOverall: { type: Number },
    favoritePosition: { type: String },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    snapshot: {
      gamesPlayed: { type: Number, default: 0 },
      goals: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      ratingAve: { type: Number },
      manOfTheMatch: { type: Number, default: 0 },
      winRate: { type: Number },
      capturedAt: { type: Date },
    },
    verified: { type: Boolean, default: false },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'B' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'game_players' }
);

/**
 * Uma gamertag pertence a UMA conta por plataforma. Sem esse índice, dois
 * usuários reivindicariam o mesmo jogador e a estatística individual da liga
 * nasceria ambígua — o tipo de defeito que não dá para consertar depois.
 */
GamePlayerSchema.index({ gamertag: 1, platform: 1 }, { unique: true });

const GamePlayer: Model<IGamePlayer> =
  mongoose.models.GamePlayer || mongoose.model<IGamePlayer>('GamePlayer', GamePlayerSchema);

export default GamePlayer;
