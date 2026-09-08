/**
 * O BATIMENTO DA MESA — liquida o que venceu e repõe o cardápio.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/mesa.ts
 *
 * Chamado pelo `coletar.cmd`, de hora em hora, logo depois do espelho. Não tem
 * agendamento próprio de propósito: a regra da casa é entrar num turno que já
 * existe em vez de criar mais um horário para alguém esquecer.
 *
 * ## Por que liquidar ANTES de repor
 *
 * Se a reposição viesse primeiro e a liquidação quebrasse, o saguão continuaria
 * bonito e cheio enquanto ninguém receberia prêmio — a falha silenciosa, que é
 * a pior. Na ordem certa, uma liquidação quebrada trava a reposição, o saguão
 * seca, e alguém pergunta "cadê as partidas?" no mesmo dia.
 *
 * ## O log
 *
 * Escreve o que fez, sempre, inclusive quando não fez nada. Cron que só fala
 * quando dá errado é indistinguível de cron morto — foi assim que a auditoria
 * de curso ficou 17 dias parada sem ninguém notar.
 */
import mongoose from "mongoose";
import dbConnect from "../../src/lib/mongodb";
import GameEvento from "../../src/models/GameEvento";
import { rodarEventosVencidos } from "../../src/lib/game/apostas-servidor";
import { montarRodada } from "../../src/lib/game/rodada";

/** Abaixo disto, repõe. Oito partidas por rodada, espaçadas de 30 em 30 min. */
const MINIMO_NO_SAGUAO = 6;
const ALVO_NO_SAGUAO = 12;

async function main() {
  await dbConnect();
  console.log("\nMESA DE APOSTAS");

  const liquidados = await rodarEventosVencidos(30);
  if (liquidados.length === 0) {
    console.log("   nada vencido para liquidar");
  } else {
    for (const l of liquidados) {
      console.log(`   ✓ ${l.slug} — ${l.placar} (${l.cupons} cupom(ns))`);
    }
  }

  const abertos = await GameEvento.countDocuments({
    status: "aberto",
    comecaEm: { $gt: new Date() },
  });

  let novos: Array<{ confronto: string }> = [];
  if (abertos < MINIMO_NO_SAGUAO) {
    novos = await montarRodada({ quantidade: ALVO_NO_SAGUAO - abertos });
    for (const n of novos) console.log(`   + ${n.confronto}`);
  }

  console.log(
    `Resumo — liquidados: ${liquidados.length} · abertos: ${abertos} · novos: ${novos.length}`
  );

  // Sinal de vida para o painel: um evento aberto com hora futura é a prova de
  // que este batimento rodou. Zero aqui, com zero novos, é sintoma.
  if (abertos + novos.length === 0) {
    console.log("   ⚠️ saguão vazio e nada criado — o espelho tem clubes suficientes?");
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(`⛔ mesa: ${e instanceof Error ? e.message : e}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
