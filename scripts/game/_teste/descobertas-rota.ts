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
 *  - LER pode ser de servico; DECIDIR, nao. O segredo existe para o coletor
 *    conferir a fila. Aceita-lo tambem no PATCH gravava decisao com
 *    `decididoPor` vazio, contradizendo a regra que a propria rota escreve:
 *    a decisao e humana e fica com quem decidiu. (Achado pelo Codex, 08/09.)
 *  - sem autorizacao nenhuma, 401. Um candidato e SUSPEITA nossa sobre clubes
 *    de pessoas reais; a fila nao e publica.
 *  - descartar EXIGE motivo, promover EXIGE copa. Essas duas regras agora vivem
 *    em `validarDecisao`, fora da rota, e sao testadas direto — porque atras da
 *    porta de administrador um teste em processo nao consegue chegar nelas, e a
 *    unica forma antiga de exercita-las era justamente pelo segredo de servico
 *    que a rota deixou de aceitar.
 *
 * Limpa o que cria.
 */

import mongoose from "mongoose";
import dbConnect from "../../../src/lib/mongodb";
import GameDescoberta from "../../../src/models/GameDescoberta";
import { validarDecisao } from "../../../src/lib/game/descoberta";

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
  const comSegredo = (corpo?: unknown) =>
    new Request("http://x/api/game/descobertas", corpo
      ? { method: "PATCH", headers: { "content-type": "application/json", "x-social-secret": SEGREDO }, body: JSON.stringify(corpo) }
      : { headers: { "x-social-secret": SEGREDO } });

  const chave = "teste-rota-" + Date.now();
  await GameDescoberta.create({ chave, apelido: "torneio de teste", clubes: [{ clubId: "a", nome: "A", jogos: 1 }], forca: 70, estado: "novo" });

  console.log("\n1. A PORTA\n");

  const g = await GET(comSegredo());
  const corpo = await g.json();
  ok("servico LE a fila", g.status === 200 && Array.isArray(corpo.candidatos), `${corpo.candidatos?.length} candidato(s)`);
  ok("GET avisa que o apelido e palpite", typeof corpo.aviso === "string" && corpo.aviso.includes("palpite"));

  const semAuth = await GET(new Request("http://x/api/game/descobertas"));
  ok("sem autorizacao nenhuma, GET devolve 401", semAuth.status === 401, String(semAuth.status));

  // O ponto do dia: o mesmo segredo que le NAO decide.
  const decisaoDeServico = await PATCH(comSegredo({ chave, estado: "descartado", motivo: "um cron nao decide isto" }));
  ok("servico NAO decide — PATCH com segredo devolve 401", decisaoDeServico.status === 401, String(decisaoDeServico.status));

  const aindaNovo = await GameDescoberta.findOne({ chave });
  ok("e nada foi gravado por ele", aindaNovo?.estado === "novo", aindaNovo?.estado ?? "sumiu");

  console.log("\n2. A REGRA DA DECISAO\n");

  ok("descartar SEM motivo e recusado", validarDecisao({ chave, estado: "descartado" }).ok === false);
  ok("descartar com motivo de 2 letras e recusado", validarDecisao({ chave, estado: "descartado", motivo: "ok" }).ok === false);
  ok("promover SEM copa e recusado", validarDecisao({ chave, estado: "promovido" }).ok === false);
  ok("estado inventado e recusado", validarDecisao({ chave, estado: "inventado" }).ok === false);
  ok("sem chave e recusado", validarDecisao({ estado: "investigando" }).ok === false);

  const boa = validarDecisao({ chave, plataforma: "common-gen4", estado: "descartado", motivo: "grupo de amigos, nao torneio" });
  ok("descartar COM motivo passa", boa.ok === true);
  ok("a plataforma atravessa a validacao", boa.ok === true && boa.plataforma === "common-gen4", boa.ok ? boa.plataforma : "");

  const promo = validarDecisao({ chave, estado: "promovido", copaSlug: "  super-copa-dos-streamers  " });
  ok("o slug chega aparado", promo.ok === true && promo.copaSlug === "super-copa-dos-streamers", promo.ok ? promo.copaSlug : "");

  await GameDescoberta.deleteOne({ chave });
  console.log(falhas === 0 ? "\n✅ a fila de descobertas se defende\n" : `\n⛔ ${falhas} FALHA(S)\n`);
  await mongoose.disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
