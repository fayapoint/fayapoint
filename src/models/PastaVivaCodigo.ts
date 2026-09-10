import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * ── O CÓDIGO QUE LIGA A COMPRA NA HOTMART À NOSSA CONTA ──────────────────────
 * 10/09/2026
 *
 * A Hotmart cobra e entrega o PDF; ela não nos avisa quem comprou. Sem webhook,
 * a única ponte honesta entre "pagou lá" e "entra aqui" é um código impresso
 * dentro do próprio PDF, que a pessoa resgata uma vez.
 *
 * ## Um código, uma conta — e por que isso importa mais aqui
 *
 * `usadoPor` trava o código na primeira conta que o resgatar. Sem essa trava um
 * comprador publica o código num grupo e a Pasta Viva vira pública em uma
 * tarde — e ela é justamente a parte do produto que não pode vazar, porque é a
 * que se renova todo dia e sustenta o preço.
 *
 * ⚠️ **O código não prova pagamento, prova posse do arquivo.** Quem receber o
 * PDF de um amigo resgata igual. É uma trava de atrito, não de segurança: ela
 * torna o repasse chato o bastante para a maioria não fazer, e nos dá o nome de
 * quem entrou. Uma trava de verdade só existe com webhook da Hotmart — quando
 * houver, este arquivo vira o caminho legado.
 *
 * ## Por que o lote fica registrado
 *
 * `lote` diz de qual tiragem do PDF o código saiu. Se um lote inteiro vazar, dá
 * para invalidar aquele lote sem tirar o acesso de quem comprou de verdade.
 */

export interface IPastaVivaCodigo extends Document {
  /** O código em si, sempre em maiúsculas e sem ambiguidade visual. */
  codigo: string;
  lote: string;
  criadoEm: Date;

  usadoPor?: mongoose.Types.ObjectId | null;
  usadoEm?: Date | null;
  /** Invalidado à mão (vazamento de lote, estorno). */
  revogado: boolean;
}

const PastaVivaCodigoSchema = new Schema<IPastaVivaCodigo>(
  {
    codigo: { type: String, required: true, unique: true, index: true, uppercase: true },
    lote: { type: String, required: true, index: true },
    criadoEm: { type: Date, default: Date.now },
    usadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    usadoEm: { type: Date, default: null },
    revogado: { type: Boolean, default: false },
  },
  { collection: 'pastaVivaCodigos' },
);

const PastaVivaCodigo: Model<IPastaVivaCodigo> =
  (mongoose.models.PastaVivaCodigo as Model<IPastaVivaCodigo>) ||
  mongoose.model<IPastaVivaCodigo>('PastaVivaCodigo', PastaVivaCodigoSchema);

export default PastaVivaCodigo;
