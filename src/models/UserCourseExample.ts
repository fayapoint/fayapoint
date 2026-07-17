import mongoose, { Schema, type Document } from "mongoose";

/**
 * Exemplo de curso personalizado por persona (motor Expert v1 — Fase 3.3).
 * Um documento por (userId, courseSlug, exampleId). O content API injeta o
 * `content` no miolo do slot correspondente para usuários Expert.
 */
export interface IUserCourseExample extends Document {
  userId: string;
  courseSlug: string;
  exampleId: string;
  tema: string;
  content: string;
  personaVersion: number;
  modelUsed: string;
  generatedAt: Date;
}

const UserCourseExampleSchema = new Schema<IUserCourseExample>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true },
    exampleId: { type: String, required: true },
    tema: { type: String, default: "" },
    content: { type: String, required: true },
    personaVersion: { type: Number, default: 0 },
    modelUsed: { type: String, default: "" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserCourseExampleSchema.index(
  { userId: 1, courseSlug: 1, exampleId: 1 },
  { unique: true }
);

export default (mongoose.models.UserCourseExample as mongoose.Model<IUserCourseExample>) ||
  mongoose.model<IUserCourseExample>("UserCourseExample", UserCourseExampleSchema);
