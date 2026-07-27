import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { getRadar, getNicho } from '@/lib/radar';
import { AREAS, type PersonaProfunda } from '@/lib/persona';

export const dynamic = 'force-dynamic';

/**
 * A pauta do dia — o Radar cruzado com a persona (27/07/2026).
 *
 * ## Por que isto é a nossa vantagem, e não mais um botão de IA
 *
 * As ferramentas de gestão social do mercado (mLabs, Etus, Buffer) resolvem
 * agendar, medir e aprovar. Nenhuma responde a pergunta que trava o usuário na
 * frente da tela em branco: **sobre o que eu publico hoje?** O que elas
 * oferecem no lugar é calendário de datas comemorativas — o mesmo para todo
 * mundo, decidido meses antes.
 *
 * Nós medimos, todo dia, o que o brasileiro está perguntando sobre IA por
 * PROFISSÃO, no autocomplete do Google e do YouTube (`lib/radar.ts`). Isso é
 * uma lista de pautas com demanda comprovada de hoje — e ninguém tinha ligado
 * ela ao publicador ainda.
 *
 * ## O recorte
 *
 * A área da persona escolhe o nicho medido. Um advogado não recebe a pauta do
 * criador de conteúdo: recebe o que outros advogados estão procurando. Sem
 * persona, cai no recorte geral e a resposta diz isso na cara — pauta genérica
 * apresentada como personalizada é o tipo de mentira que o usuário percebe no
 * primeiro post.
 */

/** Área da persona → nicho medido pelo Radar. */
const AREA_PARA_NICHO: Record<string, string> = {
  law: 'advogados',
  health: 'saude',
  education: 'professores',
  marketing: 'vendas',
  ecommerce: 'vendas',
  retail: 'vendas',
  consulting: 'empreendedores',
  finance: 'empreendedores',
  'real-estate': 'vendas',
  tech: 'automacao',
  art: 'criadores',
  entertainment: 'criadores',
  beauty: 'criadores',
  fitness: 'criadores',
  food: 'empreendedores',
  travel: 'criadores',
  sustainability: 'empreendedores',
  other: 'geral',
};

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id).select('socialPersona');
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const area = persona.industry?.[0];
    const nichoId = (area && AREA_PARA_NICHO[area]) || 'geral';
    const nicho = getNicho(nichoId);

    const radar = await getRadar(nicho.id);

    // Só o que foi medido nos dois canais ou tem posição alta: termo que
    // apareceu uma vez no fim de uma lista não é demanda, é ruído.
    const pautas = radar.termos
      .filter((t) => t.canais === 'web+yt' || (t.posWeb !== null && t.posWeb < 5) || (t.posYt !== null && t.posYt < 5))
      .slice(0, 8)
      .map((t) => ({
        termo: t.termo,
        nota: t.score,
        canais: t.canais,
        formato: t.formato,
        // O ângulo de vídeo importa: um termo que só sobe no YouTube é demanda
        // de VÍDEO, onde um canal pequeno ganha antes de o site ranquear.
        so_video: t.canais === 'yt',
      }));

    return NextResponse.json({
      nicho: { id: nicho.id, label: nicho.label, chamada: nicho.chamada, cor: nicho.cor },
      // Honestidade sobre o recorte: sem área na persona, a pauta é a do país.
      personalizado: !!area,
      areaLabel: area ? AREAS[area] || area : null,
      medidoEm: radar.geradoEm,
      origem: radar.origem,
      pautas,
    });
  } catch (error) {
    console.error('[social/pautas]', error);
    return NextResponse.json({ error: 'Erro ao buscar pautas' }, { status: 500 });
  }
}
