import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * EVENTO — a partida em que se pode apostar. 08/09/2026.
 *
 * ## A prova de honestidade (compromisso e revelação)
 *
 * O problema óbvio de uma casa que simula os próprios jogos: nada impede que
 * ela rode a simulação depois de ver as apostas e escolha o resultado que lhe
 * convém. Nenhuma promessa resolve isso — só matemática.
 *
 * A mecânica gravada aqui é a de compromisso e revelação:
 *
 *   1. Ao ABRIR o evento, sorteamos `sementeServidor` e publicamos apenas o
 *      `compromisso` = SHA-256 dela. A semente fica escondida.
 *   2. As apostas entram. A casa já não pode trocar a semente: qualquer outra
 *      teria outro hash, e o compromisso está publicado desde antes.
 *   3. Ao FECHAR, a semente final mistura a nossa semente com o `salPublico` —
 *      um resumo do que os apostadores fizeram (quanto entrou, quantos
 *      cupons). Nós não controlamos o sal; eles não conhecem a semente.
 *   4. Na liquidação, `sementeServidor` é publicada. Qualquer pessoa confere
 *      que o SHA-256 bate com o compromisso e reexecuta a partida gol a gol.
 *
 * Nenhum dos dois lados consegue escolher o resultado sozinho. É o mesmo
 * mecanismo dos cassinos "provably fair", e é a única razão pela qual faz
 * sentido apostar num jogo que a própria casa simula.
 */

export type StatusEvento = 'aberto' | 'fechado' | 'liquidado' | 'cancelado';
export type TipoEvento = 'simulado' | 'real';

/** O lado de um confronto, congelado no momento em que o evento nasceu. */
export interface LadoEvento {
  /** Time da competição, quando o evento pertence a um campeonato nosso. */
  timeId?: mongoose.Types.ObjectId;
  eaClubId?: string;
  nome: string;
  sigla?: string;
  cor?: string;
  nota: number;
  /** A força usada para precificar — vai ao laudo público do evento. */
  forca: { ataque: number; defesa: number };
  elenco: Array<{
    gamertag: string;
    posicao: string;
    golsPorJogo?: number;
    assistenciasPorJogo?: number;
    userId?: mongoose.Types.ObjectId;
  }>;
}

export interface IGameEvento extends Document {
  slug: string;
  tipo: TipoEvento;
  competicaoId?: mongoose.Types.ObjectId;
  rodada?: number;
  mandante: LadoEvento;
  visitante: LadoEvento;
  status: StatusEvento;
  /** Quando as apostas fecham e a partida roda. */
  comecaEm: Date;
  /** Quanto as forças foram aproximadas (0 = cruas, 1 = idênticas). */
  equilibrio: number;
  /** SHA-256 da semente do servidor, publicado na abertura. */
  compromisso: string;
  /** A semente do servidor. ⚠️ Só sai para o público na liquidação. */
  sementeServidor: string;
  /** O resumo público das apostas, fixado no fechamento. */
  salPublico?: string;
  /** A semente que de fato rodou a partida. Derivada das duas acima. */
  sementeFinal?: number;
  resultado?: {
    golsMandante: number;
    golsVisitante: number;
    lances: Array<{
      minuto: number;
      tipo: string;
      timeId: string;
      gamertag: string;
      assistenteGamertag?: string;
    }>;
    jogadores: Array<{
      gamertag: string;
      timeId: string;
      posicao: string;
      gols: number;
      assistencias: number;
      chutes: number;
      passes: number;
      desarmes: number;
      defesas: number;
      nota: number;
      craque: boolean;
    }>;
  };
  totalApostado: number;
  totalCupons: number;
  liquidadoEm?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LadoSchema = new Schema<LadoEvento>(
  {
    timeId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
    eaClubId: { type: String },
    nome: { type: String, required: true },
    sigla: { type: String },
    cor: { type: String },
    nota: { type: Number, default: 50 },
    forca: {
      ataque: { type: Number, required: true },
      defesa: { type: Number, required: true },
    },
    elenco: [
      {
        gamertag: { type: String, required: true },
        posicao: { type: String, required: true },
        golsPorJogo: { type: Number },
        assistenciasPorJogo: { type: Number },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { _id: false }
);

const GameEventoSchema = new Schema<IGameEvento>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    tipo: { type: String, enum: ['simulado', 'real'], default: 'simulado' },
    competicaoId: { type: Schema.Types.ObjectId, ref: 'GameCompeticao', index: true },
    rodada: { type: Number },
    mandante: { type: LadoSchema, required: true },
    visitante: { type: LadoSchema, required: true },
    status: {
      type: String,
      enum: ['aberto', 'fechado', 'liquidado', 'cancelado'],
      default: 'aberto',
      index: true,
    },
    comecaEm: { type: Date, required: true, index: true },
    equilibrio: { type: Number, default: 0.5 },
    compromisso: { type: String, required: true },
    sementeServidor: { type: String, required: true },
    salPublico: { type: String },
    sementeFinal: { type: Number },
    resultado: {
      golsMandante: Number,
      golsVisitante: Number,
      lances: [
        {
          minuto: Number,
          tipo: String,
          timeId: String,
          gamertag: String,
          assistenteGamertag: String,
        },
      ],
      jogadores: [
        {
          gamertag: String,
          timeId: String,
          posicao: String,
          gols: Number,
          assistencias: Number,
          chutes: Number,
          passes: Number,
          desarmes: Number,
          defesas: Number,
          nota: Number,
          craque: Boolean,
        },
      ],
    },
    totalApostado: { type: Number, default: 0 },
    totalCupons: { type: Number, default: 0 },
    liquidadoEm: { type: Date },
  },
  { timestamps: true, collection: 'game_eventos' }
);

/** O saguão lista o que está aberto, do próximo a começar em diante. */
GameEventoSchema.index({ status: 1, comecaEm: 1 });
/** O varredor de liquidação procura por isto. */
GameEventoSchema.index({ status: 1, comecaEm: -1 });

const GameEvento: Model<IGameEvento> =
  mongoose.models.GameEvento || mongoose.model<IGameEvento>('GameEvento', GameEventoSchema);

export default GameEvento;
