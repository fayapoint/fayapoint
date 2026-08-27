import mongoose from "mongoose";

/**
 * O personagem da Forja — o rosto que sobrevive a vinte imagens.
 *
 * ## Por que coleção própria, e não dentro do `socialPersona`
 *
 * O caderno de personagem do criador mora em `User.socialPersona.caderno`, e
 * está certo: é persona, envelhece com ela e some com ela. Um personagem da
 * Forja é outra coisa — a pessoa pode ter cinco (ela, o cliente típico, o
 * sócio, o mascote, o cliente de outro segmento), cada um com figurinos e
 * caderno próprios, e todos são referenciados por peças que já existem.
 *
 * Enfiar isso num array dentro do `User` faria três estragos conhecidos: o
 * documento do usuário cresceria sem teto, toda leitura de perfil arrastaria
 * imagens que ninguém pediu, e a projeção `.select()` teria de lembrar de
 * incluir o campo — que é exatamente o defeito que já zerou o saldo de crédito
 * na tela por esquecer `credits` num select.
 *
 * ⚠️ `origem: "criador"` é único por usuário: a pessoa é uma só. A regra é
 * imposta pelo índice parcial abaixo, e não por uma conferência na rota — rota
 * esquece, índice não.
 */

const FigurinoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    nome: { type: String, default: "" },
    descricao: { type: String, default: "" },
    en: { type: String, default: "" },
    ocasiao: { type: String, default: "" },
    padrao: { type: Boolean, default: false },
  },
  { _id: false },
);

const AparenciaSchema = new mongoose.Schema(
  {
    genero: String,
    idade: Number,
    faixaEtaria: String,
    pele: String,
    cabeloCor: String,
    cabeloEstilo: String,
    barba: String,
    olhos: String,
    corpo: String,
    alturaCm: Number,
    oculos: Boolean,
    tipoOculos: String,
    marcas: [String],
    descricaoLivre: String,
  },
  { _id: false },
);

const ForjaPersonagemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    origem: { type: String, enum: ["criador", "publico", "elenco"], required: true },
    nome: { type: String, required: true },
    papel: { type: String, default: "" },
    resumo: { type: String, default: "" },

    aparencia: { type: AparenciaSchema, default: () => ({}) },
    figurinos: { type: [FigurinoSchema], default: [] },

    psicologia: {
      quer: String,
      trava: String,
      objecao: String,
      rotina: String,
      fala: String,
    },

    /** fotos reais enviadas — é ELA que ancora o rosto, não a descrição */
    referencias: [{ type: String }],

    caderno: {
      imagens: [{ type: String }],
      origem: [{ type: String }],
      geradoEm: Date,
      status: { type: String, enum: ["pendente", "pronto", "falhou"] },
    },

    /**
     * A semente. Guardada porque semente igual + prompt igual devolve rosto
     * muito mais parecido — o truque mais barato de consistência que existe.
     */
    semente: { type: Number },

    /**
     * O que esta ficha já devolveu para a persona do usuário.
     *
     * Guardado para a tela poder dizer "isto foi para o seu perfil" e para o
     * segundo envio não sobrescrever de novo o que a pessoa corrigiu à mão.
     */
    contribuiuEm: { type: Date },
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" } },
);

ForjaPersonagemSchema.index({ userId: 1, criadoEm: -1 });
ForjaPersonagemSchema.index(
  { userId: 1, origem: 1 },
  { unique: true, partialFilterExpression: { origem: "criador" } },
);

export default mongoose.models.ForjaPersonagem || mongoose.model("ForjaPersonagem", ForjaPersonagemSchema);
