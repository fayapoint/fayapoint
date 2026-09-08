import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import GameEvento, { type IGameEvento, type LadoEvento } from "@/models/GameEvento";
import GameMercadoAposta from "@/models/GameMercadoAposta";
import GameAposta, { type PernaAposta } from "@/models/GameAposta";
import GameCarteira from "@/models/GameCarteira";
import {
  aplicarLancamento,
  podeApostar,
  ErroCarteira,
  APOSTA_MAXIMA,
  APOSTA_MINIMA,
  RETORNO_MAXIMO,
} from "./carteira";
import {
  simularPartida,
  equilibrar,
  type ForcaTime,
  type JogadorSimulado,
} from "./simulacao";
import {
  montarMercados,
  liquidarMercado,
  resultadoDaSimulacao,
} from "./mercados-aposta";
import { liquidarCupom, MARGEM, type ResultadoSelecao } from "./odds";

/**
 * A MESA — criar evento, aceitar cupom, revelar e pagar. 08/09/2026.
 *
 * O que é puro (simulação, cotação, liquidação de mercado) está em
 * `simulacao.ts`, `odds.ts` e `mercados-aposta.ts` e é provado por
 * `scripts/game/_teste/apostas.ts`. Aqui fica só o que precisa de banco: a
 * ordem das operações, o compromisso criptográfico e o pagamento.
 */

/* ================================================================== */
/* Honestidade verificável                                            */
/* ================================================================== */

/** SHA-256 em hexadecimal. Uma função só, para os dois lados conferirem igual. */
export function hash(texto: string): string {
  return crypto.createHash("sha256").update(texto).digest("hex");
}

/**
 * A semente que roda a partida, a partir das duas metades.
 *
 * Pega os 8 primeiros dígitos hexadecimais do hash — 32 bits, que é
 * exatamente o que o `criarSorteio` consome. Publicar a regra em uma linha é
 * o que permite a qualquer pessoa refazer a conta com `sha256sum` e uma
 * calculadora.
 */
export function derivarSemente(sementeServidor: string, salPublico: string): number {
  return parseInt(hash(`${sementeServidor}|${salPublico}`).slice(0, 8), 16) >>> 0;
}

/**
 * O sal público: o resumo do que os apostadores fizeram, fixado no fechamento.
 *
 * É a metade da semente que a casa NÃO controla. Sozinhos, nós conhecemos a
 * `sementeServidor` mas não sabemos quanto vai entrar; sozinhos, os
 * apostadores movem o sal mas não conhecem a semente. Nenhum dos dois escolhe
 * o resultado — que é a definição do jogo justo.
 */
export function salDoEvento(totalCupons: number, totalApostado: number): string {
  return `${totalCupons}:${totalApostado}`;
}

/* ================================================================== */
/* Criar evento                                                       */
/* ================================================================== */

export interface LadoParaEvento {
  timeId?: string;
  eaClubId?: string;
  nome: string;
  sigla?: string;
  cor?: string;
  forca: ForcaTime;
  elenco: JogadorSimulado[];
}

/**
 * Abre um evento e põe o cardápio no ar.
 *
 * A ordem importa: a semente é sorteada e o compromisso publicado ANTES de
 * qualquer mercado existir. Assim não há um instante sequer em que exista
 * aposta possível sem compromisso registrado.
 */
export async function criarEvento(params: {
  mandante: LadoParaEvento;
  visitante: LadoParaEvento;
  comecaEm: Date;
  equilibrio?: number;
  competicaoId?: string;
  rodada?: number;
  slug?: string;
}): Promise<IGameEvento> {
  await dbConnect();

  const equilibrio = params.equilibrio ?? 0.5;
  const [forcaM, forcaV] = equilibrar(
    params.mandante.forca,
    params.visitante.forca,
    equilibrio
  );

  const sementeServidor = crypto.randomBytes(24).toString("hex");
  const slug =
    params.slug ??
    `${sanear(params.mandante.nome)}-x-${sanear(params.visitante.nome)}-${Date.now().toString(36)}`;

  const lado = (p: LadoParaEvento, f: ForcaTime): LadoEvento => ({
    timeId: p.timeId ? new mongoose.Types.ObjectId(p.timeId) : undefined,
    eaClubId: p.eaClubId,
    nome: p.nome,
    sigla: p.sigla,
    cor: p.cor,
    nota: f.nota,
    forca: { ataque: f.ataque, defesa: f.defesa },
    elenco: p.elenco.map((j) => ({
      gamertag: j.gamertag,
      posicao: j.posicao,
      golsPorJogo: j.golsPorJogo,
      assistenciasPorJogo: j.assistenciasPorJogo,
      userId: j.userId ? new mongoose.Types.ObjectId(j.userId) : undefined,
    })),
  });

  const evento = await GameEvento.create({
    slug,
    tipo: "simulado",
    competicaoId: params.competicaoId
      ? new mongoose.Types.ObjectId(params.competicaoId)
      : undefined,
    rodada: params.rodada,
    mandante: lado(params.mandante, forcaM),
    visitante: lado(params.visitante, forcaV),
    status: "aberto",
    comecaEm: params.comecaEm,
    equilibrio,
    compromisso: hash(sementeServidor),
    sementeServidor,
  });

  // O cardápio usa a semente do EVENTO só para o Monte Carlo do craque, que é
  // estimativa de preço e não sorteio de resultado. Usar a semente secreta
  // aqui vazaria informação sobre ela no preço — daí o hash do slug.
  const mercados = montarMercados({
    mandante: { ...forcaM, id: String(evento._id) + ":M", nome: params.mandante.nome },
    visitante: { ...forcaV, id: String(evento._id) + ":V", nome: params.visitante.nome },
    elencoMandante: params.mandante.elenco,
    elencoVisitante: params.visitante.elenco,
    semente: parseInt(hash(slug).slice(0, 8), 16) >>> 0,
  });

  await GameMercadoAposta.insertMany(
    mercados.map((m, i) => ({
      eventoId: evento._id,
      chave: m.chave,
      tipo: m.tipo,
      familia: m.familia,
      titulo: m.titulo,
      parametro: m.parametro,
      selecoes: m.selecoes,
      margem: MARGEM[m.familia],
      status: "aberto",
      ordem: i,
    }))
  );

  return evento;
}

function sanear(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "time";
}

/* ================================================================== */
/* Aceitar cupom                                                      */
/* ================================================================== */

export interface PedidoAposta {
  /** Cada perna aponta um mercado e uma seleção. */
  selecoes: Array<{ mercadoId: string; selecaoChave: string }>;
  valor: number;
}

/**
 * Registra um cupom.
 *
 * ## A ordem, e por que ela é essa
 *
 * 1. Valida tudo (portão de jogo responsável, mercados abertos, odds atuais).
 * 2. **Debita.** Se o débito falhar, nada foi criado e ninguém perdeu nada.
 * 3. Cria o cupom.
 *
 * Debitar ANTES de criar o cupom é o que impede a aposta fantasma — o cupom
 * que existe sem ficha atrás dele. Na ordem contrária, uma falha de saldo
 * deixaria um cupom válido pago com dinheiro que não existe, e a liquidação
 * pagaria por ele.
 *
 * ## A odd vem do banco, nunca do cliente
 *
 * O pedido manda apenas QUAL mercado e QUAL seleção. A odd é lida do
 * documento no instante da gravação. Aceitar odd vinda do navegador seria
 * deixar o apostador escolher o próprio preço — e alguém vai tentar.
 */
export async function registrarAposta(
  userId: string,
  pedido: PedidoAposta
): Promise<{ apostaId: string; saldo: number; retornoPotencial: number; oddTotal: number }> {
  await dbConnect();

  const valor = Math.floor(Number(pedido.valor));
  if (!Number.isFinite(valor) || valor < APOSTA_MINIMA || valor > APOSTA_MAXIMA) {
    throw new ErroCarteira(
      `a aposta vai de ${APOSTA_MINIMA} a ${APOSTA_MAXIMA} fichas`,
      "saldo-insuficiente"
    );
  }
  if (!Array.isArray(pedido.selecoes) || pedido.selecoes.length === 0) {
    throw new Error("cupom vazio");
  }
  if (pedido.selecoes.length > 12) {
    throw new Error("a múltipla aceita no máximo 12 pernas");
  }

  const permissao = await podeApostar(userId, valor);
  if (!permissao.ok) throw new ErroCarteira(permissao.motivo, "saldo-insuficiente");

  // Carrega os mercados de uma vez só — N idas ao banco por perna seria N+1
  // dentro do caminho mais quente do produto.
  const ids = pedido.selecoes.map((s) => new mongoose.Types.ObjectId(s.mercadoId));
  const mercados = await GameMercadoAposta.find({ _id: { $in: ids } }).lean();
  const porId = new Map(mercados.map((m) => [String(m._id), m]));

  const eventoIds = [...new Set(mercados.map((m) => String(m.eventoId)))];
  const eventos = await GameEvento.find({ _id: { $in: eventoIds } })
    .select("slug mandante.nome visitante.nome status comecaEm mandante.elenco visitante.elenco")
    .lean();
  const porEvento = new Map(eventos.map((e) => [String(e._id), e]));

  const agora = new Date();
  const pernas: PernaAposta[] = [];
  const eventosVistos = new Set<string>();

  for (const escolha of pedido.selecoes) {
    const mercado = porId.get(escolha.mercadoId);
    if (!mercado) throw new Error("mercado não encontrado");
    if (mercado.status !== "aberto") throw new Error(`mercado fechado: ${mercado.titulo}`);

    const evento = porEvento.get(String(mercado.eventoId));
    if (!evento) throw new Error("evento não encontrado");
    if (evento.status !== "aberto") throw new Error("evento já fechado para apostas");
    if (new Date(evento.comecaEm) <= agora) throw new Error("a partida já começou");

    // Duas pernas do mesmo evento numa múltipla não podem existir: os
    // resultados são correlacionados e o preço da combinação não é o produto
    // das odds. É a regra de toda casa, e aqui ela protege a casa E o
    // apostador — pagar 1x2 "casa" com "mais de 4,5" como se fossem
    // independentes é vender uma odd que não corresponde à chance real.
    if (pedido.selecoes.length > 1) {
      if (eventosVistos.has(String(mercado.eventoId))) {
        throw new Error("a múltipla não aceita duas seleções da mesma partida");
      }
      eventosVistos.add(String(mercado.eventoId));
    }

    const selecao = mercado.selecoes.find((s) => s.chave === escolha.selecaoChave);
    if (!selecao) throw new Error("seleção não encontrada");

    pernas.push({
      eventoId: mercado.eventoId,
      eventoSlug: evento.slug,
      eventoNome: `${evento.mandante.nome} × ${evento.visitante.nome}`,
      mercadoId: mercado._id as mongoose.Types.ObjectId,
      mercadoChave: mercado.chave,
      mercadoTitulo: mercado.titulo,
      selecaoChave: selecao.chave,
      selecaoRotulo: selecao.rotulo,
      odd: selecao.odd,
      probabilidade: selecao.probabilidade,
    });
  }

  const oddTotal = Math.round(pernas.reduce((f, p) => f * p.odd, 1) * 100) / 100;
  const retornoPotencial = Math.min(RETORNO_MAXIMO, Math.floor(valor * oddTotal));

  // A pessoa está no elenco de alguma das partidas do cupom?
  const usuario = new mongoose.Types.ObjectId(userId);
  const emSiMesmo = eventos.some((e) =>
    [...(e.mandante.elenco ?? []), ...(e.visitante.elenco ?? [])].some(
      (j) => j.userId && String(j.userId) === String(usuario)
    )
  );

  const carteira = await GameCarteira.findOne({ userId: usuario, moeda: "ficha" });
  if (!carteira) throw new ErroCarteira("carteira não encontrada", "saldo-insuficiente");

  const apostaId = new mongoose.Types.ObjectId();

  // 1) Debita. Falhou aqui, acabou aqui.
  const { saldo } = await aplicarLancamento({
    userId,
    tipo: "aposta",
    valor: -valor,
    descricao:
      pernas.length === 1
        ? `Aposta: ${pernas[0].selecaoRotulo} (${pernas[0].mercadoTitulo})`
        : `Múltipla de ${pernas.length} seleções @ ${oddTotal.toFixed(2)}`,
    chaveUnica: `aposta:${apostaId}`,
    apostaId,
  });

  // 2) Só agora o cupom existe.
  try {
    await GameAposta.create({
      _id: apostaId,
      userId: usuario,
      carteiraId: carteira._id,
      tipo: pernas.length === 1 ? "simples" : "multipla",
      pernas,
      valor,
      oddTotal,
      retornoPotencial,
      status: "pendente",
      retorno: 0,
      emSiMesmo,
    });
  } catch (e) {
    // Cupom não gravou: devolve a ficha. Um débito sem cupom é dinheiro
    // sumido, e a pessoa não teria como reclamar do que não aparece.
    await aplicarLancamento({
      userId,
      tipo: "devolucao",
      valor,
      descricao: "Devolução: o cupom não pôde ser registrado",
      chaveUnica: `devolucao-falha:${apostaId}`,
      apostaId,
    });
    throw e;
  }

  await GameCarteira.updateOne({ _id: carteira._id }, { $inc: { emJogo: valor } });
  await GameEvento.updateMany(
    { _id: { $in: [...new Set(pernas.map((p) => p.eventoId))] } },
    { $inc: { totalApostado: valor, totalCupons: 1 } }
  );

  return { apostaId: String(apostaId), saldo, retornoPotencial, oddTotal };
}

/* ================================================================== */
/* Fechar, revelar, jogar e pagar                                     */
/* ================================================================== */

/**
 * Roda o evento inteiro: fecha as apostas, revela a semente, simula, liquida
 * os mercados e paga os cupons.
 *
 * ## Idempotente por construção
 *
 * O primeiro passo é um `findOneAndUpdate` condicionado a `status: 'aberto'`.
 * Duas execuções simultâneas (o cron e um clique de administrador, digamos)
 * disputam esse update, e só uma o vence — a outra encontra `null` e sai. O
 * pagamento, por baixo, ainda tem a `chaveUnica` do extrato como segunda
 * trava. Duas travas porque pagar duas vezes é o erro que não tem conserto.
 */
export async function rodarEvento(
  eventoId: string
): Promise<{ jaRodou: boolean; golsMandante?: number; golsVisitante?: number; cupons?: number }> {
  await dbConnect();

  const evento = await GameEvento.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(eventoId), status: "aberto" },
    { $set: { status: "fechado" } },
    { new: true }
  );
  if (!evento) return { jaRodou: true };

  await GameMercadoAposta.updateMany(
    { eventoId: evento._id, status: "aberto" },
    { $set: { status: "fechado" } }
  );

  // A semente final só existe agora — o sal depende do que entrou de aposta,
  // e isso só se conhece no fechamento.
  const salPublico = salDoEvento(evento.totalCupons, evento.totalApostado);
  const sementeFinal = derivarSemente(evento.sementeServidor, salPublico);

  const forca = (lado: LadoEvento, sufixo: string): ForcaTime => ({
    id: String(evento._id) + sufixo,
    nome: lado.nome,
    ataque: lado.forca.ataque,
    defesa: lado.forca.defesa,
    nota: lado.nota,
    amostra: 0,
  });
  const elenco = (lado: LadoEvento): JogadorSimulado[] =>
    lado.elenco.map((j) => ({
      gamertag: j.gamertag,
      posicao: j.posicao as JogadorSimulado["posicao"],
      golsPorJogo: j.golsPorJogo,
      assistenciasPorJogo: j.assistenciasPorJogo,
      userId: j.userId ? String(j.userId) : undefined,
    }));

  const partida = simularPartida({
    semente: sementeFinal,
    mandante: forca(evento.mandante, ":M"),
    visitante: forca(evento.visitante, ":V"),
    elencoMandante: elenco(evento.mandante),
    elencoVisitante: elenco(evento.visitante),
  });
  const resultado = resultadoDaSimulacao(partida);

  evento.salPublico = salPublico;
  evento.sementeFinal = sementeFinal;
  evento.resultado = {
    golsMandante: partida.golsMandante,
    golsVisitante: partida.golsVisitante,
    lances: partida.lances,
    jogadores: partida.jogadores,
  };
  evento.status = "liquidado";
  evento.liquidadoEm = new Date();
  await evento.save();

  // Liquida cada mercado e guarda o veredito de cada seleção.
  const mercados = await GameMercadoAposta.find({ eventoId: evento._id });
  const vereditoPorMercado = new Map<string, Map<string, ResultadoSelecao>>();
  for (const m of mercados) {
    const veredito = liquidarMercado(
      { tipo: m.tipo as never, parametro: m.parametro, selecoes: m.selecoes },
      resultado
    );
    vereditoPorMercado.set(String(m._id), veredito);
    m.selecoes = m.selecoes.map((s) => ({ ...s, resultado: veredito.get(s.chave) }));
    m.status = "liquidado";
    await m.save();
  }

  const cupons = await pagarCuponsDoEvento(String(evento._id), vereditoPorMercado);

  return {
    jaRodou: false,
    golsMandante: partida.golsMandante,
    golsVisitante: partida.golsVisitante,
    cupons,
  };
}

/**
 * Paga (ou encerra) todo cupom pendente que tenha perna neste evento.
 *
 * Um cupom múltiplo pode ter pernas em vários eventos: ele só é liquidado
 * quando TODAS têm veredito. As que ainda não têm deixam o cupom pendente —
 * e é por isso que a função lê o veredito das outras pernas do banco, e não
 * só o mapa deste evento.
 */
async function pagarCuponsDoEvento(
  eventoId: string,
  veredito: Map<string, Map<string, ResultadoSelecao>>
): Promise<number> {
  const cupons = await GameAposta.find({
    "pernas.eventoId": new mongoose.Types.ObjectId(eventoId),
    status: "pendente",
  });

  let pagos = 0;

  for (const cupom of cupons) {
    // Carimba o veredito das pernas deste evento.
    for (const perna of cupom.pernas) {
      if (String(perna.eventoId) !== eventoId) continue;
      const r = veredito.get(String(perna.mercadoId))?.get(perna.selecaoChave);
      if (r) perna.resultado = r;
    }

    const faltaAlguma = cupom.pernas.some((p) => !p.resultado);
    if (faltaAlguma) {
      await cupom.save();
      continue;
    }

    const { retorno } = liquidarCupom(
      cupom.pernas.map((p) => ({ odd: p.odd, resultado: p.resultado as ResultadoSelecao })),
      cupom.valor
    );
    const pago = Math.min(RETORNO_MAXIMO, retorno);

    cupom.retorno = pago;
    cupom.status =
      cupom.pernas.every((p) => p.resultado === "anulada" || p.resultado === "devolvida")
        ? "anulada"
        : pago === 0
          ? "perdida"
          : pago > cupom.valor
            ? "ganha"
            : "parcial";
    cupom.liquidadaEm = new Date();
    await cupom.save();

    await GameCarteira.updateOne(
      { _id: cupom.carteiraId },
      { $inc: { emJogo: -cupom.valor } }
    );

    if (pago > 0) {
      try {
        await aplicarLancamento({
          userId: String(cupom.userId),
          tipo: cupom.status === "anulada" ? "devolucao" : "premio",
          valor: pago,
          descricao:
            cupom.status === "anulada"
              ? `Devolução: ${cupom.pernas[0].eventoNome}`
              : `Prêmio: ${cupom.pernas.length === 1 ? cupom.pernas[0].selecaoRotulo : `múltipla de ${cupom.pernas.length}`} @ ${cupom.oddTotal.toFixed(2)}`,
          chaveUnica: `premio:${cupom._id}`,
          apostaId: cupom._id as mongoose.Types.ObjectId,
          eventoId: new mongoose.Types.ObjectId(eventoId),
        });
      } catch (e) {
        // Duplicado significa que já foi pago numa execução anterior. Seguir
        // é o comportamento certo — parar aqui travaria todos os outros
        // cupons por causa de um já resolvido.
        if (!(e instanceof ErroCarteira && e.codigo === "duplicado")) throw e;
      }
    }
    pagos++;
  }

  return pagos;
}

/**
 * Varre e roda tudo que já passou da hora.
 *
 * É o que o cron chama. Devolve o que fez para o log — um cron que roda em
 * silêncio é um cron que morre em silêncio (ver `reference_cron_falha_em_silencio`).
 */
export async function rodarEventosVencidos(limite = 20) {
  await dbConnect();
  const vencidos = await GameEvento.find({
    status: "aberto",
    comecaEm: { $lte: new Date() },
  })
    .sort({ comecaEm: 1 })
    .limit(limite)
    .select("_id slug")
    .lean();

  const feitos: Array<{ slug: string; placar: string; cupons: number }> = [];
  for (const e of vencidos) {
    const r = await rodarEvento(String(e._id));
    if (!r.jaRodou) {
      feitos.push({
        slug: e.slug,
        placar: `${r.golsMandante} × ${r.golsVisitante}`,
        cupons: r.cupons ?? 0,
      });
    }
  }
  return feitos;
}
