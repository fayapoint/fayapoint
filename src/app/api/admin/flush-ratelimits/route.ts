import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

/**
 * POST /api/admin/flush-ratelimits — apaga contadores, strikes e IPs bloqueados.
 *
 * ⚠️ ESTA ROTA ESTAVA ABERTA PARA QUALQUER UM, EM PRODUÇÃO.
 *
 * A guarda era `process.env.GEOBLOCK_BYPASS_SECRET || "fayapoint-bypass-2024"`.
 * `GEOBLOCK_BYPASS_SECRET` **não está configurada na Netlify** (conferido em
 * 18/08/2026 com `netlify env:list`), então o segredo em vigor era a string do
 * `||` — escrita neste arquivo, num repositório PÚBLICO
 * (`github.com/fayapoint/fayapoint`). Quem lesse o repo podia zerar o limitador
 * de taxa e a lista de IPs bloqueados do site com um `curl`.
 *
 * É o mesmo defeito que já tinha sido consertado em
 * `netlify/edge-functions/geoblock.ts` (onde o padrão abria o site inteiro de
 * qualquer país) — este ficou para trás.
 *
 * Agora: `SOCIAL_CRON_SECRET`/`AINEWS_SECRET`, o par que as outras rotas de
 * automação já usam e que EXISTE no ambiente de produção, e **falha fechada** se
 * nenhum estiver configurado.
 *
 * ⚠️ Nunca escreva `process.env.X || "alguma-senha"` neste repositório. Senha
 * com valor padrão no código é senha publicada.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
  const secret = request.headers.get("x-social-secret") || request.headers.get("x-admin-secret");

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patterns = [
      "ratelimit:*",
      "ratelimit:rsc:*",
      "ratelimit:pages:*",
      "ratelimit:admin:*",
      "api:global:*",
      "api:strikes:*",
      "api:datacenter:*",
      "blocked:ip:*",
      "strikes:*",
      "requests:count:*",
      "bandwidth:*",
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Flushed ${totalDeleted} rate limit keys`,
      patterns,
    });
  } catch (error) {
    console.error("Error flushing rate limits:", error);
    return NextResponse.json(
      { error: "Failed to flush rate limits" },
      { status: 500 }
    );
  }
}
