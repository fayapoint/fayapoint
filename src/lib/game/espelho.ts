import dbConnect from "@/lib/mongodb";
import GameEaClube from "@/models/GameEaClube";
import GameEaPartida from "@/models/GameEaPartida";
import GameEaConfig from "@/models/GameEaConfig";
import {
  buscarClubes,
  divisoes,
  clubInfo,
  clubOverallStats,
  clubMembersStats,
  clubMembersCareer,
  clubMatchesTodas,
  linhaDoClube,
  rankingGlobal,
  eaRecusandoAcesso,
  normalizar,
  PLATAFORMAS,
  type ClubMatch,
  type ClubSearchResult,
  type DivisaoEA,
  type EaPlatform,
  type LinhaRanking,
} from "./ea-api";

/**
 * A CAMADA DE ESPELHO — 25/08/2026.
 *
 * ## O problema que ela resolve
 *
 * A EA responde **HTTP 403 para IP de datacenter**. Medido no mesmo dia: do PC
 * do Ricardo (residencial) todos os endpoints respondem 200; da função da
 * Netlify **e** da VPS da Hostinger, 403 em tudo. Ou seja: a seção /game
 * funcionava no desenvolvimento e nunca funcionou em produção — as rotas
 * respondiam 200 com lista vazia, e nada dizia por quê.
 *
 * Nenhuma máquina nossa hospedada escapa do bloqueio, então não há conserto do
 * lado do servidor. O fluxo se inverte:
 *
 *     PC com IP residencial  ──lê a EA──▶  Mongo (game_ea_*)  ──▶  produção
 *
 * ## A regra desta camada
 *
 * Toda leitura tenta a fonte VIVA primeiro (para o dia em que o bloqueio cair,
 * e para o desenvolvimento, onde ela funciona). Se a fonte responder, o
 * resultado é gravado no espelho de passagem — cada visita em desenvolvimento
 * alimenta a produção. Se não responder, lê o espelho e **declara a idade do
 * dado**: espelho sem data é afirmação sem procedência.
 *
 * O disjuntor de `ea-api.ts` evita pagar a ida inútil em toda visita: depois de
 * 3 recusas, a fonte é pulada por 10 minutos.
 *
 * ## O brinde
 *
 * A busca da EA casa só PREFIXO, com espaço literal. A busca sobre o espelho
 * casa **qualquer palavra em qualquer posição** — para achar clube, o espelho é
 * melhor que a fonte.
 */

export type FonteDado = "ea" | "espelho" | "vazio";

export interface RespostaComFonte<T> {
  dados: T;
  fonte: FonteDado;
  /** Quando o espelho leu a EA. `null` quando o dado veio vivo. */
  capturedAt: string | null;
}

/** Escapa o que o usuário digitou antes de virar expressão regular no Mongo. */
function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ------------------------------------------------------------------ */
/* Gravação                                                            */
/* ------------------------------------------------------------------ */

/** Grava (ou atualiza) linhas de índice no espelho. Nunca duplica. */
export async function gravarClubes(
  clubes: Array<ClubSearchResult & { rank?: number }>
): Promise<number> {
  if (clubes.length === 0) return 0;
  await dbConnect();
  const ops = clubes
    .filter((c) => c.clubId && c.name && c.name !== "?")
    .map((c) => ({
      updateOne: {
        filter: { clubId: c.clubId, platform: c.platform },
        update: {
          $set: {
            name: c.name,
            nomeNormalizado: normalizar(c.name),
            stadName: c.stadName ?? undefined,
            crestAssetId: c.crestAssetId ?? undefined,
            regionId: c.regionId ?? undefined,
            teamId: c.teamId ?? undefined,
            currentDivision: c.currentDivision ?? undefined,
            bestDivision: c.bestDivision ?? undefined,
            skillRating: c.skillRating ?? undefined,
            wins: c.wins,
            ties: c.ties,
            losses: c.losses,
            gamesPlayed: c.gamesPlayed,
            goals: c.goals,
            goalsAgainst: c.goalsAgainst,
            cleanSheets: c.cleanSheets,
            ...(c.rank != null ? { rank: c.rank } : {}),
            sourceGrade: "B",
            capturedAt: new Date(),
          },
          // Uma captura de índice NÃO rebaixa um clube já capturado por inteiro.
          $setOnInsert: { profundidade: "indice" },
        },
        upsert: true,
      },
    }));
  if (ops.length === 0) return 0;
  const r = await GameEaClube.bulkWrite(ops, { ordered: false });
  return (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
}

/** Grava a captura FUNDA de um clube: elenco, carreira e campanha. */
export async function gravarClubeCompleto(payload: {
  info: ClubSearchResult;
  stats: unknown;
  members: unknown[];
  career: unknown[];
  tabela: ClubSearchResult | null;
}): Promise<void> {
  const { info, stats, members, career, tabela } = payload;
  await dbConnect();
  await GameEaClube.updateOne(
    { clubId: info.clubId, platform: info.platform },
    {
      $set: {
        name: info.name,
        nomeNormalizado: normalizar(info.name),
        stadName: info.stadName ?? undefined,
        crestAssetId: info.crestAssetId ?? undefined,
        regionId: info.regionId ?? undefined,
        teamId: info.teamId ?? undefined,
        currentDivision: tabela?.currentDivision ?? undefined,
        bestDivision: tabela?.bestDivision ?? undefined,
        skillRating: tabela?.skillRating ?? undefined,
        ...(tabela
          ? {
              wins: tabela.wins,
              ties: tabela.ties,
              losses: tabela.losses,
              gamesPlayed: tabela.gamesPlayed,
              goals: tabela.goals,
              goalsAgainst: tabela.goalsAgainst,
              cleanSheets: tabela.cleanSheets,
            }
          : {}),
        stats: stats ?? undefined,
        members,
        career,
        profundidade: "completo",
        sourceGrade: "B",
        capturedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/** Grava partidas por `matchId`. Recapturar não duplica nem apaga histórico. */
export async function gravarPartidas(
  partidas: ClubMatch[],
  platform: EaPlatform
): Promise<number> {
  const validas = partidas.filter((p) => p.matchId);
  if (validas.length === 0) return 0;
  await dbConnect();
  const ops = validas.map((p) => ({
    updateOne: {
      filter: { matchId: p.matchId, platform },
      update: {
        $set: {
          matchType: p.matchType,
          timestamp: p.timestamp,
          jogadaEm: new Date(p.timestamp * 1000),
          clubIds: p.clubs.map((c) => c.clubId),
          dados: p as unknown as Record<string, unknown>,
          sourceGrade: "B",
          capturedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));
  const r = await GameEaPartida.bulkWrite(ops, { ordered: false });
  return (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
}

/* ------------------------------------------------------------------ */
/* Leitura do espelho                                                  */
/* ------------------------------------------------------------------ */

interface DocEspelho {
  clubId: string;
  platform: EaPlatform;
  name: string;
  stadName?: string;
  crestAssetId?: string;
  regionId?: number;
  teamId?: number;
  currentDivision?: number;
  bestDivision?: number;
  skillRating?: number;
  wins: number;
  ties: number;
  losses: number;
  gamesPlayed: number;
  goals: number;
  goalsAgainst: number;
  cleanSheets: number;
  rank?: number;
  stats?: Record<string, unknown>;
  members?: Record<string, unknown>[];
  career?: Record<string, unknown>[];
  capturedAt?: Date;
}

function paraResultado(d: DocEspelho, match: ClubSearchResult["match"]): ClubSearchResult {
  return {
    clubId: d.clubId,
    name: d.name,
    regionId: d.regionId ?? null,
    teamId: d.teamId ?? null,
    crestAssetId: d.crestAssetId ?? null,
    stadName: d.stadName ?? null,
    platform: d.platform,
    currentDivision: d.currentDivision ?? null,
    bestDivision: d.bestDivision ?? null,
    skillRating: d.skillRating ?? null,
    wins: d.wins ?? 0,
    ties: d.ties ?? 0,
    losses: d.losses ?? 0,
    gamesPlayed: d.gamesPlayed ?? 0,
    goals: d.goals ?? 0,
    goalsAgainst: d.goalsAgainst ?? 0,
    points: 0,
    cleanSheets: d.cleanSheets ?? 0,
    match,
  };
}

/**
 * BUSCA — fonte viva primeiro, espelho depois.
 *
 * No espelho a comparação é por palavra contida (o que a EA não faz), então
 * "sul" acha "Leões do Sul" e "flamengo 00" acha "Flamengo␣␣␣␣␣00".
 */
export async function buscarComEspelho(
  termo: string,
  plataformas: EaPlatform[] = PLATAFORMAS
): Promise<RespostaComFonte<ClubSearchResult[]> & { varridos: number; aproximado: boolean }> {
  if (!eaRecusandoAcesso()) {
    const vivo = await buscarClubes(termo, { plataformas });
    if (vivo.clubes.length > 0) {
      // Alimenta o espelho de passagem: toda busca feita de onde a EA responde
      // (desenvolvimento, hoje) deixa a produção um pouco mais completa.
      void gravarClubes(vivo.clubes).catch(() => {});
      return {
        dados: vivo.clubes,
        fonte: "ea",
        capturedAt: null,
        varridos: vivo.varridos,
        aproximado: vivo.aproximado,
      };
    }
  }

  const alvo = normalizar(termo);
  const tokens = alvo.split(" ").filter(Boolean);
  if (tokens.length === 0) {
    return { dados: [], fonte: "vazio", capturedAt: null, varridos: 0, aproximado: false };
  }

  await dbConnect();
  const docs = (await GameEaClube.find({
    platform: { $in: plataformas },
    // Todas as palavras digitadas têm de aparecer no nome, em qualquer posição.
    $and: tokens.map((t) => ({ nomeNormalizado: { $regex: escaparRegex(t) } })),
  })
    .sort({ gamesPlayed: -1 })
    .limit(40)
    .lean()) as unknown as DocEspelho[];

  if (docs.length === 0) {
    return { dados: [], fonte: "vazio", capturedAt: null, varridos: 0, aproximado: false };
  }

  const clubes = docs.map((d) => {
    const n = normalizar(d.name);
    return paraResultado(d, n === alvo ? "exato" : n.startsWith(alvo) ? "prefixo" : "contem");
  });
  // A ordem é a mesma da fonte viva: nome exato, começa com, contém.
  const peso = (m: ClubSearchResult["match"]) => (m === "exato" ? 0 : m === "prefixo" ? 1 : 2);
  clubes.sort((a, b) => peso(a.match) - peso(b.match) || b.gamesPlayed - a.gamesPlayed);

  const maisNovo = docs.reduce<Date | null>(
    (a, d) => (d.capturedAt && (!a || d.capturedAt > a) ? d.capturedAt : a),
    null
  );

  return {
    dados: clubes,
    fonte: "espelho",
    capturedAt: maisNovo ? maisNovo.toISOString() : null,
    varridos: docs.length,
    aproximado: false,
  };
}

export interface FichaClube {
  info: ClubSearchResult | null;
  stats: unknown;
  members: unknown[];
  career: unknown[];
  tabela: ClubSearchResult | null;
  plataforma: EaPlatform;
}

/** FICHA DO CLUBE — fonte viva primeiro, espelho depois. */
export async function clubeComEspelho(
  clubId: string,
  plataformaPedida?: EaPlatform
): Promise<RespostaComFonte<FichaClube | null>> {
  if (!eaRecusandoAcesso()) {
    const candidatas = plataformaPedida ? [plataformaPedida] : PLATAFORMAS;
    const achadas = await Promise.all(
      candidatas.map(async (p) => ({ plataforma: p, info: await clubInfo(clubId, p) }))
    );
    const boa = achadas.find((r) => r.info && r.info.name !== "?");
    if (boa?.info) {
      const plataforma = boa.plataforma;
      const [stats, members, career, tabela] = await Promise.all([
        clubOverallStats(clubId, plataforma),
        clubMembersStats(clubId, plataforma),
        clubMembersCareer(clubId, plataforma),
        linhaDoClube(clubId, boa.info.name, plataforma),
      ]);
      const ficha: FichaClube = { info: boa.info, stats, members, career, tabela, plataforma };
      void gravarClubeCompleto({
        info: boa.info,
        stats,
        members,
        career,
        tabela,
      }).catch(() => {});
      return { dados: ficha, fonte: "ea", capturedAt: null };
    }
  }

  await dbConnect();
  const filtro = plataformaPedida ? { clubId, platform: plataformaPedida } : { clubId };
  const d = (await GameEaClube.findOne(filtro).lean()) as unknown as DocEspelho | null;
  if (!d) return { dados: null, fonte: "vazio", capturedAt: null };

  const info = paraResultado(d, "id");
  return {
    dados: {
      info,
      stats: d.stats ?? null,
      members: d.members ?? [],
      career: d.career ?? [],
      // A linha de índice do espelho já traz divisão atual e campanha.
      tabela: d.currentDivision != null ? info : null,
      plataforma: d.platform,
    },
    fonte: "espelho",
    capturedAt: d.capturedAt ? d.capturedAt.toISOString() : null,
  };
}

/** PARTIDAS — fonte viva primeiro, espelho depois (e o espelho tem MAIS). */
export async function partidasComEspelho(
  clubId: string,
  plataforma: EaPlatform
): Promise<RespostaComFonte<ClubMatch[]>> {
  if (!eaRecusandoAcesso()) {
    const vivas = await clubMatchesTodas(clubId, plataforma);
    if (vivas.length > 0) {
      void gravarPartidas(vivas, plataforma).catch(() => {});
      return { dados: vivas, fonte: "ea", capturedAt: null };
    }
  }

  await dbConnect();
  const docs = (await GameEaPartida.find({ clubIds: clubId, platform: plataforma })
    .sort({ timestamp: -1 })
    // O espelho guarda o que a janela de 30 da EA já descartou: mostramos 60.
    .limit(60)
    .lean()) as unknown as Array<{ dados: ClubMatch; capturedAt?: Date }>;

  if (docs.length === 0) return { dados: [], fonte: "vazio", capturedAt: null };
  const maisNovo = docs.reduce<Date | null>(
    (a, d) => (d.capturedAt && (!a || d.capturedAt > a) ? d.capturedAt : a),
    null
  );
  return {
    dados: docs.map((d) => d.dados),
    fonte: "espelho",
    capturedAt: maisNovo ? maisNovo.toISOString() : null,
  };
}

/**
 * REGRAS DE DIVISÃO — espelhadas como todo o resto.
 *
 * O `settings` da EA é estático por título e minúsculo, o que dá vontade de
 * deixá-lo indo direto na fonte. Mas ele cai no MESMO 403 de datacenter, e sem
 * ele a régua "cai / permanece / sobe" da central e a escada de divisões da
 * landing simplesmente não aparecem em produção. Um documento só resolve.
 */
export async function divisoesComEspelho(): Promise<RespostaComFonte<DivisaoEA[]>> {
  if (!eaRecusandoAcesso()) {
    const vivo = await divisoes();
    if (vivo.length > 0) {
      void gravarDivisoes(vivo).catch(() => {});
      return { dados: vivo, fonte: "ea", capturedAt: null };
    }
  }
  await dbConnect();
  const doc = (await GameEaConfig.findOne({ chave: "divisoes" }).lean()) as unknown as {
    valor?: DivisaoEA[];
    capturedAt?: Date;
  } | null;
  if (!doc?.valor?.length) return { dados: [], fonte: "vazio", capturedAt: null };
  return {
    dados: doc.valor,
    fonte: "espelho",
    capturedAt: doc.capturedAt ? doc.capturedAt.toISOString() : null,
  };
}

export async function gravarDivisoes(lista: DivisaoEA[]): Promise<void> {
  if (lista.length === 0) return;
  await dbConnect();
  await GameEaConfig.updateOne(
    { chave: "divisoes" },
    { $set: { valor: lista, capturedAt: new Date() } },
    { upsert: true }
  );
}

/** RANKING — fonte viva primeiro; no espelho, ordenado por skill rating. */
export async function rankingComEspelho(
  plataforma: EaPlatform,
  limite = 100
): Promise<RespostaComFonte<LinhaRanking[]>> {
  if (!eaRecusandoAcesso()) {
    const vivo = await rankingGlobal(plataforma);
    if (vivo.length > 0) {
      void gravarClubes(
        vivo.map((l) => ({
          clubId: l.clubId,
          name: l.name,
          regionId: null,
          teamId: null,
          crestAssetId: null,
          stadName: null,
          platform: l.platform,
          currentDivision: l.currentDivision,
          bestDivision: l.bestDivision,
          skillRating: l.skillRating,
          wins: l.wins,
          ties: l.ties,
          losses: l.losses,
          gamesPlayed: l.gamesPlayed,
          goals: l.goals,
          goalsAgainst: l.goalsAgainst,
          points: 0,
          cleanSheets: l.cleanSheets,
          match: "id" as const,
          rank: l.rank,
        }))
      ).catch(() => {});
      return { dados: vivo.slice(0, limite), fonte: "ea", capturedAt: null };
    }
  }

  await dbConnect();
  const docs = (await GameEaClube.find({ platform: plataforma, skillRating: { $gt: 0 } })
    .sort({ rank: 1, skillRating: -1 })
    .limit(limite)
    .lean()) as unknown as DocEspelho[];
  if (docs.length === 0) return { dados: [], fonte: "vazio", capturedAt: null };

  const maisNovo = docs.reduce<Date | null>(
    (a, d) => (d.capturedAt && (!a || d.capturedAt > a) ? d.capturedAt : a),
    null
  );
  return {
    dados: docs.map((d, i) => ({
      rank: d.rank ?? i + 1,
      clubId: d.clubId,
      name: d.name,
      platform: d.platform,
      skillRating: d.skillRating ?? null,
      currentDivision: d.currentDivision ?? null,
      bestDivision: d.bestDivision ?? null,
      wins: d.wins ?? 0,
      ties: d.ties ?? 0,
      losses: d.losses ?? 0,
      gamesPlayed: d.gamesPlayed ?? 0,
      goals: d.goals ?? 0,
      goalsAgainst: d.goalsAgainst ?? 0,
      cleanSheets: d.cleanSheets ?? 0,
      goalsPerGame: d.gamesPlayed ? Number((d.goals / d.gamesPlayed).toFixed(2)) : null,
      goalsAgainstPerGame: d.gamesPlayed
        ? Number((d.goalsAgainst / d.gamesPlayed).toFixed(2))
        : null,
      reputationTier: null,
    })),
    fonte: "espelho",
    capturedAt: maisNovo ? maisNovo.toISOString() : null,
  };
}
