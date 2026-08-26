import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * TIME inscrito numa competição.
 *
 * É a ponte entre o campeonato e o mundo: um time pode estar ligado a um clube
 * real do Clubs (`eaClubId`) ou existir só aqui, cadastrado na mão. As duas
 * formas convivem de propósito — quem não acha o próprio clube na fonte da EA
 * (clube novo, plataforma errada, ou simplesmente a EA fora do ar) não pode
 * ficar de fora do campeonato por causa disso.
 *
 * O `elenco` é uma FOTOGRAFIA no momento da inscrição, não um espelho vivo.
 * Um jogador que troca de clube no meio do campeonato não deve sumir da súmula
 * das partidas que já jogou — e é o que aconteceria se o elenco fosse lido da
 * EA a cada carga.
 */

export type OrigemTime = 'ea' | 'manual';

export interface IGameTime extends Document {
  competicaoId: mongoose.Types.ObjectId;
  nome: string;
  /** Três letras para caber na tabela e no chaveamento. */
  sigla?: string;
  origem: OrigemTime;
  eaClubId?: string;
  plataforma?: 'common-gen5' | 'common-gen4';
  /** Cor do clube (do uniforme da EA, ou escolhida na inscrição). */
  cor?: string;
  grupo?: string;
  /** Semente do chaveamento: 1 é o primeiro cabeça de chave. */
  semente?: number;
  capitaoUserId?: mongoose.Types.ObjectId;
  elenco: Array<{
    gamertag: string;
    proName?: string;
    posicao?: string;
    overall?: number;
    /** Conta FayAI, quando o jogador reivindicou a gamertag. */
    userId?: mongoose.Types.ObjectId;
  }>;
  /** Escala de evidência do plano: B = fonte pública da EA, E = declarado. */
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameTimeSchema = new Schema<IGameTime>(
  {
    competicaoId: { type: Schema.Types.ObjectId, ref: 'GameCompeticao', required: true, index: true },
    nome: { type: String, required: true },
    sigla: { type: String, maxlength: 4 },
    origem: { type: String, enum: ['ea', 'manual'], default: 'manual' },
    eaClubId: { type: String, index: true },
    plataforma: { type: String, enum: ['common-gen5', 'common-gen4'] },
    cor: { type: String },
    grupo: { type: String },
    semente: { type: Number },
    capitaoUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    elenco: [
      {
        gamertag: { type: String, required: true },
        proName: { type: String },
        posicao: { type: String },
        overall: { type: Number },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'E' },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'game_times' }
);

/** Um clube da EA não entra duas vezes na mesma competição. */
GameTimeSchema.index(
  { competicaoId: 1, eaClubId: 1 },
  { unique: true, partialFilterExpression: { eaClubId: { $type: 'string' } } }
);
/** Nem dois times com o mesmo nome — a tabela ficaria ilegível. */
GameTimeSchema.index({ competicaoId: 1, nome: 1 }, { unique: true });

const GameTime: Model<IGameTime> =
  mongoose.models.GameTime || mongoose.model<IGameTime>('GameTime', GameTimeSchema);

export default GameTime;
