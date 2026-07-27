import mongoose, { Schema, type Document } from "mongoose";

/**
 * A camada personalizada de um capítulo (motor Expert v2 — 27/07/2026).
 *
 * Um documento por (userId, courseSlug, capitulo). Diferente do
 * `UserCourseExample`, que depende de o autor ter marcado slots no markdown,
 * esta camada existe para QUALQUER curso: o capítulo é a estrutura que todos
 * têm. Ver `lib/curso-personalizado.ts` para o desenho e o porquê de a aula
 * original não ser reescrita.
 *
 * `personaVersion` é o que permite saber que a camada envelheceu: quando o
 * aluno aprofunda a persona, a versão sobe e a tela pode oferecer o
 * "atualizar" em vez de mostrar um exemplo escrito com o que sabíamos antes.
 */
export interface IUserCourseLayer extends Document {
  userId: string;
  courseSlug: string;
  capitulo: number;
  tituloCapitulo: string;
  abertura: string;
  exemplo: string;
  tarefa: string;
  personaVersion: number;
  modelUsed: string;
  generatedAt: Date;
}

const UserCourseLayerSchema = new Schema<IUserCourseLayer>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true },
    capitulo: { type: Number, required: true },
    tituloCapitulo: { type: String, default: "" },
    abertura: { type: String, default: "" },
    exemplo: { type: String, default: "" },
    tarefa: { type: String, default: "" },
    personaVersion: { type: Number, default: 0 },
    modelUsed: { type: String, default: "" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserCourseLayerSchema.index({ userId: 1, courseSlug: 1, capitulo: 1 }, { unique: true });

export default (mongoose.models.UserCourseLayer as mongoose.Model<IUserCourseLayer>) ||
  mongoose.model<IUserCourseLayer>("UserCourseLayer", UserCourseLayerSchema);
