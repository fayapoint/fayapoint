import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ESPELHO da fonte pública da EA — um documento por (clubId, plataforma).
 *
 * ## Por que este espelho existe
 *
 * Medido em 25/08/2026: **a EA responde HTTP 403 para IP de datacenter.** Do PC
 * do Ricardo (IP residencial) todos os endpoints respondem 200; da função da
 * Netlify e da VPS da Hostinger, 403 em tudo. Consequência: a seção /game
 * funcionava no desenvolvimento e devolvia lista vazia em produção — e nada na
 * tela dizia por quê, porque o cliente engole a falha e devolve `null`.
 *
 * Não há conserto do lado do servidor: nenhuma máquina nossa hospedada escapa do
 * bloqueio. A saída é inverter o fluxo — **quem lê a EA é uma máquina com IP
 * residencial** (`scripts/game/espelhar-ea.mjs`, rodado do PC ou por tarefa
 * agendada), que grava aqui; a produção lê daqui.
 *
 * ## O que o espelho ganha de brinde
 *
 * A busca da EA casa só PREFIXO, com espaço literal. A nossa, sobre este
 * espelho, casa **qualquer palavra em qualquer posição** — então o espelho não
 * é só um plano B: para achar clube, ele é MELHOR que a fonte.
 *
 * Toda leitura que vier daqui carrega `capturedAt`, e a tela diz a idade do
 * dado. Espelho sem data é afirmação sem procedência.
 */

export type GamePlatform = 'common-gen5' | 'common-gen4';

/** Profundidade do que foi capturado — nem todo clube vale uma captura funda. */
export type ProfundidadeEspelho = 'indice' | 'completo';

export interface IGameEaClube extends Document {
  clubId: string;
  platform: GamePlatform;
  name: string;
  /** Nome sem acento, minúsculo, espaços colapsados — a chave de busca. */
  nomeNormalizado: string;
  stadName?: string;
  crestAssetId?: string;
  regionId?: number;
  teamId?: number;
  /** Cores do uniforme (inteiros da EA), guardadas para a identidade visual. */
  kitColors?: number[];

  currentDivision?: number;
  bestDivision?: number;
  skillRating?: number;
  wins: number;
  ties: number;
  losses: number;
  gamesPlayed: number;
  goals: number;
  goalsAgainst: number;
  cleanSheets: number;

  /** Campanha histórica e forma — só na captura funda. */
  stats?: Record<string, unknown>;
  members?: Record<string, unknown>[];
  career?: Record<string, unknown>[];

  profundidade: ProfundidadeEspelho;
  /** Posição no ranking global no momento da captura, quando veio de lá. */
  rank?: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameEaClubeSchema = new Schema<IGameEaClube>(
  {
    clubId: { type: String, required: true },
    platform: { type: String, enum: ['common-gen5', 'common-gen4'], required: true },
    name: { type: String, required: true },
    nomeNormalizado: { type: String, required: true, index: true },
    stadName: { type: String },
    crestAssetId: { type: String },
    regionId: { type: Number },
    teamId: { type: Number },
    kitColors: { type: [Number] },

    currentDivision: { type: Number },
    bestDivision: { type: Number },
    skillRating: { type: Number },
    wins: { type: Number, default: 0 },
    ties: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },

    stats: { type: Schema.Types.Mixed },
    members: { type: [Schema.Types.Mixed] },
    career: { type: [Schema.Types.Mixed] },

    profundidade: { type: String, enum: ['indice', 'completo'], default: 'indice' },
    rank: { type: Number },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'B' },
    capturedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: 'game_ea_clubes' }
);

/** A identidade do espelho. Re-capturar sempre atualiza, nunca duplica. */
GameEaClubeSchema.index({ clubId: 1, platform: 1 }, { unique: true });
/** O ranking global sai daqui ordenado, sem tocar na EA. */
GameEaClubeSchema.index({ platform: 1, skillRating: -1 });

const GameEaClube: Model<IGameEaClube> =
  mongoose.models.GameEaClube || mongoose.model<IGameEaClube>('GameEaClube', GameEaClubeSchema);

export default GameEaClube;
