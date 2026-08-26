import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * CONFRONTO — um jogo da competição.
 *
 * É o documento onde o campeonato encosta na realidade, e por isso ele carrega
 * duas coisas que uma tabela comum não teria:
 *
 * 1. **`eaMatchId`** — quando a partida jogada no Clubs é casada com este
 *    confronto, o placar deixa de ser declaração e passa a ser observação.
 *    `sourceGrade` sobe de E (alguém digitou) para B (a EA publicou).
 *    O casamento é por janela de tempo + placar + elenco, NUNCA por hora exata:
 *    o timestamp da EA tem fuso inconsistente (+1h/+2h conforme o título).
 *
 * 2. **`confirmadoPor`** — o resultado por consenso do PLANO_GAME §Fase 1: os
 *    dois capitães confirmam, e a divergência vira pendência para o
 *    organizador. Sem isso, o placar é a palavra de quem digitou primeiro.
 *
 * `destaques` guarda quem marcou, quem deu assistência e as notas — é a
 * matéria-prima da artilharia e do pôster do campeão, e ele precisa sobreviver
 * ao clube que some da fonte da EA.
 */

export type FaseConfronto =
  | 'liga'
  | 'grupo'
  | 'trigesima-segunda'
  | 'decima-sexta'
  | 'oitavas'
  | 'quartas'
  | 'semi'
  | 'terceiro'
  | 'final';

export type StatusConfronto = 'agendado' | 'aguardando' | 'confirmado' | 'wo' | 'cancelado';

export interface IGameConfronto extends Document {
  competicaoId: mongoose.Types.ObjectId;
  fase: FaseConfronto;
  rodada: number;
  grupo?: string;
  /** Posição no chaveamento. Duas chaves da fase alimentam uma da seguinte. */
  chave?: number;
  /** 1 = ida, 2 = volta. Só existe em mata-mata de dois jogos. */
  perna?: number;
  mandanteId?: mongoose.Types.ObjectId;
  visitanteId?: mongoose.Types.ObjectId;
  golsMandante?: number;
  golsVisitante?: number;
  status: StatusConfronto;
  dataPrevista?: Date;
  jogadaEm?: Date;
  /** A partida da EA que comprova este confronto, quando casada. */
  eaMatchId?: string;
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  confirmadoPor: mongoose.Types.ObjectId[];
  destaques?: {
    gols: Array<{ gamertag: string; timeId?: mongoose.Types.ObjectId; quantidade: number }>;
    assistencias: Array<{ gamertag: string; timeId?: mongoose.Types.ObjectId; quantidade: number }>;
    craque?: { gamertag: string; nota?: number };
    notas?: Array<{ gamertag: string; nota: number; posicao?: string }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GameConfrontoSchema = new Schema<IGameConfronto>(
  {
    competicaoId: { type: Schema.Types.ObjectId, ref: 'GameCompeticao', required: true, index: true },
    fase: {
      type: String,
      enum: [
        'liga',
        'grupo',
        'trigesima-segunda',
        'decima-sexta',
        'oitavas',
        'quartas',
        'semi',
        'terceiro',
        'final',
      ],
      required: true,
    },
    rodada: { type: Number, default: 1 },
    grupo: { type: String },
    chave: { type: Number },
    perna: { type: Number },
    mandanteId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
    visitanteId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
    golsMandante: { type: Number },
    golsVisitante: { type: Number },
    status: {
      type: String,
      enum: ['agendado', 'aguardando', 'confirmado', 'wo', 'cancelado'],
      default: 'agendado',
    },
    dataPrevista: { type: Date },
    jogadaEm: { type: Date },
    eaMatchId: { type: String, index: true },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'E' },
    confirmadoPor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    destaques: {
      gols: [
        {
          gamertag: String,
          timeId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
          quantidade: Number,
        },
      ],
      assistencias: [
        {
          gamertag: String,
          timeId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
          quantidade: Number,
        },
      ],
      craque: { gamertag: String, nota: Number },
      notas: [{ gamertag: String, nota: Number, posicao: String }],
    },
  },
  { timestamps: true, collection: 'game_confrontos' }
);

/** O calendário e a tabela leem por competição, em ordem de rodada. */
GameConfrontoSchema.index({ competicaoId: 1, fase: 1, rodada: 1, chave: 1 });

const GameConfronto: Model<IGameConfronto> =
  mongoose.models.GameConfronto ||
  mongoose.model<IGameConfronto>('GameConfronto', GameConfrontoSchema);

export default GameConfronto;
