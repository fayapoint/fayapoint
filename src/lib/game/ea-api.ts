/**
 * Cliente server-side da API pública de Clubs da EA (proclubs.ea.com).
 *
 * É a MESMA API que o site oficial de Clubs consome e que todos os trackers
 * (PROCLUBS.IO etc.) usam: JSON aberto, sem chave e sem login. As condições de
 * acesso, TODAS medidas contra a API viva em 25/08/2026:
 *
 *  1. A borda (Akamai) recusa requisição que não parece navegador — os headers
 *     abaixo imitam um Chrome comum. Sem eles: 403.
 *  2. Não há contrato: endpoint muda sem aviso a cada título (FC 24 → 25 → 26).
 *     Por isso TODA resposta aqui é normalizada para os nossos tipos e o
 *     chamador nunca vê o formato cru da EA — quando o FC 27 mudar o shape,
 *     o conserto é só neste arquivo.
 *  3. **A EA devolve texto duplamente codificado** ("UniÃ£o" no lugar de
 *     "União"). Todo nome que sai daqui passa por `repararTexto`.
 *  4. **A busca só casa PREFIXO da string inteira, com espaço literal.**
 *     "LEÕES  DO  SUL" (dois espaços, como o jogo guarda) não é encontrado por
 *     "LEÕES DO SUL" (um espaço, como o humano digita). Por isso existe o
 *     `buscarClubes` em leque, que varre prefixos e filtra no nosso lado.
 *  5. **`maxResultCount` acima de 200 devolve HTTP 500.** Sem o parâmetro, a EA
 *     devolve ~14 linhas — motivo pelo qual clube nenhum aparecia.
 *
 * Nunca entra aqui: senha da EA, leitura de memória, tráfego interceptado.
 * Só o que a própria EA publica na web aberta (grau de evidência B).
 */

const BASE = "https://proclubs.ea.com/api/fc";

/** PS5 + Xbox Series + PC compartilham a mesma piscina de Clubs. */
export type EaPlatform = "common-gen5" | "common-gen4";

/** As duas piscinas, na ordem em que a busca em leque as visita. */
export const PLATAFORMAS: EaPlatform[] = ["common-gen5", "common-gen4"];

/** Rótulo humano de cada piscina — o console, não a sigla da EA. */
export const ROTULO_PLATAFORMA: Record<EaPlatform, string> = {
  "common-gen5": "PS5 · Xbox Series · PC",
  "common-gen4": "PS4 · Xbox One",
};

/**
 * Teto medido do `maxResultCount` da busca. 200 responde 200 OK; 250 em diante
 * devolve `HTTP 500 — Fail to request /clubs/findClubs`. Sem o parâmetro a EA
 * devolve ~14 linhas, o que fazia clube existente parecer inexistente.
 */
const MAX_BUSCA = 200;

const HEADERS: Record<string, string> = {
  accept: "application/json",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  referer: "https://www.ea.com/",
};

/* ------------------------------------------------------------------ */
/* Disjuntor: a EA recusa IP de datacenter                             */
/* ------------------------------------------------------------------ */

/**
 * **Medido em 25/08/2026: a EA responde HTTP 403 para IP de datacenter.**
 * Do PC do Ricardo (residencial) tudo responde 200; da função da Netlify e da
 * VPS da Hostinger, 403 em todos os endpoints. Não é cabeçalho, não é região:
 * é a origem da requisição.
 *
 * Sem disjuntor, cada visita em produção pagaria uma ida inútil à EA antes de
 * cair no espelho. Depois de 3 recusas, este módulo para de tentar por 10
 * minutos — e volta a tentar sozinho depois disso, para o dia em que a EA
 * deixar de bloquear (ou em que a leitura passar a sair de outro lugar).
 */
const JANELA_DISJUNTOR = 10 * 60 * 1000;
const RECUSAS_PARA_ABRIR = 3;
let recusas = 0;
let abertoAte = 0;

/**
 * Verdadeiro enquanto vale a pena nem tentar falar com a EA.
 *
 * `GAME_EA_FORCAR_ESPELHO=1` finge que a EA está recusando. Serve para provar,
 * na máquina de desenvolvimento (onde a EA responde), que o caminho do espelho
 * funciona — sem isso, o comportamento de PRODUÇÃO só se testa em produção, que
 * é exatamente como esta seção ficou dois dias parecendo funcionar.
 */
export function eaRecusandoAcesso(): boolean {
  if (process.env.GAME_EA_FORCAR_ESPELHO === "1") return true;
  if (abertoAte && Date.now() < abertoAte) return true;
  if (abertoAte && Date.now() >= abertoAte) {
    // Passou a janela: uma nova chance, do zero.
    abertoAte = 0;
    recusas = 0;
  }
  return false;
}

function registrarRecusa() {
  recusas += 1;
  if (recusas >= RECUSAS_PARA_ABRIR) abertoAte = Date.now() + JANELA_DISJUNTOR;
}

function registrarSucesso() {
  recusas = 0;
  abertoAte = 0;
}

async function eaGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  if (eaRecusandoAcesso()) return null;
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url.toString(), {
      headers: HEADERS,
      signal: controller.signal,
      // O dado muda a cada partida jogada; o cache fica nas NOSSAS rotas.
      cache: "no-store",
    });
    if (!res.ok) {
      // 403/401 são a recusa por origem; 500 é a EA mal, e não fecha o disjuntor.
      if (res.status === 403 || res.status === 401) registrarRecusa();
      console.error(`[game/ea-api] ${path} -> HTTP ${res.status}`);
      return null;
    }
    registrarSucesso();
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[game/ea-api] ${path} falhou:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Texto: o reparo do mojibake e a normalização de comparação          */
/* ------------------------------------------------------------------ */

const DECODER = new TextDecoder("utf-8", { fatal: false });

/**
 * Desfaz a codificação dupla da EA: "UniÃ£o" volta a ser "União".
 *
 * O servidor da EA lê bytes UTF-8 como latin-1 e re-codifica, então cada
 * acentuada chega como dois caracteres. A volta é reinterpretar a string como
 * bytes latin-1 e decodificar como UTF-8.
 *
 * O reparo é CONDICIONAL de propósito: um nome que já veio certo ("Leões")
 * produz sequência UTF-8 inválida no caminho de volta, e aí devolvemos o
 * original. Sem essa guarda, consertar metade dos nomes quebraria a outra.
 */
export function repararTexto(s: string): string {
  if (!s || !/[\u00c0-\u00ff]/.test(s)) return s;
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i);
    // Caractere fora do latin-1 significa que a string já é UTF-8 correto.
    if (cp > 0xff) return s;
    bytes[i] = cp;
  }
  const reparado = DECODER.decode(bytes);
  return reparado.includes("\uFFFD") ? s : reparado;
}

/**
 * Forma de comparação: sem acento, minúscula, espaços colapsados.
 * É com ela que a busca em leque decide se um clube casa com o que a pessoa
 * digitou — e é o que faz "leoes do sul" achar "LEÕES  DO  SUL".
 */
export function normalizar(s: string): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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
  /** Nome do estádio escolhido pelo clube — identidade que ajuda a reconhecer. */
  stadName: string | null;
  /** Em qual piscina o clube foi encontrado. */
  platform: EaPlatform;
  /** Divisão em que o clube está AGORA (a busca devolve; `overallStats` não). */
  currentDivision: number | null;
  /** Melhor divisão já alcançada. */
  bestDivision: number | null;
  skillRating: number | null;
  wins: number;
  ties: number;
  losses: number;
  gamesPlayed: number;
  goals: number;
  goalsAgainst: number;
  /**
   * O campo `points` do índice da EA. **Não é** o placar da temporada de
   * divisão em curso, e não é V×3+E: para o clube 5053340 a EA devolve 106 com
   * 73V/15E (que dariam 234) e uma divisão que titula com 15 pontos. Sem
   * significado confirmado, ele NÃO vira afirmação em tela — fica aqui só para
   * quem for medir de novo quando o FC 27 sair.
   */
  points: number;
  cleanSheets: number;
  /**
   * Como esta linha foi encontrada — serve para a interface dizer "achei pelo
   * nome exato" contra "achei varrendo prefixo", e para o diagnóstico.
   */
  match: "id" | "exato" | "prefixo" | "contem" | "aproximado";
}

export interface ClubOverallStats {
  clubId: string;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  gamesPlayedPlayoff: number;
  goals: number;
  goalsAgainst: number;
  skillRating: number | null;
  titlesWon: number | null;
  leagueAppearances: number | null;
  promotions: number | null;
  relegations: number | null;
  bestDivision: number | null;
  bestFinishGroup: number | null;
  /** Nível de reputação do clube no FC 26 (0–10). */
  reputationTier: number | null;
  /** Sequência de vitórias em curso. */
  winStreak: number | null;
  /** Sequência de invencibilidade em curso. */
  unbeatenStreak: number | null;
  /**
   * Forma das últimas 10, da mais recente para a mais antiga, direto do campo
   * `lastMatch0..9` da EA. É a única forma que cobre 10 jogos: `clubs/matches`
   * devolve no máximo 10 por TIPO e mistura amistoso com liga.
   */
  form: Array<"win" | "draw" | "loss">;
  /** Os adversários dessas 10, na mesma ordem. */
  lastOpponents: string[];
}

export interface ClubMemberStats {
  name: string;
  gamesPlayed: number;
  winRate: number | null;
  goals: number;
  assists: number;
  passesMade: number | null;
  passSuccessRate: number | null;
  shotSuccessRate: number | null;
  tacklesMade: number | null;
  tackleSuccessRate: number | null;
  ratingAve: number | null;
  manOfTheMatch: number;
  redCards: number;
  cleanSheetsDef: number | null;
  cleanSheetsGk: number | null;
  favoritePosition: string | null;
  /** ---- A ficha do Pro (o avatar do jogador), que a v1 jogava fora ---- */
  proName: string | null;
  proOverall: number | null;
  proPosition: number | null;
  proHeight: number | null;
  proNationality: number | null;
  /** Gols nas últimas 11 partidas, da mais recente para a mais antiga. */
  recentGoals: number[];
}

/** Carreira do membro — o acumulado de todas as temporadas. */
export interface ClubMemberCareer {
  name: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  manOfTheMatch: number;
  ratingAve: number | null;
  favoritePosition: string | null;
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
  /** Segundos efetivamente jogados — separa titular de quem entrou no fim. */
  secondsPlayed: number | null;
  /** Segundos parado. A EA publica; é o que denuncia quem largou o jogo. */
  secondsIdle: number | null;
  goalsConceded: number | null;
  /** Arquétipo do FC 26 (o "molde" do Pro). Cru — a EA não publica o nome. */
  archetypeId: string | null;
}

export interface ClubMatch {
  matchId: string;
  timestamp: number; // epoch em segundos, como a EA manda (fuso inconsistente!)
  matchType: MatchType;
  clubs: Array<{
    clubId: string;
    name: string;
    goals: number;
    goalsAgainst: number;
    result: "win" | "loss" | "draw";
    /** A EA marca quando o adversário abandonou a partida. */
    winnerByDnf: boolean;
    /** Identificador da temporada da EA — agrupa as partidas no calendário. */
    seasonId: string | null;
    players: MatchPlayer[];
  }>;
}

export type MatchType = "leagueMatch" | "playoffMatch" | "friendlyMatch";

export const TIPOS_PARTIDA: MatchType[] = ["leagueMatch", "playoffMatch", "friendlyMatch"];

/** Regra de uma divisão do modo Clubs, direto do endpoint `settings`. */
export interface DivisaoEA {
  divisionId: number;
  divisionName: string;
  pointsForPromotion: number;
  pointsToHoldDivision: number;
  pointsToTitle: number;
}

/** Uma linha do ranking global de todos os tempos. */
export interface LinhaRanking {
  rank: number;
  clubId: string;
  name: string;
  platform: EaPlatform;
  skillRating: number | null;
  currentDivision: number | null;
  bestDivision: number | null;
  wins: number;
  ties: number;
  losses: number;
  gamesPlayed: number;
  goals: number;
  goalsAgainst: number;
  cleanSheets: number;
  goalsPerGame: number | null;
  goalsAgainstPerGame: number | null;
  reputationTier: number | null;
}

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
/**
 * As divisões do Clubs vão de 1 a 10. A EA devolve **0** para clube que não
 * está numa temporada de divisão — e 0 impresso numa coluna "Div" lê como
 * "divisão zero", que não existe. Aqui 0 vira ausência, que é o que ele é.
 */
const divisaoOuNull = (v: unknown): number | null => {
  const n = numOrNull(v);
  return n != null && n > 0 ? n : null;
};
const texto = (v: unknown): string => repararTexto(String(v ?? ""));

/** `lastMatchN` da EA: 1 = vitória, 0 = empate, 2 = derrota, -1 = não houve. */
function resultadoDoCodigo(v: unknown): "win" | "draw" | "loss" | null {
  const n = numOrNull(v);
  if (n === 1) return "win";
  if (n === 0) return "draw";
  if (n === 2) return "loss";
  return null;
}

function linhaBusca(r: Record<string, unknown>, platform: EaPlatform): ClubSearchResult {
  const info = (r.clubInfo ?? {}) as Record<string, unknown>;
  const customKit = (info.customKit ?? {}) as Record<string, unknown>;
  return {
    clubId: String(r.clubId ?? info.clubId ?? ""),
    name: texto(r.clubName ?? info.name ?? "?"),
    regionId: numOrNull(info.regionId),
    teamId: numOrNull(info.teamId),
    crestAssetId: customKit.crestAssetId ? String(customKit.crestAssetId) : null,
    stadName: customKit.stadName ? texto(customKit.stadName) : null,
    platform,
    currentDivision: divisaoOuNull(r.currentDivision),
    bestDivision: divisaoOuNull(r.bestDivision),
    skillRating: numOrNull(r.skillRating),
    wins: num(r.wins),
    ties: num(r.ties),
    losses: num(r.losses),
    gamesPlayed: num(r.gamesPlayed),
    goals: num(r.goals),
    goalsAgainst: num(r.goalsAgainst),
    points: num(r.points),
    cleanSheets: num(r.cleanSheets),
    match: "aproximado",
  };
}

/**
 * Uma consulta crua de busca à EA. Prefixo literal, com `maxResultCount` no
 * teto medido. Use `buscarClubes` — esta aqui é o tijolo.
 */
async function buscaCrua(prefixo: string, platform: EaPlatform): Promise<ClubSearchResult[]> {
  const termo = prefixo.trim();
  // Espaço na ponta faz a EA devolver zero. Prefixo de 1 caractere idem.
  if (termo.length < 2) return [];
  const raw = await eaGet<unknown>("allTimeLeaderboard/search", {
    platform,
    clubName: termo,
    maxResultCount: String(MAX_BUSCA),
  });
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[])
    .filter((r) => r && (r.clubId ?? r.clubInfo))
    .map((r) => linhaBusca(r, platform))
    .filter((c) => c.clubId);
}

/** Resultado da busca em leque, com a trilha do que foi consultado. */
export interface ResultadoBusca {
  clubes: ClubSearchResult[];
  /** Quantos clubes foram varridos até chegar nesses. */
  varridos: number;
  /** Cada consulta feita à EA, para diagnóstico honesto na interface. */
  trilha: Array<{ platform: EaPlatform; prefixo: string; achados: number }>;
  /** Verdadeiro quando nenhum clube casou e o que voltou é só aproximação. */
  aproximado: boolean;
}

/**
 * BUSCA EM LEQUE — o conserto do "não acho meu clube".
 *
 * A busca da EA tem três limites que, juntos, escondem a maioria dos clubes:
 * casa só PREFIXO, o espaço é LITERAL (e o jogo guarda nomes com espaço duplo,
 * "Flamengo     00") e sem `maxResultCount` devolve ~14 linhas.
 *
 * A saída é varrer prefixos cada vez mais curtos, nas duas piscinas, e filtrar
 * do nosso lado por "contém todas as palavras digitadas" — comparando sem
 * acento, sem caixa e com espaços colapsados. Assim "leoes sul" acha
 * "LEÕES  DO  SUL", e "flamengo 00" acha "Flamengo     00".
 *
 * Duas rodadas, ambas em paralelo, para não virar 8 idas em série:
 *   1ª — o termo inteiro como prefixo, nas duas piscinas. Resolve o caso comum.
 *   2ª — só se a 1ª não casou: a primeira palavra e suas raízes de 4 e 3 letras.
 */
export async function buscarClubes(
  termo: string,
  opcoes: { plataformas?: EaPlatform[]; limite?: number } = {}
): Promise<ResultadoBusca> {
  const plataformas = opcoes.plataformas?.length ? opcoes.plataformas : PLATAFORMAS;
  const limite = opcoes.limite ?? 40;
  const alvo = normalizar(termo);
  const tokens = alvo.split(" ").filter(Boolean);
  const trilha: ResultadoBusca["trilha"] = [];
  const vistos = new Map<string, ClubSearchResult>();

  if (alvo.length < 2) return { clubes: [], varridos: 0, trilha, aproximado: false };

  const casa = (c: ClubSearchResult) => {
    const n = normalizar(c.name);
    return tokens.every((t) => n.includes(t));
  };

  async function rodada(prefixos: string[]) {
    const consultas = plataformas.flatMap((p) =>
      prefixos.map(async (pref) => {
        const achados = await buscaCrua(pref, p);
        trilha.push({ platform: p, prefixo: pref, achados: achados.length });
        return achados;
      })
    );
    for (const lote of await Promise.all(consultas)) {
      for (const c of lote) if (!vistos.has(c.clubId)) vistos.set(c.clubId, c);
    }
    return [...vistos.values()].some(casa);
  }

  // 1ª rodada: o que a pessoa digitou, inteiro.
  let achou = await rodada([alvo]);

  // 2ª rodada: raízes da primeira palavra. Só paga se a 1ª não resolveu.
  if (!achou) {
    const t0 = tokens[0] ?? "";
    const raizes = [...new Set([t0, t0.slice(0, 4), t0.slice(0, 3)])].filter(
      (p) => p.length >= 2 && p !== alvo
    );
    if (raizes.length) achou = await rodada(raizes);
  }

  const todos = [...vistos.values()];
  const casando = todos.filter(casa);
  const aproximado = casando.length === 0;
  const base = aproximado ? todos : casando;

  // Classificação: nome idêntico primeiro, depois quem começa com o termo,
  // depois quem contém — e, dentro de cada faixa, o clube mais rodado antes.
  const pontuados = base.map((c) => {
    const n = normalizar(c.name);
    const grau: ClubSearchResult["match"] =
      n === alvo ? "exato" : n.startsWith(alvo) ? "prefixo" : casa(c) ? "contem" : "aproximado";
    const peso = grau === "exato" ? 0 : grau === "prefixo" ? 1 : grau === "contem" ? 2 : 3;
    return { ...c, match: grau, peso };
  });
  pontuados.sort((a, b) => a.peso - b.peso || b.gamesPlayed - a.gamesPlayed);

  return {
    clubes: pontuados.slice(0, limite).map(({ peso: _peso, ...c }) => c),
    varridos: todos.length,
    trilha,
    aproximado,
  };
}

/**
 * Busca compatível com a v1 (uma consulta, uma piscina). Mantida porque a
 * ingestão da Fase 1 casa partida por nome exato e não quer o leque.
 */
export async function searchClubs(
  name: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubSearchResult[]> {
  return buscaCrua(name, platform);
}

/** Estatística geral do clube (V/E/D, gols, skill rating, forma das últimas 10). */
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

  const form: Array<"win" | "draw" | "loss"> = [];
  const lastOpponents: string[] = [];
  for (let i = 0; i < 10; i++) {
    const res = resultadoDoCodigo(r[`lastMatch${i}`]);
    if (!res) continue;
    form.push(res);
    lastOpponents.push(String(r[`lastOpponent${i}`] ?? ""));
  }

  return {
    clubId: String(r.clubId ?? clubId),
    wins: num(r.wins),
    losses: num(r.losses),
    ties: num(r.ties),
    gamesPlayed: num(r.gamesPlayed),
    gamesPlayedPlayoff: num(r.gamesPlayedPlayoff),
    goals: num(r.goals),
    goalsAgainst: num(r.goalsAgainst),
    skillRating: numOrNull(r.skillRating),
    titlesWon: numOrNull(r.titlesWon),
    leagueAppearances: numOrNull(r.leagueAppearances),
    promotions: numOrNull(r.promotions),
    relegations: numOrNull(r.relegations),
    bestDivision: divisaoOuNull(r.bestDivision),
    bestFinishGroup: numOrNull(r.bestFinishGroup),
    reputationTier: numOrNull(r.reputationtier),
    winStreak: numOrNull(r.wstreak),
    unbeatenStreak: numOrNull(r.unbeatenstreak),
    form,
    lastOpponents,
  };
}

/** Ficha do clube (nome, escudo, estádio). */
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
    name: texto(r.name ?? "?"),
    regionId: numOrNull(r.regionId),
    teamId: numOrNull(r.teamId),
    crestAssetId: customKit.crestAssetId ? String(customKit.crestAssetId) : null,
    stadName: customKit.stadName ? texto(customKit.stadName) : null,
    platform,
    currentDivision: null,
    bestDivision: null,
    skillRating: null,
    wins: 0,
    ties: 0,
    losses: 0,
    gamesPlayed: 0,
    goals: 0,
    goalsAgainst: 0,
    points: 0,
    cleanSheets: 0,
    match: "id",
  };
}

/**
 * A linha do clube no índice da EA — a única fonte de **divisão ATUAL** e de
 * **pontos da temporada em curso**. `clubs/overallStats` não publica nenhuma
 * das duas (só a melhor divisão já alcançada), e são justamente os dois números
 * que um time de Clubs olha primeiro.
 *
 * Custa uma busca por prefixo do nome exato; se o clube não estiver no índice
 * (recém-criado, sem temporada fechada), devolve null e a página segue sem.
 */
export async function linhaDoClube(
  clubId: string,
  nome: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubSearchResult | null> {
  if (!nome || nome === "?") return null;
  const linhas = await buscaCrua(nome, platform);
  return linhas.find((l) => l.clubId === clubId) ?? null;
}

/**
 * Acha um clube pelo ID sem saber a piscina. `clubs/info` aceita um id por vez
 * e não diz de que geração ele é, então perguntamos às duas em paralelo.
 */
export async function clubePorId(clubId: string): Promise<ClubSearchResult | null> {
  const respostas = await Promise.all(PLATAFORMAS.map((p) => clubInfo(clubId, p)));
  return respostas.find((r) => r && r.name !== "?") ?? respostas.find(Boolean) ?? null;
}

/** Elenco atual com estatísticas da temporada e a ficha do Pro de cada um. */
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
  return members.map((m) => {
    const recentGoals: number[] = [];
    for (let i = 0; i <= 10; i++) {
      const chave = i === 0 ? "prevGoals" : `prevGoals${i}`;
      const v = numOrNull(m[chave]);
      if (v != null) recentGoals.push(v);
    }
    return {
      name: texto(m.name ?? "?"),
      gamesPlayed: num(m.gamesPlayed),
      winRate: numOrNull(m.winRate),
      goals: num(m.goals),
      assists: num(m.assists),
      passesMade: numOrNull(m.passesMade),
      passSuccessRate: numOrNull(m.passSuccessRate),
      shotSuccessRate: numOrNull(m.shotSuccessRate),
      tacklesMade: numOrNull(m.tacklesMade),
      tackleSuccessRate: numOrNull(m.tackleSuccessRate),
      ratingAve: numOrNull(m.ratingAve),
      manOfTheMatch: num(m.manOfTheMatch),
      redCards: num(m.redCards),
      cleanSheetsDef: numOrNull(m.cleanSheetsDef),
      cleanSheetsGk: numOrNull(m.cleanSheetsGK ?? m.cleanSheetsGk),
      favoritePosition: m.favoritePosition ? String(m.favoritePosition) : null,
      proName: m.proName ? texto(m.proName) : null,
      proOverall: numOrNull(m.proOverall),
      proPosition: numOrNull(m.proPos),
      proHeight: numOrNull(m.proHeight),
      proNationality: numOrNull(m.proNationality),
      recentGoals,
    };
  });
}

/** Carreira de cada membro — o acumulado que atravessa temporadas. */
export async function clubMembersCareer(
  clubId: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubMemberCareer[]> {
  const raw = await eaGet<{ members?: Record<string, unknown>[] }>("members/career/stats", {
    platform,
    clubId,
  });
  const members = raw?.members;
  if (!Array.isArray(members)) return [];
  return members.map((m) => ({
    name: texto(m.name ?? "?"),
    gamesPlayed: num(m.gamesPlayed),
    goals: num(m.goals),
    assists: num(m.assists),
    manOfTheMatch: num(m.manOfTheMatch),
    ratingAve: numOrNull(m.ratingAve),
    favoritePosition: m.favoritePosition ? String(m.favoritePosition) : null,
  }));
}

/** Últimas partidas de UM tipo (a EA limita a 10, o parâmetro não aumenta). */
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
        name: texto(p.playername ?? p.name ?? "?"),
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
        secondsPlayed: numOrNull(p.secondsPlayed),
        secondsIdle: numOrNull(p.realtimeidle),
        goalsConceded: numOrNull(p.goalsconceded),
        archetypeId: p.archetypeid ? String(p.archetypeid) : null,
      }));
      return {
        clubId: cid,
        name: texto(details.name ?? c.name ?? "?"),
        goals,
        goalsAgainst,
        result: (goals > goalsAgainst ? "win" : goals < goalsAgainst ? "loss" : "draw") as
          | "win"
          | "loss"
          | "draw",
        winnerByDnf: num(c.winnerByDnf) > 0,
        seasonId: c.season_id != null ? String(c.season_id) : null,
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

/**
 * TODAS as partidas recentes do clube, dos três tipos, já ordenadas da mais
 * nova para a mais velha. É o que alimenta o calendário: liga, mata-mata e
 * amistoso numa linha do tempo só, cada uma marcada com o seu tipo.
 */
export async function clubMatchesTodas(
  clubId: string,
  platform: EaPlatform = "common-gen5"
): Promise<ClubMatch[]> {
  const lotes = await Promise.all(TIPOS_PARTIDA.map((t) => clubMatches(clubId, t, platform)));
  const todas = lotes.flat();
  // A EA repete a mesma partida em tipos diferentes em alguns casos.
  const porId = new Map<string, ClubMatch>();
  for (const p of todas) if (p.matchId && !porId.has(p.matchId)) porId.set(p.matchId, p);
  return [...porId.values()].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * As regras de divisão do modo Clubs (quantos pontos promovem, seguram e dão
 * título em cada divisão). É estático por título — cabe cache longo.
 */
export async function divisoes(): Promise<DivisaoEA[]> {
  const raw = await eaGet<Record<string, Record<string, unknown>>>("settings", {});
  if (!raw || typeof raw !== "object") return [];
  return Object.values(raw)
    .map((d) => ({
      divisionId: num(d.divisionId),
      divisionName: String(d.divisionName ?? ""),
      pointsForPromotion: num(d.pointsForPromotion),
      pointsToHoldDivision: num(d.pointsToHoldDivision),
      pointsToTitle: num(d.pointsToTitle),
    }))
    .filter((d) => d.divisionId > 0)
    .sort((a, b) => a.divisionId - b.divisionId);
}

/**
 * Ranking global de todos os tempos — os 100 melhores clubes da piscina.
 * A EA não pagina: sempre os mesmos 100, sem `offset` que funcione.
 */
export async function rankingGlobal(
  platform: EaPlatform = "common-gen5"
): Promise<LinhaRanking[]> {
  const raw = await eaGet<Record<string, unknown>[]>("allTimeLeaderboard", { platform });
  if (!Array.isArray(raw)) return [];
  return raw.map((r, i) => {
    const info = (r.clubInfo ?? {}) as Record<string, unknown>;
    return {
      rank: numOrNull(r.rank) ?? i + 1,
      clubId: String(r.clubId ?? info.clubId ?? ""),
      name: texto(r.clubName ?? info.name ?? "?"),
      platform,
      skillRating: numOrNull(r.skillRating),
      currentDivision: divisaoOuNull(r.currentDivision),
      bestDivision: divisaoOuNull(r.bestDivision),
      wins: num(r.wins),
      ties: num(r.ties),
      losses: num(r.losses),
      gamesPlayed: num(r.gamesPlayed),
      goals: num(r.goals),
      goalsAgainst: num(r.goalsAgainst),
      cleanSheets: num(r.cleanSheets),
      goalsPerGame: numOrNull(r.goalsPerGame),
      goalsAgainstPerGame: numOrNull(r.goalsAgainstPerGame),
      reputationTier: numOrNull(r.reputationtier),
    };
  });
}
