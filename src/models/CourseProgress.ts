import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: string; // slug or ID
  completedLessons: string[];
  completedSections?: string[];
  lastAccessedLesson?: string;
  lastHeadingId?: string;
  progressPercent: number;
  totalSections?: number;
  lastScrollY?: number;
  lastScrollPercent?: number;
  /**
   * Até onde a lente chegou em cada capítulo — a fronteira entre o verde
   * (já lido/narrado) e o azul (ainda não). Ver o comentário no schema.
   */
  posicaoMaxima?: Map<string, { fala: number; de: number }>;
  isCompleted: boolean;
  completedAt?: Date;
  startedAt: Date;
  lastAccessedAt: Date;
}

const CourseProgressSchema = new Schema<ICourseProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
  completedLessons: [{
    type: String,
  }],
  completedSections: [{
    type: String,
  }],
  lastAccessedLesson: String,
  lastHeadingId: String,
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  totalSections: {
    type: Number,
    min: 0,
  },
  lastScrollY: {
    type: Number,
    min: 0,
  },
  lastScrollPercent: {
    type: Number,
    min: 0,
    max: 100,
  },
  /**
   * ── ATÉ ONDE A LENTE CHEGOU, POR CAPÍTULO (04/09/2026) ───────────────────
   *
   * Chave: o NÚMERO do capítulo (não o índice — o leitor cria uma
   * "Apresentação" no índice 0 e a numeração das aulas começa depois dela; foi
   * assim que o audiobook tocou o capítulo errado em 03/09).
   *
   * `fala` é o índice da frase mais distante alcançada. `de` é quantas frases
   * o capítulo tinha naquele momento, e existe por um motivo: um capítulo
   * regravado muda a contagem de falas, e sem o denominador a posição antiga
   * viraria uma marca em lugar nenhum. Com ele dá para reescalar.
   *
   * Mora aqui, e não só no `localStorage`, porque o pedido era "fechar o curso
   * e voltar mostra até onde você chegou" — e voltar costuma ser de outro
   * aparelho. O `localStorage` continua sendo a primeira leitura (instantânea,
   * funciona sem rede); este campo é o que atravessa navegador e telefone.
   */
  posicaoMaxima: {
    type: Map,
    of: new Schema(
      { fala: { type: Number, min: 0 }, de: { type: Number, min: 1 } },
      { _id: false },
    ),
    default: undefined,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  startedAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CourseProgressSchema.index({ userId: 1, lastAccessedAt: -1 });

const CourseProgress: Model<ICourseProgress> = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);

export default CourseProgress;
