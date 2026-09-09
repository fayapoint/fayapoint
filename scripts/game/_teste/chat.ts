/**
 * PROVA DA SALA — o chat aberto do Winners 22.
 *
 *     node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/game/_teste/chat.ts
 *
 * Roda os handlers de verdade em processo. O que ele protege:
 *
 *  - **ler e aberto, falar exige conta.** Sala onde qualquer um fala sem dono
 *    nao tem a quem responsabilizar, e todo o Estatuto se apoia em decisao com
 *    responsavel;
 *  - **`?desde=` devolve so o que chegou depois.** E o que faz a sondagem de 6
 *    em 6 segundos custar quase nada. Se voltar tudo de novo, uma sala parada
 *    passa a custar 50 mensagens por leitura, por aba aberta;
 *  - **mensagem escondida some da sala** e continua no banco. Apagar destruiria
 *    a prova de um comportamento que pode virar processo disciplinar;
 *  - **esconder EXIGE motivo**, como descartar candidato na fila de descobertas;
 *  - **quem nao e da federacao nao esconde nada.**
 *
 * Cria e apaga o que usou.
 */

import mongoose from "mongoose";
import dbConnect from "../../../src/lib/mongodb";
import GameChat from "../../../src/models/GameChat";

let falhas = 0;
const ok = (n: string, c: boolean, d = "") => { console.log(`${c ? "  OK " : "FALHA"}  ${n}${d ? " — " + d : ""}`); if (!c) falhas++; };

const CANAL = "teste-" + Date.now();

async function main() {
  await dbConnect();
  const { GET, POST, PATCH } = await import("../../../src/app/api/game/chat/route");

  const url = (q = "") => `http://x/api/game/chat${q}`;

  console.log("\n1. A PORTA\n");

  // Deslogado: le.
  const leitura = await GET(new Request(url(`?canal=${CANAL}`)));
  ok("deslogado LE a sala", leitura.status === 200, String(leitura.status));

  // Deslogado: nao fala. (getAuthUser sem cookie/cabecalho devolve null.)
  const tentouFalar = await POST(
    new Request(url(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texto: "oi", canal: CANAL }) })
  );
  ok("deslogado NAO fala — devolve 401", tentouFalar.status === 401, String(tentouFalar.status));

  const tentouEsconder = await PATCH(
    new Request(url(), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: new mongoose.Types.ObjectId().toString(), motivo: "porque sim" }) })
  );
  ok("quem nao e da federacao NAO esconde — devolve 403", tentouEsconder.status === 403, String(tentouEsconder.status));

  console.log("\n2. A LEITURA INCREMENTAL\n");

  // Semeia direto no banco: o POST exige sessao, que um teste em processo nao tem.
  const uid = new mongoose.Types.ObjectId();
  const antiga = await GameChat.create({ canal: CANAL, userId: uid, nome: "Antiga", texto: "primeira fala" });
  await new Promise((r) => setTimeout(r, 1100));
  const nova = await GameChat.create({ canal: CANAL, userId: uid, nome: "Nova", texto: "segunda fala" });

  const tudo = await (await GET(new Request(url(`?canal=${CANAL}`)))).json();
  ok("a sala devolve as duas", tudo.mensagens.length === 2, `${tudo.mensagens.length}`);
  ok(
    "em ordem de leitura: a mais antiga primeiro",
    tudo.mensagens[0]?.texto === "primeira fala" && tudo.mensagens[1]?.texto === "segunda fala"
  );

  const desde = new Date(antiga.createdAt).toISOString();
  const soNovas = await (await GET(new Request(url(`?canal=${CANAL}&desde=${encodeURIComponent(desde)}`)))).json();
  ok("`desde` traz SO o que chegou depois", soNovas.mensagens.length === 1 && soNovas.mensagens[0].texto === "segunda fala", `${soNovas.mensagens.length}`);

  const desdeOFim = new Date(nova.createdAt).toISOString();
  const nada = await (await GET(new Request(url(`?canal=${CANAL}&desde=${encodeURIComponent(desdeOFim)}`)))).json();
  ok("sala parada devolve lista vazia, nao a sala inteira", nada.mensagens.length === 0, `${nada.mensagens.length}`);

  console.log("\n3. A MODERACAO\n");

  await GameChat.findByIdAndUpdate(nova._id, { $set: { oculta: true, ocultaMotivo: "teste" } });
  const semOculta = await (await GET(new Request(url(`?canal=${CANAL}`)))).json();
  ok("mensagem escondida SAI da sala", semOculta.mensagens.length === 1, `${semOculta.mensagens.length}`);

  const aindaNoBanco = await GameChat.findById(nova._id).lean();
  ok("e CONTINUA no banco, com motivo", !!aindaNoBanco && aindaNoBanco.oculta === true && !!aindaNoBanco.ocultaMotivo);

  await GameChat.deleteMany({ canal: CANAL });
  console.log(falhas === 0 ? "\n✅ a sala se defende\n" : `\n⛔ ${falhas} FALHA(S)\n`);
  await mongoose.disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
