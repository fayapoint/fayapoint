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
 * A camada envelhece por DOIS lados, e os dois precisam ser observados:
 *
 * - `personaVersion` — o aluno aprofundou o dossiê, então dá para escrever
 *   melhor do que se escreveu antes.
 * - `hashCapitulo` — o CAPÍTULO foi reescrito. Sem isto, reescrever um curso
 *   (que é rotina desde 02/08) deixa a camada antiga grudada num capítulo que
 *   não existe mais: o aluno lê uma abertura que promete um assunto e um texto
 *   que fala de outro. Como a persona não mudou, nada disparava a regeneração.
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
  /** Impressão do trecho do capítulo que gerou esta camada. */
  hashCapitulo: string;
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
    // Vazio nas camadas geradas antes de 02/08 — tratado como "desconhecido",
    // que força uma regeneração e resolve sozinho no primeiro uso.
    hashCapitulo: { type: String, default: "" },
    modelUsed: { type: String, default: "" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserCourseLayerSchema.index({ userId: 1, courseSlug: 1, capitulo: 1 }, { unique: true });

export default (mongoose.models.UserCourseLayer as mongoose.Model<IUserCourseLayer>) ||
  mongoose.model<IUserCourseLayer>("UserCourseLayer", UserCourseLayerSchema);
