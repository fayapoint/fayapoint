import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * O registro de uso por usuário (10/08/2026).
 *
 * ## Por que isto passou a existir
 *
 * Ricardo: *"nesta fase eu preciso monitorar de perto o uso de banda e de banco,
 * então a atividade do usuário precisa ser o mais granular possível"* — e para
 * ir aos planos pagos, essa informação precisa existir antes, não depois.
 *
 * O que havia até aqui: `credits.history` (últimos 200 lançamentos, só dinheiro),
 * `enrolledCourses`, `progress` e `lastLogin`. **Nenhum deles diz quanto alguém
 * baixou, quantas vezes o banco foi lido, ou o que a pessoa fez ontem.** A
 * coleção `activities` do Mission Control é dos AGENTES (Kiki e companhia), não
 * dos alunos.
 *
 * ## ⚠️ O risco óbvio: telemetria que engorda o banco que ela deveria vigiar
 *
 * O banco inteiro tem 20,7 MB de dados hoje. Uma linha por requisição levaria
 * essa coleção a passar o site em pouco tempo — e o remédio viraria a doença.
 * Três decisões seguram isso:
 *
 * 1. **TTL de 90 dias** (`expireAt`). O Mongo apaga sozinho; não há cron para
 *    esquecer de rodar. 90 dias cobre um trimestre de comparação, que é o
 *    horizonte de quem está decidindo preço.
 * 2. **Um evento por NAVEGAÇÃO, não por recurso.** O cliente soma os bytes de
 *    todos os recursos da página (imagem, vídeo, script) e manda um evento só,
 *    com a quebra por tipo. Uma aula com 40 imagens vira 1 documento, não 41.
 * 3. **Campos curtos e limitados.** Rota sem query string, agente truncado, IP
 *    guardado como prefixo (`/24`) — o suficiente para separar pessoas e
 *    regiões, sem virar dossiê nem inflar o documento.
 */

export type UsageKind =
  /** Navegação: uma página aberta, com os bytes que ela realmente puxou. */
  | 'pageview'
  /** Chamada de API do lado do servidor, com bytes de resposta e tempo. */
  | 'api'
  /** Lançamento de crédito (gasto, concessão, compra). */
  | 'credit'
  /** Entrada e saída da conta. */
  | 'auth'
  /** Progresso de curso: aula aberta, capítulo concluído. */
  | 'course';

export interface IUsageEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  /** Guardado junto para o painel não precisar de `$lookup` a cada linha. */
  userEmail?: string;
  kind: UsageKind;
  /** Rota SEM query string — query string vira cardinalidade infinita. */
  route: string;
  method?: string;
  status?: number;
  /** Bytes que saíram para o cliente. É a medida de banda. */
  bytes: number;
  /** Quebra da banda por tipo de recurso, só em `pageview`. */
  bytesBreakdown?: {
    document?: number;
    script?: number;
    style?: number;
    image?: number;
    media?: number;
    font?: number;
    fetch?: number;
    other?: number;
  };
  /**
   * A área legível onde a pessoa esteve ("Portal · Biblioteca", "Aula (leitor)").
   * Ver `lib/area.ts` — rota crua não agrupa, e o portal não muda de rota.
   */
  area?: string;
  /**
   * ⚠️ Tempo com a tela À FRENTE da pessoa, não tempo de relógio. O cronômetro
   * para quando a aba fica oculta. Aba esquecida aberta a noite inteira marcaria
   * 8 horas de leitura atenta e afundaria a média de todas as outras sessões.
   */
  activeMs?: number;
  /** Tempo de resposta do servidor (api) ou de carga da página (pageview). */
  durationMs?: number;
  /** Operações de banco atribuídas a esta requisição. */
  dbReads?: number;
  dbWrites?: number;
  /** Créditos movimentados (negativo = gasto). */
  credits?: number;
  /** Rótulo curto do que aconteceu, para a linha do tempo ficar legível. */
  label?: string;
  /** Identifica a sessão do navegador sem identificar a pessoa. */
  sessionId?: string;
  /** Prefixo /24 do IPv4 (ou /48 do IPv6). Nunca o endereço inteiro. */
  ipPrefix?: string;
  userAgent?: string;
  referer?: string;
  createdAt: Date;
  /** Alvo do índice TTL. */
  expireAt: Date;
}

const RETENCAO_DIAS = Number(process.env.USAGE_RETENTION_DAYS || 90);

const UsageEventSchema = new Schema<IUsageEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, maxlength: 160 },
    kind: {
      type: String,
      enum: ['pageview', 'api', 'credit', 'auth', 'course'],
      required: true,
      index: true,
    },
    route: { type: String, required: true, maxlength: 200 },
    method: { type: String, maxlength: 10 },
    status: { type: Number },
    bytes: { type: Number, default: 0 },
    bytesBreakdown: {
      document: Number,
      script: Number,
      style: Number,
      image: Number,
      media: Number,
      font: Number,
      fetch: Number,
      other: Number,
    },
    area: { type: String, maxlength: 80, index: true },
    activeMs: { type: Number },
    durationMs: { type: Number },
    dbReads: { type: Number },
    dbWrites: { type: Number },
    credits: { type: Number },
    label: { type: String, maxlength: 200 },
    sessionId: { type: String, maxlength: 40 },
    ipPrefix: { type: String, maxlength: 45 },
    userAgent: { type: String, maxlength: 200 },
    referer: { type: String, maxlength: 200 },
    createdAt: { type: Date, default: Date.now, index: true },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + RETENCAO_DIAS * 24 * 60 * 60 * 1000),
    },
  },
  { versionKey: false },
);

/**
 * O índice que faz o Mongo apagar sozinho.
 *
 * ⚠️ `expireAfterSeconds: 0` significa "expire NA data do campo", não "expire
 * imediatamente" — é o único jeito de ter retenção por documento. Se fosse um
 * número de segundos, ele contaria a partir do campo e o valor do campo
 * deixaria de importar.
 */
UsageEventSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

/** O painel pergunta sempre "o que ESTE usuário fez, do mais novo ao mais velho". */
UsageEventSchema.index({ userId: 1, createdAt: -1 });
/** E "quanto de banda saiu no período", que varre por data e agrupa. */
UsageEventSchema.index({ createdAt: -1, kind: 1 });

const UsageEvent: Model<IUsageEvent> =
  mongoose.models.UsageEvent || mongoose.model<IUsageEvent>('UsageEvent', UsageEventSchema);

export default UsageEvent;
