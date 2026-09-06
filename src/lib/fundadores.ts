import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Fundador, { LIMITE_DE_VAGAS, MARCOS, type IFundador } from '@/models/Fundador';
import Indicacao from '@/models/Indicacao';
import Comissao from '@/models/Comissao';
import User from '@/models/User';

/**
 * ── AS REGRAS DO PROGRAMA FUNDADORES, NUM LUGAR SÓ ───────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`
 *
 * Tudo que decide dinheiro mora aqui: quanto é o desconto, quanto é a comissão,
 * quem pode ser fundador, e o que anula uma indicação. Rota nenhuma recalcula
 * percentual por conta própria — a duplicação é como um lado envelhece sem o
 * outro perceber.
 *
 * ## A trava que sustenta o programa inteiro
 *
 * **Desconto e comissão incidem sobre o PREÇO. O crédito nunca entra em
 * promoção.** Crédito é a entrega, e entrega tem custo (token de LLM; arte e
 * voz rodam na GPU de casa). Descontar o crédito inverteria a margem no plano
 * maior — é o erro clássico que mata empresa com oferta vitalícia.
 *
 * Medido em 06/09 por `scripts/medir-custo-do-credito.mjs`: **R$0,0029 por
 * crédito consumido**, contra um portão de R$0,20. Passa 55× — mas o portão
 * fica, e o medidor roda todo mês.
 */

/** Metade do preço, enquanto a assinatura estiver ativa. */
export const DESCONTO_FUNDADOR = 0.5;
/** Compras avulsas: curso, certificado, pacote de crédito. */
export const DESCONTO_FUNDADOR_AVULSO = 0.2;
/** Quem entra por um código, nos 12 primeiros meses. */
export const DESCONTO_INDICADO = 0.2;
export const MESES_DESCONTO_INDICADO = 12;

/** O programa fecha em cem fundadores ou nesta data, o que vier primeiro. */
export const FIM_DO_PROGRAMA = new Date('2026-12-31T23:59:59-03:00');

/** Comissão por forma de recebimento, e o degrau de quem chega a Lenda. */
export const COMISSAO = {
  padrao: { credito: 0.07, dinheiro: 0.05 },
  lenda: { credito: 0.1, dinheiro: 0.07 },
};

/** Dias de retenção antes de a comissão liberar. Maior que os 7 do CDC. */
export const DIAS_DE_RETENCAO = 30;
/** Carência antes de uma assinatura caída pausar a comissão. */
export const DIAS_DE_CARENCIA = 90;
/** Teto por código, por dia. Anel de indicações bate aqui primeiro. */
export const TETO_INDICACOES_DIA = 20;

/**
 * O que NÃO gera comissão.
 *
 * Produto físico fica de fora porque a margem não paga: a impressão sai de
 * Miami e o frete come o resto. Crédito de bônus fica de fora porque comissão
 * sobre bônus é dinheiro nascendo do nada — o bônus já saiu do nosso bolso uma
 * vez.
 */
const TIPOS_SEM_COMISSAO = new Set(['product', 'pod']);

// ─── Código ────────────────────────────────────────────────────────────────

const PALAVRAS_RESERVADAS = new Set([
  'admin', 'api', 'fayai', 'fay', 'portal', 'login', 'registro', 'conta', 'suporte',
  'ajuda', 'contato', 'loja', 'game', 'cursos', 'precos', 'fundador', 'fundadores',
  'root', 'null', 'undefined', 'www',
]);

/**
 * Normaliza o código como ele vai aparecer na URL: minúsculo, sem acento, só
 * letra, número e hífen.
 *
 * ⚠️ A remoção de acento é `NFD` + corte dos diacríticos, não uma tabela de
 * substituição. Tabela esquece o "ç" de alguém e devolve um código que a pessoa
 * digita certo e o site não encontra.
 */
export function normalizarCodigo(bruto: string): string {
  return (bruto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
}

export function codigoValido(codigo: string): { ok: boolean; motivo?: string } {
  const c = normalizarCodigo(codigo);
  if (c.length < 3) return { ok: false, motivo: 'O código precisa de pelo menos 3 letras.' };
  if (c.length > 24) return { ok: false, motivo: 'O código passa de 24 caracteres.' };
  if (PALAVRAS_RESERVADAS.has(c)) return { ok: false, motivo: 'Esse código é reservado. Escolha outro.' };
  if (/^\d+$/.test(c)) return { ok: false, motivo: 'O código não pode ser só números.' };
  return { ok: true };
}

// ─── Vagas ─────────────────────────────────────────────────────────────────

/**
 * O contador de vagas. **Lê o banco, sempre.**
 *
 * ⚠️ Esta casa já teve painel anunciando MRR de R$619 com receita de R$0,00.
 * Num contador de escassez, número que não sai de medição não é só enfeite
 * quebrado — é propaganda enganosa, porque a escassez É a oferta.
 */
export async function contarVagas(): Promise<{
  ocupadas: number;
  livres: number;
  total: number;
  aberto: boolean;
}> {
  await dbConnect();
  const ocupadas = await Fundador.countDocuments({ status: { $ne: 'encerrado' } });
  const livres = Math.max(0, LIMITE_DE_VAGAS - ocupadas);
  return {
    ocupadas,
    livres,
    total: LIMITE_DE_VAGAS,
    aberto: livres > 0 && new Date() <= FIM_DO_PROGRAMA,
  };
}

/**
 * O próximo número, sem corrida.
 *
 * `countDocuments() + 1` dá o mesmo número para dois pagamentos confirmados no
 * mesmo instante. Um contador atômico não dá — e o índice único em `numero` é a
 * rede embaixo, para o caso de um caminho novo esquecer de passar por aqui.
 */
async function proximoNumero(): Promise<number> {
  const col = mongoose.connection.collection('contadores');
  const r = await col.findOneAndUpdate(
    { _id: 'fundador_numero' as unknown as mongoose.Types.ObjectId },
    { $inc: { valor: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const valor = (r as { valor?: number } | null)?.valor;
  return typeof valor === 'number' ? valor : 1;
}

// ─── Adesão ────────────────────────────────────────────────────────────────

export type MotivoRecusa =
  | 'sem_vaga'
  | 'programa_encerrado'
  | 'ja_e_fundador'
  | 'sem_cpf'
  | 'sem_telefone';

/**
 * Pode virar fundador? A conferência que a rota de adesão e o webhook usam.
 *
 * As duas provas de identidade (CPF e celular) são exigidas **antes** do
 * código, não antes da vaga: quem pagou tem o lugar guardado, e completa a
 * verificação para o código sair. Bloquear a vaga no OTP faria a pessoa pagar e
 * ficar de fora por um SMS que não chegou.
 */
export async function podeSerFundador(
  userId: string,
): Promise<{ pode: boolean; motivo?: MotivoRecusa }> {
  await dbConnect();
  const jaE = await Fundador.findOne({ userId });
  if (jaE) return { pode: false, motivo: 'ja_e_fundador' };
  const vagas = await contarVagas();
  if (new Date() > FIM_DO_PROGRAMA) return { pode: false, motivo: 'programa_encerrado' };
  if (vagas.livres <= 0) return { pode: false, motivo: 'sem_vaga' };
  return { pode: true };
}

/**
 * Cria o fundador. Chamado pelo webhook, no primeiro pagamento confirmado.
 *
 * Devolve `null` quando não há vaga — e isso não é erro: é o programa cheio, e
 * o pagamento segue valendo como assinatura normal.
 */
export async function criarFundador(
  userId: string,
  dados: { codigo?: string; telefone?: string } = {},
): Promise<IFundador | null> {
  await dbConnect();
  const { pode } = await podeSerFundador(userId);
  if (!pode) return null;

  const usuario = await User.findById(userId).select('cpf cpfVerifiedAt billing.phone');
  const numero = await proximoNumero();
  if (numero > LIMITE_DE_VAGAS) return null;

  // Sem código escolhido, nasce um previsível e trocável: `fundador-037`.
  const codigo = normalizarCodigo(dados.codigo || `fundador-${String(numero).padStart(3, '0')}`);

  return Fundador.create({
    userId: new mongoose.Types.ObjectId(userId),
    numero,
    codigo,
    status: 'ativo',
    nivel: 'fundador',
    criadoEm: new Date(),
    cpfVerificadoEm: usuario?.cpf ? usuario.cpfVerifiedAt || new Date() : undefined,
    telefone: dados.telefone || usuario?.billing?.phone,
  });
}

// ─── Preço ─────────────────────────────────────────────────────────────────

/**
 * O preço que a pessoa paga de fato.
 *
 * ⚠️ **Descontos não se somam — vale o maior.** Um fundador que também entrou
 * por um código levaria 50% + 20% = 70% de desconto, e nesse ponto o plano
 * grande passa a custar menos do que os créditos que entrega. A regra do maior
 * mantém a promessa das duas ofertas sem empilhar o prejuízo.
 *
 * O cálculo é sempre do lado do servidor. Preço que vem do cliente é preço que
 * o cliente escolhe.
 */
export function precoComDesconto(
  precoDeTabela: number,
  contexto: { ehFundador: boolean; indicadoAtivo: boolean; avulso?: boolean },
): { preco: number; desconto: number; rotulo: string | null } {
  const candidatos: { taxa: number; rotulo: string }[] = [];
  if (contexto.ehFundador) {
    candidatos.push(
      contexto.avulso
        ? { taxa: DESCONTO_FUNDADOR_AVULSO, rotulo: 'Fundador' }
        : { taxa: DESCONTO_FUNDADOR, rotulo: 'Fundador' },
    );
  }
  if (contexto.indicadoAtivo) {
    candidatos.push({ taxa: DESCONTO_INDICADO, rotulo: 'Indicação' });
  }
  if (!candidatos.length) return { preco: precoDeTabela, desconto: 0, rotulo: null };

  const maior = candidatos.reduce((a, b) => (b.taxa > a.taxa ? b : a));
  const preco = Math.round(precoDeTabela * (1 - maior.taxa) * 100) / 100;
  return { preco, desconto: maior.taxa, rotulo: maior.rotulo };
}

// ─── Comissão ──────────────────────────────────────────────────────────────

export function percentualDe(fundador: IFundador): number {
  const tabela = fundador.nivel === 'lenda' ? COMISSAO.lenda : COMISSAO.padrao;
  return fundador.formaPreferida === 'dinheiro' ? tabela.dinheiro : tabela.credito;
}

/**
 * Registra a comissão de um pagamento confirmado.
 *
 * Silencioso e idempotente de propósito: é chamado de dentro do webhook, e
 * webhook que estoura derruba o processamento do pagamento inteiro. Devolve
 * `null` quando não há o que lançar — sem indicação, tipo sem comissão,
 * fundador pausado, ou lançamento que já existe.
 */
export async function registrarComissao(params: {
  indicadoUserId: string;
  asaasPaymentId: string;
  valorLiquido: number;
  tipo?: string;
}): Promise<{ valor: number; forma: string } | null> {
  await dbConnect();

  if (params.tipo && TIPOS_SEM_COMISSAO.has(params.tipo)) return null;
  if (!(params.valorLiquido > 0)) return null;

  const indicacao = await Indicacao.findOne({
    indicadoUserId: params.indicadoUserId,
    estado: { $ne: 'anulada' },
  });
  if (!indicacao) return null;

  const fundador = await Fundador.findById(indicacao.fundadorId);
  if (!fundador || fundador.status !== 'ativo') return null;

  const percentual = percentualDe(fundador);
  const valor = Math.round(params.valorLiquido * percentual * 100) / 100;
  if (valor <= 0) return null;

  const liberaEm = new Date(Date.now() + DIAS_DE_RETENCAO * 24 * 60 * 60 * 1000);

  try {
    await Comissao.create({
      fundadorId: fundador._id,
      indicacaoId: indicacao._id,
      indicadoUserId: new mongoose.Types.ObjectId(params.indicadoUserId),
      asaasPaymentId: params.asaasPaymentId,
      baseLiquida: params.valorLiquido,
      percentual,
      valor,
      forma: fundador.formaPreferida,
      estado: 'retida',
      liberaEm,
      origem: params.tipo,
    });
  } catch (e) {
    // Índice único em `asaasPaymentId`: reentrega do webhook cai aqui, e cair
    // aqui é o comportamento certo — não é erro, é a segunda tranca segurando.
    if ((e as { code?: number })?.code === 11000) return null;
    throw e;
  }

  // A primeira conversão valida a indicação e conta para os marcos.
  if (indicacao.estado === 'pendente') {
    indicacao.estado = 'valida';
    indicacao.primeiraConversaoEm = new Date();
    await indicacao.save();
    fundador.indicadosValidos = await Indicacao.countDocuments({
      fundadorId: fundador._id,
      estado: 'valida',
    });
    const alcancado = [...MARCOS].reverse().find((m) => fundador.indicadosValidos >= m.indicados);
    if (alcancado && !fundador.marcosPagos.includes(alcancado.nivel)) {
      fundador.nivel = alcancado.nivel;
      fundador.marcosPagos.push(alcancado.nivel);
      // O bônus do marco entra como crédito, na hora. É prêmio, não comissão:
      // não passa por retenção porque não depende de pagamento de terceiro.
      await User.findByIdAndUpdate(fundador.userId, {
        $inc: { 'credits.balance': alcancado.bonusCreditos },
        $push: {
          'credits.history': {
            action: 'marco_fundador',
            amount: alcancado.bonusCreditos,
            description: `Marco ${alcancado.nivel}: ${alcancado.indicados} indicações válidas`,
            createdAt: new Date(),
          },
        },
      });
      fundador.creditosGanhos += alcancado.bonusCreditos;
    }
    await fundador.save();
  }

  return { valor, forma: fundador.formaPreferida };
}

/**
 * Desfaz a comissão de um pagamento estornado.
 *
 * Se ela já tiver sido paga em crédito, o crédito volta — inclusive para saldo
 * negativo. Saldo negativo é desconfortável e é o certo: o contrário seria a
 * casa pagando comissão sobre dinheiro devolvido, e quem descobre isso primeiro
 * é quem está fraudando.
 */
export async function estornarComissao(asaasPaymentId: string): Promise<boolean> {
  await dbConnect();
  const lancamento = await Comissao.findOne({ asaasPaymentId });
  if (!lancamento || lancamento.estado === 'estornada') return false;

  const jaCreditado = lancamento.estado === 'paga' && lancamento.forma === 'credito';
  lancamento.estado = 'estornada';
  lancamento.estornadaEm = new Date();
  await lancamento.save();

  const fundador = await Fundador.findById(lancamento.fundadorId);
  if (fundador && jaCreditado) {
    await User.findByIdAndUpdate(fundador.userId, {
      $inc: { 'credits.balance': -lancamento.valor },
      $push: {
        'credits.history': {
          action: 'comissao_estornada',
          amount: -lancamento.valor,
          description: 'Estorno: o pagamento que gerou esta comissão foi devolvido',
          createdAt: new Date(),
        },
      },
    });
    fundador.creditosGanhos = Math.max(0, fundador.creditosGanhos - lancamento.valor);
    await fundador.save();
  }
  return true;
}

/**
 * Autoindicação e anel de indicações.
 *
 * Devolve o motivo quando barra — o painel do admin precisa saber POR QUE, e
 * "bloqueado" sem motivo vira caça ao fantasma na primeira reclamação.
 */
export async function conferirVinculo(params: {
  fundador: IFundador;
  candidatoUserId: string;
  ipPrefixo?: string;
}): Promise<{ ok: boolean; motivo?: string }> {
  await dbConnect();

  if (String(params.fundador.userId) === String(params.candidatoUserId)) {
    return { ok: false, motivo: 'autoindicacao_mesma_conta' };
  }

  const [dono, candidato] = await Promise.all([
    User.findById(params.fundador.userId).select('cpf billing.phone'),
    User.findById(params.candidatoUserId).select('cpf billing.phone'),
  ]);

  if (dono?.cpf && candidato?.cpf && dono.cpf === candidato.cpf) {
    return { ok: false, motivo: 'autoindicacao_mesmo_cpf' };
  }
  const telDono = dono?.billing?.phone?.replace(/\D/g, '');
  const telCand = candidato?.billing?.phone?.replace(/\D/g, '');
  if (telDono && telCand && telDono === telCand) {
    return { ok: false, motivo: 'autoindicacao_mesmo_telefone' };
  }

  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hoje = await Indicacao.countDocuments({
    fundadorId: params.fundador._id,
    criadoEm: { $gte: desde },
  });
  if (hoje >= TETO_INDICACOES_DIA) {
    return { ok: false, motivo: 'teto_diario' };
  }

  return { ok: true };
}
