import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * O caderno de trechos do aluno — o que ele grifou na lente.
 *
 * ## Por que uma coleção, e não `localStorage`
 *
 * O que se guarda numa aula é justamente o que se quer reencontrar meses
 * depois, provavelmente de outro aparelho. Grifo que mora só no navegador é
 * grifo que some na primeira limpeza de cache, e some sem avisar.
 *
 * ## Por que é pequeno de propósito
 *
 * Sem título, sem pasta, sem etiqueta. Um trecho, o capítulo de onde saiu, e a
 * data. Um caderno que pede organização antes de ser útil não é usado — e a
 * lente já tem trabalho demais para também virar gerenciador de notas.
 */
export interface ITrechoGuardado extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: string;
  capitulo?: string;
  texto: string;
  criadoEm: Date;
}

const TrechoGuardadoSchema = new Schema<ITrechoGuardado>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: String, required: true },
  capitulo: String,
  // O teto existe para o campo não virar depósito: a lente já corta a seleção
  // em 2.000 caracteres antes de mandar, e isto é a rede embaixo dela.
  texto: { type: String, required: true, maxlength: 2000 },
  criadoEm: { type: Date, default: Date.now },
});

TrechoGuardadoSchema.index({ userId: 1, courseId: 1, criadoEm: -1 });

const TrechoGuardado: Model<ITrechoGuardado> =
  mongoose.models.TrechoGuardado || mongoose.model<ITrechoGuardado>('TrechoGuardado', TrechoGuardadoSchema);

export default TrechoGuardado;
