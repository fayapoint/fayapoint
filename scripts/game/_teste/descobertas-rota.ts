/**
 * PROVA DA FILA DE DESCOBERTAS — a rota real, com a guarda real.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/_teste/descobertas-rota.ts
 *
 * Executa os handlers de verdade em processo, sem subir servidor. A guarda NAO
 * e substituida: o teste define o segredo de servico e manda o cabecalho, para
 * exercitar a autorizacao que vai rodar em producao e nao uma versao dela.
 *
 * O que ele protege, e por que cada um importa:
 *
 *  - descartar EXIGE motivo. Descarte sem motivo e a forma mais rapida de
 *    ninguem entender, seis meses depois, por que aquele torneio nunca foi
 *    coberto.
 *  - promover EXIGE o slug da copa. Sem ele, o candidato sai da fila sem
 *    ninguem saber para onde foi.
 *  - sem autorizacao, 401. Um candidato e SUSPEITA nossa sobre clubes de
 *    pessoas reais; a fila nao e publica.
 *
 * Limpa o que cria.
 */

import mongoose from "mongoose";
import dbConnect from "../../../src/lib/mongodb";
import GameDescoberta from "../../../src/models/GameDescoberta";


/**
 * Em vez de substituir a guarda, DEFINE o segredo e manda o cabecalho.
 * Assim o teste exercita a autorizacao de verdade, e nao uma versao dela.
 * (Namespace de modulo ESM e congelado — nao da para reatribuir mesmo.)
 */
const SEGREDO = "segredo-de-teste-" + Date.now();
process.env.SOCIAL_CRON_SECRET = SEGREDO;

let falhas = 0;
const ok = (n: string, c: boolean, d = "") => { console.log(`${c ? "  OK " : "FALHA"}  ${n}${d ? " — " + d : ""}`); if (!c) falhas++; };

async function main() {
  await dbConnect();
  const { GET, PATCH } = await import("../../../src/app/api/game/descobertas/route");
  const req = (corpo?: unknown) =>
    new Request("http://x/api/game/descobertas", corpo
      ? { method: "PATCH", headers: { "content-type": "application/json", "x-social-secret": SEGREDO }, body: JSON.stringify(corpo) }
      : { headers: { "x-social-secret": SEGREDO } });

  // semeia um candidato
  const chave = "teste-rota-" + Date.now();
  await GameDescoberta.create({ chave, apelido: "torneio de teste", clubes: [{clubId:"a",nome:"A",jogos:1}], forca: 70, estado: "novo" });

  const g = await GET(req());
  const corpo = await g.json();
  ok("GET devolve a fila", g.status === 200 && Array.isArray(corpo.candidatos), `${corpo.candidatos?.length} candidato(s)`);
  ok("GET avisa que o apelido e palpite", typeof corpo.aviso === "string" && corpo.aviso.includes("palpite"));

  const semMotivo = await PATCH(req({ chave, estado: "descartado" }));
  ok("descartar SEM motivo e recusado", semMotivo.status === 400, String(semMotivo.status));

  const semSlug = await PATCH(req({ chave, estado: "promovido" }));
  ok("promover SEM slug e recusado", semSlug.status === 400, String(semSlug.status));

  const estadoInvalido = await PATCH(req({ chave, estado: "inventado" }));
  ok("estado invalido e recusado", estadoInvalido.status === 400, String(estadoInvalido.status));

  const comMotivo = await PATCH(req({ chave, estado: "descartado", motivo: "grupo de amigos, nao torneio" }));
  ok("descartar COM motivo passa", comMotivo.status === 200, String(comMotivo.status));

  const doc = await GameDescoberta.findOne({ chave });
  ok("o motivo e a data ficaram gravados", doc?.estado === "descartado" && !!doc?.motivo && !!doc?.decididoEm, doc?.motivo ?? "");

  const inexistente = await PATCH(req({ chave: "nao-existe", estado: "investigando" }));
  ok("candidato inexistente devolve 404", inexistente.status === 404, String(inexistente.status));

  const semAuth = await GET(new Request("http://x/api/game/descobertas"));
  ok("sem autorizacao devolve 401", semAuth.status === 401, String(semAuth.status));

  await GameDescoberta.deleteOne({ chave });
  console.log(falhas === 0 ? "\n✅ a fila de descobertas se defende\n" : `\n⛔ ${falhas} FALHA(S)\n`);
  await mongoose.disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
