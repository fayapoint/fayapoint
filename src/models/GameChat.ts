import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * O CHAT DO WINNERS 22 — a sala onde todo mundo fala. 08/09/2026.
 *
 * ## Por que Mongo com sondagem, e não WebSocket
 *
 * Mesmo motivo da presença: a produção é serverless e não há processo de pé
 * para segurar conexão viva. A sala funciona por leitura periódica — o cliente
 * pede as mensagens novas desde a última que viu, e o servidor devolve só
 * elas. Numa sala de dezenas de pessoas isso é barato e, ao contrário do
 * WebSocket, funciona igual em qualquer lugar onde o site rode.
 *
 * ## A mensagem guarda o nome de quem falou, e isso é de propósito
 *
 * `nome` e `avatarSeed` são copiados no momento do envio, em vez de buscados
 * por `populate` na leitura. Duas razões: ler 50 mensagens vira UMA consulta em
 * vez de 51, e a fala continua atribuída a quem falou mesmo que a pessoa mude
 * de apelido depois. Histórico de conversa não se reescreve.
 *
 * ## Moderação: esconder, nunca apagar
 *
 * `oculta` tira a mensagem da sala e guarda quem escondeu e por quê. Apagar de
 * verdade destruiria a prova de um comportamento que pode virar processo
 * disciplinar — e o Estatuto exige que toda decisão tenha motivo registrado
 * (art. 30). O que a sala não mostra continua existindo para quem apura.
 *
 * ## Prazo de vida
 *
 * O índice TTL apaga mensagem com mais de 30 dias. É sala de conversa, não
 * arquivo: guardar para sempre a conversa de todo mundo é passivo de dados sem
 * finalidade que o justifique (LGPD, e Estatuto art. 40). Mensagem oculta por
 * moderação também expira — quem precisar dela para um processo tem 30 dias
 * para juntá-la ao caso.
 */

export interface IGameChat extends Document {
  /** Sala. Por ora só 'geral'; o campo existe para não migrar depois. */
  canal: string;
  userId: mongoose.Types.ObjectId;
  /** Como a pessoa se chamava QUANDO falou. Nunca reescrito. */
  nome: string;
  avatarSeed?: string;
  /** Marca de quem é da federação, congelada no envio. */
  federacao: boolean;
  texto: string;
  oculta: boolean;
  ocultaPor?: mongoose.Types.ObjectId;
  ocultaMotivo?: string;
  ocultaEm?: Date;
  createdAt: Date;
}

const GameChatSchema = new Schema<IGameChat>(
  {
    canal: { type: String, default: 'geral', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nome: { type: String, required: true },
    avatarSeed: { type: String },
    federacao: { type: Boolean, default: false },
    texto: { type: String, required: true, maxlength: 500 },
    oculta: { type: Boolean, default: false },
    ocultaPor: { type: Schema.Types.ObjectId, ref: 'User' },
    ocultaMotivo: { type: String },
    ocultaEm: { type: Date },
  },
  { timestamps: true, collection: 'game_chat' }
);

/** A leitura da sala: as últimas do canal, e o "desde a que eu já vi". */
GameChatSchema.index({ canal: 1, createdAt: -1 });

/**
 * Conversa some sozinha em 30 dias. Ver o cabeçalho: sala não é arquivo, e
 * guardar a fala de todo mundo para sempre é passivo sem finalidade.
 */
GameChatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const GameChat: Model<IGameChat> =
  mongoose.models.GameChat || mongoose.model<IGameChat>('GameChat', GameChatSchema);

export default GameChat;
