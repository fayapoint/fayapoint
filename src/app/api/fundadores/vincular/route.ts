import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Fundador from '@/models/Fundador';
import Indicacao from '@/models/Indicacao';
import User from '@/models/User';
import { normalizarCodigo, conferirVinculo } from '@/lib/fundadores';

/**
 * O VÍNCULO: esta conta foi trazida por aquele código.
 *
 * Chamado logo depois do cadastro, com o código que o navegador guardou (o
 * `ref` de `lib/attribution.ts`, janela de 90 dias) ou digitado à mão.
 *
 * ## Por que devolve 200 mesmo quando não vincula
 *
 * Esta rota é chamada por um `.catch(() => {})` no fim do cadastro. Se ela
 * respondesse 4xx em caso comum — código que não existe, conta que já tem
 * indicador, autoindicação — o registro de conta passaria a acender erro no
 * console e, pior, alguém acabaria "consertando" o cadastro por causa dela. O
 * corpo diz o que aconteceu (`vinculado: false, motivo: ...`); o status diz que
 * a chamada foi processada.
 *
 * A única exceção é 401: sem sessão não há a quem vincular.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const codigo = normalizarCodigo(String(body.codigo || ''));
  if (codigo.length < 3) {
    return NextResponse.json({ vinculado: false, motivo: 'sem_codigo' });
  }

  await dbConnect();

  // Uma conta pertence a um indicador, para sempre. A checagem vem antes de
  // tudo para que uma segunda tentativa não gaste consulta nem gere ruído.
  const jaTem = await Indicacao.findOne({ indicadoUserId: auth.id });
  if (jaTem) return NextResponse.json({ vinculado: false, motivo: 'ja_vinculado' });

  const fundador = await Fundador.findOne({ codigo, status: 'ativo' });
  if (!fundador) return NextResponse.json({ vinculado: false, motivo: 'codigo_inexistente' });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const conferido = await conferirVinculo({
    fundador,
    candidatoUserId: auth.id,
    ipPrefixo: ip.split('.').slice(0, 3).join('.'),
  });
  if (!conferido.ok) {
    console.warn(`[Fundadores] vínculo barrado: ${conferido.motivo} (código ${codigo})`);
    return NextResponse.json({ vinculado: false, motivo: conferido.motivo });
  }

  const usuario = await User.findById(auth.id).select('email');

  await Indicacao.create({
    fundadorId: fundador._id,
    codigo,
    indicadoUserId: auth.id,
    indicadoEmail: usuario?.email,
    origem: body.origem === 'digitado' ? 'digitado' : body.origem === 'cookie' ? 'cookie' : 'url',
    estado: 'pendente',
    criadoEm: new Date(),
    sinais: {
      ipPrefixo: ip.split('.').slice(0, 3).join('.') || undefined,
      agente: (request.headers.get('user-agent') || '').slice(0, 80) || undefined,
    },
  });

  return NextResponse.json({
    vinculado: true,
    // A tela de boas-vindas agradece por nome — é o que faz o convite parecer
    // um convite, e não um cupom.
    fundador: { numero: fundador.numero, codigo: fundador.codigo },
  });
}
