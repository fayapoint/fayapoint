/**
 * PROVA DO MOTOR DE APOSTAS — distribuição, matriz, margem e liquidação.
 *
 *     node node_modules/tsx/dist/cli.mjs scripts/game/_teste/apostas.ts
 *
 * Sem banco e sem rede, como o `motor.ts` do campeonato — e pelo mesmo motivo:
 * o que decide quanto alguém recebe tem de ser provável em um segundo, na mão,
 * sem subir servidor.
 *
 * O teste que mais importa aqui é o **§5, da coerência**: ele simula 30 mil
 * partidas com o simulador de verdade e compara o que saiu com o que a matriz
 * de placares tinha PREVISTO. São dois caminhos independentes para o mesmo
 * número — se eles discordarem, ou o preço está errado ou o jogo está errado,
 * e nos dois casos alguém recebe o que não devia. É o portão que impede o
 * defeito mais caro que uma casa de apostas pode ter.
 */
import {
  nbPmf,
  matrizPlacares,
  calcularForca,
  taxasDoConfronto,
  simularPartida,
  equilibrar,
  ehWalkover,
  MAX_GOLS,
  MEDIA_GOLS_CLUBE,
  DISPERSAO,
  type ForcaTime,
  type JogadorSimulado,
} from "../../../src/lib/game/simulacao";
import {
  aplicarMargem,
  margemEmbutida,
  cotarMercado,
  liquidarCupom,
  arredondarOdd,
  MARGEM,
} from "../../../src/lib/game/odds";
import {
  montarMercados,
  liquidarMercado,
  liquidarHandicap,
  resultadoDaSimulacao,
  probMarcaJogador,
} from "../../../src/lib/game/mercados-aposta";

let falhas = 0;
function ok(nome: string, condicao: boolean, detalhe = "") {
  console.log(`${condicao ? "  OK " : "FALHA"}  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  if (!condicao) falhas++;
}
const perto = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

/* ================================================================== */
console.log("\n§1 — A distribuição de gols (Binomial Negativa)");
/* ================================================================== */
{
  const lambda = MEDIA_GOLS_CLUBE;
  let soma = 0;
  let media = 0;
  let segundo = 0;
  for (let k = 0; k <= 60; k++) {
    const p = nbPmf(k, lambda, DISPERSAO);
    soma += p;
    media += k * p;
    segundo += k * k * p;
  }
  const variancia = segundo - media * media;
  ok("a distribuição soma 1", perto(soma, 1, 1e-6), soma.toFixed(8));
  ok("a média é o λ pedido", perto(media, lambda, 1e-4), media.toFixed(4));
  ok(
    "a variância é φ·λ (é isto que o Poisson NÃO faz)",
    perto(variancia / media, DISPERSAO, 1e-3),
    `dispersão ${(variancia / media).toFixed(4)} vs ${DISPERSAO}`
  );

  // Com φ = 1 tem de degenerar em Poisson exato.
  const poisson = (k: number, l: number) =>
    (Math.exp(-l) * Math.pow(l, k)) / [1, 1, 2, 6, 24, 120, 720][k];
  ok(
    "com φ = 1 vira Poisson",
    [0, 1, 2, 3, 4, 5, 6].every((k) => perto(nbPmf(k, 2.0, 1.0), poisson(k, 2.0), 1e-9))
  );
}

/* ================================================================== */
console.log("\n§2 — A matriz de placares");
/* ================================================================== */
const forte = calcularForca({ id: "A", nome: "Alfa", gols: 300, golsSofridos: 150, jogos: 100, divisao: 2 });
const fraco = calcularForca({ id: "B", nome: "Beta", gols: 160, golsSofridos: 290, jogos: 100, divisao: 7 });
{
  const { lambdaMandante, lambdaVisitante } = taxasDoConfronto(forte, fraco);
  const m = matrizPlacares(lambdaMandante, lambdaVisitante);
  let soma = 0;
  for (let i = 0; i <= MAX_GOLS; i++) for (let j = 0; j <= MAX_GOLS; j++) soma += m[i][j];
  ok("a matriz soma 1", perto(soma, 1, 1e-9), soma.toFixed(10));

  let vitA = 0;
  let emp = 0;
  let vitB = 0;
  for (let i = 0; i <= MAX_GOLS; i++)
    for (let j = 0; j <= MAX_GOLS; j++) {
      if (i > j) vitA += m[i][j];
      else if (i === j) emp += m[i][j];
      else vitB += m[i][j];
    }
  ok("1X2 soma 1", perto(vitA + emp + vitB, 1, 1e-9));
  ok("o time forte é favorito", vitA > vitB, `${(vitA * 100).toFixed(1)}% × ${(vitB * 100).toFixed(1)}%`);
  ok(
    "o empate fica na faixa baixa do Clubs (medido 2,2%)",
    emp > 0.02 && emp < 0.12,
    `${(emp * 100).toFixed(1)}%`
  );
}

/* ================================================================== */
console.log("\n§3 — A margem");
/* ================================================================== */
{
  const p = [0.5, 0.3, 0.2];
  for (const margem of [0.02, 0.04, 0.08, 0.15]) {
    const comMargem = aplicarMargem(p, margem);
    const soma = comMargem.reduce((s, x) => s + x, 0);
    ok(
      `margem de ${(margem * 100).toFixed(0)}% sai exata`,
      perto(soma, 1 + margem, 1e-6),
      `soma ${soma.toFixed(6)}`
    );
  }

  // A propriedade que separa o método da potência do proporcional.
  const comMargem = aplicarMargem([0.7, 0.25, 0.05], 0.06);
  const sobretaxa = comMargem.map((x, i) => x / [0.7, 0.25, 0.05][i] - 1);
  ok(
    "o azarão paga MAIS margem que o favorito (viés favorito-azarão)",
    sobretaxa[2] > sobretaxa[1] && sobretaxa[1] > sobretaxa[0],
    sobretaxa.map((s) => `${(s * 100).toFixed(2)}%`).join(" < ")
  );
  ok("nenhuma probabilidade sai de 0–1", comMargem.every((x) => x > 0 && x < 1));

  // Uma cotação real de ponta a ponta.
  const cotado = cotarMercado(
    [
      { chave: "1", rotulo: "A", probabilidade: 0.55 },
      { chave: "X", rotulo: "X", probabilidade: 0.08 },
      { chave: "2", rotulo: "B", probabilidade: 0.37 },
    ],
    "resultado"
  );
  const embutida = margemEmbutida(cotado.map((c) => c.odd));
  ok(
    "a margem que chega à tela bate com a declarada",
    embutida >= MARGEM.resultado - 0.005 && embutida <= MARGEM.resultado + 0.02,
    `${(embutida * 100).toFixed(2)}% (declarada ${(MARGEM.resultado * 100).toFixed(0)}%)`
  );
  ok(
    "o arredondamento nunca sobe a odd (a casa não paga o que não cobrou)",
    [1.234, 2.567, 5.99, 12.7, 45.9].every((o) => arredondarOdd(o) <= o)
  );
}

/* ================================================================== */
console.log("\n§4 — Handicap asiático (a tabela clássica)");
/* ================================================================== */
{
  const casos: Array<[number, number, number, string]> = [
    // linha, golsFavor, golsContra, esperado
    [0, 2, 1, "ganha"],
    [0, 1, 1, "devolvida"],
    [0, 0, 1, "perdida"],
    [-1, 2, 1, "devolvida"],
    [-1, 3, 1, "ganha"],
    [-1, 1, 1, "perdida"],
    [-0.5, 1, 1, "perdida"],
    [-0.25, 1, 1, "meio-perdida"],
    [-0.25, 2, 1, "ganha"],
    [-0.75, 2, 1, "meio-ganha"],
    [-0.75, 3, 1, "ganha"],
    [-0.75, 1, 1, "perdida"],
    [0.25, 1, 1, "meio-ganha"],
    [0.25, 0, 1, "perdida"],
    [0.75, 0, 1, "meio-perdida"],
    [0.5, 1, 1, "ganha"],
  ];
  for (const [linha, a, b, esperado] of casos) {
    const r = liquidarHandicap(linha, a, b);
    ok(`linha ${linha >= 0 ? "+" : ""}${linha} com ${a}×${b} → ${esperado}`, r === esperado, r);
  }
}

/* ================================================================== */
console.log("\n§5 — COERÊNCIA: o preço descreve o jogo que vai ser jogado?");
/* ================================================================== */
{
  const elenco = (prefixo: string): JogadorSimulado[] => [
    { gamertag: `${prefixo}-GK`, posicao: "goalkeeper" },
    { gamertag: `${prefixo}-ZAG1`, posicao: "defender" },
    { gamertag: `${prefixo}-ZAG2`, posicao: "defender" },
    { gamertag: `${prefixo}-MEI1`, posicao: "midfielder", assistenciasPorJogo: 0.6 },
    { gamertag: `${prefixo}-MEI2`, posicao: "midfielder" },
    { gamertag: `${prefixo}-ATA1`, posicao: "forward", golsPorJogo: 1.1 },
    { gamertag: `${prefixo}-ATA2`, posicao: "forward", golsPorJogo: 0.4 },
  ];
  const elencoA = elenco("A");
  const elencoB = elenco("B");

  const { lambdaMandante, lambdaVisitante } = taxasDoConfronto(forte, fraco);
  const m = matrizPlacares(lambdaMandante, lambdaVisitante);
  const somar = (cond: (i: number, j: number) => boolean) => {
    let s = 0;
    for (let i = 0; i <= MAX_GOLS; i++) for (let j = 0; j <= MAX_GOLS; j++) if (cond(i, j)) s += m[i][j];
    return s;
  };

  const N = 30000;
  let v1 = 0;
  let vX = 0;
  let v2 = 0;
  let btts = 0;
  let over45 = 0;
  let golsA = 0;
  let marcouATA1 = 0;
  for (let s = 0; s < N; s++) {
    const p = simularPartida({
      semente: 1000 + s,
      mandante: forte,
      visitante: fraco,
      elencoMandante: elencoA,
      elencoVisitante: elencoB,
    });
    if (p.golsMandante > p.golsVisitante) v1++;
    else if (p.golsMandante === p.golsVisitante) vX++;
    else v2++;
    if (p.golsMandante > 0 && p.golsVisitante > 0) btts++;
    if (p.golsMandante + p.golsVisitante > 4.5) over45++;
    golsA += p.golsMandante;
    if ((p.jogadores.find((j) => j.gamertag === "A-ATA1")?.gols ?? 0) >= 1) marcouATA1++;
  }

  const tol = 0.012; // 30 mil amostras dão erro padrão < 0,3 pp; 1,2 pp é folga
  ok("vitória do mandante: simulado = previsto", perto(v1 / N, somar((i, j) => i > j), tol),
    `sim ${(v1 / N * 100).toFixed(2)}% vs matriz ${(somar((i, j) => i > j) * 100).toFixed(2)}%`);
  ok("empate: simulado = previsto", perto(vX / N, somar((i, j) => i === j), tol),
    `sim ${(vX / N * 100).toFixed(2)}% vs matriz ${(somar((i, j) => i === j) * 100).toFixed(2)}%`);
  ok("vitória do visitante: simulado = previsto", perto(v2 / N, somar((i, j) => i < j), tol),
    `sim ${(v2 / N * 100).toFixed(2)}% vs matriz ${(somar((i, j) => i < j) * 100).toFixed(2)}%`);
  ok("ambos marcam: simulado = previsto", perto(btts / N, somar((i, j) => i > 0 && j > 0), tol),
    `sim ${(btts / N * 100).toFixed(2)}% vs matriz ${(somar((i, j) => i > 0 && j > 0) * 100).toFixed(2)}%`);
  ok("mais de 4,5 gols: simulado = previsto", perto(over45 / N, somar((i, j) => i + j > 4.5), tol),
    `sim ${(over45 / N * 100).toFixed(2)}% vs matriz ${(somar((i, j) => i + j > 4.5) * 100).toFixed(2)}%`);
  // ⚠️ A média simulada NÃO é o λ, e não deve ser. O deflator do empate tira
  // massa da diagonal e a renormalização a redistribui pelo resto da tabela —
  // ou seja, a marginal da matriz tem média própria, um pouco acima do λ que
  // a alimentou. Comparar com o λ foi expectativa errada minha na primeira
  // escrita deste teste; o número certo para conferir é a média DA MATRIZ,
  // que é a distribuição de onde o placar realmente sai.
  const mediaMatriz = (() => {
    let s = 0;
    for (let i = 0; i <= MAX_GOLS; i++) for (let j = 0; j <= MAX_GOLS; j++) s += i * m[i][j];
    return s;
  })();
  ok("gols do mandante: média simulada = média da matriz", perto(golsA / N, mediaMatriz, 0.06),
    `sim ${(golsA / N).toFixed(3)} vs matriz ${mediaMatriz.toFixed(3)} (λ era ${lambdaMandante.toFixed(3)})`);

  // O mesmo confronto para o mercado de jogador: a forma fechada tem de bater
  // com o que o simulador faz na prática.
  const distA: number[] = [];
  for (let k = 0; k <= MAX_GOLS; k++) distA.push(somar((i) => i === k));
  const fatias = new Map<string, number>();
  {
    const pesosPos: Record<string, number> = { forward: 1.0, midfielder: 0.45, defender: 0.12, goalkeeper: 0.02 };
    const pesos = elencoA.map((j) => (pesosPos[j.posicao] ?? 0.2) * (1 + Math.min(2, (j.golsPorJogo ?? 0) * 1.5)));
    const t = pesos.reduce((s, p) => s + p, 0);
    elencoA.forEach((j, i) => fatias.set(j.gamertag, pesos[i] / t));
  }
  const previsto = probMarcaJogador(distA, fatias.get("A-ATA1")!);
  ok("'jogador marca': forma fechada = simulação", perto(marcouATA1 / N, previsto, tol),
    `sim ${(marcouATA1 / N * 100).toFixed(2)}% vs fórmula ${(previsto * 100).toFixed(2)}%`);
}

/* ================================================================== */
console.log("\n§6 — Cardápio montado e liquidado de ponta a ponta");
/* ================================================================== */
{
  const elencoA: JogadorSimulado[] = [
    { gamertag: "A-GK", posicao: "goalkeeper" },
    { gamertag: "A-ZAG", posicao: "defender" },
    { gamertag: "A-MEI", posicao: "midfielder" },
    { gamertag: "A-ATA", posicao: "forward", golsPorJogo: 1.2 },
  ];
  const elencoB: JogadorSimulado[] = [
    { gamertag: "B-GK", posicao: "goalkeeper" },
    { gamertag: "B-ZAG", posicao: "defender" },
    { gamertag: "B-MEI", posicao: "midfielder" },
    { gamertag: "B-ATA", posicao: "forward", golsPorJogo: 0.8 },
  ];
  const mercados = montarMercados({
    mandante: forte,
    visitante: fraco,
    elencoMandante: elencoA,
    elencoVisitante: elencoB,
    semente: 42,
    amostrasMonteCarlo: 1500,
  });
  console.log(`  (${mercados.length} mercados montados)`);
  ok("montou mercado de todo tipo esperado", new Set(mercados.map((m) => m.tipo)).size >= 9,
    [...new Set(mercados.map((m) => m.tipo))].join(", "));
  ok("nenhuma odd abaixo do mínimo", mercados.every((m) => m.selecoes.every((s) => s.odd >= 1.01)));
  ok(
    "toda margem fica na faixa da família",
    mercados.every((m) => {
      const e = margemEmbutida(m.selecoes.map((s) => s.odd));
      return e >= MARGEM[m.familia] - 0.01 && e <= MARGEM[m.familia] + 0.05;
    })
  );
  ok(
    "as probabilidades de cada mercado somam 1",
    mercados.every((m) => perto(m.selecoes.reduce((s, x) => s + x.probabilidade, 0), 1, 0.002))
  );

  // Liquidar com um resultado inventado: toda seleção de todo mercado tem de
  // receber um veredito, e exatamente um.
  const partida = simularPartida({
    semente: 777,
    mandante: forte,
    visitante: fraco,
    elencoMandante: elencoA,
    elencoVisitante: elencoB,
  });
  const resultado = resultadoDaSimulacao(partida);
  console.log(`  (placar simulado: ${resultado.golsMandante} × ${resultado.golsVisitante})`);
  let semVeredito = 0;
  let mercadosSemVencedor = 0;
  for (const m of mercados) {
    const veredito = liquidarMercado(m, resultado);
    for (const s of m.selecoes) if (!veredito.has(s.chave)) semVeredito++;
    const excludentes = ["1x2", "placar-exato", "jogador-craque", "margem-vitoria"];
    if (excludentes.includes(m.tipo)) {
      const ganhas = m.selecoes.filter((s) => veredito.get(s.chave) === "ganha").length;
      if (ganhas !== 1) mercadosSemVencedor++;
    }
  }
  ok("toda seleção recebeu veredito", semVeredito === 0, `${semVeredito} sem`);
  ok("mercado excludente tem exatamente 1 vencedor", mercadosSemVencedor === 0, `${mercadosSemVencedor} errados`);

  /* ---- O mercado de goleiro ---------------------------------------
     O diferencial da casa: a EA publica `saves` por partida e nenhum
     tracker mostra. Como o preco sai de Monte Carlo e o resultado do
     mesmo simulador, os dois TEM de bater — e e isso que se prova aqui. */
  {
    const gk = mercados.find((m) => m.tipo === "goleiro-defesas");
    ok("montou mercado de goleiro", Boolean(gk), gk?.titulo ?? "nenhum");
    if (gk) {
      const linha = Number(String(gk.parametro).split(":")[2]);
      const gamertag = String(gk.parametro).split(":")[1];
      const timeId = String(gk.parametro).split(":")[0];
      const pMais = gk.selecoes.find((s) => s.chave === "mais")!.probabilidade;
      ok(
        "a linha do goleiro fica em faixa apostavel (20% a 80%)",
        pMais >= 0.19 && pMais <= 0.81,
        
      );

      // A prova de coerencia: o preco medido bate com o simulador?
      const N = 8000;
      let acima = 0;
      let com = 0;
      for (let s = 0; s < N; s++) {
        const p = simularPartida({
          semente: 500000 + s,
          mandante: forte,
          visitante: fraco,
          elencoMandante: elencoA,
          elencoVisitante: elencoB,
        });
        const l = p.jogadores.find((x) => x.gamertag === gamertag && x.timeId === timeId);
        if (!l) continue;
        com++;
        if (l.defesas > linha) acima++;
      }
      ok(
        "defesas do goleiro: simulado = cotado",
        com > 0 && Math.abs(acima / com - pMais) <= 0.03,
        
      );

      // E a liquidacao tem de seguir o mesmo numero.
      const partidaGk = simularPartida({
        semente: 4242,
        mandante: forte,
        visitante: fraco,
        elencoMandante: elencoA,
        elencoVisitante: elencoB,
      });
      const rGk = resultadoDaSimulacao(partidaGk);
      const defesasReais = rGk.jogadores.find(
        (x) => x.gamertag === gamertag && x.timeId === timeId
      )?.defesas;
      const veredito = liquidarMercado(gk, rGk);
      ok(
        "a liquidacao do goleiro segue as defesas da sumula",
        typeof defesasReais === "number" &&
          veredito.get("mais") === (defesasReais > linha ? "ganha" : "perdida"),
        
      );
    }
  }

  // A guarda que faltava na primeira rodada de verdade: sem elenco conhecido,
  // o cardápio publicou "Craque da partida" cotando os nomes do elenco de
  // emergência — jogadores que não existem, com id interno no rótulo.
  const semElenco = montarMercados({
    mandante: forte,
    visitante: fraco,
    elencoMandante: [],
    elencoVisitante: elencoB,
    semente: 42,
    amostrasMonteCarlo: 300,
  });
  ok(
    "clube sem elenco NÃO gera mercado de jogador",
    semElenco.every((m) => m.familia !== "jogador"),
    semElenco.filter((m) => m.familia === "jogador").map((m) => m.titulo).join(", ") || "nenhum"
  );
  ok(
    "e os mercados de time continuam existindo",
    semElenco.some((m) => m.tipo === "1x2") && semElenco.length >= 8,
    `${semElenco.length} mercados`
  );
}

/* ================================================================== */
console.log("\n§7 — O cupom");
/* ================================================================== */
{
  const r1 = liquidarCupom([{ odd: 2.5, resultado: "ganha" }], 100);
  ok("simples ganha paga aposta × odd", r1.retorno === 250, String(r1.retorno));

  const r2 = liquidarCupom([{ odd: 2.5, resultado: "perdida" }], 100);
  ok("simples perdida paga 0", r2.retorno === 0);

  const r3 = liquidarCupom(
    [
      { odd: 2.0, resultado: "ganha" },
      { odd: 1.5, resultado: "ganha" },
      { odd: 3.0, resultado: "ganha" },
    ],
    10
  );
  ok("múltipla multiplica as odds", r3.retorno === 90, `${r3.retorno} (2×1,5×3 = 9)`);

  const r4 = liquidarCupom(
    [
      { odd: 2.0, resultado: "ganha" },
      { odd: 5.0, resultado: "anulada" },
      { odd: 1.5, resultado: "ganha" },
    ],
    10
  );
  ok("perna anulada vira odd 1,00 e a múltipla sobrevive", r4.retorno === 30, `${r4.retorno} (2×1×1,5 = 3)`);

  const r5 = liquidarCupom([{ odd: 3.0, resultado: "meio-ganha" }], 100);
  ok("meia-ganha = metade na odd + metade devolvida", r5.retorno === 200, `${r5.retorno} (100×(3/2+0,5))`);

  const r6 = liquidarCupom([{ odd: 3.0, resultado: "meio-perdida" }], 100);
  ok("meia-perdida devolve metade", r6.retorno === 50, String(r6.retorno));

  const r7 = liquidarCupom([{ odd: 2.33, resultado: "ganha" }], 7);
  ok("ficha é inteira: arredonda para baixo", r7.retorno === 16, `${r7.retorno} (7×2,33 = 16,31)`);
}

/* ================================================================== */
console.log("\n§8 — Higiene do dado da EA (o 3–0 que não é placar)");
/* ================================================================== */
{
  const cheia = {
    clubs: [
      { goals: 3, players: [{ secondsPlayed: 5532 }] },
      { goals: 0, players: [{ secondsPlayed: 5532 }] },
    ],
  };
  const curta = {
    clubs: [
      { goals: 3, players: [{ secondsPlayed: 126 }] },
      { goals: 0, players: [{ secondsPlayed: 126 }] },
    ],
  };
  const semElenco = { clubs: [{ goals: 3, winnerByDnf: true }, { goals: 0 }] };
  ok("3–0 de partida inteira é futebol", !ehWalkover(cheia));
  ok("3–0 de 2 minutos é W.O.", ehWalkover(curta));
  ok("3–0 sem elenco e com marca de abandono é W.O.", ehWalkover(semElenco));
  ok(
    "goleada legítima não vira W.O.",
    !ehWalkover({ clubs: [{ goals: 7, players: [{ secondsPlayed: 5540 }] }, { goals: 1, players: [{ secondsPlayed: 5540 }] }] })
  );
}

/* ================================================================== */
console.log("\n§9 — O equilíbrio (partida parelha, preço honesto)");
/* ================================================================== */
{
  const [a1, b1] = equilibrar(forte, fraco, 0);
  const [a2, b2] = equilibrar(forte, fraco, 1);
  ok("equilíbrio 0 não mexe em nada", a1.ataque === forte.ataque && b1.defesa === fraco.defesa);
  ok("equilíbrio 1 iguala as forças", perto(a2.ataque, b2.ataque, 1e-9) && perto(a2.defesa, b2.defesa, 1e-9));

  const prob = (a: ForcaTime, b: ForcaTime) => {
    const t = taxasDoConfronto(a, b);
    const m = matrizPlacares(t.lambdaMandante, t.lambdaVisitante);
    let v = 0;
    for (let i = 0; i <= MAX_GOLS; i++) for (let j = 0; j <= MAX_GOLS; j++) if (i > j) v += m[i][j];
    return v;
  };
  const semEquilibrio = prob(forte, fraco);
  const [c, d] = equilibrar(forte, fraco, 0.6);
  const comEquilibrio = prob(c, d);
  ok(
    "equilibrar aproxima o jogo de 50/50",
    Math.abs(comEquilibrio - 0.5) < Math.abs(semEquilibrio - 0.5),
    `${(semEquilibrio * 100).toFixed(1)}% → ${(comEquilibrio * 100).toFixed(1)}%`
  );
}

/* ================================================================== */
console.log(
  falhas === 0
    ? "\n✅ motor de apostas aprovado — preço e jogo dizem a mesma coisa\n"
    : `\n⛔ ${falhas} FALHA(S) — nada vai a mercado assim\n`
);
process.exit(falhas === 0 ? 0 : 1);
