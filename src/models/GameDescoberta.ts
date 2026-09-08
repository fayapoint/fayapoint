import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * CANDIDATO A CAMPEONATO — o que o descobridor achou sozinho. 08/09/2026.
 *
 * ## Por que ele não é um `GameCopa`
 *
 * `descobrirAglomerados` acha grupos de clubes que jogam amistoso 11v11 em
 * série entre si — a assinatura de um torneio organizado. Mas ele **não sabe o
 * nome do campeonato**, nem quem organiza, nem o formato. Ele entrega "estes 14
 * clubes formam um torneio", e mais nada.
 *
 * Virar `GameCopa` direto seria inventar autoridade: a copa publicada tem nome,
 * organização e presidentes, e nada disso está no rastro. O apelido que o
 * descobridor gera (`apelidoDoAglomerado`) é PALPITE, e palpite não vira
 * cabeçalho de página.
 *
 * Então o candidato vive aqui, num documento que diz o que é: um achado à
 * espera de alguém pôr nome nele.
 *
 * ## Por que precisa existir em vez de só sair no log
 *
 * Antes disto, a descoberta rodava de hora em hora e imprimia uma linha no
 * `coletar.log`. Se ela achasse a próxima Super Copa amanhã de madrugada, a
 * notícia morreria num arquivo que ninguém lê — e no turno seguinte a mesma
 * linha seria reimpressa, sem ninguém nunca decidir nada.
 *
 * É a família de defeito que já custou 17 dias de auditoria parada nesta casa:
 * processo automático que só fala com um log. Aqui o achado fica, acumula
 * evidência a cada rodada, e tem ESTADO — que é o que permite a alguém dizer
 * "já olhei esse, não é torneio" e a busca parar de insistir.
 */

export type EstadoDescoberta =
  /** Achado agora, ninguém olhou. */
  | 'novo'
  /** Alguém está apurando quem são. */
  | 'investigando'
  /** Olhado e recusado — não é torneio, ou não interessa cobrir. */
  | 'descartado'
  /** Virou cobertura: existe um `GameCopa` para ele. */
  | 'promovido';

export interface IGameDescoberta extends Document {
  /**
   * A identidade do aglomerado, derivada dos clubes que o formam.
   *
   * Não é o nome nem o id do maior clube, de propósito: um torneio ganha e
   * perde participante entre rodadas, e a chave precisa sobreviver a isso sem
   * criar um candidato novo a cada semana. Ver `chaveDoAglomerado`.
   */
  chave: string;
  plataforma: string;
  /** Palpite de nome, tirado do que os clubes têm em comum. NUNCA é fato. */
  apelido: string;
  clubes: Array<{ clubId: string; nome: string; jogos: number }>;
  confrontos: number;
  series: number;
  /** Séries por clube — o que separa torneio de clube-polo. */
  densidade: number;
  partidas: number;
  forca: number;
  primeiraEm?: Date;
  ultimaEm?: Date;
  estado: EstadoDescoberta;
  /** Quando um humano mexeu no estado, e quem. */
  decididoEm?: Date;
  decididoPor?: mongoose.Types.ObjectId;
  motivo?: string;
  /** A copa que nasceu deste candidato, quando `promovido`. */
  copaSlug?: string;
  /** Quantas rodadas do descobridor reencontraram este aglomerado. */
  vezesVisto: number;
  createdAt: Date;
  updatedAt: Date;
}

const GameDescobertaSchema = new Schema<IGameDescoberta>(
  {
    chave: { type: String, required: true },
    plataforma: { type: String, default: 'common-gen5' },
    apelido: { type: String, required: true },
    clubes: [
      {
        _id: false,
        clubId: { type: String, required: true },
        nome: { type: String, required: true },
        jogos: { type: Number, default: 0 },
      },
    ],
    confrontos: { type: Number, default: 0 },
    series: { type: Number, default: 0 },
    densidade: { type: Number, default: 0 },
    partidas: { type: Number, default: 0 },
    forca: { type: Number, default: 0 },
    primeiraEm: { type: Date },
    ultimaEm: { type: Date },
    estado: {
      type: String,
      enum: ['novo', 'investigando', 'descartado', 'promovido'],
      default: 'novo',
      index: true,
    },
    decididoEm: { type: Date },
    decididoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    motivo: { type: String },
    copaSlug: { type: String },
    vezesVisto: { type: Number, default: 1 },
  },
  { timestamps: true, collection: 'game_descobertas' }
);

/** Um aglomerado é um candidato só. Reencontrar atualiza; nunca duplica. */
GameDescobertaSchema.index({ chave: 1, plataforma: 1 }, { unique: true });
/** A fila de quem precisa ser olhado, do sinal mais forte para o mais fraco. */
GameDescobertaSchema.index({ estado: 1, forca: -1 });

const GameDescoberta: Model<IGameDescoberta> =
  mongoose.models.GameDescoberta ||
  mongoose.model<IGameDescoberta>('GameDescoberta', GameDescobertaSchema);

export default GameDescoberta;
