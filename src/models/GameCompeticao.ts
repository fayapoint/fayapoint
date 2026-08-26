import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * COMPETIÇÃO — o campeonato que alguém organiza no Winners 22.
 *
 * Não depende da EA: um campeonato pode ser disputado por times ligados a
 * clubes reais do Clubs ou por times cadastrados na mão. Quem conhece `clubId`
 * é o `GameTime`, não este documento — de propósito, para o dia em que a liga
 * receber outro jogo além do EA FC.
 *
 * As REGRAS ficam gravadas dentro da competição, não numa tabela global. Um
 * organizador que muda o critério de desempate no meio do campeonato mudaria a
 * classificação de todo mundo retroativamente; guardadas aqui, cada competição
 * carrega as suas e a tabela do ano passado continua fazendo sentido.
 *
 * `arte` é a semente do pôster do campeão (`/api/game/campeonato/[slug]/premio`):
 * guardar a semente, e não a imagem, deixa o pôster ser regerado sempre igual.
 */

export type FormatoCompeticao = 'pontos-corridos' | 'mata-mata' | 'grupos-mata-mata';
export type StatusCompeticao = 'rascunho' | 'inscricoes' | 'em-andamento' | 'encerrada';

export interface IGameCompeticao extends Document {
  slug: string;
  nome: string;
  descricao?: string;
  organizadorUserId: mongoose.Types.ObjectId;
  formato: FormatoCompeticao;
  /** Preset que originou a competição — só para contar o que as pessoas usam. */
  preset?: string;
  plataforma: 'common-gen5' | 'common-gen4' | 'mista';
  status: StatusCompeticao;
  vagas: number;
  regras: {
    turnos: number;
    pontosVitoria: number;
    pontosEmpate: number;
    pontosDerrota: number;
    criteriosDesempate: string[];
    numGrupos?: number;
    classificadosPorGrupo?: number;
    idaEVoltaMataMata?: boolean;
    vagasAcesso?: number;
    vagasRebaixamento?: number;
  };
  inicioEm?: Date;
  fimEm?: Date;
  campeaoTimeId?: mongoose.Types.ObjectId;
  viceTimeId?: mongoose.Types.ObjectId;
  /** Semente da arte do pôster. Mesma semente, mesmo pôster. */
  arte: { semente: number; paleta: string; padrao: string };
  publico: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameCompeticaoSchema = new Schema<IGameCompeticao>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    nome: { type: String, required: true },
    descricao: { type: String },
    organizadorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    formato: {
      type: String,
      enum: ['pontos-corridos', 'mata-mata', 'grupos-mata-mata'],
      required: true,
    },
    preset: { type: String },
    plataforma: {
      type: String,
      enum: ['common-gen5', 'common-gen4', 'mista'],
      default: 'common-gen5',
    },
    status: {
      type: String,
      enum: ['rascunho', 'inscricoes', 'em-andamento', 'encerrada'],
      default: 'rascunho',
      index: true,
    },
    vagas: { type: Number, default: 8 },
    regras: {
      turnos: { type: Number, default: 1 },
      pontosVitoria: { type: Number, default: 3 },
      pontosEmpate: { type: Number, default: 1 },
      pontosDerrota: { type: Number, default: 0 },
      criteriosDesempate: {
        type: [String],
        default: ['pontos', 'vitorias', 'saldo', 'golsPro', 'confrontoDireto'],
      },
      numGrupos: { type: Number },
      classificadosPorGrupo: { type: Number },
      idaEVoltaMataMata: { type: Boolean, default: false },
      vagasAcesso: { type: Number },
      vagasRebaixamento: { type: Number },
    },
    inicioEm: { type: Date },
    fimEm: { type: Date },
    campeaoTimeId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
    viceTimeId: { type: Schema.Types.ObjectId, ref: 'GameTime' },
    arte: {
      semente: { type: Number, default: () => Math.floor(Math.random() * 1_000_000) },
      paleta: { type: String, default: 'lima' },
      padrao: { type: String, default: 'grade' },
    },
    publico: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'game_competicoes' }
);

/** A vitrine lista competições públicas, das mais recentes para trás. */
GameCompeticaoSchema.index({ publico: 1, status: 1, createdAt: -1 });

const GameCompeticao: Model<IGameCompeticao> =
  mongoose.models.GameCompeticao ||
  mongoose.model<IGameCompeticao>('GameCompeticao', GameCompeticaoSchema);

export default GameCompeticao;
