/**
 * PROVA DA POULE — a aposta mutua, e a conta do modelo com dinheiro real.
 *
 *     node node_modules/tsx/dist/cli.mjs scripts/game/_teste/poule.ts
 *
 * Puro: nao toca banco, nao vai a rede. O que ele protege:
 *
 *  - **o bolo fecha.** O que entra tem de sair: pagamento + comissao + devolucao
 *    = total apostado, sempre. Um centavo de ficha criado do nada e dinheiro
 *    inventado, e num sistema de apostas isso e o defeito que arruina tudo;
 *  - **ninguem sai com menos do que pos tendo acertado.** O piso de 1,00 sai da
 *    comissao, nao do vizinho;
 *  - **ninguem acertou = devolve tudo**, comissao inclusive;
 *  - **a devolucao NUNCA sai do bolo dos vencedores** — sai da comissao, e para
 *    quando a comissao acaba;
 *  - **a projecao bate com o pagamento**: o numero que a tela mostra antes e o
 *    que a pessoa recebe depois, se nada mais entrar. Preco que descreve outro
 *    pagamento e o mesmo defeito que ja custou caro no motor de quota fixa.
 */

import {
  projetar,
  liquidarPoule,
  contaComDinheiroReal,
  COMISSAO_PADRAO,
  type Cupom,
} from "../../../src/lib/game/poule";

let falhas = 0;
const ok = (n: string, c: boolean, d = "") => { console.log(`${c ? "  OK " : "FALHA"}  ${n}${d ? " — " + d : ""}`); if (!c) falhas++; };
const perto = (a: number, b: number, tol = 0.05) => Math.abs(a - b) <= tol;

function main() {
  console.log("\n1. O BOLO FECHA\n");

  const cupons: Cupom[] = [
    { id: "a", selecao: "casa", valor: 100 },
    { id: "b", selecao: "casa", valor: 300 },
    { id: "c", selecao: "fora", valor: 400 },
    { id: "d", selecao: "empate", valor: 200 },
  ];

  const r = liquidarPoule(cupons, "casa", 0.1, 0);
  const pago = r.pagamentos.reduce((s, p) => s + p.retorno, 0);
  ok("total apostado = 1000", r.total === 1000, String(r.total));
  ok(
    "pagamento + comissao + devolucao = total",
    perto(pago + r.comissaoLiquida + r.devolvido + r.custoDoPiso * 0, 1000),
    `${pago} + ${r.comissaoLiquida} + ${r.devolvido} = ${pago + r.comissaoLiquida + r.devolvido}`
  );
  ok("quem acertou recebeu 2,25x", perto(r.pagouPorFicha, 2.25), String(r.pagouPorFicha));
  ok("quem errou recebeu zero sem devolucao", r.pagamentos.filter((p) => !p.acertou).every((p) => p.retorno === 0));

  console.log("\n2. A PROJECAO BATE COM O PAGAMENTO\n");

  const proj = projetar(
    [
      { chave: "casa", rotulo: "Casa", bolo: 400 },
      { chave: "fora", rotulo: "Fora", bolo: 400 },
      { chave: "empate", rotulo: "Empate", bolo: 200 },
    ],
    0.1
  );
  const casa = proj.find((p) => p.chave === "casa")!;
  ok("a projecao da casa e 2,25", perto(casa.pagaria, 2.25), String(casa.pagaria));
  ok("e e exatamente o que a liquidacao pagou", perto(casa.pagaria, r.pagouPorFicha));
  ok("a fatia da casa e 40%", perto(casa.fatia, 0.4, 0.001), String(casa.fatia));

  console.log("\n3. AS TRES DEGENERACOES\n");

  const ninguem = liquidarPoule(cupons, "ninguem-apostou-nisso", 0.1, 0.2);
  ok("ninguem acertou: anulada", ninguem.anulada === true);
  ok("e devolve TUDO, comissao inclusive", perto(ninguem.pagamentos.reduce((s, p) => s + p.retorno, 0), 1000));
  ok("a casa nao fica com nada", ninguem.comissaoLiquida === 0, String(ninguem.comissaoLiquida));

  const sozinho = liquidarPoule(
    [
      { id: "a", selecao: "casa", valor: 10 },
      { id: "b", selecao: "fora", valor: 990 },
    ],
    "casa",
    0.1,
    0
  );
  ok("um sozinho no vencedor leva o bolo", perto(sozinho.pagouPorFicha, 90), String(sozinho.pagouPorFicha));

  const todosJuntos = liquidarPoule(
    [
      { id: "a", selecao: "casa", valor: 500 },
      { id: "b", selecao: "casa", valor: 500 },
    ],
    "casa",
    0.1,
    0
  );
  ok("todo mundo no mesmo lado: piso de 1,00", perto(todosJuntos.pagouPorFicha, 1), String(todosJuntos.pagouPorFicha));
  ok("ninguem sai com menos do que pos", perto(todosJuntos.pagamentos.reduce((s, p) => s + p.retorno, 0), 1000));
  ok("e o piso saiu da comissao, nao do vizinho", perto(todosJuntos.custoDoPiso, 100), String(todosJuntos.custoDoPiso));
  ok("a casa ficou com zero nesse caso", perto(todosJuntos.comissaoLiquida, 0), String(todosJuntos.comissaoLiquida));

  console.log("\n4. O FUNDO DE DEVOLUCAO NAO TIRA DE QUEM ACERTOU\n");

  const semDev = liquidarPoule(cupons, "casa", 0.1, 0);
  const comDev = liquidarPoule(cupons, "casa", 0.1, 0.2);
  ok(
    "com devolucao, quem acertou recebe O MESMO",
    perto(semDev.pagouPorFicha, comDev.pagouPorFicha),
    `${semDev.pagouPorFicha} vs ${comDev.pagouPorFicha}`
  );
  ok("quem perdeu recebeu algo de volta", comDev.devolvido > 0, `${comDev.devolvido} fichas`);
  ok("e saiu da comissao", perto(comDev.comissaoLiquida, 100 - comDev.devolvido), String(comDev.comissaoLiquida));
  ok(
    "o bolo continua fechando com devolucao",
    perto(comDev.pagamentos.reduce((s, p) => s + p.retorno, 0) + comDev.comissaoLiquida + 0, 1000),
    String(comDev.pagamentos.reduce((s, p) => s + p.retorno, 0) + comDev.comissaoLiquida)
  );

  // A devolucao pedida (20% de 600 = 120) e MAIOR que a comissao (100).
  // Tem de parar na comissao, nunca invadir o bolo dos vencedores.
  ok("devolucao pedida maior que a comissao para na comissao", comDev.devolvido <= 100, `${comDev.devolvido} <= 100`);

  console.log("\n5. A CONTA COM DINHEIRO DE VERDADE\n");

  const conta = contaComDinheiroReal({
    movimento: 1_000_000,
    comissao: COMISSAO_PADRAO,
    impostoGGR: 0.12,
    outorga: 30_000_000 / 5, // por ano
    custoOperacional: 1_200_000,
    devolucao: 0.2,
    fatiaPerdedora: 0.6,
  });
  console.log(`   movimento de R$ 1.000.000 num ano, comissao de 10%:`);
  console.log(`      receita bruta      R$ ${conta.receitaBruta.toLocaleString("pt-BR")}`);
  console.log(`      imposto (12% GGR)  R$ ${conta.imposto.toLocaleString("pt-BR")}`);
  console.log(`      custo da devolucao R$ ${conta.custoDaDevolucao.toLocaleString("pt-BR")}`);
  console.log(`      SOBRA              R$ ${conta.sobra.toLocaleString("pt-BR")}`);
  console.log(`\n   movimento so para pagar a outorga: R$ ${conta.movimentoParaPagarOutorga.toLocaleString("pt-BR")}`);

  ok("com R$ 1 milhao de movimento, o modelo da prejuizo", conta.sobra < 0, `R$ ${conta.sobra.toLocaleString("pt-BR")}`);
  ok(
    "so a outorga exige R$ 68 milhoes de movimento POR ANO",
    perto(conta.movimentoParaPagarOutorga, 68_181_818, 1000),
    `R$ ${conta.movimentoParaPagarOutorga.toLocaleString("pt-BR")}/ano · R$ ${(conta.movimentoParaPagarOutorga * 5).toLocaleString("pt-BR")} nos 5 anos`
  );

  // O NUMERO QUE MATA O MODELO COM DINHEIRO REAL, e por isso e um assert e nao
  // uma frase: devolver 20% das perdas custa MAIS do que a comissao inteira
  // arrecada. Nao e "aperta o cinto" — e a conta nao fechar por construcao.
  ok(
    "a devolucao de 20% custa MAIS que a comissao bruta inteira",
    conta.custoDaDevolucao > conta.receitaBruta,
    `devolucao R$ ${conta.custoDaDevolucao.toLocaleString("pt-BR")} > comissao R$ ${conta.receitaBruta.toLocaleString("pt-BR")}`
  );

  console.log(falhas === 0 ? "\n✅ a poule fecha a conta e nao inventa ficha\n" : `\n⛔ ${falhas} FALHA(S)\n`);
  process.exit(falhas === 0 ? 0 : 1);
}

main();
