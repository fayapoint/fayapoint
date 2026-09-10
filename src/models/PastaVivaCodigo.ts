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

  /**
   * ⚠️ Código de TIRAGEM: vale para muitas contas, não trava na primeira.
   *
   * Descoberto em 10/09/2026, com a coleção ainda vazia: o desenho original
   * (`usadoPor` singular) só funciona se cada comprador receber um código
   * diferente — e **a Hotmart entrega o MESMO arquivo PDF para todo mundo**.
   * Com um código impresso nesse PDF único, o primeiro comprador a resgatar
   * travaria o código e todos os outros ficariam de fora, tendo pago.
   *
   * Então o código que vai impresso no PDF nasce com `tiragem: true`, e o
   * resgate dele registra a matrícula sem marcar `usadoPor`. Isso é **atrito,
   * não segurança** — quem receber o PDF de um amigo resgata igual —, e essa
   * já era a natureza do mecanismo: trava de verdade só existiria com webhook
   * da Hotmart, que não existe.
   *
   * Códigos individuais (`tiragem: false`) continuam valendo para entrega
   * um-a-um, fora da Hotmart.
   */
  tiragem: boolean;

  /** Quantas contas já entraram por um código de tiragem. Só para medir. */
  resgates: number;
}

const PastaVivaCodigoSchema = new Schema<IPastaVivaCodigo>(
  {
    codigo: { type: String, required: true, unique: true, index: true, uppercase: true },
    lote: { type: String, required: true, index: true },
    criadoEm: { type: Date, default: Date.now },
    usadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    usadoEm: { type: Date, default: null },
    revogado: { type: Boolean, default: false },
    tiragem: { type: Boolean, default: false },
    resgates: { type: Number, default: 0 },
  },
  { collection: 'pastaVivaCodigos' },
);

const PastaVivaCodigo: Model<IPastaVivaCodigo> =
  (mongoose.models.PastaVivaCodigo as Model<IPastaVivaCodigo>) ||
  mongoose.model<IPastaVivaCodigo>('PastaVivaCodigo', PastaVivaCodigoSchema);

export default PastaVivaCodigo;
