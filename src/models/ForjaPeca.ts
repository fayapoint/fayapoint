import mongoose from "mongoose";

/**
 * A peça da Forja — o plano de filmagem do conteúdo do usuário.
 *
 * Sucede o `Storyboard`, e o sucede sem apagá-lo: as peças antigas continuam
 * lendo por `Storyboard`, e a migração acontece quando a pessoa abre a peça
 * (ver `/api/forja/pecas`). Apagar a coleção velha para "limpar" tiraria da
 * pessoa o trabalho que ela já fez.
 *
 * ## O que este esquema tem e o antigo não tinha
 *
 * - **`quemAparece`** — quais personagens estão no quadro. É o campo que torna
 *   possível o mesmo rosto atravessar os cinco quadros.
 * - **`video` e `semente`** — o clipe gerado a partir da arte, e a semente que
 *   produziu a arte. Sem a semente, regerar um quadro devolve outra pessoa.
 * - **`trabalhoId`** — o trabalho na fila enquanto ele existe, para a tela saber
 *   o que está acontecendo sem ficar varrendo a coleção de trabalhos.
 * - **`correcoes`** — o que o motor consertou sozinho na câmera. Vai para a
 *   tela, nunca para o prompt: a pessoa tem o direito de saber que a máquina
 *   mexeu na escolha dela.
 */

const QuadroSchema = new mongoose.Schema(
  {
    numero: { type: Number, required: true },
    titulo: { type: String, default: "" },
    acao: { type: String, default: "" },
    acaoEn: { type: String, default: "" },
    cenarioEn: { type: String, default: "" },
    quemAparece: [{ type: String }],
    textoNaTela: { type: String, default: "" },
    fala: { type: String, default: "" },
    duracao: { type: Number, default: null },
    ajustes: { type: mongoose.Schema.Types.Mixed, default: {} },

    prompt: { type: String, default: "" },
    negativo: { type: String, default: "" },
    leitura: { type: String, default: "" },
    correcoes: [{ type: String }],

    arte: { type: String, default: "" },
    video: { type: String, default: "" },
    semente: { type: Number },

    estado: {
      type: String,
      enum: ["planejado", "na-fila", "gerado", "aprovado"],
      default: "planejado",
    },
    trabalhoId: { type: String, default: "" },
  },
  { _id: false },
);

const ForjaPecaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    formato: { type: String, required: true },
    tema: { type: String, required: true },
    observacao: { type: String, default: "" },
    titulo: { type: String, default: "" },
    legenda: { type: String, default: "" },
    hashtags: [{ type: String }],
    quadros: [QuadroSchema],

    /** os personagens usados, por id — a tela mostra quem está na peça */
    personagens: [{ type: String }],

    /** o que custou montar o plano. A geração da arte é cobrada à parte (ou não é). */
    creditos: { type: Number, default: 0 },
    modelo: { type: String, default: "" },

    /** herdada do `Storyboard` antigo? — para a migração ser visível e única */
    migradaDe: { type: String, default: "" },
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" } },
);

ForjaPecaSchema.index({ userId: 1, criadoEm: -1 });
ForjaPecaSchema.index({ migradaDe: 1 }, { sparse: true });

export default mongoose.models.ForjaPeca || mongoose.model("ForjaPeca", ForjaPecaSchema);
