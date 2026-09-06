import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Fundador, { MARCOS } from '@/models/Fundador';
import Indicacao from '@/models/Indicacao';
import Comissao from '@/models/Comissao';
import {
  codigoValido,
  normalizarCodigo,
  percentualDe,
  COMISSAO,
  DIAS_DE_RETENCAO,
} from '@/lib/fundadores';

/**
 * O PAINEL DO FUNDADOR — o extrato dele, e a troca de código e de forma.
 *
 * O saldo vem SOMADO DOS LANÇAMENTOS, não de um campo guardado. Campo de saldo
 * é a coisa mais fácil de dessincronizar do sistema: basta um caminho novo
 * esquecer de incrementá-lo, e a pessoa vê um número que não corresponde ao
 * próprio extrato — na tela onde ela menos perdoa erro, que é a do dinheiro
 * dela. Somar por estado a cada leitura custa uma agregação e nunca mente.
 */
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  await dbConnect();
  const fundador = await Fundador.findOne({ userId: auth.id });
  if (!fundador) return NextResponse.json({ ehFundador: false });

  const [porEstado, indicacoes] = await Promise.all([
    Comissao.aggregate([
      { $match: { fundadorId: fundador._id } },
      { $group: { _id: '$estado', total: { $sum: '$valor' }, linhas: { $sum: 1 } } },
    ]),
    Indicacao.find({ fundadorId: fundador._id }).sort({ criadoEm: -1 }).limit(50).lean(),
  ]);

  const soma = (estado: string) =>
    Math.round((porEstado.find((p) => p._id === estado)?.total ?? 0) * 100) / 100;

  const proximo = MARCOS.find((m) => fundador.indicadosValidos < m.indicados);

  return NextResponse.json({
    ehFundador: true,
    numero: fundador.numero,
    codigo: fundador.codigo,
    endereco: `fayai.com.br/f/${fundador.codigo}`,
    status: fundador.status,
    nivel: fundador.nivel,
    formaPreferida: fundador.formaPreferida,
    percentual: percentualDe(fundador),
    identidade: {
      cpfVerificado: !!fundador.cpfVerificadoEm,
      telefoneVerificado: !!fundador.telefoneVerificadoEm,
    },
    saldo: {
      retido: soma('retida'),
      liberado: soma('liberada'),
      pago: soma('paga'),
      estornado: soma('estornada'),
      diasDeRetencao: DIAS_DE_RETENCAO,
    },
    indicados: {
      validos: fundador.indicadosValidos,
      pendentes: indicacoes.filter((i) => i.estado === 'pendente').length,
      lista: indicacoes.map((i) => ({
        estado: i.estado,
        criadoEm: i.criadoEm,
        convertidaEm: i.primeiraConversaoEm,
        // Nunca o e-mail inteiro: quem indicou não precisa da caixa de entrada
        // de quem entrou. O suficiente para reconhecer, não para alcançar.
        pista: i.indicadoEmail ? i.indicadoEmail.replace(/^(.{2}).*@/, '$1•••@') : null,
      })),
    },
    escada: {
      proximo: proximo ? { nivel: proximo.nivel, faltam: proximo.indicados - fundador.indicadosValidos } : null,
      marcos: MARCOS,
      pagos: fundador.marcosPagos,
    },
    tabela: COMISSAO,
  });
}

/**
 * Troca de código (uma vez) e de forma de recebimento (sempre).
 *
 * ⚠️ O código é IMUTÁVEL depois de escolhido, e isso é a favor do fundador: o
 * endereço dele vai estar impresso em cartaz de campeonato, em post e em print
 * de grupo. Deixar trocar quebraria links que outras pessoas publicaram, e o
 * prejuízo cairia justamente em quem divulgou mais.
 */
export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  await dbConnect();
  const fundador = await Fundador.findOne({ userId: auth.id });
  if (!fundador) return NextResponse.json({ erro: 'Você ainda não é fundador.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const mudancas: string[] = [];

  if (body.formaPreferida === 'credito' || body.formaPreferida === 'dinheiro') {
    fundador.formaPreferida = body.formaPreferida;
    mudancas.push('forma');
  }

  if (typeof body.codigo === 'string') {
    if (!fundador.codigo.startsWith('fundador-')) {
      return NextResponse.json(
        { erro: 'O código já foi escolhido e não muda — outras pessoas já publicaram esse endereço.' },
        { status: 409 },
      );
    }
    const conferido = codigoValido(body.codigo);
    if (!conferido.ok) return NextResponse.json({ erro: conferido.motivo }, { status: 400 });

    const codigo = normalizarCodigo(body.codigo);
    const ocupado = await Fundador.findOne({ codigo, _id: { $ne: fundador._id } });
    if (ocupado) return NextResponse.json({ erro: 'Esse código já é de outra pessoa.' }, { status: 409 });

    fundador.codigo = codigo;
    mudancas.push('codigo');
  }

  if (!mudancas.length) return NextResponse.json({ erro: 'Nada para mudar.' }, { status: 400 });

  await fundador.save();
  return NextResponse.json({ ok: true, mudancas, codigo: fundador.codigo, formaPreferida: fundador.formaPreferida });
}
