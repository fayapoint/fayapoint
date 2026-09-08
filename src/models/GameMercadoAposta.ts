import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * MERCADO DE APOSTA — as opções cotadas de um evento.
 *
 * ⚠️ Não confundir com o MERCADO DE TRANSFERÊNCIAS da seção (`GameVaga` /
 * `game_vagas`). São dois "mercados" no mesmo produto, e a única defesa contra
 * a confusão é o nome do arquivo dizer qual é qual.
 *
 * ## Por que a odd é gravada, e não calculada na hora de ler
 *
 * Seria mais "limpo" recalcular o preço a cada visita a partir da força dos
 * times. Seria errado: a odd é um CONTRATO. Quem apostou em 2,40 tem direito
 * a 2,40, mesmo que meia hora depois o modelo mude de ideia. Gravar a cotação
 * — e copiá-la para dentro do cupom no momento da aposta — é o que torna esse
 * direito verificável.
 *
 * `probabilidade` viaja junto, sem margem, porque a casa mostra o que acha que
 * vai acontecer. É o oposto do que uma casa de verdade faz, e é de propósito:
 * aqui o produto é aprender como o preço se forma.
 */

export type StatusMercado = 'aberto' | 'fechado' | 'liquidado' | 'anulado';

export interface SelecaoMercado {
  chave: string;
  rotulo: string;
  probabilidade: number;
  odd: number;
  /** Preenchido na liquidação. Antes disso é indefinido, nunca 'perdida'. */
  resultado?: string;
}

export interface IGameMercadoAposta extends Document {
  eventoId: mongoose.Types.ObjectId;
  /** `1x2`, `total-gols:4.5`, `jogador-marca:123:Fulano`… único por evento. */
  chave: string;
  tipo: string;
  familia: string;
  titulo: string;
  parametro?: string;
  selecoes: SelecaoMercado[];
  /** A margem que este mercado carrega. Vai a tela — a casa não a esconde. */
  margem: number;
  status: StatusMercado;
  /** Ordem de exibição: o cardápio tem uma sequência pensada, não alfabética. */
  ordem: number;
  createdAt: Date;
  updatedAt: Date;
}

const GameMercadoApostaSchema = new Schema<IGameMercadoAposta>(
  {
    eventoId: { type: Schema.Types.ObjectId, ref: 'GameEvento', required: true, index: true },
    chave: { type: String, required: true },
    tipo: { type: String, required: true },
    familia: { type: String, required: true },
    titulo: { type: String, required: true },
    parametro: { type: String },
    selecoes: [
      {
        _id: false,
        chave: { type: String, required: true },
        rotulo: { type: String, required: true },
        probabilidade: { type: Number, required: true },
        odd: { type: Number, required: true },
        resultado: { type: String },
      },
    ],
    margem: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['aberto', 'fechado', 'liquidado', 'anulado'],
      default: 'aberto',
    },
    ordem: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'game_mercados_aposta' }
);

/** Um mercado não entra duas vezes no mesmo evento — nem por corrida de cron. */
GameMercadoApostaSchema.index({ eventoId: 1, chave: 1 }, { unique: true });

const GameMercadoAposta: Model<IGameMercadoAposta> =
  mongoose.models.GameMercadoAposta ||
  mongoose.model<IGameMercadoAposta>('GameMercadoAposta', GameMercadoApostaSchema);

export default GameMercadoAposta;
