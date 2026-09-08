/**
 * O CARDÁPIO DE MERCADOS — 08/09/2026.
 *
 * ⚠️ "Mercado" aqui é mercado de APOSTA. O mercado de transferências da seção
 * é outro assunto e mora em `GameVaga` / `mercado-servidor.ts`.
 *
 * Este arquivo faz duas coisas, e é de propósito que faça as duas:
 *
 *   1. **Monta e cota** os mercados de um confronto.
 *   2. **Liquida** os mesmos mercados quando o resultado sai.
 *
 * Elas moram juntas porque são a mesma regra lida em dois sentidos. Quando a
 * criação está num arquivo e a liquidação em outro, um mercado novo entra em
 * cartaz sem liquidação e só se descobre no dia em que alguém ganha e não
 * recebe. Aqui, um `tipo` novo não compila enquanto o `switch` da liquidação
 * não souber liquidá-lo — o compilador é o portão.
 *
 * ## De onde vem cada probabilidade
 *
 * - **Mercados de time** (resultado, gols, handicap, placar): da MATRIZ DE
 *   PLACARES de `simulacao.ts`, por soma de células. Exato, instantâneo, e —
 *   o que mais importa — impossível de se contradizer, porque todos os
 *   mercados leem a MESMA tabela. Foi a decisão que evitou o defeito clássico
 *   da casa amadora: "mais de 3,5" e "placar exato" discordando do mesmo jogo.
 *
 * - **Mercados de jogador**: parte analítica, parte Monte Carlo.
 *   "Marca a qualquer momento" tem forma fechada (ver `probMarcaJogador`) e
 *   sai exata. "Craque da partida" não tem — depende da nota de todo mundo —
 *   então é estimada rodando o simulador de verdade N vezes. Estimar com o
 *   PRÓPRIO simulador, e não com um modelo paralelo, é o que garante que o
 *   preço e o resultado venham do mesmo mundo.
 *
 * ## As linhas do Clubs não são as do futebol
 *
 * Medido no espelho (138 partidas inteiras): o Clubs faz 5,01 gols por
 * partida. "Mais de 2,5", a linha mais popular do futebol real, bate 87% aqui
 * — não é aposta, é imposto. Por isso `escolherLinhasDeGol` posiciona as
 * linhas em volta do total ESPERADO do confronto, e não numa lista fixa.
 */

import {
  matrizPlacares,
  simularPartida,
  taxasDoConfronto,
  MAX_GOLS,
  type ForcaTime,
  type JogadorSimulado,
  type PartidaSimulada,
} from "./simulacao";
import { cotarMercado, type FamiliaMercado, type ResultadoSelecao, type SelecaoCotada } from "./odds";

export type TipoMercado =
  | "1x2"
  | "dupla-chance"
  | "total-gols"
  | "ambos-marcam"
  | "handicap-asiatico"
  | "placar-exato"
  | "total-par-impar"
  | "total-do-time"
  | "margem-vitoria"
  | "jogador-marca"
  | "jogador-marca-2"
  | "jogador-craque";

export interface MercadoMontado {
  /** Chave estável do mercado: `tipo` + parâmetro. É o que o cupom guarda. */
  chave: string;
  tipo: TipoMercado;
  familia: FamiliaMercado;
  titulo: string;
  /** A linha (3,5), o time (id) ou a gamertag a que o mercado se refere. */
  parametro?: string;
  selecoes: SelecaoCotada[];
}

/** Tudo que o cardápio precisa saber do confronto. */
export interface ContextoConfronto {
  mandante: ForcaTime;
  visitante: ForcaTime;
  elencoMandante: JogadorSimulado[];
  elencoVisitante: JogadorSimulado[];
  /** Semente base do Monte Carlo. Mesma semente, mesmo cardápio. */
  semente: number;
  /** Quantas simulações para os mercados sem forma fechada. */
  amostrasMonteCarlo?: number;
  /** Quantos jogadores de cada lado ganham mercado próprio. */
  jogadoresPorTime?: number;
}

/** O resultado, como a liquidação precisa dele. */
export interface ResultadoConfronto {
  golsMandante: number;
  golsVisitante: number;
  jogadores: Array<{
    gamertag: string;
    timeId: string;
    gols: number;
    craque: boolean;
  }>;
}

/* ================================================================== */
/* Somas sobre a matriz                                               */
/* ================================================================== */

/** Soma as células em que `condicao(i, j)` vale. É o motor de tudo abaixo. */
function somar(
  matriz: number[][],
  condicao: (golsMandante: number, golsVisitante: number) => boolean
): number {
  let s = 0;
  for (let i = 0; i <= MAX_GOLS; i++) {
    for (let j = 0; j <= MAX_GOLS; j++) if (condicao(i, j)) s += matriz[i][j];
  }
  return s;
}

/* ================================================================== */
/* Montagem                                                           */
/* ================================================================== */

/**
 * Escolhe as linhas de gol do confronto.
 *
 * Centradas no total esperado, e sempre em meio-gol (`x,5`) para que não haja
 * empate na linha — linha inteira produz devolução, que é correta mas irrita
 * quem não esperava. Três linhas: a de baixo, a do meio e a de cima, para o
 * apostador escolher o risco em vez de aceitar o nosso.
 */
export function escolherLinhasDeGol(totalEsperado: number): number[] {
  const centro = Math.round(totalEsperado) + 0.5;
  return [centro - 1, centro, centro + 1].filter((l) => l >= 1.5);
}

/**
 * P(o jogador marca ao menos um) — forma fechada.
 *
 * O modelo: dado que o time fez n gols, cada gol é do jogador i com
 * probabilidade w (a fatia dele no elenco), de forma independente. Então
 * P(não marca | n) = (1 − w)ⁿ, e basta somar sobre a distribuição de n:
 *
 *     P(marca) = 1 − Σₙ P(time faz n) · (1 − w)ⁿ
 *
 * É exato dentro do modelo e custa um laço de 13 termos — não precisa de
 * Monte Carlo, e por não precisar não herda o ruído dele.
 */
export function probMarcaJogador(distribuicaoGols: number[], fatia: number): number {
  let naoMarca = 0;
  for (let n = 0; n < distribuicaoGols.length; n++) {
    naoMarca += distribuicaoGols[n] * Math.pow(1 - fatia, n);
  }
  return 1 - naoMarca;
}

/** P(marca 2 ou mais): tira do total os casos de 0 e de exatamente 1. */
export function probMarcaDoisJogador(distribuicaoGols: number[], fatia: number): number {
  let ate1 = 0;
  for (let n = 0; n < distribuicaoGols.length; n++) {
    const p0 = Math.pow(1 - fatia, n);
    const p1 = n === 0 ? 0 : n * fatia * Math.pow(1 - fatia, n - 1);
    ate1 += distribuicaoGols[n] * (p0 + p1);
  }
  return Math.max(0, 1 - ate1);
}

/**
 * A fatia de cada jogador nos gols do time — os mesmos pesos que o simulador
 * usa para repartir gol. Precisam ser os mesmos, senão o preço de "jogador
 * marca" descreveria um elenco diferente do que vai a campo.
 */
const PESO_GOL_POR_POSICAO: Record<string, number> = {
  forward: 1.0,
  midfielder: 0.45,
  defender: 0.12,
  goalkeeper: 0.02,
};

export function fatiasDeGol(elenco: JogadorSimulado[]): Map<string, number> {
  const pesos = elenco.map(
    (j) =>
      (PESO_GOL_POR_POSICAO[j.posicao] ?? 0.2) *
      (1 + Math.min(2, (j.golsPorJogo ?? 0) * 1.5))
  );
  const total = pesos.reduce((s, p) => s + p, 0) || 1;
  const m = new Map<string, number>();
  elenco.forEach((j, i) => m.set(j.gamertag, pesos[i] / total));
  return m;
}

/**
 * Monta o cardápio inteiro de um confronto.
 *
 * Devolve mercados já COTADOS: a margem entra aqui, uma vez, por família.
 * Ninguém depois desta função tem permissão de mexer em odd — a rota grava o
 * que veio e a tela mostra o que foi gravado.
 */
export function montarMercados(ctx: ContextoConfronto): MercadoMontado[] {
  const { mandante, visitante } = ctx;
  const { lambdaMandante, lambdaVisitante } = taxasDoConfronto(mandante, visitante);
  const matriz = matrizPlacares(lambdaMandante, lambdaVisitante);
  const mercados: MercadoMontado[] = [];

  /* ---- 1X2 -------------------------------------------------------- */
  mercados.push({
    chave: "1x2",
    tipo: "1x2",
    familia: "resultado",
    titulo: "Resultado final",
    selecoes: cotarMercado(
      [
        { chave: "1", rotulo: mandante.nome, probabilidade: somar(matriz, (i, j) => i > j) },
        { chave: "X", rotulo: "Empate", probabilidade: somar(matriz, (i, j) => i === j) },
        { chave: "2", rotulo: visitante.nome, probabilidade: somar(matriz, (i, j) => i < j) },
      ],
      "resultado"
    ),
  });

  /* ---- Dupla chance ----------------------------------------------- */
  mercados.push({
    chave: "dupla-chance",
    tipo: "dupla-chance",
    familia: "resultado",
    titulo: "Dupla chance",
    selecoes: cotarMercado(
      [
        { chave: "1X", rotulo: `${mandante.nome} ou empate`, probabilidade: somar(matriz, (i, j) => i >= j) },
        { chave: "12", rotulo: "Sem empate", probabilidade: somar(matriz, (i, j) => i !== j) },
        { chave: "X2", rotulo: `Empate ou ${visitante.nome}`, probabilidade: somar(matriz, (i, j) => i <= j) },
      ],
      "resultado"
    ),
  });

  /* ---- Total de gols ---------------------------------------------- */
  for (const linha of escolherLinhasDeGol(lambdaMandante + lambdaVisitante)) {
    mercados.push({
      chave: `total-gols:${linha}`,
      tipo: "total-gols",
      familia: "gols",
      titulo: `Total de gols ${linha.toFixed(1).replace(".", ",")}`,
      parametro: String(linha),
      selecoes: cotarMercado(
        [
          { chave: "mais", rotulo: `Mais de ${linha.toFixed(1).replace(".", ",")}`, probabilidade: somar(matriz, (i, j) => i + j > linha) },
          { chave: "menos", rotulo: `Menos de ${linha.toFixed(1).replace(".", ",")}`, probabilidade: somar(matriz, (i, j) => i + j < linha) },
        ],
        "gols"
      ),
    });
  }

  /* ---- Ambos marcam ----------------------------------------------- */
  mercados.push({
    chave: "ambos-marcam",
    tipo: "ambos-marcam",
    familia: "gols",
    titulo: "Ambos marcam",
    selecoes: cotarMercado(
      [
        { chave: "sim", rotulo: "Sim", probabilidade: somar(matriz, (i, j) => i > 0 && j > 0) },
        { chave: "nao", rotulo: "Não", probabilidade: somar(matriz, (i, j) => i === 0 || j === 0) },
      ],
      "gols"
    ),
  });

  /* ---- Par / ímpar ------------------------------------------------ */
  mercados.push({
    chave: "total-par-impar",
    tipo: "total-par-impar",
    familia: "gols",
    titulo: "Total de gols par ou ímpar",
    selecoes: cotarMercado(
      [
        { chave: "par", rotulo: "Par", probabilidade: somar(matriz, (i, j) => (i + j) % 2 === 0) },
        { chave: "impar", rotulo: "Ímpar", probabilidade: somar(matriz, (i, j) => (i + j) % 2 === 1) },
      ],
      "gols"
    ),
  });

  /* ---- Handicap asiático ------------------------------------------ */
  // A linha é escolhida na diferença esperada, arredondada ao quarto de gol
  // mais próximo — que é o passo em que o handicap asiático anda.
  const diferenca = lambdaMandante - lambdaVisitante;
  const linhaHandicap = Math.round(diferenca * 4) / 4;
  {
    const probs = probabilidadesHandicap(matriz, linhaHandicap);
    mercados.push({
      chave: `handicap-asiatico:${linhaHandicap}`,
      tipo: "handicap-asiatico",
      familia: "handicap",
      titulo: `Handicap asiático ${formatarLinha(linhaHandicap)}`,
      parametro: String(linhaHandicap),
      selecoes: cotarMercado(
        [
          { chave: "1", rotulo: `${mandante.nome} ${formatarLinha(linhaHandicap)}`, probabilidade: probs.mandante },
          { chave: "2", rotulo: `${visitante.nome} ${formatarLinha(-linhaHandicap)}`, probabilidade: probs.visitante },
        ],
        "handicap"
      ),
    });
  }

  /* ---- Total de cada time ----------------------------------------- */
  for (const [lado, time, lambda] of [
    ["mandante", mandante, lambdaMandante],
    ["visitante", visitante, lambdaVisitante],
  ] as const) {
    const linha = Math.round(lambda) + 0.5;
    const acimaLinha =
      lado === "mandante"
        ? somar(matriz, (i) => i > linha)
        : somar(matriz, (_i, j) => j > linha);
    mercados.push({
      chave: `total-do-time:${lado}:${linha}`,
      tipo: "total-do-time",
      familia: "gols",
      titulo: `Gols do ${time.nome}`,
      parametro: `${lado}:${linha}`,
      selecoes: cotarMercado(
        [
          { chave: "mais", rotulo: `Mais de ${formatarMeio(linha)}`, probabilidade: acimaLinha },
          { chave: "menos", rotulo: `Menos de ${formatarMeio(linha)}`, probabilidade: 1 - acimaLinha },
        ],
        "gols"
      ),
    });
  }

  /* ---- Margem de vitória ------------------------------------------ */
  mercados.push({
    chave: "margem-vitoria",
    tipo: "margem-vitoria",
    familia: "gols",
    titulo: "Margem de vitória",
    selecoes: cotarMercado(
      [
        { chave: "1-por-1", rotulo: `${mandante.nome} por 1`, probabilidade: somar(matriz, (i, j) => i - j === 1) },
        { chave: "1-por-2mais", rotulo: `${mandante.nome} por 2+`, probabilidade: somar(matriz, (i, j) => i - j >= 2) },
        { chave: "X", rotulo: "Empate", probabilidade: somar(matriz, (i, j) => i === j) },
        { chave: "2-por-1", rotulo: `${visitante.nome} por 1`, probabilidade: somar(matriz, (i, j) => j - i === 1) },
        { chave: "2-por-2mais", rotulo: `${visitante.nome} por 2+`, probabilidade: somar(matriz, (i, j) => j - i >= 2) },
      ],
      "gols"
    ),
  });

  /* ---- Placar exato ----------------------------------------------- */
  {
    const candidatos: Array<{ chave: string; rotulo: string; probabilidade: number }> = [];
    for (let i = 0; i <= 7; i++) {
      for (let j = 0; j <= 7; j++) {
        candidatos.push({ chave: `${i}-${j}`, rotulo: `${i} × ${j}`, probabilidade: matriz[i][j] });
      }
    }
    candidatos.sort((a, b) => b.probabilidade - a.probabilidade);
    const doze = candidatos.slice(0, 12);
    // "Qualquer outro" fecha o mercado em 100%. Sem ele, a margem calculada
    // sobre 12 placares seria mentira: sobra probabilidade fora da tabela.
    const restante = 1 - doze.reduce((s, c) => s + c.probabilidade, 0);
    mercados.push({
      chave: "placar-exato",
      tipo: "placar-exato",
      familia: "placar",
      titulo: "Placar exato",
      selecoes: cotarMercado(
        [...doze, { chave: "outro", rotulo: "Qualquer outro", probabilidade: Math.max(0.0001, restante) }],
        "placar"
      ),
    });
  }

  /* ---- Mercados de jogador ---------------------------------------- */
  mercados.push(...mercadosDeJogador(ctx, matriz));

  return mercados;
}

function formatarLinha(l: number): string {
  const s = l.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
  return l > 0 ? `+${s}` : s === "0" ? "0" : s;
}

function formatarMeio(l: number): string {
  return l.toFixed(1).replace(".", ",");
}

/**
 * As duas probabilidades de um handicap asiático, já contando as linhas
 * quebradas. Uma linha de −0,25 é metade da aposta em 0 e metade em −0,5;
 * a probabilidade cotada é a MÉDIA das duas metades.
 */
export function probabilidadesHandicap(
  matriz: number[][],
  linha: number
): { mandante: number; visitante: number } {
  const partes = decomporLinha(linha);
  let m = 0;
  let v = 0;
  for (const parte of partes) {
    // Numa perna sem quebra, a probabilidade "vale" é condicionada a não
    // devolver: devolução não é vitória de ninguém e sai da conta dos dois.
    const vitoriaM = somar(matriz, (i, j) => i - j + parte > 0);
    const vitoriaV = somar(matriz, (i, j) => i - j + parte < 0);
    const total = vitoriaM + vitoriaV || 1;
    m += vitoriaM / total / partes.length;
    v += vitoriaV / total / partes.length;
  }
  return { mandante: m, visitante: v };
}

/** −0,25 → [0, −0,5]. −0,5 → [−0,5]. É a decomposição da linha quebrada. */
function decomporLinha(linha: number): number[] {
  const quarto = Math.abs(linha * 4) % 4;
  if (quarto === 1 || quarto === 3) {
    return [linha - 0.25, linha + 0.25];
  }
  return [linha];
}

/**
 * Mercados de jogador. Os dois artilheiros naturais de cada lado ganham
 * "marca" e "marca 2+"; o craque da partida é um mercado só, com os melhores
 * candidatos dos dois times.
 *
 * O limite de jogadores não é preguiça: cada gamertag em cartaz é um mercado
 * a liquidar, e uma tela com 40 mercados de jogador é uma tela que ninguém lê.
 */
function mercadosDeJogador(
  ctx: ContextoConfronto,
  matriz: number[][]
): MercadoMontado[] {
  const quantos = ctx.jogadoresPorTime ?? 3;
  const out: MercadoMontado[] = [];

  /**
   * ⛔ SEM ELENCO CONHECIDO, SEM MERCADO DE JOGADOR.
   *
   * O simulador tem um elenco de emergência (11 nomes gerados) para nunca
   * quebrar quando a EA devolve clube sem `members`. Ele serve para a partida
   * acontecer — e NÃO serve para virar cartaz.
   *
   * Isto não é zelo teórico: sem esta guarda, a primeira rodada de verdade
   * publicou um mercado "Craque da partida" cotando
   * `6aa0481d626a1afd42fbc3c1:M-9` a 8,80. Ou seja, a casa estava aceitando
   * ficha por um jogador que não existe, com um nome que é um id interno
   * nosso. Aposta em jogador só existe quando há jogador.
   *
   * A guarda é nos DOIS lados: um confronto com metade do elenco conhecido
   * ainda distorceria o mercado de craque, porque os inventados do outro lado
   * disputariam a mesma probabilidade.
   */
  if (ctx.elencoMandante.length === 0 || ctx.elencoVisitante.length === 0) {
    return out;
  }

  // Distribuição de gols de cada time, à margem da matriz.
  const distMandante: number[] = [];
  const distVisitante: number[] = [];
  for (let k = 0; k <= MAX_GOLS; k++) {
    distMandante.push(somar(matriz, (i) => i === k));
    distVisitante.push(somar(matriz, (_i, j) => j === k));
  }

  for (const [elenco, dist, timeId] of [
    [ctx.elencoMandante, distMandante, ctx.mandante.id],
    [ctx.elencoVisitante, distVisitante, ctx.visitante.id],
  ] as const) {
    const fatias = fatiasDeGol(elenco);
    const escolhidos = [...elenco]
      .sort((a, b) => (fatias.get(b.gamertag) ?? 0) - (fatias.get(a.gamertag) ?? 0))
      .slice(0, quantos);

    for (const j of escolhidos) {
      const fatia = fatias.get(j.gamertag) ?? 0;
      const pMarca = probMarcaJogador(dist, fatia);
      const pDois = probMarcaDoisJogador(dist, fatia);
      out.push({
        chave: `jogador-marca:${timeId}:${j.gamertag}`,
        tipo: "jogador-marca",
        familia: "jogador",
        titulo: `${j.gamertag} marca`,
        parametro: `${timeId}:${j.gamertag}`,
        selecoes: cotarMercado(
          [
            { chave: "sim", rotulo: "Marca", probabilidade: pMarca },
            { chave: "nao", rotulo: "Não marca", probabilidade: 1 - pMarca },
          ],
          "jogador"
        ),
      });
      // Só vai a cartaz se houver chance de verdade: cotar 2+ gols de um
      // zagueiro é vender odd 300 que a casa jamais deveria ter aberto.
      if (pDois > 0.02) {
        out.push({
          chave: `jogador-marca-2:${timeId}:${j.gamertag}`,
          tipo: "jogador-marca-2",
          familia: "jogador",
          titulo: `${j.gamertag} marca 2 ou mais`,
          parametro: `${timeId}:${j.gamertag}`,
          selecoes: cotarMercado(
            [
              { chave: "sim", rotulo: "Marca 2+", probabilidade: pDois },
              { chave: "nao", rotulo: "Não marca 2+", probabilidade: 1 - pDois },
            ],
            "jogador"
          ),
        });
      }
    }
  }

  /* ---- Craque da partida: Monte Carlo ------------------------------ */
  const amostras = ctx.amostrasMonteCarlo ?? 3000;
  const contagem = new Map<string, { n: number; timeId: string; gamertag: string }>();
  for (let s = 0; s < amostras; s++) {
    const p = simularPartida({
      semente: (ctx.semente + s * 2654435761) >>> 0,
      mandante: ctx.mandante,
      visitante: ctx.visitante,
      elencoMandante: ctx.elencoMandante,
      elencoVisitante: ctx.elencoVisitante,
      // A mesma tabela que precificou, reaproveitada: sem isto, o Monte Carlo
      // remontaria a matriz 3.000 vezes para o mesmo confronto.
      matriz,
    });
    if (!p.craque) continue;
    const k = `${p.craque.timeId}:${p.craque.gamertag}`;
    const atual = contagem.get(k) ?? { n: 0, timeId: p.craque.timeId, gamertag: p.craque.gamertag };
    atual.n++;
    contagem.set(k, atual);
  }
  if (contagem.size > 1) {
    const linhas = [...contagem.values()]
      .map((c) => ({
        chave: `${c.timeId}:${c.gamertag}`,
        rotulo: c.gamertag,
        probabilidade: c.n / amostras,
      }))
      .sort((a, b) => b.probabilidade - a.probabilidade)
      .slice(0, 8);
    // O resto do elenco vira uma linha só, pelo mesmo motivo do "qualquer
    // outro" do placar: o mercado tem de somar 100% antes da margem.
    const cobertura = linhas.reduce((s, l) => s + l.probabilidade, 0);
    if (cobertura < 0.995) {
      linhas.push({ chave: "outro", rotulo: "Qualquer outro", probabilidade: 1 - cobertura });
    }
    out.push({
      chave: "jogador-craque",
      tipo: "jogador-craque",
      familia: "jogador",
      titulo: "Craque da partida",
      selecoes: cotarMercado(linhas, "jogador"),
    });
  }

  return out;
}

/* ================================================================== */
/* Liquidação                                                         */
/* ================================================================== */

/**
 * Liquida um mercado: devolve, por chave de seleção, o que aconteceu com ela.
 *
 * Cada `tipo` do union tem de aparecer aqui. Se um `tipo` novo for criado em
 * `TipoMercado` e esquecido neste `switch`, o TypeScript recusa a compilação
 * na cláusula final — é o portão de que fala o cabeçalho.
 */
export function liquidarMercado(
  mercado: Pick<MercadoMontado, "tipo" | "parametro" | "selecoes">,
  r: ResultadoConfronto
): Map<string, ResultadoSelecao> {
  const out = new Map<string, ResultadoSelecao>();
  const { golsMandante: gm, golsVisitante: gv } = r;
  const total = gm + gv;
  const marcar = (chave: string, ganhou: boolean) =>
    out.set(chave, ganhou ? "ganha" : "perdida");

  switch (mercado.tipo) {
    case "1x2":
      marcar("1", gm > gv);
      marcar("X", gm === gv);
      marcar("2", gm < gv);
      break;

    case "dupla-chance":
      marcar("1X", gm >= gv);
      marcar("12", gm !== gv);
      marcar("X2", gm <= gv);
      break;

    case "total-gols": {
      const linha = Number(mercado.parametro);
      marcar("mais", total > linha);
      marcar("menos", total < linha);
      break;
    }

    case "ambos-marcam":
      marcar("sim", gm > 0 && gv > 0);
      marcar("nao", gm === 0 || gv === 0);
      break;

    case "total-par-impar":
      marcar("par", total % 2 === 0);
      marcar("impar", total % 2 === 1);
      break;

    case "total-do-time": {
      const [lado, linhaTexto] = String(mercado.parametro).split(":");
      const linha = Number(linhaTexto);
      const gols = lado === "mandante" ? gm : gv;
      marcar("mais", gols > linha);
      marcar("menos", gols < linha);
      break;
    }

    case "margem-vitoria":
      marcar("1-por-1", gm - gv === 1);
      marcar("1-por-2mais", gm - gv >= 2);
      marcar("X", gm === gv);
      marcar("2-por-1", gv - gm === 1);
      marcar("2-por-2mais", gv - gm >= 2);
      break;

    case "placar-exato": {
      const exato = `${gm}-${gv}`;
      let algumBateu = false;
      for (const s of mercado.selecoes) {
        if (s.chave === "outro") continue;
        const bateu = s.chave === exato;
        if (bateu) algumBateu = true;
        marcar(s.chave, bateu);
      }
      marcar("outro", !algumBateu);
      break;
    }

    case "handicap-asiatico": {
      const linha = Number(mercado.parametro);
      out.set("1", liquidarHandicap(linha, gm, gv));
      out.set("2", liquidarHandicap(-linha, gv, gm));
      break;
    }

    case "jogador-marca":
    case "jogador-marca-2": {
      const [timeId, gamertag] = String(mercado.parametro).split(":");
      const j = r.jogadores.find((x) => x.gamertag === gamertag && x.timeId === timeId);
      // Jogador que não entrou não perde nem ganha: ANULA. É a regra de toda
      // casa séria, e a única justa — quem apostou no artilheiro não apostou
      // em ele ser escalado.
      if (!j) {
        out.set("sim", "anulada");
        out.set("nao", "anulada");
        break;
      }
      const alvo = mercado.tipo === "jogador-marca" ? 1 : 2;
      marcar("sim", j.gols >= alvo);
      marcar("nao", j.gols < alvo);
      break;
    }

    case "jogador-craque": {
      const craque = r.jogadores.find((x) => x.craque);
      const chaveCraque = craque ? `${craque.timeId}:${craque.gamertag}` : null;
      let algumBateu = false;
      for (const s of mercado.selecoes) {
        if (s.chave === "outro") continue;
        const bateu = s.chave === chaveCraque;
        if (bateu) algumBateu = true;
        marcar(s.chave, bateu);
      }
      if (mercado.selecoes.some((s) => s.chave === "outro")) {
        marcar("outro", !algumBateu);
      }
      break;
    }

    default: {
      // Portão de exaustividade: um `tipo` novo sem liquidação não compila.
      const naoTratado: never = mercado.tipo;
      throw new Error(`mercado sem liquidação: ${naoTratado}`);
    }
  }

  return out;
}

/**
 * Liquida UMA perna de handicap asiático.
 *
 * `linha` é o handicap do time cujos gols são `golsFavor`. A conta é a mesma
 * de sempre: soma a linha ao saldo e olha o sinal. Positivo ganha, negativo
 * perde, zero devolve. A linha quebrada divide a aposta em duas metades, e é
 * daí — e só daí — que saem `meio-ganha` e `meio-perdida`.
 */
export function liquidarHandicap(
  linha: number,
  golsFavor: number,
  golsContra: number
): ResultadoSelecao {
  const partes = decomporLinha(linha);
  // O tipo é anotado como `number[]` de propósito: sem isso o TypeScript
  // estreita para `1 | 0 | -1`, e daí conclui que comparar a SOMA com 2 ou −2
  // é impossível — quando é justamente a soma das duas metades que distingue
  // a vitória inteira da meia-vitória.
  const resultados: number[] = partes.map((p) => {
    const saldo = golsFavor - golsContra + p;
    return saldo > 0 ? 1 : saldo < 0 ? -1 : 0;
  });
  const soma = resultados.reduce((s, x) => s + x, 0);

  if (resultados.length === 1) {
    return soma > 0 ? "ganha" : soma < 0 ? "perdida" : "devolvida";
  }
  // Linha quebrada: as duas metades.
  if (soma === 2) return "ganha";
  if (soma === -2) return "perdida";
  if (soma === 1) return "meio-ganha";
  if (soma === -1) return "meio-perdida";
  return "devolvida";
}

/** O resultado, do jeito que a liquidação quer, a partir de uma simulação. */
export function resultadoDaSimulacao(p: PartidaSimulada): ResultadoConfronto {
  return {
    golsMandante: p.golsMandante,
    golsVisitante: p.golsVisitante,
    jogadores: p.jogadores.map((j) => ({
      gamertag: j.gamertag,
      timeId: j.timeId,
      gols: j.gols,
      craque: j.craque,
    })),
  };
}
