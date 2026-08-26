/**
 * PROVA DO MOTOR DE CAMPEONATO — tabela, desempate e avanço do chaveamento.
 *
 *     node node_modules/tsx/dist/cli.mjs scripts/game/_teste/motor.ts
 *
 * Sem banco e sem rede: o motor (`src/lib/game/campeonato.ts`) é função pura,
 * e é justamente por isso que ele pode ser provado assim. Roda em 1 segundo.
 *
 * Vale mais do que parece. Na primeira execução, duas asserções falharam — e
 * as DUAS eram expectativa errada minha, não defeito do motor:
 *
 *  - achei que agregado 1×2 / 1×1 empatava (é 2 a 3 para o visitante);
 *  - achei que a serpentina separava a semente 1 da 8, quando ela as JUNTA de
 *    propósito, para a soma das sementes ficar igual em todo grupo (1+8 = 2+7).
 *
 * Sem este arquivo, as duas ideias erradas continuariam na minha cabeça até
 * alguém reclamar de uma tabela torta no meio de um campeonato de verdade.
 *
 * Rode isto antes de mexer em qualquer regra de desempate ou de chaveamento.
 */
import {
  gerarPontosCorridos,
  gerarMataMata,
  gerarGruposMataMata,
  calcularClassificacao,
  avancarChaveamento,
  campeao,
  vencedorDoPar,
  type ConfrontoCompeticao,
  type RegrasCompeticao,
  type TimeCompeticao,
} from "../../../src/lib/game/campeonato";

let falhas = 0;
function ok(nome: string, condicao: boolean, detalhe = "") {
  console.log(`${condicao ? "  OK " : "FALHA"}  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  if (!condicao) falhas++;
}

const times = (n: number): TimeCompeticao[] =>
  Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, nome: `Time ${i + 1}` }));

const regras: RegrasCompeticao = {
  turnos: 1,
  pontosVitoria: 3,
  pontosEmpate: 1,
  pontosDerrota: 0,
  criteriosDesempate: ["pontos", "vitorias", "saldo", "golsPro", "confrontoDireto"],
};

console.log("\n== PONTOS CORRIDOS ==");
for (const n of [4, 5, 6, 8, 10]) {
  const ts = times(n);
  const c = gerarPontosCorridos(ts, 1);
  const rodadas = Math.max(...c.map((x) => x.rodada));
  const esperadoJogos = (n * (n - 1)) / 2;
  ok(`${n} times: ${esperadoJogos} jogos`, c.length === esperadoJogos, `saiu ${c.length}`);
  ok(`${n} times: ${n % 2 === 0 ? n - 1 : n} rodadas`, rodadas === (n % 2 === 0 ? n - 1 : n), `saiu ${rodadas}`);

  // Ninguém joga duas vezes na mesma rodada.
  let duplicado = false;
  for (let r = 1; r <= rodadas; r++) {
    const daRodada = c.filter((x) => x.rodada === r);
    const usados = daRodada.flatMap((x) => [x.mandanteId, x.visitanteId]);
    if (new Set(usados).size !== usados.length) duplicado = true;
  }
  ok(`${n} times: ninguém joga 2x na mesma rodada`, !duplicado);

  // Todo par se enfrenta exatamente uma vez.
  const pares = new Set(c.map((x) => [x.mandanteId, x.visitanteId].sort().join("|")));
  ok(`${n} times: todo par uma vez`, pares.size === esperadoJogos, `pares ${pares.size}`);
}

const ida = gerarPontosCorridos(times(6), 2);
ok("ida e volta: dobra os jogos", ida.length === 30, `saiu ${ida.length}`);
ok("ida e volta: 10 rodadas", Math.max(...ida.map((c) => c.rodada)) === 10);

console.log("\n== CLASSIFICAÇÃO E DESEMPATE ==");
{
  const ts = times(3);
  // A e B empatam em pontos; A ganhou o confronto direto.
  const confrontos: ConfrontoCompeticao[] = [
    { id: "1", fase: "liga", rodada: 1, mandanteId: "t1", visitanteId: "t2", golsMandante: 2, golsVisitante: 1, status: "confirmado", grupo: null, chave: null },
    { id: "2", fase: "liga", rodada: 2, mandanteId: "t1", visitanteId: "t3", golsMandante: 0, golsVisitante: 3, status: "confirmado", grupo: null, chave: null },
    { id: "3", fase: "liga", rodada: 3, mandanteId: "t2", visitanteId: "t3", golsMandante: 4, golsVisitante: 0, status: "confirmado", grupo: null, chave: null },
  ];
  const tab = calcularClassificacao(ts, confrontos, regras);
  // t2: 3 pts, saldo +2 | t1: 3 pts, saldo -2 | t3: 3 pts, saldo 0
  ok("saldo decide antes do confronto direto", tab[0].timeId === "t2", `1º foi ${tab[0].timeId}`);
  ok("pontos somados certo", tab.every((l) => l.pontos === 3));
  ok("jogos somados certo", tab.every((l) => l.jogos === 2));
  ok("posições sequenciais", tab.map((l) => l.posicao).join(",") === "1,2,3");
}
{
  // Empate total em pontos, vitórias e saldo: o confronto direto decide.
  const ts = times(2);
  const confrontos: ConfrontoCompeticao[] = [
    { id: "1", fase: "liga", rodada: 1, mandanteId: "t1", visitanteId: "t2", golsMandante: 3, golsVisitante: 0, status: "confirmado", grupo: null, chave: null },
    { id: "2", fase: "liga", rodada: 2, mandanteId: "t2", visitanteId: "t1", golsMandante: 3, golsVisitante: 0, status: "confirmado", grupo: null, chave: null },
  ];
  const tab = calcularClassificacao(ts, confrontos, regras);
  ok("empate absoluto cai na ordem alfabética", tab[0].nome === "Time 1", `1º ${tab[0].nome}`);
}

console.log("\n== MATA-MATA ==");
{
  const c = gerarMataMata(times(8));
  ok("8 times: 4 oitavas... na verdade quartas", c.filter((x) => x.fase === "quartas").length === 4);
  ok("8 times: 2 semis", c.filter((x) => x.fase === "semi").length === 2);
  ok("8 times: 1 final", c.filter((x) => x.fase === "final").length === 1);
  ok("1º pega o 8º", c[0].mandanteId === "t1" && c[0].visitanteId === "t8");
  ok("fases seguintes nascem vazias", c.filter((x) => x.fase === "semi").every((x) => !x.mandanteId));
}
{
  // 6 times: sobe para 8, dois byes.
  const c = gerarMataMata(times(6));
  const byes = c.filter((x) => x.fase === "quartas" && x.status === "wo");
  ok("6 times: 2 byes", byes.length === 2, `saiu ${byes.length}`);
}
{
  // Avanço: decide as quartas e confere quem sobe para a semi.
  const gerados = gerarMataMata(times(4)).map((c, i) => ({ ...c, id: `c${i}` })) as ConfrontoCompeticao[];
  const semis = gerados.filter((c) => c.fase === "semi");
  semis[0].golsMandante = 2;
  semis[0].golsVisitante = 1;
  semis[0].status = "confirmado";
  semis[1].golsMandante = 0;
  semis[1].golsVisitante = 3;
  semis[1].status = "confirmado";
  const mud = avancarChaveamento(gerados);
  ok("avanço preenche a final", mud.length === 2, `mudanças ${mud.length}`);
  const finalId = gerados.find((c) => c.fase === "final")!.id;
  ok("as duas mudanças vão para a final", mud.every((m) => m.id === finalId));
  const vencedores = mud.map((m) => m.mandanteId ?? m.visitanteId).sort();
  ok("vencedores certos (t1 e t3)", vencedores.join(",") === "t1,t3", vencedores.join(","));

  // Agora decide a final.
  const fin = gerados.find((c) => c.fase === "final")!;
  fin.mandanteId = "t1";
  fin.visitanteId = "t3";
  fin.golsMandante = 1;
  fin.golsVisitante = 0;
  fin.status = "confirmado";
  ok("campeão é t1", campeao(gerados) === "t1", String(campeao(gerados)));
}
{
  // Ida e volta: o agregado decide, e empate no agregado não decide nada.
  const par: ConfrontoCompeticao[] = [
    { id: "a", fase: "semi", rodada: 1, chave: 1, perna: 1, mandanteId: "t1", visitanteId: "t2", golsMandante: 1, golsVisitante: 2, status: "confirmado", grupo: null },
    { id: "b", fase: "semi", rodada: 2, chave: 1, perna: 2, mandanteId: "t2", visitanteId: "t1", golsMandante: 0, golsVisitante: 2, status: "confirmado", grupo: null },
  ];
  ok("agregado 3x2 para t1", vencedorDoPar(par) === "t1", String(vencedorDoPar(par)));
  // Empate REAL no agregado: ida t1 1×2 t2, volta t2 0×1 t1 → 2 a 2.
  par[1].golsMandante = 0;
  par[1].golsVisitante = 1;
  ok("agregado empatado não decide", vencedorDoPar(par) === null, String(vencedorDoPar(par)));
}

console.log("\n== GRUPOS + MATA-MATA ==");
{
  const { confrontos, grupos } = gerarGruposMataMata(times(16), {
    ...regras,
    numGrupos: 4,
    classificadosPorGrupo: 2,
  });
  ok("4 grupos", grupos.size === 4);
  ok("4 times por grupo", [...grupos.values()].every((g) => g.length === 4));
  const daFase = confrontos.filter((c) => c.fase === "grupo");
  ok("24 jogos de grupo (6 por grupo)", daFase.length === 24, `saiu ${daFase.length}`);
  const arvore = confrontos.filter((c) => c.fase !== "grupo");
  ok("árvore de 8 classificados", arvore.filter((c) => c.fase === "quartas").length === 4);
  ok("árvore nasce vazia", arvore.every((c) => !c.mandanteId && !c.visitanteId));
  /**
   * A serpentina é 1,2,3,4 · 8,7,6,5 · 9,10,11,12 · 16,15,14,13.
   * Ou seja: 1 e 8 caem JUNTOS de propósito — é assim que a soma das sementes
   * fica igual em todo grupo (1+8 = 2+7 = 3+6 = 4+5 = 9). O que a serpentina
   * separa são as sementes VIZINHAS: 1 e 2 nunca dividem grupo.
   */
  const grupoDe = (id: string) =>
    [...grupos.entries()].find(([, v]) => v.some((t) => t.id === id))![0];
  ok("serpentina separa as sementes vizinhas (1 e 2)", grupoDe("t1") !== grupoDe("t2"));
  ok("serpentina junta 1 e 8 (soma equilibrada)", grupoDe("t1") === grupoDe("t8"));
  const somas = [...grupos.values()].map((g) =>
    g.reduce((s, t) => s + Number(t.id.slice(1)), 0)
  );
  ok("todos os grupos com a mesma soma de sementes", new Set(somas).size === 1, somas.join(","));
}

console.log(falhas === 0 ? "\n✅ TODAS PASSARAM\n" : `\n❌ ${falhas} FALHA(S)\n`);
process.exit(falhas === 0 ? 0 : 1);
