import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * O ACERVO — a fotografia diária de um time ou de um jogador. 08/09/2026.
 *
 * ## Por que ele precisa existir
 *
 * O espelho (`game_ea_partidas`) guarda PARTIDA, que é imutável: o 3–2 de
 * ontem é 3–2 para sempre. Mas quase tudo que interessa numa página de
 * campeonato não é partida — é ACUMULADO: quantos gols o cara tem na copa,
 * quantos jogos o time fez, qual a nota média. E acumulado muda todo dia.
 *
 * Sem fotografia, a única resposta possível é "como está agora". Com ela, dá
 * para responder "como estava na semana passada", "quem subiu", "quem despencou
 * depois da rodada" — que é o que transforma uma tabela num acervo.
 *
 * ## E o motivo urgente
 *
 * A EA guarda **10 partidas amistosas por clube** e descarta o resto. Uma
 * série MD5 queima cinco slots numa noite. O acumulado que a gente calcula
 * hoje das 10 partidas visíveis **encolhe** amanhã, quando cinco delas
 * sumirem da fonte — a menos que esteja fotografado aqui.
 *
 * Ou seja: este documento é o único lugar onde o histórico de um campeonato de
 * Pro Clubs pode durar. Nem a organização da copa tem — ela lê a mesma API.
 *
 * ## Um por dia, por chave
 *
 * O índice único inclui o DIA. Rodar o coletor cinco vezes no mesmo dia
 * atualiza a mesma fotografia em vez de criar cinco. É o que deixa o coletor
 * rodar de hora em hora sem inflar a coleção — e o que faz a série temporal
 * ter um ponto por dia, que é a granularidade que a tela sabe desenhar.
 */

export type EscopoAcervo = 'copa' | 'competicao';
export type TipoAcervo = 'time' | 'jogador';

export interface IGameAcervo extends Document {
  escopo: EscopoAcervo;
  /** `slug` da copa ou `_id` da competição do usuário. */
  refId: string;
  tipo: TipoAcervo;
  /** Nome do time ou gamertag do jogador. */
  chave: string;
  /** Time do jogador, quando `tipo` é `jogador`. */
  time?: string;
  /** O dia da fotografia, em `AAAA-MM-DD`. Parte da identidade. */
  dia: string;
  em: Date;
  /**
   * Os números acumulados. Mixed de propósito: time e jogador guardam
   * grandezas diferentes, e engessar num schema faria toda métrica nova exigir
   * migração — num acervo que existe justamente para crescer.
   */
  dados: Record<string, number>;
  /** De onde veio. `B` = fonte pública da EA. */
  sourceGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  createdAt: Date;
  updatedAt: Date;
}

const GameAcervoSchema = new Schema<IGameAcervo>(
  {
    escopo: { type: String, enum: ['copa', 'competicao'], required: true },
    refId: { type: String, required: true },
    tipo: { type: String, enum: ['time', 'jogador'], required: true },
    chave: { type: String, required: true },
    time: { type: String },
    dia: { type: String, required: true },
    em: { type: Date, default: Date.now },
    dados: { type: Schema.Types.Mixed, required: true },
    sourceGrade: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], default: 'B' },
  },
  { timestamps: true, collection: 'game_acervo' }
);

/** Uma fotografia por chave por dia. Recapturar atualiza; nunca duplica. */
GameAcervoSchema.index(
  { escopo: 1, refId: 1, tipo: 1, chave: 1, dia: 1 },
  { unique: true }
);
/** A série temporal de um campeonato, do mais recente para trás. */
GameAcervoSchema.index({ escopo: 1, refId: 1, tipo: 1, em: -1 });

const GameAcervo: Model<IGameAcervo> =
  mongoose.models.GameAcervo || mongoose.model<IGameAcervo>('GameAcervo', GameAcervoSchema);

export default GameAcervo;
