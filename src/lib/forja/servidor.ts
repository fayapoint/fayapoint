import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ForjaPersonagem from "@/models/ForjaPersonagem";
import ForjaPeca from "@/models/ForjaPeca";
import ForjaTrabalho from "@/models/ForjaTrabalho";
import { getPrecos } from "@/lib/precos-runtime";
import { debitar, saldoParaGastar } from "@/lib/creditos";
import { resolvePlan, type CreditAction } from "@/lib/course-tiers";
import type { PersonaProfunda } from "@/lib/persona";

import {
  criadorDePersona,
  montarConta,
  prioridadeDe,
  ALUGUEL_SEGUNDOS,
  MAX_TENTATIVAS,
  PESO_NA_FILA,
  TETO_DIARIO,
  podeAtender,
  esperaPrevista,
  type Cobranca,
  type PedidoDeReserva,
  type PedidoDeTrabalho,
  type Personagem,
  type PersonaEntrada,
  type TipoDeTrabalho,
  type AcaoDaForja,
} from "@/lib/forja/engine";

/**
 * A CAMADA DE SERVIDOR DA FORJA — o motor puro encontra o banco aqui.
 *
 * O motor (`lib/forja/engine`) não sabe o que é Mongo, o que é crédito e o que
 * é usuário. Este arquivo é o único que sabe as três coisas — e por isso é o
 * único lugar onde uma regra de negócio pode se esconder. Está tudo aqui de
 * propósito: a rota fica fina, o motor fica testável, e quem procura "por que
 * cobrou isso" tem um arquivo só para ler.
 */

// ─────────────────────────────────────────────────────────────────────
// O contexto do usuário
// ─────────────────────────────────────────────────────────────────────

export interface ContextoDoUsuario {
  persona: PersonaEntrada;
  nome?: string;
  plano: string;
  elenco: Map<string, Personagem>;
  /** o personagem `criador`, quando já existe */
  criador?: Personagem;
  coresDaMarca?: string;
}

function paraPersonagem(doc: Record<string, unknown>): Personagem {
  return {
    ...(doc as unknown as Personagem),
    _id: String(doc._id),
  };
}

/**
 * Tudo o que a Forja precisa saber de quem está pedindo, numa ida ao banco.
 *
 * ⚠️ O `select` traz `socialPersona name subscription` e nada mais. Trazer o
 * documento inteiro do usuário arrastaria o histórico de créditos (200
 * lançamentos) e o progresso de curso em toda geração de imagem — a mesma
 * armadilha que fez a lista de produtos levar 42 segundos por ler sem projeção.
 */
export async function contextoDoUsuario(userId: string): Promise<ContextoDoUsuario> {
  await dbConnect();
  const [user, personagens] = await Promise.all([
    User.findById(userId).select("socialPersona name subscription").lean(),
    ForjaPersonagem.find({ userId }).lean(),
  ]);

  const u = user as unknown as { socialPersona?: PersonaProfunda; name?: string; subscription?: { plan?: string } } | null;
  const persona = (u?.socialPersona || {}) as unknown as PersonaEntrada;

  const elenco = new Map<string, Personagem>();
  let criador: Personagem | undefined;
  for (const doc of personagens as unknown as Array<Record<string, unknown>>) {
    const p = paraPersonagem(doc);
    elenco.set(p._id as string, p);
    if (p.origem === "criador") criador = p;
  }

  return {
    persona,
    nome: u?.name,
    plano: resolvePlan(u?.subscription?.plan || "free"),
    elenco,
    criador,
  };
}

/**
 * Garante que existe o personagem do criador.
 *
 * Chamado na primeira vez que a pessoa abre a Forja. Semeia só o que a persona
 * já sabe — papel, cidade, tratamento — e deixa a aparência física em branco de
 * propósito: campo preenchido não pede atenção, e um rosto inventado que a
 * pessoa nunca corrige é pior do que um campo vazio que ela preenche uma vez.
 */
export async function garantirCriador(userId: string, ctx: ContextoDoUsuario): Promise<Personagem> {
  if (ctx.criador) return ctx.criador;
  const semente = criadorDePersona(ctx.persona, ctx.nome);
  const doc = await ForjaPersonagem.create({ ...semente, userId });
  const p = paraPersonagem(doc.toObject());
  ctx.elenco.set(p._id as string, p);
  ctx.criador = p;
  return p;
}

// ─────────────────────────────────────────────────────────────────────
// O teto diário de uso justo
// ─────────────────────────────────────────────────────────────────────

export interface UsoDoDia {
  gasto: number;
  teto: number;
  restante: number;
  /** quantos trabalhos ainda cabem, no peso do tipo pedido */
  cabemAinda: (tipo: TipoDeTrabalho) => number;
}

/**
 * Quanto da GPU comunitária esta pessoa já usou hoje.
 *
 * Conta PESO e não trabalhos: um clipe de vídeo ocupa a placa por doze minutos
 * e uma imagem por doze segundos. Um teto que trate os dois como iguais entrega
 * a placa inteira para a primeira pessoa que descobrir isso.
 *
 * ⚠️ Só conta o que foi `local` e não foi `cancelado`. Trabalho que a pessoa
 * mandou para a nuvem já foi pago, e trabalho cancelado antes de rodar não
 * ocupou GPU nenhuma — cobrar do teto por qualquer um dos dois seria punir por
 * um recurso que não foi consumido.
 */
export async function usoDoDia(userId: string, plano: string): Promise<UsoDoDia> {
  await dbConnect();
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  const trabalhos = (await ForjaTrabalho.find({
    userId,
    onde: "local",
    estado: { $ne: "cancelado" },
    criadoEm: { $gte: inicio },
  })
    .select("tipo")
    .lean()) as unknown as Array<{ tipo: TipoDeTrabalho }>;

  const gasto = trabalhos.reduce((s, t) => s + (PESO_NA_FILA[t.tipo] || 1), 0);
  const teto = TETO_DIARIO[plano] ?? TETO_DIARIO.free;
  const restante = Math.max(0, teto - gasto);

  return {
    gasto,
    teto,
    restante,
    cabemAinda: (tipo) => Math.floor(restante / (PESO_NA_FILA[tipo] || 1)),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Enfileirar
// ─────────────────────────────────────────────────────────────────────

/**
 * Quanto ESTE grafo tem levado de verdade nesta máquina.
 *
 * ## Por que a estimativa não pode ser a constante do motor
 *
 * O motor estima pelo desenho do grafo — 12 s para um Z-Image de 8 passos. A
 * realidade medida foi 20 s, e a diferença não é erro de conta: é o carregamento
 * dos pesos, que acontece sempre que a família de modelo muda. A constante
 * descreve a GPU trabalhando; a fila precisa descrever o RELÓGIO da pessoa.
 *
 * Prometer 12 e entregar 20 é quase 70% de atraso, e a barra da fila foi feita
 * justamente para não mentir. Então a estimativa aprende: a mediana dos últimos
 * trabalhos do mesmo grafo vale mais que qualquer número escrito à mão.
 *
 * ⚠️ Mediana e não média. Um trabalho que ficou preso e voltou pelo aluguel
 * vencido registra minutos de nada, e uma média puxaria a estimativa de todo
 * mundo para cima por causa de um caso isolado.
 */
export async function segundosTipicos(grafo: string, padrao: number): Promise<number> {
  const amostras = (await ForjaTrabalho.find({ grafo, estado: "pronto", segundosReais: { $gt: 0 } })
    .select("segundosReais")
    .sort({ terminouEm: -1 })
    .limit(15)
    .lean()) as unknown as Array<{ segundosReais: number }>;

  // menos de três medições não é amostra, é anedota
  if (amostras.length < 3) return padrao;

  const ordenadas = amostras.map((a) => a.segundosReais).sort((a, b) => a - b);
  const meio = Math.floor(ordenadas.length / 2);
  const mediana =
    ordenadas.length % 2 ? ordenadas[meio] : Math.round((ordenadas[meio - 1] + ordenadas[meio]) / 2);

  // um piso no padrão: a primeira geração do dia sempre carrega os pesos, e uma
  // mediana colhida numa sequência quente subestimaria justamente essa
  return Math.max(padrao, mediana);
}

export interface ResultadoDeEnfileiramento {
  ok: boolean;
  trabalhoId?: string;
  conta: Cobranca[];
  total: number;
  esperaSegundos: number;
  /** preenchido quando `ok` é falso */
  erro?: string;
  faltam?: number;
}

/**
 * Põe um pedido na fila.
 *
 * ## A ordem, e por que ela é essa
 *
 * 1. Monta a conta com o preço VIVO (Mission Control), não o compilado.
 * 2. Se a conta é maior que zero, confere o SALDO — antes de gravar qualquer
 *    coisa. Enfileirar um trabalho que a pessoa não pode pagar seria prometer
 *    uma entrega que a caixa vai recusar no fim.
 * 3. Grava o trabalho com a conta CONGELADA dentro dele.
 *
 * ⚠️ **Não debita aqui.** A caixa cobra o que foi entregue, e a entrega é o
 * arquivo saindo da GPU. Debitar no enfileiramento obrigaria a estornar quando
 * o ComfyUI falhasse — e estorno é a parte que sempre quebra.
 */
export async function enfileirar(
  userId: string,
  pedido: PedidoDeTrabalho,
  opcoes: { furarFila?: boolean; segundosEstimados: number; plano: string },
): Promise<ResultadoDeEnfileiramento> {
  await dbConnect();

  const uso = await usoDoDia(userId, opcoes.plano);
  const peso = PESO_NA_FILA[pedido.tipo] || 1;
  const acimaDoTeto = pedido.onde === "local" && uso.restante < peso;

  const precos = await getPrecos();
  const tabela = precos.custos as Partial<Record<AcaoDaForja, number>>;

  const { itens, total } = montarConta({
    tipo: pedido.tipo,
    onde: pedido.onde,
    furarFila: opcoes.furarFila,
    acimaDoTeto,
    rotulo: pedido.rotulo,
    precos: tabela,
  });

  if (total > 0) {
    const saldo = await saldoParaGastar(userId);
    if (saldo.total < total) {
      return {
        ok: false,
        conta: itens,
        total,
        esperaSegundos: 0,
        erro: "Créditos insuficientes",
        faltam: total - saldo.total,
      };
    }
  }

  const prioridade = prioridadeDe(pedido) + (opcoes.furarFila ? 500 : 0);
  const estimativa = await segundosTipicos(pedido.grafo, opcoes.segundosEstimados);

  const doc = await ForjaTrabalho.create({
    userId,
    ...pedido,
    prioridade,
    estado: "esperando",
    tentativas: 0,
    creditos: total,
    conta: itens,
    segundosEstimados: estimativa,
  });

  const esperaSegundos = await previsaoPara(String(doc._id));

  return { ok: true, trabalhoId: String(doc._id), conta: itens, total, esperaSegundos };
}

/**
 * Quanto falta para ESTE trabalho, contando o que está na frente dele.
 *
 * A GPU é uma só, então a fila é serial e somar o que vem antes é literalmente
 * a conta certa. É a conta que a tela precisa fazer para não prometer quinze
 * segundos quando são onze minutos — e prometer errado é o jeito mais rápido de
 * alguém recarregar a página vinte vezes.
 */
export async function previsaoPara(trabalhoId: string): Promise<number> {
  const alvo = (await ForjaTrabalho.findById(trabalhoId).select("prioridade criadoEm estado").lean()) as unknown as
    | { prioridade: number; criadoEm: Date; estado: string }
    | null;
  if (!alvo) return 0;
  if (alvo.estado === "pronto" || alvo.estado === "falhou" || alvo.estado === "cancelado") return 0;

  const naFrente = (await ForjaTrabalho.find({
    estado: { $in: ["esperando", "reservado", "rodando"] },
    $or: [
      { prioridade: { $gt: alvo.prioridade } },
      { prioridade: alvo.prioridade, criadoEm: { $lte: alvo.criadoEm } },
    ],
  })
    .select("segundosEstimados")
    .sort({ prioridade: -1, criadoEm: 1 })
    .limit(200)
    .lean()) as unknown as Array<{ segundosEstimados: number }>;

  return esperaPrevista(naFrente, naFrente.length - 1);
}

// ─────────────────────────────────────────────────────────────────────
// O lado do trabalhador
// ─────────────────────────────────────────────────────────────────────

/**
 * Devolve à fila o que ficou preso.
 *
 * Roda no começo de toda reserva — é barato (índice `{estado, reservadoAte}`) e
 * é o único mecanismo de recuperação que existe. Um trabalhador que morre não
 * avisa ninguém; quem percebe é o relógio.
 *
 * ⚠️ Trabalho que já esgotou as tentativas não volta para a fila: vai para
 * `falhou` com o motivo. Sem isso, um grafo permanentemente quebrado circularia
 * para sempre, ocupando a GPU a cada aluguel vencido.
 */
export async function resgatarVencidos(): Promise<number> {
  await dbConnect();
  const agora = new Date();

  const presos = (await ForjaTrabalho.find({
    estado: { $in: ["reservado", "rodando"] },
    reservadoAte: { $lt: agora },
  })
    .select("tentativas")
    .limit(50)
    .lean()) as unknown as Array<{ _id: unknown; tentativas: number }>;

  let devolvidos = 0;
  for (const t of presos) {
    const esgotou = (t.tentativas || 0) >= MAX_TENTATIVAS;
    await ForjaTrabalho.updateOne(
      { _id: t._id, estado: { $in: ["reservado", "rodando"] } },
      esgotou
        ? {
            $set: {
              estado: "falhou",
              ultimoErro: "O trabalhador parou no meio e não voltou dentro do prazo.",
              terminouEm: agora,
            },
            $unset: { trabalhador: "", reservadoAte: "" },
          }
        : { $set: { estado: "esperando" }, $unset: { trabalhador: "", reservadoAte: "" } },
    );
    devolvidos++;
  }
  return devolvidos;
}

/**
 * O trabalhador pede serviço.
 *
 * `findOneAndUpdate` com `sort` é o que torna a reserva atômica: o documento sai
 * de `esperando` no mesmo comando que o encontra, então dois trabalhadores nunca
 * pegam o mesmo. Um `find` seguido de `update` teria a janela clássica — e a
 * janela custaria uma geração duplicada de cinco minutos.
 */
export async function reservar(p: PedidoDeReserva): Promise<{ trabalhos: unknown[]; esperando: number }> {
  await dbConnect();
  await resgatarVencidos();

  const quantos = Math.max(1, Math.min(4, p.quantos || 1));
  const pegos: unknown[] = [];
  const agora = new Date();

  for (let i = 0; i < quantos; i++) {
    /**
     * Os tipos que ESTE trabalhador pode receber agora.
     *
     * A conferência acontece no FILTRO, e não depois de pegar: pegar e devolver
     * deixaria o trabalho pulando de estado sem sair do lugar, e cada pulo é
     * uma escrita no banco por trabalhador por rodada.
     *
     * `podeAtender` é a mesma regra do motor — a máquina sem VRAM livre não
     * recebe vídeo, porque o LTX estoura na segunda passada, que é o pior
     * momento possível: depois de quatro minutos de trabalho feito.
     */
    const TODOS: TipoDeTrabalho[] = ["imagem", "video", "caderno", "peca"];
    const aceitos = TODOS.filter((tipo) => podeAtender({ tipo } as never, p));
    if (!aceitos.length) break;

    const filtro: Record<string, unknown> = { estado: "esperando", tipo: { $in: aceitos } };

    const doc = await ForjaTrabalho.findOneAndUpdate(
      filtro,
      {
        $set: {
          estado: "reservado",
          trabalhador: p.trabalhador,
          reservadoAte: new Date(agora.getTime() + 60_000), // prazo curto até ele confirmar que começou
        },
        $inc: { tentativas: 1 },
      },
      { sort: { prioridade: -1, criadoEm: 1 }, new: true },
    ).lean();

    if (!doc) break;
    pegos.push(doc);
  }

  const esperando = await ForjaTrabalho.countDocuments({ estado: "esperando" });
  return { trabalhos: pegos, esperando };
}

/** O trabalhador avisa que começou — e aí o aluguel vira o prazo de verdade. */
export async function marcarRodando(trabalhoId: string, trabalhador: string): Promise<boolean> {
  await dbConnect();
  const t = (await ForjaTrabalho.findById(trabalhoId).select("tipo").lean()) as unknown as { tipo: TipoDeTrabalho } | null;
  if (!t) return false;
  const r = await ForjaTrabalho.updateOne(
    { _id: trabalhoId, trabalhador },
    {
      $set: {
        estado: "rodando",
        comecouEm: new Date(),
        reservadoAte: new Date(Date.now() + (ALUGUEL_SEGUNDOS[t.tipo] || 300) * 1000),
      },
    },
  );
  return r.modifiedCount > 0;
}

/** Renova o aluguel. O trabalhador chama enquanto o ComfyUI ainda está mastigando. */
export async function renovarAluguel(trabalhoId: string, trabalhador: string): Promise<boolean> {
  await dbConnect();
  const t = (await ForjaTrabalho.findById(trabalhoId).select("tipo").lean()) as unknown as { tipo: TipoDeTrabalho } | null;
  if (!t) return false;
  const r = await ForjaTrabalho.updateOne(
    { _id: trabalhoId, trabalhador, estado: { $in: ["reservado", "rodando"] } },
    { $set: { reservadoAte: new Date(Date.now() + (ALUGUEL_SEGUNDOS[t.tipo] || 300) * 1000) } },
  );
  return r.modifiedCount > 0;
}

// ─────────────────────────────────────────────────────────────────────
// Concluir
// ─────────────────────────────────────────────────────────────────────

/**
 * O trabalho terminou.
 *
 * ## O que acontece aqui, na ordem
 *
 * 1. Grava o resultado no trabalho.
 * 2. **Escreve o resultado no destino** — a peça, o personagem — porque é lá que
 *    a pessoa vai procurar. Um trabalho `pronto` cujo resultado não chegou ao
 *    quadro é, para quem usa, um trabalho que não aconteceu.
 * 3. **Só então cobra.** A caixa cobra o que foi entregue. Falhou, não cobra.
 *
 * ⚠️ Cobra a conta CONGELADA no trabalho, não a tabela de agora. Entre o pedido
 * e a entrega o preço pode ter mudado no Mission Control, e cobrar o preço novo
 * por um pedido feito com o preço velho é a divergência entre o que a tela
 * mostrou e o que o extrato diz.
 */
export async function concluir(entrada: {
  trabalhoId: string;
  trabalhador: string;
  ok: boolean;
  resultado?: { url: string; miniatura?: string; largura?: number; altura?: number; duracaoMs?: number; bytes?: number; semente?: number };
  erro?: string;
  segundosReais?: number;
}): Promise<{ ok: boolean; cobrado: number; mensagem?: string }> {
  await dbConnect();

  const t = (await ForjaTrabalho.findOne({ _id: entrada.trabalhoId, trabalhador: entrada.trabalhador }).lean()) as unknown as
    | {
        _id: unknown;
        userId: unknown;
        tipo: TipoDeTrabalho;
        estado: string;
        tentativas: number;
        destino: { pecaId?: string; quadroNumero?: number; personagemId?: string; angulo?: string; avulso?: boolean };
        conta: Cobranca[];
        rotulo: string;
        params?: Record<string, unknown>;
      }
    | null;

  if (!t) return { ok: false, cobrado: 0, mensagem: "trabalho não encontrado para este trabalhador" };
  if (t.estado === "pronto" || t.estado === "cancelado") {
    // repetição de rede: o trabalhador reenviou a conclusão. Não é erro, e não
    // pode cobrar de novo.
    return { ok: true, cobrado: 0, mensagem: "já estava concluído" };
  }

  const agora = new Date();

  if (!entrada.ok || !entrada.resultado?.url) {
    const podeTentarDeNovo = (t.tentativas || 0) < MAX_TENTATIVAS;
    await ForjaTrabalho.updateOne(
      { _id: t._id },
      podeTentarDeNovo
        ? {
            $set: { estado: "esperando", ultimoErro: (entrada.erro || "falha sem motivo").slice(0, 1000) },
            $unset: { trabalhador: "", reservadoAte: "" },
          }
        : {
            $set: {
              estado: "falhou",
              ultimoErro: (entrada.erro || "falha sem motivo").slice(0, 1000),
              terminouEm: agora,
            },
            $unset: { trabalhador: "", reservadoAte: "" },
          },
    );
    if (t.destino?.pecaId && t.destino?.quadroNumero && !podeTentarDeNovo) {
      await marcarQuadro(t.destino.pecaId, t.destino.quadroNumero, { estado: "planejado", trabalhoId: "" });
    }
    return { ok: true, cobrado: 0, mensagem: podeTentarDeNovo ? "volta para a fila" : "falhou de vez" };
  }

  await ForjaTrabalho.updateOne(
    { _id: t._id },
    {
      $set: {
        estado: "pronto",
        resultado: entrada.resultado,
        terminouEm: agora,
        segundosReais: entrada.segundosReais,
        ultimoErro: "",
      },
      $unset: { reservadoAte: "" },
    },
  );

  await gravarNoDestino(t, entrada.resultado);

  // a caixa, por último
  let cobrado = 0;
  const conta = Array.isArray(t.conta) ? t.conta : [];
  for (const item of conta) {
    if (!item?.creditos) continue;
    const r = await debitar(String(t.userId), item.acao as CreditAction, 1, item.descricao, item.creditos);
    if (r.ok) cobrado += r.gasto;
  }

  return { ok: true, cobrado };
}

async function marcarQuadro(pecaId: string, numero: number, campos: Record<string, unknown>) {
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(campos)) set[`quadros.$[q].${k}`] = v;
  await ForjaPeca.updateOne({ _id: pecaId }, { $set: set }, { arrayFilters: [{ "q.numero": numero }] });
}

/**
 * Leva o arquivo até onde a pessoa vai procurar.
 *
 * ⚠️ Um trabalho `pronto` cujo resultado não chegou ao quadro é, para quem usa,
 * um trabalho que não aconteceu. Este passo é o que separa "a fila funcionou"
 * de "a tela mostrou".
 */
async function gravarNoDestino(
  t: {
    tipo: TipoDeTrabalho;
    destino: { pecaId?: string; quadroNumero?: number; personagemId?: string; angulo?: string };
  },
  r: { url: string; semente?: number },
) {
  const d = t.destino || {};

  if (d.pecaId && d.quadroNumero) {
    await marcarQuadro(
      d.pecaId,
      d.quadroNumero,
      t.tipo === "video"
        ? { video: r.url, estado: "gerado", trabalhoId: "" }
        : { arte: r.url, semente: r.semente, estado: "gerado", trabalhoId: "" },
    );
    return;
  }

  if (d.personagemId && t.tipo === "caderno") {
    /**
     * `$addToSet` e não `$push`: o mesmo ângulo pode ser regerado, e um caderno
     * com a mesma URL duas vezes vira uma galeria com imagem repetida.
     */
    await ForjaPersonagem.updateOne(
      { _id: d.personagemId },
      {
        $addToSet: { "caderno.imagens": r.url },
        $set: { "caderno.status": "pronto", "caderno.geradoEm": new Date(), ...(r.semente ? { semente: r.semente } : {}) },
      },
    );
    return;
  }

  if (d.personagemId) {
    await ForjaPersonagem.updateOne({ _id: d.personagemId }, { $addToSet: { referencias: r.url } });
  }
}

// ─────────────────────────────────────────────────────────────────────
// A fila que a pessoa vê
// ─────────────────────────────────────────────────────────────────────

export interface TrabalhoNaTela {
  _id: string;
  tipo: TipoDeTrabalho;
  onde: string;
  rotulo: string;
  estado: string;
  criadoEm: Date;
  segundosEstimados: number;
  esperaSegundos: number;
  resultado?: { url?: string; miniatura?: string };
  ultimoErro?: string;
  destino?: Record<string, unknown>;
}

export async function filaDoUsuario(userId: string): Promise<{ trabalhos: TrabalhoNaTela[]; totalNaFila: number }> {
  await dbConnect();
  const meus = (await ForjaTrabalho.find({ userId })
    .select("tipo onde rotulo estado prioridade criadoEm segundosEstimados resultado ultimoErro destino")
    .sort({ criadoEm: -1 })
    .limit(40)
    .lean()) as unknown as Array<Record<string, unknown>>;

  const ativos = meus.filter((t) => ["esperando", "reservado", "rodando"].includes(String(t.estado)));
  const previsoes = await Promise.all(ativos.map((t) => previsaoPara(String(t._id))));
  const mapa = new Map(ativos.map((t, i) => [String(t._id), previsoes[i]]));

  const totalNaFila = await ForjaTrabalho.countDocuments({ estado: { $in: ["esperando", "reservado", "rodando"] } });

  return {
    trabalhos: meus.map(
      (t) => ({ ...t, _id: String(t._id), esperaSegundos: mapa.get(String(t._id)) ?? 0 }) as unknown as TrabalhoNaTela,
    ),
    totalNaFila,
  };
}
