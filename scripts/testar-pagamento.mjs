/**
 * Prova de ponta a ponta do caminho pagamento → plano → crédito.
 *
 * ## Por que este script existe
 *
 * O defeito que consertamos em 10/08/2026 era **invisível**: o webhook gravava
 * em campo que não existe no schema, o Mongoose descartava calado, e nada —
 * nem `tsc`, nem build, nem console — reclamava. Um defeito assim não se
 * previne lendo o código; previne-se **executando o caminho e conferindo o
 * banco depois**.
 *
 * Ele dispara no webhook real (`POST /api/payments/webhook`) exatamente o corpo
 * que a Asaas manda, e depois lê o documento do usuário para ver o que de fato
 * ficou gravado.
 *
 * ⚠️ **Não precisa de chave da Asaas.** O webhook é uma rota nossa: o que a
 * Asaas faz é um POST autenticado por token. Testar a criação da cobrança
 * (essa sim precisa de chave sandbox) é outra coisa, e não é onde estava o
 * defeito.
 *
 * ## Segurança
 *
 * Trabalha num usuário descartável (`+teste-pagamento@`), criado no começo e
 * **apagado no fim, sempre** — inclusive se um passo falhar. Nenhuma conta real
 * é tocada.
 *
 * Uso:
 *   node scripts/testar-pagamento.mjs [--url http://localhost:3002] [--manter]
 */

import { MongoClient, ObjectId } from 'mongodb';
import fs from 'node:fs';

const env = fs.readFileSync('.env.local', 'utf8');
const pegar = (k) => (env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1] || '').trim().replace(/^["']|["']$/g, '');

const URL_BASE = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://localhost:3002';
const MANTER = process.argv.includes('--manter');
const TOKEN = pegar('ASAAS_WEBHOOK_TOKEN');
const URI = pegar('MONGODB_URI');

// ⚠️ Sem User-Agent de navegador o middleware devolve 403 e o teste "falha"
// por um motivo que nada tem a ver com pagamento.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const EMAIL = `ricardofaya+teste-pagamento-${Date.now()}@gmail.com`;

let ok = 0;
let falhou = 0;
function conferir(nome, condicao, detalhe = '') {
  if (condicao) {
    ok++;
    console.log(`  ✓ ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
  } else {
    falhou++;
    console.log(`  ✗ ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
  }
}

async function webhook(corpo) {
  const r = await fetch(`${URL_BASE}/api/payments/webhook?access_token=${encodeURIComponent(TOKEN)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify(corpo),
  });
  return { status: r.status, corpo: await r.json().catch(() => null) };
}

const cliente = new MongoClient(URI);
let userId = null;

try {
  await cliente.connect();
  const db = cliente.db('fayapoint');
  const users = db.collection('users');
  const subs = db.collection('subscriptions');
  const pays = db.collection('payments');

  if (!TOKEN) throw new Error('ASAAS_WEBHOOK_TOKEN ausente em .env.local');

  console.log(`\nAlvo: ${URL_BASE}`);
  console.log(`Usuário de teste: ${EMAIL}\n`);

  // ── Preparação ────────────────────────────────────────────────────────────
  const novo = await users.insertOne({
    name: 'Teste Pagamento',
    email: EMAIL,
    role: 'student',
    subscription: { plan: 'free', status: 'active' },
    credits: { balance: 0, monthlyAllocation: 0, totalSpent: 0, totalPurchased: 0, purchasedCredits: [], history: [] },
    createdAt: new Date(),
  });
  userId = novo.insertedId;

  // ── 1. Assinatura Expert paga ─────────────────────────────────────────────
  // Este é o caminho REAL: a cobrança recorrente chega com `subscription`
  // preenchido e cai em `activateSubscriptionFromPayment`, NÃO em
  // `grantUserAccess`.
  console.log('1) Assinatura Expert confirmada');
  const asaasSubId = `sub_teste_${Date.now()}`;
  // ⚠️ Campos obrigatórios do `SubscriptionSchema` inclusos de propósito
  // (`planId`, `userName`, `asaasCustomerId`, `startDate`, `nextDueDate`).
  // A primeira versão deste teste os omitiu, o `subscription.save()` estourou
  // validação, e o usuário ficou sem plano e sem crédito — com o webhook
  // respondendo 200. O defeito do teste revelou um defeito de verdade, e o
  // webhook agora sobrevive a isso; a assinatura aqui é completa para que o
  // teste meça o caminho feliz.
  await subs.insertOne({
    userId,
    userEmail: EMAIL,
    userName: 'Teste Pagamento',
    planId: 'expert',
    planSlug: 'expert',
    planName: 'Expert',
    cycle: 'monthly',
    value: 167,
    status: 'pending',
    billingType: 'pix',
    asaasCustomerId: 'cus_teste',
    asaasSubscriptionId: asaasSubId,
    externalReference: asaasSubId,
    startDate: new Date(),
    nextDueDate: new Date(Date.now() + 30 * 864e5),
    totalPayments: 0,
    totalPaid: 0,
    webhookEvents: [],
    createdAt: new Date(),
  });

  const pagamentoAsaas = {
    id: `pay_teste_${Date.now()}`,
    subscription: asaasSubId,
    externalReference: asaasSubId,
    status: 'CONFIRMED',
    value: 167,
    netValue: 161,
    paymentDate: new Date().toISOString().slice(0, 10),
    billingType: 'PIX',
  };
  const r1 = await webhook({ event: 'PAYMENT_CONFIRMED', payment: pagamentoAsaas });
  conferir('webhook aceitou', r1.status === 200, `HTTP ${r1.status}`);

  let u = await users.findOne({ _id: userId });
  conferir('plano virou expert', u.subscription?.plan === 'expert', `plano=${u.subscription?.plan}`);
  conferir('status ativo', u.subscription?.status === 'active', `status=${u.subscription?.status}`);
  conferir('validade gravada', !!u.subscription?.expiresAt);
  conferir('saldo = 400 créditos', u.credits?.balance === 400, `saldo=${u.credits?.balance}`);
  conferir('alocação mensal = 400', u.credits?.monthlyAllocation === 400, `alocação=${u.credits?.monthlyAllocation}`);
  conferir('âncora do ciclo gravada', !!u.credits?.lastRefillDate);
  conferir(
    'extrato tem o lançamento',
    (u.credits?.history || []).some((h) => h.action === 'subscription_grant'),
  );

  // ── 2. Reenvio do MESMO evento não credita em dobro ───────────────────────
  console.log('\n2) Reenvio do mesmo evento (idempotência)');
  await webhook({ event: 'PAYMENT_CONFIRMED', payment: pagamentoAsaas });
  u = await users.findOne({ _id: userId });
  conferir('saldo continua 400', u.credits?.balance === 400, `saldo=${u.credits?.balance}`);
  conferir(
    'só um lançamento de assinatura',
    (u.credits?.history || []).filter((h) => h.action === 'subscription_grant').length === 1,
  );

  // ── 3. Compra de pacote de créditos ───────────────────────────────────────
  console.log('\n3) Compra do pacote de 650 créditos (R$500)');
  const orderNumber = `TESTE-${Date.now()}`;
  const idPacote = `pay_pack_${Date.now()}`;
  await pays.insertOne({
    userId,
    userEmail: EMAIL,
    userName: 'Teste Pagamento',
    orderNumber,
    provider: 'asaas',
    providerPaymentId: idPacote,
    method: 'pix',
    status: 'pending',
    total: 500,
    subtotal: 500,
    items: [{
      productId: 'pack-500',
      productSlug: 'pack-500',
      type: 'credits',
      name: '650 créditos FayAI',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500,
    }],
    webhookEvents: [],
    createdAt: new Date(),
  });

  const r3 = await webhook({
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: idPacote,
      externalReference: orderNumber,
      status: 'RECEIVED',
      value: 500,
      netValue: 485,
      paymentDate: new Date().toISOString().slice(0, 10),
      billingType: 'PIX',
    },
  });
  conferir('webhook aceitou', r3.status === 200, `HTTP ${r3.status}`);

  u = await users.findOne({ _id: userId });
  const pacotes = u.credits?.purchasedCredits || [];
  conferir('pacote entrou na conta', pacotes.length === 1, `${pacotes.length} pacote(s)`);
  conferir('650 créditos comprados', pacotes[0]?.amount === 650, `amount=${pacotes[0]?.amount}`);
  conferir('totalPurchased somou', u.credits?.totalPurchased === 650, `total=${u.credits?.totalPurchased}`);
  const dias = pacotes[0] ? Math.round((new Date(pacotes[0].expiresAt) - Date.now()) / 864e5) : 0;
  conferir('validade de 90 dias', dias >= 89 && dias <= 90, `${dias} dias`);
  conferir('XP do pagamento em progress.xp', typeof u.progress?.xp === 'number', `xp=${u.progress?.xp}`);
  conferir('sem campo fantasma `plan` na raiz', u.plan === undefined);
  conferir('sem campo fantasma `xp` na raiz', u.xp === undefined);

  // ── 4. O recibo ───────────────────────────────────────────────────────────
  // ⚠️ Este passo existe porque a primeira execução do teste revelou que a
  // coleção `receipts` estava VAZIA: o número do recibo era gerado num hook
  // `pre('save')`, que roda DEPOIS da validação de campo obrigatório. Todo
  // recibo falhava, o erro era engolido, e ninguém nunca recebeu comprovante.
  console.log('\n4) Recibo da compra');
  const recibos = await db.collection('receipts').find({ userId }).toArray();
  // Dois: um da assinatura, um do pacote. Procurar pelo TIPO, e não por
  // `recibos[0]`, porque a ordem depende de qual webhook chegou primeiro.
  const doPacote = recibos.find((r) => r.items?.some((i) => i.type === 'credits'));
  const daAssinatura = recibos.find((r) => r.items?.some((i) => i.type === 'subscription'));
  conferir('recibo da assinatura emitido', !!daAssinatura, daAssinatura?.receiptNumber || '—');
  conferir('recibo do pacote emitido', !!doPacote, doPacote?.receiptNumber || '—');
  conferir('todo recibo tem número', recibos.length > 0 && recibos.every((r) => !!r.receiptNumber));
  conferir('números não se repetem', new Set(recibos.map((r) => r.receiptNumber)).size === recibos.length);

  // ── 5. Estorno da assinatura ──────────────────────────────────────────────
  console.log('\n5) Estorno do pacote de créditos');
  const r5 = await webhook({
    event: 'PAYMENT_REFUNDED',
    payment: {
      id: idPacote,
      externalReference: orderNumber,
      status: 'REFUNDED',
      value: 500,
      refunds: [{ value: 500, description: 'teste' }],
    },
  });
  conferir('webhook aceitou', r5.status === 200, `HTTP ${r5.status}`);
  u = await users.findOne({ _id: userId });
  const restante = (u.credits?.purchasedCredits || []).reduce((s, p) => s + p.amount, 0);
  conferir('créditos comprados devolvidos', restante === 0, `restam ${restante}`);
  conferir('saldo do plano intacto', u.credits?.balance === 400, `saldo=${u.credits?.balance}`);

  console.log(`\n${'─'.repeat(52)}`);
  console.log(`${ok} conferências passaram, ${falhou} falharam`);
  process.exitCode = falhou > 0 ? 1 : 0;
} catch (erro) {
  console.error('\nERRO:', erro.message);
  process.exitCode = 1;
} finally {
  // Limpeza SEMPRE — inclusive se algo acima estourou.
  if (userId && !MANTER) {
    const db = cliente.db('fayapoint');
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    await db.collection('subscriptions').deleteMany({ userId: new ObjectId(userId) });
    await db.collection('payments').deleteMany({ userId: new ObjectId(userId) });
    await db.collection('receipts').deleteMany({ userId: new ObjectId(userId) });
    await db.collection('fulfillmentorders').deleteMany({ userId: new ObjectId(userId) });
    await db.collection('usageevents').deleteMany({ userId: new ObjectId(userId) });
    console.log('Usuário de teste e rastros removidos.');
  }
  await cliente.close();
}
