import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * O EXTRATO da carteira de fichas — um documento por movimento.
 *
 * ## Por que coleção própria, e não um array dentro da carteira
 *
 * `User.credits.history` guarda os lançamentos dentro do usuário, com
 * `$slice: -200`. Funciona para crédito de curso, onde ninguém movimenta 200
 * vezes. Não serve aqui: um apostador ativo passa de 200 lançamentos em uma
 * semana, e o corte apagaria justamente o começo — a parte que prova de onde
 * veio o saldo.
 *
 * Sendo coleção, o extrato é **append-only**: nada aqui é editado, nunca. Se
 * um lançamento estiver errado, o conserto é um lançamento de ajuste em
 * sentido contrário, com motivo. É a mesma disciplina de um livro-caixa, e ela
 * existe porque o saldo é a única coisa que o apostador não pode ter de
 * aceitar na palavra da casa.
 *
 * `saldoDepois` é gravado de propósito, mesmo sendo derivável: ele deixa
 * qualquer pessoa conferir a corrente inteira sem refazer a soma desde o
 * começo, e denuncia na hora um saldo que andou por fora do extrato.
 */

export type TipoLancamento =
  | 'bonus-boas-vindas'
  | 'recarga-diaria'
  | 'aposta'
  | 'premio'
  | 'devolucao'
  | 'ajuste'
  | 'premiacao-campeonato'
  | 'multa';

export interface IGameLancamento extends Document {
  userId: mongoose.Types.ObjectId;
  carteiraId: mongoose.Types.ObjectId;
  tipo: TipoLancamento;
  /** Positivo entra, negativo sai. Nunca zero. */
  valor: number;
  saldoDepois: number;
  descricao: string;
  apostaId?: mongoose.Types.ObjectId;
  eventoId?: mongoose.Types.ObjectId;
  /**
   * Chave de idempotência. Duas liquidações da mesma aposta (retentativa de
   * cron, clique duplo, reprocessamento) produzem a MESMA chave, e o índice
   * único abaixo recusa a segunda. Sem isto, pagar duas vezes é questão de
   * tempo — é o defeito mais comum de sistema de saldo.
   */
  chaveUnica?: string;
  createdAt: Date;
}

const GameLancamentoSchema = new Schema<IGameLancamento>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    carteiraId: { type: Schema.Types.ObjectId, ref: 'GameCarteira', required: true },
    tipo: {
      type: String,
      enum: [
        'bonus-boas-vindas',
        'recarga-diaria',
        'aposta',
        'premio',
        'devolucao',
        'ajuste',
        'premiacao-campeonato',
        'multa',
      ],
      required: true,
    },
    valor: { type: Number, required: true },
    saldoDepois: { type: Number, required: true },
    descricao: { type: String, required: true },
    apostaId: { type: Schema.Types.ObjectId, ref: 'GameAposta' },
    eventoId: { type: Schema.Types.ObjectId, ref: 'GameEvento' },
    chaveUnica: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'game_lancamentos' }
);

/** O extrato da pessoa, do mais recente para trás. */
GameLancamentoSchema.index({ userId: 1, createdAt: -1 });
/**
 * O pagamento em duplicidade morre aqui. `sparse` porque lançamento sem chave
 * (um ajuste manual, por exemplo) é legítimo e não deve colidir com os outros
 * sem chave.
 */
GameLancamentoSchema.index({ chaveUnica: 1 }, { unique: true, sparse: true });

const GameLancamento: Model<IGameLancamento> =
  mongoose.models.GameLancamento ||
  mongoose.model<IGameLancamento>('GameLancamento', GameLancamentoSchema);

export default GameLancamento;
