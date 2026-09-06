import { NextResponse } from 'next/server';
import { contarVagas, DESCONTO_FUNDADOR, COMISSAO, FIM_DO_PROGRAMA } from '@/lib/fundadores';

/**
 * O CONTADOR DE VAGAS — e ele lê o banco.
 *
 * ⚠️ Esta casa já publicou painel anunciando MRR de R$619,20 com receita medida
 * de R$0,00. Num contador de escassez o defeito é pior do que um painel errado:
 * a escassez **é** a oferta, e número inventado ali é propaganda enganosa, não
 * enfeite quebrado. Por isso não existe valor padrão neste arquivo — se o banco
 * não responder, a resposta é 503 e a tela diz que não sabe.
 *
 * Cache de 60s: a landing é a página que mais vai bater aqui, e um minuto é
 * curto o bastante para o contador parecer vivo e longo o bastante para o banco
 * nem sentir. Mesmo número do `precos-runtime.ts`, pela mesma razão.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const vagas = await contarVagas();
    return NextResponse.json({
      ...vagas,
      encerraEm: FIM_DO_PROGRAMA.toISOString(),
      desconto: DESCONTO_FUNDADOR,
      comissao: COMISSAO.padrao,
    });
  } catch (erro) {
    console.error('[Fundadores] contador de vagas falhou:', erro);
    return NextResponse.json(
      { erro: 'Não foi possível ler o número de vagas agora.' },
      { status: 503 },
    );
  }
}
