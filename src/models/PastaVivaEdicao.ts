import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── A EDIÇÃO DIÁRIA DA PASTA VIVA ───────────────────────────────────────────
 * 10/09/2026
 *
 * O que o debate de especialistas do Hermes produziu num dia: o que entrou de
 * novo no acervo, o que mudou de posição, e o que foi descartado — com o
 * motivo. É isto que faz a pasta ser "viva" em vez de ser um PDF com data.
 *
 * ## Por que o descartado é publicado
 *
 * Um acervo que só mostra o que entrou parece infalível, e não é. O que os
 * especialistas avaliaram e recusaram — com o motivo da recusa — costuma valer
 * mais para o leitor do que a novidade: é o que impede ele de perder o fim de
 * semana com um método que já testamos no lugar dele.
 *
 * ## O debate é rastreável, o método não é publicado
 *
 * `participantes` e `divergencias` existem para nós auditarmos a edição. A
 * página mostra a CONCLUSÃO e as FONTES; não mostra o transcrito do debate nem
 * como o Hermes chegou lá ([[feedback_nao_publicar_o_metodo]]).
 */

export interface IPastaVivaEdicao extends Document {
  /** Data da edição no formato AAAA-MM-DD. Uma por dia, e por isso é única. */
  dia: string;
  publicadaEm: Date;

  /** A manchete da edição. Uma frase, sem promessa de ganho. */
  resumo: string;

  /** Slugs de método que nasceram nesta edição. */
  metodosNovos: string[];
  /** Slugs revisados, com o que mudou. */
  metodosRevisados: { slug: string; mudou: string }[];
  /** O que foi avaliado e recusado — e por quê. Isto é publicado. */
  descartados: { titulo: string; motivo: string; fonteUrl?: string }[];

  /** Quem debateu (personas do Hermes). Auditoria interna, não vai para a tela. */
  participantes: string[];
  /** Onde os especialistas discordaram. Auditoria interna. */
  divergencias: string[];

  /** Custo da rodada em dólares, para o painel de custo do Hermes. */
  custoUsd?: number;
}

const PastaVivaEdicaoSchema = new Schema<IPastaVivaEdicao>(
  {
    dia: { type: String, required: true, unique: true, index: true },
    publicadaEm: { type: Date, default: Date.now },
    resumo: { type: String, required: true },

    metodosNovos: { type: [String], default: [] },
    metodosRevisados: { type: [{ slug: String, mudou: String }], default: [], _id: false },
    descartados: {
      type: [{ titulo: String, motivo: String, fonteUrl: String }],
      default: [],
      _id: false,
    },

    participantes: { type: [String], default: [] },
    divergencias: { type: [String], default: [] },
    custoUsd: Number,
  },
  { collection: 'pastaVivaEdicoes' },
);

const PastaVivaEdicao: Model<IPastaVivaEdicao> =
  (mongoose.models.PastaVivaEdicao as Model<IPastaVivaEdicao>) ||
  mongoose.model<IPastaVivaEdicao>('PastaVivaEdicao', PastaVivaEdicaoSchema);

export default PastaVivaEdicao;
