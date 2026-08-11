import mongoose, { Schema, type Document } from 'mongoose';

/**
 * Os ajustes do Ateliê, por aluno e por curso (10/08/2026).
 *
 * ## Por que por CURSO, e não no perfil
 *
 * A tentação é guardar "tom preferido" na persona e acabar. Mas a mesma pessoa
 * quer o curso de tributação denso e o de Instagram enxuto — e essa diferença
 * não é sobre quem ela é, é sobre o que ela veio buscar AQUI. Ajuste guardado
 * no perfil obrigaria a trocar a preferência global toda vez que trocasse de
 * curso, e ninguém faz isso: o padrão venceria sempre.
 *
 * ## Por que documento próprio e não um campo em `UserCourseLayer`
 *
 * A camada existe por CAPÍTULO e é apagada/reescrita; o ajuste é um só, do
 * curso inteiro, e precisa sobreviver a "refazer tudo". Guardar junto faria a
 * escolha do aluno desaparecer no primeiro regenerar.
 *
 * ⚠️ Ele é **entrada de prompt**: mudar aqui muda o texto que sai. Por isso
 * `atualizadoEm` — é ele que permite à tela dizer "seus ajustes mudaram desde
 * que estes capítulos foram escritos", do mesmo jeito que a amostra faz com a
 * `personaVersion`.
 */
export interface IAtelieConfig extends Document {
  userId: string;
  courseSlug: string;
  tom: string;
  profundidade: string;
  extensao: string;
  foco: string[];
  narrador: string;
  atualizadoEm: Date;
  /**
   * ── O PACOTE JÁ PAGO DESTE CURSO (11/08/2026) ────────────────────────────
   *
   * O Ateliê passou de preço por capítulo para **preço por curso, em quatro
   * degraus** (ver `PACOTES_CURSO`). Isso obriga a lembrar de uma coisa que
   * antes não existia: **este aluno já comprou este curso personalizado?**
   *
   * Sem esta memória, cada lote de geração cobraria os 25 de novo — um curso
   * de 30 capítulos, gerado em lotes de 2, sairia por 375. E o aluno que volta
   * para regerar depois de aprofundar o perfil pagaria uma segunda vez pelo que
   * já é dele, que é exatamente o comportamento que a casa quer PREMIAR.
   *
   * Fica aqui, e não em `UserCourseLayer`, porque a camada é por capítulo e é
   * apagada em "refazer tudo" — a compra tem de sobreviver a isso.
   */
  pacotePago?: {
    id: string;
    /** Quanto foi pago no total até agora por este curso (soma dos degraus). */
    creditos: number;
    pagoEm: Date;
  };
}

const AtelieConfigSchema = new Schema<IAtelieConfig>(
  {
    userId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true, index: true },
    tom: { type: String, default: 'espelho' },
    profundidade: { type: String, default: 'equilibrado' },
    extensao: { type: String, default: 'media' },
    foco: { type: [String], default: [] },
    narrador: { type: String, default: 'fernando_borges' },
    atualizadoEm: { type: Date, default: Date.now },
    // ⚠️ Campo NOVO. Se ele não estiver declarado aqui, o Mongoose descarta a
    // compra em silêncio (foi o defeito de `socialPersona.negocio`, 03–10/08) e
    // o aluno é cobrado de novo a cada lote — sem erro nenhum na tela.
    pacotePago: {
      type: new Schema(
        {
          id: { type: String, required: true },
          creditos: { type: Number, required: true },
          pagoEm: { type: Date, required: true },
        },
        { _id: false },
      ),
      required: false,
    },
  },
  { timestamps: true },
);

// Um documento por (aluno, curso) — o `upsert` da rota depende deste índice
// para não criar duas configurações concorrentes em dois cliques rápidos.
AtelieConfigSchema.index({ userId: 1, courseSlug: 1 }, { unique: true });

const AtelieConfig: mongoose.Model<IAtelieConfig> =
  mongoose.models.AtelieConfig || mongoose.model<IAtelieConfig>('AtelieConfig', AtelieConfigSchema);

export default AtelieConfig;
