import mongoose, { Schema, type Document } from "mongoose";

/**
 * A amostra grátis do Ateliê — a prova antes da compra (03/08/2026).
 *
 * ## Por que não reaproveita o `UserCourseLayer`
 *
 * Seriam dois documentos parecidos e a tentação é óbvia. Mas eles obedecem a
 * regras opostas, e misturá-los quebraria as duas:
 *
 * - A **camada** só é escrita acima da confiança mínima, porque vai para dentro
 *   da aula que o aluno lê. A **amostra** é gerada em qualquer confiança, de
 *   propósito: parte do trabalho dela é mostrar como o texto fica MORNO quando
 *   sabemos pouco — é o argumento que leva a pessoa a completar o perfil.
 * - A camada é paga; a amostra é grátis.
 *
 * Gravar amostra rasa como camada injetaria no leitor exatamente o texto
 * genérico que a trava de confiança existe para impedir.
 *
 * ## Por que é gravada, já que é grátis
 *
 * Grátis para o aluno, não para nós: cada amostra é uma chamada de modelo.
 * Sem cache, recarregar a página do Ateliê cinco vezes custaria cinco
 * chamadas. Um documento por (aluno, curso) põe um teto no gasto e deixa o
 * "antes e depois" abrir instantâneo na segunda visita.
 *
 * `personaVersion` fica gravado para a tela poder oferecer *"seu perfil mudou
 * desde esta amostra — quer ver como ficaria agora?"*, que é o convite mais
 * honesto que existe para refazer.
 */
export interface IAtelieAmostra extends Document {
  userId: string;
  courseSlug: string;
  /** Índice do capítulo que virou amostra (o primeiro com número). */
  capitulo: number;
  tituloCapitulo: string;
  /** O trecho ORIGINAL, para o lado esquerdo do antes e depois. */
  original: string;
  abertura: string;
  exemplo: string;
  tarefa: string;
  /** A confiança que a persona tinha quando esta amostra foi escrita. */
  confianca: number;
  personaVersion: number;
  modelUsed: string;
  generatedAt: Date;
}

const AtelieAmostraSchema = new Schema<IAtelieAmostra>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true },
    capitulo: { type: Number, default: 0 },
    tituloCapitulo: { type: String, default: "" },
    original: { type: String, default: "" },
    abertura: { type: String, default: "" },
    exemplo: { type: String, default: "" },
    tarefa: { type: String, default: "" },
    confianca: { type: Number, default: 0 },
    personaVersion: { type: Number, default: 0 },
    modelUsed: { type: String, default: "" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AtelieAmostraSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });

export default (mongoose.models.AtelieAmostra as mongoose.Model<IAtelieAmostra>) ||
  mongoose.model<IAtelieAmostra>("AtelieAmostra", AtelieAmostraSchema);
