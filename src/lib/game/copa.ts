import dbConnect from "@/lib/mongodb";
import GameCopa, { type TimeDaCopa, type GrauVinculo } from "@/models/GameCopa";
import GameEaPartida from "@/models/GameEaPartida";
import { ehWalkover } from "./simulacao";
import type { ClubMatch } from "./ea-api";

/**
 * A COBERTURA DE COPA DE TERCEIRO — 08/09/2026.
 *
 * Funções puras e de leitura. Quem VAI À EA é
 * `scripts/game/copa-coletar.ts`; aqui fica o que a rota e a tela precisam:
 * casar nome, agrupar série e conferir a tabela.
 *
 * ## A urgência que dita o desenho
 *
 * A EA guarda **10 partidas amistosas por clube**, e um confronto MD5 queima
 * cinco slots numa noite. Duas rodadas e o histórico anterior some da fonte
 * **para sempre** — não há paginação, nem consulta por id de partida, nem
 * arquivo. Nem a organização da copa consegue recuperar: ela depende da mesma
 * API.
 *
 * Por isso nada aqui recalcula a partir da EA em tempo de leitura. Tudo lê o
 * espelho (`game_ea_partidas`), que é o único lugar onde o histórico dura.
 */

/* ------------------------------------------------------------------ */
/* Casar nome da organização com nome de dentro do jogo                */
/* ------------------------------------------------------------------ */

export const normalizarNome = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Similaridade de Dice sobre bigramas.
 *
 * Escolhida porque o erro real que a gente enfrenta é **letra a mais ou a
 * menos**, não palavra trocada: o site escreve "Ice Nuggets" e o jogo escreve
 * "ICE NUGETS" (um G a menos). Comparação por igualdade ou por `includes`
 * falha nesse caso — e falhou: onze dos vinte times ficaram "não encontrados"
 * na primeira varredura por causa disso.
 */
export function similaridade(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigramas = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = bigramas(a);
  const B = bigramas(b);
  let intersecao = 0;
  let total = 0;
  for (const [g, n] of A) {
    total += n;
    intersecao += Math.min(n, B.get(g) ?? 0);
  }
  for (const [, n] of B) total += n;
  return (2 * intersecao) / total;
}

/** Prefixos e sufixos que o Clubs adora e que não distinguem clube nenhum. */
const RUIDO = /^(fc|ec|sc|cf|real|club)|(fc|ec|sc|cf|ofc|saf|inc|team)$/g;

/**
 * Quão parecido é o nome do jogo com o nome publicado. 0 a 1.
 *
 * Testa o nome cru e o nome sem ruído, e fica com o melhor — "FC APELUDOS"
 * casa com "Apeludos" só depois de tirar o `FC` da frente.
 */
export function proximidadeDeNome(nomeNoJogo: string, nomePublicado: string): number {
  const a = normalizarNome(nomeNoJogo);
  const b = normalizarNome(nomePublicado);
  const limpo = a.replace(RUIDO, "");
  const contido = (x: string, y: string) => x.includes(y) || y.includes(x);
  if (contido(a, b) || contido(limpo, b)) return 0.95;
  return Math.max(similaridade(a, b), similaridade(limpo, b));
}

/* ------------------------------------------------------------------ */
/* A assinatura de uma partida de copa                                 */
/* ------------------------------------------------------------------ */

/**
 * Mínimo de jogadores por lado para a partida contar como jogo de copa.
 *
 * Medido nos 9 confrontos confirmados: **todos 11 contra 11**, 92 a 121
 * minutos. Pelada de Clubs anda com 2 a 6. O corte em 10 aceita a partida em
 * que um jogador caiu e não deixa entrar jogo de 5.
 */
export const MINIMO_JOGADORES_COPA = 10;

/**
 * A copa é jogada em **amistoso**, não em liga.
 *
 * Medido: os 9 confrontos confirmados entre clubes da copa são todos
 * `friendlyMatch`. Faz sentido — partida de campeonato marcado não pode
 * depender do emparelhamento da EA. É o filtro mais barato e mais preciso que
 * temos para separar jogo de copa de jogo do dia a dia do clube.
 */
/**
 * ⚠️ O LIMITE DESTE FILTRO — leia antes de rotular qualquer coisa na tela.
 *
 * Ele separa "confronto entre dois times da copa" de "jogo do dia a dia do
 * clube". Ele **NÃO** separa jogo oficial de treino: um amistoso de treino
 * entre dois times da copa tem exatamente a mesma assinatura.
 *
 * A prova disso apareceu no primeiro teste com dado real: saiu um confronto
 * **Equipe X (grupo C) × Botafofo (grupo A)** — e na fase de grupos times de
 * grupos diferentes não se enfrentam. Ou é treino, ou é mata-mata, e a EA não
 * diz qual.
 *
 * Consequência para a tela, que não se negocia: a gente mostra **"confrontos
 * entre times da copa registrados pela EA"**, nunca "jogos da copa". A
 * diferença parece sutil e não é — a segunda seria uma afirmação que não temos
 * como sustentar, e o produto inteiro aqui é não afirmar o que não se prova.
 */
export function pareceJogoDeCopa(p: {
  matchType?: string;
  clubs?: Array<{ players?: unknown[] }>;
}): boolean {
  if (p.matchType !== "friendlyMatch") return false;
  const clubes = p.clubs ?? [];
  if (clubes.length !== 2) return false;
  return clubes.every((c) => (c.players?.length ?? 0) >= MINIMO_JOGADORES_COPA);
}

/* ------------------------------------------------------------------ */
/* Séries                                                              */
/* ------------------------------------------------------------------ */

export interface JogoDaSerie {
  matchId: string;
  em: Date;
  golsCasa: number;
  golsFora: number;
  /** W.O. detectado — não conta para o placar da série. */
  walkover: boolean;
}

export interface SerieDaCopa {
  timeCasa: string;
  timeFora: string;
  clubeCasa: string;
  clubeFora: string;
  jogos: JogoDaSerie[];
  vitoriasCasa: number;
  vitoriasFora: number;
  empates: number;
  comecouEm: Date;
  terminouEm: Date;
}

/**
 * Janela para dois jogos entrarem na MESMA série.
 *
 * Medido: BOTAFOFO 77 × OsempicDMarcelo jogaram 01:51, 02:13 e 02:30 em 08/09 —
 * três jogos em 40 minutos. Com 6 horas de folga, uma série de 5 jogos cabe
 * inteira mesmo com intervalo longo, e duas rodadas em dias diferentes nunca
 * se fundem.
 *
 * ⚠️ Isto é uma REGRA NOSSA de agrupamento, não um dado da EA — a EA não tem
 * conceito de série. Se dois clubes jogarem duas séries no mesmo dia, elas vão
 * aparecer como uma só, e a tela precisa admitir isso em vez de afirmar que a
 * série tem 8 jogos.
 */
export const JANELA_DA_SERIE_MS = 6 * 60 * 60 * 1000;

/**
 * Agrupa partidas em séries, por par de clubes e por proximidade no tempo.
 *
 * Ordena por tempo crescente e quebra a série quando o intervalo passa da
 * janela. Simples de propósito: um agrupador esperto (por contagem de jogos,
 * por exemplo) erraria toda vez que uma série fosse interrompida.
 */
export function agruparEmSeries(
  partidas: Array<{
    matchId: string;
    timestamp: number;
    clubs: Array<{ clubId: string | number; name: string; goals: number }>;
    dados?: unknown;
  }>,
  nomeDoClube: (clubId: string) => string
): SerieDaCopa[] {
  const porPar = new Map<string, typeof partidas>();
  for (const p of partidas) {
    if (p.clubs.length !== 2) continue;
    const ids = p.clubs.map((c) => String(c.clubId)).sort();
    const chave = ids.join("|");
    if (!porPar.has(chave)) porPar.set(chave, []);
    porPar.get(chave)!.push(p);
  }

  const series: SerieDaCopa[] = [];
  for (const lista of porPar.values()) {
    lista.sort((a, b) => a.timestamp - b.timestamp);
    let atual: typeof lista = [];
    const fechar = () => {
      if (atual.length === 0) return;
      series.push(montarSerie(atual, nomeDoClube));
      atual = [];
    };
    for (const p of lista) {
      if (atual.length > 0 && (p.timestamp - atual[atual.length - 1].timestamp) * 1000 > JANELA_DA_SERIE_MS) {
        fechar();
      }
      atual.push(p);
    }
    fechar();
  }
  return series.sort((a, b) => b.comecouEm.getTime() - a.comecouEm.getTime());
}

function montarSerie(
  jogos: Array<{
    matchId: string;
    timestamp: number;
    clubs: Array<{ clubId: string | number; name: string; goals: number }>;
    dados?: unknown;
  }>,
  nomeDoClube: (clubId: string) => string
): SerieDaCopa {
  // O "mandante" da série é o primeiro clube do primeiro jogo — a EA não tem
  // mando, então isto é só uma ordem estável para a tela não trocar de lado.
  const idCasa = String(jogos[0].clubs[0].clubId);
  const idFora = String(jogos[0].clubs[1].clubId);

  const lista: JogoDaSerie[] = [];
  let vCasa = 0;
  let vFora = 0;
  let empates = 0;

  for (const j of jogos) {
    const casa = j.clubs.find((c) => String(c.clubId) === idCasa);
    const fora = j.clubs.find((c) => String(c.clubId) === idFora);
    if (!casa || !fora) continue;
    const wo = ehWalkover((j.dados as { clubs?: never[] }) ?? { clubs: j.clubs as never[] });
    lista.push({
      matchId: j.matchId,
      em: new Date(j.timestamp * 1000),
      golsCasa: casa.goals,
      golsFora: fora.goals,
      walkover: wo,
    });
    // W.O. não entra no placar da série: 3–0 de abandono é ata, não futebol.
    if (wo) continue;
    if (casa.goals > fora.goals) vCasa++;
    else if (casa.goals < fora.goals) vFora++;
    else empates++;
  }

  return {
    timeCasa: nomeDoClube(idCasa),
    timeFora: nomeDoClube(idFora),
    clubeCasa: idCasa,
    clubeFora: idFora,
    jogos: lista,
    vitoriasCasa: vCasa,
    vitoriasFora: vFora,
    empates,
    comecouEm: lista[0]?.em ?? new Date(0),
    terminouEm: lista[lista.length - 1]?.em ?? new Date(0),
  };
}

/* ------------------------------------------------------------------ */
/* Classificação a partir da EA, e a conferência                       */
/* ------------------------------------------------------------------ */

export interface LinhaCalculada {
  time: string;
  grupo?: string;
  series: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  /** 3 por vitória de JOGO. A pontuação real da copa pode ser por série. */
  pontos: number;
}

/**
 * Monta a classificação a partir das partidas espelhadas.
 *
 * ⚠️ **Isto não é a tabela da copa.** É o que a EA mostra, contado por JOGO.
 * A copa pontua por confronto MD5, e a regra exata de pontuação dela não foi
 * confirmada. Por isso o nome é `LinhaCalculada` e não `Classificacao`, e por
 * isso a tela nunca a apresenta como "a tabela" — ela é o LADO DA EA da
 * conferência. Chamar isto de classificação oficial seria inventar autoridade
 * que a gente não tem.
 */
export function classificacaoPelaEA(
  series: SerieDaCopa[],
  grupoDoTime: (nome: string) => string | undefined
): LinhaCalculada[] {
  const linhas = new Map<string, LinhaCalculada>();
  const pegar = (time: string) => {
    if (!linhas.has(time)) {
      linhas.set(time, {
        time,
        grupo: grupoDoTime(time),
        series: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        pontos: 0,
      });
    }
    return linhas.get(time)!;
  };

  for (const s of series) {
    const casa = pegar(s.timeCasa);
    const fora = pegar(s.timeFora);
    casa.series++;
    fora.series++;
    for (const j of s.jogos) {
      if (j.walkover) continue;
      casa.jogos++;
      fora.jogos++;
      casa.golsPro += j.golsCasa;
      casa.golsContra += j.golsFora;
      fora.golsPro += j.golsFora;
      fora.golsContra += j.golsCasa;
      if (j.golsCasa > j.golsFora) {
        casa.vitorias++;
        fora.derrotas++;
        casa.pontos += 3;
      } else if (j.golsCasa < j.golsFora) {
        fora.vitorias++;
        casa.derrotas++;
        fora.pontos += 3;
      } else {
        casa.empates++;
        fora.empates++;
        casa.pontos++;
        fora.pontos++;
      }
    }
  }

  return [...linhas.values()].sort(
    (a, b) => b.pontos - a.pontos || b.golsPro - b.golsContra - (a.golsPro - a.golsContra)
  );
}

/**
 * O veredito de uma linha da conferência.
 *
 * `sem-comparacao` existe porque "não deu para comparar" NÃO é "conferiu".
 * Ver o comentário dentro de `conferir()` para o defeito que obrigou a
 * distinção — a versão anterior devolvia `confere` sem medida nenhuma.
 */
export type Veredito = "confere" | "diverge" | "sem-comparacao" | "so-oficial" | "so-ea";

export interface Conferencia {
  time: string;
  veredito: Veredito;
  oficial?: { pontos?: number; jogos?: number };
  ea?: { jogos: number; series: number };
  /** O que exatamente não bateu, em texto humano. */
  nota?: string;
}

/**
 * Compara a tabela publicada com o que a EA mostra.
 *
 * ## O cuidado que não pode faltar
 *
 * Divergência aqui **não acusa ninguém**. As causas prováveis, em ordem:
 *
 *  1. O nosso de-para de clube está errado.
 *  2. A EA guarda só 10 amistosos — jogo antigo já saiu da janela, e a nossa
 *     contagem fica MENOR que a real quase sempre.
 *  3. A copa pontua por série (MD5), não por jogo.
 *  4. Alguma partida amistosa 11v11 não era da copa.
 *
 * Só depois de tudo isso viria "a organização publicou errado" — e mesmo aí
 * não é a nossa tela que decide. Por isso o veredito `diverge` vem sempre com
 * `nota` explicando o que foi comparado, e a tela mostra os dois números lado
 * a lado em vez de eleger um vencedor.
 */
export function conferir(
  oficial: Array<{ time: string; pontos?: number; jogos?: number }>,
  calculada: LinhaCalculada[]
): Conferencia[] {
  const porNome = new Map(calculada.map((l) => [normalizarNome(l.time), l]));
  const vistos = new Set<string>();
  const saida: Conferencia[] = [];

  for (const o of oficial) {
    const chave = normalizarNome(o.time);
    vistos.add(chave);
    const ea = porNome.get(chave);
    if (!ea) {
      saida.push({
        time: o.time,
        veredito: "so-oficial",
        oficial: { pontos: o.pontos, jogos: o.jogos },
        nota: "não achamos partida deste time na base da EA — provavelmente o vínculo com o clube ainda não foi feito",
      });
      continue;
    }
    /**
     * ⚠️ CONFERIR EXIGE DUAS MEDIDAS. Sem as duas, o veredito é
     * `sem-comparacao` — nunca `confere`.
     *
     * Apontado pelo codex-bets em 08/09. A versão anterior fazia
     * `veredito: !cabe ? "confere" : ...`, ou seja: quando a organização não
     * publicava o número de confrontos, a linha saía **"confere"**. Dizia que
     * bateu sem nada ter sido comparado.
     *
     * É o mesmo defeito que eu tinha acabado de consertar no acervo (o "11
     * times parados" com um dia de fotografia) e escrevi de novo aqui, no
     * arquivo ao lado. Zero de medida virando afirmação de acordo.
     *
     * O segundo erro era a tolerância: `diferenca <= 1` chamava de `confere`
     * uma diferença real de 3 séries declaradas contra 2 observadas. Conferir
     * é bater — igualdade exata. Diferença é `diverge`, com a nota explicando
     * a causa mais provável, que é NOSSA (a janela de 10 amistosos da EA
     * cortando histórico), não da organização.
     */
    const temMedidaOficial = typeof o.jogos === "number" && o.jogos > 0;
    const bate = temMedidaOficial && o.jogos === ea.series;
    saida.push({
      time: o.time,
      veredito: !temMedidaOficial ? "sem-comparacao" : bate ? "confere" : "diverge",
      oficial: { pontos: o.pontos, jogos: o.jogos },
      ea: { jogos: ea.jogos, series: ea.series },
      nota: !temMedidaOficial
        ? "a organização não publica o número de confrontos deste time, então não há o que conferir — o que está ao lado é só o que observamos na EA"
        : !bate
          ? `a organização publica ${o.jogos} confronto(s) e nós observamos ${ea.series} na EA. A causa mais provável é nossa: a EA guarda só 10 amistosos por clube, e o que passa disso já saiu da fonte.`
          : undefined,
    });
  }

  for (const l of calculada) {
    if (vistos.has(normalizarNome(l.time))) continue;
    saida.push({
      time: l.time,
      veredito: "so-ea",
      ea: { jogos: l.jogos, series: l.series },
      nota: "achamos partidas deste time na EA, mas ele não está na tabela publicada",
    });
  }

  return saida;
}

/* ------------------------------------------------------------------ */
/* Leitura                                                             */
/* ------------------------------------------------------------------ */

/** As partidas de copa espelhadas dos clubes desta copa. */
export async function partidasDaCopa(slug: string): Promise<{
  copa: InstanceType<typeof GameCopa> | null;
  partidas: Array<{
    matchId: string;
    timestamp: number;
    clubs: Array<{ clubId: string; name: string; goals: number }>;
    dados: unknown;
  }>;
}> {
  await dbConnect();
  const copa = await GameCopa.findOne({ slug });
  if (!copa) return { copa: null, partidas: [] };

  const ids = copa.times.map((t) => t.eaClubId).filter((x): x is string => Boolean(x));
  if (ids.length === 0) return { copa, partidas: [] };

  /**
   * ⚠️ A PLATAFORMA ENTRA NA CONSULTA — apontado pelo codex-bets em 08/09.
   *
   * `clubId` é único DENTRO de uma piscina, não entre elas: `common-gen5`
   * (PS5/Series/PC) e `common-gen4` (PS4/Xbox One) são mundos separados da EA,
   * com numeração própria. Sem este filtro, o clube 78083 da gen4 entraria
   * como se fosse o `FC APELUDOS` da gen5, e uma partida de gente que nunca
   * ouviu falar da copa apareceria na tabela dela.
   *
   * Não deu erro em nenhum teste porque a copa inteira é gen5 e o espelho
   * ainda tem pouca gen4 — o defeito estava esperando o dia em que as duas
   * bases crescessem. É o tipo de coisa que só aparece em produção, e tarde.
   */
  const plataformas = [
    ...new Set(copa.times.map((t) => t.eaPlatform ?? "common-gen5")),
  ];

  // Traz tudo que tem UM lado da copa; o filtro dos DOIS lados é feito abaixo,
  // em memória. Um `$all` com os dois ids exigiria saber o par de antemão.
  const docs = await GameEaPartida.find({
    clubIds: { $in: ids },
    platform: { $in: plataformas },
  })
    .sort({ timestamp: -1 })
    .limit(1000)
    .lean();

  const conjunto = new Set(ids);
  const partidas = docs
    .map((d) => d.dados as unknown as ClubMatch)
    .filter((m) => {
      if (!m?.clubs || m.clubs.length !== 2) return false;
      // Os DOIS lados têm de ser clubes da copa — senão é jogo do dia a dia.
      if (!m.clubs.every((c) => conjunto.has(String(c.clubId)))) return false;
      return pareceJogoDeCopa(m as never);
    })
    .map((m) => ({
      matchId: m.matchId,
      timestamp: m.timestamp,
      clubs: m.clubs.map((c) => ({ clubId: String(c.clubId), name: c.name, goals: c.goals })),
      dados: m,
    }));

  return { copa, partidas };
}

/** O time da copa a que um clube da EA pertence. */
export function timePorClube(times: TimeDaCopa[]): (clubId: string) => string {
  const mapa = new Map(times.filter((t) => t.eaClubId).map((t) => [t.eaClubId!, t.nome]));
  return (clubId: string) => mapa.get(clubId) ?? clubId;
}

export type { TimeDaCopa, GrauVinculo };
