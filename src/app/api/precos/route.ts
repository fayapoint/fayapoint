import { NextResponse } from 'next/server';
import { getPrecos } from '@/lib/precos-runtime';
import { PACOTES_CURSO, TIER_CONFIGS, type SubscriptionPlan } from '@/lib/course-tiers';

export const dynamic = 'force-dynamic';

/**
 * A tabela de preços, PÚBLICA (11/08/2026).
 *
 * ## Por que uma rota só para isto
 *
 * A página `/precos` é um Client Component — ela não pode chamar `getPrecos()`,
 * que lê o Mongo. Enquanto os preços eram constantes compiladas isso não
 * importava: o `import` trazia os números junto com o bundle. Agora que o
 * Ricardo mexe nos preços pelo Mission Control, a página precisa PERGUNTAR — e
 * sem esta rota ela continuaria desenhando os números do último build,
 * enquanto a caixa registradora cobra os novos. Ver `lib/precos-runtime.ts`.
 *
 * ⚠️ **Sem autenticação, de propósito.** É a tabela de preços: ela é o material
 * de venda mais público que existe, e exigir sessão para lê-la impediria
 * exatamente quem ainda não é cliente de ver quanto custa.
 *
 * ⚠️ E **só preço sai daqui**. Nada de saldo, nada de plano do usuário — isso é
 * do `/api/credits`, que é autenticado. Esta rota é lida por qualquer um.
 */
export async function GET() {
  const precos = await getPrecos();

  return NextResponse.json({
    custos: precos.custos,
    pacotes: PACOTES_CURSO.map((p) => ({
      id: p.id,
      acao: p.acao,
      emoji: p.emoji,
      inclui: p.inclui,
      titulo: precos.pacotes[p.id].titulo,
      promessa: precos.pacotes[p.id].promessa,
      imagem: precos.pacotes[p.id].imagem,
      emBreve: precos.pacotes[p.id].emBreve,
      creditos: precos.custos[p.acao],
    })),
    // A franquia do assistente por plano, com o nome que a vitrine mostra.
    chat: (Object.keys(precos.chatMensagensMes) as SubscriptionPlan[]).map((slug) => ({
      plano: slug,
      nome: TIER_CONFIGS[slug].displayName,
      mensagensMes: precos.chatMensagensMes[slug],
    })),
    atualizadoEm: precos.atualizadoEm,
  });
}
