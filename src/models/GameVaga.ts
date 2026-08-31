import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * VAGA — um anúncio do Mercado de transferências do Winners 22.
 *
 * ## O que este modelo substitui
 *
 * Nos grupos de Pro Clubs no Facebook, o "quadro de requisições" é uma enxurrada
 * de POSTS-IMAGEM sem estrutura nenhuma: um clube fotografa a TV com o menu do
 * jogo, ou monta um cartaz "VAGAS SOMENTE PARA VOL, LT E ZG", e a legenda é um
 * link de WhatsApp. Quem procura time precisa ROLAR dezenas de imagens sem
 * poder filtrar por posição, plataforma ou horário, e o dado do clube (nível,
 * divisão, elenco) é só o que o cartaz afirma — não há como conferir.
 *
 * A Vaga troca a imagem por CAMPOS. Uma vaga de clube diz, em dado consultável,
 * quais posições precisa, em que plataforma joga, em que horário, e — quando o
 * clube é ligado a um `eaClubId` — puxa do espelho da EA a divisão e a campanha
 * REAIS. Uma vaga de jogador diz posição, overall e disponibilidade. O filtro
 * do Mercado faz em um clique o que no grupo exige rolar a tarde inteira.
 *
 * ## Duas formas, um documento
 *
 * `tipo: 'clube'` — um clube RECRUTA (precisa de posições).
 * `tipo: 'jogador'` — um jogador está LIVRE (oferece posições).
 * Os dois convivem no mesmo documento porque compartilham quase tudo (posições,
 * plataforma, horário, contato) e o Mercado os lista lado a lado.
 *
 * ## Procedência, como em toda a seção
 *
 * `sourceGrade` segue a escala do PLANO_GAME: uma vaga de clube ligada a um
 * `eaClubId` nasce 'B' (a EA publica os números); uma vaga digitada na mão é
 * 'E' (declarada). A diferença aparece na tela — o selo de procedência não é
 * enfeite, é o que separa "divisão 3, medido" de "divisão 3, ele disse".
 */

export type GamePlatform = 'common-gen5' | 'common-gen4';
export type PlataformaVaga = GamePlatform | 'mista';
export type TipoVaga = 'clube' | 'jogador';
export type StatusVaga = 'ativa' | 'preenchida' | 'expirada';
export type ContatoTipo = 'plataforma' | 'discord' | 'whatsapp';

export interface IGameVaga extends Document {
  tipo: TipoVaga;
  ownerUserId: mongoose.Types.ObjectId;

  /** Códigos de `lib/game/posicoes.ts` — o que o clube PRECISA ou o jogador OFERECE. */
  posicoes: string[];
  plataforma: PlataformaVaga;

  /** Dias da semana em que joga: 'seg'..'dom'. Vazio = não informado. */
  dias: string[];
  /** Faixa de horário livre, ex.: "20h–23h". */
  horario?: string;
  /** Região/fuso ou idioma, para casar quem joga junto. */
  regiao?: string;

  /* -------- lado CLUBE -------- */
  eaClubId?: string;
  clubeNome?: string;
  crestAssetId?: string;
  /** Snapshot do espelho no momento da publicação — divisão e campanha reais. */
  clubeSnapshot?: {
    currentDivision?: number;
    skillRating?: number;
    wins?: number;
    ties?: number;
    losses?: number;
    gamesPlayed?: number;
    memberCount?: number;
  };
  /** Overall mínimo pedido ao candidato (só faz sentido em vaga de clube). */
  minOverall?: number;

  /* -------- lado JOGADOR -------- */
  gamertag?: string;
  proName?: string;
  overall?: number;
  /** Apelido de estilo que a comunidade adora ("MAESTRO", "MURALHA"). */
  estilo?: string;

  /* -------- comuns -------- */
  titulo?: string;
  descricao?: string;
  contatoTipo: ContatoTipo;
  /** Handle/link de contato. Revelado ao candidatar-se, não jogado na vitrine. */
  contato?: string;

  status: StatusVaga;
  /** Contagem denormalizada de candidaturas — a vitrine mostra sem N+1. */
  candidaturas: number;
  /** Sobe a vaga na ordenação por relevância. Reservado para destaque pago. */
  destaque: boolean;
  /** Vaga de demonstração (semeada), rotulada como tal na tela. */
  demo: boolean;
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  /** Vagas velhas somem sozinhas — mercado com anúncio morto é ruído. */
  expiraEm: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameVagaSchema = new Schema<IGameVaga>(
  {
    tipo: { type: String, enum: ['clube', 'jogador'], required: true, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    posicoes: { type: [String], default: [] },
    plataforma: {
      type: String,
      enum: ['common-gen5', 'common-gen4', 'mista'],
      default: 'common-gen5',
    },
    dias: { type: [String], default: [] },
    horario: { type: String, trim: true },
    regiao: { type: String, trim: true },

    eaClubId: { type: String, index: true },
    clubeNome: { type: String, trim: true },
    crestAssetId: { type: String },
    clubeSnapshot: {
      currentDivision: { type: Number },
      skillRating: { type: Number },
      wins: { type: Number },
      ties: { type: Number },
      losses: { type: Number },
      gamesPlayed: { type: Number },
      memberCount: { type: Number },
    },
    minOverall: { type: Number },

    gamertag: { type: String, trim: true },
    proName: { type: String, trim: true },
    overall: { type: Number },
    estilo: { type: String, trim: true, maxlength: 24 },

    titulo: { type: String, trim: true, maxlength: 80 },
    descricao: { type: String, trim: true, maxlength: 600 },
    contatoTipo: {
      type: String,
      enum: ['plataforma', 'discord', 'whatsapp'],
      default: 'plataforma',
    },
    contato: { type: String, trim: true, maxlength: 200 },

    status: { type: String, enum: ['ativa', 'preenchida', 'expirada'], default: 'ativa', index: true },
    candidaturas: { type: Number, default: 0 },
    destaque: { type: Boolean, default: false },
    demo: { type: Boolean, default: false },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'E' },
    /** 30 dias por padrão. A vitrine filtra por `expiraEm > agora`. */
    expiraEm: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true, collection: 'game_vagas' }
);

/** A vitrine lista por tipo e status, das mais novas para trás. */
GameVagaSchema.index({ status: 1, tipo: 1, destaque: -1, createdAt: -1 });
/** O filtro por posição percorre o array. */
GameVagaSchema.index({ posicoes: 1, status: 1 });

const GameVaga: Model<IGameVaga> =
  mongoose.models.GameVaga || mongoose.model<IGameVaga>('GameVaga', GameVagaSchema);

export default GameVaga;
