import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * AVALIAÇÃO — o voto de um jogador em outro, o motor da REPUTAÇÃO.
 *
 * O objetivo do Ricardo, dito com todas as letras: "filtrar os melhores
 * jogadores para que no futuro tenhamos um banco de dados de bons jogadores que
 * vale a pena jogar com eles". Este documento é o tijolo desse banco — depois
 * de jogar, um player avalia o outro em categorias, e a média vira a estrela
 * que aparece no card do mercado e no perfil.
 *
 * ## Alvo por GAMERTAG, não por conta
 *
 * O avaliado é identificado pela `gamertag` (normalizada) + plataforma, não por
 * um `userId`, porque a maioria dos jogadores de Clubs ainda não tem conta na
 * FayAI — e a reputação precisa começar a se formar ANTES de a pessoa entrar.
 * Quando ela reivindica a gamertag (`GamePlayer`), a reputação já a espera.
 *
 * ## Anti-abuso
 *
 * Índice único (avaliador + alvo): um voto PERMANENTE por par, atualizável.
 * Assim a média é de avaliadores DISTINTOS — dez cliques da mesma pessoa não
 * inflam nada, e reavaliar depois de jogar de novo só corrige o próprio voto.
 * Ninguém avalia a si mesmo (barrado na API).
 */

export interface CategoriasAvaliacao {
  ataque: number;
  defesa: number;
  passe: number;
  coletivo: number;
  fairplay: number;
}

export interface IGameAvaliacao extends Document {
  avaliadorUserId: mongoose.Types.ObjectId;
  /** Gamertag normalizada do avaliado (minúscula, sem acento, espaços colapsados). */
  alvoGamertag: string;
  /** Gamertag como digitada, para exibir. */
  alvoGamertagDisplay: string;
  plataforma?: string;
  /** Conta do avaliado, quando a gamertag já foi reivindicada. */
  alvoUserId?: mongoose.Types.ObjectId;
  categorias: CategoriasAvaliacao;
  /** Média das cinco — desnormalizada para ordenar o banco sem recomputar. */
  media: number;
  comentario?: string;
  /** Confronto que originou o voto, quando houver. */
  confrontoId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const faixa = { type: Number, min: 1, max: 5, required: true };

const GameAvaliacaoSchema = new Schema<IGameAvaliacao>(
  {
    avaliadorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    alvoGamertag: { type: String, required: true, index: true },
    alvoGamertagDisplay: { type: String, required: true },
    plataforma: { type: String },
    alvoUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    categorias: {
      ataque: faixa,
      defesa: faixa,
      passe: faixa,
      coletivo: faixa,
      fairplay: faixa,
    },
    media: { type: Number, required: true, index: true },
    comentario: { type: String, trim: true, maxlength: 300 },
    confrontoId: { type: Schema.Types.ObjectId, ref: 'GameConfronto' },
  },
  { timestamps: true, collection: 'game_avaliacoes' }
);

/** Um voto permanente por par (avaliador → alvo). Reavaliar atualiza. */
GameAvaliacaoSchema.index({ avaliadorUserId: 1, alvoGamertag: 1 }, { unique: true });

const GameAvaliacao: Model<IGameAvaliacao> =
  mongoose.models.GameAvaliacao ||
  mongoose.model<IGameAvaliacao>('GameAvaliacao', GameAvaliacaoSchema);

export default GameAvaliacao;
