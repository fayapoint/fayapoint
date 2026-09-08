import dbConnect from "@/lib/mongodb";
import GameEaClube from "@/models/GameEaClube";
import GamePlayer from "@/models/GamePlayer";
import GameEvento from "@/models/GameEvento";
import {
  calcularForca,
  referenciaDoConjunto,
  REFERENCIA_GLOBAL,
  type ForcaTime,
  type JogadorSimulado,
  type ReferenciaDaLiga,
} from "./simulacao";
import { criarEvento, type LadoParaEvento } from "./apostas-servidor";

/**
 * A RODADA — monta o cardápio de partidas do dia. 08/09/2026.
 *
 * ## O pedido, e o que ele exige
 *
 * "Que as partidas sejam equilibradas, para o resultado ser justo." Isso tem
 * duas metades, e só uma é óbvia:
 *
 * 1. **Parear times de força parecida.** Feito por ordenação: os clubes são
 *    postos em fila por nota e cada um enfrenta o VIZINHO da fila. Um
 *    pareamento aleatório produziria 1º contra 40º, que é resultado anunciado.
 *
 * 2. **Não mentir no preço.** Depois do pareamento ainda sobra diferença, e o
 *    `equilibrio` do evento aproxima mais um pouco as forças. O ponto que não
 *    se negocia: a odd é calculada sobre a força JÁ equilibrada, isto é, sobre
 *    o jogo que vai mesmo acontecer. Aproximar o jogo é desenho de produto;
 *    aproximar só o preço seria vender chance que o apostador não tem.
 *
 * ## De onde vêm os times
 *
 * Do espelho (`game_ea_clubes`), que é alimentado pelo coletor da máquina do
 * Ricardo — a EA responde 403 para IP de datacenter, então a produção nunca
 * fala com ela (ver `espelho.ts`). Consequência boa: a rodada monta igual em
 * desenvolvimento e em produção, porque as duas leem o mesmo banco.
 */

/** Quantas partidas uma rodada tem, quando ninguém pede outro número. */
export const PARTIDAS_POR_RODADA = 8;

/** Espaçamento entre uma partida e a seguinte. */
export const MINUTOS_ENTRE_PARTIDAS = 30;

/**
 * Mínimo de jogos na campanha para um clube entrar na rodada.
 *
 * Sem esse piso, um clube com 2 jogos e 9 gols entra como potência e o
 * `calcularForca` — que encolhe para a média, mas não faz milagre — ainda o
 * cota alto demais. O apostador pagaria pela nossa falta de amostra.
 */
export const JOGOS_MINIMOS = 15;

/**
 * Traduz um clube do espelho para o que o simulador entende.
 *
 * O elenco sai de `members` (captura funda) quando existe. Quando não existe,
 * o clube entra com elenco vazio e o simulador usa o de emergência — mas aí
 * ele não ganha mercado de jogador, porque cotar "Fulano marca" sobre um
 * elenco inventado seria oferecer aposta em ficção.
 */
export function clubeParaLado(
  clube: {
    clubId: string;
    name: string;
    gamesPlayed: number;
    goals: number;
    goalsAgainst: number;
    currentDivision?: number;
    skillRating?: number;
    kitColors?: number[];
    members?: Record<string, unknown>[];
  },
  /**
   * A referência do conjunto. Sem ela a força sai contra a média geral do
   * Clubs — e como o espelho guarda os clubes do RANKING, todo mundo vira
   * nota 99 com a defesa grudada no piso. Ver `referenciaDoConjunto`.
   */
  referencia: ReferenciaDaLiga = REFERENCIA_GLOBAL
): { forca: ForcaTime; elenco: JogadorSimulado[]; cor?: string } {
  const forca = calcularForca(
    {
      id: clube.clubId,
      nome: clube.name,
      jogos: clube.gamesPlayed,
      gols: clube.goals,
      golsSofridos: clube.goalsAgainst,
      divisao: clube.currentDivision,
      skillRating: clube.skillRating,
    },
    referencia
  );

  const elenco: JogadorSimulado[] = (clube.members ?? [])
    .map((m) => {
      const jogos = Number(m.gamesPlayed ?? 0);
      const posicao = normalizarPosicao(String(m.favoritePosition ?? m.proPosition ?? ""));
      return {
        gamertag: String(m.name ?? ""),
        posicao,
        golsPorJogo: jogos > 0 ? Number(m.goals ?? 0) / jogos : undefined,
        assistenciasPorJogo: jogos > 0 ? Number(m.assists ?? 0) / jogos : undefined,
        nota: m.ratingAve ? Number(m.ratingAve) : undefined,
      };
    })
    // Gamertag vazia quebraria a chave do mercado de jogador em silêncio.
    .filter((j) => j.gamertag.length > 0)
    // Elenco de Clubs chega a 40 nomes; a partida tem 11. Os mais rodados.
    .slice(0, 14);

  return { forca, elenco, cor: corDoUniforme(clube.kitColors) };
}

function normalizarPosicao(bruta: string): JogadorSimulado["posicao"] {
  const p = bruta.toLowerCase();
  if (p.includes("goal") || p === "gk") return "goalkeeper";
  if (p.includes("def") || p === "cb" || p === "lb" || p === "rb") return "defender";
  if (p.includes("forward") || p.includes("att") || p === "st" || p === "cf") return "forward";
  return "midfielder";
}

/**
 * A primeira cor do uniforme, se a EA a publicou.
 *
 * A EA guarda cor como inteiro; `kitColor1..3` é RGB em três campos. O
 * espelho recebeu o vetor, e é ele que faz o cartão do clube parecer DELE em
 * vez de mais um cartão cinza. Sem cor, devolve `undefined` e a tela usa a
 * cor da seção — nunca uma cor inventada.
 */
function corDoUniforme(cores?: number[]): string | undefined {
  if (!cores || cores.length < 3) return undefined;
  const [r, g, b] = cores;
  if ([r, g, b].some((c) => typeof c !== "number" || c < 0 || c > 255)) return undefined;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Monta e abre uma rodada de partidas simuladas.
 *
 * Devolve o que criou, para o log do cron e para a tela de administração.
 */
export async function montarRodada(params?: {
  quantidade?: number;
  equilibrio?: number;
  /** Minutos até a primeira partida. Dá tempo de as apostas entrarem. */
  minutosAteAPrimeira?: number;
  plataforma?: "common-gen5" | "common-gen4";
}): Promise<Array<{ slug: string; confronto: string; comecaEm: Date }>> {
  await dbConnect();

  const quantidade = params?.quantidade ?? PARTIDAS_POR_RODADA;
  const equilibrio = params?.equilibrio ?? 0.5;
  const plataforma = params?.plataforma ?? "common-gen5";

  /**
   * Clubes com campanha que sustenta preço, **os que têm elenco primeiro** —
   * são eles que rendem mercado de jogador.
   *
   * ⚠️ A primeira versão fazia isso com `.sort({ profundidade: -1 })`,
   * contando que "completo" viesse antes de "indice". Não vem: o Mongo ordena
   * a STRING, e em ordem decrescente `"indice" > "completo"`. O resultado
   * medido foi o exato oposto do pretendido — oito partidas seguidas com
   * elenco 0/0 e nenhum mercado de jogador, sem erro nenhum em lugar nenhum.
   *
   * Por isso agora são duas consultas explícitas em vez de uma ordenação
   * esperta: primeiro quem TEM elenco (`members.0` existe), depois o resto
   * para completar. Uma ordenação que depende de acidente alfabético é uma
   * ordenação que quebra quando alguém renomeia um valor de enum.
   */
  const base = { platform: plataforma, gamesPlayed: { $gte: JOGOS_MINIMOS } };
  const teto = quantidade * 6;

  const comElenco = await GameEaClube.find({ ...base, "members.0": { $exists: true } })
    .sort({ skillRating: -1 })
    .limit(teto)
    .lean();

  const clubes = [...comElenco];
  if (clubes.length < teto) {
    const semElenco = await GameEaClube.find({
      ...base,
      "members.0": { $exists: false },
    })
      .sort({ skillRating: -1 })
      .limit(teto - clubes.length)
      .lean();
    clubes.push(...semElenco);
  }

  if (clubes.length < 2) return [];

  // Não repetir os confrontos que já estão no ar: a rodada de hoje não deve
  // ser a de ontem outra vez.
  const abertos = await GameEvento.find({ status: "aberto" })
    .select("mandante.eaClubId visitante.eaClubId")
    .lean();
  const ocupados = new Set<string>();
  for (const e of abertos) {
    if (e.mandante?.eaClubId) ocupados.add(e.mandante.eaClubId);
    if (e.visitante?.eaClubId) ocupados.add(e.visitante.eaClubId);
  }

  const disponiveis = clubes.filter((c) => !ocupados.has(c.clubId));

  // A referência sai do PRÓPRIO conjunto que vai jogar, antes de qualquer
  // pareamento. É o que faz "ataque 1,0" querer dizer "a média desta rodada".
  const referencia = referenciaDoConjunto(
    disponiveis.map((c) => ({ gols: c.goals, golsSofridos: c.goalsAgainst, jogos: c.gamesPlayed }))
  );

  const todos = disponiveis.map((c) => ({ clube: c, ...clubeParaLado(c, referencia) }));

  /**
   * A fila por nota: vizinho enfrenta vizinho, e a partida nasce parelha.
   *
   * Mas em DOIS grupos, não num só — quem tem elenco conhecido de um lado, quem
   * não tem do outro. O motivo é medido: com uma fila única ordenada só por
   * nota, um clube com elenco caía ao lado de um sem elenco, e como o mercado
   * de jogador exige os DOIS elencos, a rodada saiu com 2 partidas de 8 tendo
   * mercado de jogador. Separando os grupos, os clubes com elenco se enfrentam
   * e quase toda partida deles rende cartaz de jogador.
   *
   * A ordenação por nota continua dentro de cada grupo, então o equilíbrio —
   * que é o ponto do pareamento — não é sacrificado por isto.
   */
  const porNota = (a: { forca: ForcaTime }, b: { forca: ForcaTime }) => b.forca.nota - a.forca.nota;
  const comElencoConhecido = todos.filter((c) => c.elenco.length >= 3).sort(porNota);
  const semElencoConhecido = todos.filter((c) => c.elenco.length < 3).sort(porNota);

  // Grupo ímpar deixaria um clube com elenco emparelhado com um sem. Melhor
  // devolvê-lo para o outro grupo do que perder um par inteiro do bom grupo.
  if (comElencoConhecido.length % 2 === 1) {
    semElencoConhecido.unshift(comElencoConhecido.pop()!);
    semElencoConhecido.sort(porNota);
  }

  const candidatos = [...comElencoConhecido, ...semElencoConhecido];

  // Quem reivindicou jogador no site aparece no elenco com a conta ligada —
  // é isso que permite alguém apostar em si mesmo.
  const donos = await GamePlayer.find({ isActive: true })
    .select("gamertag ownerUserId")
    .lean();
  const donoPorGamertag = new Map(
    donos.map((d) => [d.gamertag.toLowerCase(), String(d.ownerUserId)])
  );

  const agora = Date.now();
  const primeira = params?.minutosAteAPrimeira ?? 20;
  const criados: Array<{ slug: string; confronto: string; comecaEm: Date }> = [];

  for (let i = 0; i + 1 < candidatos.length && criados.length < quantidade; i += 2) {
    const a = candidatos[i];
    const b = candidatos[i + 1];

    const ligar = (elenco: JogadorSimulado[]) =>
      elenco.map((j) => ({
        ...j,
        userId: donoPorGamertag.get(j.gamertag.toLowerCase()),
      }));

    const mandante: LadoParaEvento = {
      eaClubId: a.clube.clubId,
      nome: a.clube.name,
      sigla: sigla(a.clube.name),
      cor: a.cor,
      forca: a.forca,
      elenco: ligar(a.elenco),
    };
    const visitante: LadoParaEvento = {
      eaClubId: b.clube.clubId,
      nome: b.clube.name,
      sigla: sigla(b.clube.name),
      cor: b.cor,
      forca: b.forca,
      elenco: ligar(b.elenco),
    };

    const comecaEm = new Date(
      agora + (primeira + criados.length * MINUTOS_ENTRE_PARTIDAS) * 60_000
    );

    const evento = await criarEvento({ mandante, visitante, comecaEm, equilibrio });
    criados.push({
      slug: evento.slug,
      confronto: `${a.clube.name} × ${b.clube.name}`,
      comecaEm,
    });
  }

  return criados;
}

function sigla(nome: string): string {
  const limpo = nome.replace(/[^\p{L}\p{N} ]/gu, " ").trim();
  const partes = limpo.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0] + (partes[2]?.[0] ?? "")).toUpperCase();
  return limpo.slice(0, 3).toUpperCase() || "W22";
}
