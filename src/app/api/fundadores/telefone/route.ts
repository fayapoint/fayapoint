import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Fundador from '@/models/Fundador';
import VerificacaoTelefone from '@/models/VerificacaoTelefone';
import {
  normalizarTelefone,
  formatarTelefone,
  gerarCodigo,
  hashDoCodigo,
  confereHash,
  enviarCodigo,
  expiraEm,
  validadeEmMinutos,
  MAX_TENTATIVAS,
} from '@/lib/telefone';

/**
 * VERIFICAÇÃO DE CELULAR — `POST` manda o código, `PUT` confere.
 *
 * ## Os três tetos, e o que cada um impede
 *
 * 1. **60 segundos entre envios.** Impede que o botão "reenviar" vire uma
 *    metralhadora de mensagens — que custa dinheiro por mensagem e, do lado de
 *    quem recebe, é assédio.
 * 2. **5 envios por dia, por conta.** Impede usar a nossa conta de WhatsApp
 *    para incomodar um número de terceiro. Sem este teto, qualquer pessoa
 *    logada manda mensagem nossa para quem quiser, o dia inteiro.
 * 3. **5 tentativas por código.** Seis dígitos são um milhão de combinações;
 *    sem teto, um script acerta em minutos.
 *
 * ## O número não é gravado no usuário antes de ser provado
 *
 * `billing.phone` só recebe o telefone **depois** do acerto. Guardar antes
 * deixaria o campo cheio de números que a pessoa digitou errado — ou de
 * números de outras pessoas — e o antifraude compara justamente por ele.
 */

export async function POST(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const telefone = normalizarTelefone(String(body.telefone || ''));
  if (!telefone) {
    return NextResponse.json(
      { erro: 'Número inválido. Use DDD e o número, como (21) 99999-8888.' },
      { status: 400 },
    );
  }

  await dbConnect();

  const agora = Date.now();
  const [ultima, hoje] = await Promise.all([
    VerificacaoTelefone.findOne({ userId: auth.id }).sort({ criadoEm: -1 }),
    VerificacaoTelefone.countDocuments({
      userId: auth.id,
      criadoEm: { $gte: new Date(agora - 24 * 60 * 60 * 1000) },
    }),
  ]);

  if (ultima && agora - ultima.criadoEm.getTime() < 60_000) {
    const faltam = Math.ceil((60_000 - (agora - ultima.criadoEm.getTime())) / 1000);
    return NextResponse.json(
      { erro: `Espere ${faltam} segundos para pedir outro código.` },
      { status: 429 },
    );
  }
  if (hoje >= 5) {
    return NextResponse.json(
      { erro: 'Você pediu códigos demais hoje. Tente de novo amanhã.' },
      { status: 429 },
    );
  }

  const codigo = gerarCodigo();
  const envio = await enviarCodigo(telefone, codigo);

  if (!envio.ok) {
    // Nada é gravado quando o envio falha: um documento com hash de código que
    // ninguém recebeu só serviria para consumir uma das cinco tentativas.
    return NextResponse.json(
      {
        erro:
          envio.motivo === 'indisponivel'
            ? 'A verificação por celular ainda não está ligada. Fale com o suporte.'
            : 'Não deu para enviar o código agora. Tente em alguns minutos.',
      },
      { status: 503 },
    );
  }

  // Um código aberto por vez: pedir outro invalida o anterior.
  await VerificacaoTelefone.deleteMany({ userId: auth.id });
  await VerificacaoTelefone.create({
    userId: auth.id,
    telefone,
    hash: hashDoCodigo(codigo, telefone),
    enviadoPor: envio.canal,
    expiraEm: expiraEm(),
  });

  return NextResponse.json({
    enviado: true,
    canal: envio.canal,
    para: formatarTelefone(telefone),
    validoPor: validadeEmMinutos(),
  });
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const codigo = String(body.codigo || '').replace(/\D/g, '');
  if (codigo.length !== 6) {
    return NextResponse.json({ erro: 'O código tem seis dígitos.' }, { status: 400 });
  }

  await dbConnect();
  const pendente = await VerificacaoTelefone.findOne({ userId: auth.id }).sort({ criadoEm: -1 });

  // O TTL do Mongo roda a cada ~60s, então o documento pode sobreviver ao
  // próprio prazo por alguns segundos. A regra é esta comparação.
  if (!pendente || pendente.expiraEm.getTime() < Date.now()) {
    return NextResponse.json(
      { erro: 'O código expirou. Peça outro.' },
      { status: 410 },
    );
  }

  if (pendente.tentativas >= MAX_TENTATIVAS) {
    return NextResponse.json(
      { erro: 'Tentativas demais para este código. Peça outro.' },
      { status: 429 },
    );
  }

  if (!confereHash(pendente.hash, hashDoCodigo(codigo, pendente.telefone))) {
    pendente.tentativas += 1;
    await pendente.save();
    const restam = MAX_TENTATIVAS - pendente.tentativas;
    return NextResponse.json(
      {
        erro:
          restam > 0
            ? `Código errado. ${restam} ${restam === 1 ? 'tentativa restante' : 'tentativas restantes'}.`
            : 'Código errado. Peça outro.',
      },
      { status: 400 },
    );
  }

  // Acertou: agora sim o número entra na conta.
  await User.findByIdAndUpdate(auth.id, { $set: { 'billing.phone': pendente.telefone } });
  await Fundador.updateOne(
    { userId: auth.id },
    { $set: { telefone: pendente.telefone, telefoneVerificadoEm: new Date() } },
  );
  await VerificacaoTelefone.deleteMany({ userId: auth.id });

  return NextResponse.json({ verificado: true, telefone: formatarTelefone(pendente.telefone) });
}
