/**
 * PROVA DO "APOSTAR EM MIM" — o filtro do saguao por gamertag.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/_teste/saguao-jogador.ts
 *
 * Roda o handler de verdade em processo, contra o banco de verdade. O que ele
 * protege:
 *
 *  - o filtro so devolve partida em que a pessoa esta ESCALADA. Devolver a mais
 *    seria mandar alguem apostar "em si mesmo" num jogo que nao e dele;
 *  - maiuscula nao muda o resultado. A EA guarda a gamertag como o jogador
 *    digitou, e quem chega pela ficha traz o que estava na URL;
 *  - gamertag que nao joga hoje devolve LISTA VAZIA junto com o total de
 *    partidas abertas. Sem esse numero, vazio le como "a casa esta fechada";
 *  - **caractere de expressao regular e escapado**. Sem isso, `.*` casaria com
 *    todo mundo e a pessoa veria a rodada inteira como se fosse dela.
 *
 * Nao cria nem apaga nada: le o que a rodada ja pos no ar.
 */

import mongoose from "mongoose";
import dbConnect from "../../../src/lib/mongodb";
import GameEvento from "../../../src/models/GameEvento";

let falhas = 0;
const ok = (n: string, c: boolean, d = "") => { console.log(`${c ? "  OK " : "FALHA"}  ${n}${d ? " — " + d : ""}`); if (!c) falhas++; };

interface EventoNaResposta { mandante: { nome: string }; visitante: { nome: string } }

async function main() {
  await dbConnect();
  const { GET } = await import("../../../src/app/api/game/apostas/route");
  const chamar = async (q = "") => {
    const r = await GET(new Request(`http://x/api/game/apostas${q}`));
    return (await r.json()) as {
      eventos: EventoNaResposta[];
      filtro: { jogador: string; abertosNoTotal: number } | null;
    };
  };

  const todos = await chamar();
  ok("sem filtro, o saguao nao declara filtro", todos.filtro === null, `${todos.eventos.length} evento(s)`);

  const ev = (await GameEvento.findOne({ status: "aberto", comecaEm: { $gt: new Date() } }).lean()) as
    | { mandante: { nome: string; elenco: Array<{ gamertag: string }> } }
    | null;
  if (!ev?.mandante.elenco?.length) {
    console.log("\n⚠️  nenhum evento aberto com elenco agora — rode depois da proxima rodada\n");
    await mongoose.disconnect();
    process.exit(0);
  }
  const tag = ev.mandante.elenco[0].gamertag;
  const clube = ev.mandante.nome;

  const dele = await chamar(`?jogador=${encodeURIComponent(tag)}`);
  ok(`"${tag}" aparece em alguma partida`, dele.eventos.length > 0, `${dele.eventos.length} evento(s)`);
  ok(
    "e TODA partida devolvida tem o clube dele",
    dele.eventos.every((e) => [e.mandante.nome, e.visitante.nome].includes(clube))
  );
  ok("o total sem filtro vem junto", dele.filtro?.abertosNoTotal === todos.eventos.length, String(dele.filtro?.abertosNoTotal));

  const maiusc = await chamar(`?jogador=${encodeURIComponent(tag.toUpperCase())}`);
  ok("maiuscula da o mesmo resultado", maiusc.eventos.length === dele.eventos.length, `${maiusc.eventos.length} vs ${dele.eventos.length}`);

  const ninguem = await chamar("?jogador=NaoExisteEsseCara9999");
  ok("gamertag inexistente devolve vazio", ninguem.eventos.length === 0);
  ok(
    "e ainda assim diz quantas partidas ha",
    (ninguem.filtro?.abertosNoTotal ?? 0) === todos.eventos.length,
    String(ninguem.filtro?.abertosNoTotal)
  );

  const curinga = await chamar(`?jogador=${encodeURIComponent(".*")}`);
  ok("caractere de regex e escapado (`.*` nao vira curinga)", curinga.eventos.length === 0, `${curinga.eventos.length} evento(s)`);

  console.log(falhas === 0 ? "\n✅ o saguao filtra por jogador sem inventar partida\n" : `\n⛔ ${falhas} FALHA(S)\n`);
  await mongoose.disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
