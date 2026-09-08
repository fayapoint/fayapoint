import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * O CUPOM — a aposta de uma pessoa. 08/09/2026.
 *
 * ## Por que a perna carrega uma CÓPIA do rótulo e da odd
 *
 * Parece duplicação boba: a perna já aponta para o mercado, e o mercado tem o
 * rótulo e a odd. Mas o mercado muda — ele é reprecificado, tem seleção
 * anulada, e um dia será apagado por limpeza. O cupom é a prova do que foi
 * combinado, e prova que depende de outro documento continuar existindo não é
 * prova. Cada perna guarda o que estava escrito na tela no segundo do clique.
 *
 * ## `status: 'parcial'`
 *
 * Existe porque handicap de linha quebrada produz meia-vitória: o cupom não
 * ganhou nem perdeu, devolveu parte. Sem esse estado, a tela teria de chamar
 * de "ganha" uma aposta que deu prejuízo — e o extrato desmentiria a tela.
 */

export type StatusAposta = 'pendente' | 'ganha' | 'perdida' | 'parcial' | 'anulada';
export type TipoAposta = 'simples' | 'multipla';

export interface PernaAposta {
  eventoId: mongoose.Types.ObjectId;
  eventoSlug: string;
  eventoNome: string;
  mercadoId: mongoose.Types.ObjectId;
  mercadoChave: string;
  mercadoTitulo: string;
  selecaoChave: string;
  selecaoRotulo: string;
  /** A odd do momento do clique. É ela que paga, nunca a atual. */
  odd: number;
  probabilidade: number;
  /** Preenchido na liquidação. */
  resultado?: string;
}

export interface IGameAposta extends Document {
  userId: mongoose.Types.ObjectId;
  carteiraId: mongoose.Types.ObjectId;
  tipo: TipoAposta;
  pernas: PernaAposta[];
  /** Fichas apostadas. Inteiro. */
  valor: number;
  /** Produto das odds das pernas, como estava no clique. */
  oddTotal: number;
  retornoPotencial: number;
  status: StatusAposta;
  /** Quanto voltou de fato. 0 enquanto pendente. */
  retorno: number;
  liquidadaEm?: Date;
  /**
   * A pessoa apostou em si mesma? Marcado na criação, não deduzido depois —
   * é o dado que o regulamento de integridade precisa e o que faz a tela
   * poder dizer "você apostou em você".
   */
  emSiMesmo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameApostaSchema = new Schema<IGameAposta>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    carteiraId: { type: Schema.Types.ObjectId, ref: 'GameCarteira', required: true },
    tipo: { type: String, enum: ['simples', 'multipla'], required: true },
    pernas: [
      {
        _id: false,
        eventoId: { type: Schema.Types.ObjectId, ref: 'GameEvento', required: true },
        eventoSlug: { type: String, required: true },
        eventoNome: { type: String, required: true },
        mercadoId: { type: Schema.Types.ObjectId, ref: 'GameMercadoAposta', required: true },
        mercadoChave: { type: String, required: true },
        mercadoTitulo: { type: String, required: true },
        selecaoChave: { type: String, required: true },
        selecaoRotulo: { type: String, required: true },
        odd: { type: Number, required: true },
        probabilidade: { type: Number, required: true },
        resultado: { type: String },
      },
    ],
    valor: { type: Number, required: true, min: 1 },
    oddTotal: { type: Number, required: true },
    retornoPotencial: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pendente', 'ganha', 'perdida', 'parcial', 'anulada'],
      default: 'pendente',
      index: true,
    },
    retorno: { type: Number, default: 0 },
    liquidadaEm: { type: Date },
    emSiMesmo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'game_apostas' }
);

/** "Minhas apostas", do mais recente para trás. */
GameApostaSchema.index({ userId: 1, createdAt: -1 });
/** A liquidação varre por evento: todo cupom que tem perna neste evento. */
GameApostaSchema.index({ 'pernas.eventoId': 1, status: 1 });

const GameAposta: Model<IGameAposta> =
  mongoose.models.GameAposta || mongoose.model<IGameAposta>('GameAposta', GameApostaSchema);

export default GameAposta;
