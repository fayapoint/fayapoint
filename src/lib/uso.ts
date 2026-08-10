import UsageEvent, { type UsageKind } from '@/models/UsageEvent';
import dbConnect from '@/lib/mongodb';

/**
 * O gravador de uso.
 *
 * ## A regra que manda em tudo aqui: **medir nunca derruba**
 *
 * Toda função deste arquivo engole o próprio erro. Um painel de monitoramento
 * que faz o checkout falhar porque o Mongo piscou é pior do que não ter painel:
 * troca uma informação que seria bom ter por dinheiro que era certo. Por isso
 * nada aqui é `await`-ado no caminho da resposta, e nada aqui lança.
 *
 * Ver `UsageEvent` para as três decisões que impedem esta coleção de engolir o
 * banco (TTL de 90 dias, um evento por navegação, campos curtos).
 */

export interface EntradaDeUso {
  userId?: string | null;
  userEmail?: string | null;
  kind: UsageKind;
  route: string;
  method?: string;
  status?: number;
  bytes?: number;
  bytesBreakdown?: Record<string, number>;
  area?: string;
  activeMs?: number;
  durationMs?: number;
  dbReads?: number;
  dbWrites?: number;
  credits?: number;
  label?: string;
  sessionId?: string;
  ipPrefix?: string;
  userAgent?: string;
  referer?: string;
}

/**
 * Tira a query string e corta o comprimento.
 *
 * ⚠️ Query string em rota é cardinalidade infinita: `/curso?x=1`, `/curso?x=2`…
 * viram milhares de "rotas" distintas, o agrupamento do painel deixa de
 * agrupar, e o índice cresce sem teto. Também é onde tokens costumam viajar —
 * guardar isso seria criar um vazamento de credencial dentro do log.
 */
function limparRota(rota: string): string {
  const semQuery = rota.split('?')[0].split('#')[0];
  return semQuery.slice(0, 200);
}

/**
 * O IP reduzido ao prefixo.
 *
 * Separa pessoas e regiões — que é para o que o número serve aqui — sem guardar
 * o endereço inteiro de ninguém. IPv4 vira `/24` (203.0.113.0), IPv6 vira os
 * três primeiros grupos.
 */
export function prefixoDeIp(ip?: string | null): string | undefined {
  if (!ip) return undefined;
  const limpo = ip.split(',')[0].trim();
  if (!limpo) return undefined;
  if (limpo.includes(':')) return limpo.split(':').slice(0, 3).join(':') + '::';
  const partes = limpo.split('.');
  if (partes.length !== 4) return undefined;
  return `${partes[0]}.${partes[1]}.${partes[2]}.0`;
}

/**
 * Grava um evento. **Nunca lança e nunca deve ser esperado no caminho quente.**
 */
export async function registrarUso(e: EntradaDeUso): Promise<void> {
  try {
    await dbConnect();
    await UsageEvent.create({
      userId: e.userId || undefined,
      userEmail: e.userEmail?.slice(0, 160),
      kind: e.kind,
      route: limparRota(e.route),
      method: e.method,
      status: e.status,
      bytes: Math.max(0, Math.round(e.bytes || 0)),
      bytesBreakdown: e.bytesBreakdown,
      area: e.area,
      activeMs: e.activeMs != null ? Math.round(e.activeMs) : undefined,
      durationMs: e.durationMs != null ? Math.round(e.durationMs) : undefined,
      dbReads: e.dbReads,
      dbWrites: e.dbWrites,
      credits: e.credits,
      label: e.label?.slice(0, 200),
      sessionId: e.sessionId?.slice(0, 40),
      ipPrefix: e.ipPrefix,
      userAgent: e.userAgent?.slice(0, 200),
      referer: e.referer ? limparRota(e.referer) : undefined,
      createdAt: new Date(),
    });
  } catch (erro) {
    // Silencioso de propósito — ver o cabeçalho do arquivo. Fica o console
    // para quem estiver olhando os logs, e nada mais.
    console.warn('[uso] falha ao registrar (ignorada):', (erro as Error)?.message);
  }
}

/**
 * Dispara sem esperar. É a forma normal de chamar `registrarUso` numa rota.
 *
 * ⚠️ `void promise` não é o mesmo que esquecer: sem o `.catch`, uma rejeição
 * vira `unhandledRejection` e, dependendo da configuração do runtime, derruba
 * o processo. O `.catch` vazio é o que torna o "não esperar" seguro.
 */
export function registrarUsoAssincrono(e: EntradaDeUso): void {
  void registrarUso(e).catch(() => {});
}

/**
 * Envolve um handler de rota e mede o que ele fez.
 *
 * ## Por que um invólucro e não um middleware
 *
 * O middleware do Next roda no runtime edge, onde não há conexão com o Mongo, e
 * roda ANTES do handler — não vê nem o status nem o tamanho da resposta, que
 * são as duas coisas que interessam. O invólucro roda em volta do handler, no
 * Node, e vê os dois.
 *
 * ## O tamanho vem de onde dá para vir
 *
 * `Content-Length` quando o handler o define; senão, o tamanho do corpo clonado.
 * ⚠️ Clonar a resposta é o que permite medir sem consumir o corpo que vai para
 * o cliente — ler `response.text()` direto entregaria um corpo já esgotado.
 *
 * Uso:
 * ```ts
 * export const POST = comUso('POST /api/credits', async (req) => { ... });
 * ```
 */
export function comUso<T extends unknown[]>(
  rotulo: string,
  handler: (req: Request, ...resto: T) => Promise<Response>,
  opcoes: { kind?: UsageKind; usuario?: (req: Request) => Promise<{ id?: string; email?: string } | null> } = {},
) {
  return async function envolvido(req: Request, ...resto: T): Promise<Response> {
    const inicio = Date.now();
    let resposta: Response;
    try {
      resposta = await handler(req, ...resto);
    } catch (erro) {
      // Erro do handler também é uso — e é o uso mais importante de todos.
      registrarUsoAssincrono({
        kind: opcoes.kind || 'api',
        route: rotulo,
        method: req.method,
        status: 500,
        durationMs: Date.now() - inicio,
        label: `erro: ${(erro as Error)?.message?.slice(0, 120)}`,
        ...dadosDaRequisicao(req),
      });
      throw erro;
    }

    let bytes = Number(resposta.headers.get('content-length') || 0);
    if (!bytes) {
      try {
        bytes = (await resposta.clone().arrayBuffer()).byteLength;
      } catch {
        bytes = 0;
      }
    }

    let usuario: { id?: string; email?: string } | null = null;
    if (opcoes.usuario) {
      try {
        usuario = await opcoes.usuario(req);
      } catch {
        usuario = null;
      }
    }

    registrarUsoAssincrono({
      userId: usuario?.id,
      userEmail: usuario?.email,
      kind: opcoes.kind || 'api',
      route: rotulo,
      method: req.method,
      status: resposta.status,
      bytes,
      durationMs: Date.now() - inicio,
      ...dadosDaRequisicao(req),
    });

    return resposta;
  };
}

function dadosDaRequisicao(req: Request) {
  const h = req.headers;
  return {
    ipPrefix: prefixoDeIp(h.get('x-nf-client-connection-ip') || h.get('x-forwarded-for')),
    userAgent: h.get('user-agent') || undefined,
    referer: h.get('referer') || undefined,
  };
}

/**
 * Atalho para lançar um evento de crédito na linha do tempo.
 *
 * O extrato em `credits.history` continua sendo a verdade contábil e não é
 * substituído por isto — mas ele guarda só os últimos 200 lançamentos e não tem
 * data de sessão, rota nem IP. Este evento põe o gasto **na mesma linha do
 * tempo** das páginas e das chamadas, que é o que responde "o que essa pessoa
 * estava fazendo quando gastou R$60".
 */
export function registrarCredito(dados: {
  userId: string;
  userEmail?: string;
  action: string;
  credits: number;
  descricao: string;
}): void {
  registrarUsoAssincrono({
    userId: dados.userId,
    userEmail: dados.userEmail,
    kind: 'credit',
    route: `credit/${dados.action}`,
    credits: dados.credits,
    label: dados.descricao,
  });
}
