import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ESPELHO das partidas da EA — um documento por partida.
 *
 * Par do `GameEaClube`, pelo mesmo motivo (a EA devolve 403 para IP de
 * datacenter; ver o cabeçalho daquele arquivo). Aqui, porém, o espelho não é só
 * um plano B — **ele é a única forma de ter histórico**:
 *
 * A EA devolve no máximo **10 partidas por tipo** (30 no total) e não tem
 * paginação nem consulta por `matchId`. Tudo que passa disso a fonte descarta.
 * Cada captura guarda o que a janela mostrava naquele momento; em algumas
 * semanas de captura diária, isto vira um acervo que a própria EA não tem.
 *
 * Por isso a gravação é **por `matchId`, com upsert**: capturar de novo não
 * duplica e não apaga o que saiu da janela.
 */

export type GamePlatform = 'common-gen5' | 'common-gen4';
export type MatchType = 'leagueMatch' | 'playoffMatch' | 'friendlyMatch';

export interface IGameEaPartida extends Document {
  matchId: string;
  platform: GamePlatform;
  matchType: MatchType;
  /** Epoch em segundos, como a EA manda (fuso inconsistente — nunca casar por hora). */
  timestamp: number;
  jogadaEm: Date;
  /** Os dois clubes, para achar a partida por qualquer um dos lados. */
  clubIds: string[];
  /** O `ClubMatch` normalizado inteiro — placar, elenco e estatística por jogador. */
  dados: Record<string, unknown>;
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameEaPartidaSchema = new Schema<IGameEaPartida>(
  {
    matchId: { type: String, required: true },
    platform: { type: String, enum: ['common-gen5', 'common-gen4'], required: true },
    matchType: {
      type: String,
      enum: ['leagueMatch', 'playoffMatch', 'friendlyMatch'],
      required: true,
    },
    timestamp: { type: Number, required: true },
    jogadaEm: { type: Date, required: true },
    clubIds: { type: [String], required: true, index: true },
    dados: { type: Schema.Types.Mixed, required: true },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'B' },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'game_ea_partidas' }
);

/** Uma partida é uma só. Recapturar atualiza; nunca duplica. */
GameEaPartidaSchema.index({ matchId: 1, platform: 1 }, { unique: true });
/** O calendário do clube sai daqui, do jogo mais recente para trás. */
GameEaPartidaSchema.index({ clubIds: 1, timestamp: -1 });

const GameEaPartida: Model<IGameEaPartida> =
  mongoose.models.GameEaPartida ||
  mongoose.model<IGameEaPartida>('GameEaPartida', GameEaPartidaSchema);

export default GameEaPartida;
