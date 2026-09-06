/**
 * PROVA DO MOTOR DE FUNDADORES — vaga, comissão, idempotência e estorno.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/_teste/fundadores.ts
 *
 * É o portão da Onda 1 do `autoresearch/PLANO_FUNDADORES_2026-09-05.md`. O
 * plano pedia "uma indicação de ponta a ponta com pagamento real de R$5"; o que
 * dá para provar sem o cartão do Ricardo é tudo o que acontece DEPOIS de o
 * dinheiro entrar — que é justamente onde mora o risco de pagar duas vezes ou
 * de pagar sobre dinheiro devolvido.
 *
 * ⚠️ Escreve no banco de verdade e APAGA o que criou no fim (`fundadores.teste`,
 * usuários com e-mail `@teste-fundadores.invalid`). Se o processo morrer no
 * meio, rode de novo: a limpeza acontece no começo também.
 *
 * O que ele prova, em ordem:
 *  1. o número sai do contador atômico e não repete;
 *  2. comissão nasce RETIDA, com liberação a 30 dias;
 *  3. o valor é o percentual da forma escolhida sobre o LÍQUIDO;
 *  4. reentrega do webhook NÃO gera segundo lançamento (índice único);
 *  5. autoindicação por mesmo CPF é barrada;
 *  6. produto físico não gera comissão;
 *  7. estorno desfaz o lançamento;
 *  8. o marco Bronze paga o bônus uma vez só.
 */
import mongoose from 'mongoose';
import dbConnect from '../../src/lib/mongodb';
import User from '../../src/models/User';
import Fundador from '../../src/models/Fundador';
import Indicacao from '../../src/models/Indicacao';
import Comissao from '../../src/models/Comissao';
import {
  criarFundador,
  registrarComissao,
  estornarComissao,
  conferirVinculo,
  precoComDesconto,
  contarVagas,
  DIAS_DE_RETENCAO,
  COMISSAO,
} from '../../src/lib/fundadores';
import {
  normalizarTelefone,
  gerarCodigo,
  hashDoCodigo,
  confereHash,
} from '../../src/lib/telefone';

const MARCA = '@teste-fundadores.invalid';
let falhas = 0;
let passes = 0;

function conferir(titulo: string, condicao: boolean, detalhe = '') {
  if (condicao) {
    passes++;
    console.log(`  ok   ${titulo}`);
  } else {
    falhas++;
    console.log(`  FALHA ${titulo}${detalhe ? ` — ${detalhe}` : ''}`);
  }
}

async function limpar() {
  const usuarios = await User.find({ email: new RegExp(MARCA + '$') }).select('_id');
  const ids = usuarios.map((u) => u._id);
  await Promise.all([
    Comissao.deleteMany({ indicadoUserId: { $in: ids } }),
    Indicacao.deleteMany({ indicadoUserId: { $in: ids } }),
    Fundador.deleteMany({ userId: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
}

async function criarUsuario(nome: string, cpf?: string) {
  // ⚠️ `emailsVerificados` PRECISA vir preenchido. O índice é
  // `{ unique: true, sparse: true }` sobre um ARRAY, e array vazio indexa como
  // `undefined` — dois usuários sem o campo colidem com E11000. Os dois
  // caminhos de cadastro de verdade (`api/auth/register` e o callback do
  // Google) preenchem; um script que esqueça, quebra no SEGUNDO usuário.
  const email = `${nome.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${MARCA}`;
  return User.create({
    name: nome,
    email,
    emails: [{ email, verificado: true, origem: 'login', addedAt: new Date() }],
    emailsVerificados: [email],
    password: 'x'.repeat(20),
    role: 'student',
    cpf,
    enrolledCourses: [],
    savedCards: [],
    subscription: { plan: 'free', status: 'active' },
    credits: { balance: 0, monthlyAllocation: 0, totalSpent: 0, totalPurchased: 0, purchasedCredits: [], history: [] },
  });
}

async function main() {
  await dbConnect();
  await limpar();

  const vagasAntes = await contarVagas();
  console.log(`\nvagas antes do teste: ${vagasAntes.ocupadas}/${vagasAntes.total}\n`);

  // ── 1. A vaga e o número ────────────────────────────────────────────
  console.log('1. vaga e número');
  const dono = await criarUsuario('Dona', '39053344705');
  const fundador = await criarFundador(String(dono._id));
  conferir('fundador criado', !!fundador);
  conferir('número atribuído', (fundador?.numero ?? 0) >= 1, `numero=${fundador?.numero}`);
  conferir('código provisório previsível', !!fundador?.codigo.startsWith('fundador-'), fundador?.codigo);

  const repetido = await criarFundador(String(dono._id));
  conferir('mesma conta não vira fundador duas vezes', repetido === null);

  // ── 2, 3. Comissão retida, no percentual e sobre o líquido ─────────
  console.log('\n2. comissão');
  const indicado = await criarUsuario('Indicado', '11144477735');
  await Indicacao.create({
    fundadorId: fundador!._id,
    codigo: fundador!.codigo,
    indicadoUserId: indicado._id,
    indicadoEmail: indicado.email,
    origem: 'url',
    estado: 'pendente',
  });

  const r1 = await registrarComissao({
    indicadoUserId: String(indicado._id),
    asaasPaymentId: 'pay_teste_001',
    valorLiquido: 100,
    tipo: 'subscription',
  });
  conferir('comissão registrada', !!r1);
  conferir(
    `valor = ${COMISSAO.padrao.credito * 100}% de 100`,
    r1?.valor === Math.round(100 * COMISSAO.padrao.credito * 100) / 100,
    `valor=${r1?.valor}`,
  );

  const lancamento = await Comissao.findOne({ asaasPaymentId: 'pay_teste_001' });
  conferir('nasce RETIDA', lancamento?.estado === 'retida', lancamento?.estado);
  const dias = lancamento
    ? Math.round((lancamento.liberaEm.getTime() - lancamento.criadoEm.getTime()) / 86400000)
    : 0;
  conferir(`libera em ${DIAS_DE_RETENCAO} dias`, dias === DIAS_DE_RETENCAO, `dias=${dias}`);
  conferir('percentual gravado na linha', lancamento?.percentual === COMISSAO.padrao.credito);

  const indicacaoDepois = await Indicacao.findOne({ indicadoUserId: indicado._id });
  conferir('indicação virou válida', indicacaoDepois?.estado === 'valida');

  // ── 4. Reentrega do webhook ────────────────────────────────────────
  console.log('\n3. idempotência');
  const r2 = await registrarComissao({
    indicadoUserId: String(indicado._id),
    asaasPaymentId: 'pay_teste_001',
    valorLiquido: 100,
    tipo: 'subscription',
  });
  conferir('reentrega não gera segundo lançamento', r2 === null);
  conferir('só existe uma linha', (await Comissao.countDocuments({ asaasPaymentId: 'pay_teste_001' })) === 1);

  // ── 5. Autoindicação ───────────────────────────────────────────────
  console.log('\n4. antifraude');
  // ⚠️ Descoberto rodando este teste: a segunda conta com o mesmo CPF **não
  // chega a existir**. O índice único de `cpf` recusa a inserção (E11000) antes
  // de qualquer regra nossa. A checagem de CPF em `conferirVinculo()` continua
  // valendo — conta antiga não tem CPF (índice esparso) e pode preencher
  // depois —, mas a primeira linha de defesa é o banco, e ela é mais dura que a
  // nossa. As duas são provadas aqui.
  let bancoRecusou = false;
  try {
    await criarUsuario('Clone', '39053344705'); // MESMO CPF do dono
  } catch (e) {
    bancoRecusou = (e as { code?: number })?.code === 11000;
  }
  conferir('banco recusa segunda conta com o mesmo CPF', bancoRecusou);

  const vinculoProprio = await conferirVinculo({
    fundador: fundador!,
    candidatoUserId: String(dono._id),
  });
  conferir('indicar a si mesmo é barrado', !vinculoProprio.ok, vinculoProprio.motivo);

  // Telefone NÃO tem índice único — é aqui que a regra da lib faz diferença,
  // e a comparação precisa ignorar máscara para valer alguma coisa.
  const mesmoTelefone = await criarUsuario('Telefone');
  await User.updateOne({ _id: dono._id }, { $set: { 'billing.phone': '21999998888' } });
  await User.updateOne({ _id: mesmoTelefone._id }, { $set: { 'billing.phone': '(21) 99999-8888' } });
  const vinculoTelefone = await conferirVinculo({
    fundador: fundador!,
    candidatoUserId: String(mesmoTelefone._id),
  });
  conferir(
    'mesmo telefone é barrado, com máscara diferente',
    !vinculoTelefone.ok,
    vinculoTelefone.motivo,
  );

  // ── 6. Tipo sem comissão ───────────────────────────────────────────
  const rFisico = await registrarComissao({
    indicadoUserId: String(indicado._id),
    asaasPaymentId: 'pay_teste_fisico',
    valorLiquido: 200,
    tipo: 'product',
  });
  conferir('produto físico não gera comissão', rFisico === null);

  // ── 7. Estorno ─────────────────────────────────────────────────────
  console.log('\n5. estorno');
  const desfez = await estornarComissao('pay_teste_001');
  conferir('estorno aceito', desfez === true);
  const depois = await Comissao.findOne({ asaasPaymentId: 'pay_teste_001' });
  conferir('lançamento vira estornada', depois?.estado === 'estornada', depois?.estado);
  conferir('estornar de novo não faz nada', (await estornarComissao('pay_teste_001')) === false);

  // ── 8. Marco Bronze ────────────────────────────────────────────────
  console.log('\n6. escada');
  for (let i = 2; i <= 3; i++) {
    const u = await criarUsuario(`Indicado${i}`);
    await Indicacao.create({
      fundadorId: fundador!._id,
      codigo: fundador!.codigo,
      indicadoUserId: u._id,
      origem: 'url',
      estado: 'pendente',
    });
    await registrarComissao({
      indicadoUserId: String(u._id),
      asaasPaymentId: `pay_teste_00${i}`,
      valorLiquido: 100,
      tipo: 'subscription',
    });
  }
  const comMarco = await Fundador.findById(fundador!._id);
  conferir('3 indicações válidas', comMarco?.indicadosValidos === 3, `${comMarco?.indicadosValidos}`);
  conferir('nível virou bronze', comMarco?.nivel === 'bronze', comMarco?.nivel);
  const donoDepois = await User.findById(dono._id).select('credits');
  conferir('bônus de 50 creditado', donoDepois?.credits?.balance === 50, `saldo=${donoDepois?.credits?.balance}`);
  conferir('marco pago uma vez só', comMarco?.marcosPagos.filter((m) => m === 'bronze').length === 1);

  // ── 9. Preço (função pura, mas é ela que decide o dinheiro) ────────
  console.log('\n7. preço');
  const soFundador = precoComDesconto(97, { ehFundador: true, indicadoAtivo: false });
  conferir('fundador paga metade', soFundador.preco === 48.5, `${soFundador.preco}`);
  const osDois = precoComDesconto(97, { ehFundador: true, indicadoAtivo: true });
  conferir('descontos NÃO se somam — vale o maior', osDois.preco === 48.5, `${osDois.preco}`);
  const soIndicado = precoComDesconto(97, { ehFundador: false, indicadoAtivo: true });
  conferir('indicado paga 20% a menos', soIndicado.preco === 77.6, `${soIndicado.preco}`);
  const avulso = precoComDesconto(100, { ehFundador: true, indicadoAtivo: false, avulso: true });
  conferir('avulso é 20%, não 50%', avulso.preco === 80, `${avulso.preco}`);

  // ── 10. Telefone (funções puras, mas decidem quem é quem) ─────────
  console.log('\n8. telefone');
  conferir('máscara vira E.164', normalizarTelefone('(21) 99999-8888') === '5521999998888');
  conferir('sem DDI também', normalizarTelefone('21999998888') === '5521999998888');
  conferir('com DDI não duplica', normalizarTelefone('5521999998888') === '5521999998888');
  conferir('fixo de 10 dígitos passa', normalizarTelefone('2122223333') === '552122223333');
  conferir('número curto é recusado', normalizarTelefone('99998888') === null);
  conferir('vazio é recusado', normalizarTelefone('') === null);

  const cod = gerarCodigo();
  conferir('código tem 6 dígitos', /^\d{6}$/.test(cod), cod);
  const h = hashDoCodigo(cod, '5521999998888');
  conferir('hash confere consigo', confereHash(h, hashDoCodigo(cod, '5521999998888')));
  conferir('hash não confere com outro código', !confereHash(h, hashDoCodigo('000000', '5521999998888')));
  // O telefone entra no hash: o mesmo código para outro número não vale.
  conferir(
    'hash é preso ao número',
    !confereHash(h, hashDoCodigo(cod, '5511988887777')),
  );

  await limpar();
  const vagasDepois = await contarVagas();
  conferir('limpeza devolveu a vaga', vagasDepois.ocupadas === vagasAntes.ocupadas);

  console.log(`\n${passes} passaram · ${falhas} falharam\n`);
  await mongoose.disconnect();
  process.exit(falhas ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await limpar().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
