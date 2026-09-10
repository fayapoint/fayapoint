import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── UM MÉTODO DO ACERVO ─────────────────────────────────────────────────────
 * 10/09/2026 · a Pasta Viva de "Ganhar dinheiro com IA"
 *
 * Cada documento é UMA forma de ganhar dinheiro prestando serviço com IA, com
 * a apuração inteira anexada: de onde saiu, quem disse, quanto custa começar,
 * quanto tempo leva, e o que se sabe sobre retorno.
 *
 * ## ⛔ A trava que define este arquivo: número declarado ≠ número medido
 *
 * A marca proíbe inventar número, e "top 50 métodos com ROI" é exatamente o
 * lugar onde um número inventado passa despercebido para sempre. Por isso o
 * retorno mora em DOIS campos que nunca se misturam:
 *
 * - `roiDeclarado` — o que a FONTE afirma. Vem com `fonteId` obrigatório e
 *   entra na página sempre rotulado como afirmação de terceiro. Serve para
 *   comparar métodos, não para prometer resultado a ninguém.
 * - `roiMedido` — o que NÓS medimos, com data e amostra. Começa `null` em
 *   todo método, e continua `null` até existir medição de verdade.
 *
 * A página desenha os dois em faixas visualmente diferentes. Um método sem
 * medição mostra faixa hachurada e a frase "ainda não medimos" — nunca um
 * traço, que lê como carregamento quebrado ([[reference_estado_vazio_tabela]]).
 *
 * ## Por que o acervo não apaga
 *
 * `historico[]` guarda toda versão anterior do corpo do método, com data. Um
 * método que caiu em desuso recebe `status: 'arquivado'` e sai das listas —
 * mas continua acessível pela URL e continua contando na medição histórica.
 * Apagar destruiria a única coisa que este produto tem de diferente: a série
 * temporal de o que funcionava em cada momento.
 */

export interface IFonte {
  /** Id curto e estável, referenciado por `roiDeclarado.fonteId`. */
  id: string;
  titulo: string;
  /** Canal do YouTube, publicação, empresa, pessoa. */
  autor?: string;
  tipo: 'youtube' | 'artigo' | 'documentacao' | 'estudo' | 'podcast' | 'forum' | 'outro';
  url?: string;
  /** Quando a fonte foi publicada — não quando a lemos. */
  publicadaEm?: Date;
  /** O que esta fonte especificamente sustenta. Uma frase. */
  sustenta?: string;
}

export interface IPastaVivaMetodo extends Document {
  slug: string;
  titulo: string;
  /** Uma frase. É o que aparece na tabela e no gráfico. */
  tldr: string;
  categoria: string;

  /** Investimento inicial em reais para começar. 0 é válido e comum. */
  investimentoReais: number;
  /** Horas até a primeira entrega possível. */
  tempoConclusaoHoras: number;
  dificuldade: 'baixa' | 'media' | 'alta';

  roiDeclarado?: {
    /** Múltiplo declarado (2 = "dobra o investimento"). */
    multiplo?: number;
    /** Faixa de receita mensal declarada, em reais. */
    receitaMensalMin?: number;
    receitaMensalMax?: number;
    /** ⛔ Obrigatório: qual fonte afirmou isto. */
    fonteId: string;
    declaradoEm?: Date;
  } | null;

  /** ⛔ Só é preenchido por medição nossa, com amostra. Nunca por estimativa. */
  roiMedido?: {
    multiplo?: number;
    amostra: number;
    medidoEm: Date;
    observacao?: string;
  } | null;

  fontes: IFonte[];
  imagens: { url: string; legenda?: string }[];
  /** Passo a passo de implementação, em ordem. */
  tutorial: { passo: number; titulo: string; detalhe: string }[];

  status: 'ativo' | 'arquivado';
  entrouEm: Date;
  atualizadoEm: Date;
  /** O acervo não apaga: toda versão anterior fica aqui. */
  historico: { em: Date; corpo: string; motivo?: string }[];
}

const FonteSchema = new Schema<IFonte>(
  {
    id: { type: String, required: true },
    titulo: { type: String, required: true },
    autor: String,
    tipo: {
      type: String,
      enum: ['youtube', 'artigo', 'documentacao', 'estudo', 'podcast', 'forum', 'outro'],
      default: 'outro',
    },
    url: String,
    publicadaEm: Date,
    sustenta: String,
  },
  { _id: false },
);

const PastaVivaMetodoSchema = new Schema<IPastaVivaMetodo>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    titulo: { type: String, required: true },
    tldr: { type: String, required: true },
    categoria: { type: String, required: true, index: true },

    investimentoReais: { type: Number, required: true, min: 0 },
    tempoConclusaoHoras: { type: Number, required: true, min: 0 },
    dificuldade: { type: String, enum: ['baixa', 'media', 'alta'], default: 'media' },

    roiDeclarado: {
      type: {
        multiplo: Number,
        receitaMensalMin: Number,
        receitaMensalMax: Number,
        fonteId: { type: String, required: true },
        declaradoEm: Date,
      },
      default: null,
    },
    roiMedido: {
      type: {
        multiplo: Number,
        amostra: { type: Number, required: true },
        medidoEm: { type: Date, required: true },
        observacao: String,
      },
      default: null,
    },

    fontes: { type: [FonteSchema], default: [] },
    imagens: { type: [{ url: String, legenda: String }], default: [], _id: false },
    tutorial: {
      type: [{ passo: Number, titulo: String, detalhe: String }],
      default: [],
      _id: false,
    },

    status: { type: String, enum: ['ativo', 'arquivado'], default: 'ativo', index: true },
    entrouEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: Date.now },
    historico: { type: [{ em: Date, corpo: String, motivo: String }], default: [], _id: false },
  },
  { collection: 'pastaVivaMetodos' },
);

const PastaVivaMetodo: Model<IPastaVivaMetodo> =
  (mongoose.models.PastaVivaMetodo as Model<IPastaVivaMetodo>) ||
  mongoose.model<IPastaVivaMetodo>('PastaVivaMetodo', PastaVivaMetodoSchema);

export default PastaVivaMetodo;
