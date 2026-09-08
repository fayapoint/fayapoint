import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import GameCompeticao from "@/models/GameCompeticao";
import GameConfronto from "@/models/GameConfronto";
import GameTime from "@/models/GameTime";
import GameEvento from "@/models/GameEvento";
import GameEaClube from "@/models/GameEaClube";
import { calcularForca, referenciaDoConjunto, type ForcaTime, type JogadorSimulado } from "./simulacao";
import { criarEvento, type LadoParaEvento } from "./apostas-servidor";

/**
 * A PRÉVIA SIMULADA DE UM CONFRONTO DE CAMPEONATO — 08/09/2026.
 *
 * ## O pedido, e o limite que ele esbarra
 *
 * "Ligar a mesa ao campeonato" era o item nº 1 da fila. A leitura ingênua
 * seria: cada confronto marcado vira um evento e as pessoas apostam nele.
 *
 * **Isso é proibido pelo nosso próprio regulamento**, e não por tecnicalidade:
 *
 *  - **Art. 11** — aposta ocorre apenas em partida SIMULADA.
 *  - **Art. 18** — aposta em partida real de gente não abre antes de existir
 *    verificação de identidade do jogador.
 *
 * Um confronto de `GameCompeticao` é uma partida REAL, entre pessoas, cujo
 * placar elas mesmas lançam por consenso. Abrir mercado sobre o resultado dela
 * seria criar, na mesma tela, o incentivo exato do resultado combinado — e
 * seria fazê-lo antes de existir qualquer forma de auditoria.
 *
 * ## O que este arquivo faz, então
 *
 * Cria a **prévia**: os dois times reais do confronto, com a força calculada
 * da campanha real deles, jogando uma partida que o NOSSO motor simula. Aposta
 * na nossa simulação, não no jogo deles.
 *
 * A distinção não é retórica, e por isso está no código e não só na tela:
 * o evento nasce `tipo: "simulado"`, guarda o `competicaoId` para a tela poder
 * dizer de que confronto ele é prévia, e **nunca** recebe o `eaMatchId` nem o
 * placar declarado pelos capitães. Se um dia alguém quiser casar os dois, vai
 * ter de mexer aqui e ler este comentário.
 *
 * ## E o que ela NÃO pode virar
 *
 * A prévia é aberta ANTES do confronto e liquidada pela simulação. Se o
 * confronto real já tiver resultado confirmado, a prévia não é criada — um
 * mercado sobre partida cujo resultado já se conhece não é aposta, é saque.
 */

/** Quanto antes do horário marcado a prévia abre. */
export const HORAS_DE_ANTECEDENCIA = 6;

interface LadoPronto {
  lado: LadoParaEvento;
  temElenco: boolean;
}

/**
 * Monta o lado de um time da competição, usando o espelho da EA quando o time
 * está ligado a um clube real.
 *
 * Quando não está (time cadastrado na mão), a força cai na média da liga —
 * declarado, e não disfarçado de medição. Um time sem campanha não pode ser
 * cotado como se tivesse uma.
 */
async function montarLado(
  time: { _id: unknown; nome: string; sigla?: string; cor?: string; eaClubId?: string; plataforma?: string; elenco?: Array<{ gamertag: string; posicao?: string; userId?: unknown }> },
  referencia: Parameters<typeof calcularForca>[1]
): Promise<LadoPronto> {
  let forca: ForcaTime;
  let elenco: JogadorSimulado[] = [];

  if (time.eaClubId) {
    const clube = await GameEaClube.findOne({
      clubId: time.eaClubId,
      // A plataforma entra sempre: `clubId` é único DENTRO da piscina, não
      // entre elas. Mesmo defeito já corrigido em `copa.ts` e no Mercado.
      platform: time.plataforma ?? "common-gen5",
    }).lean();

    if (clube) {
      forca = calcularForca(
        {
          id: String(time._id),
          nome: time.nome,
          jogos: clube.gamesPlayed,
          gols: clube.goals,
          golsSofridos: clube.goalsAgainst,
          divisao: clube.currentDivision,
          skillRating: clube.skillRating,
        },
        referencia
      );
    } else {
      forca = calcularForca({ id: String(time._id), nome: time.nome }, referencia);
    }
  } else {
    forca = calcularForca({ id: String(time._id), nome: time.nome }, referencia);
  }

  // O elenco é a FOTOGRAFIA da inscrição (ver `GameTime`), não o espelho vivo.
  // É de propósito: quem jogou aquela rodada tem de continuar na súmula dela.
  elenco = (time.elenco ?? [])
    .filter((j) => j.gamertag)
    .slice(0, 14)
    .map((j) => ({
      gamertag: j.gamertag,
      posicao: normalizar(j.posicao),
      userId: j.userId ? String(j.userId) : undefined,
    }));

  return {
    temElenco: elenco.length >= 3,
    lado: {
      timeId: String(time._id),
      eaClubId: time.eaClubId,
      nome: time.nome,
      sigla: time.sigla,
      cor: time.cor,
      forca,
      elenco,
    },
  };
}

function normalizar(p?: string): JogadorSimulado["posicao"] {
  const s = (p ?? "").toLowerCase();
  if (s.includes("gol") || s.includes("goal") || s === "gk") return "goalkeeper";
  if (s.includes("zag") || s.includes("lat") || s.includes("def")) return "defender";
  if (s.includes("ata") || s.includes("pon") || s.includes("forward")) return "forward";
  return "midfielder";
}

/**
 * Abre prévias para os confrontos agendados de uma competição.
 *
 * Devolve o que criou. Idempotente: um confronto que já tem prévia aberta não
 * ganha outra — o índice é a busca por `competicaoId` + os dois times, e não
 * um campo novo no confronto, para não mexer no documento do organizador.
 */
export async function abrirPreviasDaCompeticao(
  competicaoId: string,
  limite = 6
): Promise<Array<{ slug: string; confronto: string; comecaEm: Date }>> {
  await dbConnect();

  const competicao = await GameCompeticao.findById(competicaoId).lean();
  if (!competicao || competicao.status !== "em-andamento") return [];

  const times = await GameTime.find({ competicaoId, ativo: true }).lean();
  if (times.length < 2) return [];

  /**
   * A referência de força sai dos clubes DESTA competição, não da média geral
   * do Clubs. É a mesma lição de `referenciaDoConjunto`: medir contra a média
   * errada fez a primeira tela sair com todo mundo em nota 99.
   */
  const clubesLigados = times.map((t) => t.eaClubId).filter((x): x is string => Boolean(x));
  const espelhados = clubesLigados.length
    ? await GameEaClube.find({ clubId: { $in: clubesLigados } })
        .select("goals goalsAgainst gamesPlayed")
        .lean()
    : [];
  const referencia = referenciaDoConjunto(
    espelhados.map((c) => ({ gols: c.goals, golsSofridos: c.goalsAgainst, jogos: c.gamesPlayed }))
  );

  /**
   * Só confronto AGENDADO. `confirmado` já tem placar conhecido, e mercado
   * sobre resultado conhecido não é aposta — é saque. `aguardando` está em
   * disputa de consenso e pode virar pendência para o organizador.
   */
  const confrontos = await GameConfronto.find({
    competicaoId,
    status: "agendado",
    mandanteId: { $ne: null },
    visitanteId: { $ne: null },
  })
    .sort({ rodada: 1 })
    .limit(limite * 2)
    .lean();

  if (confrontos.length === 0) return [];

  // O que já tem prévia aberta, para não duplicar.
  const jaAbertos = await GameEvento.find({
    competicaoId: new mongoose.Types.ObjectId(competicaoId),
    status: { $in: ["aberto", "fechado"] },
  })
    .select("mandante.timeId visitante.timeId")
    .lean();
  const chaveDoPar = (a: string, b: string) => [a, b].sort().join("|");
  const ocupados = new Set(
    jaAbertos
      .filter((e) => e.mandante?.timeId && e.visitante?.timeId)
      .map((e) => chaveDoPar(String(e.mandante.timeId), String(e.visitante.timeId)))
  );

  const porId = new Map(times.map((t) => [String(t._id), t]));
  const agora = Date.now();
  const criados: Array<{ slug: string; confronto: string; comecaEm: Date }> = [];

  for (const c of confrontos) {
    if (criados.length >= limite) break;
    const m = porId.get(String(c.mandanteId));
    const v = porId.get(String(c.visitanteId));
    if (!m || !v) continue;
    if (ocupados.has(chaveDoPar(String(m._id), String(v._id)))) continue;

    const mandante = await montarLado(m as never, referencia);
    const visitante = await montarLado(v as never, referencia);

    /**
     * A prévia abre antes do confronto marcado, e fecha (roda) antes dele.
     * Sem data marcada, cai numa janela padrão — nunca no passado, porque um
     * evento que nasce vencido é liquidado no batimento seguinte sem ninguém
     * ter tido chance de apostar.
     */
    const marcado = c.dataPrevista ? new Date(c.dataPrevista).getTime() : 0;
    const alvo = marcado > agora
      ? marcado - HORAS_DE_ANTECEDENCIA * 3_600_000
      : agora + 45 * 60_000;
    const comecaEm = new Date(Math.max(alvo, agora + 20 * 60_000));

    const evento = await criarEvento({
      mandante: mandante.lado,
      visitante: visitante.lado,
      comecaEm,
      // Menos equilíbrio forçado que na rodada avulsa: aqui os times são os
      // que o organizador inscreveu, e achatar demais apagaria a diferença
      // real entre eles — que é justamente o que o campeonato quer medir.
      equilibrio: 0.25,
      competicaoId,
      rodada: c.rodada,
    });

    criados.push({
      slug: evento.slug,
      confronto: `${m.nome} × ${v.nome}`,
      comecaEm,
    });
  }

  return criados;
}

/** Abre prévias para todas as competições em andamento. Usado pelo batimento. */
export async function abrirPreviasEmAndamento(
  limitePorCompeticao = 3
): Promise<Array<{ competicao: string; criados: number }>> {
  await dbConnect();
  const emAndamento = await GameCompeticao.find({ status: "em-andamento" })
    .select("_id nome")
    .limit(20)
    .lean();

  const saida: Array<{ competicao: string; criados: number }> = [];
  for (const c of emAndamento) {
    const criados = await abrirPreviasDaCompeticao(String(c._id), limitePorCompeticao);
    if (criados.length > 0) saida.push({ competicao: c.nome, criados: criados.length });
  }
  return saida;
}
