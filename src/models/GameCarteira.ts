import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * A CARTEIRA DE FICHAS do Winners 22 — 08/09/2026.
 *
 * ## Por que uma carteira SEPARADA dos créditos do site
 *
 * O site já tem `User.credits`, e a tentação era apostar com ele. Não pode, e
 * o motivo não é arquitetura — é lei. O crédito do site é atrelado ao real
 * (o próprio extrato diz "100 créditos (= R$100)"), foi comprado com dinheiro
 * e vale dinheiro. Apostar com ele é apostar com dinheiro, e no Brasil isso
 * exige autorização da SPA/Ministério da Fazenda, com outorga de R$ 30 milhões
 * e domínio `.bet.br` (Lei 14.790/2023).
 *
 * A FICHA é outra coisa: nasce de graça, não se compra, não se converte em
 * crédito, não se saca e não vale nada fora daqui. É pontuação de jogo, e é
 * por isso que o Winners 22 pode existir hoje.
 *
 * ## O costurado para o futuro
 *
 * `moeda` existe desde o primeiro dia justamente para o dia em que houver
 * licença: a carteira de real seria `moeda: 'brl'`, com o MESMO extrato e a
 * MESMA liquidação. Hoje `'brl'` é **recusado** em `creditar`/`debitar` — o
 * campo é uma costura preparada, não uma porta aberta. Um `enum` que já aceita
 * o valor perigoso é um acidente esperando o dia em que alguém escrever a
 * string certa por engano.
 */

export type MoedaCarteira = 'ficha' | 'brl';

export interface IGameCarteira extends Document {
  userId: mongoose.Types.ObjectId;
  moeda: MoedaCarteira;
  /** Fichas disponíveis. Inteiro sempre — ficha não tem centavo. */
  saldo: number;
  /** Fichas presas em apostas ainda não liquidadas. Só para exibição. */
  emJogo: number;
  totalApostado: number;
  totalGanho: number;
  /** Quantas fichas a conta já recebeu de graça (bônus + recarga). */
  totalRecebido: number;
  /**
   * Limites de jogo responsável. Não é enfeite: mesmo com ficha de brinquedo,
   * o hábito que a pessoa treina aqui é o que ela leva para uma casa de
   * verdade — e ali o dinheiro é dela.
   */
  limiteDiario?: number;
  /** Autoexclusão: enquanto esta data for futura, a conta não aposta. */
  pausadoAte?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameCarteiraSchema = new Schema<IGameCarteira>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moeda: { type: String, enum: ['ficha', 'brl'], default: 'ficha' },
    saldo: { type: Number, default: 0, min: 0 },
    emJogo: { type: Number, default: 0, min: 0 },
    totalApostado: { type: Number, default: 0 },
    totalGanho: { type: Number, default: 0 },
    totalRecebido: { type: Number, default: 0 },
    limiteDiario: { type: Number },
    pausadoAte: { type: Date },
  },
  { timestamps: true, collection: 'game_carteiras' }
);

/** Uma carteira por pessoa por moeda. É o que impede saldo duplicado. */
GameCarteiraSchema.index({ userId: 1, moeda: 1 }, { unique: true });

const GameCarteira: Model<IGameCarteira> =
  mongoose.models.GameCarteira ||
  mongoose.model<IGameCarteira>('GameCarteira', GameCarteiraSchema);

export default GameCarteira;
