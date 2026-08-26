import { comTeto as comTetoCompartilhado } from "@/lib/com-teto";
import redis from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
};

function isRedisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getClientIpFromRequest(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }

  return "unknown";
}

/**
 * Teto de tempo para o Redis dizer alguma coisa dentro do middleware.
 *
 * ⚠️ O middleware (`src/proxy.ts`) é uma EDGE FUNCTION da Netlify, e ela roda
 * antes de qualquer página. Um `await` sem teto aqui não atrasa um pedido: ele
 * segura a borda inteira, e a Netlify responde "This edge function has crashed
 * — the edge function timed out" no lugar do site.
 *
 * 800ms é folgado para um HTTP REST ao Upstash (medido em ~130ms) e curto o
 * bastante para nunca ser a causa de uma tela branca.
 */
const TETO_MS = 800;

/** A mecânica mora em `com-teto.ts`; aqui fica só o prazo da borda. */
const comTeto = <T>(promessa: Promise<T>) => comTetoCompartilhado(promessa, TETO_MS, "redis na borda");

/**
 * ⚠️ POR QUE ISTO É UM SCRIPT, E NÃO DOIS COMANDOS (26/08/2026)
 *
 * A versão anterior fazia `INCR` e, quando o contador voltava 1, um `EXPIRE`
 * separado. Os dois passavam pelo `comTeto` de 800ms. Se o `EXPIRE` demorasse
 * mais que isso — Upstash lento, rede ruim, borda fria —, ele lançava, o
 * `catch` lá embaixo devolvia "liberado", e a requisição passava.
 *
 * Só que o `INCR` JÁ TINHA ENTRADO e o `EXPIRE` não. A chave nascia **sem
 * prazo de validade**. Dali em diante todo pedido daquele IP incrementava um
 * contador que nunca zerava, e ao passar do limite o 429 virava **permanente**.
 * Sem alerta, sem log que alguém lesse, sem volta.
 *
 * Não é hipótese: em 26/08/2026 o IP desta casa ficou preso assim por mais de
 * uma hora, com o Ricardo levando "Too Many Requests" no próprio site enquanto
 * navegava devagar. A assinatura é inconfundível — `x-ratelimit-remaining: 0`
 * que não drena com o tempo, e `x-ratelimit-reset` travado em 60, que é o valor
 * de fallback usado quando `TTL` devolve `-1` (chave sem prazo).
 *
 * O comentário que estava aqui descrevia exatamente este desastre e existia
 * para evitá-lo. O `await` estava no lugar. Quem reabriu a porta foi o teto de
 * 800ms, acrescentado depois — e o `com-teto.ts` enuncia a regra que ele
 * violava, em letras maiúsculas:
 *
 *   "ESCRITA precisa de teto FOLGADO, muito acima do tempo medido. Teto curto
 *    em escrita não protege nada — ele só transforma 'escrita lenta' em
 *    'escrita perdida', que é exatamente o defeito que se estava consertando."
 *
 * `EXPIRE` é escrita, e estava correndo sob o teto de leitura.
 *
 * E o defeito se AUTO-PERPETUA: perdido o prazo, `INCR` nunca mais devolve 1
 * naquela chave, então o `EXPIRE` nunca é tentado de novo. Um instante de azar
 * bastava, e era para sempre.
 *
 * Medido no Upstash de produção em 26/08: **9 chaves `ratelimit:*` sem prazo
 * nenhum**, acumuladas ao longo do tempo — uma delas com contador em 533, que é
 * o dobro do teto. Chave saudável expira em 60s e some, então essas 9 não são
 * uma taxa de falha: são o depósito permanente de todas as vezes que falhou.
 *
 * Três propriedades do script, e nenhuma delas se consegue com comandos soltos:
 *
 *  1. **Atômico.** Contar e marcar prazo acontecem juntos ou não acontecem.
 *     Não existe mais o estado intermediário que criava a chave imortal.
 *  2. **Se conserta sozinho.** Se encontrar uma chave sem prazo — as que já
 *     foram criadas pelo defeito antigo —, ele põe prazo. Todo IP hoje banido
 *     para sempre volta a funcionar sozinho na próxima visita, em no máximo uma
 *     janela. Não é preciso limpar nada à mão.
 *  3. **Mais barato, não mais caro.** O plano do Upstash cobra por comando, e
 *     este é UM. O caminho antigo gastava `INCR` sempre, mais `EXPIRE` uma vez
 *     por janela, mais `TTL` em TODA requisição bloqueada. O `TTL` agora volta
 *     de graça dentro da resposta.
 *
 * O teto de 800ms continua valendo, e continua certo: isto roda numa edge
 * function e um `await` pendurado derruba a borda inteira. A diferença é que
 * agora estourar o teto não deixa lixo permanente para trás.
 */
const CONTAR_E_GARANTIR_PRAZO = `
local atual = redis.call('INCR', KEYS[1])
local prazo = tonumber(ARGV[1])
if atual == 1 then
  redis.call('EXPIRE', KEYS[1], prazo)
  return {atual, prazo}
end
local resta = redis.call('TTL', KEYS[1])
if resta < 0 then
  -- Chave sem prazo: ou nasceu do defeito antigo, ou o EXPIRE se perdeu.
  -- Marcar agora é o que impede o banimento eterno.
  redis.call('EXPIRE', KEYS[1], prazo)
  resta = prazo
end
return {atual, resta}
`;

export async function rateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = params;

  const liberado: RateLimitResult = {
    allowed: true,
    limit,
    remaining: limit,
    resetSeconds: windowSeconds,
  };

  if (!isRedisConfigured()) {
    return liberado;
  }

  try {
    const [count, ttl] = (await comTeto(
      redis.eval(CONTAR_E_GARANTIR_PRAZO, [key], [String(windowSeconds)])
    )) as [number, number];

    const allowed = count <= limit;

    // O TTL vem junto do contador — o script já o devolve. Antes disto, saber
    // quanto falta para liberar custava uma segunda ida ao Upstash, e só no
    // caminho de quem foi bloqueado.
    const resetSeconds = ttl > 0 ? ttl : windowSeconds;

    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - count),
      resetSeconds,
    };
  } catch (erro) {
    /**
     * FALHA ABERTA, de propósito.
     *
     * Este limitador existe para conter abuso, não para ser porta de entrada.
     * Se o Upstash está fora do ar, lento ou acima da cota, a escolha é entre
     * "todo mundo entra sem contador" e "ninguém entra em lugar nenhum" — e a
     * segunda transforma um problema de terceiro no site inteiro fora do ar.
     * O bloqueio geográfico e o portão de admin continuam de pé, e nenhum dos
     * dois depende do Redis.
     */
    console.error("[RATE_LIMIT_FALHOU_ABERTO]", key, erro);
    return liberado;
  }
}
