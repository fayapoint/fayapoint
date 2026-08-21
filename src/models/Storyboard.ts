import mongoose from "mongoose";

/**
 * O storyboard de uma peça do usuário — o plano de filmagem do post dele.
 *
 * Guarda o quadro inteiro, não só o prompt: a ação, o texto de tela, a fala e
 * os ajustes de câmera. O prompt em inglês é derivado (`montarPrompt`) e fica
 * gravado junto para não depender do motor na hora de copiar — mas quando o
 * quadro é editado, ele é recomposto.
 */

const QuadroSchema = new mongoose.Schema(
  {
    numero: { type: Number, required: true },
    titulo: { type: String, default: "" },
    acao: { type: String, default: "" },
    acaoEn: { type: String, default: "" },
    textoNaTela: { type: String, default: "" },
    fala: { type: String, default: "" },
    duracao: { type: Number, default: null },
    ajustes: { type: mongoose.Schema.Types.Mixed, default: {} },
    prompt: { type: String, default: "" },
    negativo: { type: String, default: "" },
    arte: { type: String, default: "" },
    estado: { type: String, enum: ["planejado", "gerado", "aprovado"], default: "planejado" },
  },
  { _id: false },
);

const StoryboardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    formato: { type: String, enum: ["reel", "carrossel", "story", "post", "anuncio"], required: true },
    tema: { type: String, required: true },
    observacao: { type: String, default: "" },
    titulo: { type: String, default: "" },
    legenda: { type: String, default: "" },
    hashtags: [{ type: String }],
    quadros: [QuadroSchema],
    /** o que custou gerar, para o extrato bater com a peça */
    creditos: { type: Number, default: 0 },
    modelo: { type: String, default: "" },
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" } },
);

StoryboardSchema.index({ userId: 1, criadoEm: -1 });

export default mongoose.models.Storyboard || mongoose.model("Storyboard", StoryboardSchema);
