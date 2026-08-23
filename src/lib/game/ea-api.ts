/**
 * Cliente server-side da API pública de Clubs da EA (proclubs.ea.com).
 *
 * É a MESMA API que o site oficial de Clubs consome e que todos os trackers
 * (PROCLUBS.IO etc.) usam: JSON aberto, sem chave e sem login. Duas condições
 * medidas em produção por quem já opera contra ela:
 *
 *  1. A borda (Akamai) recusa requisição que não parece navegador — por isso
 *     os headers abaixo imitam um Chrome comum. Sem eles: 403.
 *  2. Não há contrato: endpoint muda sem aviso a cada título (FC 24 → 25 → 26).
 *     Por isso TODA resposta aqui é normalizada para os nossos tipos e o
 *     chamador nunca vê o formato cru da EA — quando o FC 27 mudar o shape,
 *     o conserto é só neste arquivo.
 *
 * Nunca entra aqui: senha da EA, leitura de memória, tráfego interceptado.
 * Só o que a própria EA publica na web aberta (grau de evidência B).
 */

const BASE = "https://proclubs.ea.com/api/fc";

/** PS5 + Xbox Series + PC compartilham a mesma piscina de Clubs. */
export type EaPlatform = "common-gen5" | "common-gen4";

const HEADERS: Record<string, string> = {
  accept: "application/json",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  referer: "https://www.ea.com/",
};

async function eaGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url.toString(), {
      headers: HEADERS,
      signal: controller.signal,
      // O dado muda a cada partida jogada; o cache fica nas NOSSAS rotas.
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[game/ea-api] ${path} -> HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[game/ea-api] ${path} falhou:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Tipos normalizados — o resto do site só conhece estes.              */
/* ------------------------------------------------------------------ */

export interface ClubSearchResult {
  clubId: string;
  name: string;
  regionId: number | null;
  teamId: number | null;
  /** Personalização do escudo/uniforme, quando a EA devolver. */
  crestAssetId: string | null;
}

export interface ClubOverallStats {
  clubId: string;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  goals: number;
  goalsAgainst: number;
  skillRating: number | null;
  titlesWon: number | null;
  leagueAppearances: number | null;
  promotions: number | null;
  relegations: number | null;
}

export interface ClubMemberStats {
  name: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  passSuccessRate: number | null;
  shotSuccessRate: number | null;
  tackleSuccessRate: number | null;
  ratingAve: number | null;
  manOfTheMatch: number;
  cleanSheetsDef: number | null;
  cleanSheetsGk: number | null;
  favoritePosition: string | null;
  proOverall: number | null;
}

export interface MatchPlayer {
  name: string;
  goals: number;
  assists: number;
  rating: number | null;
  shots: number | null;
  passesMade: number | null;
  passAttempts: number | null;
  tacklesMade: number | null;
  tackleAttempts: number | null;
  saves: number | null;
  cleanSheet: boolean;
  redCards: number;
  mom: boolean;
  position: string | null;
}

export interface ClubMatch {
  matchId: string;
  timestamp: number; // epoch em segundos, como a EA manda (fuso inconsistente!)
  matchType: MatchType;
  clubs: Array<{
    clubId: string;
    name: string;
    goals: number;
    result: "win" | "loss" | "draw";
    players: MatchPlayer[];
  }>;
}

export type MatchType = "leagueMatch" | "playoffMatch" | "friendlyMatch";

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Busca clubes por nome. A EA devolve um mapa ou lista conforme o humor da versão. */
export async function searchClubs(
  name: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubSearchResult[]> {
  const raw = await eaGet<unknown>("allTimeLeaderboard/search", {
    platform,
    clubName: name,
  });
  if (!raw) return [];

  const rows: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : typeof raw === "object"
      ? (Object.values(raw as Record<string, unknown>) as Record<string, unknown>[])
      : [];

  return rows
    .filter((r) => r && (r.clubId ?? r.clubInfo))
    .map((r) => {
      const info = (r.clubInfo ?? {}) as Record<string, unknown>;
      const customKit = (info.customKit ?? {}) as Record<string, unknown>;
      return {
        clubId: String(r.clubId ?? info.clubId ?? ""),
        name: String(r.clubName ?? info.name ?? "?"),
        regionId: numOrNull(info.regionId),
        teamId: numOrNull(info.teamId),
        crestAssetId: customKit.crestAssetId ? String(customKit.crestAssetId) : null,
      };
    })
    .filter((c) => c.clubId);
}

/** Estatística geral do clube (V/E/D, gols, skill rating). */
export async function clubOverallStats(
  clubId: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubOverallStats | null> {
  const raw = await eaGet<Record<string, unknown>[]>("clubs/overallStats", {
    platform,
    clubIds: clubId,
  });
  const r = Array.isArray(raw) ? raw[0] : null;
  if (!r) return null;
  return {
    clubId: String(r.clubId ?? clubId),
    wins: num(r.wins),
    losses: num(r.losses),
    ties: num(r.ties),
    gamesPlayed: num(r.gamesPlayed),
    goals: num(r.goals),
    goalsAgainst: num(r.goalsAgainst),
    skillRating: numOrNull(r.skillRating),
    titlesWon: numOrNull(r.titlesWon),
    leagueAppearances: numOrNull(r.leagueAppearances),
    promotions: numOrNull(r.promotions),
    relegations: numOrNull(r.relegations),
  };
}

/** Ficha do clube (nome e escudo). */
export async function clubInfo(
  clubId: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubSearchResult | null> {
  const raw = await eaGet<Record<string, unknown>>("clubs/info", {
    platform,
    clubIds: clubId,
  });
  const r = raw?.[clubId] as Record<string, unknown> | undefined;
  if (!r) return null;
  const customKit = (r.customKit ?? {}) as Record<string, unknown>;
  return {
    clubId,
    name: String(r.name ?? "?"),
    regionId: numOrNull(r.regionId),
    teamId: numOrNull(r.teamId),
    crestAssetId: customKit.crestAssetId ? String(customKit.crestAssetId) : null,
  };
}

/** Elenco atual com estatísticas da temporada. */
export async function clubMembersStats(
  clubId: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubMemberStats[]> {
  const raw = await eaGet<{ members?: Record<string, unknown>[] }>("members/stats", {
    platform,
    clubId,
  });
  const members = raw?.members;
  if (!Array.isArray(members)) return [];
  return members.map((m) => ({
    name: String(m.name ?? "?"),
    gamesPlayed: num(m.gamesPlayed),
    goals: num(m.goals),
    assists: num(m.assists),
    passSuccessRate: numOrNull(m.passSuccessRate),
    shotSuccessRate: numOrNull(m.shotSuccessRate),
    tackleSuccessRate: numOrNull(m.tackleSuccessRate),
    ratingAve: numOrNull(m.ratingAve),
    manOfTheMatch: num(m.manOfTheMatch),
    cleanSheetsDef: numOrNull(m.cleanSheetsDef),
    cleanSheetsGk: numOrNull(m.cleanSheetsGK ?? m.cleanSheetsGk),
    favoritePosition: m.favoritePosition ? String(m.favoritePosition) : null,
    proOverall: numOrNull(m.proOverall),
  }));
}

/** Últimas partidas (a EA limita a ~10 por tipo). */
export async function clubMatches(
  clubId: string,
  matchType: MatchType = "leagueMatch",
  platform: EaPlatform = "common-gen5"
): Promise<ClubMatch[]> {
  const raw = await eaGet<Record<string, unknown>[]>("clubs/matches", {
    platform,
    clubIds: clubId,
    matchType,
    maxResultCount: "10",
  });
  if (!Array.isArray(raw)) return [];

  return raw.map((m) => {
    const clubsRaw = (m.clubs ?? {}) as Record<string, Record<string, unknown>>;
    const playersRaw = (m.players ?? {}) as Record<string, Record<string, Record<string, unknown>>>;

    const clubs = Object.entries(clubsRaw).map(([cid, c]) => {
      const details = (c.details ?? {}) as Record<string, unknown>;
      const goals = num(c.goals);
      const goalsAgainst = num(c.goalsAgainst);
      const players = Object.values(playersRaw[cid] ?? {}).map((p) => ({
        name: String(p.playername ?? p.name ?? "?"),
        goals: num(p.goals),
        assists: num(p.assists),
        rating: numOrNull(p.rating),
        shots: numOrNull(p.shots),
        passesMade: numOrNull(p.passesmade),
        passAttempts: numOrNull(p.passattempts),
        tacklesMade: numOrNull(p.tacklesmade),
        tackleAttempts: numOrNull(p.tackleattempts),
        saves: numOrNull(p.saves),
        cleanSheet: num(p.cleansheetsany) > 0,
        redCards: num(p.redcards),
        mom: num(p.mom) > 0,
        position: p.pos ? String(p.pos) : null,
      }));
      return {
        clubId: cid,
        name: String(details.name ?? c.name ?? "?"),
        goals,
        result: (goals > goalsAgainst ? "win" : goals < goalsAgainst ? "loss" : "draw") as
          | "win"
          | "loss"
          | "draw",
        players,
      };
    });

    return {
      matchId: String(m.matchId ?? ""),
      timestamp: num(m.timestamp),
      matchType,
      clubs,
    };
  });
}
