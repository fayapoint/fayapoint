import dbConnect from "@/lib/mongodb";
import GameEaPartida from "@/models/GameEaPartida";
import GameCopa from "@/models/GameCopa";
import { pareceJogoDeCopa } from "./copa";

/**
 * O DESCOBRIDOR DE CAMPEONATOS — 08/09/2026.
 *
 * ## A ideia
 *
 * A Super Copa foi achada de um jeito que não escala: alguém leu uma notícia,
 * pesquisou cinco sites, e só então foi procurar os clubes na EA. Para achar o
 * PRÓXIMO campeonato desse porte, esperar a notícia sair é depender de sorte.
 *
 * Só que campeonato organizado **deixa rastro na própria base**, e o rastro é
 * inconfundível. Um grupo de clubes que:
 *
 *   1. joga **amistoso** (partida marcada não passa pelo emparelhamento da EA),
 *   2. **11 contra 11** (pelada de Clubs anda com 2 a 6),
 *   3. **entre si**, repetidamente, e
 *   4. **em série** — vários jogos entre os mesmos dois clubes na mesma noite
 *
 * …não é coincidência. É um torneio. E a gente consegue ver isso sem que
 * ninguém tenha publicado nada em lugar nenhum.
 *
 * ## Por que isso é melhor do que raspar site
 *
 * Site de campeonato republica o que a organização informa — é declaração.
 * O rastro na EA é observação. Descobrindo pelo rastro, a gente chega ao
 * campeonato **com a prova já na mão**, e não precisa confiar em ninguém para
 * saber que ele existe.
 *
 * E chega ANTES: o rastro aparece na primeira rodada jogada, não quando o
 * campeonato vira notícia.
 *
 * ## O que ele NÃO faz
 *
 * Ele não sabe o NOME do campeonato, nem quem organiza, nem o formato. Ele
 * entrega "estes 14 clubes formam um torneio" — e um humano (ou uma busca na
 * web) põe nome nisso. Confundir as duas coisas seria inventar autoridade: um
 * aglomerado achado assim entra como **candidato**, nunca como copa publicada.
 */

/** Mínimo de clubes num aglomerado para ele valer investigação. */
export const MINIMO_CLUBES = 6;
/** Mínimo de confrontos (pares distintos) para não ser um grupo de amigos. */
export const MINIMO_CONFRONTOS = 8;
/**
 * Mínimo de séries — dois ou mais jogos entre os mesmos clubes na mesma noite.
 *
 * É o sinal mais forte de todos, e o mais barato: amigos jogam uma vez;
 * campeonato joga MD3, MD5. Sem exigir série, qualquer grupo de clubes que se
 * conhece viraria "campeonato".
 */
export const MINIMO_SERIES = 4;

/**
 * Séries por clube — o critério que separa torneio de clube-polo.
 *
 * ## O falso positivo que obrigou a criar isto
 *
 * A primeira execução achou dois aglomerados. O primeiro era a Super Copa: 30
 * clubes, 19 séries. O segundo tinha **56 clubes e 55 confrontos** — números
 * maiores — e foi pontuado com força 79, quase empatando com a copa de
 * verdade.
 *
 * Só que ele tinha **8 séries**. E era puxado por um clube só, o `Gimme 20p
 * FC`, com 57 partidas: o clube nº 1 do ranking global, que joga amistoso com
 * meio mundo. A união-busca fez o que devia — todos aqueles clubes estão mesmo
 * conectados — mas por um HUB, não por um torneio.
 *
 * A grandeza que distingue os dois não é tamanho, é **densidade**:
 *
 *     Super Copa   19 séries / 30 clubes = 0,63
 *     clube-polo    8 séries / 56 clubes = 0,14
 *
 * Num torneio, todo mundo joga série contra todo mundo do grupo. Num hub, um
 * joga com todos e os outros não se conhecem. Contar séries no total premia o
 * hub por ser grande; contar por clube o desmascara.
 */
export const MINIMO_SERIES_POR_CLUBE = 0.3;

export interface Aglomerado {
  /** Clubes do aglomerado, do mais ativo para o menos. */
  clubes: Array<{ clubId: string; nome: string; jogos: number }>;
  confrontos: number;
  series: number;
  /** Séries por clube. Abaixo de 0,3 quase nunca é torneio — ver a constante. */
  densidade: number;
  partidas: number;
  primeiraEm: Date;
  ultimaEm: Date;
  /** Já é uma copa que a gente cobre? */
  jaConhecido: boolean;
  copaConhecida?: string;
  /**
   * Quão forte é o sinal, 0 a 100. É ordenação, não verdade — serve para o
   * humano olhar os candidatos bons primeiro.
   */
  forca: number;
}

/**
 * Varre o espelho e devolve os aglomerados que parecem torneio.
 *
 * O algoritmo é união-busca (union-find) sobre os confrontos: cada partida que
 * passa no filtro une os dois clubes no mesmo conjunto. No fim, cada conjunto
 * com tamanho suficiente é um candidato.
 *
 * Escolhido por ser à prova de ordem: o resultado é o mesmo qualquer que seja
 * a sequência em que as partidas cheguem — o que importa quando a fonte é um
 * espelho alimentado de hora em hora, fora de ordem.
 */
export async function descobrirAglomerados(params?: {
  desde?: Date;
  limitePartidas?: number;
}): Promise<Aglomerado[]> {
  await dbConnect();

  const desde = params?.desde ?? new Date(Date.now() - 45 * 86_400_000);
  const docs = await GameEaPartida.find({ jogadaEm: { $gte: desde } })
    .sort({ timestamp: -1 })
    .limit(params?.limitePartidas ?? 8000)
    .lean();

  /* --- 1. só o que tem cara de jogo de torneio --- */
  interface Bruta {
    matchId: string;
    timestamp: number;
    a: { id: string; nome: string };
    b: { id: string; nome: string };
  }
  const candidatas: Bruta[] = [];
  for (const d of docs) {
    const m = d.dados as {
      matchId?: string;
      matchType?: string;
      clubs?: Array<{ clubId?: string | number; name?: string; players?: unknown[] }>;
    };
    if (!pareceJogoDeCopa(m as never)) continue;
    const [a, b] = m.clubs ?? [];
    if (!a?.clubId || !b?.clubId) continue;
    candidatas.push({
      matchId: String(m.matchId ?? d.matchId),
      timestamp: d.timestamp,
      a: { id: String(a.clubId), nome: String(a.name ?? "") },
      b: { id: String(b.clubId), nome: String(b.name ?? "") },
    });
  }

  /* --- 2. união-busca --- */
  const pai = new Map<string, string>();
  const achar = (x: string): string => {
    if (!pai.has(x)) pai.set(x, x);
    let r = pai.get(x)!;
    while (r !== pai.get(r)) r = pai.get(r)!;
    pai.set(x, r);
    return r;
  };
  const unir = (x: string, y: string) => {
    const rx = achar(x);
    const ry = achar(y);
    if (rx !== ry) pai.set(rx, ry);
  };
  for (const p of candidatas) unir(p.a.id, p.b.id);

  /* --- 3. montar cada conjunto --- */
  interface Acc {
    clubes: Map<string, { nome: string; jogos: number }>;
    pares: Set<string>;
    partidas: Bruta[];
  }
  const grupos = new Map<string, Acc>();
  for (const p of candidatas) {
    const raiz = achar(p.a.id);
    if (!grupos.has(raiz)) {
      grupos.set(raiz, { clubes: new Map(), pares: new Set(), partidas: [] });
    }
    const g = grupos.get(raiz)!;
    for (const lado of [p.a, p.b]) {
      const atual = g.clubes.get(lado.id);
      if (atual) atual.jogos++;
      else g.clubes.set(lado.id, { nome: lado.nome, jogos: 1 });
    }
    g.pares.add([p.a.id, p.b.id].sort().join("|"));
    g.partidas.push(p);
  }

  /* --- 4. quais copas já cobrimos, para não sugerir o que já existe --- */
  const copas = await GameCopa.find({}).select("slug nome times.eaClubId").lean();
  const clubeDaCopa = new Map<string, string>();
  for (const c of copas) {
    for (const t of c.times ?? []) {
      if (t.eaClubId) clubeDaCopa.set(t.eaClubId, c.nome);
    }
  }

  /* --- 5. filtrar e pontuar --- */
  const saida: Aglomerado[] = [];
  for (const g of grupos.values()) {
    if (g.clubes.size < MINIMO_CLUBES) continue;
    if (g.pares.size < MINIMO_CONFRONTOS) continue;

    const series = contarSeries(g.partidas);
    if (series < MINIMO_SERIES) continue;
    // A densidade, e nao o tamanho, separa torneio de clube-polo. Ver a
    // constante para o falso positivo que obrigou este filtro a existir.
    const densidade = series / g.clubes.size;
    if (densidade < MINIMO_SERIES_POR_CLUBE) continue;

    const tempos = g.partidas.map((p) => p.timestamp * 1000);
    const conhecidos = [...g.clubes.keys()].map((id) => clubeDaCopa.get(id)).filter(Boolean);

    saida.push({
      clubes: [...g.clubes.entries()]
        .map(([clubId, v]) => ({ clubId, nome: v.nome, jogos: v.jogos }))
        .sort((a, b) => b.jogos - a.jogos),
      confrontos: g.pares.size,
      series,
      partidas: g.partidas.length,
      primeiraEm: new Date(Math.min(...tempos)),
      ultimaEm: new Date(Math.max(...tempos)),
      jaConhecido: conhecidos.length > 0,
      copaConhecida: conhecidos[0] ?? undefined,
      densidade: Math.round(densidade * 100) / 100,
      forca: forcaDoSinal(g.clubes.size, g.pares.size, series, g.partidas.length, densidade),
    });
  }

  return saida.sort((a, b) => b.forca - a.forca);
}

/**
 * Conta séries: dois ou mais jogos entre o mesmo par dentro de 6 horas.
 *
 * A mesma janela de `copa.ts`, e pelo mesmo motivo — medimos três jogos em
 * quarenta minutos numa série MD5 real. Manter o número em dois lugares seria
 * pedir para eles divergirem; a janela vive lá e é reusada aqui.
 */
function contarSeries(
  partidas: Array<{ timestamp: number; a: { id: string }; b: { id: string } }>
): number {
  const porPar = new Map<string, number[]>();
  for (const p of partidas) {
    const k = [p.a.id, p.b.id].sort().join("|");
    if (!porPar.has(k)) porPar.set(k, []);
    porPar.get(k)!.push(p.timestamp);
  }
  let series = 0;
  for (const tempos of porPar.values()) {
    tempos.sort((a, b) => a - b);
    let naSerie = 1;
    for (let i = 1; i < tempos.length; i++) {
      if ((tempos[i] - tempos[i - 1]) * 1000 <= 6 * 60 * 60 * 1000) {
        naSerie++;
      } else {
        if (naSerie >= 2) series++;
        naSerie = 1;
      }
    }
    if (naSerie >= 2) series++;
  }
  return series;
}

/**
 * Pontua o sinal, 0 a 100.
 *
 * A série pesa mais que tudo — é o que distingue torneio de grupo de amigos.
 * A conta é logarítmica de propósito: dobrar de 4 para 8 séries é um salto
 * enorme de evidência; de 40 para 80, quase nada.
 */
function forcaDoSinal(
  clubes: number,
  confrontos: number,
  series: number,
  partidas: number,
  densidade: number
): number {
  const p = (x: number, teto: number) => Math.min(1, Math.log2(1 + x) / Math.log2(1 + teto));
  // A DENSIDADE domina a nota, e o tamanho quase não pesa. É a lição do falso
  // positivo: contar clube premiava justamente o caso errado.
  const bruta =
    0.5 * Math.min(1, densidade / 0.7) +
    0.25 * p(series, 40) +
    0.15 * p(confrontos, 60) +
    0.1 * p(partidas, 200);
  return Math.round(100 * bruta);
}

/**
 * Um nome de trabalho para o aglomerado, tirado do que os clubes têm em comum.
 *
 * ⚠️ É PALPITE, e a tela tem de dizer isso. Serve para o humano reconhecer o
 * candidato numa lista, não para virar o nome do campeonato. Quando os nomes
 * não têm nada em comum, devolve os dois clubes mais ativos — que é honesto:
 * "o torneio do Fulano e do Beltrano" descreve sem afirmar.
 */
export function apelidoDoAglomerado(a: Aglomerado): string {
  const palavras = new Map<string, number>();
  for (const c of a.clubes) {
    for (const w of c.nome.split(/[\s_-]+/)) {
      const limpo = w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
      if (limpo.length < 4) continue;
      if (["clube", "team", "united"].includes(limpo)) continue;
      palavras.set(limpo, (palavras.get(limpo) ?? 0) + 1);
    }
  }
  const comum = [...palavras.entries()].filter(([, n]) => n >= 3).sort((x, y) => y[1] - x[1])[0];
  if (comum) return `torneio "${comum[0]}" (${a.clubes.length} clubes)`;
  return `${a.clubes[0]?.nome} + ${a.clubes[1]?.nome} e mais ${a.clubes.length - 2}`;
}

/* ------------------------------------------------------------------ */
/* Guardar o achado                                                    */
/* ------------------------------------------------------------------ */

/**
 * A identidade de um aglomerado, estável entre rodadas.
 *
 * ## O problema que ela resolve
 *
 * Um torneio ganha e perde participante o tempo todo: um clube some da janela
 * de 10 amistosos da EA, outro entra numa rodada nova. Se a chave fosse a
 * lista inteira de clubes, **todo dia nasceria um candidato diferente** para o
 * mesmo torneio — e a fila de "novos" viraria um despejo em que ninguém
 * decide nada.
 *
 * Então a chave usa só o **NÚCLEO**: os clubes mais ativos do aglomerado,
 * ordenados por id. Quem joga muito continua ali de uma semana para a outra;
 * quem aparece uma vez não muda a identidade do grupo.
 *
 * O tamanho do núcleo é 6 porque é o mínimo de clubes que um aglomerado
 * precisa ter para ser considerado (`MINIMO_CLUBES`). Usar menos deixaria dois
 * torneios distintos colidirem; usar mais quebraria a chave assim que um
 * habitual faltasse.
 */
export function chaveDoAglomerado(a: Pick<Aglomerado, "clubes">): string {
  const nucleo = [...a.clubes]
    .sort((x, y) => y.jogos - x.jogos)
    .slice(0, MINIMO_CLUBES)
    .map((c) => c.clubId)
    .sort();
  return nucleo.join("-");
}

export interface ResumoDaGravacao {
  novos: number;
  atualizados: number;
  /** Os candidatos novos, para o log e para quem for avisar alguém. */
  candidatos: Array<{ chave: string; apelido: string; forca: number; clubes: number }>;
}

/**
 * Grava os aglomerados achados, sem duplicar e sem ressuscitar descartado.
 *
 * ## As duas regras que valem registro
 *
 * 1. **Aglomerado já coberto não entra.** Se algum clube dele já pertence a uma
 *    copa que a gente cobre, ele não é candidato — é a copa que já temos, vista
 *    de novo.
 *
 * 2. **`descartado` NUNCA volta para `novo`.** Se um humano olhou e disse "não
 *    é torneio", a rodada seguinte não pode desfazer isso — senão o descobridor
 *    reapresenta o mesmo grupo de amigos para sempre, e a fila perde o sentido.
 *    A evidência continua sendo atualizada (força, séries, clubes), porque ela
 *    pode mudar de figura e justificar alguém reabrir à mão; o que não muda
 *    sozinho é a DECISÃO.
 */
export async function guardarAglomerados(
  aglomerados: Aglomerado[],
  plataforma = "common-gen5"
): Promise<ResumoDaGravacao> {
  await dbConnect();
  const { default: GameDescoberta } = await import("@/models/GameDescoberta");

  const resumo: ResumoDaGravacao = { novos: 0, atualizados: 0, candidatos: [] };

  for (const a of aglomerados) {
    // Já cobrimos: não é candidato, é o que já temos.
    if (a.jaConhecido) continue;

    const chave = chaveDoAglomerado(a);
    const apelido = apelidoDoAglomerado(a);

    const existente = await GameDescoberta.findOne({ chave, plataforma });

    // A evidência é sempre atualizada; a decisão humana, nunca.
    const evidencia = {
      apelido,
      clubes: a.clubes,
      confrontos: a.confrontos,
      series: a.series,
      densidade: a.densidade,
      partidas: a.partidas,
      forca: a.forca,
      primeiraEm: a.primeiraEm,
      ultimaEm: a.ultimaEm,
    };

    if (existente) {
      Object.assign(existente, evidencia);
      existente.vezesVisto += 1;
      await existente.save();
      resumo.atualizados++;
      continue;
    }

    await GameDescoberta.create({ chave, plataforma, estado: "novo", vezesVisto: 1, ...evidencia });
    resumo.novos++;
    resumo.candidatos.push({ chave, apelido, forca: a.forca, clubes: a.clubes.length });
  }

  return resumo;
}
