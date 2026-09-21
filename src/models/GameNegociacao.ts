import mongoose, { Schema, type Model } from 'mongoose';

/**
 * NEGOCIAÇÃO de compra e venda no Winners 22 — clube ou jogador, em fichas.
 *
 * O plano está em `autoresearch/PLANO_COMPRA_VENDA_2026-09-21.md`. O essencial:
 *
 * - **Clube**: comprar é assumir a GESTÃO do clube no Winners 22 (o
 *   `donoUserId` do `GameClubePerfil`). Quem vende é o dono aprovado. Na
 *   conclusão, o dono muda e as delegações caem — quem sai perde papel na hora.
 * - **Jogador**: comprar é contratar uma gamertag para o SEU clube. Quem recebe
 *   as luvas é o próprio jogador (a conta que reivindicou a gamertag), e o
 *   clube de origem recebe uma compensação quando tiver dono aprovado e ela for
 *   pedida. Jogador sempre consente; ninguém é "vendido" sem dizer sim.
 *
 * O dinheiro é FICHA, que não se compra nem se saca (art. 6º do estatuto). As
 * fichas da proposta ficam em custódia desde o envio — assim o aceite nunca
 * esbarra em "o comprador gastou tudo apostando" — e voltam a quem ofereceu se
 * a proposta for recusada, cancelada ou vencer. Cada movimento é um lançamento
 * com `chaveUnica`, então retentativa não paga duas vezes.
 */

export type TipoNegociacao = 'clube' | 'jogador';
export type EstadoNegociacao = 'aberta' | 'concluida' | 'recusada' | 'cancelada' | 'expirada';
export type PlataformaNegociacao = 'common-gen5' | 'nx';

export interface ClubeRef {
  eaClubId: string;
  plataforma: PlataformaNegociacao;
  nome: string;
}

export interface IGameNegociacao {
  tipo: TipoNegociacao;
  estado: EstadoNegociacao;
  /** Clube à venda (tipo clube) ou clube de ORIGEM do jogador (tipo jogador, opcional). */
  clube?: ClubeRef;
  /** Gamertag do jogador (tipo jogador). */
  gamertag?: string;
  /** Clube para onde o jogador vai (tipo jogador) — gerido por quem compra. */
  destino?: ClubeRef;
  compradorUserId: mongoose.Types.ObjectId;
  /** Quem recebe: o dono do clube, ou o jogador. */
  vendedorUserId: mongoose.Types.ObjectId;
  /** Dono do clube de origem, quando há compensação a pagar. */
  origemUserId?: mongoose.Types.ObjectId | null;
  /** Total em custódia = luvas (ou preço do clube) + compensação. */
  valor: number;
  compensacao: number;
  /** A referência calculada no envio — a faixa é conferida contra ela. */
  referencia: { valor: number; minimo: number; maximo: number; confianca: string };
  mensagem: string;
  aceites: { vendedor: Date | null; origem: Date | null };
  expiraEm: Date;
  concluidaEm?: Date;
  historico: Array<{ quando: Date; autorUserId: mongoose.Types.ObjectId; acao: string; detalhe: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const clubeRef = {
  eaClubId: { type: String, match: /^\d{1,12}$/ },
  plataforma: { type: String, enum: ['common-gen5', 'nx'] },
  nome: { type: String, maxlength: 100 },
};

const schema = new Schema<IGameNegociacao>(
  {
    tipo: { type: String, enum: ['clube', 'jogador'], required: true },
    estado: { type: String, enum: ['aberta', 'concluida', 'recusada', 'cancelada', 'expirada'], default: 'aberta', index: true },
    clube: { type: clubeRef, _id: false },
    gamertag: { type: String, maxlength: 40 },
    destino: { type: clubeRef, _id: false },
    compradorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendedorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    origemUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    valor: { type: Number, required: true, min: 1 },
    compensacao: { type: Number, default: 0, min: 0 },
    referencia: {
      valor: { type: Number, required: true },
      minimo: { type: Number, required: true },
      maximo: { type: Number, required: true },
      confianca: { type: String, required: true },
    },
    mensagem: { type: String, default: '', maxlength: 500 },
    aceites: { vendedor: { type: Date, default: null }, origem: { type: Date, default: null } },
    expiraEm: { type: Date, required: true, index: true },
    concluidaEm: { type: Date },
    historico: [{ _id: false, quando: Date, autorUserId: { type: Schema.Types.ObjectId, ref: 'User' }, acao: String, detalhe: String }],
  },
  { timestamps: true, collection: 'game_negociacoes' }
);

/** O quadro público de transferências concluídas sai daqui. */
schema.index({ estado: 1, concluidaEm: -1 });

const GameNegociacao: Model<IGameNegociacao> =
  mongoose.models.GameNegociacao || mongoose.model<IGameNegociacao>('GameNegociacao', schema);
export default GameNegociacao;
