/**
 * PROVA DE PONTA A PONTA DA MESA — banco de verdade, ficha de verdade.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/_teste/mesa.ts
 *
 * Diferente de `apostas.ts`, que prova a matemática sem tocar em nada, este
 * roda contra o Mongo: cria carteira, monta rodada, aposta, liquida e confere
 * que o saldo bateu. Ao final APAGA tudo que criou — inclusive a carteira de
 * teste — para não deixar lixo no banco de produção.
 *
 * Prova as três coisas que a matemática pura não alcança:
 *  - o débito não deixa saldo negativo, e a chave duplicada desfaz o saldo;
 *  - o pagamento em duplicidade é recusado pelo índice único;
 *  - a semente revelada bate com o compromisso publicado antes das apostas.
 */
import mongoose from "mongoose";
import dbConnect from "../../../src/lib/mongodb";
import GameCarteira from "../../../src/models/GameCarteira";
import GameLancamento from "../../../src/models/GameLancamento";
import GameEvento from "../../../src/models/GameEvento";
import GameMercadoAposta from "../../../src/models/GameMercadoAposta";
import GameAposta from "../../../src/models/GameAposta";
import {
  garantirCarteira,
  aplicarLancamento,
  BONUS_BOAS_VINDAS,
} from "../../../src/lib/game/carteira";
import {
  registrarAposta,
  rodarEvento,
  hash,
  derivarSemente,
} from "../../../src/lib/game/apostas-servidor";
import { montarRodada } from "../../../src/lib/game/rodada";

let falhas = 0;
function ok(nome: string, cond: boolean, detalhe = "") {
  console.log(`${cond ? "  OK " : "FALHA"}  ${nome}${detalhe ? " — " + detalhe : ""}`);
  if (!cond) falhas++;
}

const usuarioDeTeste = new mongoose.Types.ObjectId();
const criados: mongoose.Types.ObjectId[] = [];

async function main() {
  await dbConnect();
  console.log("\nusuário de teste: " + usuarioDeTeste + "\n");

  /* ---- §1 carteira e bônus ---------------------------------------- */
  console.log("§1 — carteira e bônus de entrada");
  const c1 = await garantirCarteira(String(usuarioDeTeste));
  ok("a carteira nasce com o bônus", c1.saldo === BONUS_BOAS_VINDAS, c1.saldo + " fichas");
  const c2 = await garantirCarteira(String(usuarioDeTeste));
  ok("chamar de novo NÃO dá bônus outra vez", c2.saldo === BONUS_BOAS_VINDAS, c2.saldo + " fichas");

  try {
    await aplicarLancamento({
      userId: String(usuarioDeTeste),
      tipo: "bonus-boas-vindas",
      valor: 100,
      descricao: "tentativa de bônus repetido",
      chaveUnica: "boas-vindas:" + usuarioDeTeste,
    });
    ok("chave duplicada é recusada", false, "passou, e não devia");
  } catch {
    const c = await GameCarteira.findOne({ userId: usuarioDeTeste });
    ok(
      "chave duplicada é recusada E o saldo é desfeito",
      c!.saldo === BONUS_BOAS_VINDAS,
      String(c!.saldo)
    );
  }

  try {
    await aplicarLancamento({
      userId: String(usuarioDeTeste),
      tipo: "aposta",
      valor: -5000,
      descricao: "saque impossível",
    });
    ok("débito acima do saldo é recusado", false, "passou, e não devia");
  } catch {
    const c = await GameCarteira.findOne({ userId: usuarioDeTeste });
    ok("débito acima do saldo é recusado", c!.saldo === BONUS_BOAS_VINDAS, String(c!.saldo));
  }

  /* ---- §2 rodada -------------------------------------------------- */
  console.log("\n§2 — a rodada");
  const rodada = await montarRodada({ quantidade: 2, minutosAteAPrimeira: 1 });
  ok("montou partidas", rodada.length >= 1, rodada.map((r) => r.confronto).join(" | "));
  if (rodada.length === 0) {
    console.log("  (sem clubes suficientes no espelho — o resto do teste não roda)");
    return;
  }

  const evento = await GameEvento.findOne({ slug: rodada[0].slug });
  criados.push(evento!._id as mongoose.Types.ObjectId);
  for (const r of rodada.slice(1)) {
    const e = await GameEvento.findOne({ slug: r.slug });
    if (e) criados.push(e._id as mongoose.Types.ObjectId);
  }

  ok("o compromisso é o hash da semente", hash(evento!.sementeServidor) === evento!.compromisso);

  const mercados = await GameMercadoAposta.find({ eventoId: evento!._id }).sort({ ordem: 1 });
  ok("o cardápio foi ao ar", mercados.length >= 8, mercados.length + " mercados");
  const m1x2 = mercados.find((m) => m.chave === "1x2")!;
  console.log(
    "  1X2: " + m1x2.selecoes.map((s) => s.rotulo + " " + s.odd.toFixed(2)).join("  ·  ")
  );

  /* ---- §3 cupom --------------------------------------------------- */
  console.log("\n§3 — o cupom");
  const antes = (await GameCarteira.findOne({ userId: usuarioDeTeste }))!.saldo;
  const aposta = await registrarAposta(String(usuarioDeTeste), {
    selecoes: [{ mercadoId: String(m1x2._id), selecaoChave: "1" }],
    valor: 20,
  });
  const depois = (await GameCarteira.findOne({ userId: usuarioDeTeste }))!.saldo;
  ok("a ficha saiu na hora", depois === antes - 20, antes + " → " + depois);
  ok("o retorno potencial confere", aposta.retornoPotencial === Math.floor(20 * aposta.oddTotal));

  const outro = mercados.find((m) => m.chave === "ambos-marcam")!;
  try {
    await registrarAposta(String(usuarioDeTeste), {
      selecoes: [
        { mercadoId: String(m1x2._id), selecaoChave: "1" },
        { mercadoId: String(outro._id), selecaoChave: "sim" },
      ],
      valor: 5,
    });
    ok("múltipla da mesma partida é recusada", false, "passou, e não devia");
  } catch (e) {
    ok("múltipla da mesma partida é recusada", true, (e as Error).message);
  }

  /* ---- §4 liquidação ---------------------------------------------- */
  console.log("\n§4 — revelar, jogar e pagar");
  const r = await rodarEvento(String(evento!._id));
  ok("o evento rodou", !r.jaRodou, r.golsMandante + " × " + r.golsVisitante + ", " + r.cupons + " cupom(ns)");

  const eventoDepois = await GameEvento.findById(evento!._id);
  ok(
    "a semente revelada bate com o compromisso",
    hash(eventoDepois!.sementeServidor) === eventoDepois!.compromisso
  );
  ok(
    "a semente final é a fórmula publicada",
    eventoDepois!.sementeFinal ===
      derivarSemente(eventoDepois!.sementeServidor, eventoDepois!.salPublico!),
    String(eventoDepois!.sementeFinal)
  );

  const cupom = await GameAposta.findById(aposta.apostaId);
  ok("o cupom saiu de pendente", cupom!.status !== "pendente", cupom!.status);
  const venceuMandante = r.golsMandante! > r.golsVisitante!;
  ok(
    "o veredito corresponde ao placar",
    venceuMandante ? cupom!.status === "ganha" : cupom!.status === "perdida",
    "mandante " + (venceuMandante ? "venceu" : "não venceu") + " → " + cupom!.status
  );
  const saldoFinal = (await GameCarteira.findOne({ userId: usuarioDeTeste }))!.saldo;
  ok(
    "o saldo reflete o resultado",
    saldoFinal === depois + cupom!.retorno,
    depois + " + " + cupom!.retorno + " = " + saldoFinal
  );

  const r2 = await rodarEvento(String(evento!._id));
  const saldoDepoisDeDuas = (await GameCarteira.findOne({ userId: usuarioDeTeste }))!.saldo;
  ok("rodar de novo não faz nada", r2.jaRodou === true);
  ok("e não paga de novo", saldoDepoisDeDuas === saldoFinal, String(saldoDepoisDeDuas));

  /* ---- §5 extrato ------------------------------------------------- */
  console.log("\n§5 — o extrato fecha com o saldo");
  const extrato = await GameLancamento.find({ userId: usuarioDeTeste }).sort({ createdAt: 1 });
  const soma = extrato.reduce((s, l) => s + l.valor, 0);
  ok("a soma do extrato é o saldo", soma === saldoFinal, soma + " vs " + saldoFinal);
  for (const l of extrato) {
    console.log(
      "     " + (l.valor > 0 ? "+" : "") + l.valor + "  " + l.tipo.padEnd(18) + " saldo " + l.saldoDepois
    );
  }
}

main()
  .catch((e) => {
    console.error("ERRO:", e);
    falhas++;
  })
  .finally(async () => {
    // Limpeza. O banco é o de produção: teste que deixa rastro vira número
    // falso no painel de amanhã. Apaga só o que ESTE teste criou, por id.
    await GameAposta.deleteMany({ userId: usuarioDeTeste });
    await GameLancamento.deleteMany({ userId: usuarioDeTeste });
    await GameCarteira.deleteMany({ userId: usuarioDeTeste });
    await GameMercadoAposta.deleteMany({ eventoId: { $in: criados } });
    await GameEvento.deleteMany({ _id: { $in: criados } });
    console.log("\n(limpeza: " + criados.length + " evento(s) de teste removido(s))");
    console.log(falhas === 0 ? "\n✅ a mesa funciona de ponta a ponta\n" : "\n⛔ " + falhas + " FALHA(S)\n");
    await mongoose.disconnect();
    process.exit(falhas === 0 ? 0 : 1);
  });
