import { ehWalkover } from "./simulacao";

const objeto = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const lista = (v: unknown): Record<string, unknown>[] => Array.isArray(v) ? v.map(objeto) : [];
const numero = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const texto = (v: unknown): string | null => typeof v === "string" && v.trim() ? v.trim() : null;

/** Não atribui culpa: winnerByDnf identifica o vencedor, nunca quem abandonou. */
export function evidenciasPartida(dados: unknown) {
  const partida = objeto(dados);
  const clubes = lista(partida.clubs);
  const duracoes = clubes.flatMap(c => lista(c.players).map(p => numero(p.secondsPlayed))).filter((n): n is number => n !== null && n > 0);
  const duracao = duracoes.length ? Math.max(...duracoes) : null;
  const sinalWo = ehWalkover({ clubs: clubes.map(c => ({
    goals: numero(c.goals) ?? undefined, winnerByDnf: c.winnerByDnf === true,
    players: lista(c.players).map(p => ({ secondsPlayed: numero(p.secondsPlayed) ?? undefined })),
  })) });
  const vencedoresPorDnf = clubes.filter(c => c.winnerByDnf === true).map(c => texto(c.name) ?? texto(c.clubId) ?? "Clube sem nome");
  const jogadoresParados = clubes.flatMap(c => lista(c.players).filter(p => (numero(p.secondsIdle) ?? 0) > 0).map(p => ({
    clube: texto(c.name) ?? texto(c.clubId), jogador: texto(p.name), segundosParado: numero(p.secondsIdle)!, segundosEmCampo: numero(p.secondsPlayed),
  })));
  return { matchId: texto(partida.matchId), duracao, sinalWo, vencedoresPorDnf, jogadoresParados,
    situacao: sinalWo || vencedoresPorDnf.length > 0 ? "revisar" as const : duracao === null ? "sem-duracao" as const : "sem-sinal-wo" as const,
    clubes: clubes.map(c => ({ clubId: texto(c.clubId), nome: texto(c.name), gols: numero(c.goals), venceuPorDnf: c.winnerByDnf === true })),
  };
}

/** Presença na amostra capturada, não frequência real nem temporada completa. */
export function resumoElenco(clubId: string, membros: unknown, partidas: unknown[]) {
  const elenco = new Map<string, { nome: string; atual: boolean; posicao: string | null; presencas: number; partidasComSinal: number; segundosParado: number | null; amostrasIdle: number; gols: number | null; amostrasGols: number }>();
  function obter(nome: string, atual = false, posicao: string | null = null) {
    const chave = nome.toLowerCase();
    let jogador = elenco.get(chave);
    if (!jogador) { jogador = { nome, atual, posicao, presencas: 0, partidasComSinal: 0, segundosParado: null, amostrasIdle: 0, gols: null, amostrasGols: 0 }; elenco.set(chave, jogador); }
    return jogador;
  }
  for (const m of lista(membros)) { const nome = texto(m.name); if (nome) obter(nome, true, texto(m.favoritePosition)); }
  let partidasComElenco = 0, partidasComSinal = 0, partidasSemDuracao = 0;
  const vistos = new Set<string>();
  for (const p of partidas) {
    const partida = objeto(p); const id = texto(partida.matchId);
    if (id && vistos.has(id)) continue; if (id) vistos.add(id);
    const clube = lista(partida.clubs).find(c => c.clubId === clubId);
    if (!clube) continue;
    const evidencia = evidenciasPartida(partida);
    if (evidencia.sinalWo) partidasComSinal++;
    if (evidencia.duracao === null) partidasSemDuracao++;
    const jogadores = lista(clube.players).filter(p => texto(p.name));
    if (!jogadores.length) continue;
    partidasComElenco++;
    const nomesVistos = new Set<string>();
    for (const p of jogadores) {
      const nome = texto(p.name)!;
      if (nomesVistos.has(nome.toLowerCase())) continue; nomesVistos.add(nome.toLowerCase());
      const jogador = obter(nome);
      jogador.presencas++;
      if (evidencia.sinalWo) jogador.partidasComSinal++;
      const idle = numero(p.secondsIdle);
      if (idle !== null) { jogador.segundosParado = (jogador.segundosParado ?? 0) + idle; jogador.amostrasIdle++; }
      const gols = numero(p.goals);
      if (!evidencia.sinalWo && evidencia.duracao !== null && gols !== null) {
        jogador.gols = (jogador.gols ?? 0) + gols; jogador.amostrasGols++;
      }
    }
  }
  return { partidasComElenco, partidasComSinal, partidasSemDuracao,
    jogadores: [...elenco.values()].sort((a, b) => Number(b.atual) - Number(a.atual) || b.presencas - a.presencas || a.nome.localeCompare(b.nome)),
  };
}
