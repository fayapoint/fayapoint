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

async function comTeto<T>(promessa: Promise<T>): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promessa,
      new Promise<never>((_, rejeita) => {
        temporizador = setTimeout(() => rejeita(new Error("redis timeout")), TETO_MS);
      }),
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

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
    const count = await comTeto(redis.incr(key));
    if (count === 1) {
      // Sem `await`: a janela é criada no primeiro pedido dela, e esperar a
      // confirmação não muda nenhuma decisão desta chamada.
      redis.expire(key, windowSeconds).catch(() => {});
    }

    const allowed = count <= limit;

    // O TTL só importa para preencher o `Retry-After` de quem foi barrado.
    // Cobrar essa ida ao Redis de TODO pedido — inclusive dos que passam, que
    // são a esmagadora maioria — era metade do custo do limitador.
    let resetSeconds = windowSeconds;
    if (!allowed) {
      try {
        const ttl = await comTeto(redis.ttl(key));
        if (typeof ttl === "number" && ttl > 0) resetSeconds = ttl;
      } catch {
        // fica com a janela cheia
      }
    }

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
