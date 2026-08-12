import mongoose, { Schema, type Document } from "mongoose";

/**
 * O livro do aluno, com endereço próprio — 12/08/2026.
 *
 * ## Por que existe
 *
 * O Ateliê escrevia trinta capítulos para a pessoa e devolvia um `toast`.
 * Ricardo, no primeiro teste de ponta a ponta:
 *
 * > *"não aconteceu nada (…) não fui levado a lugar nenhum, não apareceu nem um
 * > link, como não sai da página nem sei o que acontece com ele, como se
 * > comporta, se posso compartilhar ele com outros"*
 *
 * Uma coisa que a pessoa pagou para existir precisa **existir em algum lugar**.
 * Este documento é o que transforma "capítulos gravados numa coleção" em um
 * objeto com endereço, que se abre, se mostra e se manda para alguém.
 *
 * ## O token e por que ele não é o id
 *
 * O endereço público carrega `token`, nunca `userId` nem `courseSlug`. Um link
 * montado com id de usuário é um convite a trocar o número e ler o livro do
 * vizinho. O token é aleatório, longo e revogável — desligar o
 * compartilhamento apaga o acesso sem apagar o livro.
 */
export interface ILivroCompartilhado extends Document {
  userId: string;
  courseSlug: string;
  token: string;
  /** Desligar não apaga: o mesmo link volta a valer se a pessoa religar. */
  ativo: boolean;
  /** Nome que assina a capa — copiado na criação para o link não vazar troca de nome depois. */
  autor: string;
  visitas: number;
  ultimaVisita?: Date;
}

const LivroCompartilhadoSchema = new Schema<ILivroCompartilhado>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true },
    token: { type: String, required: true, unique: true, index: true },
    ativo: { type: Boolean, default: true },
    autor: { type: String, default: "" },
    visitas: { type: Number, default: 0 },
    ultimaVisita: { type: Date },
  },
  { timestamps: true }
);

LivroCompartilhadoSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });

export default (mongoose.models.LivroCompartilhado as mongoose.Model<ILivroCompartilhado>) ||
  mongoose.model<ILivroCompartilhado>("LivroCompartilhado", LivroCompartilhadoSchema);
