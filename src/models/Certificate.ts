import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IQuizAttempt {
  attemptNumber: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    isCorrect: boolean;
  }[];
  score: number;
  totalQuestions: number;
  passedAt?: Date;
  failedAt?: Date;
}

/**
 * A prova ABERTA — as respostas certas guardadas no servidor (11/08/2026).
 *
 * ## O buraco que este campo fecha
 *
 * Até aqui o `GET` devolvia ao navegador um `answersToken` que era,
 * literalmente, `base64(JSON.stringify(respostasCertas))`. Não era um token:
 * era o gabarito, em claro, dentro da resposta HTTP. `atob(token)` no console
 * do navegador devolvia `[1,3,0,2,…]` — a prova inteira, antes de responder.
 *
 * Pior: o `POST` **confiava no token que o cliente devolvia**. Quem quisesse
 * podia mandar um token forjado com uma pergunta só e a própria resposta como
 * gabarito; a nota saía `100%` e o certificado era emitido. O documento que o
 * site vende como *verificável* podia ser emitido sem abrir o curso.
 *
 * A correção é a única que resolve as duas coisas: **o gabarito nunca sai do
 * servidor**. O que viaja é um `nonce` aleatório que só serve para dizer *qual*
 * prova está sendo entregue. Sem o documento, o nonce não vale nada; e como as
 * perguntas também ficam aqui, a nota é calculada sobre a prova que o servidor
 * montou, não sobre a que o cliente diz ter recebido.
 *
 * `expiraEm` existe para que uma prova aberta e abandonada não fique válida
 * para sempre — e para que reabrir a página depois de horas dê uma prova nova
 * em vez de continuar uma antiga.
 */
export interface IProvaPendente {
  nonce: string;
  perguntas: { question: string; options: string[]; correctAnswer: number }[];
  criadaEm: Date;
  expiraEm: Date;
}

export interface ICertificate extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseDescription: string;
  courseLevel: string;
  courseDuration: string;
  courseTotalLessons: number;
  courseCategory: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: Date;
  completedAt: Date;
  startedAt: Date;
  totalStudyHours: number;
  chaptersCompleted: number;
  totalChapters: number;
  quizScore: number;
  quizAttempts: IQuizAttempt[];
  totalQuizAttempts: number;
  provaPendente?: IProvaPendente;
  certificateNumber: string;
  status: 'pending_quiz' | 'quiz_in_progress' | 'issued' | 'revoked';
  pdfUrl?: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  revokedAt?: Date;
  revokedReason?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    locale?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

function generateVerificationCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const seq = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `FP-${year}-${seq}`;
}

const QuizAttemptSchema = new Schema({
  attemptNumber: { type: Number, required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: Number, required: true },
    userAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  passedAt: Date,
  failedAt: Date,
}, { _id: false });

const CertificateSchema = new Schema<ICertificate>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  courseId: { type: String, required: true },
  courseSlug: { type: String, required: true },
  courseTitle: { type: String, required: true },
  courseDescription: { type: String, default: '' },
  courseLevel: { type: String, default: '' },
  courseDuration: { type: String, default: '' },
  courseTotalLessons: { type: Number, default: 0 },
  courseCategory: { type: String, default: '' },
  verificationCode: {
    type: String,
    unique: true,
    default: generateVerificationCode,
  },
  verificationUrl: { type: String, default: '' },
  issuedAt: { type: Date },
  completedAt: { type: Date },
  startedAt: { type: Date },
  totalStudyHours: { type: Number, default: 0 },
  chaptersCompleted: { type: Number, default: 0 },
  totalChapters: { type: Number, default: 0 },
  quizScore: { type: Number, default: 0 },
  quizAttempts: [QuizAttemptSchema],
  totalQuizAttempts: { type: Number, default: 0 },
  /**
   * ⚠️ Campo NOVO — e a lição de 10/08 vale aqui: um campo que não existe no
   * schema é descartado pelo Mongoose **em silêncio**, sem erro, sem aviso
   * (foi assim que `socialPersona.negocio` passou uma semana sendo gravado e
   * jogado fora). Se este bloco sumir do schema, o gabarito nunca é salvo e
   * TODA prova volta "expirada" — sem uma única mensagem de erro.
   */
  provaPendente: {
    type: new Schema<IProvaPendente>({
      nonce: { type: String, required: true },
      perguntas: [{
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: Number, required: true },
      }],
      criadaEm: { type: Date, required: true },
      expiraEm: { type: Date, required: true },
    }, { _id: false }),
    required: false,
  },
  certificateNumber: {
    type: String,
    unique: true,
    default: generateCertificateNumber,
  },
  status: {
    type: String,
    enum: ['pending_quiz', 'quiz_in_progress', 'issued', 'revoked'],
    default: 'pending_quiz',
  },
  pdfUrl: String,
  imageUrl: String,
  cloudinaryPublicId: String,
  revokedAt: Date,
  revokedReason: String,
  metadata: {
    ipAddress: String,
    userAgent: String,
    locale: String,
  },
}, {
  timestamps: true,
});

CertificateSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });
CertificateSchema.index({ status: 1 });

CertificateSchema.pre('save', function(next) {
  if (!this.verificationUrl && this.verificationCode) {
    const locale = this.metadata?.locale || 'pt-BR';
    this.verificationUrl = `https://fayai.com.br/${locale}/verificar-certificado/${this.verificationCode}`;
  }
  next();
});

const Certificate: Model<ICertificate> = mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);

export default Certificate;

export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 10,
  PASSING_SCORE: 70,
  MAX_ATTEMPTS: 3,
  MIN_PROGRESS_PERCENT: 100,
};
