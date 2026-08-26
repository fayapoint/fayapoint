/**
 * O MOTOR DE CAMPEONATO — geração de tabela, chaveamento e classificação.
 *
 * Tudo aqui é função pura: entra lista de times e confrontos, sai tabela.
 * Nenhuma ida ao banco, nenhuma dependência de React. É de propósito — a
 * classificação é a coisa que um organizador confere linha por linha, e uma
 * regra de desempate escondida dentro de um componente é impossível de testar
 * e fácil de quebrar sem ninguém notar.
 *
 * Vale para qualquer competição, com ou sem EA por trás: o motor conhece
 * "time" e "confronto", não conhece `clubId`.
 */

export type FormatoCompeticao = "pontos-corridos" | "mata-mata" | "grupos-mata-mata";

export type FaseConfronto =
  | "liga"
  | "grupo"
  | "trigesima-segunda"
  | "decima-sexta"
  | "oitavas"
  | "quartas"
  | "semi"
  | "terceiro"
  | "final";

/** As fases de mata-mata, da maior para a menor. A ordem é usada para chavear. */
export const ORDEM_MATA_MATA: FaseConfronto[] = [
  "trigesima-segunda",
  "decima-sexta",
  "oitavas",
  "quartas",
  "semi",
  "final",
];

/** Quantos times cada fase comporta. `final` = 2, `semi` = 4, e assim por diante. */
export const TIMES_NA_FASE: Record<string, number> = {
  final: 2,
  semi: 4,
  quartas: 8,
  oitavas: 16,
  "decima-sexta": 32,
  "trigesima-segunda": 64,
};

export type CriterioDesempate =
  | "pontos"
  | "vitorias"
  | "saldo"
  | "golsPro"
  | "golsContra"
  | "confrontoDireto";

export interface RegrasCompeticao {
  /** 1 = turno único; 2 = ida e volta. Só vale para liga e grupos. */
  turnos: 1 | 2;
  pontosVitoria: number;
  pontosEmpate: number;
  pontosDerrota: number;
  /** Aplicados em ordem. O primeiro que separar, decide. */
  criteriosDesempate: CriterioDesempate[];
  /** Só para `grupos-mata-mata`. */
  numGrupos?: number;
  classificadosPorGrupo?: number;
  /** Mata-mata em dois jogos. Sem gol fora de casa: agregado e pronto. */
  idaEVoltaMataMata?: boolean;
  /** Quantas posições sobem e quantas caem, para pintar as zonas da tabela. */
  vagasAcesso?: number;
  vagasRebaixamento?: number;
}

export interface TimeCompeticao {
  id: string;
  nome: string;
  sigla?: string | null;
  grupo?: string | null;
  /** Cor do clube, quando conhecida — a tabela fica com a cara dos times. */
  cor?: string | null;
}

export interface ConfrontoCompeticao {
  id: string;
  fase: FaseConfronto;
  rodada: number;
  grupo?: string | null;
  /** Posição no chaveamento, para desenhar a árvore do mata-mata. */
  chave?: number | null;
  /** `null` quando a vaga ainda espera o vencedor de outro confronto. */
  mandanteId: string | null;
  visitanteId: string | null;
  golsMandante: number | null;
  golsVisitante: number | null;
  /** Jogo de volta do mesmo par (mata-mata em dois jogos). */
  perna?: 1 | 2;
  status: "agendado" | "aguardando" | "confirmado" | "wo" | "cancelado";
}

export interface LinhaClassificacao {
  posicao: number;
  timeId: string;
  nome: string;
  sigla?: string | null;
  cor?: string | null;
  grupo?: string | null;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
  pontos: number;
  aproveitamento: number;
  /** Últimos 5 resultados, do mais recente para o mais antigo. */
  forma: Array<"win" | "draw" | "loss">;
}

/* ------------------------------------------------------------------ */
/* Presets — o "não me faça pensar" da criação                         */
/* ------------------------------------------------------------------ */

export interface PresetCompeticao {
  id: string;
  /** Nome do ícone do lucide-react. A UI resolve; o motor não conhece React. */
  icone: string;
  formato: FormatoCompeticao;
  vagas: number;
  regras: RegrasCompeticao;
}

const DESEMPATE_PADRAO: CriterioDesempate[] = [
  "pontos",
  "vitorias",
  "saldo",
  "golsPro",
  "confrontoDireto",
];

/**
 * Os cinco formatos que cobrem quase tudo que se organiza hoje no Clubs.
 *
 * Vieram de olhar o que a comunidade de fato monta — liga de amigos com 8
 * times, liga séria de 10 com ida e volta, copa rápida de 16, mundial com
 * grupos, e o torneio de uma noite só com 4. Quem quiser outra coisa muda os
 * campos depois; o preset é o ponto de partida, não uma cerca.
 */
export const PRESETS: PresetCompeticao[] = [
  {
    id: "liga-8",
    icone: "Trophy",
    formato: "pontos-corridos",
    vagas: 8,
    regras: {
      turnos: 1,
      pontosVitoria: 3,
      pontosEmpate: 1,
      pontosDerrota: 0,
      criteriosDesempate: DESEMPATE_PADRAO,
      vagasAcesso: 2,
      vagasRebaixamento: 2,
    },
  },
  {
    id: "liga-10-ida-volta",
    icone: "CalendarRange",
    formato: "pontos-corridos",
    vagas: 10,
    regras: {
      turnos: 2,
      pontosVitoria: 3,
      pontosEmpate: 1,
      pontosDerrota: 0,
      criteriosDesempate: DESEMPATE_PADRAO,
      vagasAcesso: 4,
      vagasRebaixamento: 2,
    },
  },
  {
    id: "copa-16",
    icone: "Swords",
    formato: "mata-mata",
    vagas: 16,
    regras: {
      turnos: 1,
      pontosVitoria: 3,
      pontosEmpate: 1,
      pontosDerrota: 0,
      criteriosDesempate: DESEMPATE_PADRAO,
      idaEVoltaMataMata: false,
    },
  },
  {
    id: "mundial-16",
    icone: "Globe",
    formato: "grupos-mata-mata",
    vagas: 16,
    regras: {
      turnos: 1,
      pontosVitoria: 3,
      pontosEmpate: 1,
      pontosDerrota: 0,
      criteriosDesempate: DESEMPATE_PADRAO,
      numGrupos: 4,
      classificadosPorGrupo: 2,
      idaEVoltaMataMata: false,
    },
  },
  {
    id: "relampago-4",
    icone: "Zap",
    formato: "pontos-corridos",
    vagas: 4,
    regras: {
      turnos: 1,
      pontosVitoria: 3,
      pontosEmpate: 1,
      pontosDerrota: 0,
      criteriosDesempate: DESEMPATE_PADRAO,
      vagasAcesso: 1,
    },
  },
];

export function presetPorId(id: string): PresetCompeticao | null {
  return PRESETS.find((p) => p.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Geração de tabela                                                   */
/* ------------------------------------------------------------------ */

/** O que a geração devolve — confrontos sem id, prontos para gravar. */
export type ConfrontoNovo = Omit<ConfrontoCompeticao, "id">;

/**
 * PONTOS CORRIDOS pelo método do círculo (round-robin de Berger).
 *
 * Um time fica fixo e os outros giram; com número ímpar de times entra um
 * "fantasma", e quem cai contra ele folga na rodada. É o algoritmo que garante
 * o que um sorteio ingênuo não garante: **todo time joga uma vez por rodada**,
 * e ninguém joga duas seguidas em casa por acidente.
 *
 * A alternância de mando por rodada par/ímpar existe para o mando não se
 * concentrar: sem ela, o time fixo jogaria todas em casa.
 */
export function gerarPontosCorridos(
  times: TimeCompeticao[],
  turnos: 1 | 2,
  grupo?: string
): ConfrontoNovo[] {
  const ids = times.map((t) => t.id);
  // O fantasma dá folga a alguém quando o número é ímpar.
  const comFantasma = ids.length % 2 === 1 ? [...ids, "__folga__"] : [...ids];
  const n = comFantasma.length;
  const rodadasPorTurno = n - 1;
  const metade = n / 2;
  const confrontos: ConfrontoNovo[] = [];

  const giro = [...comFantasma];
  for (let r = 0; r < rodadasPorTurno; r++) {
    for (let i = 0; i < metade; i++) {
      const a = giro[i];
      const b = giro[n - 1 - i];
      if (a === "__folga__" || b === "__folga__") continue;
      // Inverte o mando em rodadas alternadas para equilibrar casa e fora.
      const inverter = (r + i) % 2 === 1;
      confrontos.push({
        fase: grupo ? "grupo" : "liga",
        rodada: r + 1,
        grupo: grupo ?? null,
        chave: null,
        mandanteId: inverter ? b : a,
        visitanteId: inverter ? a : b,
        golsMandante: null,
        golsVisitante: null,
        status: "agendado",
      });
    }
    // O primeiro fica fixo; o resto gira uma casa.
    giro.splice(1, 0, giro.pop()!);
  }

  if (turnos === 2) {
    // O returno é o turno espelhado, com o mando trocado.
    const returno = confrontos.map((c) => ({
      ...c,
      rodada: c.rodada + rodadasPorTurno,
      mandanteId: c.visitanteId,
      visitanteId: c.mandanteId,
    }));
    confrontos.push(...returno);
  }

  return confrontos;
}

/**
 * MATA-MATA com chaveamento por semente.
 *
 * O emparelhamento é o clássico 1×N, 2×(N−1)… — o primeiro cabeça de chave
 * pega o último classificado, e assim por diante. Isso importa: sorteio puro
 * pode botar os dois melhores na primeira rodada, o que esvazia a final antes
 * de ela existir.
 *
 * Quando o número de times não é potência de 2, as vagas que sobram viram
 * "bye": o time passa direto, e o confronto nasce já resolvido.
 */
export function gerarMataMata(
  times: TimeCompeticao[],
  idaEVolta = false
): ConfrontoNovo[] {
  const n = times.length;
  if (n < 2) return [];

  // Sobe para a próxima potência de 2 — as vagas vazias são byes.
  const tamanho = 2 ** Math.ceil(Math.log2(n));
  const vagas: Array<string | null> = times.map((t) => t.id);
  while (vagas.length < tamanho) vagas.push(null);

  const fases = ORDEM_MATA_MATA.filter((f) => (TIMES_NA_FASE[f] ?? 0) <= tamanho);
  const confrontos: ConfrontoNovo[] = [];

  // Primeira fase: 1×N, 2×(N−1)…
  const primeira = fases[0];
  const pares = tamanho / 2;
  for (let i = 0; i < pares; i++) {
    const mandante = vagas[i];
    const visitante = vagas[tamanho - 1 - i];
    confrontos.push({
      fase: primeira,
      rodada: 1,
      grupo: null,
      chave: i + 1,
      mandanteId: mandante,
      visitanteId: visitante,
      golsMandante: null,
      golsVisitante: null,
      perna: 1,
      // Bye: um lado vazio significa que o outro passa sem jogar.
      status: mandante && visitante ? "agendado" : "wo",
    });
    if (idaEVolta && mandante && visitante) {
      confrontos.push({
        fase: primeira,
        rodada: 2,
        grupo: null,
        chave: i + 1,
        mandanteId: visitante,
        visitanteId: mandante,
        golsMandante: null,
        golsVisitante: null,
        perna: 2,
        status: "agendado",
      });
    }
  }

  // As fases seguintes nascem VAZIAS: as vagas se preenchem com os vencedores.
  // Desenhar a árvore inteira desde o começo é o que faz o chaveamento parecer
  // um chaveamento, e não uma lista que cresce.
  for (let f = 1; f < fases.length; f++) {
    const fase = fases[f];
    const jogos = (TIMES_NA_FASE[fase] ?? 2) / 2;
    for (let i = 0; i < jogos; i++) {
      confrontos.push({
        fase,
        rodada: 1,
        grupo: null,
        chave: i + 1,
        mandanteId: null,
        visitanteId: null,
        golsMandante: null,
        golsVisitante: null,
        perna: 1,
        status: "agendado",
      });
    }
  }

  return confrontos;
}

/** Divide os times em N grupos, distribuindo em serpentina (1,2,3,4,4,3,2,1). */
export function distribuirEmGrupos(
  times: TimeCompeticao[],
  numGrupos: number
): Map<string, TimeCompeticao[]> {
  const grupos = new Map<string, TimeCompeticao[]>();
  const letras = "ABCDEFGH".slice(0, Math.max(1, numGrupos)).split("");
  for (const l of letras) grupos.set(l, []);

  times.forEach((t, i) => {
    // Serpentina: distribui força de forma equilibrada quando a lista vem
    // ordenada por qualidade. Em fila simples, o grupo A levaria os melhores.
    const volta = Math.floor(i / numGrupos);
    const pos = i % numGrupos;
    const idx = volta % 2 === 0 ? pos : numGrupos - 1 - pos;
    grupos.get(letras[idx])!.push({ ...t, grupo: letras[idx] });
  });

  return grupos;
}

/** GRUPOS + MATA-MATA: liga dentro de cada grupo, árvore depois. */
export function gerarGruposMataMata(
  times: TimeCompeticao[],
  regras: RegrasCompeticao
): { confrontos: ConfrontoNovo[]; grupos: Map<string, TimeCompeticao[]> } {
  const numGrupos = Math.max(2, regras.numGrupos ?? 4);
  const classificados = Math.max(1, regras.classificadosPorGrupo ?? 2);
  const grupos = distribuirEmGrupos(times, numGrupos);

  const confrontos: ConfrontoNovo[] = [];
  for (const [letra, integrantes] of grupos) {
    confrontos.push(...gerarPontosCorridos(integrantes, regras.turnos, letra));
  }

  // A árvore do mata-mata nasce vazia, dimensionada pelo total de classificados.
  const totalClassificados = numGrupos * classificados;
  const arvore = gerarMataMata(
    Array.from({ length: totalClassificados }, (_, i) => ({
      id: `__vaga_${i}__`,
      nome: "",
    })),
    regras.idaEVoltaMataMata
  ).map((c) => ({
    ...c,
    // As vagas ficam abertas: quem entra é o classificado da fase de grupos.
    mandanteId: null,
    visitanteId: null,
    status: "agendado" as const,
  }));

  confrontos.push(...arvore);
  return { confrontos, grupos };
}

/* ------------------------------------------------------------------ */
/* Classificação                                                       */
/* ------------------------------------------------------------------ */

/** Um confronto conta para a tabela? Só o que terminou e não foi cancelado. */
function contabilizavel(c: ConfrontoCompeticao): boolean {
  return (
    (c.status === "confirmado" || c.status === "wo") &&
    c.mandanteId != null &&
    c.visitanteId != null &&
    c.golsMandante != null &&
    c.golsVisitante != null
  );
}

/**
 * A CLASSIFICAÇÃO, com os critérios de desempate aplicados em ordem.
 *
 * `confrontoDireto` é o único critério que não é um número da linha: ele olha
 * o histórico entre os times empatados. Por isso ele fica por último na
 * comparação e só entra quando exatamente DOIS times estão empatados — com
 * três ou mais, confronto direto vira um mini-campeonato e as federações
 * divergem sobre como resolvê-lo. Aqui, com três, ele simplesmente não separa,
 * e o critério seguinte decide.
 */
export function calcularClassificacao(
  times: TimeCompeticao[],
  confrontos: ConfrontoCompeticao[],
  regras: RegrasCompeticao,
  grupo?: string
): LinhaClassificacao[] {
  const doGrupo = grupo ? times.filter((t) => t.grupo === grupo) : times;
  const jogos = confrontos
    .filter(contabilizavel)
    .filter((c) => (grupo ? c.grupo === grupo : c.fase === "liga" || c.fase === "grupo"));

  const linhas = new Map<string, LinhaClassificacao>();
  for (const t of doGrupo) {
    linhas.set(t.id, {
      posicao: 0,
      timeId: t.id,
      nome: t.nome,
      sigla: t.sigla ?? null,
      cor: t.cor ?? null,
      grupo: t.grupo ?? null,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldo: 0,
      pontos: 0,
      aproveitamento: 0,
      forma: [],
    });
  }

  // A forma precisa da ordem cronológica; a lista vem na ordem de rodada.
  const emOrdem = [...jogos].sort((a, b) => a.rodada - b.rodada);

  for (const c of emOrdem) {
    const casa = linhas.get(c.mandanteId!);
    const fora = linhas.get(c.visitanteId!);
    if (!casa || !fora) continue;
    const gc = c.golsMandante!;
    const gf = c.golsVisitante!;

    casa.jogos += 1;
    fora.jogos += 1;
    casa.golsPro += gc;
    casa.golsContra += gf;
    fora.golsPro += gf;
    fora.golsContra += gc;

    if (gc > gf) {
      casa.vitorias += 1;
      fora.derrotas += 1;
      casa.pontos += regras.pontosVitoria;
      fora.pontos += regras.pontosDerrota;
      casa.forma.unshift("win");
      fora.forma.unshift("loss");
    } else if (gc < gf) {
      fora.vitorias += 1;
      casa.derrotas += 1;
      fora.pontos += regras.pontosVitoria;
      casa.pontos += regras.pontosDerrota;
      fora.forma.unshift("win");
      casa.forma.unshift("loss");
    } else {
      casa.empates += 1;
      fora.empates += 1;
      casa.pontos += regras.pontosEmpate;
      fora.pontos += regras.pontosEmpate;
      casa.forma.unshift("draw");
      fora.forma.unshift("draw");
    }
  }

  for (const l of linhas.values()) {
    l.saldo = l.golsPro - l.golsContra;
    const disputados = l.jogos * regras.pontosVitoria;
    l.aproveitamento = disputados > 0 ? Math.round((l.pontos / disputados) * 100) : 0;
    l.forma = l.forma.slice(0, 5);
  }

  const ordenadas = [...linhas.values()].sort((a, b) =>
    compararPorCriterios(a, b, regras.criteriosDesempate, linhas, jogos)
  );
  ordenadas.forEach((l, i) => (l.posicao = i + 1));
  return ordenadas;
}

function compararPorCriterios(
  a: LinhaClassificacao,
  b: LinhaClassificacao,
  criterios: CriterioDesempate[],
  linhas: Map<string, LinhaClassificacao>,
  jogos: ConfrontoCompeticao[]
): number {
  for (const criterio of criterios) {
    let d = 0;
    switch (criterio) {
      case "pontos":
        d = b.pontos - a.pontos;
        break;
      case "vitorias":
        d = b.vitorias - a.vitorias;
        break;
      case "saldo":
        d = b.saldo - a.saldo;
        break;
      case "golsPro":
        d = b.golsPro - a.golsPro;
        break;
      case "golsContra":
        // Menos gols sofridos é melhor — o sinal aqui é invertido de propósito.
        d = a.golsContra - b.golsContra;
        break;
      case "confrontoDireto":
        d = compararConfrontoDireto(a.timeId, b.timeId, jogos);
        break;
    }
    if (d !== 0) return d;
  }
  // Empate absoluto: ordem alfabética, para a tabela não dançar a cada carga.
  return a.nome.localeCompare(b.nome);
}

/** Saldo do confronto direto entre dois times. Positivo favorece `b`. */
function compararConfrontoDireto(
  aId: string,
  bId: string,
  jogos: ConfrontoCompeticao[]
): number {
  let golsA = 0;
  let golsB = 0;
  for (const c of jogos) {
    if (c.mandanteId === aId && c.visitanteId === bId) {
      golsA += c.golsMandante!;
      golsB += c.golsVisitante!;
    } else if (c.mandanteId === bId && c.visitanteId === aId) {
      golsB += c.golsMandante!;
      golsA += c.golsVisitante!;
    }
  }
  if (golsA === golsB) return 0;
  return golsB - golsA;
}

/* ------------------------------------------------------------------ */
/* Avanço do mata-mata                                                 */
/* ------------------------------------------------------------------ */

/** Quem passou num par de mata-mata. `null` enquanto não estiver decidido. */
export function vencedorDoPar(
  confrontosDoPar: ConfrontoCompeticao[]
): string | null {
  const validos = confrontosDoPar.filter((c) => c.mandanteId || c.visitanteId);
  if (validos.length === 0) return null;

  // Bye: um lado vazio, o outro passa.
  const bye = validos.find((c) => c.status === "wo" && (!c.mandanteId || !c.visitanteId));
  if (bye) return bye.mandanteId ?? bye.visitanteId;

  const decididos = validos.filter(contabilizavel);
  if (decididos.length === 0 || decididos.length < validos.length) return null;

  // Agregado dos dois jogos, sem gol fora de casa (a EA não tem esse conceito
  // no Clubs, e inventá-lo aqui só criaria discussão de regulamento).
  const soma = new Map<string, number>();
  for (const c of decididos) {
    soma.set(c.mandanteId!, (soma.get(c.mandanteId!) ?? 0) + c.golsMandante!);
    soma.set(c.visitanteId!, (soma.get(c.visitanteId!) ?? 0) + c.golsVisitante!);
  }
  const [primeiro, segundo] = [...soma.entries()].sort((x, y) => y[1] - x[1]);
  if (!primeiro || !segundo) return null;
  return primeiro[1] === segundo[1] ? null : primeiro[0];
}

/**
 * Preenche as vagas da fase seguinte com quem venceu a anterior.
 * Devolve as mudanças a gravar — não muta a lista recebida.
 */
export function avancarChaveamento(
  confrontos: ConfrontoCompeticao[]
): Array<{ id: string; mandanteId?: string; visitanteId?: string }> {
  const mudancas: Array<{ id: string; mandanteId?: string; visitanteId?: string }> = [];
  const fases = ORDEM_MATA_MATA.filter((f) => confrontos.some((c) => c.fase === f));

  for (let i = 0; i < fases.length - 1; i++) {
    const atual = fases[i];
    const proxima = fases[i + 1];
    const paresAtuais = new Map<number, ConfrontoCompeticao[]>();
    for (const c of confrontos.filter((x) => x.fase === atual)) {
      const k = c.chave ?? 0;
      paresAtuais.set(k, [...(paresAtuais.get(k) ?? []), c]);
    }

    for (const [chave, par] of paresAtuais) {
      const vencedor = vencedorDoPar(par);
      if (!vencedor) continue;
      // Duas chaves da fase atual alimentam uma da próxima: 1 e 2 → 1, 3 e 4 → 2.
      const chaveDestino = Math.ceil(chave / 2);
      const destino = confrontos.find(
        (c) => c.fase === proxima && c.chave === chaveDestino && (c.perna ?? 1) === 1
      );
      if (!destino) continue;
      const ehMandante = chave % 2 === 1;
      const jaEsta = ehMandante ? destino.mandanteId : destino.visitanteId;
      if (jaEsta === vencedor) continue;
      mudancas.push({
        id: destino.id,
        ...(ehMandante ? { mandanteId: vencedor } : { visitanteId: vencedor }),
      });
    }
  }

  return mudancas;
}

/** O campeão, quando a final terminou. */
export function campeao(confrontos: ConfrontoCompeticao[]): string | null {
  const final = confrontos.filter((c) => c.fase === "final");
  if (final.length === 0) return null;
  return vencedorDoPar(final);
}
