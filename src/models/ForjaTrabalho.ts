import mongoose from "mongoose";

/**
 * A FILA — o único ponto de encontro entre o site e a GPU de casa.
 *
 * ## A restrição que desenha tudo
 *
 * O site roda na Netlify, em função serverless. A GPU está na máquina do
 * Ricardo, atrás de um roteador doméstico: não existe rota de entrada, e abrir
 * uma seria expor a máquina dele à internet por causa de um botão de gerar
 * imagem. Então a seta é invertida — o site só GRAVA pedidos aqui, e o
 * trabalhador local PUXA.
 *
 * Nenhuma porta aberta, nenhum túnel, nenhum IP fixo. E o efeito colateral é a
 * promessa do produto: com a máquina desligada, os trabalhos **esperam** em vez
 * de falharem.
 *
 * ## O aluguel
 *
 * Reservar é ALUGAR. `reservadoAte` é um prazo; trabalho com prazo vencido volta
 * sozinho para a fila. Sem isso, um trabalhador que morre no meio (queda de luz,
 * ComfyUI reiniciado, Windows atualizando) deixaria o trabalho preso em
 * `rodando` para sempre, e a única saída seria alguém abrir o banco na mão.
 *
 * ⚠️ **O prazo tem de ser maior que o trabalho mais lento** (ver
 * `ALUGUEL_SEGUNDOS` no motor). Prazo curto demais devolve à fila um trabalho
 * que ainda está rodando — e aí a GPU compete consigo mesma gerando o mesmo
 * clipe duas vezes.
 *
 * ## O índice que faz a reserva ser barata
 *
 * `{ estado: 1, prioridade: -1, criadoEm: 1 }` é exatamente a ordenação da
 * reserva: pega o `esperando` de maior prioridade, mais antigo primeiro. Sem
 * ele, cada reserva varre a coleção inteira — e a reserva acontece a cada
 * poucos segundos, para sempre.
 */

const ForjaTrabalhoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    tipo: { type: String, enum: ["imagem", "video", "caderno", "peca"], required: true },
    onde: { type: String, enum: ["local", "nuvem"], default: "local" },
    grafo: { type: String, required: true },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
    referencias: [
      {
        _id: false,
        url: String,
        comoNome: String,
      },
    ],

    destino: {
      pecaId: String,
      quadroNumero: Number,
      personagemId: String,
      angulo: String,
      avulso: Boolean,
    },

    rotulo: { type: String, default: "" },

    estado: {
      type: String,
      enum: ["esperando", "reservado", "rodando", "pronto", "falhou", "cancelado"],
      default: "esperando",
    },
    prioridade: { type: Number, default: 50 },

    trabalhador: { type: String, default: "" },
    reservadoAte: { type: Date },

    tentativas: { type: Number, default: 0 },
    ultimoErro: { type: String, default: "" },

    resultado: {
      url: String,
      miniatura: String,
      largura: Number,
      altura: Number,
      duracaoMs: Number,
      bytes: Number,
      semente: Number,
    },

    creditos: { type: Number, default: 0 },
    /**
     * A conta prometida na hora de enfileirar, item a item.
     *
     * Guardada porque o débito acontece na CONCLUSÃO — a caixa cobra o que foi
     * entregue — e entre o pedido e a entrega o preço da tabela viva pode ter
     * mudado. Cobrar o preço novo por um pedido feito com o preço velho é a
     * divergência que o `montarOrcamento` do Ateliê foi escrito para nunca
     * deixar acontecer.
     */
    conta: { type: mongoose.Schema.Types.Mixed, default: [] },

    segundosEstimados: { type: Number, default: 30 },
    segundosReais: { type: Number },

    comecouEm: { type: Date },
    terminouEm: { type: Date },
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" } },
);

// a ordenação exata da reserva
ForjaTrabalhoSchema.index({ estado: 1, prioridade: -1, criadoEm: 1 });
// a tela do usuário
ForjaTrabalhoSchema.index({ userId: 1, criadoEm: -1 });
// o resgate dos alugueis vencidos
ForjaTrabalhoSchema.index({ estado: 1, reservadoAte: 1 });
// o teto diário: conta trabalhos locais do dia
ForjaTrabalhoSchema.index({ userId: 1, onde: 1, criadoEm: -1 });

export default mongoose.models.ForjaTrabalho || mongoose.model("ForjaTrabalho", ForjaTrabalhoSchema);
