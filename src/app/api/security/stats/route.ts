import { NextRequest, NextResponse } from "next/server";

import { porSegredoOuAdmin } from "@/lib/guarda-de-servico";
import redis from "@/lib/redis";

/**
 * Estatísticas de segurança — IPs bloqueados, strikes, contadores.
 *
 * ⚠️ ESTAVA ABERTA EM PRODUÇÃO, E O `POST` ERA PIOR QUE O `GET`.
 *
 * A guarda era `if (adminKey && authHeader !== ...)`, e `ADMIN_API_KEY` **não
 * está configurada na Netlify** (conferido em 18/08/2026 com `netlify env:list`).
 * Variável ausente faz a condição inteira desaparecer: o `GET` publicava a lista
 * de IPs bloqueados e os contadores de abuso, e o `POST` deixava **qualquer um
 * bloquear ou desbloquear qualquer IP** — negar o site a visitante legítimo, ou
 * tirar da lista quem foi barrado, sem prova nenhuma.
 *
 * `if (SEGREDO && confere)` troca "não configurado" por "não protegido". A regra
 * certa é a inversa, e agora mora em `lib/guarda-de-servico.ts`.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await porSegredoOuAdmin(request, ["x-social-secret", "x-admin-secret"]))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get blocked IPs count
    const blockedKeys = await redis.keys("blocked:ip:*");
    
    // Get rate limit strikes
    const strikeKeys = await redis.keys("strikes:*");
    
    // Get current request counts (sample)
    const requestKeys = await redis.keys("requests:count:*");
    
    // Get rate limit keys
    const rateLimitKeys = await redis.keys("ratelimit:global:*");

    // Get sample of blocked IPs
    const blockedSample: string[] = [];
    for (const key of blockedKeys.slice(0, 10)) {
      const ip = key.replace("blocked:ip:", "");
      const ttl = await redis.ttl(key);
      blockedSample.push(`${ip} (${Math.round(ttl / 60)}min remaining)`);
    }

    // Get high request count IPs
    const highTrafficIps: { ip: string; count: number }[] = [];
    for (const key of requestKeys.slice(0, 20)) {
      const count = await redis.get<number>(key);
      if (count && count > 30) {
        const ip = key.replace("requests:count:", "");
        highTrafficIps.push({ ip, count });
      }
    }
    highTrafficIps.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats: {
        blockedIps: blockedKeys.length,
        activeStrikes: strikeKeys.length,
        activeRateLimits: rateLimitKeys.length,
        uniqueIpsLastMinute: requestKeys.length,
      },
      blockedSample,
      highTrafficIps: highTrafficIps.slice(0, 10),
      message: blockedKeys.length > 0 
        ? `⚠️ ${blockedKeys.length} IPs currently blocked`
        : "✅ No blocked IPs",
    });
  } catch (error) {
    console.error("Security stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch security stats" },
      { status: 500 }
    );
  }
}

// Bloqueia ou desbloqueia um IP à mão. Ver o aviso no `GET` acima: isto
// respondia a quem pedisse.
export async function POST(request: NextRequest) {
  try {
    if (!(await porSegredoOuAdmin(request, ["x-social-secret", "x-admin-secret"]))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ip, duration = 3600 } = body;

    if (!ip) {
      return NextResponse.json({ error: "IP required" }, { status: 400 });
    }

    if (action === "block") {
      await redis.set(`blocked:ip:${ip}`, 1, { ex: duration });
      return NextResponse.json({ 
        success: true, 
        message: `Blocked ${ip} for ${Math.round(duration / 60)} minutes` 
      });
    } else if (action === "unblock") {
      await redis.del(`blocked:ip:${ip}`);
      await redis.del(`strikes:${ip}`);
      return NextResponse.json({ 
        success: true, 
        message: `Unblocked ${ip}` 
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Security action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
