import dbConnect from "@/lib/mongodb";
import GamePlayer from "@/models/GamePlayer";
import GameEaClube from "@/models/GameEaClube";
import GameEaPartida from "@/models/GameEaPartida";
import { montarPerfil, type PerfilJogadorDados } from "./perfil-servidor";
import { chaveGamertag } from "./reputacao";
import { codeDaPosicaoEA } from "./posicoes";
import { setorDaPosicao, type Setor } from "./tema";
import type { ClubMatch, MatchPlayer, MatchType, EaPlatform } from "./ea-api";

/**
 * A FICHA DO JOGADOR — tudo que a plataforma sabe de UMA gamertag, montado a
 * partir do espelho (`game_ea_clubes`, `game_ea_partidas`) e do que é nosso
 * (`game_players`, `game_avaliacoes`). Nunca fala com a EA: em produção a EA
 * responde 403 para IP de datacenter (ver `espelho.ts`).
 *
 * Ela estende `montarPerfil` (perfil-servidor.ts) em três direções:
 *
 * 1. **Partidas.** O elenco do clube só traz o acumulado da temporada. As
 *    partidas espelhadas trazem a linha POR JOGADOR de cada jogo — defesas,
 *    segundos em campo, segundos parado, passes e desarmes com tentativas,
 *    arquétipo. É daqui que sai a ficha de goleiro e a forma recente.
 * 2. **Quem está olhando.** A página tem dois estados (dono do Pro vinculado ×
 *    visitante), e a distinção só pode ser feita no servidor.
 * 3. **Gamertag que só existe no elenco.** `montarPerfil` devolve `null` quando
 *    ninguém reivindicou, avaliou ou anunciou a gamertag — mas se ela está no
 *    elenco de um clube espelhado, há o que mostrar, e há o botão "esse sou eu".
 */

/* ------------------------------------------------------------------ */
/* Abandono (W.O.)                                                     */
/* ------------------------------------------------------------------ */

/**
 * Duração mínima, em segundos, para uma partida contar como jogada inteira.
 *
 * A EA registra ABANDONO como placar 3–0, e `winnerByDnf` não é confiável:
 * medido em 08/09/2026 sobre 215 partidas espelhadas, 57 (26,5%) terminam
 * exatamente 3–0 e só 21 delas trazem `winnerByDnf`. O que separa é a
 * duração — partida inteira dura ~5.532 s (maior `secondsPlayed` entre os
 * jogadores); W.O. deu 35 s, 126 s, 337 s. Só 138 das 215 são partida inteira.
 *
 * ✅ TODO resolvido em 08/09 (claude, integrando): `simulacao.ts` chegou ao
 * `main` no commit 25e0853, então o `ehWalkover` local saiu e a regra passou a
 * vir de lá. Uma regra desta importância em dois arquivos é uma regra que
 * diverge — basta alguém recalibrar o corte num lado.
 *
 * A versão de `simulacao.ts` é mais completa: além da duração, ela trata a
 * partida SEM lista de jogadores, em que não há `secondsPlayed` para medir e o
 * único sinal que resta é o `winnerByDnf` da EA somado ao 3–0 exato.
 */
import { ehWalkover, DURACAO_MINIMA_VALIDA } from "./simulacao";

/** Maior tempo em campo entre todos os jogadores dos dois clubes. */
export function duracaoDaPartida(partida: ClubMatch): number {
  let max = 0;
  for (const clube of partida.clubs) {
    for (const p of clube.players) {
      if (p.secondsPlayed != null && p.secondsPlayed > max) max = p.secondsPlayed;
    }
  }
  return max;
}

export { ehWalkover, DURACAO_MINIMA_VALIDA };

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Resultado = "win" | "draw" | "loss";

export interface LinhaPartidaJogador {
  matchId: string;
  /**
   * ISO. O `timestamp` da EA tem fuso inconsistente — só serve para ordenar e
   * datar; `null` quando ele não veio, porque data nenhuma é melhor que 1970.
   */
  quando: string | null;
  tipo: MatchType;
  clube: { id: string; nome: string };
  adversario: { id: string; nome: string } | null;
  placar: { pro: number; contra: number };
  resultado: Resultado;
  gols: number;
  assist: number;
  nota: number | null;
  chutes: number | null;
  passes: { feitos: number; tentados: number } | null;
  desarmes: { feitos: number; tentados: number } | null;
  defesas: number | null;
  /**
   * As seis defesas classificadas pela EA nesta partida, quando ela classificou.
   *
   * `null` em duas situacoes que NAO se distinguem aqui: partida capturada antes
   * de 08/09/2026 (o normalizador descartava os campos) e partida em que a EA
   * simplesmente nao mandou. Por isso a ficha conta em quantos jogos veio, em vez
   * de tratar ausencia como zero.
   */
  defesasPorTipo: { mergulho: number; cruzamento: number; rebote: number; soco: number; reflexo: number; direcao: number } | null;
  golsSofridos: number | null;
  semSofrer: boolean;
  craque: boolean;
  vermelho: boolean;
  posicao: string | null;
  setor: Setor;
  segundosJogados: number | null;
  segundosParado: number | null;
  arquetipoId: string | null;
  /** Duração da partida inteira (maior `secondsPlayed` em campo). */
  duracao: number;
  walkover: boolean;
}

export interface Percentual {
  feitos: number;
  tentados: number;
  /** 0–100, arredondado; `null` quando não houve tentativa. */
  pct: number | null;
}

export interface ResumoPartidas {
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  aproveitamento: number | null;
  gols: number;
  assist: number;
  chutes: number;
  notaMedia: number | null;
  craques: number;
  vermelhos: number;
  passes: Percentual | null;
  desarmes: Percentual | null;
  /** Soma dos segundos com o jogador em campo, nas partidas inteiras. */
  segundosJogados: number;
  /** Soma dos segundos parado. `pctParado` é parado ÷ jogado. */
  segundosParado: number;
  pctParado: number | null;
  /** Arquétipo mais frequente e em quantas partidas apareceu. Sem de-para de nome. */
  arquetipo: { id: string; vezes: number } | null;
  /** Em quantas partidas o jogador atuou em cada setor. */
  setores: Record<Setor, number>;
  /** Partidas de abandono deixadas FORA de todas as contas acima. */
  walkoversExcluidos: number;
  /** Gols do jogador nas partidas de abandono — para a tela dizer o que ficou de fora. */
  golsEmWalkover: number;
  primeira: string | null;
  ultima: string | null;
}

export interface FichaGoleiroDados {
  jogos: number;
  defesas: number;
  defesasPorJogo: number | null;
  golsSofridos: number;
  golsSofridosPorJogo: number | null;
  semSofrer: number;
  notaMedia: number | null;
  vitorias: number;
  aproveitamento: number | null;
  /** `cleanSheetsGk` do elenco da temporada — é a EA contando, não nós. */
  semSofrerTemporada: number | null;
  /** As defesas que a EA classificou. `null` se nenhuma partida trouxe. */
  porTipo: DefesasClassificadas | null;
}

/**
 * O detalhe da defesa — soma das seis categorias da EA nas partidas no gol.
 *
 * `classificadas` é a soma dos seis e **é menor que `defesas`**, sempre. A
 * diferença é defesa que a EA contou e não classificou, e ela fica visível de
 * propósito: inventar uma categoria "outras" para fechar a conta seria publicar
 * número que a fonte não deu.
 */
export interface DefesasClassificadas {
  mergulho: number;
  cruzamento: number;
  rebote: number;
  soco: number;
  reflexo: number;
  direcao: number;
  /** A soma dos seis. Nunca comparável com `defesas` como se fosse o mesmo. */
  classificadas: number;
  /** Em quantos jogos no gol a classificação veio — o resto não é zero, é vazio. */
  jogosComClassificacao: number;
}

/** O que o elenco da temporada traz além do que o perfil já mostrava. */
export interface ExtrasElenco {
  passSuccessRate: number | null;
  shotSuccessRate: number | null;
  tackleSuccessRate: number | null;
  passesMade: number | null;
  tacklesMade: number | null;
  cleanSheetsDef: number | null;
  cleanSheetsGk: number | null;
  redCards: number | null;
  /** Gols nas últimas 11 partidas, da mais recente para a mais antiga. */
  recentGoals: number[];
}

/** Quem está olhando a ficha, em relação a ela. */
export type Visao = "dono" | "reivindicado-por-outro" | "livre";

export interface FichaJogadorDados {
  perfil: PerfilJogadorDados;
  visao: Visao;
  logado: boolean;
  /** O Pro que o visitante já vinculou (quando não é este). */
  meuPro: { gamertag: string } | null;
  /** Se a gamertag está no elenco de um clube espelhado, dá para reivindicar daqui. */
  vinculoPossivel: { eaClubId: string; plataforma: EaPlatform; clubeNome: string | null } | null;
  elenco: ExtrasElenco | null;
  resumo: ResumoPartidas | null;
  goleiro: FichaGoleiroDados | null;
  /** As últimas partidas inteiras, da mais recente para a mais antiga. */
  recentes: LinhaPartidaJogador[];
  /** Quantas partidas foram lidas do espelho, contando W.O. */
  partidasLidas: number;
  /** Idade da leitura de partidas: a captura mais nova entre as lidas. */
  partidasCapturedAt: string | null;
}

/* ------------------------------------------------------------------ */
/* Coerções — o espelho guarda Mixed; nada aqui confia no formato       */
/* ------------------------------------------------------------------ */

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function txt(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function arred(n: number, casas = 0): number {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}
function pct(feitos: number, tentados: number): number | null {
  return tentados > 0 ? arred((feitos / tentados) * 100) : null;
}

/* ------------------------------------------------------------------ */
/* Partidas                                                            */
/* ------------------------------------------------------------------ */

const LIMITE_PARTIDAS = 400;

/**
 * Todas as partidas espelhadas em que a gamertag aparece na escalação, da mais
 * nova para a mais velha. Busca por nome, não por clube: o jogador troca de
 * clube e a ficha tem de seguir a pessoa. O espelho tem centenas de partidas
 * (743 em 08/09/2026), então o teto de 400 é folga, não corte.
 */
async function partidasDaGamertag(
  gamertag: string,
  plataforma: EaPlatform | null
): Promise<{ partidas: ClubMatch[]; capturedAt: string | null }> {
  await dbConnect();
  const rx = new RegExp(`^${escapar(gamertag)}$`, "i");
  const filtro: Record<string, unknown> = { "dados.clubs.players.name": rx };
  if (plataforma) filtro.platform = plataforma;

  const docs = (await GameEaPartida.find(filtro)
    .select("dados capturedAt")
    .sort({ timestamp: -1 })
    .limit(LIMITE_PARTIDAS)
    .lean()) as unknown as Array<{ dados: ClubMatch; capturedAt?: Date }>;

  const maisNova = docs.reduce<Date | null>(
    (a, d) => (d.capturedAt && (!a || d.capturedAt > a) ? d.capturedAt : a),
    null
  );
  return {
    partidas: docs.map((d) => d.dados).filter((p) => p && Array.isArray(p.clubs)),
    capturedAt: maisNova ? maisNova.toISOString() : null,
  };
}

/**
 * As seis defesas classificadas — o dado que nenhum tracker de Pro Clubs tem.
 *
 * A EA publica, por partida e por jogador, quantas defesas foram de mergulho,
 * em cruzamento, de rebote, de soco, de reflexo e de boa direcao. Nos
 * descartavamos os seis desde sempre, porque o normalizador so copia campo que
 * esta no mapa e o que fica de fora some sem avisar (achado e corrigido em
 * 08/09/2026, commit 4b126ae).
 *
 * ⛔ OS SEIS NAO SOMAM `saves`. Medido: `saves=6` com `cruzamento 1, reflexo 1,
 * direcao 1`. Ha defesa que a EA conta no total e nao classifica. Quem for
 * mostrar isso NUNCA pode preencher a diferenca com uma categoria "outras" —
 * seria numero inventado.
 *
 * Devolve `null` quando os seis campos vem ausentes: partida do espelho antiga,
 * capturada quando o normalizador ainda os jogava fora. Ausencia nao e zero.
 */
function classificarDefesas(jogador: MatchPlayer): LinhaPartidaJogador["defesasPorTipo"] {
  const d = jogador.defesasPorTipo;
  if (!d) return null;
  const seis = [d.mergulho, d.cruzamento, d.rebote, d.soco, d.reflexo, d.direcao];
  if (seis.every((v) => v == null)) return null;
  return {
    mergulho: num(d.mergulho) ?? 0,
    cruzamento: num(d.cruzamento) ?? 0,
    rebote: num(d.rebote) ?? 0,
    soco: num(d.soco) ?? 0,
    reflexo: num(d.reflexo) ?? 0,
    direcao: num(d.direcao) ?? 0,
  };
}

function linhaDaPartida(partida: ClubMatch, chave: string): LinhaPartidaJogador | null {
  let clube: ClubMatch["clubs"][number] | null = null;
  let jogador: MatchPlayer | null = null;
  for (const c of partida.clubs) {
    const p = (c.players ?? []).find((x) => chaveGamertag(String(x.name ?? "")) === chave);
    if (p) {
      clube = c;
      jogador = p;
      break;
    }
  }
  if (!clube || !jogador) return null;
  const adversario = partida.clubs.find((c) => c.clubId !== clube!.clubId) ?? null;

  const passes =
    jogador.passesMade != null && jogador.passAttempts != null
      ? { feitos: jogador.passesMade, tentados: jogador.passAttempts }
      : null;
  const desarmes =
    jogador.tacklesMade != null && jogador.tackleAttempts != null
      ? { feitos: jogador.tacklesMade, tentados: jogador.tackleAttempts }
      : null;

  return {
    matchId: partida.matchId,
    quando: num(partida.timestamp) ? new Date(partida.timestamp * 1000).toISOString() : null,
    tipo: partida.matchType,
    clube: { id: clube.clubId, nome: clube.name },
    adversario: adversario ? { id: adversario.clubId, nome: adversario.name } : null,
    placar: { pro: num(clube.goals) ?? 0, contra: num(clube.goalsAgainst) ?? 0 },
    resultado: clube.result,
    gols: num(jogador.goals) ?? 0,
    assist: num(jogador.assists) ?? 0,
    nota: num(jogador.rating),
    chutes: num(jogador.shots),
    passes,
    desarmes,
    defesas: num(jogador.saves),
    defesasPorTipo: classificarDefesas(jogador),
    golsSofridos: num(jogador.goalsConceded),
    semSofrer: jogador.cleanSheet === true,
    craque: jogador.mom === true,
    vermelho: (num(jogador.redCards) ?? 0) > 0,
    posicao: txt(jogador.position),
    setor: setorDaPosicao(jogador.position),
    segundosJogados: num(jogador.secondsPlayed),
    segundosParado: num(jogador.secondsIdle),
    arquetipoId: txt(jogador.archetypeId),
    duracao: duracaoDaPartida(partida),
    walkover: ehWalkover(partida),
  };
}

function resumir(linhas: LinhaPartidaJogador[]): ResumoPartidas | null {
  if (linhas.length === 0) return null;
  const inteiras = linhas.filter((l) => !l.walkover);
  const wo = linhas.filter((l) => l.walkover);

  const r: ResumoPartidas = {
    jogos: inteiras.length,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    aproveitamento: null,
    gols: 0,
    assist: 0,
    chutes: 0,
    notaMedia: null,
    craques: 0,
    vermelhos: 0,
    passes: null,
    desarmes: null,
    segundosJogados: 0,
    segundosParado: 0,
    pctParado: null,
    arquetipo: null,
    setores: { GOL: 0, DEF: 0, MEI: 0, ATA: 0, "—": 0 },
    walkoversExcluidos: wo.length,
    golsEmWalkover: wo.reduce((s, l) => s + l.gols, 0),
    primeira: inteiras.length ? inteiras[inteiras.length - 1].quando : null,
    ultima: inteiras.length ? inteiras[0].quando : null,
  };
  if (inteiras.length === 0) return r;

  let somaNota = 0;
  let comNota = 0;
  let pf = 0, pt = 0, temPasse = false;
  let df = 0, dt = 0, temDesarme = false;
  const arquetipos = new Map<string, number>();

  for (const l of inteiras) {
    if (l.resultado === "win") r.vitorias++;
    else if (l.resultado === "draw") r.empates++;
    else r.derrotas++;
    r.gols += l.gols;
    r.assist += l.assist;
    r.chutes += l.chutes ?? 0;
    if (l.nota != null) { somaNota += l.nota; comNota++; }
    if (l.craque) r.craques++;
    if (l.vermelho) r.vermelhos++;
    if (l.passes) { pf += l.passes.feitos; pt += l.passes.tentados; temPasse = true; }
    if (l.desarmes) { df += l.desarmes.feitos; dt += l.desarmes.tentados; temDesarme = true; }
    r.segundosJogados += l.segundosJogados ?? 0;
    r.segundosParado += l.segundosParado ?? 0;
    r.setores[l.setor]++;
    if (l.arquetipoId) arquetipos.set(l.arquetipoId, (arquetipos.get(l.arquetipoId) ?? 0) + 1);
  }

  r.aproveitamento = arred((r.vitorias / inteiras.length) * 100);
  r.notaMedia = comNota ? arred(somaNota / comNota, 2) : null;
  r.passes = temPasse ? { feitos: pf, tentados: pt, pct: pct(pf, pt) } : null;
  r.desarmes = temDesarme ? { feitos: df, tentados: dt, pct: pct(df, dt) } : null;
  r.pctParado = r.segundosJogados > 0 ? arred((r.segundosParado / r.segundosJogados) * 100, 1) : null;

  let melhor: { id: string; vezes: number } | null = null;
  for (const [id, vezes] of arquetipos) {
    if (!melhor || vezes > melhor.vezes) melhor = { id, vezes };
  }
  r.arquetipo = melhor;
  return r;
}

/**
 * A ficha de goleiro só nasce das partidas em que a gamertag JOGOU no gol —
 * um meia que fez uma partida de goleiro tem uma linha, não uma ficha.
 */
function fichaGoleiro(linhas: LinhaPartidaJogador[], cleanSheetsGk: number | null): FichaGoleiroDados | null {
  const noGol = linhas.filter((l) => !l.walkover && l.setor === "GOL");
  if (noGol.length === 0) return null;
  let defesas = 0, sofridos = 0, semSofrer = 0, vitorias = 0, somaNota = 0, comNota = 0;
  for (const l of noGol) {
    defesas += l.defesas ?? 0;
    sofridos += l.golsSofridos ?? l.placar.contra;
    if (l.semSofrer) semSofrer++;
    if (l.resultado === "win") vitorias++;
    if (l.nota != null) { somaNota += l.nota; comNota++; }
  }
  const n = noGol.length;

  // As seis categorias só entram nas partidas que as trouxeram. Somar zero pelas
  // que vieram sem classificação faria um goleiro antigo parecer um que não
  // defende de nada — o espelho tem partidas capturadas antes de 08/09/2026, e
  // nelas o campo nem chegou a ser guardado.
  const comTipo = noGol.filter((l) => l.defesasPorTipo != null);
  let porTipo: DefesasClassificadas | null = null;
  if (comTipo.length > 0) {
    const t = { mergulho: 0, cruzamento: 0, rebote: 0, soco: 0, reflexo: 0, direcao: 0 };
    for (const l of comTipo) {
      const d = l.defesasPorTipo!;
      t.mergulho += d.mergulho;
      t.cruzamento += d.cruzamento;
      t.rebote += d.rebote;
      t.soco += d.soco;
      t.reflexo += d.reflexo;
      t.direcao += d.direcao;
    }
    const classificadas = t.mergulho + t.cruzamento + t.rebote + t.soco + t.reflexo + t.direcao;
    if (classificadas > 0) porTipo = { ...t, classificadas, jogosComClassificacao: comTipo.length };
  }

  return {
    jogos: n,
    defesas,
    defesasPorJogo: arred(defesas / n, 1),
    golsSofridos: sofridos,
    golsSofridosPorJogo: arred(sofridos / n, 2),
    semSofrer,
    notaMedia: comNota ? arred(somaNota / comNota, 2) : null,
    vitorias,
    aproveitamento: arred((vitorias / n) * 100),
    semSofrerTemporada: cleanSheetsGk,
    porTipo,
  };
}

/* ------------------------------------------------------------------ */
/* Elenco                                                              */
/* ------------------------------------------------------------------ */

interface MembroAchado {
  membro: Record<string, unknown>;
  clubId: string;
  plataforma: EaPlatform;
  clubeNome: string | null;
  capturedAt: string | null;
}

/** Acha a gamertag no elenco de algum clube capturado por inteiro. */
async function membroNoEspelho(gamertag: string, clubId: string | null): Promise<MembroAchado | null> {
  await dbConnect();
  const rx = new RegExp(`^${escapar(gamertag)}$`, "i");
  const filtro: Record<string, unknown> = { profundidade: "completo", "members.name": rx };
  if (clubId) filtro.clubId = clubId;
  const doc = (await GameEaClube.findOne(filtro)
    .select("clubId platform name members capturedAt")
    .sort({ capturedAt: -1 })
    .lean()) as unknown as {
    clubId: string;
    platform: EaPlatform;
    name?: string;
    members?: Array<Record<string, unknown>>;
    capturedAt?: Date;
  } | null;
  if (!doc) return null;
  const chave = chaveGamertag(gamertag);
  const membro = (doc.members ?? []).find((m) => chaveGamertag(String(m.name ?? "")) === chave);
  if (!membro) return null;
  return {
    membro,
    clubId: doc.clubId,
    plataforma: doc.platform,
    clubeNome: txt(doc.name),
    capturedAt: doc.capturedAt ? doc.capturedAt.toISOString() : null,
  };
}

function extrasDoMembro(m: Record<string, unknown>): ExtrasElenco {
  const recent = Array.isArray(m.recentGoals)
    ? (m.recentGoals as unknown[]).map(num).filter((v): v is number => v != null)
    : [];
  return {
    passSuccessRate: num(m.passSuccessRate),
    shotSuccessRate: num(m.shotSuccessRate),
    tackleSuccessRate: num(m.tackleSuccessRate),
    passesMade: num(m.passesMade),
    tacklesMade: num(m.tacklesMade),
    cleanSheetsDef: num(m.cleanSheetsDef),
    cleanSheetsGk: num(m.cleanSheetsGk),
    redCards: num(m.redCards),
    recentGoals: recent,
  };
}

/** Perfil mínimo para uma gamertag que só existe no elenco espelhado. */
function perfilDoElenco(gamertag: string, achado: MembroAchado): PerfilJogadorDados {
  const m = achado.membro;
  const posicaoEA = txt(m.favoritePosition);
  return {
    gamertag: txt(m.name) ?? gamertag,
    proName: txt(m.proName),
    overall: num(m.proOverall),
    posicaoEA,
    posicaoCode: codeDaPosicaoEA(posicaoEA),
    estilo: null,
    verificado: false,
    reivindicado: false,
    plataforma: achado.plataforma,
    clube: { id: achado.clubId, nome: achado.clubeNome, divisao: null },
    reputacao: null,
    comentarios: [],
    temporada: {
      jogos: num(m.gamesPlayed),
      gols: num(m.goals),
      assist: num(m.assists),
      nota: num(m.ratingAve),
      motm: num(m.manOfTheMatch),
      aproveitamento: num(m.winRate),
    },
    carreira: null,
    vaga: null,
    fonteClube: "espelho",
    capturedAt: achado.capturedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Montagem                                                            */
/* ------------------------------------------------------------------ */

export async function montarFicha(
  gamertagBruta: string,
  viewerUserId: string | null
): Promise<FichaJogadorDados | null> {
  const gamertag = gamertagBruta.trim().slice(0, 40);
  if (gamertag.length < 2) return null;
  const chave = chaveGamertag(gamertag);
  await dbConnect();

  const rx = new RegExp(`^${escapar(gamertag)}$`, "i");
  const [perfilBase, donoDoc, meuDoc] = await Promise.all([
    montarPerfil(gamertag),
    GamePlayer.findOne({ gamertag: rx, isActive: true })
      .select("ownerUserId platform eaClubId")
      .lean() as Promise<{ ownerUserId?: unknown; platform?: string; eaClubId?: string } | null>,
    viewerUserId
      ? (GamePlayer.findOne({ ownerUserId: viewerUserId, isActive: true })
          .select("gamertag")
          .lean() as Promise<{ gamertag?: string } | null>)
      : Promise.resolve(null),
  ]);

  const clubIdConhecido = txt(donoDoc?.eaClubId) ?? perfilBase?.clube?.id ?? null;
  const achado = await membroNoEspelho(gamertag, clubIdConhecido || null)
    // Trocou de clube desde a reivindicação? Procura em qualquer elenco.
    .then((a) => a ?? (clubIdConhecido ? membroNoEspelho(gamertag, null) : null));

  const perfil = perfilBase ?? (achado ? perfilDoElenco(gamertag, achado) : null);
  if (!perfil) return null;

  const plataforma =
    (txt(donoDoc?.platform) as EaPlatform | null) ?? achado?.plataforma ?? (perfil.plataforma as EaPlatform | null);

  const { partidas, capturedAt } = await partidasDaGamertag(gamertag, plataforma);
  const linhas = partidas
    .map((p) => linhaDaPartida(p, chave))
    .filter((l): l is LinhaPartidaJogador => l != null);

  const elenco = achado ? extrasDoMembro(achado.membro) : null;

  let visao: Visao = "livre";
  if (donoDoc) {
    visao = viewerUserId && String(donoDoc.ownerUserId) === viewerUserId ? "dono" : "reivindicado-por-outro";
  }
  const meuPro = meuDoc?.gamertag && chaveGamertag(meuDoc.gamertag) !== chave ? { gamertag: meuDoc.gamertag } : null;

  return {
    perfil,
    visao,
    logado: !!viewerUserId,
    meuPro,
    vinculoPossivel:
      visao === "livre" && achado
        ? { eaClubId: achado.clubId, plataforma: achado.plataforma, clubeNome: achado.clubeNome }
        : null,
    elenco,
    resumo: resumir(linhas),
    goleiro: fichaGoleiro(linhas, elenco?.cleanSheetsGk ?? null),
    recentes: linhas.filter((l) => !l.walkover).slice(0, 10),
    partidasLidas: linhas.length,
    partidasCapturedAt: capturedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Texto da ficha, pt-BR e en                                          */
/* ------------------------------------------------------------------ */

/**
 * O copy da ficha mora aqui, e não em `copy.ts`/`copy-mercado.ts`, porque esses
 * módulos são de outro território nesta rodada. Segue o mesmo padrão (módulo
 * tipado, fora do dicionário grande) e deve migrar para `copy-mercado.ts` na
 * chave `perfil` quando o território abrir.
 */
export interface CopyFicha {
  dono: { titulo: string; sub: string; apostar: string; apostarSub: string };
  livre: {
    titulo: string;
    sub: string;
    souEu: string;
    souEuSub: string;
    vinculando: string;
    vinculado: string;
    entrarParaVincular: string;
    semElenco: string;
    naoJogo: string;
    naoJogoSub: string;
    irApostar: string;
    irMercado: string;
    jaTenhoPro: string;
    verMinhaFicha: string;
    outroDono: string;
    erro: string;
  };
  partidas: {
    titulo: string;
    sub: string;
    vazio: string;
    walkover: string;
    walkoverUm: string;
    walkoverSub: string;
    walkoverGols: string;
    lidas: string;
    acervo: string;
    ultimas: string;
    cols: {
      jogos: string; vitorias: string; empates: string; derrotas: string; aproveitamento: string;
      gols: string; assist: string; chutes: string; nota: string; craques: string; vermelhos: string;
      passes: string; desarmes: string; acerto: string; emCampo: string; parado: string;
      arquetipo: string; arquetipoSub: string; setores: string;
      partida: string; adversario: string; defesasCurto: string;
    };
    setor: Record<Setor, string>;
    tipo: Record<MatchType, string>;
    resultado: Record<Resultado, string>;
  };
  goleiro: {
    titulo: string;
    sub: string;
    jogos: string; defesas: string; defesasPorJogo: string; golsSofridos: string; golsSofridosPorJogo: string;
    semSofrer: string; semSofrerTemporada: string; nota: string; aproveitamento: string;
    porTipoTitulo: string; porTipoNota: string;
    mergulho: string; cruzamento: string; rebote: string; soco: string; reflexo: string; direcao: string;
  };
  elenco: {
    titulo: string;
    sub: string;
    passe: string; chute: string; desarme: string; passes: string; desarmes: string;
    semSofrerDef: string; semSofrerGk: string; vermelhos: string;
    forma: string; formaSub: string;
  };
  procedencia: { espelho: string; partidas: string; naoConfirmado: string };
}

const ptFicha: CopyFicha = {
  dono: {
    titulo: "Esta ficha é sua",
    sub: "Gamertag vinculada à sua conta. Tudo abaixo é lido do espelho da EA e das avaliações da comunidade.",
    apostar: "Apostar em mim",
    apostarSub: "Fichas de brincadeira, na mesa do Winners 22.",
  },
  livre: {
    titulo: "Esse é você?",
    sub: "Vincule a gamertag à sua conta para a ficha seguir você — mesmo quando trocar de clube.",
    souEu: "Esse sou eu",
    souEuSub: "A gamertag está no elenco de {clube} publicado pela EA.",
    vinculando: "Vinculando…",
    vinculado: "Gamertag vinculada. Recarregue para ver a ficha completa.",
    entrarParaVincular: "Entre na sua conta para vincular",
    semElenco: "Ainda não temos essa gamertag no elenco de nenhum clube do acervo. Abra a página do clube dela uma vez e volte aqui.",
    naoJogo: "Não jogo Pro Clubs",
    naoJogoSub: "Dá para entrar assim mesmo: a mesa de fichas e o mercado não exigem Pro.",
    irApostar: "Ir para a mesa de fichas",
    irMercado: "Ver o mercado",
    jaTenhoPro: "Você já tem um Pro vinculado:",
    verMinhaFicha: "Ver minha ficha",
    outroDono: "Gamertag já reivindicada por outra conta.",
    erro: "Não deu para vincular agora.",
  },
  partidas: {
    titulo: "Partida a partida",
    sub: "Somado das partidas espelhadas em que a gamertag esteve em campo. Só partida inteira entra na conta.",
    vazio: "Nenhuma partida desta gamertag no acervo ainda. O espelho guarda o que a EA publica; abra a página do clube para alimentá-lo.",
    walkover: "{n} partidas de abandono fora da conta",
    walkoverUm: "1 partida de abandono fora da conta",
    walkoverSub: "A EA registra abandono como 3–0 e não marca todos. Partida com menos de 75 minutos de relógio (4.500 s) não entra em nenhuma média.",
    walkoverGols: "{n} gols ficaram nelas.",
    lidas: "{n} partidas lidas do acervo",
    acervo: "Acervo de partidas capturado em",
    ultimas: "Últimas partidas inteiras",
    cols: {
      jogos: "Jogos", vitorias: "Vitórias", empates: "Empates", derrotas: "Derrotas", aproveitamento: "Aproveit.",
      gols: "Gols", assist: "Assist.", chutes: "Chutes", nota: "Nota média", craques: "Craque", vermelhos: "Vermelhos",
      passes: "Passes", desarmes: "Desarmes", acerto: "acerto", emCampo: "Em campo", parado: "Parado",
      arquetipo: "Arquétipo", arquetipoSub: "código da EA; nome não confirmado", setores: "Onde jogou",
      partida: "Partida", adversario: "Adversário", defesasCurto: "def.",
    },
    setor: { GOL: "Gol", DEF: "Defesa", MEI: "Meio", ATA: "Ataque", "—": "Sem posição" },
    tipo: { leagueMatch: "Liga", playoffMatch: "Mata-mata", friendlyMatch: "Amistoso" },
    resultado: { win: "V", draw: "E", loss: "D" },
  },
  goleiro: {
    titulo: "Ficha de goleiro",
    sub: "Só as partidas inteiras em que a gamertag jogou no gol. Defesas e gols sofridos são por partida, da EA.",
    jogos: "Jogos no gol", defesas: "Defesas", defesasPorJogo: "Defesas / jogo", golsSofridos: "Gols sofridos", golsSofridosPorJogo: "Sofridos / jogo",
    semSofrer: "Sem sofrer gol", semSofrerTemporada: "Sem sofrer gol (temporada, EA)", nota: "Nota média", aproveitamento: "Aproveit.",
    porTipoTitulo: "Como foram as defesas",
    porTipoNota: "A EA classifica parte das defesas, não todas — por isso a soma abaixo é menor que o total. O que falta é defesa que ela contou e não disse de que tipo; não inventamos uma categoria para fechar a conta.",
    mergulho: "Mergulho", cruzamento: "Em cruzamento", rebote: "Rebote", soco: "Soco", reflexo: "Reflexo", direcao: "Boa direção",
  },
  elenco: {
    titulo: "Temporada, pela EA",
    /**
     * ⚠️ A frase sobre o zero não é rodapé defensivo — ela evita a tela
     * parecer quebrada, e foi escrita depois de ver o caso acontecer.
     *
     * Medido em 08/09 com `twofox77`: a ficha mostrava **15 gols** em
     * "partida a partida" e **0 gols** aqui, lado a lado. Parece defeito e
     * não é: a estatística de temporada da EA conta partida de LIGA, e
     * campeonato organizado (a Super Copa inclusive) é jogado em AMISTOSO,
     * porque jogo marcado não pode depender do emparelhamento da EA.
     *
     * Ou seja, quem só joga campeonato aparece zerado aqui para sempre. Sem
     * dizer isso, a pessoa conclui que o nosso dado está errado — e o dado
     * está certo dos dois lados.
     */
    sub: "Percentuais como a EA publica no elenco do clube — só de partidas de liga. Quem joga campeonato aparece zerado aqui: torneio é disputado em amistoso, e amistoso não entra na temporada da EA. O bloco abaixo conta as partidas de verdade.",
    passe: "Acerto de passe", chute: "Acerto de chute", desarme: "Acerto de desarme", passes: "Passes certos", desarmes: "Desarmes",
    semSofrerDef: "Sem sofrer gol (defesa)", semSofrerGk: "Sem sofrer gol (goleiro)", vermelhos: "Vermelhos",
    forma: "Forma", formaSub: "Gols nas últimas 11 partidas, da mais recente para a mais antiga.",
  },
  procedencia: {
    espelho: "Dados do clube do nosso acervo",
    partidas: "Partidas do nosso acervo",
    naoConfirmado: "não confirmado",
  },
};

const enFicha: CopyFicha = {
  dono: {
    titulo: "This is your card",
    sub: "Gamertag linked to your account. Everything below is read from the EA mirror and community ratings.",
    apostar: "Bet on me",
    apostarSub: "Play chips, at the Winners 22 table.",
  },
  livre: {
    titulo: "Is this you?",
    sub: "Link the gamertag to your account so the card follows you — even when you change clubs.",
    souEu: "That's me",
    souEuSub: "The gamertag is in the {clube} roster published by EA.",
    vinculando: "Linking…",
    vinculado: "Gamertag linked. Reload to see the full card.",
    entrarParaVincular: "Sign in to link",
    semElenco: "We don't have this gamertag in any club roster in the archive yet. Open the club page once and come back.",
    naoJogo: "I don't play Pro Clubs",
    naoJogoSub: "You can still join: the chips table and the market don't require a Pro.",
    irApostar: "Go to the chips table",
    irMercado: "See the market",
    jaTenhoPro: "You already have a linked Pro:",
    verMinhaFicha: "See my card",
    outroDono: "Gamertag already claimed by another account.",
    erro: "Couldn't link right now.",
  },
  partidas: {
    titulo: "Match by match",
    sub: "Summed from mirrored matches where the gamertag was on the pitch. Only full matches count.",
    vazio: "No matches for this gamertag in the archive yet. The mirror keeps what EA publishes; open the club page to feed it.",
    walkover: "{n} abandoned matches left out",
    walkoverUm: "1 abandoned match left out",
    walkoverSub: "EA records abandonment as 3–0 and doesn't flag all of them. Matches under 75 minutes of clock (4,500 s) enter no average.",
    walkoverGols: "{n} goals stayed in them.",
    lidas: "{n} matches read from the archive",
    acervo: "Match archive captured on",
    ultimas: "Latest full matches",
    cols: {
      jogos: "Games", vitorias: "Wins", empates: "Draws", derrotas: "Losses", aproveitamento: "Win rate",
      gols: "Goals", assist: "Assists", chutes: "Shots", nota: "Avg rating", craques: "MOTM", vermelhos: "Red cards",
      passes: "Passes", desarmes: "Tackles", acerto: "accuracy", emCampo: "On pitch", parado: "Idle",
      arquetipo: "Archetype", arquetipoSub: "EA code; name unconfirmed", setores: "Where they played",
      partida: "Match", adversario: "Opponent", defesasCurto: "saves",
    },
    setor: { GOL: "Goal", DEF: "Defence", MEI: "Midfield", ATA: "Attack", "—": "No position" },
    tipo: { leagueMatch: "League", playoffMatch: "Playoff", friendlyMatch: "Friendly" },
    resultado: { win: "W", draw: "D", loss: "L" },
  },
  goleiro: {
    titulo: "Goalkeeper card",
    sub: "Only full matches where the gamertag played in goal. Saves and goals conceded are per match, from EA.",
    jogos: "Games in goal", defesas: "Saves", defesasPorJogo: "Saves / game", golsSofridos: "Goals conceded", golsSofridosPorJogo: "Conceded / game",
    semSofrer: "Clean sheets", semSofrerTemporada: "Clean sheets (season, EA)", nota: "Avg rating", aproveitamento: "Win rate",
    porTipoTitulo: "How the saves were made",
    porTipoNota: "EA classifies some saves, not all — which is why the numbers below add up to less than the total. The rest are saves it counted without saying what kind; we do not invent a category to close the gap.",
    mergulho: "Diving", cruzamento: "From crosses", rebote: "Parry", soco: "Punch", reflexo: "Reflex", direcao: "Good direction",
  },
  elenco: {
    titulo: "Season, by EA",
    sub: "Percentages as EA publishes them in the club roster — league matches only. Anyone who plays tournaments shows zero here: organised cups are played as friendlies, and friendlies do not count towards EA season stats. The block below counts the real matches.",
    passe: "Pass accuracy", chute: "Shot accuracy", desarme: "Tackle accuracy", passes: "Passes made", desarmes: "Tackles",
    semSofrerDef: "Clean sheets (defence)", semSofrerGk: "Clean sheets (goalkeeper)", vermelhos: "Red cards",
    forma: "Form", formaSub: "Goals in the last 11 matches, most recent first.",
  },
  procedencia: {
    espelho: "Club data from our archive",
    partidas: "Matches from our archive",
    naoConfirmado: "unconfirmed",
  },
};

export function getCopyFicha(locale: string): CopyFicha {
  return locale === "en" ? enFicha : ptFicha;
}
