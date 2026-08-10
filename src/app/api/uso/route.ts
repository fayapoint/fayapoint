import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { registrarUso, prefixoDeIp } from '@/lib/uso';
import { areaDe } from '@/lib/area';

/**
 * POST /api/uso — o farol do navegador.
 *
 * ## Por que a banda é medida no CLIENTE
 *
 * A banda que importa não é a das rotas de API — é a das **imagens e vídeos**.
 * O acervo de mídia dos cursos tem 122 MB no disco, e uma aula puxa dezenas de
 * arquivos. Nada disso passa por um handler nosso: sai do CDN direto para o
 * navegador. Medir só no servidor mostraria os bytes do JSON e ignoraria 99%
 * do tráfego real.
 *
 * O navegador sabe o número exato. `PerformanceResourceTiming.transferSize` é
 * quantos bytes cruzaram a rede — **já descontando o que veio do cache**, que é
 * exatamente a pergunta de quem paga por banda.
 *
 * ## Confiança
 *
 * ⚠️ O corpo vem do cliente, então é *reivindicação*, não prova: dá para forjar
 * um número. Serve para dimensionar consumo, **não** para cobrar por ele.
 * Quantidade e tamanho são limitados aqui para que um cliente hostil ou com
 * defeito não escreva lixo grande no banco.
 *
 * ⚠️ O `userId` NUNCA vem do corpo — sai do cookie de sessão. Aceitá-lo do
 * cliente deixaria qualquer um escrever atividade na conta de outro.
 */

export const runtime = 'nodejs';

/** Um pageview de 2 GB é defeito ou ataque, não uso. */
const TETO_BYTES = 2 * 1024 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const corpo = await request.json().catch(() => null);
    if (!corpo || typeof corpo !== 'object') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const rota = typeof corpo.route === 'string' ? corpo.route : null;
    if (!rota) return NextResponse.json({ ok: false }, { status: 400 });

    // Sessão anônima também é registrada: saber quanta banda sai para visitante
    // não logado é metade da conta de banda.
    const authUser = await getAuthUser().catch(() => null);

    const bytes = Math.min(TETO_BYTES, Math.max(0, Number(corpo.bytes) || 0));

    const quebra: Record<string, number> = {};
    if (corpo.breakdown && typeof corpo.breakdown === 'object') {
      for (const chave of ['document', 'script', 'style', 'image', 'media', 'font', 'fetch', 'other']) {
        const v = Number((corpo.breakdown as Record<string, unknown>)[chave]);
        if (Number.isFinite(v) && v > 0) quebra[chave] = Math.min(TETO_BYTES, Math.round(v));
      }
    }

    // ⚠️ A área é NOMEADA no servidor, a partir da rota e da aba. O cliente
    // manda a aba (só ele sabe qual estava aberta no momento do clique), nunca
    // o rótulo. Aceitar o rótulo pronto deixaria um cliente com defeito — ou
    // hostil — encher o painel de categorias inventadas, e o índice junto.
    const aba = typeof corpo.tab === 'string' ? corpo.tab.slice(0, 40) : null;
    const area = areaDe(rota.split('?')[0], aba);

    // Um tempo ativo maior que um dia é defeito, não uso.
    const activeMs = Math.min(24 * 60 * 60 * 1000, Math.max(0, Number(corpo.activeMs) || 0));

    await registrarUso({
      userId: authUser?.id,
      userEmail: authUser?.email,
      kind: 'pageview',
      route: rota,
      area,
      activeMs: activeMs || undefined,
      bytes,
      bytesBreakdown: Object.keys(quebra).length ? quebra : undefined,
      durationMs: Number.isFinite(Number(corpo.durationMs)) ? Number(corpo.durationMs) : undefined,
      label: typeof corpo.label === 'string' ? corpo.label : undefined,
      sessionId: typeof corpo.sessionId === 'string' ? corpo.sessionId : undefined,
      ipPrefix: prefixoDeIp(
        request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for'),
      ),
      userAgent: request.headers.get('user-agent') || undefined,
      referer: typeof corpo.referer === 'string' ? corpo.referer : undefined,
    });

    // 204: o `sendBeacon` não lê a resposta, e um corpo aqui seria banda gasta
    // para medir banda.
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
