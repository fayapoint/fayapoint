import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * PRESENÇA — quem está no Winners 22 AGORA.
 *
 * É o que faz a área da comunidade "encher de gente": cada cliente ativo manda
 * um pulso a cada ~20s (`POST /api/game/presenca`), e este documento guarda o
 * último pulso. "Online agora" = pulso nos últimos ~45s.
 *
 * ## Por que Mongo com TTL, e não WebSocket
 *
 * A produção é serverless (Netlify) — não há processo de pé para segurar uma
 * conexão viva. A presença por PULSO + Mongo funciona em qualquer lugar: o
 * cliente pinga, o servidor conta os pulsos recentes. O índice TTL
 * (`expireAfterSeconds`) faz o Mongo apagar sozinho quem parou de pingar, sem
 * varredura nossa — presença velha some em ~2 min.
 *
 * ## Dois tipos
 *
 * `jogador` (logado) — tem `userId`, gamertag e avatar, e VIRA UM BONEQUINHO na
 * nuvem da comunidade. `visitante` (deslogado) — só conta no número de "pessoas
 * usando", sem rosto, chaveado por um `clientId` do navegador. Assim até quem
 * não entrou faz o contador subir, que é o pedido ("só de entrar você vê a
 * quantidade de pessoas").
 */

export type StatusPresenca = 'online' | 'procurando' | 'jogando';

export interface IGamePresenca extends Document {
  /** Chave natural: o userId (logado) ou 'anon:'+clientId (visitante). */
  chave: string;
  tipo: 'jogador' | 'visitante';
  userId?: mongoose.Types.ObjectId;
  gamertag?: string;
  /** Semente do avatar — o userId para o logado (boneco estável). */
  avatarSeed?: string;
  posicao?: string;
  overall?: number;
  status: StatusPresenca;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GamePresencaSchema = new Schema<IGamePresenca>(
  {
    chave: { type: String, required: true, unique: true },
    tipo: { type: String, enum: ['jogador', 'visitante'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    gamertag: { type: String, trim: true },
    avatarSeed: { type: String },
    posicao: { type: String },
    overall: { type: Number },
    status: { type: String, enum: ['online', 'procurando', 'jogando'], default: 'online' },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'game_presenca' }
);

/**
 * TTL: o Mongo apaga o documento 120s depois do último `lastSeen`. Quem parou
 * de pingar some sozinho — sem cron, sem varredura. (O "online agora" da tela
 * usa uma janela mais curta, ~45s; o TTL é só a faxina.)
 */
GamePresencaSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 120 });
/** A contagem e a nuvem leem por tipo, do pulso mais recente. */
GamePresencaSchema.index({ tipo: 1, lastSeen: -1 });

const GamePresenca: Model<IGamePresenca> =
  mongoose.models.GamePresenca ||
  mongoose.model<IGamePresenca>('GamePresenca', GamePresencaSchema);

export default GamePresenca;
